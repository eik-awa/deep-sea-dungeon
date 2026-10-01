// 回帰テスト: 走査(scanner)だけでなく、通常攻撃でたまたま弱点/耐性属性が
// 命中した場合も、その場で観測記録(meta.scanned)へ記録され、敵カードに
// 弱点/耐性タグとして残り続けることを確認する。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, click, flush, readMeta, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("戦闘中の弱点/耐性の発見", () => {
  it("弱点属性で攻撃が命中すると、走査していなくても弱点タグが画面に残る", async () => {
    const crew = makeCrewFixture({ type: "harpoon", atk: 20 }); // harpoon = 徹甲(KIN)属性
    const enemy = {
      id: "e1", bookId: "diagBook", name: "テスト敵", asset: "lanternfish",
      hp: 500, maxHp: 500, atk: 5, def: 0, weak: ["徹甲"], resist: [],
      poison: false, burn: false, drain: false, stun: false,
      scanned: false, paralyzed: 0, burning: 0, exposed: 0, anomaly: false, boss: false,
    };
    const game = baseGame({ phase: "battle", crew: [crew], enemies: [enemy], turnIdx: 0 });
    const { container } = await renderGame({ game });

    const atkBtn = byExactText(container, "攻 撃");
    expect(atkBtn, "攻撃ボタンが見つからない").toBeTruthy();
    click(atkBtn);
    await flush(200);

    // meta.scanned に永続記録される(次にこの種と遭遇した時も引き継がれる)
    const meta = readMeta();
    expect(meta.scanned?.diagBook?.w).toContain("徹甲");

    // 画面上の敵カードにも弱点タグが表示され続ける
    const tagsHtml = container.querySelector(".sd-tags")?.textContent || "";
    expect(tagsHtml).toContain("徹甲");
  });

  it("耐性属性で攻撃が命中すると、耐性タグとして記録される(弱点と取り違えない)", async () => {
    const crew = makeCrewFixture({ type: "harpoon", atk: 20 }); // harpoon = 徹甲(KIN)属性
    const enemy = {
      id: "e1", bookId: "diagBook2", name: "テスト敵2", asset: "lanternfish",
      hp: 500, maxHp: 500, atk: 5, def: 0, weak: [], resist: ["徹甲"],
      poison: false, burn: false, drain: false, stun: false,
      scanned: false, paralyzed: 0, burning: 0, exposed: 0, anomaly: false, boss: false,
    };
    const game = baseGame({ phase: "battle", crew: [crew], enemies: [enemy], turnIdx: 0 });
    const { container } = await renderGame({ game });

    click(byExactText(container, "攻 撃"));
    await flush(200);

    const meta = readMeta();
    expect(meta.scanned?.diagBook2?.r).toContain("徹甲");
    expect(meta.scanned?.diagBook2?.w || []).not.toContain("徹甲");
  });
});
