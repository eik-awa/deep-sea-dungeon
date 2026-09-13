import SwiftUI

struct ContentView: View {
    @ObservedObject private var audio = AudioManager.shared
    @State private var showVolumePanel = false

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            VStack(spacing: 0) {
                GameWebView()
                    .background(Color.black)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                AdBannerView(adUnitID: bannerAdUnitID)
                    .frame(height: 50)
                    .padding(.bottom, 12)   // ホームインジケータから少し持ち上げる
                    .background(Color.black)
            }
            .ignoresSafeArea(edges: .top)

            // パネル表示中は背景タップで閉じる
            if showVolumePanel {
                Color.clear
                    .contentShape(Rectangle())
                    .onTapGesture {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            showVolumePanel = false
                        }
                    }
                    .ignoresSafeArea()
            }

            VolumeOverlay(
                volumeStep: $audio.volumeStep,
                showPanel: $showVolumePanel
            )
            // 広告バナー(50pt + 下余白12pt)の上に配置する
            .padding(.bottom, 72)
            .padding(.trailing, 10)
        }
    }
}

// MARK: - 音量オーバーレイ

private struct VolumeOverlay: View {
    @Binding var volumeStep: Int
    @Binding var showPanel: Bool

    var body: some View {
        VStack(alignment: .trailing, spacing: 6) {
            // 音量パネル (ボタンより上に展開)
            if showPanel {
                VolumePanel(volumeStep: $volumeStep)
                    .transition(.opacity.combined(with: .scale(scale: 0.9, anchor: .bottomTrailing)))
            }

            // 音量ボタン
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    showPanel.toggle()
                }
            } label: {
                Image(systemName: speakerIcon)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.white.opacity(0.85))
                    .frame(width: 34, height: 34)
                    .background(.ultraThinMaterial, in: Circle())
            }
        }
    }

    private var speakerIcon: String {
        switch volumeStep {
        case 0:       return "speaker.slash.fill"
        case 1...33:  return "speaker.wave.1.fill"
        case 34...66: return "speaker.wave.2.fill"
        default:      return "speaker.wave.3.fill"
        }
    }
}

// MARK: - 音量スライダーパネル

private struct VolumePanel: View {
    @Binding var volumeStep: Int

    // Sliderと連動するDouble
    private var sliderValue: Binding<Double> {
        Binding(
            get: { Double(volumeStep) },
            set: { volumeStep = Int($0.rounded()) }
        )
    }

    var body: some View {
        VStack(spacing: 8) {
            Text("\(volumeStep)%")
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                .foregroundColor(.white.opacity(0.9))

            Slider(value: sliderValue, in: 0...100, step: 1)
                .frame(width: 120)
                .tint(.white.opacity(0.85))

            HStack(spacing: 12) {
                Button { volumeStep = 0 } label: {
                    Image(systemName: "speaker.slash")
                        .font(.system(size: 11))
                        .foregroundColor(.white.opacity(0.6))
                }
                Spacer()
                Button { volumeStep = 100 } label: {
                    Image(systemName: "speaker.wave.3")
                        .font(.system(size: 11))
                        .foregroundColor(.white.opacity(0.6))
                }
            }
            .frame(width: 120)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 14))
    }
}

#Preview {
    ContentView()
}
