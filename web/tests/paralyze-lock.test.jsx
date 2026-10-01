// 回帰テスト(実バグ): 電纜技師の「連鎖放電」(麻痺2ターン、技のCD2)は、以前は麻痺が
// 解けたのと同じタイミングで再使用が間に合ってしまい、ボスを一切行動させないまま
// 一方的に殴り倒せる「はめ殺し」が成立した。麻痺が解けた直後は対象に2ターンの
// 麻痺耐性がつくよう修正し、CD短縮(反響機関)や複数の電纜技師を使い回しても
// 永久ロックできないことを確認する。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, click, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("麻痺のはめ殺し対策", () => {
  it("連鎖放電を使い続けても、ボスはいずれ必ず行動できる(クルーが被弾する)", async () => {
    const cabler = makeCrewFixture({ id: "c1", type: "cabler", atk: 15, hp: 200, maxHp: 200 });
    const boss = {
      id: "boss1", bookId: "bossMagnet", name: "テストボス", asset: "bossMagnet",
      hp: 100000, maxHp: 100000, atk: 8, def: 0, weak: [], resist: [],
      boss: true, anomaly: false, scanned: true, charge: false, summoned: 0, final: false,
      summons: [], summonLine: "", chargeLine: "……", bigLine: "!!",
      burn: false, drain: false, stun: false, paralyzed: 0, paralyzeImmune: 0, exposed: 0,
    };
    // 反響機関(CD短縮)を持たせ、最も再使用間隔が短い(=最も「はめ殺し」に有利な)状況で検証する
    const relics = [{ id: "r1", kind: "relic", relicId: "echoDrive", name: "反響機関", desc: "d", rarity: "deep" }];
    const game = baseGame({ phase: "battle", crew: [cabler], enemies: [boss], turnIdx: 0, relics });
    const { container } = await renderGame({ game });

    let everDamaged = false;
    for (let i = 0; i < 12; i++) {
      const skillBtn = container.querySelector(".sd-btn.amber.sd-btn-lg");
      const atkBtn = byExactText(container, "攻 撃");
      const btn = (skillBtn && !skillBtn.disabled) ? skillBtn : atkBtn;
      if (!btn || btn.disabled) break;
      click(btn);
      await flush(1200);
      const g = readGame();
      if (!g || g.phase !== "battle") break;
      if (g.crew[0].hp < 200) { everDamaged = true; break; }
    }
    expect(everDamaged, "12ターン連鎖放電を撃ち続けても一度もボスの攻撃を受けなかった(はめ殺しが成立している)").toBe(true);
  }, 20000);
});
