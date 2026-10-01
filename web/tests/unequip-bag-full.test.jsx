// 回帰テスト(実バグ): 装備を外そうとした時に収納が満杯だと、以前はチェックが無く
// タップしても何も起きないように見えていた(実際には収納の上限を超えて追加されていた)。
// 満杯なら外さず、エラーをログに表示することを確認する。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, click, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("収納満杯時の装備解除", () => {
  it("収納が満杯だと「外して収納」を押しても外れず、エラーが表示される", async () => {
    const gear = { id: "gear-1", kind: "gear", slot: "suit", band: "shallow", name: "テスト装備", rarity: "std", asset: "suit_shallow_1", hp: 5, atk: 0, def: 1 };
    const crew = makeCrewFixture({ gear });
    // BAG_CAP_BASE は既定12(スキル未購入)なので、12個埋めて満杯にする
    const bag = Array.from({ length: 12 }, (_, i) => ({
      id: `filler-${i}`, kind: "item", itemId: "medkit", name: `詰め物${i}`, asset: "medkit", rarity: "std",
    }));
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [crew], bag, bagOpen: true });
    const { container } = await renderGame({ game });

    const unequipBtn = byExactText(container, "装備を外して収納");
    expect(unequipBtn, "「外して収納」ボタンが見つからない").toBeTruthy();
    click(unequipBtn);
    await flush();

    expect(container.textContent, "満杯時のエラーメッセージが表示されていない").toContain("収納がいっぱいです");

    const g = readGame();
    expect(g.crew[0].gear?.name, "満杯なのに装備が外れてしまっている").toBe("テスト装備");
    expect(g.bag.length, "満杯なのに収納へ追加されてしまっている(上限超過)").toBe(12);
  });
});
