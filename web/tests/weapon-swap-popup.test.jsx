// 回帰テスト: 武器の入れ替えは武器だけのポップアップから、2人をタップして行える
// (収納画面のスクロール領域内でのドラッグはスクロールと競合するため)。装備(c.gear)は動かない。
import { describe, it, expect } from "vitest";
import { renderGame, byContainsText, click, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("武器の入れ替えポップアップ", () => {
  it("2人をタップすると武器だけが入れ替わり、防具はそのまま", async () => {
    const w = { id: "w1", kind: "gear", slot: "weapon", band: "shallow", name: "銛A", rarity: "std", asset: "weapon_shallow_1", hp: 0, atk: 5, def: 0 };
    const s = { id: "s1", kind: "gear", slot: "suit", band: "shallow", name: "服A", rarity: "std", asset: "suit_shallow_1", hp: 5, atk: 0, def: 1 };
    const a = makeCrewFixture({ id: "ca", name: "甲", weapon: w, gear: s });
    const b = makeCrewFixture({ id: "cb", name: "乙", weapon: null, gear: null });
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [a, b], bagOpen: true });
    const { container } = await renderGame({ game });
    click(byContainsText(container, "武器入れ替え", "button"));
    await flush();
    click(container.querySelector('[data-wsw-id="ca"]'));
    await flush();
    click(container.querySelector('[data-wsw-id="cb"]'));
    await flush(300);
    const g = readGame();
    expect(g.crew[0].weapon).toBeNull();
    expect(g.crew[1].weapon?.id).toBe("w1");
    expect(g.crew[0].gear?.id).toBe("s1");
  });
});
