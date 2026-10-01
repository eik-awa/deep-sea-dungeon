// 回帰テスト: 全滅後に「持ち帰る」を選んだ装備・遺物・消耗品(meta.carried、船内ストレージ)は、
// 次の潜航開始時に収納/遺物として実際に反映される。ストレージの枠に収まる分は一度きりの
// 引き継ぎとして消費され、meta.carried から取り除かれる(消費を忘れると、以後すべての
// 潜航開始のたびに同じ装備が無限に再付与されてしまう)。
// carrySlots:2 にして、装備・消耗品(carryN=2)の両方が今回の潜航に収まるようにしている
// (収まらない分はストレージに残るのが仕様なので、全部収まるケースで「空になる」ことを確認する)。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, byContainsText, click, flush, readGame, readMeta, baseGame } from "./helpers.jsx";

describe("持ち帰り品の潜航への反映", () => {
  it("meta.carried の装備・遺物・消耗品が潜航開始時に収納/遺物へ入り、枠に収まった分は meta.carried から消費される", async () => {
    const carriedGear = { id: "carry-gear", kind: "gear", slot: "suit", band: "shallow", name: "持ち帰り耐圧服", rarity: "rare", asset: "suit_shallow_3", hp: 15, atk: 0, def: 3 };
    const carriedRelic = { id: "carry-relic", kind: "relic", relicId: "coilHeart", name: "螺旋の心臓", desc: "弱点を突いた時のダメージ倍率+0.25。", rarity: "rare" };
    // 実バグ回帰: 以前は startDive が kind==="gear"/"relic" しか見ておらず、
    // 持ち帰り一覧に出て確定したはずの消耗品(kind==="item")が黙って消えていた。
    const carriedConsumable = { id: "carry-item", kind: "item", itemId: "torpedo", name: "小型魚雷", asset: "torpedo", rarity: "rare" };
    const { container } = await renderGame({ meta: { checkpoint: 1, carrySlots: 2, carried: [carriedGear, carriedRelic, carriedConsumable] } });

    const startBtn = byExactText(container, "潜 航 開 始");
    expect(startBtn, "タイトルの潜航開始ボタンが見つからない").toBeTruthy();
    click(startBtn);
    await flush();

    const recBtn = byExactText(container, "推奨編成");
    expect(recBtn, "推奨編成ボタンが見つからない").toBeTruthy();
    click(recBtn);
    await flush();

    const diveBtn = byContainsText(container, "人で潜航する", "button");
    expect(diveBtn, "潜航開始ボタンが見つからない").toBeTruthy();
    click(diveBtn);
    await flush(200);

    const g = readGame();
    // startDive は持ち帰り品に新しい id を振り直す(id 衝突防止のため)ので、名前で照合する
    expect(g.bag.some((x) => x.name === "持ち帰り耐圧服"), "持ち帰った装備が収納に入っていない").toBe(true);
    expect(g.relics.some((x) => x.name === "螺旋の心臓"), "持ち帰った遺物が反映されていない").toBe(true);
    expect(g.bag.some((x) => x.name === "小型魚雷"), "持ち帰った消耗品が収納に入っていない(アイテム消失)").toBe(true);

    const meta = readMeta();
    expect(meta.carried, "meta.carried が消費されず残っている(次回以降も再付与されてしまう)").toEqual([]);
  });
});
