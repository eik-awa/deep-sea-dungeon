// 回帰テスト: 「次へ進む」系のボタンが、以前はイベントカードの一番下(スクロールしないと
// 見えない位置)にしか無かった。画面下部の固定行動バーにも同じ操作を常時表示し、
// スクロールせずに押せることを確認する。
import { describe, it, expect } from "vitest";
import { renderGame, byContainsText, click, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("固定表示の次へ進むボタン", () => {
  it("残骸(wreck)フェーズで、固定行動バー側の「降下を続ける」で深度が進む", async () => {
    const crew = makeCrewFixture();
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [crew], depth: 5, nodes: ["wreck"], node: 0 });
    const { container } = await renderGame({ game });

    // sd-acts-sub(固定行動バー)側のボタンを狙う。イベントカード側にも同名ボタンが
    // あるため、.sd-acts-sub 配下から探すことで固定表示側であることを確認する。
    const bar = container.querySelector(".sd-acts-sub");
    expect(bar, "固定行動バーが見つからない").toBeTruthy();
    const btn = byContainsText(bar, "降下を続ける", "button");
    expect(btn, "固定行動バーに「降下を続ける」が無い").toBeTruthy();
    click(btn);
    await flush(200);

    const g = readGame();
    expect(g.depth).toBe(6);
  });

  it("関所(gate)フェーズで未解決の間は、固定行動バーに「強行突破する」が出る", async () => {
    const crew = makeCrewFixture();
    const game = baseGame({ phase: "gate", eventDone: false, crew: [crew], depth: 5, nodes: ["gate"], node: 0 });
    const { container } = await renderGame({ game });

    const bar = container.querySelector(".sd-acts-sub");
    const btn = byContainsText(bar, "強行突破する", "button");
    expect(btn, "固定行動バーに「強行突破する」が無い").toBeTruthy();
    click(btn);
    await flush(200);

    const g = readGame();
    expect(g.eventDone).toBe(true);
  });

  it("制圧完了(spoils)フェーズで、固定行動バーの「先へ進む」でノードが進む", async () => {
    const crew = makeCrewFixture();
    const game = baseGame({ phase: "spoils", eventDone: true, crew: [crew], depth: 5, nodes: ["battle", "wreck"], node: 0, drops: [] });
    const { container } = await renderGame({ game });

    const bar = container.querySelector(".sd-acts-sub");
    const btn = byContainsText(bar, "先へ進む", "button");
    expect(btn, "固定行動バーに「先へ進む」が無い").toBeTruthy();
    click(btn);
    await flush(200);

    const g = readGame();
    expect(g.node).toBe(1);
  });
});
