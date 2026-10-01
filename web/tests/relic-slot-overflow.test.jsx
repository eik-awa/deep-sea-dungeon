// 回帰テスト: 遺物枠が満杯の状態で新しい遺物を回収しようとしても、
// 遺物が消えたりせず収納(バッグ)へ退避される(枠不足で黙って消滅しない)。
import { describe, it, expect } from "vitest";
import { renderGame, byContainsText, click, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("遺物枠が満杯の時の回収", () => {
  it("遺物枠が満杯でも、回収した遺物は消えずに収納へ入る", async () => {
    const existingRelics = [
      { id: "r1", kind: "relic", relicId: "coilHeart", name: "螺旋の心臓", desc: "d", rarity: "rare" },
      { id: "r2", kind: "relic", relicId: "ballast", name: "均衡バラスト", desc: "d", rarity: "rare" },
    ];
    const newRelic = { id: "r3", kind: "relic", relicId: "tideGlass", name: "潮汐硝子", desc: "d", rarity: "rare" };
    const game = baseGame({
      phase: "spoils", eventDone: true, crew: [makeCrewFixture()],
      relics: existingRelics, drops: [newRelic], bag: [],
    });
    const { container } = await renderGame({ meta: { relicSlots: 2 }, game });

    const cell = byContainsText(container, "潮汐硝子", ".sd-cell");
    expect(cell, "潮汐硝子のセルが見つからない").toBeTruthy();
    click(cell);
    await flush();

    const g = readGame();
    expect(g.relics.length, "遺物枠の上限を超えて追加されてしまっている").toBe(2);
    const inBag = g.bag.some((x) => x.id === "r3");
    const stillInDrops = g.drops.some((x) => x.id === "r3");
    expect(inBag || stillInDrops, "遺物枠満杯で回収した遺物がどこにも存在せず消えている").toBe(true);
  });
});
