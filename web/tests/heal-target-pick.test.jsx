// 回帰テスト: 回復系消耗品(medkit)は対象クルーを選んでから初めて効果が適用される。
// 対象選択オーバーレイが出た時点ではまだアイテムは消費されない。
import { describe, it, expect } from "vitest";
import { renderGame, byContainsText, byExactText, click, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("回復アイテムの対象選択", () => {
  it("使用ボタンでは即座に消費されず、対象を選んで初めて回復・消費される", async () => {
    const crew = makeCrewFixture({ hp: 50, maxHp: 100 });
    const medkit = { id: "mk-1", kind: "item", itemId: "medkit", name: "救命キット", asset: "medkit", rarity: "std" };
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [crew], bag: [medkit], bagOpen: true });
    const { container } = await renderGame({ game });

    const cell = byContainsText(container, "救命キット", ".sd-cell");
    click(cell);
    await flush();

    expect(container.textContent, "対象選択オーバーレイが出ていない").toContain("誰に使う?");
    let g = readGame();
    expect(g.bag.some((x) => x.id === "mk-1"), "対象を選ぶ前なのにもう消費されている").toBe(true);

    const useBtn = byExactText(container, "このクルーに使う");
    expect(useBtn, "「このクルーに使う」ボタンが見つからない").toBeTruthy();
    click(useBtn);
    await flush();

    g = readGame();
    expect(g.crew[0].hp).toBe(95); // 50 + round(100*0.45)
    expect(g.bag.some((x) => x.id === "mk-1")).toBe(false);
  });
});
