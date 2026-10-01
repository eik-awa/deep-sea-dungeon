// 回帰テスト: タイトル画面下部に固定されたホームタブバー(メイン/強化/スキル/図鑑/設定)。
// 以前はボタン列(sd-meta-row)+右上固定の設定アイコンだった導線を、同格のタブとして
// 画面下部にまとめた。各タブで対応する画面が開き、「メイン」タブで閉じてタイトルへ戻る。
import { describe, it, expect } from "vitest";
import { renderGame, byContainsText, click, flush } from "./helpers.jsx";

describe("ホームタブバー", () => {
  it("強化・スキル・図鑑・設定タブがそれぞれ対応する画面を開き、メインタブで閉じる", async () => {
    const { container } = await renderGame({});

    click(byContainsText(container, "強化", ".sd-hometab"));
    await flush();
    expect(container.textContent).toContain("強 化");

    click(byContainsText(container, "スキル", ".sd-hometab"));
    await flush();
    expect(container.textContent).toContain("ス キ ル ツ リ ー");

    click(byContainsText(container, "図鑑", ".sd-hometab"));
    await flush();
    expect(container.textContent).toContain("観 測 記 録");

    click(byContainsText(container, "設定", ".sd-hometab"));
    await flush();
    expect(container.textContent).toContain("設 定");

    click(byContainsText(container, "メイン", ".sd-hometab"));
    await flush();
    expect(container.textContent).not.toContain("設 定");
    expect(container.textContent).toContain("深海ダンジョン");
  });
});
