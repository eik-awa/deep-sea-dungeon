// 回帰テスト: 名簿(meta.roster)と永久レベル(meta.crewLevels)の旧「type:rarity」キー形式
// からの移行(migrateCrewRoster)。
// クルーの名簿を「職種(type)のみ・全8種」に簡素化した際、旧セーブに残っていた
// "harpoon:elite" のようなキーを変換する処理を入れ忘れると、CREW_TYPES[type] の判定に
// 一致せず名簿・強化画面から静かに消えてしまう(「所持していたクルーが消えた」ように
// 見える不具合)。起動時に自動で新形式へ変換され、消えないことを確認する。
import { describe, it, expect } from "vitest";
import { renderGame, byContainsText, click, flush, readMeta } from "./helpers.jsx";

describe("名簿・crewLevels の旧形式(type:rarity)からの移行", () => {
  it("旧形式のセーブを読み込んでも名簿が消えず、type単独キーに変換されて保存し直される", async () => {
    const legacyMeta = {
      roster: ["harpoon:elite", "medic:std", "scanner:rare"],
      crewLevels: { "harpoon:elite": 3, "harpoon:rare": 1, "medic:std": 5 },
    };
    const { container } = await renderGame({ meta: legacyMeta });
    await flush();

    const meta = readMeta();
    expect(meta.roster, "旧形式のキーが変換されず名簿から消えている").toEqual(
      expect.arrayContaining(["harpoon", "medic", "scanner"])
    );
    expect(meta.roster.length, "重複や無効なエントリが残っている").toBe(3);
    // 同じ職種で複数レアリティ枠のレベルがあった場合、最も高いレベルを採用する
    expect(meta.crewLevels?.harpoon, "同一職種の最大レベルが採用されていない").toBe(3);
    expect(meta.crewLevels?.medic).toBe(5);

    // 実際に名簿画面(強化画面)にも表示され、選択できることを確認する
    click(byContainsText(container, "強化", ".sd-hometab"));
    await flush();
    expect(container.textContent).toContain("名簿(3)");
  });

  it("既に新形式(typeのみ)のセーブはそのまま変わらない", async () => {
    await renderGame({ meta: { roster: ["harpoon", "medic"], crewLevels: { harpoon: 2 } } });
    await flush();
    const meta = readMeta();
    expect(meta.roster).toEqual(["harpoon", "medic"]);
    expect(meta.crewLevels?.harpoon).toBe(2);
  });
});
