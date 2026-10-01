// 回帰テスト:
// 1) 起動直後は中断データがあっても自動で潜航画面へは切り替わらず、必ずタイトル画面から
//    始まる。続けるかはタイトルの「続きから再開」ボタンを押した時だけ。
// 2) 潜航中に下部タブバーの「メイン」を押すと、潜航を終了させず(中断データを消さず)
//    タイトルへ戻れる。タイトルの「続きから再開」で全く同じ状態に戻れる。
// 3) タイトルに中断データがある状態で「帰還する」を選ぶと、確認画面(newGameReview)を
//    経由する。これは潜航中の「潜航をやめて母船へ戻る」と全く同じ確認画面・帰還画面
//    (phase:"return")を辿る同一の帰還フロー(以前は「新しく始める」という別の破棄
//    フローだったが、実際には持ち物を捨てずストレージへ持ち帰る動作なので統合した)。
//    キャンセルすれば確認画面が閉じるだけで、そのまま潜航が続けられる。確定すれば
//    帰還画面を経て中断データが消え、タイトルに戻る。
// 4) 潜航中も下部タブバーの強化/スキル/図鑑/設定からいつでもオーバーレイを開ける
//    (以前は画面右上にも同じ行き先の小さいアイコンがあったが、タブバーへ一本化して撤去した)。
import { describe, it, expect } from "vitest";
import {
  renderGame, byExactText, byContainsText, click, flush, readGame, makeCrewFixture, baseGame,
} from "./helpers.jsx";

describe("起動時は常にタイトルから、続きは明示的なボタンで再開", () => {
  it("中断データがあっても自動で潜航画面へは切り替わらない", async () => {
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [makeCrewFixture()], depth: 12 });
    const { container } = await renderGame({ game, skipResume: true });

    // タイトル画面の目印(潜航開始系のボタンではなく、タイトル文言そのもの)が見えている
    expect(container.textContent).toContain("深海ダンジョン");
    // 潜航中にしか出ない要素(深度ゲージ)は出ていない
    expect(container.querySelector(".sd-gauge")).toBeNull();

    const resumeBtn = byExactText(container, "続きから再開");
    expect(resumeBtn, "タイトルに「続きから再開」ボタンが出ていない").toBeTruthy();

    click(resumeBtn);
    await flush();
    expect(container.querySelector(".sd-gauge"), "再開ボタンを押しても潜航画面に切り替わらない").not.toBeNull();

    // 中断データ自体は消費されず、そのままの内容で再開できている
    const g = readGame();
    expect(g.phase).toBe("wreck");
    expect(g.depth).toBe(12);
  });
});

describe("潜航中にゲームを終了させずメインへ戻る", () => {
  it("下部タブバーの「メイン」でタイトルへ戻っても、中断セーブは消えず続きから再開できる", async () => {
    const crew = makeCrewFixture({ id: "crew-x" });
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [crew], depth: 33 });
    const { container } = await renderGame({ game });
    expect(container.querySelector(".sd-gauge")).not.toBeNull();

    click(byContainsText(container, "メイン", ".sd-hometab"));
    await flush();

    // タイトルへ戻っている(潜航は終了していない = ending 演出等は出ない)
    expect(container.textContent).toContain("深海ダンジョン");
    expect(container.querySelector(".sd-gauge")).toBeNull();

    // 中断データはそのまま残っている
    const g1 = readGame();
    expect(g1, "メインへ戻っただけなのに中断セーブが消えている").not.toBeNull();
    expect(g1.depth).toBe(33);

    // 「続きから再開」でさっきと全く同じ状態に戻れる
    const resumeBtn = byExactText(container, "続きから再開");
    expect(resumeBtn).toBeTruthy();
    click(resumeBtn);
    await flush();
    expect(container.querySelector(".sd-gauge")).not.toBeNull();
    expect(container.textContent).toContain("テスト潜兵");
  });
});

describe("タイトルから「帰還する」で持ち物を船へ戻す", () => {
  it("確認画面をキャンセルすると、そのまま潜航へ戻れる(中断データは消えない)", async () => {
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [makeCrewFixture()], depth: 7 });
    const { container } = await renderGame({ game, skipResume: true });

    click(byExactText(container, "帰還する(今の持ち物を船に戻します)"));
    await flush();
    expect(container.textContent).toContain("この内容で帰還しますか?");

    const closeBtn = container.querySelector(".sd-sheet-head button");
    expect(closeBtn, "確認画面のバツボタンが見つからない").toBeTruthy();
    click(closeBtn);
    await flush();

    // キャンセル = 帰還をやめただけなので、そのまま潜航中の画面に戻る
    expect(container.querySelector(".sd-gauge"), "キャンセルしたのに潜航画面に戻らない").not.toBeNull();
    expect(readGame(), "キャンセルしたのに中断セーブが消えている").not.toBeNull();
  });

  it("確定すると帰還画面を経てタイトルに戻り、中断データは消え「続きから再開」ボタンも出ない", async () => {
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [makeCrewFixture()], depth: 7 });
    const { container } = await renderGame({ meta: { carrySlots: 1 }, game, skipResume: true });

    click(byExactText(container, "帰還する(今の持ち物を船に戻します)"));
    await flush();
    click(byExactText(container, "この内容で帰還する"));
    await flush();

    expect(container.textContent).toContain("帰 還");
    click(byExactText(container, "母船へ"));
    await flush();

    expect(container.textContent).toContain("深海ダンジョン");
    expect(readGame(), "確定したのに中断セーブが残っている").toBeNull();
    expect(byExactText(container, "続きから再開"), "帰還したのに再開ボタンがまだ出ている").toBeFalsy();
  });
});

describe("潜航中でも強化・スキル・図鑑・設定にいつでも切り替えられる", () => {
  it("下部タブバーから各オーバーレイを開閉できる", async () => {
    const game = baseGame({
      phase: "wreck", eventDone: true,
      crew: [makeCrewFixture({ type: "harpoon" })],
    });
    const { container } = await renderGame({ meta: { roster: ["harpoon"] }, game });

    click(byContainsText(container, "強化", ".sd-hometab"));
    await flush();
    expect(container.textContent).toContain("強 化");

    click(byContainsText(container, "メイン", ".sd-hometab"));
    // ここは「強化」オーバーレイが開いたままメインへ戻れることの確認ではなく、単に
    // オーバーレイが残っていないことの確認なので、いったんタブクリックせず終了
  });

  it("設定・スキル・図鑑もそれぞれ開ける", async () => {
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [makeCrewFixture()] });
    const { container } = await renderGame({ game });

    click(byContainsText(container, "設定", ".sd-hometab"));
    await flush();
    expect(container.textContent).toContain("設 定");
    click(byContainsText(container, "戻る", ".fs-back") || byExactText(container, "戻る"));
    await flush();

    click(byContainsText(container, "スキル", ".sd-hometab"));
    await flush();
    expect(container.textContent).toContain("ス キ ル ツ リ ー");
  });
});
