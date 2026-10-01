// 回帰テスト: 壊れたセーブデータ・旧スキーマのセーブデータを読み込んでもクラッシュせず、
// 通常通りタイトル/再開プロンプトが表示される。
import { describe, it, expect } from "vitest";
import { SAVE_KEY, GAME_KEY, flush, byExactText } from "./helpers.jsx";
import React from "react";
import { createRoot } from "react-dom/client";
import StillDepths from "../src/StillDepths.jsx";

describe("壊れたセーブデータの安全な読み込み", () => {
  it("meta が壊れたJSON文字列でもクラッシュせずタイトル画面が表示される", async () => {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(GAME_KEY);
    localStorage.setItem(SAVE_KEY, "{ 壊れたJSON ...");
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    expect(() => root.render(React.createElement(StillDepths))).not.toThrow();
    await flush(150);
    expect(container.textContent).toContain("潜 航 開 始");
  });

  it("中断セーブ(GAME_KEY)にフィールドが欠けた旧スキーマが残っていてもクラッシュしない", async () => {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(GAME_KEY);
    // crew や bag などを欠いた極端に古い/壊れた形の中断セーブを想定
    localStorage.setItem(GAME_KEY, JSON.stringify({ screen: "dive", depth: 3 }));
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    expect(() => root.render(React.createElement(StillDepths))).not.toThrow();
    await flush(200);
    // クラッシュして真っ白にならず、何らかの画面(タイトル or 再開プロンプト)が描画されていること
    expect(container.textContent.length).toBeGreaterThan(50);
  });
});
