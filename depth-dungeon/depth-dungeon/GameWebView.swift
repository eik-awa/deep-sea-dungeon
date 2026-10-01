import SwiftUI
import WebKit
import StoreKit
import FirebaseAnalytics

class AppSchemeHandler: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url,
              let resourceURL = Bundle.main.resourceURL else {
            urlSchemeTask.didFailWithError(NSError(domain: "AppSchemeHandler", code: 404))
            return
        }

        let relativePath = url.path.hasPrefix("/") ? String(url.path.dropFirst()) : url.path

        // WebApp/ はフォルダ参照でバンドルされるため、まず WebApp/ 配下を探す。
        let candidates = [
            resourceURL.appendingPathComponent("WebApp").appendingPathComponent(relativePath),
            resourceURL.appendingPathComponent("WebApp/assets").appendingPathComponent(url.lastPathComponent),
            resourceURL.appendingPathComponent("WebApp").appendingPathComponent(url.lastPathComponent),
            resourceURL.appendingPathComponent(relativePath),
            resourceURL.appendingPathComponent(url.lastPathComponent),
        ]
        guard let fileURL = candidates.first(where: { FileManager.default.fileExists(atPath: $0.path) }) else {
            urlSchemeTask.didFailWithError(NSError(domain: "AppSchemeHandler", code: 404))
            return
        }

        guard let data = try? Data(contentsOf: fileURL) else {
            urlSchemeTask.didFailWithError(NSError(domain: "AppSchemeHandler", code: 404))
            return
        }

        let response = URLResponse(
            url: url,
            mimeType: mimeType(for: fileURL.pathExtension),
            expectedContentLength: data.count,
            textEncodingName: "utf-8"
        )
        urlSchemeTask.didReceive(response)
        urlSchemeTask.didReceive(data)
        urlSchemeTask.didFinish()
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}

    private func mimeType(for ext: String) -> String {
        switch ext.lowercased() {
        case "html": return "text/html"
        case "js", "mjs": return "application/javascript"
        case "css": return "text/css"
        case "woff": return "font/woff"
        case "woff2": return "font/woff2"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "webp": return "image/webp"
        case "gif": return "image/gif"
        case "svg": return "image/svg+xml"
        case "json": return "application/json"
        case "mp3": return "audio/mpeg"
        case "m4a": return "audio/mp4"
        case "wav": return "audio/wav"
        default: return "application/octet-stream"
        }
    }
}

// MARK: - JS→Swift ブリッジ

/// retain cycle を避けるため WKUserContentController には弱参照プロキシを登録する。
private final class WeakScriptMessageProxy: NSObject, WKScriptMessageHandler {
    weak var target: WKScriptMessageHandler?
    init(target: WKScriptMessageHandler) { self.target = target }
    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
        target?.userContentController(c, didReceive: m)
    }
}

final class GameBridge: NSObject, WKScriptMessageHandler {
    weak var webView: WKWebView?

    private let privacyPolicyURL = URL(string: "https://eik-awa.github.io/privacy_policy/")! 

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        switch message.name {
        case "sound":
            if let name = message.body as? String {
                Task { @MainActor in AudioManager.shared.playSE(name) }
            }

        case "bgm":
            let track: String?
            if let s = message.body as? String { track = s }
            else { track = (message.body as? [String: Any])?["track"] as? String }
            if let track {
                Task { @MainActor in AudioManager.shared.playTrack(track) }
            }

        case "rewardAd":
            guard let dict = message.body as? [String: Any],
                  (dict["action"] as? String) == "show" else { return }
            let context = (dict["context"] as? String) ?? "reward"
            InterstitialAdController.shared.noteRewardAdShown()
            RewardedAdController.shared.show { result in
                DispatchQueue.main.async { [weak self] in
                    let js = "window.__onRewardAdResult__ && window.__onRewardAdResult__('\(context)', '\(result.rawValue)')"
                    self?.webView?.evaluateJavaScript(js)
                }
            }

        case "interstitial":
            guard let dict = message.body as? [String: Any],
                  (dict["action"] as? String) == "show" else { return }
            let context = (dict["context"] as? String) ?? ""
            InterstitialAdController.shared.maybeShow(context: context) { ctx in
                DispatchQueue.main.async { [weak self] in
                    self?.webView?.evaluateJavaScript("window.__onInterstitialClosed__ && window.__onInterstitialClosed__('\(ctx)')")
                }
            }

        case "progress":
            guard let dict = message.body as? [String: Any],
                  let event = dict["event"] as? String else { return }
            var params: [String: Any] = [:]
            for (k, v) in dict where k != "event" { params[k] = v }
            Analytics.logEvent(event.replacingOccurrences(of: "-", with: "_"),
                               parameters: params.isEmpty ? nil : params)
            switch event {
            case "zone_clear": InterstitialAdController.shared.noteZoneCleared()
            case "party_wipe": InterstitialAdController.shared.notePartyWipe()
            default: break
            }

        case "settings":
            // ゲーム内「設定」画面からのBGM/効果音の音量取得・変更。実体は AudioManager.shared の
            // bgmVolume/seVolume(音量調整はゲーム内の設定画面に一本化している。かつて
            // ContentView に置いていた右下の音量フローティングボタンは、画面内の他のボタンと
            // 重なって押せなくなることがあったため廃止した)。
            guard let dict = message.body as? [String: Any],
                  let action = dict["action"] as? String else { return }
            switch action {
            case "getVolume":
                Task { @MainActor in
                    let bgm = AudioManager.shared.bgmVolume
                    let se = AudioManager.shared.seVolume
                    DispatchQueue.main.async { [weak self] in
                        self?.webView?.evaluateJavaScript(
                            "window.__onVolumeChanged__ && window.__onVolumeChanged__(\(bgm), \(se))")
                    }
                }
            case "setVolume":
                let track = (dict["track"] as? String) ?? "bgm"
                if let value = dict["value"] as? Int {
                    let clamped = max(0, min(100, value))
                    Task { @MainActor in
                        if track == "se" { AudioManager.shared.seVolume = clamped }
                        else { AudioManager.shared.bgmVolume = clamped }
                    }
                }
            default:
                break
            }

        case "privacy":
            let action = (message.body as? [String: Any])?["action"] as? String
            if action == "manageConsent", ConsentManager.shared.isRegulationApplicable {
                // 米国ユーザーのみ CCPA 選択をやり直せる。それ以外はポリシーを開く。
                ConsentManager.shared.reopenConsentUI()
            } else {
                UIApplication.shared.open(privacyPolicyURL)
            }

        case "requestReview":
            if let scene = UIApplication.shared.connectedScenes
                .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
                SKStoreReviewController.requestReview(in: scene)
            }

        case "openURL":
            if let s = message.body as? String, let url = URL(string: s) {
                UIApplication.shared.open(url)
            }

        default:
            break
        }
    }
}

struct GameWebView: UIViewRepresentable {
    func makeCoordinator() -> GameBridge { GameBridge() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.setURLSchemeHandler(AppSchemeHandler(), forURLScheme: "app")

        let proxy = WeakScriptMessageProxy(target: context.coordinator)
        for name in ["sound", "bgm", "rewardAd", "interstitial", "progress", "settings", "privacy", "requestReview", "openURL"] {
            config.userContentController.add(proxy, name: name)
        }

        // デバッグ端末(debug-config.js の VENDOR_IDS に登録済み)には全ステージ解放などの
        // デバッグ機能を許可する。ゲーム読み込み前に window.__IS_DEBUG__ を注入。
        let isDebug = DebugDeviceConfig.isDebugDevice ? "true" : "false"
        let debugScript = WKUserScript(source: "window.__IS_DEBUG__ = \(isDebug);",
                                       injectionTime: .atDocumentStart, forMainFrameOnly: true)
        config.userContentController.addUserScript(debugScript)

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = .black
        webView.scrollView.bounces = false
        webView.scrollView.isScrollEnabled = true
        context.coordinator.webView = webView

        webView.load(URLRequest(url: URL(string: "app://localhost/index.html")!))
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
