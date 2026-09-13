import SwiftUI
import AppTrackingTransparency
import AVFoundation
import FirebaseCore
import FirebaseAnalytics
import IronSource

@main
struct depth_dungeonApp: App {
    @Environment(\.scenePhase) private var scenePhase
    @State private var didRequestTracking = false

    init() {
        FirebaseApp.configure()
        // ATT の応答が済むまでは計測を止めておく(同意前収集を避ける)。
        Analytics.setAnalyticsCollectionEnabled(false)
        try? AVAudioSession.sharedInstance().setCategory(
            .ambient, mode: .default, options: [.mixWithOthers])
        print("[DebugBadge] Identifier: \(DebugDeviceConfig.persistentDeviceID)")
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .ignoresSafeArea()
                .preferredColorScheme(.dark)
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active {
                if didRequestTracking {
                    LevelPlayAdsController.shared.initializeIfNeeded()
                } else {
                    requestTrackingThenStartAds()
                }
            }
        }
    }

    /// 米国州法(CCPA)同意・ATT許諾・広告SDK初期化を行う。
    /// - 同意フロー(InMobi Choice)は「米国 IP」のときだけ起動する(ConsentManager 参照)。
    /// - ATT・広告SDK初期化・計測は同意フローの結果を待たず独立して進める。
    /// - GDPR は扱わない。米国外ユーザーには同意 UI を出さず広告制限もかけない。
    private func requestTrackingThenStartAds() {
        guard !didRequestTracking else { return }
        didRequestTracking = true

        LPMPrivacySettings.setCOPPA(false)
        LevelPlayAdsController.shared.initialize()

        // 同意フロー(米国のみ実際に UI が出る)。結果は待たない。
        ConsentManager.shared.requestConsentIfNeeded { _ in }

        // ATT と計測は独立して進める。
        Task {
            try? await Task.sleep(nanoseconds: 500_000_000)
            await ATTrackingManager.requestTrackingAuthorization()
            Analytics.setAnalyticsCollectionEnabled(true)
            LevelPlayAdsController.shared.initializeIfNeeded()
        }
    }
}
