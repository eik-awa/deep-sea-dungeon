// 回帰テスト: 攻撃力特化の「武器」枠(c.weapon)。既存の装備枠(c.gear、耐圧服/増幅器)とは
// 独立しており、同じクルーに両方同時に装備できる。戦闘力の計算(crewAtk/crewMaxHp/crewDef)
// にも両方が反映される必要がある。
import { describe, it, expect } from "vitest";
import { renderGame, byContainsText, byExactText, click, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("武器の別枠装備", () => {
  it("装備(suit)と武器(weapon)を同じクルーに同時装備できる", async () => {
    const suit = { id: "suit-1", kind: "gear", slot: "suit", band: "shallow", name: "テスト耐圧服", rarity: "std", asset: "suit_shallow_1", hp: 9, atk: 0, def: 2 };
    const weapon = { id: "weapon-1", kind: "gear", slot: "weapon", band: "shallow", name: "テスト武器", rarity: "std", asset: "weapon_shallow_1", hp: 0, atk: 6, def: 0 };
    const crew = makeCrewFixture({ gear: null });
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [crew], bag: [suit, weapon], bagOpen: true });
    const { container } = await renderGame({ game });

    // 装備(suit)を装着
    click(byContainsText(container, "テスト耐圧服", ".sd-cell"));
    await flush();
    click(byExactText(container, "装着する"));
    await flush();

    let g = readGame();
    expect(g.crew[0].gear?.name, "装備(suit)が装着されていない").toBe("テスト耐圧服");
    expect(g.crew[0].weapon, "武器を装着する前なのに weapon に何か入っている").toBeNull();

    // 続けて武器(weapon)を装着 — 装備枠(gear)を上書きせず、別枠(weapon)に入るはず
    click(byContainsText(container, "テスト武器", ".sd-cell"));
    await flush();
    click(byExactText(container, "装着する"));
    await flush();

    g = readGame();
    expect(g.crew[0].gear?.name, "武器を装着したら装備(suit)が外れてしまっている(別枠になっていない)").toBe("テスト耐圧服");
    expect(g.crew[0].weapon?.name, "武器(weapon)が装着されていない").toBe("テスト武器");
  });

  it("武器のATKは通常攻撃のダメージ計算に反映される", async () => {
    const weapon = { id: "weapon-1", kind: "gear", slot: "weapon", band: "shallow", name: "強力な武器", rarity: "std", asset: "weapon_shallow_1", hp: 0, atk: 50, def: 0 };
    const crewNoWeapon = makeCrewFixture({ id: "crew-a", atk: 10, gear: null, weapon: null });
    const enemy = {
      id: "e1", bookId: "lanternfish", name: "テスト敵", asset: "lanternfish",
      hp: 100000, maxHp: 100000, atk: 1, def: 0, weak: [], resist: [],
      boss: false, anomaly: false, scanned: true,
    };
    const game = baseGame({ phase: "battle", crew: [{ ...crewNoWeapon, weapon }], enemies: [enemy], turnIdx: 0 });
    const { container } = await renderGame({ game });

    click(byExactText(container, "攻 撃"));
    await flush(700);

    const g = readGame();
    // 武器ATK+50 が乗っているため、素の atk(10)だけの時よりずっと大きなダメージが出るはず
    const dealt = 100000 - g.enemies[0].hp;
    expect(dealt, "武器のATKがダメージ計算に反映されていない").toBeGreaterThan(30);
  });
});
