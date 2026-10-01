// 回帰テスト:「すべて回収」で同種の残響片系アイテムを複数まとめて拾うと、
// 再描画を挟まず連続で awardSpecimen/shards 加算が呼ばれるため、
// metaRef の同期読み取りに頼った実装だと後の呼び出しが前の加算を見落として
// 取りこぼす(ダンジョンローグで見られた「増幅/取りこぼし」系と同種の不具合)。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, click, flush, readMeta, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("まとめて回収", () => {
  it("残響片系アイテムを2個同時に回収すると shards が2個分とも積み上がる", async () => {
    const drops = [
      { id: "drop-1", kind: "item", itemId: "shard", name: "記憶結晶", asset: "shard", rarity: "abyss" },
      { id: "drop-2", kind: "item", itemId: "shard", name: "記憶結晶", asset: "shard", rarity: "abyss" },
    ];
    const game = baseGame({
      phase: "spoils", eventDone: true,
      crew: [makeCrewFixture()], bag: [], drops,
    });
    const { container } = await renderGame({ meta: { shards: 0 }, game });

    const btn = byExactText(container, "すべて回収");
    expect(btn, "「すべて回収」ボタンが見つからない").toBeTruthy();
    click(btn);
    await flush();

    const meta = readMeta();
    // 記憶結晶(shardValue: 1 ― バランス調整でレアアイテムは1個=残響片1に統一)を
    // 2個回収 → +2 になるべき。取りこぼしバグだと +1 のまま。
    expect(meta.shards).toBe(2);
  });

  it("標本を2個同時に回収しても採取数が2個分とも積み上がる", async () => {
    const drops = [
      { id: "sp-1", kind: "item", itemId: "specimen", name: "標本", asset: "specimen", rarity: "rare", bookId: "lanternfish" },
      { id: "sp-2", kind: "item", itemId: "specimen", name: "標本", asset: "specimen", rarity: "rare", bookId: "lanternfish" },
    ];
    const game = baseGame({
      phase: "spoils", eventDone: true,
      crew: [makeCrewFixture()], bag: [], drops,
    });
    const { container } = await renderGame({ meta: { specimens: {} }, game });

    const btn = byExactText(container, "すべて回収");
    expect(btn, "「すべて回収」ボタンが見つからない").toBeTruthy();
    click(btn);
    await flush();

    const meta = readMeta();
    // 1個ずつ独立に awardSpecimen(bookId, 1) が呼ばれるので、同一バッチ内でも合計2になるべき。
    expect(meta.specimens?.lanternfish).toBe(2);
  });
});
