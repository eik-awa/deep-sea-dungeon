// 回帰テスト: 固定ダメージの全体攻撃アイテム(小型魚雷等、kind:"bomb")。
// 「使い所が少ない」との指摘の実態は、単なる威力不足ではなく実バグだった:
// `s.enemies = s.enemies.map(e => { s = addFloat(s, ...); ... })` という書き方で、
// map のコールバック内で代入先と同じ変数 s を書き換えていたため、JS の代入セマンティクス
// 上「s.enemies への代入」は先に確定した古い s に対して行われ、その後 `s = pushLog(s, ...)`
// で s が addFloat 側のオブジェクトに差し替わり、ダメージを反映した方が握りつぶされていた。
// 浮遊ダメージ数値は表示されるのに実際のHPは一切減らない、という重大な不具合だったため、
// 代入と s の差し替えを分離して修正した。ついでに威力そのものも引き上げ
// (22+depth*2 → 40+depth*4)、収納画面で使用前に何ダメージ出るかが分かるよう表示も追加した。
import { describe, it, expect } from "vitest";
import { renderGame, byContainsText, click, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("固定ダメージの全体攻撃アイテム", () => {
  it("収納画面に使用前のダメージ量が表示され、実際の威力もその通りになる", async () => {
    const torpedo = { id: "bomb-1", kind: "item", itemId: "torpedo", name: "小型魚雷", asset: "torpedo", rarity: "std" };
    const enemy = {
      id: "e1", bookId: "lanternfish", name: "テスト敵", asset: "lanternfish",
      hp: 500, maxHp: 500, atk: 1, def: 0, weak: [], resist: [],
      boss: false, anomaly: false, scanned: true,
    };
    const crew = makeCrewFixture({ gear: null });
    // depth=5 → bombPower(5) = 40 + 5*4 = 60
    const game = baseGame({ phase: "battle", crew: [crew], enemies: [enemy], turnIdx: 0, depth: 5, bag: [torpedo], bagOpen: true });
    const { container } = await renderGame({ game });

    const cell = byContainsText(container, "小型魚雷", ".sd-cell");
    expect(cell, "小型魚雷のセルが見つからない").toBeTruthy();
    expect(cell.textContent, "使用前のダメージ量が表示されていない").toContain("固定ダメージ 60");

    click(cell);
    await flush(700);

    const g = readGame();
    expect(g.enemies[0].hp, "威力が新しい計算式(40+depth*4)通りになっていない").toBe(440);
  });
});
