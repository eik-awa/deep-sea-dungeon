// 回帰テスト: クルーの永久レベル(meta.crewLevels、名簿は職種(type)のみ・全8種で管理)は
// 「強化」画面で持ち越した武器を消費した時だけ上がる(reinforce-overlay.test.jsx で確認)。
// 以前は海域を初めてクリアするだけで連れて行った3人へ自動的に+1レベルが入っていたが、
// 「ボスを倒しても継続的にステータスが伸び続けるのは避けたい」という要望により、この
// 受動的な成長は廃止した。海域・ボスをクリアしても crewLevels が変化しないことを確認する
// (代わりに初回撃破の残響片(スキルツリー通貨)を増額して報酬としている)。
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

describe("クルーの永久レベルはボス撃破・海域クリアからは増えない", () => {
  it("海域を初めてクリアしても、連れて行った3人のレベルは変わらない(代わりに残響片が増える)", async () => {
    const crewA = makeCrewFixture({ id: "crew-a", type: "harpoon", rarity: "elite", atk: 999 });
    const crewB = makeCrewFixture({ id: "crew-b", type: "medic", rarity: "std" });
    const game = baseGame({
      phase: "battle", crew: [crewA, crewB], enemies: [bossFixture()], turnIdx: 0,
      depth: 10, node: 0, nodes: ["boss"],
    });
    const { container } = await renderGame({ meta: { checkpoint: 1, carrySlots: 1, shards: 0 }, game });

    click(byExactText(container, "攻 撃"));
    await flush(1200);

    const meta = readMeta();
    expect(meta.crewLevels?.["harpoon"], "ボス撃破だけでレベルが上がってしまっている").toBeFalsy();
    expect(meta.crewLevels?.["medic"], "ボス撃破だけでレベルが上がってしまっている").toBeFalsy();
    expect(meta.shards, "代わりの報酬である残響片が入っていない").toBeGreaterThan(0);
  });

  it("既にクリア済みの海域の再挑戦(周回)でもレベルは変わらない", async () => {
    const crewA = makeCrewFixture({ id: "crew-a", type: "harpoon", rarity: "elite", atk: 999 });
    const game = baseGame({
      phase: "battle", crew: [crewA], enemies: [bossFixture()], turnIdx: 0,
      depth: 10, node: 0, nodes: ["boss"],
    });
    // checkpoint=3 は「海域2まで既にクリア済み」を意味する。海域1(depth=10)は周回にあたる。
    const { container } = await renderGame({ meta: { checkpoint: 3, carrySlots: 1, shards: 0 }, game });

    click(byExactText(container, "攻 撃"));
    await flush(1200);

    const meta = readMeta();
    expect(meta.crewLevels?.["harpoon"]).toBeFalsy();
  });
});
