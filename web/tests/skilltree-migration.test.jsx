// 回帰テスト: スキルツリー再設計(回収の余裕20段→8段への縮小)で廃止された
// carryFloor9〜20 を所持していたプレイヤーは、起動時に自動で全額還元される。
// 以前の還元ロジックは「廃止スキル1個につき一律6片」だったため、廃止された
// 上位ティア(最大169片)を持つプレイヤーが大きく損をする実バグがあった。
import { describe, it, expect } from "vitest";
import { renderGame, readMeta } from "./helpers.jsx";

describe("スキルツリー再設計の移行還元", () => {
  it("廃止された回収の余裕(上位ティア)は、当時のコストどおり全額還元される", async () => {
    // carryFloor9(56) と carryFloor12(81) を所持していた想定(合計137)。
    // skillTreeGen を1のままにしておくことで移行対象として検出させる。
    await renderGame({
      meta: {
        skillTreeGen: 1, shards: 10,
        skills: { carryFloor9: true, carryFloor12: true, kinI: true },
      },
    });

    const meta = readMeta();
    expect(meta.skillTreeGen).toBe(2);
    expect(meta.skills.carryFloor9, "廃止スキルが削除されていない").toBeUndefined();
    expect(meta.skills.carryFloor12, "廃止スキルが削除されていない").toBeUndefined();
    expect(meta.skills.kinI, "現行スキルまで消えてしまっている").toBe(true);
    // 10(所持) + 56 + 81 = 147。一律6片還元だと 10+6+6=22 のままになってしまう。
    expect(meta.shards, "廃止スキルの還元額が当時のコストどおりになっていない").toBe(147);
  });
});
