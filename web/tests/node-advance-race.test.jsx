// 回帰テスト: 「先へ進む →」を連打しても、ノード/深度が2つ同時に進まない。
// proceed()/nextNode() は setG(updater) の関数型更新で書かれているため、連打も
// 正しく直列に合成されるはず(その回帰確認)。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, click, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("ノード進行の整合性", () => {
  it("「先へ進む →」を連打してもノードは1つしか進まない", async () => {
    const game = baseGame({
      phase: "wreck", eventDone: true, depth: 5, node: 0, nodes: ["wreck", "battle", "battle"],
      crew: [makeCrewFixture()], drops: [],
    });
    const { container } = await renderGame({ game });

    const nextBtn = byExactText(container, "降下を続ける ↓");
    expect(nextBtn, "「先へ進む →」ボタンが見つからない").toBeTruthy();
    click(nextBtn); click(nextBtn); click(nextBtn); // 連打
    await flush(300);

    const g = readGame();
    expect(g.node, "ノードが2つ以上進んでしまっている(複数回成立した疑い)").toBe(1);
    expect(g.depth).toBe(5);
  });
});
