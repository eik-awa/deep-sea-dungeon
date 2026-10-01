// 回帰テスト: 同じ種の標本を SPECIMEN_UNLOCK(3)個集めると、観測記録の詳細に
// 生態レポート第2段(deep lore)が解放される。3個未満ではロック中の文言のまま。
import { describe, it, expect } from "vitest";
import { renderGame, byContainsText, click, flush } from "./helpers.jsx";

describe("標本による生態レポート解放", () => {
  it("標本2個ではまだロック中、3個集まると生態レポートが解放される", async () => {
    const { container } = await renderGame({
      meta: { seen: { lanternfish: true }, specimens: { lanternfish: 2 } },
    });

    click(byContainsText(container, "図鑑", ".sd-hometab"));
    await flush();
    click(byContainsText(container, "薄明層", ".sd-bst-zcard"));
    await flush();
    const cell = container.querySelector(".sd-bst-cell:not(.unseen)");
    expect(cell, "遭遇済みの提灯魚セルが見つからない").toBeTruthy();
    click(cell);
    await flush();

    expect(container.textContent).toContain(`標本を 3 個集めると解放`);
  });

  it("標本3個で生態レポート第2段(深部の生態メモ)が表示される", async () => {
    const { container } = await renderGame({
      meta: { seen: { lanternfish: true }, specimens: { lanternfish: 3 } },
    });

    click(byContainsText(container, "図鑑", ".sd-hometab"));
    await flush();
    click(byContainsText(container, "薄明層", ".sd-bst-zcard"));
    await flush();
    click(container.querySelector(".sd-bst-cell:not(.unseen)"));
    await flush();

    expect(container.textContent, "3個集めたのにまだロック中の表記のまま").not.toContain("標本を 3 個集めると解放");
    expect(container.querySelector(".sd-bst-lore.deep"), "生態レポート第2段が描画されていない").toBeTruthy();
  });
});
