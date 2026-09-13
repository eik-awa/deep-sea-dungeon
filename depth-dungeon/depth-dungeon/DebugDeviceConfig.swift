//
//  DebugDeviceConfig.swift
//  depth-dungeon
//
//  デバッグ端末判定。IDFV が debug-config.js の VENDOR_IDS に登録されている端末でのみ、
//  Unity Ads(LevelPlay)をテストモード扱いにする(バナー/全画面広告をプレースホルダー化 +
//  Test Suite 起動可)。本番端末では一切影響しない。
//

import Foundation
import UIKit

enum DebugDeviceConfig {
    /// 許可不要。同一開発者のアプリが1つでも端末に残っていれば固定値を返す。
    static var persistentDeviceID: String {
        UIDevice.current.identifierForVendor?.uuidString ?? "unknown"
    }

    private static let registeredIDs: [String] = {
        // WebApp/ はフォルダ参照でバンドルされるため subdirectory を指定する。
        let url = Bundle.main.url(forResource: "debug-config", withExtension: "js", subdirectory: "WebApp")
            ?? Bundle.main.url(forResource: "debug-config", withExtension: "js")
        guard let url, let content = try? String(contentsOf: url, encoding: .utf8) else { return [] }
        let pattern = #"VENDOR_IDS\s*:\s*\[([^\]]*)\]"#
        guard let regex = try? NSRegularExpression(pattern: pattern),
              let match = regex.firstMatch(in: content, range: NSRange(content.startIndex..., in: content)),
              let range = Range(match.range(at: 1), in: content) else { return [] }
        return content[range]
            .components(separatedBy: ",")
            .map {
                $0.trimmingCharacters(in: .whitespacesAndNewlines)
                  .trimmingCharacters(in: CharacterSet(charactersIn: "'\""))
            }
            .filter { !$0.isEmpty }
    }()

    static var isDebugDevice: Bool {
        registeredIDs.contains(persistentDeviceID)
    }
}
