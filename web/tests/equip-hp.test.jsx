// 回帰テスト: 装備の着脱まわり(refreshHp のHP計算 / 「外して収納」の複製)。
// どちらも実際にダンジョンローグで観測された「増幅バグ」「アイテム複製」と同種の不具合。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, byContainsText, click, flush, readGame, makeCrewFixture, makeGearFixture, baseGame } from "./helpers.jsx";

describe("装備の着脱", () => {
  it("HP装備を着脱しても現在HPが際限なく回復しない(refreshHp の複製バグの回帰)", async () => {
    const crew = makeCrewFixture({ hp: 50, maxHp: 100, baseMaxHp: 100 });
    const gear = makeGearFixture({ hp: 20 });
    const game = baseGame({ crew: [crew, null, null], bag: [gear], bagOpen: true });
    const { container } = await renderGame({ game });

    // 1) 装備する(バッグの装備セルをタップ → 装着先を選ぶ)
    const gearCell = byContainsText(container, gear.name, ".sd-cell");
    expect(gearCell, "装備セルが見つからない").toBeTruthy();
    click(gearCell);
    await flush();
    const equipBtn = byExactText(container, "装着する");
    expect(equipBtn, "「装着する」ボタンが見つからない").toBeTruthy();
    click(equipBtn);
    await flush();

    let g = readGame();
    expect(g.crew[0].maxHp).toBe(120); // 100 + 20
    expect(g.crew[0].hp).toBe(70);     // 50 + 20(装備した分だけ上がる)

    // 2) 外して収納する
    const unequipBtn = byExactText(container, "装備を外して収納");
    expect(unequipBtn, "「外して収納」ボタンが見つからない").toBeTruthy();
    click(unequipBtn);
    await flush();

    g = readGame();
    expect(g.crew[0].maxHp).toBe(100); // 装備前の値に戻る
    expect(g.crew[0].hp).toBe(50);     // ここが Math.max(0, diff) バグだと 70 のまま(無料回復)になっていた
    expect(g.bag.length).toBe(1);      // 装備は収納へ1個だけ戻る

    // 3) 再度装備 → 外す、を繰り返しても HP がドリフト(じわ増え)しないことを確認
    for (let i = 0; i < 3; i++) {
      const cell = byContainsText(container, gear.name, ".sd-cell");
      click(cell); await flush();
      const eq = byExactText(container, "装着する");
      click(eq); await flush();
      g = readGame();
      expect(g.crew[0].hp).toBe(70);
      expect(g.crew[0].maxHp).toBe(120);

      const uneq = byExactText(container, "装備を外して収納");
      click(uneq); await flush();
      g = readGame();
      expect(g.crew[0].hp).toBe(50);
      expect(g.crew[0].maxHp).toBe(100);
    }
  });

  it("「外して収納」を連打しても装備が収納に複製されない", async () => {
    const gear = makeGearFixture({ id: "gear-dup", hp: 15 });
    const crew = makeCrewFixture({ hp: 80, maxHp: 100, baseMaxHp: 100, gear });
    const game = baseGame({ crew: [crew, null, null], bag: [], bagOpen: true });
    const { container } = await renderGame({ game });

    const unequipBtn = byExactText(container, "装備を外して収納");
    expect(unequipBtn, "「外して収納」ボタンが見つからない").toBeTruthy();
    // 連打(同じボタンに対して待たずに2回クリック)を再現する
    click(unequipBtn);
    click(unequipBtn);
    await flush();

    const g = readGame();
    expect(g.bag.length).toBe(1); // 2 になっていたら複製バグ
    expect(g.bag[0].id).toBe("gear-dup");
    expect(g.crew[0].gear).toBeNull();
  });
});
