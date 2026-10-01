// 回帰テスト:「レア物資が手に入らない/消える」系の不具合を2パターン確認する。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, byContainsText, click, flush, readGame, readMeta, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("レア物資の取りこぼし対策", () => {
  it("収納に紛れ込んだ異層コア(旧仕様の残骸)を「使う」と継承枠が増える(以前は黙って消えるだけだった)", async () => {
    const legacyCore = { id: "core-1", kind: "item", itemId: "core", name: "異層コア", asset: "core", rarity: "abyss" };
    const game = baseGame({
      phase: "wreck", eventDone: true,
      crew: [makeCrewFixture()], bag: [legacyCore], bagOpen: true,
    });
    const { container } = await renderGame({ meta: { carrySlots: 1 }, game });

    const useBtn = byContainsText(container, "異層コア", ".sd-cell");
    expect(useBtn, "異層コアのセルが見つからない").toBeTruthy();
    click(useBtn);
    await flush();

    const meta = readMeta();
    const g = readGame();
    expect(meta.carrySlots).toBe(2); // 以前は 1 のまま(黙って消えるだけ)だった
    expect(g.bag.some((x) => x.id === "core-1")).toBe(false);
  });

  it("収納が満杯の時にレア物資を回収しようとしても、消えずにドロップ欄に残る", async () => {
    const filler = Array.from({ length: 12 }, (_, i) => ({
      id: `f${i}`, kind: "item", itemId: "medkit", name: "救命キット", asset: "medkit", rarity: "std",
    }));
    const rareDrop = {
      id: "rare-1", kind: "gear", slot: "suit", band: "shallow",
      name: "レア耐圧服", rarity: "rare", asset: "suit_shallow_3", hp: 20, atk: 0, def: 4,
    };
    const game = baseGame({
      phase: "spoils", eventDone: true,
      crew: [makeCrewFixture()], bag: filler, drops: [rareDrop],
    });
    const { container } = await renderGame({ meta: {}, game });

    const takeBtn = byContainsText(container, "レア耐圧服", ".sd-cell");
    expect(takeBtn, "レア耐圧服のセルが見つからない").toBeTruthy();
    click(takeBtn);
    await flush();

    const g = readGame();
    // 収納が満杯なら回収されず、次に空きができた時のためにドロップ欄に残り続ける
    expect(g.drops.some((d) => d.id === "rare-1")).toBe(true);
    expect(g.bag.some((x) => x.id === "rare-1")).toBe(false);
    // full フラグは画面上の警告表示にのみ使われ、g.full 自体はオートセーブの対象外
    // なので(readGame ではなく)実際に描画された警告文言で確認する。
    expect(container.textContent).toContain("収納に空きがありません");
  });
});
