// 回帰テスト: スキルツリーの購入が非原子的な check-then-write
// (metaRef.current を同期的に読んでから setMeta する)になっていると、
// 異なる2つのスキルをほぼ同時に購入確定した際に片方の購入が黙って消えることがある。
// buySkill を functional updater 化した修正の回帰確認。
//
// 画面は中心の核から6系統が枝分かれする円環ツリー(.sd-sktree-node、アイコンのみ)で、
// ノードをタップすると下の詳細パネルに名称・説明・「習得する」ボタンが出る
// (以前のカテゴリタブ+縦一覧+右下固定ボタンは廃止)。
import { describe, it, expect } from "vitest";
import { renderGame, byAriaLabel, byExactText, byContainsText, click, flush, readMeta } from "./helpers.jsx";

describe("スキルツリーの購入", () => {
  it("2つの異なるスキルを続けて購入すると、両方とも習得済みになり残響片は合計コスト分だけ減る", async () => {
    const { container } = await renderGame({ meta: { shards: 20 } });

    const openBtn = byContainsText(container, "スキル", ".sd-hometab");
    expect(openBtn, "「スキルツリー」ボタンが見つからない").toBeTruthy();
    click(openBtn);
    await flush();

    // 1つ目: 徹甲の心得(kinI, cost 3, 前提なし)を円環ノードから選択して習得する
    const node1 = byAriaLabel(container, "徹甲の心得", ".sd-sktree-node");
    expect(node1, "徹甲の心得のノードが見つからない").toBeTruthy();
    click(node1);
    await flush();
    let acquireBtn = byExactText(container, "習得する");
    expect(acquireBtn, "詳細パネルの「習得する」ボタンが見つからない").toBeTruthy();
    click(acquireBtn);
    await flush();

    let meta = readMeta();
    expect(meta.skills?.kinI).toBe(true);
    expect(meta.shards).toBe(17); // 20 - 3

    // 2つ目: 熱量の心得(thrI, cost 3, 前提なし)
    const node2 = byAriaLabel(container, "熱量の心得", ".sd-sktree-node");
    expect(node2, "熱量の心得のノードが見つからない").toBeTruthy();
    click(node2);
    await flush();
    acquireBtn = byExactText(container, "習得する");
    expect(acquireBtn, "詳細パネルの「習得する」ボタンが見つからない(2回目)").toBeTruthy();
    click(acquireBtn);
    await flush();

    meta = readMeta();
    // 1つ目の購入が消えていないか(黙って上書きされていないか)を確認
    expect(meta.skills?.kinI).toBe(true);
    expect(meta.skills?.thrI).toBe(true);
    expect(meta.shards).toBe(14); // 20 - 3 - 3
  });
});
