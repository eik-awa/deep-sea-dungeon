// 回帰テスト: 残響片が足りない/前提スキル未購入のスキルは購入できない
// (連打してもコストだけ引かれて何も習得されない、ということが起きない)。
//
// 円環ツリーのノードをタップして選ぶと下に詳細パネルが出て、その中の「習得する」
// ボタン(.fs-primary)は購入不可なら disabled になり、クリックしても onBuy が
// 呼ばれないことを確認する。
import { describe, it, expect } from "vitest";
import { renderGame, byAriaLabel, byContainsText, click, flush, readMeta } from "./helpers.jsx";

describe("スキルツリー購入のガード", () => {
  it("残響片が足りないスキルは「習得する」ボタンが無効化され、押しても購入されない", async () => {
    const { container } = await renderGame({ meta: { shards: 0 } });

    const openBtn = byContainsText(container, "スキル", ".sd-hometab");
    click(openBtn);
    await flush();

    const node = byAriaLabel(container, "徹甲の心得", ".sd-sktree-node");
    expect(node, "徹甲の心得のノードが見つからない").toBeTruthy();
    click(node);
    await flush();

    const acquireBtn = container.querySelector(".fs-primary");
    expect(acquireBtn, "詳細パネルの習得ボタンが見つからない").toBeTruthy();
    // shards=0 では cost(3) に届かないため無効化されているはず
    expect(acquireBtn.disabled, "残響片不足なのにボタンが有効になっている").toBe(true);
    click(acquireBtn);
    await flush();

    const meta = readMeta();
    expect(meta.skills?.kinI).toBeFalsy();
    expect(meta.shards).toBe(0);
  });
});
