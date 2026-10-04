// 回帰テスト: 「潜航をやめて母船へ戻る」は、タイトルの「帰還する」と全く同じ確認画面
// (newGameReview)を経由するようにした。以前は専用のダイアログがあり、ロック品を含め
// 一切何も持ち帰れない特別扱い(完全な撤退)だったが、自主的に撤退しただけなのに
// 死亡より不利という不整合があったため統一した。
import { describe, it, expect } from "vitest";
import { renderGame, byAriaLabel, byExactText, byContainsText, click, flush, readGame, readMeta, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("潜航をやめて母船へ戻る", () => {
  it("確認画面で「やめる」を選ぶと中断セーブは消えず、潜航が続けられる", async () => {
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [makeCrewFixture()], bagOpen: true });
    const { container } = await renderGame({ game });

    click(byContainsText(container, "潜航をやめて母船へ戻る", "button"));
    await flush();
    expect(container.textContent).toContain("この内容で帰還しますか?");

    click(byExactText(container, "やめる"));
    await flush();

    const g = readGame();
    expect(g, "キャンセルしたのに中断セーブが消えている").not.toBeNull();
    expect(g.phase).toBe("wreck");
  });

  it("確定すると「帰還」画面を経てタイトル画面へ戻り、中断セーブが消える", async () => {
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [makeCrewFixture()], bagOpen: true });
    const { container } = await renderGame({ game });

    click(byContainsText(container, "潜航をやめて母船へ戻る", "button"));
    await flush();
    click(byExactText(container, "この内容で帰還する"));
    await flush();

    // 確定直後は帰還画面を挟む(死亡・エンディングと同格の区切りとして見せる)。
    // この時点ではまだ中断セーブは残っている(母船へ戻るボタンを押すまで確定しない)。
    expect(container.textContent).toContain("帰 還");
    expect(readGame(), "帰還画面の時点で中断セーブが消えてしまっている").not.toBeNull();

    click(byExactText(container, "母船へ"));
    await flush();

    expect(readGame(), "確定したのに中断セーブが残っている").toBeNull();
    expect(container.textContent).toContain("潜 航 開 始");
  });

  it("ロック中の装備は、死亡時の持ち帰りと同様に優先して次回へ引き継がれる(以前は撤退だと一切持ち帰れなかった)", async () => {
    const lockedGear = { id: "locked-1", kind: "gear", slot: "suit", band: "shallow", name: "ロック装備", rarity: "legend", asset: "suit_shallow_5", hp: 5, atk: 0, def: 1, locked: true };
    const crew = makeCrewFixture({ gear: null });
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [crew], bag: [lockedGear], bagOpen: true });
    const { container } = await renderGame({ meta: { carrySlots: 1 }, game });

    click(byContainsText(container, "潜航をやめて母船へ戻る", "button"));
    await flush();
    // 一覧はアイコンのみ(名前はタップした時だけ下に出る)。推奨で選択済み(on)に
    // なっていることをアイコンの状態で確認する。
    const lockedIcon = byAriaLabel(container, "ロック装備", ".sd-review-icon");
    expect(lockedIcon, "引き継ぐ一覧にロック装備が出ていない").toBeTruthy();
    expect(lockedIcon.classList.contains("on"), "ロック装備が推奨(選択済み)になっていない").toBe(true);

    click(byExactText(container, "この内容で帰還する"));
    await flush();

    const meta = readMeta();
    expect(meta.carried?.some((x) => x.id === "locked-1"), "ロック中の装備が引き継がれていない").toBe(true);
  });
});
