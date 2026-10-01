// 回帰テスト: 行商(ショップ)での鉄屑交換。連打しても二重購入されない・
// 収納が満杯なら鉄屑を消費せず失敗する。
import { describe, it, expect } from "vitest";
import { renderGame, byContainsText, click, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("行商での交換", () => {
  it("ちょうど1回分の鉄屑しかない時に連打しても、2回分は購入できない(残高不足を都度再判定する)", async () => {
    const price = 3; // SHOP_STOCK: medkit price 3(スキル未購入なので割引なし)
    const game = baseGame({ phase: "shop", eventDone: true, crew: [makeCrewFixture()], bag: [], scrapCount: price });
    const { container } = await renderGame({ game });

    const cell = byContainsText(container, "救命キット", ".sd-cell");
    expect(cell, "救命キットのセルが見つからない").toBeTruthy();
    click(cell); click(cell); // 連打(2回目は残高不足のはず)
    await flush();

    const g = readGame();
    expect(g.scrapCount, "残高不足のはずが2回分消費されている(複製バグ)").toBe(0);
    expect(g.bag.filter((x) => x.itemId === "medkit").length).toBe(1);
  });

  it("収納が満杯の時は鉄屑を消費せず購入に失敗する", async () => {
    const filler = Array.from({ length: 12 }, (_, i) => ({
      id: `f${i}`, kind: "item", itemId: "medkit", name: "救命キット", asset: "medkit", rarity: "std",
    }));
    const game = baseGame({ phase: "shop", eventDone: true, crew: [makeCrewFixture()], bag: filler, scrapCount: 10 });
    const { container } = await renderGame({ game });

    const cells = Array.from(container.querySelectorAll(".sd-cell")).filter((el) => el.textContent.includes("救命キット"));
    // ショップ在庫セルは最後(収納のセル群の後)に描画される
    const shopCell = cells[cells.length - 1];
    click(shopCell);
    await flush();

    const g = readGame();
    expect(g.scrapCount, "満杯で失敗したのに鉄屑が減っている").toBe(10);
    expect(g.bag.length).toBe(12);
    expect(container.textContent).toContain("収納に空きがありません");
  });
});
