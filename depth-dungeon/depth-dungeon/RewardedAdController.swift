//
//  RewardedAdController.swift
//  depth-dungeon
//
//  リワード広告(Unity LevelPlay)。1日3回までの制限は JS 側(StillDepths.jsx)で管理し、
//  ネイティブ側は「表示できるか」と「視聴結果(rewarded / dismissed / unavailable / timeout)」だけを担当する。
//

import Foundation
import UIKit
import IronSource

let rewardedAdUnitID = "onk6pd1tro5w7hn4"

enum RewardAdResult: String {
    case rewarded
    case dismissed
    case unavailable
    case timeout
}

/// リワード広告のロード・表示・コールバックを一元管理する。
final class RewardedAdController: NSObject, LPMRewardedAdDelegate {
    static let shared = RewardedAdController()

    private var ad: LPMRewardedAd?
    private var onResult: ((RewardAdResult) -> Void)?
    private var pendingCompletion: ((RewardAdResult) -> Void)?

    private var loadStartedAt: Date?
    private var isLoading: Bool {
        guard let t = loadStartedAt else { return false }
        return Date().timeIntervalSince(t) <= 45
    }

    private var requestSeq: UInt64 = 0
    private var pendingRequestID: UInt64?

    private override init() { super.init() }

    func preload() {
        guard !isLoading else { return }
        loadStartedAt = Date()
        let newAd = LPMRewardedAd(adUnitId: rewardedAdUnitID)
        newAd.setDelegate(self)
        ad = newAd
        newAd.loadAd()
    }

    func preloadIfNeeded() {
        if let ad = ad, ad.isAdReady() { return }
        preload()
    }

    /// 広告を表示する。ロード中なら最大15秒待つ。デバッグ端末では簡易テスト広告。
    func show(completion: @escaping (RewardAdResult) -> Void) {
        if DebugDeviceConfig.isDebugDevice {
            showDebugTestAd(completion: completion)
            return
        }
        guard let vc = UIApplication.shared.ddRootViewController else {
            completion(.unavailable); return
        }
        if let ad = ad, ad.isAdReady() {
            onResult = completion
            pendingRequestID = nil
            ad.showAd(viewController: vc, placementName: nil)
            return
        }
        requestSeq += 1
        let myID = requestSeq
        pendingRequestID = myID
        pendingCompletion = completion
        preload()
        DispatchQueue.main.asyncAfter(deadline: .now() + 15) { [weak self] in
            guard let self, self.pendingRequestID == myID else { return }
            self.pendingRequestID = nil
            let cb = self.pendingCompletion
            self.pendingCompletion = nil
            cb?(.timeout)
        }
    }

    private func showDebugTestAd(completion: @escaping (RewardAdResult) -> Void) {
        guard let vc = UIApplication.shared.ddRootViewController else {
            completion(.unavailable); return
        }
        let alert = UIAlertController(
            title: "テスト広告",
            message: "デバッグ端末のため、テスト広告を表示しています…",
            preferredStyle: .alert)
        vc.present(alert, animated: true)
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            alert.dismiss(animated: true) { completion(.rewarded) }
        }
    }

    private func finish(_ result: RewardAdResult) {
        guard let callback = onResult else { return }
        onResult = nil
        callback(result)
    }

    // MARK: - LPMRewardedAdDelegate

    func didLoadAd(with adInfo: LPMAdInfo) {
        print("[RewardedAd] loaded")
        loadStartedAt = nil
        guard let cb = pendingCompletion,
              let ad = ad, ad.isAdReady(),
              let vc = UIApplication.shared.ddRootViewController else { return }
        pendingCompletion = nil
        pendingRequestID = nil
        onResult = cb
        ad.showAd(viewController: vc, placementName: nil)
    }

    func didFailToLoadAd(withAdUnitId adUnitId: String, error: Error) {
        print("[RewardedAd] load failed: \(error)")
        loadStartedAt = nil
        if let cb = pendingCompletion {
            pendingCompletion = nil
            pendingRequestID = nil
            cb(.unavailable)
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 5) { [weak self] in self?.preloadIfNeeded() }
    }

    func didDisplayAd(with adInfo: LPMAdInfo) {}

    func didRewardAd(with adInfo: LPMAdInfo, reward: LPMReward) { finish(.rewarded) }

    func didFailToDisplayAd(with adInfo: LPMAdInfo, error: Error) {
        print("[RewardedAd] display failed: \(error)")
        loadStartedAt = nil
        finish(.unavailable)
        preload()
    }

    func didClickAd(with adInfo: LPMAdInfo) {}

    func didCloseAd(with adInfo: LPMAdInfo) {
        finish(.dismissed)
        preload()
    }
}
