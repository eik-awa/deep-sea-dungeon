// 回帰テスト: 広告視聴による復活(reviveOffer)は1ランに1回だけ。
// meta.reviveUsedThisRun が立っている状態で全滅すると、復活オファーを経由せず
// そのまま「隊は沈んだ」(lost)画面へ進む。
// 注: g.phase が "lost"/"ending" の間は中断セーブ(GAME_KEY)への保存を意図的に止めている
// (タスキル再開時に解決済みの全滅画面を再現しないための設計)ため、ここでは readGame() では
// なく実際に描画されたDOM文言で画面遷移を確認する。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, click, flush, baseGame } from "./helpers.jsx";

function wipeSetup() {
  // 攻撃を耐えるほど硬く、反撃で確実に1発で沈める敵。クルーはHP1で確実に戦闘不能になる。
  const crew = [{
    id: "crew-1", kind: "crew", type: "diver", name: "テスト潜兵", rarity: "std",
    asset: "diver_shallow", band: "shallow", maxHp: 100, hp: 1, baseMaxHp: 100, atk: 999,
    gear: null, cd: 0, buffAtk: 0, guard: 0, down: false,
  }];
  const enemy = {
    id: "e1", bookId: "diagBook", name: "テスト敵", asset: "lanternfish",
    hp: 5000, maxHp: 5000, atk: 20, def: 0, weak: [], resist: [],
    poison: false, burn: false, drain: false, stun: false,
    scanned: false, paralyzed: 0, burning: 0, exposed: 0, anomaly: false, boss: false,
  };
  return baseGame({ phase: "battle", crew, enemies: [enemy], turnIdx: 0 });
}

describe("復活オファーの1ラン1回制限", () => {
  it("この潜航でまだ復活を使っていなければ、全滅時に復活オファーが出る", async () => {
    const game = wipeSetup();
    const { container } = await renderGame({ meta: { reviveUsedThisRun: false }, game });

    const atkBtn = byExactText(container, "攻 撃");
    click(atkBtn);
    await flush(1500);

    expect(container.textContent).toContain("隊 が 沈 み か け て い る");
  });

  it("この潜航で既に復活を使っていれば、全滅時に復活オファーを経由せず lost 画面へ進む", async () => {
    const game = wipeSetup();
    const { container } = await renderGame({ meta: { reviveUsedThisRun: true }, game });

    const atkBtn = byExactText(container, "攻 撃");
    click(atkBtn);
    await flush(1500);

    expect(container.textContent, "復活済みなのに再度オファーが出てしまっている").not.toContain("隊 が 沈 み か け て い る");
    expect(container.textContent).toContain("隊 は 沈 ん だ");
  });
});
