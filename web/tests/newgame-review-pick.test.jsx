// 回帰テスト: 帰還前の確認画面(潜航中の自主撤退・タイトルの「帰還する」どちらの入口でも
// 共通)は、以前は推奨(ロック品優先)で自動計算された一覧を表示するだけで、
// プレイヤーが持ち帰る物を選び直すことができなかった。手動で選択できるようにし、
// 選んだ内容どおりに meta.carried へ反映されることを確認する。
//
// 船内ストレージ(storageN)は種類を問わない共通プールなので、ストレージの空きが少ない時は
// 装備・消耗品・遺物が互いにスコアを取り合う(以前の carryN/relicN 分離プールとは異なる)。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, byContainsText, click, flush, readMeta, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("持ち帰り品の手動選択", () => {
  it("推奨されなかった物を選び直すと、その通りに meta.carried へ反映される", async () => {
    // storageCap=2 のため、3点(遺物・耐圧服・救命キット)のうちスコアが高い2点だけが
    // デフォルトで推奨される想定(遺物・耐圧服はスコアが高く、救命キットが漏れる)。
    const relicItem = { id: "relic-1", kind: "relic", relicId: "coilHeart", name: "螺旋の心臓", desc: "d", rarity: "rare" };
    const gearItem = { id: "gear-1", kind: "gear", slot: "suit", band: "shallow", name: "上等な耐圧服", rarity: "rare", asset: "suit_shallow_3", hp: 30, atk: 5, def: 8 };
    const cheapItem = { id: "item-1", kind: "item", itemId: "medkit", name: "救命キット", asset: "medkit", rarity: "std" };
    const crew = makeCrewFixture({ gear: null });
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [crew], bag: [gearItem, cheapItem], relics: [relicItem], bagOpen: true });
    const { container } = await renderGame({ meta: { storageCap: 2 }, game });

    click(byContainsText(container, "潜航をやめて母船へ戻る", "button"));
    await flush();

    const relicCell = byContainsText(container, "螺旋の心臓", ".sd-cell");
    const gearCell = byContainsText(container, "上等な耐圧服", ".sd-cell");
    const itemCell = byContainsText(container, "救命キット", ".sd-cell");
    expect(relicCell.textContent, "スコアの高い遺物が推奨されているはずが違う").toContain("✓ 持ち帰る");
    expect(gearCell.textContent, "スコアの高い耐圧服が推奨されているはずが違う").toContain("✓ 持ち帰る");
    expect(itemCell.textContent, "ストレージが埋まっているのに救命キットまで推奨されている").toContain("選択する");

    // 手動で選び直す: 耐圧服を外し、救命キットを選ぶ(枠は2のまま)
    click(gearCell);
    click(itemCell);
    await flush();

    click(byExactText(container, "この内容で帰還する"));
    await flush();

    const meta = readMeta();
    expect(meta.carried?.some((x) => x.name === "救命キット"), "選び直した物が反映されていない").toBe(true);
    expect(meta.carried?.some((x) => x.name === "上等な耐圧服"), "選択を外した物が反映されてしまっている").toBe(false);
    expect(meta.carried?.some((x) => x.name === "螺旋の心臓"), "触れていない遺物が消えている").toBe(true);
    expect(meta.carried?.length, "船内ストレージの枠(2)を超えて持ち帰られている").toBe(2);
  });
});
