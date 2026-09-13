//
//  AdBannerView.swift
//  depth-dungeon
//
//  画面最下部に常時表示する Unity LevelPlay(Unity Ads)バナー。
//  実装はダンジョンローグ(rogue-like-dungeon)を踏襲。
//

import SwiftUI
import Combine
import UIKit
import IronSource

/// LevelPlay の App Key。IronSource/LevelPlay ダッシュボード → Apps → App Key の値。
/// Unity Dashboard の Game ID とは別の値。
let levelPlayAppKey = "278f36ad5"
let bannerAdUnitID  = "axq4gdauvh62xqh3"

/// LevelPlay SDK の初期化状態をアプリ全体で共有する。
/// バナー広告オブジェクトは初期化完了後に生成する必要があるため、AdBannerView は
/// この状態を監視してから広告を生成する。
/// 初期化通信は起動時に広告ブロックが有効だと失敗しうる。その場合でも `isInitialized` を
/// false のまま固定せず、フォアグラウンドにいる間は指数バックオフで自動リトライし、
/// アプリ復帰時には即時リトライする。
final class LevelPlayAdsController: ObservableObject {
    static let shared = LevelPlayAdsController()

    private enum InitState { case idle, initializing, ready, failed }

    @Published private(set) var isInitialized = false

    private var state: InitState = .idle
    private var retryCount = 0
    private var retryWorkItem: DispatchWorkItem?
    private var isForeground = true

    private init() {
        NotificationCenter.default.addObserver(
            self, selector: #selector(appDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification, object: nil)
    }

    @objc private func appDidEnterBackground() {
        isForeground = false
        retryWorkItem?.cancel()
        retryWorkItem = nil
    }

    /// ATT の応答後に呼び出す。冪等。以降はフォアグラウンド復帰のたびに呼んでよい。
    func initialize() {
        initializeIfNeeded()
    }

    func initializeIfNeeded() {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.isForeground = true
            switch self.state {
            case .ready:
                RewardedAdController.shared.preloadIfNeeded()
                InterstitialAdController.shared.preloadIfNeeded()
            case .initializing:
                break
            case .idle, .failed:
                self.retryWorkItem?.cancel()
                self.retryWorkItem = nil
                self.startInit()
            }
        }
    }

    private func startInit() {
        #if targetEnvironment(simulator)
        // シミュレータは IDFA が無くテストデバイス登録が効かないため SDK を起動しない。
        print("[AdBanner] simulator: skipping SDK init")
        return
        #else
        state = .initializing
        // Test Suite はこのメタデータを有効にしてから初期化しないと起動できない。
        // デバッグ端末以外では本番の広告配信に影響しないよう有効化しない。
        if DebugDeviceConfig.isDebugDevice {
            LevelPlay.setMetaDataWithKey("is_test_suite", value: "enable")
        }
        let request = LPMInitRequestBuilder(appKey: levelPlayAppKey).build()
        LevelPlay.initWith(request) { [weak self] _, error in
            DispatchQueue.main.async {
                guard let self else { return }
                if let error = error {
                    print("[AdBanner] init failed: \(error)")
                    self.state = .failed
                    self.scheduleRetry()
                    return
                }
                print("[AdBanner] init success")
                self.state = .ready
                self.retryCount = 0
                self.retryWorkItem?.cancel()
                self.retryWorkItem = nil
                self.isInitialized = true
                RewardedAdController.shared.preload()
                InterstitialAdController.shared.preload()
                if DebugDeviceConfig.isDebugDevice {
                    LevelPlay.validateIntegration()
                }
            }
        }
        #endif
    }

    /// 初期化失敗時、指数バックオフで再試行する(5→15→30→60秒、以降60秒固定)。
    /// 上限回数は設けない。フォアグラウンドにいる間だけ動作する。
    private func scheduleRetry() {
        guard isForeground else { return }
        let delays: [TimeInterval] = [5, 15, 30, 60]
        let delay = delays[min(retryCount, delays.count - 1)]
        retryCount += 1
        let work = DispatchWorkItem { [weak self] in
            guard let self else { return }
            if case .failed = self.state { self.startInit() }
        }
        retryWorkItem = work
        DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: work)
    }

    /// デバッグ端末(DebugDeviceConfig.isDebugDevice)からのみ呼び出す想定。
    /// LevelPlay の Test Suite を起動し、テストモードで広告在庫を確認できるようにする。
    func launchTestSuite() {
        guard let vc = UIApplication.shared.ddRootViewController else { return }
        LevelPlay.launchTestSuite(vc)
    }
}

/// LevelPlay バナー(320x50)を SwiftUI へ橋渡しする。
private struct AdBannerUIView: UIViewRepresentable {
    let adUnitID: String

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> LPMBannerAdView {
        let config = LPMBannerAdViewConfigBuilder().set(adSize: .banner()).build()
        let banner = LPMBannerAdView(adUnitId: adUnitID, config: config)
        banner.setDelegate(context.coordinator)
        if let vc = UIApplication.shared.ddRootViewController {
            banner.loadAd(with: vc)
            context.coordinator.requestedLoad = true
        }
        return banner
    }

    func updateUIView(_ uiView: LPMBannerAdView, context: Context) {
        // ルート VC がまだ無かった場合に備えて、表示更新時に補う。
        if !context.coordinator.requestedLoad, let vc = UIApplication.shared.ddRootViewController {
            uiView.loadAd(with: vc)
            context.coordinator.requestedLoad = true
        }
    }

    final class Coordinator: NSObject, LPMBannerAdViewDelegate {
        var requestedLoad = false

        func didLoadAd(with adInfo: LPMAdInfo) {
            print("[AdBanner] banner loaded: \(adInfo.adUnitId)")
        }
        func didFailToLoadAd(withAdUnitId adUnitId: String, error: Error) {
            print("[AdBanner] banner load failed (\(adUnitId)): \(error)")
        }
        func didDisplayAd(with adInfo: LPMAdInfo) {
            print("[AdBanner] banner displayed")
        }
        func didFailToDisplayAd(with adInfo: LPMAdInfo, error: Error) {
            print("[AdBanner] banner display failed: \(error)")
        }
        func didClickAd(with adInfo: LPMAdInfo) {}
        func didLeaveApp(with adInfo: LPMAdInfo) {}
        func didExpandAd(with adInfo: LPMAdInfo) {}
        func didCollapseAd(with adInfo: LPMAdInfo) {}
    }
}

/// シミュレータ用のダミーバナー(テスト用グレー領域)。
private struct SimulatorAdPlaceholder: View {
    var body: some View {
        ZStack {
            Color(white: 0.18)
            Text("テストモード")
                .font(.system(size: 11, weight: .regular, design: .monospaced))
                .foregroundColor(Color(white: 0.55))
        }
    }
}

/// デバッグ端末用のプレースホルダー(テスト用グレー領域)。
/// タップすると LevelPlay の Test Suite が起動する。
private struct DebugAdPlaceholder: View {
    var body: some View {
        ZStack {
            Color(white: 0.18)
            Text("テストモード")
                .font(.system(size: 11, weight: .regular, design: .monospaced))
                .foregroundColor(Color(white: 0.55))
        }
        .contentShape(Rectangle())
        .onTapGesture {
            LevelPlayAdsController.shared.launchTestSuite()
        }
    }
}

/// SDK 初期化完了後にバナーを表示する。シミュレータではプレースホルダーを表示。
/// デバッグ端末(DebugDeviceConfig.isDebugDevice)では本番広告を配信せずプレースホルダーを表示する。
struct AdBannerView: View {
    let adUnitID: String
    @ObservedObject private var ads = LevelPlayAdsController.shared

    var body: some View {
        #if targetEnvironment(simulator)
        SimulatorAdPlaceholder()
        #else
        if DebugDeviceConfig.isDebugDevice {
            DebugAdPlaceholder()
        } else if ads.isInitialized {
            AdBannerUIView(adUnitID: adUnitID)
        } else {
            // 初期化完了までの数秒、最下部が黒帯にならないよう背景色で埋める。
            Color(red: 0x03 / 255, green: 0x07 / 255, blue: 0x11 / 255)
        }
        #endif
    }
}

extension UIApplication {
    /// 現在キーになっているウインドウのルート ViewController。
    var ddRootViewController: UIViewController? {
        connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow }?
            .rootViewController
    }
}
