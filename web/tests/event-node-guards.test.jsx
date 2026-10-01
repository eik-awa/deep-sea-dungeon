// 回帰テスト: 残骸調査(searchWreck)・補給(resupply)・関所強行突破(gateForceThrough)・
// 人魚の祝福(receiveBlessing)は、いずれも1ノードにつき1回だけ成立する(eventDone ガード)。
// 連打しても無料回復やダメージの多重適用が起きない。
import { describe, it, expect } from "vitest";
import { renderGame, byExactText, click, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

describe("地点イベントの単発性", () => {
  it("補給(隊を休ませる)を連打しても回復は1回分だけ", async () => {
    const crew = makeCrewFixture({ hp: 10, maxHp: 100 });
    const game = baseGame({ phase: "supply", eventDone: false, crew: [crew], drops: [] });
    const { container } = await renderGame({ game });

    const btn = byExactText(container, "隊を休ませる");
    expect(btn, "「隊を休ませる」ボタンが見つからない").toBeTruthy();
    click(btn); click(btn); click(btn); // 連打
    await flush(200);

    const g = readGame();
    // 45%回復1回分(10 + round(100*0.45) = 55)のはず。連打で複数回成立していたら100(満タン)になる。
    expect(g.crew[0].hp).toBe(55);
  });

  it("関所の強行突破を連打してもダメージは1回分だけ", async () => {
    const crew = makeCrewFixture({ hp: 100, maxHp: 100 });
    const game = baseGame({ phase: "gate", eventDone: false, crew: [crew], bag: [] });
    const { container } = await renderGame({ game });

    const btn = byExactText(container, "何も捧げず強行突破する");
    expect(btn, "強行突破ボタンが見つからない").toBeTruthy();
    click(btn); click(btn); click(btn);
    await flush(200);

    const g = readGame();
    // 素の被ダメは10固定(スキル未購入)。連打で複数回成立していたら20以上減っているはず。
    expect(g.crew[0].hp).toBe(90);
  });

  it("人魚の祝福を連打してもバフは1回分だけ(ターン数が加算され続けない)", async () => {
    const crew = makeCrewFixture({ buffAtk: 0, buffT: 0 });
    const game = baseGame({ phase: "mermaid", eventDone: false, crew: [crew] });
    const { container } = await renderGame({ game });

    const btn = byExactText(container, "祝福を受ける");
    expect(btn, "祝福を受けるボタンが見つからない").toBeTruthy();
    click(btn); click(btn); click(btn);
    await flush(200);

    const g = readGame();
    expect(g.crew[0].buffT).toBe(10); // 基礎10ターン(スキル未購入)。連打で複数回成立していたら20,30…になる
  });
});
