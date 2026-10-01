// 回帰テスト: ボスを撃破すると必ず zoneClear(またはending)へ遷移すること。
// 過去に victory() 内で、ネイティブ橋渡しのローカル変数 bridge() を
// (そのスコープの外にある)ボス撃破分岐から誤って呼んでいたため、
// ボス戦勝利時だけ ReferenceError で victory() が完走せず、
// 画面が battle フェーズのまま固まる(「ボスを倒しても何も起こらない」)
// 不具合があった。native() に統一して修正済み。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, click, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("ボス撃破後の画面遷移", () => {
  it("ボスを倒すと戦闘画面に固まらず zoneClear へ遷移する", async () => {
    const crew = makeCrewFixture({ type: "harpoon", atk: 999 });
    const boss = {
      id: "b1", bookId: "bossKraken", name: "テストボス", asset: "bossKraken",
      hp: 1, maxHp: 500, atk: 1, def: 0, weak: [], resist: [],
      boss: true, anomaly: false, scanned: true, charge: false, summoned: 0,
      burn: false, drain: false, stun: false, paralyzed: 0, burning: 0, exposed: 0,
    };
    const game = baseGame({
      phase: "battle", crew: [crew], enemies: [boss], turnIdx: 0,
      depth: 10, node: 0, nodes: ["boss"],
    });
    const { container } = await renderGame({ meta: { checkpoint: 1 }, game });

    const atkBtn = byExactText(container, "攻 撃");
    expect(atkBtn, "攻撃ボタンが見つからない").toBeTruthy();
    click(atkBtn);
    await flush(1200);

    const g = readGame();
    expect(g.phase).toBe("zoneClear");
    expect(g.busy).toBe(false);
  });

  it("旧ビルドの不具合で固まった保存データ(battleフェーズ・敵全滅済み)を再開すると、自動で次のシーンへ復旧する", async () => {
    const deadBoss = {
      id: "b1", bookId: "bossKraken", name: "テストボス", asset: "bossKraken",
      hp: 0, maxHp: 500, atk: 1, def: 0, weak: [], resist: [],
      boss: true, anomaly: false, scanned: true, charge: false, summoned: 0,
      burn: false, drain: false, stun: false, paralyzed: 0, burning: 0, exposed: 0,
    };
    const crew = makeCrewFixture({ type: "harpoon" });
    // 過去のクラッシュで固まったことを模した保存データ: battle フェーズのまま、
    // 敵は全滅済み、busy は true に固まっている。
    const stuckSave = baseGame({
      phase: "battle", busy: true, crew: [crew], enemies: [deadBoss], turnIdx: 0,
      depth: 10, node: 0, nodes: ["boss"],
    });
    const { container } = await renderGame({ meta: { checkpoint: 1 }, game: stuckSave });

    // 再開プロンプトを経由せず、自動でそのまま次のシーンへ復旧しているはず
    const resumeBtn = byExactText(container, "続きから再開");
    expect(resumeBtn, "固まった保存データなのに再開プロンプトが出てしまっている").toBeFalsy();

    const g = readGame();
    expect(g.phase).toBe("zoneClear");
    expect(g.busy).toBe(false);
  });
});
