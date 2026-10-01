// 回帰テスト: 船内ストレージ(meta.carried)。
// - 既定の上限は50、スキル(船倉拡張I/II)でさらに拡張できる
// - 潜航開始時は、ストレージのうちスコアの高い物から carryN/relicN 件だけが積み込まれ、
//   選ばれなかった残りはストレージに残る(以前は毎回ストレージを丸ごと空にしていた)
// - 「倉庫」タブでストレージの中身を確認・個別に捨てられる
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, byContainsText, click, flush, readGame, readMeta } from "./helpers.jsx";

function gearFixture(id, name, rarity = "std") {
  return { id, kind: "gear", slot: "suit", band: "shallow", name, rarity, asset: "suit_shallow_1", hp: 1, atk: 0, def: 0 };
}

describe("船内ストレージの容量", () => {
  it("スキル未取得では50、船倉拡張I/IIを取ると80まで表示される", async () => {
    const { container } = await renderGame({ meta: {} });
    click(byContainsText(container, "倉庫", ".sd-hometab"));
    await flush();
    expect(container.textContent).toContain("0/50");

    const { container: c2 } = await renderGame({ meta: { skills: { storageI: true, storageII: true } } });
    click(byContainsText(c2, "倉庫", ".sd-hometab"));
    await flush();
    expect(c2.textContent).toContain("0/80");
  });
});

describe("潜航開始時のストレージからの積み込み", () => {
  it("carryN件だけが積み込まれ、選ばれなかった残りはストレージに残る", async () => {
    // carrySlots=1 なので装備・消耗品側は1点しか積み込まれない。レア度の高い方が優先される。
    const highRarity = gearFixture("g-high", "高級耐圧服", "rare");
    const lowRarity = gearFixture("g-low", "並耐圧服", "std");
    const { container } = await renderGame({ meta: { checkpoint: 1, carrySlots: 1, carried: [highRarity, lowRarity] } });

    click(byExactText(container, "潜 航 開 始"));
    await flush();
    click(byExactText(container, "推奨編成"));
    await flush();
    click(byContainsText(container, "人で潜航する", "button"));
    await flush(200);

    const g = readGame();
    expect(g.bag.some((x) => x.name === "高級耐圧服"), "スコアの高い方が積み込まれていない").toBe(true);
    expect(g.bag.some((x) => x.name === "並耐圧服"), "枠を超えた分まで積み込まれてしまっている").toBe(false);

    const meta = readMeta();
    expect(meta.carried?.some((x) => x.name === "並耐圧服"), "選ばれなかった物がストレージから消えている").toBe(true);
    expect(meta.carried?.some((x) => x.name === "高級耐圧服"), "積み込まれた物がストレージにまだ残っている").toBe(false);
  });
});

describe("倉庫タブ", () => {
  it("ストレージの中身が見え、タップで1点だけ捨てられる", async () => {
    const item = gearFixture("g1", "捨てたい装備");
    const { container } = await renderGame({ meta: { carried: [item] } });

    click(byContainsText(container, "倉庫", ".sd-hometab"));
    await flush();
    expect(container.textContent).toContain("捨てたい装備");
    expect(container.textContent).toContain("1/50");

    click(byContainsText(container, "捨てたい装備", ".sd-cell"));
    await flush();

    expect(container.textContent).not.toContain("捨てたい装備");
    expect(readMeta().carried?.length).toBe(0);
  });
});
