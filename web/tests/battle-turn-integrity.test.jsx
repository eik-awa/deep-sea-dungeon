// 回帰テスト: 戦闘の1ターンの整合性。
// 1) 攻撃ボタンを連打しても、actLockRef により1ターンに複数回攻撃が成立しない。
// 2) ボスの召喚は仕様上の上限(最大2回・場の敵3体まで)を超えない。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, click, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("戦闘ターンの整合性", () => {
  it("攻撃ボタンを連打しても1ターンに複数回攻撃が成立しない(敵の被ダメは1回分)", async () => {
    const crew = makeCrewFixture({ type: "harpoon", atk: 20 });
    const enemy = {
      id: "e1", bookId: "diagBook", name: "テスト敵", asset: "lanternfish",
      hp: 500, maxHp: 500, atk: 1, def: 0, weak: [], resist: [],
      poison: false, burn: false, drain: false, stun: false,
      scanned: false, paralyzed: 0, burning: 0, exposed: 0, anomaly: false, boss: false,
    };
    const game = baseGame({ phase: "battle", crew: [crew], enemies: [enemy], turnIdx: 0 });
    const { container } = await renderGame({ game });

    const atkBtn = byExactText(container, "攻 撃");
    // 間に await を挟まず連打する
    click(atkBtn); click(atkBtn); click(atkBtn);
    await flush(1200);

    const g = readGame();
    const dealt = 500 - g.enemies[0].hp;
    // harpoon の通常攻撃1回分は atk(20) 前後のダメージ(乱数弱点判定なし想定でおよそ20)。
    // 3回分成立していたら60前後になるはずなので、1回分(概ね40未満)であることを確認する。
    expect(dealt, `想定より大きいダメージが記録されている(連打で複数回成立した疑い): ${dealt}`).toBeLessThan(40);
  });

  it("ボスの召喚は最大2回・場の敵は常に3体以下に収まる", async () => {
    // 召喚閾値(55%)のすぐ上からスタートし、数ターンの通常攻撃で確実に召喚条件を跨がせる
    const crew = makeCrewFixture({ type: "harpoon", atk: 30 });
    const boss = {
      id: "boss1", bookId: "bossKraken", name: "テストボス", asset: "bossKraken",
      hp: 580, maxHp: 1000, atk: 1, def: 0, weak: [], resist: [],
      boss: true, anomaly: false, scanned: true, charge: false, summoned: 0, final: false,
      summons: ["lanternfish", "hatchetfish"], summonLine: "群れが呼び寄せられた!",
      chargeLine: "……", bigLine: "!!",
      burn: false, drain: false, stun: false, paralyzed: 0, burning: 0, exposed: 0,
    };
    const game = baseGame({ phase: "battle", crew: [crew], enemies: [boss], turnIdx: 0 });
    const { container } = await renderGame({ game });

    // 敵が単体のうちは「攻撃」が自動でボスへ向く。召喚が起きて敵が複数になった後の
    // ターンはターゲット選択(照準)モードに入るため、ここでは「召喚が1回起き、その時点で
    // 場の敵が3体を超えない」ところまでを確認する(照準UIの操作は別の関心事)。
    let maxSummoned = 0;
    for (let i = 0; i < 4; i++) {
      const atkBtn = byExactText(container, "攻 撃");
      if (!atkBtn || atkBtn.disabled) break;
      click(atkBtn);
      await flush(1200);
      const g = readGame();
      if (!g || g.phase !== "battle") break;
      expect(g.enemies.length, "場の敵が3体を超えている").toBeLessThanOrEqual(3);
      const summonedCount = g.enemies.find((e) => e.boss)?.summoned ?? 0;
      maxSummoned = Math.max(maxSummoned, summonedCount);
      expect(summonedCount, "ボスの召喚回数が上限(2回)を超えている").toBeLessThanOrEqual(2);
      if (summonedCount >= 1) break; // 召喚を確認できたので、以降の照準UIは別テストの関心事
    }
    expect(maxSummoned, "この検証で一度も召喚が起きていない(検証条件を見直す必要がある)").toBeGreaterThanOrEqual(1);
  });
});
