// コンタクトシート(~/Downloads)を1個ずつのアイコン webp へ切り出す。
//   node scripts/slice-icons.mjs           … ~/Downloads にある分だけ切り出す(無いシートはスキップ)
//   node scripts/slice-icons.mjs --montage … 確認用に scripts/_montage.png も出力
//
// 方針: グリッドのセルから被写体の入る範囲だけを切り出す。
//       円形・正方形などの整形マスクは一切かけない。出力は元の縦横比のまま。
import sharp from "sharp";
import { mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DL = join(homedir(), "Downloads");
const ASSETS = new URL("../src/assets/", import.meta.url).pathname;
const OUT = join(ASSETS, "icons/");
mkdirSync(OUT, { recursive: true });
const LONG_SIDE = 256; // 長辺をこの px に縮小(縦横比は維持)

// sheet: [ファイル, 列数, 行数, insetX, insetY, chromaKeyHex?]
//   inset はセル境界から内側へ寄せる px。
//   chromaKeyHex を指定すると、その色に近い画素を透過(アルファ0)にしてから書き出す
//   (生成モデルが透過PNGを守らず、単色/背景を敷いてしまった場合の救済策)。
const SHEETS = {
  crew:        ["深海ダイバー・ネオンバッジ集.png",        4, 2, 40, 96],
  gear:        ["深海スチームパンク遺物コレクション.png",    3, 1, 46, 46],
  consumables: ["ネオンSFアイテム・アイコンセット.png",      3, 3, 26, 26],
  enemies:     ["深海異形クリーチャー図鑑.png",            4, 4, 24, 8],
  bosses:      ["深海宇宙怪物十選コンセプトシート.png",      5, 2, 12, 16],
  // 海域1(薄明層)通常敵10体・作り直し版(ICON-PROMPTS.md の「まとめて生成する版」参照)。
  // プロンプトで背景をクロマキー用のマゼンタ(#ff00ff)指定にしているので、それを透過化する。
  stage1creatures: ["海域1・薄明層クリーチャー集.png",      5, 2, 24, 12, "#ff00ff"],
  // 遺物15種・新規(ICON-PROMPTS.md 参照)。同じくマゼンタ背景を透過化する。
  // 生成結果がマゼンタ単色ではなく写真風のぼかし背景になっている場合はこの方式では
  // 綺麗に抜けないので、その時はプロンプト通りの単色マゼンタで生成し直す必要がある。
  relics15:        ["深海遺物コレクション・全15種.png",      5, 3, 30, 20, "#ff00ff"],
  // 武器15種・新規(WEAPON-ICON-PROMPTS.md 参照)。行=海域帯(shallow/mid/deep)、列=レア度1〜5。
  weapons15:       ["深海武器コレクション・全15種.png",      5, 3, 30, 20, "#ff00ff"],
};

// (r,g,b) が keyColor にどれだけ近いかでアルファを落とす。閾値内は完全透過、
// 閾値〜2倍閾値はなだらかに透過させて縁のギザつきを抑える。
async function chromaKeyToAlpha(inputBuf, keyHex, threshold = 42) {
  const kr = parseInt(keyHex.slice(1, 3), 16), kg = parseInt(keyHex.slice(3, 5), 16), kb = parseInt(keyHex.slice(5, 7), 16);
  const { data, info } = await sharp(inputBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - kr, dg = data[i + 1] - kg, db = data[i + 2] - kb;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist < threshold) data[i + 3] = 0;
    else if (dist < threshold * 2) data[i + 3] = Math.round(data[i + 3] * (dist - threshold) / threshold);
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
}

// key: [sheet, col, row, destDir?]  destDir を省略すると src/assets/icons/ へ出力
const ICONS = {
  sweeper:["crew",0,0], harpoon:["crew",1,0], cabler:["crew",2,0], thermal:["crew",3,0],
  medic:["crew",0,1], scanner:["crew",1,1], diver:["crew",2,1], resonator:["crew",3,1],

  suit:["gear",0,0], module:["gear",1,0], relic:["gear",2,0],

  medkit:["consumables",0,0], serum:["consumables",1,0], charge:["consumables",2,0],
  torpedo:["consumables",0,1], coolant:["consumables",1,1], core:["consumables",2,1],
  shard:["consumables",0,2], specimen:["consumables",1,2], echo:["consumables",2,2],

  jelly:["enemies",0,0], lantern:["enemies",1,0], swarm:["enemies",2,0], crustacean:["enemies",3,0],
  drifter:["enemies",0,1], husk:["enemies",1,1], ossuary:["enemies",2,1], pulse:["enemies",3,1],
  prism:["enemies",0,2], spire:["enemies",1,2], wraith:["enemies",2,2], watcher:["enemies",3,2],
  anomaly:["enemies",0,3],

  bossKraken:["bosses",0,0], bossReef:["bosses",1,0], bossHulk:["bosses",2,0], bossVent:["bosses",3,0], bossBloom:["bosses",4,0],
  bossGlacier:["bosses",0,1], bossMagnet:["bosses",1,1], bossLeviathan:["bosses",2,1], bossSilence:["bosses",3,1], bossStar:["bosses",4,1],

  // 海域1・薄明層クリーチャー(5列×2行)。ENEMY_BOOK の id に一致させ、既存ファイルを上書きする。
  lanternfish:["stage1creatures",0,0,"creatures/stage1"], hatchetfish:["stage1creatures",1,0,"creatures/stage1"],
  viperfish:["stage1creatures",2,0,"creatures/stage1"], driftjelly:["stage1creatures",3,0,"creatures/stage1"],
  glassSquid:["stage1creatures",4,0,"creatures/stage1"],
  combJelly:["stage1creatures",0,1,"creatures/stage1"], krillSwarm:["stage1creatures",1,1,"creatures/stage1"],
  bristlemouth:["stage1creatures",2,1,"creatures/stage1"], paleShrimp:["stage1creatures",3,1,"creatures/stage1"],
  siphonChain:["stage1creatures",4,1,"creatures/stage1"],

  // 遺物15種(5列×3行)。relicId に一致させ、src/assets/relics/ へ新規出力する。
  sonarLens:["relics15",0,0,"relics"], ballast:["relics15",1,0,"relics"], coilHeart:["relics15",2,0,"relics"],
  tideGlass:["relics15",3,0,"relics"], blackBox:["relics15",4,0,"relics"],
  pressureFin:["relics15",0,1,"relics"], echoDrive:["relics15",1,1,"relics"], starCore:["relics15",2,1,"relics"],
  gillFilter:["relics15",3,1,"relics"], driftAnchor:["relics15",4,1,"relics"],
  pressureCell:["relics15",0,2,"relics"], deepMemory:["relics15",1,2,"relics"], toxinFin:["relics15",2,2,"relics"],
  crewNet:["relics15",3,2,"relics"], temperedHull:["relics15",4,2,"relics"],

  // 武器15種(5列×3行)。行=海域帯(shallow/mid/deep)、列=レア度1〜5。ASSETS の
  // `weapon_<band>_<n>` キーに一致させ、既存の suit/module と同じ src/assets/icons/ へ出力する。
  weapon_shallow_1:["weapons15",0,0], weapon_shallow_2:["weapons15",1,0], weapon_shallow_3:["weapons15",2,0],
  weapon_shallow_4:["weapons15",3,0], weapon_shallow_5:["weapons15",4,0],
  weapon_mid_1:["weapons15",0,1], weapon_mid_2:["weapons15",1,1], weapon_mid_3:["weapons15",2,1],
  weapon_mid_4:["weapons15",3,1], weapon_mid_5:["weapons15",4,1],
  weapon_deep_1:["weapons15",0,2], weapon_deep_2:["weapons15",1,2], weapon_deep_3:["weapons15",2,2],
  weapon_deep_4:["weapons15",3,2], weapon_deep_5:["weapons15",4,2],
};

const meta = {};
for (const [k, [file]] of Object.entries(SHEETS)) {
  const p = join(DL, file);
  if (!existsSync(p)) { console.log(`skip (not in Downloads): ${file}`); continue; }
  meta[k] = { path: p, ...(await sharp(p).metadata()) };
}
if (Object.keys(meta).length === 0) {
  console.error("~/Downloads に対象のコンタクトシートが1枚も見つかりませんでした。");
  process.exit(1);
}

const results = [];
for (const [key, [sheet, col, row, destDir]] of Object.entries(ICONS)) {
  if (!meta[sheet]) continue; // そのシートが Downloads に無ければスキップ
  const { path, width: W, height: H } = meta[sheet];
  const [, cols, rows, ix, iy, chromaKeyHex] = SHEETS[sheet];
  const cw = W / cols, ch = H / rows;
  let left = Math.round(col * cw + ix);
  let top = Math.round(row * ch + iy);
  let w = Math.round(cw - ix * 2);
  let h = Math.round(ch - iy * 2);
  left = Math.max(0, left); top = Math.max(0, top);
  w = Math.min(w, W - left); h = Math.min(h, H - top);

  let pipeline = sharp(path).extract({ left, top, width: w, height: h });
  if (chromaKeyHex) {
    const cropped = await pipeline.toBuffer();
    pipeline = await chromaKeyToAlpha(cropped, chromaKeyHex);
  }
  const buf = await pipeline
    // 長辺 = LONG_SIDE、縦横比は維持、パディングなし
    .resize(LONG_SIDE, LONG_SIDE, { fit: "inside", withoutEnlargement: false })
    .webp({ quality: 84, alphaQuality: 92, effort: 6 })
    .toBuffer();
  const outDir = destDir ? join(ASSETS, destDir) : OUT;
  mkdirSync(outDir, { recursive: true });
  await sharp(buf).toFile(join(outDir, `${key}.webp`));
  results.push({ key, buf });
}
console.log(`wrote ${results.length} icons`);

if (process.argv.includes("--montage")) {
  const cols = 8, cell = 150;
  const rows = Math.ceil(results.length / cols);
  const tiles = await Promise.all(results.map(async ({ buf }) =>
    sharp(buf).resize(cell, cell, { fit: "contain", background: "#0a1624" })
      .flatten({ background: "#0a1624" }).png().toBuffer()));
  await sharp({ create: { width: cols * cell, height: rows * cell, channels: 3, background: "#0a1624" } })
    .composite(tiles.map((input, i) => ({ input, left: (i % cols) * cell, top: Math.floor(i / cols) * cell })))
    .png().toFile(new URL("_montage.png", import.meta.url).pathname);
  console.log("wrote _montage.png");
}
