// 回帰テスト: スキルツリーは潜航中には開けない(タイトル画面の MetaButtons 経由のみ)。
// 以前は戦利品画面にレア以上のドロップが出ると「スキルツリーは母船に戻ってから
// 確認できます」という注記を出していたが、押せるボタンも無いのに毎回表示されるのは
// 不要という判断で削除した。削除後も、潜航中に別の手段でスキルツリーへ入れてしまう
// 回帰が起きていないことを併せて確認する。
import { describe, it, expect } from "vitest";
import { renderGame, baseGame, makeCrewFixture } from "./helpers.jsx";

describe("潜航中のスキルツリー", () => {
  it("レア以上のドロップがある戦利品画面で「母船に戻ってから」の注記が出ない", async () => {
    const rareDrop = {
      id: "rare-1", kind: "gear", slot: "suit", band: "shallow",
      name: "レア耐圧服", rarity: "rare", asset: "suit_shallow_3", hp: 20, atk: 0, def: 4,
    };
    const game = baseGame({ phase: "spoils", eventDone: true, crew: [makeCrewFixture()], drops: [rareDrop] });
    const { container } = await renderGame({ game });

    expect(container.textContent).not.toContain("母船に戻ってから");
  });

  it("潜航中(screen=dive)の画面には、スキルツリーを開くボタン自体が存在しない", async () => {
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [makeCrewFixture()] });
    const { container } = await renderGame({ game });

    const skillBtn = Array.from(container.querySelectorAll("button")).find((b) => b.textContent.includes("スキルツリー"));
    expect(skillBtn, "潜航中にスキルツリーを開けるボタンが存在してしまっている").toBeFalsy();
  });
});
