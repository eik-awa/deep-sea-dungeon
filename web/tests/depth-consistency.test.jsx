// 回帰テスト(実バグ): 海域クリア画面の「次は 海域N(◯◯m〜)」の深度表示が、直前に
// HUDで見ていた深度(depthMeters = 深度×100m)と食い違わないこと。
// 以前は ZONES[i].depth という、実在の海洋深度帯を模した固定の演出用文字列
// (-200m / -600m / -1200m … 海域ごとに幅が不揃い)をそのまま流用していたため、
// 「海域1の最後で 1000m まで来たのに、次は 600m と言われる」ような、深度が
// 巻き戻って見える表示不整合が発生していた(ユーザー報告と一致)。
// 常に depthMeters(g.depth + 1) で計算した値を使うよう修正し、直前のHUD表示から
// 必ず単調に(+100mずつ)増え続けることを保証する。
import { describe, it, expect } from "vitest";
import { renderGame, baseGame, makeCrewFixture } from "./helpers.jsx";

describe("深度表示の整合性", () => {
  it("海域1最終層(depth=10, 1000m)クリア後、次の海域の表示深度が1100mで続く(600mへ戻らない)", async () => {
    const game = baseGame({
      phase: "zoneClear", depth: 10, node: 0, nodes: ["boss"],
      crew: [makeCrewFixture()], drops: [], zoneShards: 3, zoneCompBonus: 0,
    });
    const { container } = await renderGame({ game });

    const text = container.textContent;
    expect(text, "直前のHUDで見た1000mから続く深度(1100m)が表示されているべき").toContain("1100m");
    expect(text, "海洋深度帯の演出用固定値(600m)が紛れ込んでいる").not.toContain("(600m〜)");
  });

  it("海域9最終層(depth=90, 9000m)クリア後、次は海域10の表示深度が9100mで続く", async () => {
    const game = baseGame({
      phase: "zoneClear", depth: 90, node: 0, nodes: ["boss"],
      crew: [makeCrewFixture()], drops: [], zoneShards: 3, zoneCompBonus: 0,
    });
    const { container } = await renderGame({ game });

    const text = container.textContent;
    expect(text).toContain("9100m");
  });
});
