# StillDepths.jsx 回帰テスト

`../src/StillDepths.jsx`(深海ダンジョン本体)を書き換えたら、変更前後で必ずこれを実行する。

## 実行方法

```bash
cd web
npm run test          # vitest run --config vitest.config.js
npm run verify         # build → lint → smoke → test → sync までまとめて実行
```

`npm run test` は本物の `src/StillDepths.jsx` を happy-dom(vitest 4 + `environment: 'happy-dom'`)上で
実際に `createRoot` してレンダリングし、`test*.jsx` の各シナリオを本物のボタンクリックで検証する。
ロジックの再実装ではない(`tests/helpers.jsx` の `renderGame`/`click`/`byExactText` 等を参照)。

姉妹作 `rogue-like-dungeon`(`../../rogue-like-dungeon/rogue-like-dungeon/tests/`)にある
同種のテスト仕様書・Babel+jsdom ハーネスと役割は同じだが、実行基盤(vitest vs 独自ドライバ)は別物。
移植・比較する際は両方のディレクトリ構成を混同しないこと。

## 何を検証しているか(概要)

詳しいケース一覧・ID・優先度は [`テスト仕様書.md`](./テスト仕様書.md) を参照。カテゴリだけ挙げると:

- **SAVE** — メタデータ/中断セーブの永続化・破損データからの復旧・スキーマ欠損への耐性
- **ITEM** — 装備/消耗品/遺物の複製・消失(特に「異なる2つの操作をほぼ同時に行うレース」)
- **BTL** — 戦闘1ターンの整合性(連打・召喚上限・状態異常・異常個体の時間切れ)
- **PROG** — 深度/ノード進行の整合性(連打による多重進行・表示深度の一貫性)
- **AD** — リワード広告(復活・物資2倍・デイリー)の二重発火防止
- **UI** — HUD表示・収納残数表示・スキルツリーの到達可否

## このセッションで見つけて修正した実バグ

テストを新規に書く過程で、静的レビューだけでは見落としていた実バグを4件発見・修正した(詳細は各テストファイル冒頭のコメントを参照):

1. **`consumeItem()` の消耗品クロスアクション競合**(`item-use-race.test.jsx`) — 異なる2つの消耗品をほぼ同時に使うと、`gRef.current` の更新が次のレンダーまで遅れるため、片方の効果(袋からの削除・バフ付与)が後勝ちの `setG` で消えることがあった。`setG` 直後に `gRef.current` 自身も即座に同期するよう修正。
2. **`resumeRun`(タスキル再開)のフィールド欠損クラッシュ**(`corrupt-save-safety.test.jsx`) — 旧スキーマ/壊れた中断セーブに `crew` 等のフィールドが欠けていると、`g.crew[g.turnIdx]` で例外が発生しアプリ全体が白画面になっていた。再開時のマージに既定値を補完するよう修正。
3. **`proceed()`/`leaveNow()`/`takeAllGo()` のノード多重進行**(`node-advance-race.test.jsx`) — 現在の `g.phase` を見ずに無条件で次ノードへ進めるため、ボタン連打(同一ティック内の複数クリック)で再レンダー前の古いDOM要素にもクリックが素通りし、ノード/深度が2つ以上まとめて進んで戦闘やイベントを読み飛ばすことがあった。`actLockRef` と同種の同期ロックを追加。
4. **「海域を選んで再挑戦」での持ち越し品の意図しない適用/消費**(`zone-rechallenge.test.jsx`) — 画面上は「持ち越しアイテムは持ち込めません」と案内しているのに、`startDive` は `fromZone` を見ずに `meta.carried` を常に適用・消費していた。再挑戦時は適用も消費もしないよう修正。

また、以下2件は「発見したがこのセッションでは未修正」として記録している(低優先度・要判断):
- 行商(ショップ)の `g.full` 警告表示が抜けていた点は本セッションで直接ついでに修正済み(`shop-purchase.test.jsx`)。
- `attackWith` 相当の `act()` 呼び出しに近いクラスの同期スナップショット競合が `act()` 自体には無い(`actLockRef` で保護済み)ことを確認したのみ。

## できないこと(限界)

- 実機・実シミュレータでのタップ操作テストではない(happy-dom上のヘッドレスReact)。Safari実機エンジンと完全に同一の挙動を保証するものではない。
- 広告SDK・Firebase・BGM等のネイティブブリッジは全て no-op(`window.webkit` 未定義)。リワード広告の成功パスは `window.__onRewardAdResult__(context, true)` を直接呼んで模擬している(実際の広告SDKコールバックのタイミングまでは検証しない)。
- `g.phase` が `"lost"`/`"ending"` の間は、中断セーブ(`GAME_KEY`)への保存を意図的に止めている(タスキル再開時に解決済みの全滅/エンディング画面を再現しないための設計)。そのため、これらの画面遷移の確認は `readGame()` ではなく実際に描画されたDOM文言で行っている(該当テストのコメント参照)。同様に `g.full` もオートセーブの対象外。
- 新しいシナリオを見つけたら `*.test.jsx` を追加していく(vitest が `tests/**/*.test.jsx` を自動で拾う。`vitest.config.js` 参照)。
