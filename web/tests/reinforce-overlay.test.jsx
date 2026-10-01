// 回帰テスト: 「強化」画面。船のストレージに持ち帰ったアーティファクト(meta.carried の
// kind:"relic")を選んで名簿(職種typeのみ・全8種)をタップすると、アーティファクトの
// レア度に応じたレベルがその名簿へ加算され、消費したアーティファクトは meta.carried から
// 取り除かれる(次の潜航には持ち込まれない)。武器・防具(kind:"gear")は強化には使えない。
import { describe, it, expect } from "vitest";
import { renderGame, byContainsText, byExactText, click, flush, readMeta } from "./helpers.jsx";

describe("強化画面(アーティファクトを消費して名簿を永久強化)", () => {
  it("elite(☆2)のアーティファクトを選んで名簿を強化すると、レベルが+2され、消費される", async () => {
    const artifact = { id: "r1", kind: "relic", relicId: "sonarLens", name: "強化用遺物", rarity: "elite", asset: "sonarLens" };
    const { container } = await renderGame({ meta: { roster: ["harpoon"], carried: [artifact] } });

    click(byContainsText(container, "強化", ".sd-hometab"));
    await flush();

    const cell = byContainsText(container, "強化用遺物", ".sd-cell");
    expect(cell, "強化用遺物のセルが見つからない").toBeTruthy();
    click(cell);
    await flush();

    const levelBtn = byExactText(container, "Lv 0 → 2");
    expect(levelBtn, "レベル表示ボタン(Lv 0 → 2)が見つからない").toBeTruthy();
    click(levelBtn);
    await flush();

    const meta = readMeta();
    expect(meta.crewLevels?.["harpoon"], "レベルが正しく加算されていない").toBe(2);
    expect((meta.carried || []).some((x) => x.id === "r1"), "強化に使ったアーティファクトが持ち越し一覧に残ってしまっている").toBe(false);
  });

  it("武器(kind:gear)は強化画面に出ず、消費もされない", async () => {
    const weapon = { id: "w1", kind: "gear", slot: "weapon", band: "shallow", name: "武器のみ", rarity: "elite", asset: "weapon_shallow_2", hp: 0, atk: 8, def: 0 };
    const { container } = await renderGame({ meta: { roster: ["harpoon"], carried: [weapon] } });

    click(byContainsText(container, "強化", ".sd-hometab"));
    await flush();

    expect(container.textContent).toContain("強化に使えるアーティファクトがありません");
    expect(byContainsText(container, "武器のみ", ".sd-cell")).toBeFalsy();
  });

  it("アーティファクトを選ばずに名簿の強化ボタンを押しても何も起きない", async () => {
    const { container } = await renderGame({ meta: { roster: ["harpoon"], carried: [] } });

    click(byContainsText(container, "強化", ".sd-hometab"));
    await flush();

    expect(container.textContent).toContain("強化に使えるアーティファクトがありません");

    const meta = readMeta();
    expect(meta.crewLevels?.["harpoon"]).toBeFalsy();
  });
});
