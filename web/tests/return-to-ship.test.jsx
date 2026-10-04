// 回帰テスト: 「帰還」ステータス。潜航中に「潜航をやめて母船へ戻る」、あるいはタイトルの
// 「帰還する」のどちらから始めても、全滅(lost)やエンディング(ending)と同じく独立した
// 画面(phase:"return")が挟まり、持ち帰った物のまとめが表示されてから母船(タイトル)へ戻る
// (以前はタイトル起点だけ「新しく始める」という別の破棄フローになっていたが、実際には
// 持ち物は捨てずにストレージへ持ち帰る動作だったため、帰還に統一した)。
import { describe, it, expect } from "vitest";
import {
  renderGame, byExactText, byContainsText, click, flush, readGame, readMeta, makeCrewFixture, baseGame,
} from "./helpers.jsx";

describe("帰還(潜航を自主的に切り上げて母船へ戻る)", () => {
  it("潜航中「潜航をやめて母船へ戻る」で確定すると「帰還」画面が出て、持ち帰った物が表示される。「母船へ」でタイトルに戻る", async () => {
    const gear = { id: "g1", kind: "gear", slot: "suit", band: "shallow", name: "テスト装備", rarity: "std", asset: "suit_shallow_1", hp: 5, atk: 0, def: 1 };
    const crew = makeCrewFixture({ gear });
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [crew], bagOpen: true });
    const { container } = await renderGame({ meta: { carrySlots: 3 }, game });

    click(byContainsText(container, "潜航をやめて母船へ戻る", "button"));
    await flush();
    click(byExactText(container, "この内容で帰還する"));
    await flush();

    expect(container.textContent).toContain("帰 還");
    expect(container.textContent).toContain("テスト装備");
    // タイトルへはまだ切り替わっていない(帰還画面を経由する)
    expect(container.textContent).not.toContain("深海ダンジョン");

    click(byExactText(container, "母船へ"));
    await flush();

    expect(container.textContent).toContain("深海ダンジョン");
    expect(readGame(), "帰還を確定したのに中断セーブが残っている").toBeNull();
    expect(readMeta().carried?.some((x) => x.id === "g1")).toBe(true);
  });

  it("タイトルの「帰還する」から確定した場合も同じ帰還画面を経由してからタイトルに戻る", async () => {
    const gear = { id: "g2", kind: "gear", slot: "suit", band: "shallow", name: "中断中の装備", rarity: "std", asset: "suit_shallow_1", hp: 5, atk: 0, def: 1 };
    const crew = makeCrewFixture({ gear });
    const game = baseGame({ phase: "wreck", eventDone: true, crew: [crew], depth: 7 });
    const { container } = await renderGame({ meta: { carrySlots: 1 }, game, skipResume: true });

    click(byExactText(container, "帰還する(持ち物を船内ストレージへ持ち帰ります)"));
    await flush();
    click(byExactText(container, "この内容で帰還する"));
    await flush();

    expect(container.textContent).toContain("帰 還");
    expect(container.textContent).toContain("中断中の装備");
    expect(container.textContent).not.toContain("深海ダンジョン");

    click(byExactText(container, "母船へ"));
    await flush();

    expect(container.textContent).toContain("深海ダンジョン");
    expect(readGame(), "帰還を確定したのに中断セーブが残っている").toBeNull();
    expect(readMeta().carried?.some((x) => x.id === "g2")).toBe(true);
  });
});
