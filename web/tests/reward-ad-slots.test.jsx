// 回帰テスト: リワード広告(復活/2倍物資)は枠ごとに独立した1日6回の上限を持つ
// (以前は1つの共有プールで合計3回しかなかった)。片方を使い切ってももう片方には
// 影響しない。放置・カジュアル系アプリの目安(1枠3〜6回/日)に合わせている。
import { describe, it, expect } from "vitest";
import { renderGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("リワード広告の枠ごとの日次上限", () => {
  it("復活で6回使い切っても、2倍物資の残り回数は減らない", async () => {
    const rareDrop = {
      id: "rare-1", kind: "gear", slot: "suit", band: "shallow",
      name: "レア耐圧服", rarity: "rare", asset: "suit_shallow_3", hp: 20, atk: 0, def: 4,
    };
    const game = baseGame({ phase: "spoils", eventDone: true, crew: [makeCrewFixture()], drops: [rareDrop] });
    const today = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`;
    const { container } = await renderGame({
      meta: { rewardAd: { date: today, counts: { revive: 6, double: 0 } } },
      game,
    });

    // 2倍物資のオファーは復活の残り回数と無関係に出る(残り6回のまま)
    expect(container.textContent).toContain("残り6回");
  });

  it("既定(meta.rewardAd未設定)では両方とも1日6回使える", async () => {
    const rareDrop = {
      id: "rare-1", kind: "gear", slot: "suit", band: "shallow",
      name: "レア耐圧服", rarity: "rare", asset: "suit_shallow_3", hp: 20, atk: 0, def: 4,
    };
    const game = baseGame({ phase: "spoils", eventDone: true, crew: [makeCrewFixture()], drops: [rareDrop] });
    const { container } = await renderGame({ game });
    expect(container.textContent).toContain("残り6回");
  });
});
