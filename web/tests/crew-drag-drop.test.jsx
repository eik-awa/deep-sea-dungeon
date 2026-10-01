// 回帰テスト: クルーカードのドラッグ&ドロップ。
// - 以前は「並び替え」ボタンを押していなくても常にドラッグで装備が入れ替わってしまい、
//   誤操作の元になっていた。現在は「装備交換」「並び替え」のどちらかのモードを
//   アイコンで明示的に選んだ時だけドラッグ/タップ入れ替えが有効になる。
// - 装備交換モード中: ドラッグ&ドロップで2人の装備一式が入れ替わる。
// - 並び替えモード中: 同じ操作で並び順が入れ替わる(タップ選択方式はそのまま維持)。
// - ほぼ動かさないタップ(ドロップ先=自分自身)では何も起きない(タップ選択の誤爆防止)。
// - モードを何も選んでいない閲覧時は、ドラッグしても何も起きない(誤操作防止の回帰確認)。
//
// happy-dom は document.elementFromPoint が常に null を返す(実レイアウトが無いため)ので、
// 実装が座標からドロップ先要素を特定するのに使っている elementFromPoint をテスト内で
// モックし、実際にドラッグした時と同じコードパスを通す。
import { describe, it, expect } from "vitest";
import { renderGame, byContainsText, flush, readGame, makeCrewFixture, baseGame } from "./helpers.jsx";

// React の state 更新(dragCrewId 等)はイベント間で1回ずつ反映させる必要がある
// (同一ティック内で3つのイベントを連続 dispatch すると、後続イベントのハンドラが
// 直前の setState 前の古いクロージャのまま実行され、ドラッグ判定が成立しない)。
async function pointerDrag(container, fromId, toId) {
  const from = container.querySelector(`[data-crew-id="${fromId}"]`);
  const to = container.querySelector(`[data-crew-id="${toId}"]`);
  if (!from) throw new Error(`drag source not found: ${fromId}`);
  const origElementFromPoint = document.elementFromPoint;
  document.elementFromPoint = () => to;
  try {
    from.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerId: 1, clientX: 0, clientY: 0 }));
    await flush();
    from.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, cancelable: true, pointerId: 1, clientX: 50, clientY: 50 }));
    await flush();
    from.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true, pointerId: 1, clientX: 50, clientY: 50 }));
    await flush();
  } finally {
    document.elementFromPoint = origElementFromPoint;
  }
}

describe("クルーカードのドラッグ&ドロップ", () => {
  it("装備交換モード中: ドラッグ&ドロップで2人の装備が入れ替わる", async () => {
    const gearX = { id: "gx", kind: "gear", slot: "suit", band: "shallow", name: "装備X", rarity: "std", asset: "suit_shallow_1", hp: 5, atk: 0, def: 1 };
    const crewA = makeCrewFixture({ id: "crew-a", gear: gearX });
    const crewB = makeCrewFixture({ id: "crew-b", gear: null });
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [crewA, crewB], bagOpen: true });
    const { container } = await renderGame({ game });

    const swapBtn = byContainsText(container, "装備交換", ".sd-btn");
    swapBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await flush();

    await pointerDrag(container, "crew-a", "crew-b");
    await flush();

    const g = readGame();
    const a = g.crew.find((c) => c && c.id === "crew-a");
    const b = g.crew.find((c) => c && c.id === "crew-b");
    expect(a.gear, "ドラッグ元の装備が外れていない").toBeNull();
    expect(b.gear?.name, "ドラッグ先に装備が渡っていない").toBe("装備X");
  });

  it("モードを選んでいない閲覧時: ドラッグしても装備は入れ替わらない(誤操作防止)", async () => {
    const gearX = { id: "gx", kind: "gear", slot: "suit", band: "shallow", name: "装備X", rarity: "std", asset: "suit_shallow_1", hp: 5, atk: 0, def: 1 };
    const crewA = makeCrewFixture({ id: "crew-a", gear: gearX });
    const crewB = makeCrewFixture({ id: "crew-b", gear: null });
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [crewA, crewB], bagOpen: true });
    const { container } = await renderGame({ game });

    await pointerDrag(container, "crew-a", "crew-b");
    await flush();

    const g = readGame();
    const a = g.crew.find((c) => c && c.id === "crew-a");
    const b = g.crew.find((c) => c && c.id === "crew-b");
    expect(a.gear?.name, "モードを選んでいないのにドラッグで装備が外れてしまっている").toBe("装備X");
    expect(b.gear, "モードを選んでいないのにドラッグで装備が渡ってしまっている").toBeNull();
  });

  it("並び替えモード中: ドラッグ&ドロップで並び順が入れ替わる", async () => {
    const crewA = makeCrewFixture({ id: "crew-a" });
    const crewB = makeCrewFixture({ id: "crew-b" });
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [crewA, crewB], bagOpen: true });
    const { container } = await renderGame({ game });

    const reorderBtn = byContainsText(container, "並び替え", ".sd-btn");
    reorderBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await flush();

    await pointerDrag(container, "crew-a", "crew-b");
    await flush();

    const g = readGame();
    expect(g.crew[0].id, "並び替えモードでのドラッグ&ドロップで並び順が入れ替わっていない").toBe("crew-b");
    expect(g.crew[1].id).toBe("crew-a");
  });

  it("ドロップ先が自分自身(ほぼ動かさないタップ相当)では何も起きない", async () => {
    const gearX = { id: "gx", kind: "gear", slot: "suit", band: "shallow", name: "装備X", rarity: "std", asset: "suit_shallow_1", hp: 5, atk: 0, def: 1 };
    const crewA = makeCrewFixture({ id: "crew-a", gear: gearX });
    const crewB = makeCrewFixture({ id: "crew-b", gear: null });
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [crewA, crewB], bagOpen: true });
    const { container } = await renderGame({ game });

    const swapBtn = byContainsText(container, "装備交換", ".sd-btn");
    swapBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await flush();

    await pointerDrag(container, "crew-a", "crew-a");
    await flush();

    const g = readGame();
    expect(g.crew.find((c) => c && c.id === "crew-a").gear?.name, "自分自身へのドロップで装備が変わってしまっている").toBe("装備X");
  });
});
