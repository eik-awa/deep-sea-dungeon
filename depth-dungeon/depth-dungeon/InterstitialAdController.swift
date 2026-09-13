//
//  InterstitialAdController.swift
//  depth-dungeon
//
//  インタースティシャル広告(Unity LevelPlay)。JS 側は「切れ目に来た」ことだけを通知し、
//  実際に出すかどうか(頻度制御)はこのコントローラが最終判断する。
//  - 直近表示から最短 INTERSTITIAL_MIN_INTERVAL 秒
//  - アプリ起動後、最初の1回の潜航が終わるまでは出さない
//  - リワード広告の表示前後 60 秒は出さない
//  - ロード済みでなければ黙ってスキップ(ゲーム進行を止めない)
//

import Foundation
import UIKit
import IronSource

let interstitialAdUnitID = "mx78euhqopvl1wvn"

private let INTERSTITIAL_MIN_INTERVAL: TimeInterval = 180
private let REWARD_COOLDOWN: TimeInterval = 60

final class InterstitialAdController: NSObject, LPMInterstitialAdDelegate {
    static let shared = InterstitialAdController()

    private var ad: LPMInterstitialAd?
    private var loadStartedAt: Date?
    private var lastShownAt: Date?
    /// リワード広告を出した時刻(前後 60 秒はインタースティシャルを抑止)。
    private(set) var lastRewardAt: Date?
    /// 閉じたあと JS へ返すコールバック名(任意)。
    private var closeContext: String?
    private var onClosed: ((String) -> Void)?

    /// 起動後、最初の潜航が終わるまで抑止するためのフラグ(UserDefaults に永続不要 = セッション単位)。
    private var firstDiveComplete = false

    private var isLoading: Bool {
        guard let t = loadStartedAt else { return false }
        return Date().timeIntervalSince(t) <= 45
    }

    private override init() { super.init() }

    // MARK: - ライフサイクル通知(JS からの progress で受ける)

    func noteDiveStarted() {}
    func noteZoneCleared() { firstDiveComplete = true }
    func notePartyWipe() { firstDiveComplete = true }
    func noteRewardAdShown() { lastRewardAt = Date() }

    // MARK: - ロード

    func preload() {
        guard !isLoading else { return }
        #if targetEnvironment(simulator)
        return
        #else
        loadStartedAt = Date()
        let newAd = LPMInterstitialAd(adUnitId: interstitialAdUnitID)
        newAd.setDelegate(self)
        ad = newAd
        newAd.loadAd()
        #endif
    }

    func preloadIfNeeded() {
        if let ad = ad, ad.isAdReady() { return }
        preload()
    }

    // MARK: - 表示判断

    private var canShow: Bool {
        guard firstDiveComplete else { return false }
        if let last = lastShownAt, Date().timeIntervalSince(last) < INTERSTITIAL_MIN_INTERVAL { return false }
        if let r = lastRewardAt, Date().timeIntervalSince(r) < REWARD_COOLDOWN { return false }
        return true
    }

    /// JS が「切れ目に来た」と通知したときに呼ぶ。可否判定 → 可能なら表示。
    /// 閉じたら onClosed(context) を呼ぶ(表示しなかった場合は即時に呼ぶ)。
    func maybeShow(context: String, onClosed: @escaping (String) -> Void) {
        if DebugDeviceConfig.isDebugDevice {
            showDebugTestAd(context: context, onClosed: onClosed)
            return
        }
        guard canShow, let ad = ad, ad.isAdReady(),
              let vc = UIApplication.shared.ddRootViewController else {
            preloadIfNeeded()
            onClosed(context)
            return
        }
        self.closeContext = context
        self.onClosed = onClosed
        lastShownAt = Date()
        ad.showAd(viewController: vc, placementName: nil)
    }

    private func showDebugTestAd(context: String, onClosed: @escaping (String) -> Void) {
        guard canShow, let vc = UIApplication.shared.ddRootViewController else { onClosed(context); return }
        lastShownAt = Date()
        let alert = UIAlertController(title: "テスト全画面広告",
                                     message: "デバッグ端末のため、テスト広告を表示しています…(\(context))",
                                     preferredStyle: .alert)
        vc.present(alert, animated: true)
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            alert.dismiss(animated: true) { onClosed(context) }
        }
    }

    private func fireClosed() {
        let ctx = closeContext ?? ""
        let cb = onClosed
        closeContext = nil
        onClosed = nil
        cb?(ctx)
    }

    // MARK: - LPMInterstitialAdDelegate

    func didLoadAd(with adInfo: LPMAdInfo) { print("[Interstitial] loaded"); loadStartedAt = nil }
    func didFailToLoadAd(withAdUnitId adUnitId: String, error: Error) {
        print("[Interstitial] load failed: \(error)")
        loadStartedAt = nil
        DispatchQueue.main.asyncAfter(deadline: .now() + 8) { [weak self] in self?.preloadIfNeeded() }
    }
    func didDisplayAd(with adInfo: LPMAdInfo) {}
    func didFailToDisplayAd(with adInfo: LPMAdInfo, error: Error) {
        print("[Interstitial] display failed: \(error)")
        fireClosed()
        preload()
    }
    func didClickAd(with adInfo: LPMAdInfo) {}
    func didCloseAd(with adInfo: LPMAdInfo) {
        fireClosed()
        preload()
    }
}
