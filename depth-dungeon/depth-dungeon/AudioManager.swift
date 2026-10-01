import AVFoundation
import UIKit

@MainActor
final class AudioManager: ObservableObject {
    static let shared = AudioManager()

    /// 0〜100 の整数で音量を管理(BGMと効果音は別々に持つ)
    @Published var bgmVolume: Int = 70 {
        didSet {
            UserDefaults.standard.set(bgmVolume, forKey: "bgm_volume")
            applyBgmVolume()
        }
    }
    @Published var seVolume: Int = 70 {
        didSet {
            UserDefaults.standard.set(seVolume, forKey: "se_volume")
        }
    }

    private var bgmPlayer: AVAudioPlayer?
    private var fadingOut: AVAudioPlayer?
    private var sePlayers: [String: AVAudioPlayer] = [:]
    private var fadeTimer: Timer?
    private var currentTrack: String = "zone1"

    /// 海域トラック名 → 候補ファイル(resolve が バンドル直下 → WebApp/audio の順で探す)
    private let trackFiles: [String: [String]] = [
        "zone1": ["zone1.m4a", "Below_the_Glass.m4a", "Below_the_Glass.mp3"],
        "zone2": ["zone2.mp3"], "zone3": ["zone3.mp3"], "zone4": ["zone4.mp3"],
        "zone5": ["zone5.mp3"], "zone6": ["zone6.mp3"], "zone7": ["zone7.mp3"],
        "zone8": ["zone8.mp3"], "zone9": ["zone9.mp3"], "zone10": ["zone10.mp3"],
        "boss": ["boss.mp3"],
    ]

    /// 効果音キー(JS からの sound ブリッジ名) → 候補ファイル
    private let sfxFiles: [String: [String]] = [
        "attack": ["Attack.mp3"],
        "shopEnter": ["shopEnter.mp3"],
        "pickup": ["pickup.mp3"],
        "heal": ["heal.mp3"],
        "bubbleBurst": ["bubbleBurst.mp3"],
    ]

    private init() {
        let savedBgm = UserDefaults.standard.integer(forKey: "bgm_volume")
        bgmVolume = UserDefaults.standard.object(forKey: "bgm_volume") != nil ? savedBgm : 70
        let savedSe = UserDefaults.standard.integer(forKey: "se_volume")
        seVolume = UserDefaults.standard.object(forKey: "se_volume") != nil ? savedSe : 70

        setupAudioSession()
        loadSE()
        playTrack("zone1", crossfade: false)

        NotificationCenter.default.addObserver(
            self, selector: #selector(handleForeground),
            name: UIApplication.didBecomeActiveNotification, object: nil
        )
        NotificationCenter.default.addObserver(
            self, selector: #selector(handleBackground),
            name: UIApplication.didEnterBackgroundNotification, object: nil
        )
    }

    // MARK: - Public

    func play() {
        guard bgmPlayer?.isPlaying == false else { return }
        bgmPlayer?.play()
    }

    func pause() {
        bgmPlayer?.pause()
    }

    /// 海域が変わったら JS から呼ばれる。同じトラックなら無視。
    func playTrack(_ track: String, crossfade: Bool = true) {
        let name = trackFiles[track] != nil ? track : "zone1"
        if name == currentTrack, bgmPlayer?.isPlaying == true { return }
        guard let url = resolve(trackFiles[name] ?? []) else {
            print("BGM track not found: \(track)")
            return
        }
        currentTrack = name
        let next: AVAudioPlayer
        do {
            next = try AVAudioPlayer(contentsOf: url)
        } catch {
            print("AVAudioPlayer (BGM) error: \(error)")
            return
        }
        next.numberOfLoops = -1
        next.prepareToPlay()

        let target = Float(bgmVolume) / 100.0
        fadeTimer?.invalidate()
        fadeTimer = nil
        fadingOut?.stop()
        fadingOut = nil

        if crossfade, let prev = bgmPlayer, prev.isPlaying {
            next.volume = 0
            next.play()
            fadingOut = prev
            bgmPlayer = next
            let steps = 20
            var i = 0
            fadeTimer = Timer.scheduledTimer(withTimeInterval: 1.6 / Double(steps), repeats: true) { [weak self] t in
                Task { @MainActor in
                    guard let self else { t.invalidate(); return }
                    i += 1
                    let p = Float(i) / Float(steps)
                    self.bgmPlayer?.volume = target * p
                    self.fadingOut?.volume = target * (1 - p)
                    if i >= steps {
                        t.invalidate()
                        self.fadeTimer = nil
                        self.fadingOut?.stop()
                        self.fadingOut = nil
                    }
                }
            }
        } else {
            next.volume = target
            next.play()
            bgmPlayer?.stop()
            bgmPlayer = next
        }
    }

    /// JS の sound ブリッジから呼ばれる汎用SE再生。未知の名前・読み込み失敗時は何もしない。
    func playSE(_ name: String) {
        guard seVolume > 0, let p = sePlayers[name] else { return }
        p.volume = Float(seVolume) / 100.0
        if p.isPlaying {
            p.stop()
            p.currentTime = 0
        }
        p.play()
    }

    // MARK: - Private

    private func resolve(_ names: [String]) -> URL? {
        for n in names {
            let base = (n as NSString).deletingPathExtension
            let ext = (n as NSString).pathExtension
            // ① バンドル直下(xcodegen で追加されたリソース)
            if let url = Bundle.main.url(forResource: base, withExtension: ext) { return url }
            // ② WebApp フォルダ参照内(dist と一緒に同期する。xcodegen 不要)
            if let url = Bundle.main.url(forResource: base, withExtension: ext, subdirectory: "WebApp") { return url }
            if let url = Bundle.main.url(forResource: base, withExtension: ext, subdirectory: "WebApp/audio") { return url }
        }
        return nil
    }

    private func setupAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.ambient, mode: .default, options: [])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("AudioSession error: \(error)")
        }
    }

    private func loadSE() {
        for (key, names) in sfxFiles {
            guard let url = resolve(names) else {
                print("SFX not found: \(key)")
                continue
            }
            do {
                let p = try AVAudioPlayer(contentsOf: url)
                p.numberOfLoops = 0
                p.prepareToPlay()
                sePlayers[key] = p
            } catch {
                print("AVAudioPlayer (SE \(key)) error: \(error)")
            }
        }
    }

    private func applyBgmVolume() {
        let v = Float(bgmVolume) / 100.0
        bgmPlayer?.volume = v
        if fadeTimer == nil { fadingOut?.volume = v }
    }

    @objc private func handleForeground() {
        try? AVAudioSession.sharedInstance().setActive(true)
        if bgmVolume > 0 { bgmPlayer?.play() }
    }

    @objc private func handleBackground() {
        bgmPlayer?.pause()
    }
}
