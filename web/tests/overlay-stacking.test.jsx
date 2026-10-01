// 回帰テスト: 強化/スキル/図鑑/設定/遊び方は「いつでも開けるメニュー」なので、装備・収納
// (bagOpen)など各画面固有のポップアップより手前に来る必要がある。以前は両方とも同じ
// z-index(60)で、DOM順序に頼った積み重ねだったため、環境によってはスキルツリーが
// 収納ポップアップの裏に隠れてしまう不具合があった。明示的に高い z-index(.sd-fs-meta)
// を持つことを確認する。
import { describe, it, expect } from "vitest";
import { renderGame, byContainsText, click, flush, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("収納ポップアップとメニューオーバーレイの重なり順", () => {
  it("収納(装備・収納)を開いたままスキルツリーを開くと、スキルツリー側がより高いz-indexを持つ", async () => {
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [makeCrewFixture()], bagOpen: true });
    const { container } = await renderGame({ game });

    click(byContainsText(container, "スキル", ".sd-hometab"));
    await flush();

    const roots = Array.from(container.querySelectorAll(".sd-fs-root"));
    expect(roots.length, "収納とスキルツリーの2枚の全画面ポップアップが両方とも存在するはず").toBe(2);

    const bagRoot = roots.find((r) => r.textContent.includes("装 備 / 収 納"));
    const skillRoot = roots.find((r) => r.textContent.includes("ス キ ル ツ リ ー"));
    expect(bagRoot, "収納ポップアップが見つからない").toBeTruthy();
    expect(skillRoot, "スキルツリーポップアップが見つからない").toBeTruthy();
    expect(bagRoot.classList.contains("sd-fs-meta"), "収納ポップアップは共通メニュー扱いではないはず").toBe(false);
    expect(skillRoot.classList.contains("sd-fs-meta"), "スキルツリーは共通メニュー扱いで高いz-indexを持つはず").toBe(true);
  });
});
