// 回帰テスト: 潜航中のHUDから「英語ゾーン名(例: REEF RUINS)」「[2-2]のような座標表記」
// 「海域Nのラベル」を取り除き、海域の和名だけを表示するようにした変更の確認。
import { describe, it, expect } from "vitest";
import { renderGame, baseGame, makeCrewFixture } from "./helpers.jsx";

describe("潜航中HUDの海域表記", () => {
  it("英語ゾーン名(REEF RUINS)と [N-N] 座標表記がHUDに出ない", async () => {
    const game = baseGame({
      phase: "wreck", depth: 12, eventDone: true, // 海域2(珊瑚礁址)の層
      crew: [makeCrewFixture()],
    });
    const { container } = await renderGame({ game });

    const text = container.textContent;
    expect(text, "英語ゾーン名(REEF RUINS)が残っている").not.toContain("REEF RUINS");
    expect(text, "[2-2]のような座標表記が残っている").not.toContain("[2-2]");
    expect(text, "「海域2 珊瑚礁址」のような重複ラベルが残っている").not.toContain("海域2 珊瑚礁址");
  });

  it("海域の和名(珊瑚礁址)はHUDに残り、青太字スタイル(.sd-zone)で表示される", async () => {
    const game = baseGame({
      phase: "wreck", depth: 12, eventDone: true,
      crew: [makeCrewFixture()],
    });
    const { container } = await renderGame({ game });

    const zoneEl = container.querySelector(".sd-tele .sd-zone");
    expect(zoneEl, ".sd-zone 要素が見つからない").toBeTruthy();
    expect(zoneEl.textContent).toBe("珊瑚礁址");
  });
});
