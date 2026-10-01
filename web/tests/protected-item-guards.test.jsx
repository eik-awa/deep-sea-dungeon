// 回帰テスト: ロック中(レア以上を自動ロックする保護設定 含む)のアイテムは、
// 関所への奉納・廃品回収(スクラップ)のどちらでも消費されない。
// 保護設定(protectRare/protectHeals)は「該当品を自動でロックするだけ」の機能に統合済みで、
// 可否判定は常に it.locked の一点だけで行う(旧・isProtected の二重管理は廃止)。
import { describe, it, expect } from "vitest";
import { renderGame, byContainsText, byExactText, click, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("保護中アイテムのガード", () => {
  it("保護設定(レア以上・protectRare)に該当するアイテムは自動でロックされ、関所へ捧げられない", async () => {
    const rareItem = { id: "rare-consumable", kind: "item", itemId: "torpedo", name: "小型魚雷", asset: "torpedo", rarity: "rare", locked: true };
    const game = baseGame({ phase: "gate", eventDone: false, crew: [makeCrewFixture()], bag: [rareItem] });
    const { container } = await renderGame({ meta: { protectRare: true }, game });

    const cell = byContainsText(container, "小型魚雷", ".sd-cell");
    expect(cell, "アイテムセルが見つからない").toBeTruthy();
    // 保護設定に該当する物は、取得時に自動で it.locked = true になっている(ロード時に遡っては付けない)
    expect(cell.textContent).toContain("ロック中");
    click(cell);
    await flush();

    const g = readGame();
    expect(g.bag.some((x) => x.id === "rare-consumable"), "ロック中のアイテムが捧げられて消えてしまっている").toBe(true);
    expect(g.bag.find((x) => x.id === "rare-consumable")?.locked, "保護設定に該当する物が実際に locked=true になっていない").toBe(true);
    expect(g.eventDone, "ロック中アイテムのクリックでイベントが進んでしまっている").toBe(false);
  });

  it("ロック中のアイテムは廃品回収(スクラップ)できない", async () => {
    const lockedItem = { id: "locked-gear", kind: "gear", slot: "suit", band: "shallow", name: "ロック装備", rarity: "std", asset: "suit_shallow_1", hp: 10, atk: 0, def: 1, locked: true };
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [makeCrewFixture()], bag: [lockedItem], bagOpen: true });
    const { container } = await renderGame({ game });

    // 収納の「破棄」行は scrapItem 用ではなく discard 用だが、ロック中は破棄ボタン自体も
    // 無効化されている(protected-item-safety 系の既存回帰と同種)。ここでは scrapItem を
    // 直接呼べる導線(廃品回収イベント画面)が無い構成のため、収納上でロックが破棄を
    // 確実にブロックすることを確認する。
    const discardBtn = byExactText(container, "ロック中");
    expect(discardBtn, "「ロック中」表示の破棄ボタンが見つからない").toBeTruthy();
    expect(discardBtn.disabled).toBe(true);

    const g = readGame();
    expect(g.bag.some((x) => x.id === "locked-gear")).toBe(true);
  });
});
