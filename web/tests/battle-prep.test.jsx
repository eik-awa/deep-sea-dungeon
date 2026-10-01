// 回帰テスト: 深度が切り替わった直後(そのレイヤーの最初の戦闘)は、装備を整理する間も
// なく戦闘に入ってしまい、装備を調整する場が無いという問題があった。実際の戦闘フェーズへ
// 入る前に必ず一度「準備」フェーズ(phase:"prep")を挟み、装備・収納を自由に開けるように
// した上で、プレイヤーが任意のタイミングで戦闘を開始できることを確認する。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, byContainsText, click, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("戦闘前の準備フェーズ", () => {
  it("新しく潜航を開始すると、いきなり戦闘にはならず準備フェーズになる", async () => {
    const { container } = await renderGame({ meta: { checkpoint: 1 } });

    click(byExactText(container, "潜 航 開 始"));
    await flush();
    click(byExactText(container, "推奨編成"));
    await flush();
    click(byContainsText(container, "人で潜航する", "button"));
    await flush(200);

    const g = readGame();
    expect(g.phase, "潜航直後がいきなり battle になっている(準備の間が無い)").toBe("prep");
    expect(g.enemies.length, "準備フェーズなのに敵が生成されてしまっている").toBe(0);
    expect(container.textContent).toContain("戦闘を開始する");
  });

  it("準備フェーズでは装備の着脱ができ、「戦闘を開始する」を押すと敵が生成されて battle になる", async () => {
    const gear = { id: "gear-1", kind: "gear", slot: "suit", band: "shallow", name: "テスト装備", rarity: "std", asset: "suit_shallow_1", hp: 5, atk: 0, def: 1 };
    const crew = makeCrewFixture({ gear });
    const game = baseGame({ phase: "prep", crew: [crew], enemies: [], depth: 5, node: 0, nodes: ["battle", "wreck", "battle"] });
    const { container } = await renderGame({ game });

    click(byContainsText(container, "装備・収納", ".sd-btn"));
    await flush();
    // 戦闘中は出ない「外して収納」(装備の着脱)が、準備フェーズでは操作できるはず
    const unequipBtn = byExactText(container, "装備を外して収納");
    expect(unequipBtn, "準備フェーズなのに装備の着脱ができない").toBeTruthy();
    click(unequipBtn);
    await flush();
    let g = readGame();
    expect(g.crew[0].gear, "準備フェーズで装備を外せていない").toBeNull();

    // 戦闘を開始する(固定行動バー側の表記)
    const startBtn = byExactText(container, "戦闘を開始する");
    expect(startBtn, "「戦闘を開始する」ボタンが見つからない").toBeTruthy();
    click(startBtn);
    await flush(200);

    g = readGame();
    expect(g.phase, "「戦闘を開始する」を押しても battle にならない").toBe("battle");
    expect(g.enemies.length, "戦闘開始時に敵が生成されていない").toBeGreaterThan(0);
  });

  it("同じレイヤー内の2戦目(準備を経ずに前のイベントから直接続く戦闘)は準備フェーズを挟まない", async () => {
    // node=1(mid イベント)から node=2(2戦目の battle)へ進む場合は、直前のイベントノードで
    // 既に装備整理の機会があったため、準備フェーズは不要(対象は「レイヤー最初の戦闘」のみ)。
    const crew = makeCrewFixture();
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [crew], depth: 5, node: 1, nodes: ["battle", "wreck", "battle"] });
    const { container } = await renderGame({ game });

    click(byContainsText(container, "降下を続ける", "button"));
    await flush(200);

    const g = readGame();
    expect(g.phase, "2戦目にまで準備フェーズが挟まってしまっている").toBe("battle");
  });

  it("深度が切り替わる瞬間(レイヤー最後のノード→次の深度)は準備フェーズを挟む", async () => {
    const crew = makeCrewFixture();
    const game = baseGame({ phase: "supply", eventDone: true, crew: [crew], depth: 5, node: 2, nodes: ["battle", "wreck", "supply"] });
    const { container } = await renderGame({ game });

    click(byContainsText(container, "降下を続ける", "button"));
    await flush(200);

    const g = readGame();
    expect(g.depth, "深度が進んでいない").toBe(6);
    expect(g.phase, "深度が切り替わった直後の戦闘に準備フェーズが挟まっていない").toBe("prep");
  });
});
