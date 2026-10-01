// 回帰テスト(実バグ): 「海域を選んで再挑戦」で既にクリア済みの海域のボスを何度倒しても、
// 以前は毎回無条件で carrySlots(持ち帰り枠の永続上限)+1・残響片+3 が入り続け、
// 簡単な海域を周回するだけで難易度が無意味になっていた。
// その後の仕様変更で、ボス撃破からは carrySlots(継承枠)を一切増やさない方針に統一した
// (継承枠は異層コアというレアアイテムからのみ増える)。代わりに初回撃破の残響片(スキル
// ツリー通貨)を 3→6 に増額して、初回撃破の達成感を確保している。初回撃破時だけ満額の
// 残響片が入り、再撃破(checkpoint より手前の海域)では carrySlots は変わらず、残響片も
// ごくわずかしか得られないことを確認する。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, click, flush, readMeta, makeCrewFixture, baseGame } from "./helpers.jsx";

function bossFixture() {
  return {
    id: "b1", bookId: "bossReef", name: "テストボス", asset: "bossReef",
    hp: 1, maxHp: 500, atk: 1, def: 0, weak: [], resist: [],
    boss: true, anomaly: false, scanned: true, charge: false, summoned: 0,
    burn: false, drain: false, stun: false, paralyzed: 0, paralyzeImmune: 0, burning: 0, exposed: 0,
  };
}

describe("ボス撃破報酬の周回対策", () => {
  it("初回撃破(checkpoint以上の海域)では残響片+6が満額入り、carrySlotsは変わらない", async () => {
    const crew = makeCrewFixture({ type: "harpoon", atk: 999 });
    const game = baseGame({
      phase: "battle", crew: [crew], enemies: [bossFixture()], turnIdx: 0,
      depth: 10, node: 0, nodes: ["boss"],
    });
    const { container } = await renderGame({ meta: { checkpoint: 1, carrySlots: 1, shards: 0 }, game });

    click(byExactText(container, "攻 撃"));
    await flush(1200);

    const meta = readMeta();
    expect(meta.carrySlots, "ボス撃破だけで carrySlots が増えてしまっている(継承枠は異層コアからのみ増える方針)").toBe(1);
    expect(meta.shards, "初回撃破なのに満額の残響片が入っていない").toBe(6);
  });

  it("再挑戦での再撃破(checkpointより手前の海域)は carrySlots が増えず、残響片もごくわずかになる", async () => {
    const crew = makeCrewFixture({ type: "harpoon", atk: 999 });
    const game = baseGame({
      phase: "battle", crew: [crew], enemies: [bossFixture()], turnIdx: 0,
      depth: 10, node: 0, nodes: ["boss"],
    });
    // checkpoint=3 は「海域2まで既にクリア済み」を意味する。ここで海域1(depth=10)の
    // ボスを再挑戦で倒しても、それは既にクリア済みの海域の周回にあたる。
    const { container } = await renderGame({ meta: { checkpoint: 3, carrySlots: 1, shards: 0 }, game });

    click(byExactText(container, "攻 撃"));
    await flush(1200);

    const meta = readMeta();
    expect(meta.carrySlots, "既にクリア済みの海域を周回しただけで carrySlots が増えてしまっている(周回対策が効いていない)").toBe(1);
    expect(meta.shards, "既にクリア済みの海域の周回報酬が満額(6)になってしまっている").toBe(1);
    // checkpoint 自体は据え置き(後退させない)
    expect(meta.checkpoint).toBe(3);
  });
});
