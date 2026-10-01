// ~/Downloads/深海遺物コレクション・全15種.png(5列×3行のグリッド1枚)を
// src/assets/relics/<relicId>.webp へ1個ずつ切り出す。
//   node scripts/import-relic-sheet.mjs
//
// セルごとに切り出した後、アルファチャンネルにメディアンフィルタ(ノイズ除去)→
// 完全透過の余白をトリム→長辺を縮小してwebp化。背景がクロマキー等ではなく
// 既に透過済み(部分的にでも)という前提で、despeckle+trim だけで仕上げる。
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DL = join(homedir(), "Downloads");
const SRC = join(DL, "深海遺物コレクション・全15種.png");
const OUT = new URL("../src/assets/relics/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const LONG_SIDE = 320;
const COLS = 5, ROWS = 3, INSET_X = 30, INSET_Y = 20;

// Grid contents, left-to-right then top-to-bottom(ICON-PROMPTS.md 準拠)
const ORDER = [
  "sonarLens", "ballast", "coilHeart", "tideGlass", "blackBox",
  "pressureFin", "echoDrive", "starCore", "gillFilter", "driftAnchor",
  "pressureCell", "deepMemory", "toxinFin", "crewNet", "temperedHull",
];

async function despeckleAlpha(input) {
  const img = sharp(input).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const alpha = Buffer.alloc(width * height);
  for (let i = 0; i < width * height; i++) alpha[i] = data[i * channels + 3];
  const filtered = Buffer.from(alpha);
  const win = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      win.length = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const yy = y + dy, xx = x + dx;
        if (yy >= 0 && yy < height && xx >= 0 && xx < width) win.push(alpha[yy * width + xx]);
      }
      win.sort((a, b) => a - b);
      filtered[y * width + x] = win[Math.floor(win.length / 2)];
    }
  }
  for (let i = 0; i < width * height; i++) data[i * channels + 3] = filtered[i];
  return sharp(data, { raw: { width, height, channels } });
}

const { width: W, height: H } = await sharp(SRC).metadata();
const cw = W / COLS, ch = H / ROWS;

let report = [];
for (let i = 0; i < ORDER.length; i++) {
  const col = i % COLS, row = Math.floor(i / COLS);
  const id = ORDER[i];
  let left = Math.round(col * cw + INSET_X);
  let top = Math.round(row * ch + INSET_Y);
  let w = Math.round(cw - INSET_X * 2);
  let h = Math.round(ch - INSET_Y * 2);
  left = Math.max(0, left); top = Math.max(0, top);
  w = Math.min(w, W - left); h = Math.min(h, H - top);

  const cropped = await sharp(SRC).extract({ left, top, width: w, height: h }).png().toBuffer();
  const cleaned = await despeckleAlpha(cropped);
  const buf = await cleaned.trim({ threshold: 10 })
    .resize(LONG_SIDE, LONG_SIDE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 95, effort: 6 }).toBuffer();
  await sharp(buf).toFile(join(OUT, `${id}.webp`));
  const stats = await sharp(buf).stats();
  const alphaMean = Math.round(stats.channels[3]?.mean ?? 255);
  report.push(`${id} (col${col},row${row}) alphaMean=${alphaMean}`);
}
console.log("wrote 15 relics:\n" + report.join("\n"));
