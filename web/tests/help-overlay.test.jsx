// 回帰テスト: 「遊び方」画面。クルー職・戦闘・装備と強化・アイテム・帰還と継承・
// 潜航の進め方の6タブに分けて説明するヘルプ画面が、タイトル画面から開け、
// タブを切り替えると対応する内容が表示されることを確認する。
import { describe, it, expect } from "vitest";
import { renderGame, byContainsText, click, flush } from "./helpers.jsx";

describe("遊び方画面", () => {
  it("タイトル画面から開け、6つのタブが表示される", async () => {
    const { container } = await renderGame({});

    click(byContainsText(container, "遊び方", ".sd-btn"));
    await flush();

    // 既定タブ(① クルー職)の内容。クルー職の説明が実データ(CREW_TYPES)から生成されている
    expect(container.textContent).toContain("クルー職ごとの効果");
    // 装備の説明(③ 装備・強化タブ)はまだ開いていないので出ていないはず
    expect(container.textContent).not.toContain("戦闘中は消耗品のみ使用可能");

    for (const label of ["クルー職", "戦闘", "装備・強化", "アイテム", "帰還と継承", "潜航の進め方"]) {
      expect(byContainsText(container, label, ".sd-sk-cat"), `タブ「${label}」が見つからない`).toBeTruthy();
    }

    // 個別の「戻る」は廃止し、常時表示の下部タブバー(メイン)で閉じる
    const closeBtn = byContainsText(container, "メイン", ".sd-hometab");
    expect(closeBtn, "メインタブが見つからない").toBeTruthy();
    click(closeBtn);
    await flush();
    expect(container.textContent).not.toContain("クルー職ごとの効果");
  });

  it("タブを切り替えると、そのタブの内容に入れ替わる", async () => {
    const { container } = await renderGame({});

    click(byContainsText(container, "遊び方", ".sd-btn"));
    await flush();

    click(byContainsText(container, "装備・強化", ".sd-sk-cat"));
    await flush();
    expect(container.textContent).toContain("装備はいつ整えるか");
    expect(container.textContent).toContain("強化(アーティファクトでクルーを永久に鍛える)");
    expect(container.textContent).not.toContain("クルー職ごとの効果");

    click(byContainsText(container, "帰還と継承", ".sd-sk-cat"));
    await flush();
    expect(container.textContent).toContain("帰還(自主的に潜航を切り上げる)");
    expect(container.textContent).toContain("全滅した場合");
    expect(container.textContent).toContain("船内ストレージとチェックポイント");

    click(byContainsText(container, "アイテム", ".sd-sk-cat"));
    await flush();
    expect(container.textContent).toContain("消耗品の種類");
    expect(container.textContent).toContain("レア度");
  });
});
