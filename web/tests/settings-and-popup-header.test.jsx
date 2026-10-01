// 回帰テスト:
// 1) 設定画面にBGM・効果音の音量スライダーが別々にあり、それぞれ独立してネイティブへ
//    setVolume(track付き)が送られる。
// 2) 「帰還」の確認画面(newGameReview)にバツボタンがあり、押すと閉じる
//    (以前は背景タップでしか閉じられなかった)。
import { describe, it, expect, vi } from "vitest";
import { renderGame, byContainsText, click, flush, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("設定画面の音量", () => {
  it("BGM・効果音それぞれのスライダーを動かすと、track付きで setVolume が送られる", async () => {
    const postMessage = vi.fn();
    window.webkit = { messageHandlers: { settings: { postMessage } } };
    try {
      const { container } = await renderGame({});
      // 設定は常に画面下部の固定タブバー(.sd-hometab)から開く
      click(byContainsText(container, "設定", ".sd-hometab"));
      await flush();

      const sliders = container.querySelectorAll('input[type="range"]');
      expect(sliders.length, "BGM・効果音の2本のスライダーが見つからない").toBe(2);

      // 開いた時点で現在値を問い合わせている
      expect(postMessage).toHaveBeenCalledWith({ action: "getVolume" });

      // React の onChange は input を購読しているため、input イベントで模擬する
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(sliders[0], "40");
      sliders[0].dispatchEvent(new Event("input", { bubbles: true }));
      await flush();
      expect(postMessage).toHaveBeenCalledWith({ action: "setVolume", track: "bgm", value: 40 });

      setter.call(sliders[1], "20");
      sliders[1].dispatchEvent(new Event("input", { bubbles: true }));
      await flush();
      expect(postMessage).toHaveBeenCalledWith({ action: "setVolume", track: "se", value: 20 });
    } finally {
      delete window.webkit;
    }
  });
});

describe("スクロールするポップアップのバツボタン", () => {
  it("「帰還」の確認画面はバツボタンで閉じられる", async () => {
    // ※ スキルツリー・観測記録・設定は全画面表示化され、戻るボタンは画面中央の
    //   「戻る」に統一された。この sd-sheet-head + バツボタンのパターンが今も
    //   残っている newGameReview(「帰還」確認画面)を直接開いて確認する。
    const crew = makeCrewFixture({ gear: null });
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [crew], bagOpen: true });
    const { container } = await renderGame({ game });

    click(byContainsText(container, "潜航をやめて母船へ戻る", "button"));
    await flush();
    expect(container.textContent).toContain("この内容で帰還しますか?");

    const closeBtn = container.querySelector(".sd-sheet-head button");
    expect(closeBtn, "ヘッダー内のバツボタンが見つからない").toBeTruthy();
    click(closeBtn);
    await flush();

    expect(container.textContent).not.toContain("この内容で帰還しますか?");
  });
});
