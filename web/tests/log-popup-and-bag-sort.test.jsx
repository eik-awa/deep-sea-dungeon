// 回帰テスト: 戦闘ログ欄をタップすると全文ポップアップが開く/袋を「種類順(レア度順)」と
// 「入手順」で切り替えられる(既定は種類順)。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, byContainsText, click, flush, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("戦闘ログの全文ポップアップ", () => {
  it("ログ欄をタップすると全文が開き、閉じるで閉じる", async () => {
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [makeCrewFixture()],
      logs: [{ text: "【戦闘開始】", hi: false, k: "a" }, { text: "敵1に27ダメージを与えた。", hi: false, k: "b" }] });
    const { container } = await renderGame({ game });
    click(container.querySelector(".sd-log"));
    await flush();
    expect(container.querySelector(".sd-log-full")?.textContent).toContain("敵1に27ダメージを与えた。");
    click(byExactText(container, "閉じる"));
    await flush();
    expect(container.querySelector(".sd-log-full")).toBeNull();
  });
});

describe("袋の並べ替え", () => {
  const mk = (id, rarity, name) => ({ id, kind: "gear", slot: "suit", band: "shallow", name, rarity, asset: "suit_shallow_1", hp: 1, atk: 0, def: 0 });
  it("既定は種類順(レア度の高い順)、「入手順」で入手した順に戻る", async () => {
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [makeCrewFixture()], bagOpen: true,
      bag: [mk("g1", "std", "並装備"), mk("g2", "rare", "希少装備")] });
    const { container } = await renderGame({ game });
    const order = () => Array.from(container.querySelectorAll(".sd-cell")).map((c) => c.textContent).filter((x) => /並装備|希少装備/.test(x)).map((x) => (x.includes("希少装備") ? "R" : "S"));
    expect(order()).toEqual(["R", "S"]);
    click(byExactText(container, "入手順"));
    await flush();
    expect(order()).toEqual(["S", "R"]);
  });
});
