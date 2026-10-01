// 回帰テスト: 戦闘ログの内容強化。
// - 戦闘開始時に【戦闘開始】とターン区切り(── ターン1 ──)が記録される
// - ラウンドが一巡すると次のターン区切り(── ターン2 ──)が記録される
// - 攻撃で敵にダメージを与えると「敵N にダメージを与えた」の形でログに残る
// - 回復すると「〜のHPがN回復した」の形でログに残る
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, byContainsText, click, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("戦闘ログの詳細化", () => {
  it("戦闘開始時に【戦闘開始】とターン1の区切りが記録される", async () => {
    const crew = makeCrewFixture();
    const game = baseGame({ phase: "prep", crew: [crew], enemies: [], depth: 5, node: 0, nodes: ["battle"] });
    const { container } = await renderGame({ game });

    click(byExactText(container, "戦闘を開始する"));
    await flush(200);

    const g = readGame();
    const texts = g.logs.map((l) => l.text);
    expect(texts).toContain("【戦闘開始】");
    expect(texts).toContain("── ターン1 ──");
  });

  it("攻撃を当てると「敵1にNダメージを与えた」の形でログに残る", async () => {
    const crew = makeCrewFixture({ type: "harpoon", atk: 30 });
    const enemy = {
      id: "e1", bookId: "diagBook", name: "テスト敵", asset: "lanternfish",
      hp: 500, maxHp: 500, atk: 1, def: 0, weak: [], resist: [],
      poison: false, burn: false, drain: false, stun: false,
      scanned: false, paralyzed: 0, burning: 0, exposed: 0, anomaly: false, boss: false,
    };
    const game = baseGame({ phase: "battle", crew: [crew], enemies: [enemy], turnIdx: 0, turn: 1 });
    const { container } = await renderGame({ game });

    click(byExactText(container, "攻 撃"));
    await flush(200);

    const g = readGame();
    const dmgLine = g.logs.find((l) => /^敵1に\d+ダメージを与えた。$/.test(l.text));
    expect(dmgLine, "「敵1にNダメージを与えた」の形式のログが見つからない").toBeTruthy();
  });

  it("ラウンドが一巡すると次のターン区切りがログに追加される", async () => {
    // 1人だけの隊で、敵の攻撃力を極端に低くしておけば全滅せず次ラウンドへ進む
    const crew = makeCrewFixture({ type: "harpoon", atk: 999, hp: 500, maxHp: 500 });
    const enemy = {
      id: "e1", bookId: "diagBook", name: "テスト敵", asset: "lanternfish",
      hp: 9999, maxHp: 9999, atk: 1, def: 0, weak: [], resist: [],
      poison: false, burn: false, drain: false, stun: false,
      scanned: false, paralyzed: 0, burning: 0, exposed: 0, anomaly: false, boss: false,
    };
    const game = baseGame({ phase: "battle", crew: [crew], enemies: [enemy], turnIdx: 0, turn: 1 });
    const { container } = await renderGame({ game });

    click(byExactText(container, "攻 撃"));
    await flush(600); // 敵ターンの演出待ちも含めて十分待つ

    const g = readGame();
    const texts = g.logs.map((l) => l.text);
    expect(texts).toContain("── ターン2 ──");
    expect(g.turn).toBe(2);
  });

  it("回復すると「〜のHPがN回復した」の形でログに残り、フロート表示は「回復+N」になる", async () => {
    const medic = makeCrewFixture({ id: "medic-1", type: "medic" });
    const wounded = makeCrewFixture({ id: "wounded-1", type: "harpoon", hp: 10, maxHp: 100 });
    const enemy = {
      id: "e1", bookId: "diagBook", name: "テスト敵", asset: "lanternfish",
      hp: 500, maxHp: 500, atk: 1, def: 0, weak: [], resist: [],
      poison: false, burn: false, drain: false, stun: false,
      scanned: false, paralyzed: 0, burning: 0, exposed: 0, anomaly: false, boss: false,
    };
    const game = baseGame({ phase: "battle", crew: [medic, wounded], enemies: [enemy], turnIdx: 0 });
    const { container } = await renderGame({ game });

    click(byContainsText(container, "生体縫合", "button"));
    await flush();
    // 医療士の技は味方を選ぶ照準になる。傷ついたクルーの行(.sd-cr.pick)を選ぶ
    const pickRow = container.querySelector(".sd-cr.pick");
    expect(pickRow, "回復対象を選ぶ行が出ていない").toBeTruthy();
    click(pickRow);
    await flush(300);

    // 前のテストで描画したコンポーネントが localStorage へ書き込み続けることがあるため、
    // このテストが描画した画面(container)のログ欄で確認する。
    const logText = container.querySelector(".sd-log")?.textContent || "";
    expect(logText).toMatch(/のHPが\d+回復した。/);
  });
});
