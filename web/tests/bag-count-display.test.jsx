// 回帰テスト: 収納の残数表示(N/M)が実データ(g.bag.length / bagCap)と一致する。
import { describe, it, expect } from "vitest";
import { renderGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("収納の残数表示", () => {
  it("収納内のアイテム数と表示されるN/Mが一致する", async () => {
    const items = Array.from({ length: 4 }, (_, i) => ({
      id: `i${i}`, kind: "item", itemId: "medkit", name: "救命キット", asset: "medkit", rarity: "std",
    }));
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [makeCrewFixture()], bag: items, bagOpen: true });
    const { container } = await renderGame({ game });

    const lab = Array.from(container.querySelectorAll(".sd-lab")).find((el) => el.textContent.startsWith("収納"));
    expect(lab, "収納の残数ラベルが見つからない").toBeTruthy();
    expect(lab.textContent).toContain("収納 (4/12)"); // bagCap は既定12(スキル未購入)
  });
});
