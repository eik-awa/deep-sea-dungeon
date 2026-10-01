// 回帰テスト: 標本を採取すると、その種の生態レポートが何段まで進んだかがログに残る。
// SPECIMEN_UNLOCK(3)に到達した時は「解放された」という特別な文言になる。
import { describe, it, expect } from "vitest";
import { renderGame, byContainsText, click, flush, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("標本採取ログの生態レポート段数表示", () => {
  it("1/3 → 2/3 に進んだことがログに残る", async () => {
    const specimen = { id: "sp-1", kind: "item", itemId: "specimen", name: "標本", asset: "specimen", rarity: "rare", bookId: "lanternfish" };
    const game = baseGame({ phase: "spoils", eventDone: true, crew: [makeCrewFixture()], drops: [specimen] });
    const { container } = await renderGame({ meta: { specimens: { lanternfish: 1 } }, game });

    click(byContainsText(container, "標本", ".sd-cell"));
    await flush();

    expect(container.textContent).toContain("提灯魚の生態レポートが 2/3 段まで進んだ。");
  });

  it("3個目で解放された旨がログに残る", async () => {
    const specimen = { id: "sp-2", kind: "item", itemId: "specimen", name: "標本", asset: "specimen", rarity: "rare", bookId: "lanternfish" };
    const game = baseGame({ phase: "spoils", eventDone: true, crew: [makeCrewFixture()], drops: [specimen] });
    const { container } = await renderGame({ meta: { specimens: { lanternfish: 2 } }, game });

    click(byContainsText(container, "標本", ".sd-cell"));
    await flush();

    expect(container.textContent).toContain("提灯魚の生態レポートが解放された(3/3)!");
  });
});
