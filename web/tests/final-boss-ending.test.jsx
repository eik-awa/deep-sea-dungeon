// 回帰テスト: 海域10(最終海域)のボスを倒すと ending 画面へ遷移し、
// meta.clears が加算され、bestDepth が100に固定される。
// 注: g.phase==="ending" の間は中断セーブへの保存を意図的に止めている(タスキル後に
// エンディングを再現しないため)ので、画面遷移の確認は readGame() ではなくDOM文言で行う。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, click, flush, readMeta, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("最終海域ボス撃破", () => {
  it("depth=100の主を倒すと ending へ遷移し、meta.clears が加算される", async () => {
    const crew = makeCrewFixture({ type: "harpoon", atk: 999 });
    const boss = {
      id: "b1", bookId: "bossStar", name: "最終ボス", asset: "bossStar",
      hp: 1, maxHp: 500, atk: 1, def: 0, weak: [], resist: [],
      boss: true, anomaly: false, scanned: true, charge: false, summoned: 0, final: true,
      burn: false, drain: false, stun: false, paralyzed: 0, burning: 0, exposed: 0,
    };
    const game = baseGame({
      phase: "battle", crew: [crew], enemies: [boss], turnIdx: 0,
      depth: 100, node: 0, nodes: ["boss"],
    });
    const { container } = await renderGame({ meta: { checkpoint: 10, clears: 0 }, game });

    const atkBtn = byExactText(container, "攻 撃");
    click(atkBtn);
    await flush(1200);

    expect(container.textContent).toContain("境 界 を 越 え た");

    const meta = readMeta();
    expect(meta.clears).toBe(1);
    expect(meta.bestDepth).toBe(100);
  });
});
