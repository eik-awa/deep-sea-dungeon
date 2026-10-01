// 回帰テスト: 「保護設定(レア以上/回復品を自動ロック)」と「個別ロック」の統合。
// 以前は保護設定に該当するアイテムが isProtected という別系統の常時判定でブロックされ、
// ロックボタンを押して it.locked を反転させても解除できなかった(保護設定の対象は
// 事実上いつまでも外せなかった)。
// 現在は保護設定を「該当品を取得・読み込み時に it.locked = true にするだけ」の機能に
// 一本化し、以後の可否判定はすべて it.locked の一点で行う。これにより、保護設定の
// 対象でもロックボタンをもう一度押せばその1点だけ解除でき(設定自体は ON のまま)、
// 解除した状態は(再度ロックし直さない限り)勝手に戻らない。
import { describe, it, expect } from "vitest";
import { renderGame, byContainsText, click, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("保護設定とロックの統合", () => {
  it("保護設定に該当する物は自動でロックされ、ロックボタンをもう一度押せばその1点だけ解除できる", async () => {
    // 取得時に自動ロックされた物(保護設定は「これから拾う物」にだけ効くので、ロード時に遡っては付けない)
    const healItem = { id: "heal-1", kind: "item", itemId: "medkit", name: "救命キット", asset: "medkit", rarity: "std", locked: true };
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [makeCrewFixture()], bag: [healItem], bagOpen: true });
    const { container } = await renderGame({ meta: { protectHeals: true }, game });

    // 読み込み時点で保護設定に該当する物は自動的にロックされている
    let g = readGame();
    expect(g.bag.find((x) => x.id === "heal-1")?.locked, "保護設定に該当する物が自動でロックされていない").toBe(true);

    const lockBtn = byContainsText(container, "解除", ".sd-lock-btn");
    expect(lockBtn, "「解除」表示のロックボタンが見つからない(自動ロックされていない可能性)").toBeTruthy();

    // 破棄ボタンはロック中は「ロック中」表示で無効化されている
    let discardBtn = byContainsText(container, "ロック中", ".sd-btn.sm");
    expect(discardBtn, "ロック中の破棄ボタンが見つからない").toBeTruthy();
    expect(discardBtn.disabled).toBe(true);

    // ロックボタンをもう一度押すと、この1点だけ解除できる(設定自体はONのまま)
    click(lockBtn);
    await flush();

    g = readGame();
    expect(g.bag.find((x) => x.id === "heal-1")?.locked, "ロックボタンを押しても解除されていない").toBe(false);

    // 解除後は破棄ボタンが有効になり、実際に破棄できる
    const discardBtnAfter = byContainsText(container, "破棄", ".sd-btn.sm");
    expect(discardBtnAfter, "解除後の「破棄」ボタンが見つからない").toBeTruthy();
    expect(discardBtnAfter.disabled).toBe(false);
    click(discardBtnAfter);
    await flush();

    g = readGame();
    expect(g.bag.some((x) => x.id === "heal-1"), "解除して破棄したはずの物が収納に残っている").toBe(false);
  });

  it("保護設定をONにしても、今持っている該当品のロックは変わらない(これから拾う物にだけ効く)", async () => {
    const rareGear = { id: "rare-gear-1", kind: "gear", slot: "suit", band: "shallow", name: "レア耐圧服", rarity: "rare", asset: "suit_shallow_3", hp: 20, atk: 0, def: 4 };
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [makeCrewFixture({ gear: null })], bag: [rareGear], bagOpen: true });
    // protectRare は最初 OFF。読み込み時点ではロックされない
    const { container } = await renderGame({ meta: { protectRare: false }, game });

    let g = readGame();
    expect(g.bag.find((x) => x.id === "rare-gear-1")?.locked, "OFFの時点でロックされてしまっている").toBeFalsy();

    click(byContainsText(container, "設定", ".sd-hometab"));
    await flush();
    const toggle = byContainsText(container, "レア(☆☆☆)以上を自動でロック", ".sd-toggle").querySelector("button");
    expect(toggle, "保護設定のトグルボタンが見つからない").toBeTruthy();
    click(toggle);
    await flush();

    g = readGame();
    expect(g.bag.find((x) => x.id === "rare-gear-1")?.locked, "ONにしたら既存の物まで遡ってロックされてしまった").toBeFalsy();
  });
});
