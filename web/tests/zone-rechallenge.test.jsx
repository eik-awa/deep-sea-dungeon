// 回帰テスト: 「海域を選んで再挑戦」(pendingZone)。
// 以前は再挑戦時だけ持ち越し品(meta.carried)を弾いており、以前は持ち越し装備・遺物
// 込みでクリアできていた海域が、再挑戦のたびに素の状態へ戻されて急にクリアできなく
// なってしまう(実質的な弱体化に感じられる)という問題があった。現在は再挑戦でも
// 通常の潜航と同じく持ち越し品を適用し、同じく一度きりの引き継ぎとして消費する。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, byContainsText, click, flush, readGame, readMeta } from "./helpers.jsx";

describe("海域再挑戦", () => {
  it("再挑戦を選んで開始した潜航の深度は、選んだ海域のチェックポイントから始まる", async () => {
    const { container } = await renderGame({ meta: { checkpoint: 3 } });

    const rechallengeBtn = byExactText(container, "海域を選んで再挑戦");
    expect(rechallengeBtn, "再挑戦ボタンが見つからない").toBeTruthy();
    click(rechallengeBtn);
    await flush();

    const zoneBtn = byContainsText(container, "海域 2", "button");
    expect(zoneBtn, "海域2のセルが見つからない").toBeTruthy();
    click(zoneBtn);
    await flush();

    expect(container.textContent).toContain("再挑戦モード");

    const recBtn = byExactText(container, "推奨編成");
    click(recBtn);
    await flush();
    const diveBtn = byContainsText(container, "人で潜航する", "button");
    click(diveBtn);
    await flush(200);

    const g = readGame();
    expect(g.depth).toBe(11); // 海域2(index=1) → 1*10+1
  });

  it("再挑戦でも持ち越し品(meta.carried)が通常の潜航と同じく反映され、一度きりの引き継ぎとして消費される", async () => {
    const carriedGear = { id: "carry-x", kind: "gear", slot: "suit", band: "shallow", name: "持ち込み装備", rarity: "rare", asset: "suit_shallow_3", hp: 9, atk: 0, def: 1 };
    const { container } = await renderGame({ meta: { checkpoint: 3, carried: [carriedGear] } });

    click(byExactText(container, "海域を選んで再挑戦"));
    await flush();
    click(byContainsText(container, "海域 2", "button"));
    await flush();
    click(byExactText(container, "推奨編成"));
    await flush();
    click(byContainsText(container, "人で潜航する", "button"));
    await flush(200);

    const g = readGame();
    // startDive は持ち帰り品に新しい id を振り直す(id 衝突防止のため)ので、名前で照合する
    expect(g.bag.some((x) => x.name === "持ち込み装備"),
      "再挑戦でも持ち越し装備が持ち込まれるはずが、収納に入っていない").toBe(true);

    const meta = readMeta();
    expect(meta.carried, "一度きりの引き継ぎのはずが、meta.carried が消費されず残っている(次回以降も再付与されてしまう)")
      .toEqual([]);
  });
});
