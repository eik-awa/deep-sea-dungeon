// 回帰テスト: レア以上のアイテムの「破棄」は確認ダイアログを経由し、即座には消えない。
// 「やめる」でキャンセルすれば残り、「破棄する」で確定した時だけ収納から消える。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, byContainsText, click, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("レア品破棄の確認ダイアログ", () => {
  it("破棄ボタンを押しても即座には消えず、確認ダイアログが出る", async () => {
    const rareGear = { id: "rare-1", kind: "gear", slot: "suit", band: "shallow", name: "レア耐圧服", rarity: "rare", asset: "suit_shallow_3", hp: 20, atk: 0, def: 4 };
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [makeCrewFixture()], bag: [rareGear], bagOpen: true });
    const { container } = await renderGame({ meta: { protectRare: false }, game });

    const discardBtn = byExactText(container, "破棄");
    expect(discardBtn, "破棄ボタンが見つからない").toBeTruthy();
    click(discardBtn);
    await flush();

    expect(container.textContent).toContain("本当に破棄しますか?");
    let g = readGame();
    expect(g.bag.some((x) => x.id === "rare-1"), "確認前なのにもう消えている").toBe(true);

    // 「やめる」でキャンセル
    const cancelBtn = byExactText(container, "やめる");
    click(cancelBtn);
    await flush();
    g = readGame();
    expect(g.bag.some((x) => x.id === "rare-1"), "キャンセルしたのに消えてしまっている").toBe(true);
  });

  it("確認ダイアログで「破棄する」を押すと実際に収納から消える", async () => {
    const rareGear = { id: "rare-2", kind: "gear", slot: "suit", band: "shallow", name: "レア耐圧服", rarity: "rare", asset: "suit_shallow_3", hp: 20, atk: 0, def: 4 };
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [makeCrewFixture()], bag: [rareGear], bagOpen: true });
    const { container } = await renderGame({ meta: { protectRare: false }, game });

    click(byExactText(container, "破棄"));
    await flush();
    const confirmBtn = byContainsText(container, "破棄する", "button");
    expect(confirmBtn, "確認の「破棄する」ボタンが見つからない").toBeTruthy();
    click(confirmBtn);
    await flush();

    const g = readGame();
    expect(g.bag.some((x) => x.id === "rare-2")).toBe(false);
  });
});
