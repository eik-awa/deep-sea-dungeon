//
//  ConsentManager.swift
//  depth-dungeon
//
//  同意フローは「米国 IP の端末のみ」を対象にする。
//  それ以外(日本・EEA/UK 等)には同意 UI を一切出さず、広告は制限なしで配信する。
//
//  ── なぜこの実装か ──
//  InMobi Choice SDK は `startChoice` を呼ぶと、ダッシュボード設定に基づいて同意 UI を
//  「自動表示」する。表示可否をコードから止める API は無い(公式に確認済み)。
//  そのため日本 IP でも同意ダイアログが出てしまっていた。
//  → 対策: **自前で IP から国を判定し、米国のときだけ `startChoice` を呼ぶ。**
//    米国以外では ChoiceCmp を一切起動しないので UI は絶対に出ない。
//
//  あわせて、GDPR 系の幽霊制限で「広告が毎回無効化される」不具合(ダンジョンローグで発生)を
//  防ぐため、起動のたびに IAB TCF(IABTCF_*)キーを UserDefaults から削除する。
//
//  p-code: https://choice.inmobi.com のプロパティ App Key。
//

import Foundation
import UIKit
import StoreKit
import InMobiCMP
import IronSource
import FirebaseAnalytics

final class ConsentManager: NSObject, ChoiceCmpDelegate, CCPADelegate {
    static let shared = ConsentManager()

    private let pcode = "e_de1zrrLkmzK"

    private var completion: ((Bool) -> Void)?
    private var didComplete = false
    private var consentUIVisible = false
    private var choiceStarted = false

    /// 計測の可否は ATT のみに従う(GDPR 同意は収集しない)。
    var canEnableAnalytics: Bool { true }

    private override init() { super.init() }

    // MARK: - IAB TCF(GDPR)残骸のクリア

    private func clearGDPRArtifacts() {
        let d = UserDefaults.standard
        for key in [
            "IABTCF_TCString", "IABTCF_gdprApplies", "IABTCF_CmpSdkID",
            "IABTCF_CmpSdkVersion", "IABTCF_PolicyVersion", "IABTCF_PurposeConsents",
            "IABTCF_VendorConsents", "IABTCF_VendorLegitimateInterests",
            "IABTCF_PurposeLegitimateInterests", "IABTCF_SpecialFeaturesOptIns",
            "IABTCF_PublisherCC", "IABTCF_PublisherConsent",
        ] {
            d.removeObject(forKey: key)
        }
    }

    // MARK: - 起動フロー

    /// アプリ起動時、ATT より前に一度だけ呼ぶ。
    /// 米国 IP の端末には CCPA UI を表示し、それ以外には何も出さず即 completion(true)。
    func requestConsentIfNeeded(completion: @escaping (Bool) -> Void) {
        self.completion = completion
        self.didComplete = false
        self.consentUIVisible = false

        clearGDPRArtifacts()

        RegionCheck.isUnitedStates { [weak self] isUS in
            guard let self else { return }
            if isUS {
                self.startChoice()
            } else {
                // 米国外: CMP を起動しない = UI は出ない。広告制限もかけない。
                LPMPrivacySettings.setCCPA(false)
                self.clearGDPRArtifacts()
                self.finishOnce(resolved: true)
            }
        }
    }

    private func startChoice() {
        choiceStarted = true

        // CMP から応答が来ない場合の保険。同意 UI 表示中はスキップ。
        DispatchQueue.main.asyncAfter(deadline: .now() + 8) { [weak self] in
            guard let self, !self.consentUIVisible else { return }
            self.finishOnce(resolved: false)
        }

        ChoiceCmp.shared.startChoice(pcode: pcode, delegate: self, ccpaDelegate: self,
                                     shouldDisplayIDFA: false, style: Self.style)
    }

    /// この端末に同意設定 UI があるか(= 米国で CMP を起動済みか)。設定画面の表示判定に使う。
    var isRegulationApplicable: Bool { choiceStarted }

    /// 設定画面などから、米国ユーザーが後から同意の選択をやり直せるようにする。
    func reopenConsentUI() {
        guard choiceStarted else { return }
        ChoiceCmp.shared.forceDisplayUI()
    }

    func resetConsent() {
        clearGDPRArtifacts()
        for key in ["USPrivacy_String", "IABGPP_HDR_GppString", "IABGPP_GppSID"] {
            UserDefaults.standard.removeObject(forKey: key)
        }
        RegionCheck.reset()
        UserDefaults.standard.synchronize()
    }

    private func finishOnce(resolved: Bool) {
        guard !didComplete else { return }
        didComplete = true
        let cb = completion
        completion = nil
        DispatchQueue.main.async { cb?(resolved) }
    }

    // MARK: - ChoiceCmpDelegate

    func cmpDidLoad(info: PingResponse) {
        if info.displayStatus == .visible {
            consentUIVisible = true
        } else {
            finishOnce(resolved: true)
        }
    }

    func didReceiveIABVendorConsent(gdprData: GDPRData, updated: Bool) {
        // GDPR 同意は収集しない。念のため TCF を消す。
        clearGDPRArtifacts()
    }

    func didReceiveNonIABVendorConsent(nonIabData: NonIABData, updated: Bool) {}
    func didReceiveAdditionalConsent(acData: ACData, updated: Bool) {}

    func cmpDidError(error: Error) {
        print("[Consent] ERROR: \(error)")
        clearGDPRArtifacts()
        finishOnce(resolved: false)
    }

    func didReceiveUSRegulationsConsent(usRegData: USRegulationsData) {
        let optedOut = usRegData.SaleOptOut != 0 || usRegData.SharingOptOut != 0
        LPMPrivacySettings.setCCPA(optedOut)
    }

    func didReceiveActionButtonTap(action: ActionButtons) {}

    func cmpUIStatusChanged(info: DisplayInfo) {
        if info.displayStatus == .dismissed || info.displayStatus == .hidden {
            finishOnce(resolved: true)
        }
    }

    func userDidMoveToOtherState() {}

    // MARK: - CCPADelegate

    func didReceiveCCPAConsent(string: String) {
        print("[Consent] US privacy string: \(string)")
    }

    // MARK: - スタイル(深海の暗 × 生体発光シアン × 琥珀)

    private static let style: ChoiceStyle = {
        let colors = ChoiceColor()
        colors.globalBackgroundColor = "#030711"
        colors.titleTextColor = "#4fd6e8"
        colors.bodyTextColor = "#dff0f6"
        colors.menuTextColor = "#dff0f6"
        colors.tabBackgroundColor = "#0a1624"
        colors.tabTextColor = "#8fa9ba"
        colors.dividerColor = "#1d2f3d"
        colors.linkTextColor = "#4fd6e8"
        colors.toggleActiveColor = "#4fd6e8"
        colors.toggleInactiveColor = "#4a564d"
        colors.searchBarBackgroundColor = "#0a1624"
        colors.searchBarForegroundColor = "#dff0f6"
        colors.infoButtonForegroundColor = "#4fd6e8"
        colors.buttonBackgroundColor = "#ffd27f"
        colors.buttonTextColor = "#04121a"
        colors.buttonDisabledBackgroundColor = "#3a4a3f"
        colors.buttonDisabledTextColor = "#8fa9ba"
        return ChoiceStyle(preferredThemeMode: .dark, lightModeColors: colors, darkModeColors: colors)
    }()
}

// MARK: - IP による国判定

/// 端末の IP から国コードを取得し、米国かどうかを判定する。
/// - 結果は 7 日間 UserDefaults にキャッシュ。
/// - 通信失敗時は App Store のストアフロント国、それも取れなければ「米国ではない」とみなす
///   (= 同意 UI を出さない・広告制限もしない安全側)。
enum RegionCheck {
    private static let countryKey = "dd_ip_country"
    private static let stampKey   = "dd_ip_country_ts"
    private static let ttl: TimeInterval = 7 * 24 * 3600

    static func reset() {
        UserDefaults.standard.removeObject(forKey: countryKey)
        UserDefaults.standard.removeObject(forKey: stampKey)
    }

    static func isUnitedStates(_ completion: @escaping (Bool) -> Void) {
        let d = UserDefaults.standard
        if let c = d.string(forKey: countryKey),
           Date().timeIntervalSince1970 - d.double(forKey: stampKey) < ttl {
            completion(c == "US")
            return
        }

        // Cloudflare エッジの trace(プレーンテキスト "loc=XX" を含む)。高速・全世界で安定。
        guard let url = URL(string: "https://www.cloudflare.com/cdn-cgi/trace") else {
            completion(storefrontIsUS()); return
        }
        var req = URLRequest(url: url)
        req.timeoutInterval = 4
        req.cachePolicy = .reloadIgnoringLocalCacheData
        URLSession.shared.dataTask(with: req) { data, _, _ in
            var country: String?
            if let data, let text = String(data: data, encoding: .utf8) {
                for line in text.split(separator: "\n") where line.hasPrefix("loc=") {
                    country = line.dropFirst(4).uppercased()
                }
            }
            DispatchQueue.main.async {
                if let country, !country.isEmpty {
                    d.set(country, forKey: countryKey)
                    d.set(Date().timeIntervalSince1970, forKey: stampKey)
                    completion(country == "US")
                } else {
                    completion(storefrontIsUS())
                }
            }
        }.resume()
    }

    private static func storefrontIsUS() -> Bool {
        if #available(iOS 13.0, *) {
            return SKPaymentQueue.default().storefront?.countryCode == "USA"
        }
        return false
    }
}
