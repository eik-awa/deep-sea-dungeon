// 回帰テスト: 物資2倍広告のポップアップは、レア以上のドロップがある時だけ出る。
// バツを押すまで出続ける(自動では消えない)。広告成功(__onRewardAdResult__)で
// drops が追加され、二重付与防止のため doubleClaimed が立ってポップアップも消える。
import { describe, it, expect } from "vitest";
import { renderGame, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("物資2倍広告", () => {
  it("レア以上のドロップが無い時はポップアップが出ない", async () => {
    const stdDrop = { id: "d1", kind: "item", itemId: "medkit", name: "救命キット", asset: "medkit", rarity: "std" };
    const game = baseGame({ phase: "spoils", eventDone: true, crew: [makeCrewFixture()], drops: [stdDrop] });
    const { container } = await renderGame({ game });
    expect(container.textContent).not.toContain("広告を見て");
  });

  it("レア以上のドロップがある時はポップアップが出て、広告成功で drops が追加される", async () => {
    const rareDrop = { id: "d2", kind: "gear", slot: "suit", band: "shallow", name: "レア耐圧服", rarity: "rare", asset: "suit_shallow_3", hp: 20, atk: 0, def: 4 };
    // rewardAdPending: "double" は「広告視聴を要求して結果待ちの状態」を表す。実機では
    // ボタンをタップした時にこの状態になるが、テスト環境には window.webkit が無いため
    // ボタンをタップすると即座に失敗扱いになってしまう。ここではネイティブ側のコールバック
    // (__onRewardAdResult__)を直接呼び、広告視聴が成功して戻ってきた場面を再現する。
    const game = baseGame({
      phase: "spoils", eventDone: true, crew: [makeCrewFixture()], enemies: [],
      drops: [rareDrop], rewardAdPending: "double",
    });
    const { container } = await renderGame({ game });

    expect(container.textContent).toContain("高レア物資を検出");
    expect(typeof window.__onRewardAdResult__).toBe("function");
    window.__onRewardAdResult__("double", true);
    await flush(200);

    const g = readGame();
    expect(g.drops.length, "広告成功で追加ドロップが増えていない").toBeGreaterThan(1);
    expect(g.doubleClaimed, "二重付与防止フラグが立っていない").toBe(true);
    expect(container.textContent, "受け取り済みなのにポップアップがまだ出ている").not.toContain("広告を見て");
  });

  it("__onRewardAdResult__ が二重発火しても drops は1回分しか増えない", async () => {
    const rareDrop = { id: "d3", kind: "gear", slot: "suit", band: "shallow", name: "レア耐圧服", rarity: "rare", asset: "suit_shallow_3", hp: 20, atk: 0, def: 4 };
    const game = baseGame({
      phase: "spoils", eventDone: true, crew: [makeCrewFixture()], enemies: [],
      drops: [rareDrop], rewardAdPending: "double",
    });
    await renderGame({ game });

    window.__onRewardAdResult__("double", true);
    window.__onRewardAdResult__("double", true); // ネイティブ側からの二重コールバックを想定
    await flush(200);

    const g = readGame();
    // 1回目の成功で rewardAdPending は null に戻るため、2回目は
    // 「まだ保留中か」のガードで弾かれ、drops は1回分(rareDrop + 追加分)だけ増えるはず。
    expect(g.drops.length).toBe(2);
  });
});
