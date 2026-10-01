// 回帰テスト: consumeItem() は「まだ持っているか」を gRef.current から同期的に読んで
// から setG(素の値) で適用する作り(ダンジョンローグの旧 useItem と同型)。異なる2つの
// 消耗品(予備電池・冷却剤)をほぼ同時に使うと、両方とも同じ古いスナップショットを見て
// 計算し、後勝ちの setG が片方の効果(CD解除・冷却剤の被ダメ軽減)とその収納からの削除を
// 丸ごと打ち消してしまう(片方は「使った」演出だけで実際には収納に残ったまま)。
import { describe, it, expect } from "vitest";
import { renderGame, byContainsText, raceClicks, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("消耗品の同時使用", () => {
  it("異なる2つの消耗品(予備電池・冷却剤)をほぼ同時に使っても、両方の効果が適用される", async () => {
    const crew = makeCrewFixture({ cd: 3 });
    const charge = { id: "charge-1", kind: "item", itemId: "charge", name: "予備電池", asset: "charge", rarity: "std" };
    const coolant = { id: "coolant-1", kind: "item", itemId: "coolant", name: "冷却剤", asset: "coolant", rarity: "std" };
    const game = baseGame({
      phase: "wreck", eventDone: true,
      crew: [crew, null, null], bag: [charge, coolant], bagOpen: true,
    });
    const { container } = await renderGame({ game });

    const chargeCell = byContainsText(container, "予備電池", ".sd-cell");
    const coolantCell = byContainsText(container, "冷却剤", ".sd-cell");
    expect(chargeCell, "予備電池のセルが見つからない").toBeTruthy();
    expect(coolantCell, "冷却剤のセルが見つからない").toBeTruthy();
    raceClicks(chargeCell, coolantCell);
    await flush(200);

    const g = readGame();
    expect(g.bag.length, "片方が収納に残ってしまっている(取りこぼし)").toBe(0);
    expect(g.crew[0].cd, "予備電池のCD解除が失われている").toBe(0);
    expect(g.coolTurns, "冷却剤の効果が失われている").toBe(2);
  });
});
