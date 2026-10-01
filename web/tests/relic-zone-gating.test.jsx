// 回帰テスト: ゲームバランスを大きく揺らしうる遺物(スキル再使用待ち-1・毎戦スキル即応・
// 戦闘不能から復帰・被ダメージ上限)は、浅い海域では絶対に出現せず、終盤(海域7以降)まで
// 出現しないことを確認する。安全な11種(強力4種以外の全て)を所持済みにしておくと、
// 残る候補は強力4種のみになるので、浅い海域では遺物ドロップそのものが起きない
// (=強力4種のどれかが浅い海域で紛れ込むことは無い)ことを直接確認できる。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, click, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

const STRONG_RELIC_IDS = ["echoDrive", "pressureCell", "blackBox", "temperedHull"];
// 強力4種以外の全11種(浅い海域から出る安全枠8種 + 中盤解禁の3種)を所持済みにする
const SAFE_OWNED_IDS = [
  "sonarLens", "ballast", "tideGlass", "pressureFin", "gillFilter",
  "driftAnchor", "deepMemory", "toxinFin", "coilHeart", "starCore", "crewNet",
];
const ownedRelics = SAFE_OWNED_IDS.map((id, i) => ({
  id: `owned-${i}`, kind: "relic", relicId: id, name: id, desc: "d", rarity: "std",
}));

function bossFixture() {
  return {
    id: "b1", bookId: "bossReef", name: "テストボス", asset: "bossReef",
    hp: 1, maxHp: 500, atk: 1, def: 0, weak: [], resist: [],
    boss: true, anomaly: false, scanned: true, charge: false, summoned: 0,
    burn: false, drain: false, stun: false, paralyzed: 0, paralyzeImmune: 0, burning: 0, exposed: 0,
  };
}

describe("強力な遺物の海域制限", () => {
  it("浅い海域(海域1)のボス撃破では、残る候補が強力4種だけでも遺物がドロップしない", async () => {
    const crew = makeCrewFixture({ type: "harpoon", atk: 999 });
    // depth=5 → 海域1(zoneOf=0)。強力4種の解禁は海域7(zoneOf>=6)からなので出現しない。
    const game = baseGame({
      phase: "battle", crew: [crew], enemies: [bossFixture()], turnIdx: 0,
      depth: 5, node: 0, nodes: ["boss"], relics: ownedRelics,
    });
    const { container } = await renderGame({ meta: { checkpoint: 1, carrySlots: 1, shards: 0, relicSlots: 15 }, game });

    click(byExactText(container, "攻 撃"));
    await flush(1200);

    const g = readGame();
    const drops = g.drops || [];
    expect(drops.some((d) => d.kind === "relic"), "浅い海域なのに(残り候補が強力枠だけの状態で)遺物がドロップしてしまった").toBe(false);
    // 参考: 強力IDのいずれも drops に含まれていないことも明示的に確認
    for (const id of STRONG_RELIC_IDS) {
      expect(drops.some((d) => d.relicId === id), `${id} が浅い海域でドロップしてしまった`).toBe(false);
    }
  });

  it("深い海域(海域7)のボス撃破では、残る候補の強力4種のいずれかがドロップする", async () => {
    const crew = makeCrewFixture({ type: "harpoon", atk: 999 });
    // depth=65 → 海域7(zoneOf=6)。強力4種が解禁される。
    const game = baseGame({
      phase: "battle", crew: [crew], enemies: [bossFixture()], turnIdx: 0,
      depth: 65, node: 0, nodes: ["boss"], relics: ownedRelics,
    });
    const { container } = await renderGame({ meta: { checkpoint: 7, carrySlots: 1, shards: 0, relicSlots: 15 }, game });

    click(byExactText(container, "攻 撃"));
    await flush(1200);

    const g = readGame();
    const drops = g.drops || [];
    const relicDrop = drops.find((d) => d.kind === "relic");
    expect(relicDrop, "深い海域なのに遺物がドロップしなかった(制限が強すぎる可能性)").toBeTruthy();
    expect(STRONG_RELIC_IDS.includes(relicDrop.relicId), "深い海域でドロップした遺物が強力4種以外だった(残り候補は強力4種のみのはず)").toBe(true);
  });
});
