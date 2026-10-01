// 回帰テスト: 遺物が実質ほぼ継承できなかったバグの修正確認。
// 以前は「回収枠」(carryN、初期値1)を装備・消耗品・遺物が一本のプールとして取り合っており、
// carryN=1 のような序盤では、遺物枠(relicN)を伸ばして複数の遺物を運用していても、
// 死亡時にどれか1つ(スコアが一番高い物)しか持ち帰れなかった。
// 遺物は装備・消耗品(carryN)と独立した別枠(relicN)を持つように修正し、carryN=1 のままでも
// 遺物枠いっぱいまで独立して持ち帰れることを確認する。
// relicN の既定値は1だが(浅い海域での難易度が遺物運用数に左右されすぎないよう抑えてある)、
// このテストでは「2枠とも独立して持ち帰れる」ことを検証したいので meta.relicSlots を明示している。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, byContainsText, click, flush, readMeta, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("遺物の継承(全滅時)", () => {
  it("carryN=1 でも、遺物枠いっぱいまで独立して持ち帰れる", async () => {
    const relic1 = { id: "relic-1", kind: "relic", relicId: "coilHeart", name: "螺旋の心臓", desc: "d", rarity: "rare" };
    const relic2 = { id: "relic-2", kind: "relic", relicId: "tideGlass", name: "潮汐硝子", desc: "d", rarity: "rare" };
    const cheapItem = { id: "item-1", kind: "item", itemId: "medkit", name: "救命キット", asset: "medkit", rarity: "std" };
    const crew = makeCrewFixture({ gear: null });
    const game = baseGame({ phase: "lost", eventDone: true, crew: [crew], relics: [relic1, relic2], bag: [cheapItem], pick: [] });
    const { container } = await renderGame({ meta: { carrySlots: 1, relicSlots: 2 }, game });

    // 「推奨」で自動選択させる(死亡直後と同じ計算経路)
    click(byExactText(container, "推奨"));
    await flush();

    const relic1Cell = byContainsText(container, "螺旋の心臓", ".sd-cell");
    const relic2Cell = byContainsText(container, "潮汐硝子", ".sd-cell");
    const itemCell = byContainsText(container, "救命キット", ".sd-cell");
    expect(relic1Cell.textContent, "遺物1が推奨されていない").toContain("✓ 持ち帰る");
    expect(relic2Cell.textContent, "遺物2が推奨されていない(carryN側に食われている疑い)").toContain("✓ 持ち帰る");
    // carryN=1 の枠は装備・消耗品側で唯一の候補である救命キットに使われる(遺物とは別枠のため競合しない)
    expect(itemCell.textContent, "消耗品側の枠が遺物に食われて空いていない").toContain("✓ 持ち帰る");

    click(byExactText(container, "浮上して再編成する"));
    await flush();

    const meta = readMeta();
    const carriedRelics = (meta.carried || []).filter((x) => x.kind === "relic");
    expect(carriedRelics.length, "遺物が2つとも持ち帰れていない").toBe(2);
    expect((meta.carried || []).some((x) => x.name === "救命キット"), "消耗品側の持ち帰りが遺物に食われて消えている").toBe(true);
  });
});
