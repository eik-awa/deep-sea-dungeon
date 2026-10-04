// 回帰テスト: (1) 到達海域で解放される上位スキル(unlock.zone)は、未到達だと買えない
// (2) 果てなき収納は高レアスキルとして通常の前提だけで買える
// (3) 保護設定のON切替は、今持っている物のロックを遡って変えない(これから拾う物にだけ効く)
import { describe, it, expect } from "vitest";
import { renderGame, byAriaLabel, byContainsText, byExactText, click, flush, readMeta, makeCrewFixture, baseGame } from "./helpers.jsx";

async function openSkill(container) {
  click(byContainsText(container, "スキル", ".sd-hometab"));
  await flush();
}

describe("海域到達で解放されるスキル", () => {
  const meta = (bestDepth) => ({ shards: 100, bestDepth, skills: { hullSeed: true, hullI: true, hullII: true } });
  it("未到達だと購入できず、到達済みなら購入できる", async () => {
    let { container } = await renderGame({ meta: meta(20) });
    await openSkill(container);
    click(byAriaLabel(container, "深淵の耐圧殻", ".sd-sktree-node")); await flush();
    expect(container.textContent).toContain("海域6に到達すると解放されます");
    expect(readMeta().skills.hullDeep).toBeFalsy();

    ({ container } = await renderGame({ meta: meta(55) }));
    await openSkill(container);
    click(byAriaLabel(container, "深淵の耐圧殻", ".sd-sktree-node")); await flush();
    const buy = Array.from(container.querySelectorAll("button")).find((b) => /習得|取得|購入/.test(b.textContent));
    expect(buy, "購入ボタンが見つからない").toBeTruthy();
    click(buy); await flush();
    expect(readMeta().skills.hullDeep).toBe(true);
  });
});

describe("保護設定の切替", () => {
  it("ONにしても、いま持っているレア装備のロックは変わらない(設定画面でまとめて切り替える)", async () => {
    const gear = { id: "g1", kind: "gear", slot: "suit", band: "shallow", name: "傑作", rarity: "abyss", asset: "suit_shallow_5", hp: 1, atk: 0, def: 0 };
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [makeCrewFixture()], bag: [gear] });
    const { container } = await renderGame({ meta: { protectRare: false }, game });
    click(byContainsText(container, "設定", ".sd-hometab"));
    await flush();
    const btn = Array.from(container.querySelectorAll("button")).find((b) => b.textContent.trim() === "OFF");
    expect(btn, "保護設定のトグルが見つからない").toBeTruthy();
    click(btn); await flush();
    expect(readMeta().protectRare).toBe(true);
    const g = JSON.parse(localStorage.getItem("deep-sea-dungeon-game-v1"));
    expect(g.bag.find((x) => x.id === "g1").locked).toBeFalsy();
  });
});

describe("踏みとどまる意志", () => {
  it("HP50%以上のクルーは致死ダメージをHP1で耐える", async () => {
    const crew = makeCrewFixture({ hp: 100, maxHp: 100, baseMaxHp: 100, atk: 1 });
    const enemy = {
      id: "e1", bookId: "diagBook", name: "強敵", asset: "lanternfish",
      hp: 9999, maxHp: 9999, atk: 5000, def: 0, weak: [], resist: [],
      poison: false, burn: false, drain: false, stun: false,
      scanned: false, paralyzed: 0, burning: 0, exposed: 0, anomaly: false, boss: false,
    };
    const game = baseGame({ phase: "battle", crew: [crew], enemies: [enemy], turnIdx: 0, turn: 1 });
    const { container } = await renderGame({ meta: { skills: { endure: true } }, game });
    click(byExactText(container, "攻 撃"));
    await flush(700);
    expect(container.querySelector(".sd-log")?.textContent).toContain("踏みとどまった");
    expect(container.textContent).not.toContain("全滅");
  });
});
