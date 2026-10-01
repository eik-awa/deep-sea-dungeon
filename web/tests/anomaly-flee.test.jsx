// 回帰テスト: 異常個体(anomaly)が時間切れで逃走し、それが場の最後の敵だった場合でも
// enemyPhase() の末尾で全滅判定と同じ場所で生存数を再評価し victory() へ正しく遷移する
// (戦闘画面がソフトロックして操作不能にならない)。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, click, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("異常個体の時間切れ逃走", () => {
  it("最後の1体が異常個体で、逃走(fleeIn切れ)しても victory へ遷移し戦闘画面のまま固まらない", async () => {
    const crew = makeCrewFixture({ type: "diver" }); // 攻撃せず防御スキルでターンを消費
    const anomaly = {
      id: "anom1", bookId: "mutant0", name: "テスト変異個体", asset: "driftEye",
      hp: 999, maxHp: 999, atk: 1, def: 0, weak: [], resist: [],
      anomaly: true, fleeIn: 1, boss: false, scanned: true,
      burn: false, drain: false, stun: false, paralyzed: 0, burning: 0, exposed: 0,
    };
    const game = baseGame({ phase: "battle", crew: [crew], enemies: [anomaly], turnIdx: 0 });
    const { container } = await renderGame({ game });

    const skillBtn = container.querySelector(".sd-btn.amber.sd-btn-lg");
    expect(skillBtn, "スキルボタンが見つからない").toBeTruthy();
    click(skillBtn); // diver のスキルは自己完結(耐圧展開)で対象選択不要 → そのままターン消費
    await flush(1500);

    const g = readGame();
    expect(g.phase, "異常個体の逃走後、victory(spoils)へ進まず battle に固まっている").toBe("spoils");
  });
});
