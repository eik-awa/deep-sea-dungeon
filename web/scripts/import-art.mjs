// ユーザー生成の敵100体 + 背景10枚を webp へ変換して配置。
//   元素材は ../../art-raw/stage<N>/ にステージごとにファイリング:
//     敵:   art-raw/stage<N>/<N>-<n>.png   → src/assets/creatures/stage<N>/<slug>.webp
//     背景: art-raw/stage<N>/back.jpeg      → src/assets/bg/zone<N>.webp(上部の題字を少しトリム)
//   クルー/装備シートは art-raw/ 直下(crew/ · gear/ · consumables.jpeg)。
//   旧レイアウト(art-raw/<N>-<n>.png 直置き)も後方互換で探す。
import sharp from "sharp";
import { mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = [join(here, "../../images"), join(here, "../../art-raw"), join(here, "../../art/source")]
  .find((p) => existsSync(p));
if (!SRC) { console.error("source image dir not found (images/ or art-raw/)"); process.exit(1); }

// ステージ N の敵 n / 背景 のソースパス(stage<N>/ 優先、なければ直置き)
const enemySrc = (z, n) => [join(SRC, `stage${z}`, `${z}-${n}.png`), join(SRC, `${z}-${n}.png`)].find(existsSync);
const backSrc = (z) => [
  join(SRC, `stage${z}`, "back.jpeg"), join(SRC, `stage${z}`, "back.jpg"), join(SRC, `stage${z}`, "back.png"),
  join(SRC, `${z}_back.jpeg`), join(SRC, `${z}_back.jpg`), join(SRC, `${z}_back.png`),
].find(existsSync);

const CRE = join(here, "../src/assets/creatures");
const BG = join(here, "../src/assets/bg");
mkdirSync(CRE, { recursive: true });
mkdirSync(BG, { recursive: true });

// CREATURE-DESIGN.md の順序どおり。zone(1-10)ごとに位置1-10 → slug
const SLUGS = [
  // zone 1
  ["lanternfish","hatchetfish","viperfish","driftjelly","glassSquid","combJelly","krillSwarm","bristlemouth","paleShrimp","siphonChain"],
  // zone 2
  ["armoredCrab","stonePolyp","coralWraith","urchinCrown","moray","clamMaw","reefLantern","brittleNest","spongeChoir","anemoneVeil"],
  // zone 3
  ["hollowSuit","hulkCore","rustChoir","barnacleHost","drownLantern","cargoSwarm","anchorWraith","propGhast","logbookThing","brineDoll"],
  // zone 4
  ["ventHeart","scorchMoth","sulfurGrazer","blackSmoker","tubewormKing","magmaJelly","thermophage","brimstoneCrab","ashChoir","ventLarva"],
  // zone 5
  ["luminMatrix","sirenLure","eyeBloom","phosphorSaint","glowGospel","jellyChandelier","deepFirefly","mirrorFish","haloLeech","radiantChild"],
  // zone 6
  ["iceShellBeast","frostWisp","glacierCorpse","rimeCrawler","hushWhale","shatterPolyp","frozenChoir","permafrostHand","blizzardEye","cryoSpawn"],
  // zone 7
  ["magnetite","pulseNode","compassWraith","polarityTwin","ironChoir","lodestoneSaint","fluxSerpent","reverseFish","hollowNorth","magnetSpawn"],
  // zone 8
  ["ossuaryLord","marrowEater","ribCathedral","skullTide","boneChoir","godRemnant","calciteWidow","gnawSwarm","hollowIdol","valeSpawn"],
  // zone 9
  ["silentOne","voidFish","theWatching","muteChoir","angleThing","pressureSaint","namelessGuest","hollowChord","trenchMother","quietSpawn"],
  // zone 10
  ["starSpawn","nebulite","voidWarden","theOpening","constellationBeast","cosmicChoir","theGeometer","drownedGod","observerChild","theReturn"],
];

let nCre = 0, missCre = [];
for (let z = 1; z <= 10; z++) {
  const stageDir = join(CRE, `stage${z}`);
  mkdirSync(stageDir, { recursive: true });
  for (let n = 1; n <= 10; n++) {
    const src = enemySrc(z, n);
    const slug = SLUGS[z - 1][n - 1];
    if (!src) { missCre.push(`${z}-${n} (${slug})`); continue; }
    const buf = await sharp(src)
      .trim({ threshold: 12 })                       // 均一な縁を自動で除去(整形マスクなし・発光はそのまま)
      .resize(320, 320, { fit: "inside", withoutEnlargement: false })
      .webp({ quality: 82, alphaQuality: 90, effort: 5 })
      .toBuffer();
    await sharp(buf).toFile(join(stageDir, `${slug}.webp`));  // src/assets/creatures/stage<N>/<slug>.webp
    nCre++;
  }
}

// クルー8体: art-raw/crew/<slug>.png  もしくは art-raw/crew-<1..8>.png
//   → src/assets/icons/<slug>.webp(既存のアイコン枠を上書き)
// 海域帯ごとの見た目(CREW-DESIGN.md): art-raw/crew/<slug>_<band>.png があれば
//   → src/assets/icons/<slug>_<band>.webp も併せて生成(無ければ職種共通アイコンにフォールバックするため任意)
const CREW_SLUGS = ["sweeper","harpoon","cabler","thermal","medic","scanner","diver","resonator"];
const CREW_BANDS = ["shallow", "mid", "deep"];
let nCrew = 0, nCrewBand = 0;
for (let i = 0; i < 8; i++) {
  const slug = CREW_SLUGS[i];
  const cand = [
    join(SRC, "crew", `${slug}.png`), join(SRC, "crew", `${i + 1}.png`),
    join(SRC, `crew-${i + 1}.png`), join(SRC, `crew_${slug}.png`),
  ].find(existsSync);
  if (cand) {
    const buf = await sharp(cand)
      .trim({ threshold: 12 })
      .resize(320, 320, { fit: "inside" })
      .webp({ quality: 84, alphaQuality: 92, effort: 5 })
      .toBuffer();
    await sharp(buf).toFile(join(here, "../src/assets/icons", `${slug}.webp`));
    nCrew++;
  }
  for (const band of CREW_BANDS) {
    const bandSrc = join(SRC, "crew", `${slug}_${band}.png`);
    if (!existsSync(bandSrc)) continue;
    const buf = await sharp(bandSrc)
      .trim({ threshold: 12 })
      .resize(320, 320, { fit: "inside" })
      .webp({ quality: 84, alphaQuality: 92, effort: 5 })
      .toBuffer();
    await sharp(buf).toFile(join(here, "../src/assets/icons", `${slug}_${band}.webp`));
    nCrewBand++;
  }
}
if (nCrew) console.log(`crew: ${nCrew}/8 (src/assets/icons へ上書き)`);
if (nCrewBand) console.log(`crew(海域帯): ${nCrewBand}/24`);

let nBg = 0, missBg = [];
for (let z = 1; z <= 10; z++) {
  const cand = backSrc(z);
  if (!cand) { missBg.push(z); continue; }
  const m = await sharp(cand).metadata();
  const cropTop = Math.round(m.height * 0.12);       // 上部の題字帯をトリム
  const buf = await sharp(cand)
    .extract({ left: 0, top: cropTop, width: m.width, height: m.height - cropTop })
    .resize({ width: 760 })
    .webp({ quality: 70, effort: 5 })
    .toBuffer();
  await sharp(buf).toFile(join(BG, `zone${z}.webp`));
  nBg++;
}

console.log(`creatures: ${nCre}/100  backgrounds: ${nBg}/10`);
if (missCre.length) console.log("missing creatures:", missCre.join(", "));
if (missBg.length) console.log("missing backgrounds:", missBg.join(", "));

/* ------------------------------------------------------------
   装備 / 消耗品 / 遺物 のコンタクトシートを切り出す。
   元画像はチェッカー模様(疑似透過)の JPEG なので、
   端から「チェッカー灰 or シアンの発光リング」をフラッドフィルで抜く。
------------------------------------------------------------ */
const ICONS = join(here, "../src/assets/icons");

async function chromaKey(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const N = W * H;
  const alpha = new Uint8Array(N).fill(255); // 255 = 被写体 / 0 = 背景
  const rgb = (p) => { const i = p * C; return [data[i], data[i + 1], data[i + 2]]; };

  // 1) チェッカー地(ほぼ無彩色 R≈G≈B、実測 104〜136)を除去。
  //    シアン被り(b>r)や暖色(r>b)は被写体側なので必ず残る。
  for (let p = 0; p < N; p++) {
    const [r, g, b] = rgb(p);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx - mn <= 15 && mn >= 90 && mx <= 146) alpha[p] = 0;
  }
  // チェッカー↔黒縁のアンチエイリアス(暗めの無彩色)は判定保留
  for (let p = 0; p < N; p++) {
    if (alpha[p] === 0) continue;
    const [r, g, b] = rgb(p);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx - mn <= 12 && mn >= 60 && mx <= 148) alpha[p] = 128;
  }

  // 2) 連結成分で「被写体本体」を選ぶ。中央寄り・大きい塊だけ残し、リングやチェッカーの残骸は捨てる。
  const label = new Int32Array(N).fill(-1);
  const comps = []; // {size, cx, cy, touchCenter}
  const cx0 = W * 0.3, cx1 = W * 0.7, cy0 = H * 0.3, cy1 = H * 0.7;
  for (let s = 0; s < N; s++) {
    if (alpha[s] < 200 || label[s] !== -1) continue;
    const id = comps.length;
    let size = 0; let touch = false;
    const stack = [s];
    label[s] = id;
    while (stack.length) {
      const p = stack.pop();
      size++;
      const x = p % W, y = (p / W) | 0;
      if (x >= cx0 && x <= cx1 && y >= cy0 && y <= cy1) touch = true;
      for (const q of [p + 1, p - 1, p + W, p - W]) {
        if (q < 0 || q >= N) continue;
        if (Math.abs((q % W) - x) > 1) continue;
        if (label[q] === -1 && alpha[q] >= 200) { label[q] = id; stack.push(q); }
      }
    }
    comps.push({ id, size, touch });
  }
  const maxSize = comps.reduce((m, c) => Math.max(m, c.size), 1);
  const keep = new Set(comps.filter((c) => c.touch || c.size >= maxSize * 0.10).map((c) => c.id));
  const bin = new Uint8Array(N);
  for (let p = 0; p < N; p++) if (label[p] !== -1 && keep.has(label[p])) bin[p] = 1;

  // 本体をほぼ拾えなかった(全部が薄いグレー等)場合は、端だけフェードする楕円ビネットで欠けさせず出す
  if (maxSize < N * 0.03) {
    const va = new Uint8Array(N);
    for (let p = 0; p < N; p++) {
      const x = p % W, y = (p / W) | 0;
      const nx = (x / (W - 1)) * 2 - 1, ny = (y / (H - 1)) * 2 - 1;
      const d = Math.hypot(nx / 0.99, ny / 0.99);
      va[p] = d < 0.82 ? 255 : d > 1.04 ? 0 : Math.round(255 * (1.04 - d) / 0.22);
    }
    const sb = await sharp(Buffer.from(va), { raw: { width: W, height: H, channels: 1 } }).blur(1).raw().toBuffer();
    const o2 = Buffer.alloc(N * 4);
    for (let p = 0; p < N; p++) {
      const a = sb[p];
      o2[p * 4] = a < 12 ? 0 : data[p * C];
      o2[p * 4 + 1] = a < 12 ? 0 : data[p * C + 1];
      o2[p * 4 + 2] = a < 12 ? 0 : data[p * C + 2];
      o2[p * 4 + 3] = a;
    }
    return sharp(o2, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  }

  // 3) 保留(128)ピクセルは、確定本体に隣接していれば本体に含める(縁を1〜2px戻す)
  for (let pass = 0; pass < 2; pass++) {
    const prev = bin.slice();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = y * W + x;
      if (bin[p] || alpha[p] !== 128) continue;
      if ((x + 1 < W && prev[p + 1]) || (x > 0 && prev[p - 1]) ||
          (y + 1 < H && prev[p + W]) || (y > 0 && prev[p - W])) bin[p] = 1;
    }
  }

  // 4) 本体内部の穴(端から到達できない背景)を埋める
  const bg = new Uint8Array(N);
  const q = [];
  for (let x = 0; x < W; x++) { if (!bin[x]) { bg[x] = 1; q.push(x); } const b = (H - 1) * W + x; if (!bin[b]) { bg[b] = 1; q.push(b); } }
  for (let y = 0; y < H; y++) { const l = y * W; if (!bin[l]) { bg[l] = 1; q.push(l); } const r = y * W + W - 1; if (!bin[r]) { bg[r] = 1; q.push(r); } }
  while (q.length) {
    const p = q.pop(); const x = p % W, y = (p / W) | 0;
    for (const nb of [p + 1, p - 1, p + W, p - W]) {
      if (nb < 0 || nb >= N || Math.abs((nb % W) - x) > 1) continue;
      if (!bg[nb] && !bin[nb]) { bg[nb] = 1; q.push(nb); }
    }
  }
  const finalA = new Uint8Array(N);
  for (let p = 0; p < N; p++) finalA[p] = (bin[p] || !bg[p]) ? 255 : 0;

  // 5) アルファのみ 0.8px ぼかして縁のジャギだけ取る(モヤは戻さない)
  const soft = await sharp(Buffer.from(finalA), { raw: { width: W, height: H, channels: 1 } }).blur(0.8).raw().toBuffer();
  const out = Buffer.alloc(N * 4);
  for (let p = 0; p < N; p++) {
    const a = soft[p];
    out[p * 4] = a < 12 ? 0 : data[p * C];
    out[p * 4 + 1] = a < 12 ? 0 : data[p * C + 1];
    out[p * 4 + 2] = a < 12 ? 0 : data[p * C + 2];
    out[p * 4 + 3] = a;
  }
  return sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
}

async function sliceSheet(srcFile, cells, { cols, rows, out, size = 320, quality = 82 }) {
  const src = [join(SRC, srcFile), join(SRC, "gear", srcFile)].find(existsSync);
  if (!src) { console.log(`  skip (no file): ${srcFile}`); return 0; }
  const m = await sharp(src).metadata();
  const cw = Math.floor(m.width / cols), ch = Math.floor(m.height / rows);
  let n = 0;
  for (let idx = 0; idx < cells.length; idx++) {
    const key = cells[idx];
    if (!key) continue;
    const col = idx % cols, row = (idx / cols) | 0;
    const cell = await sharp(src)
      .extract({ left: col * cw, top: row * ch, width: cw, height: ch })
      .toBuffer();
    const keyed = await chromaKey(cell);
    // sharp: trim → resize を1パイプで繋ぐとアルファが壊れるのでバッファで分割
    const trimmed = await sharp(keyed).trim({ threshold: 12 }).toBuffer();
    const buf = await sharp(trimmed)
      .resize(size, size, { fit: "inside" })
      .webp({ quality, alphaQuality: 92, effort: 5 })
      .toBuffer();
    await sharp(buf).toFile(join(ICONS, `${key}.webp`));
    n++;
  }
  console.log(`  ${srcFile}: ${n}`);
  return n;
}

/*
 * 装備(suit/module × 帯 × ☆5)と消耗品シートは、元画像がチェッカー模様を焼き込んだ
 * 不透明 JPEG。被写体自体が灰色を含み発光リングも重なるため、透過の切り出しが安定しない
 * (medkit が歪む等)。透過 PNG で書き出し直したシートを art-raw/ に置いてから、
 * 下の SLICE_SHEETS を true にして再実行すること。それまでは lucide アイコンにフォールバック。
 */
const SLICE_SHEETS = false;
if (SLICE_SHEETS) {
  console.log("装備・消耗品シート:");
  let nGear = 0;
  nGear += await sliceSheet("suit_shallow.jpeg", ["suit_shallow_1", "suit_shallow_2", "suit_shallow_3", "suit_shallow_4", "suit_shallow_5"], { cols: 5, rows: 1, out: ICONS });
  nGear += await sliceSheet("suit_mid.jpeg", ["suit_mid_1", "suit_mid_2", "suit_mid_3", "suit_mid_4", "suit_mid_5"], { cols: 5, rows: 1, out: ICONS });
  nGear += await sliceSheet("suit_deep.jpeg", ["suit_deep_1", "suit_deep_2", "suit_deep_3", "suit_deep_4", "suit_deep_5"], { cols: 1, rows: 5, out: ICONS });
  nGear += await sliceSheet("module_shallow.jpeg", ["module_shallow_1", "module_shallow_2", "module_shallow_3", "module_shallow_4", "module_shallow_5"], { cols: 1, rows: 5, out: ICONS });
  nGear += await sliceSheet("module_mid.jpeg", ["module_mid_1", "module_mid_2", "module_mid_3", "module_mid_4", "module_mid_5"], { cols: 5, rows: 1, out: ICONS });
  nGear += await sliceSheet("module_deep.jpeg", ["module_deep_1", "module_deep_2", "module_deep_3", "module_deep_4", "module_deep_5"], { cols: 5, rows: 1, out: ICONS });
  console.log(`装備: ${nGear}/30`);
  await sliceSheet("consumables.jpeg",
    ["medkit", "serum", "charge", "torpedo", "coolant", "core", "shard", "specimen", "echo", "sedative"],
    { cols: 5, rows: 2, out: ICONS });
}

// icons/index.js を再生成(フォルダ内の webp を全部 export)
{
  const { readdirSync, writeFileSync } = await import("node:fs");
  const files = readdirSync(ICONS).filter((f) => f.endsWith(".webp")).sort();
  const imp = files.map((f, i) => `import i${i} from './${f}';`).join("\n");
  const map = files.map((f, i) => `  '${f.replace(".webp", "")}': i${i},`).join("\n");
  writeFileSync(join(ICONS, "index.js"), `${imp}\n\nexport default {\n${map}\n};\n`);
  console.log(`icons/index.js: ${files.length} entries`);
}
