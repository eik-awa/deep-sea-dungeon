// 回帰テスト: 並び替えモードでクルーを2人選ぶと、編成内の位置が入れ替わる。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, byContainsText, click, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("クルーの並び替え", () => {
  it("並び替えモードで2人選ぶと編成の位置が入れ替わる", async () => {
    const c1 = makeCrewFixture({ id: "c1", name: "アルファ", type: "harpoon" });
    const c2 = makeCrewFixture({ id: "c2", name: "ブラボー", type: "medic" });
    const c3 = makeCrewFixture({ id: "c3", name: "チャーリー", type: "scanner" });
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [c1, c2, c3], bagOpen: true });
    const { container } = await renderGame({ game });

    const toggleBtn = byExactText(container, "並び替え");
    expect(toggleBtn, "並び替えボタンが見つからない").toBeTruthy();
    click(toggleBtn);
    await flush();

    // 戦闘下部のクルー行(タップでスキル説明を表示する別機能・class="sd-cr")と、
    // 収納シート内の並び替え用カード(className無し・インラインstyleのみ)の2系統が
    // どちらも role="button" を持つため、後者だけに絞り込む。
    const card1 = byContainsText(container, "アルファ", "div[role=button]:not(.sd-cr)");
    const card3 = byContainsText(container, "チャーリー", "div[role=button]:not(.sd-cr)");
    expect(card1, "アルファのカードが見つからない").toBeTruthy();
    expect(card3, "チャーリーのカードが見つからない").toBeTruthy();
    click(card1);
    await flush();
    click(card3);
    await flush();

    const g = readGame();
    expect(g.crew[0].id, "先頭がチャーリーに入れ替わっていない").toBe("c3");
    expect(g.crew[2].id, "末尾がアルファに入れ替わっていない").toBe("c1");
    expect(g.crew[1].id).toBe("c2"); // 触れていない中央はそのまま
  });
});
