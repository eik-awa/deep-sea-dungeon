// 回帰テスト: 継承枠(全滅時に持ち帰れる装備・消耗品の数、meta.carrySlots)は
// 「ボスを倒しても増え続けるのは避けたい」という要望により、ボス撃破からは一切増やさない
// 方針に統一した。増やせるのは異常個体からのみ落ちるレアアイテム「異層コア」だけ。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, byContainsText, click, flush, readMeta, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("異層コアは継承枠を永続的に+1する唯一の手段", () => {
  it("ドロップ欄から異層コアを拾うと継承枠が+1され、残響片は増えない", async () => {
    const drop = { id: "core-1", kind: "item", itemId: "core", name: "異層コア", asset: "core", rarity: "abyss" };
    const game = baseGame({
      phase: "spoils", eventDone: true,
      crew: [makeCrewFixture()], bag: [], drops: [drop],
    });
    const { container } = await renderGame({ meta: { carrySlots: 1, shards: 0 }, game });

    const cell = byContainsText(container, "異層コア", ".sd-cell");
    expect(cell, "異層コアのセルが見つからない").toBeTruthy();
    click(cell);
    await flush();

    const meta = readMeta();
    expect(meta.carrySlots, "異層コアを拾っても継承枠が増えていない").toBe(2);
    expect(meta.shards, "異層コアが残響片に化けてしまっている").toBe(0);
  });

  it("「すべて回収」で異層コアを2個同時に拾っても、取りこぼさず2個分とも積み上がる", async () => {
    const drops = [
      { id: "core-1", kind: "item", itemId: "core", name: "異層コア", asset: "core", rarity: "abyss" },
      { id: "core-2", kind: "item", itemId: "core", name: "異層コア", asset: "core", rarity: "abyss" },
    ];
    const game = baseGame({
      phase: "spoils", eventDone: true,
      crew: [makeCrewFixture()], bag: [], drops,
    });
    const { container } = await renderGame({ meta: { carrySlots: 1 }, game });

    click(byExactText(container, "すべて回収"));
    await flush();

    const meta = readMeta();
    expect(meta.carrySlots).toBe(3);
  });
});
