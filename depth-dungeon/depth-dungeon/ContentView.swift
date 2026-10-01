import SwiftUI

struct ContentView: View {
    var body: some View {
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
    }
}

#Preview {
    ContentView()
}
