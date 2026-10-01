// ~/Downloads の "1-1.png" 〜 "1-10.png"(1体ずつ個別に生成・書き出し済みのもの)を
// src/assets/creatures/stage1/<id>.webp へ取り込む。
//   node scripts/import-numbered-icons.mjs
//
// 各ファイルは既にアルファチャンネル(透過)付きだが、背景除去の精度がまちまちで
// 縁にノイズ(塩胡椒状の孔)が残っていることがあるため、
//   1) アルファチャンネルにメディアンフィルタをかけてノイズを均す
//   2) 完全透過の余白をトリムする
//   3) 長辺を LONG_SIDE に縮小して webp 化
// という軽い後処理を行う。背景そのものが不透明のまま残っている(=まだ塗り残しがある)
// 場合はこの処理では直らない点に注意(その旨は実行結果に出す)。
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DL = join(homedir(), "Downloads");
const OUT = new URL("../src/assets/creatures/stage1/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const LONG_SIDE = 320;

// 1-1 〜 1-10 は ICON-PROMPTS.md の「Grid contents, left-to-right then top-to-bottom」の並びに対応
const ORDER = [
  "lanternfish", "hatchetfish", "viperfish", "driftjelly", "glassSquid",
  "combJelly", "krillSwarm", "bristlemouth", "paleShrimp", "siphonChain",
];

async function despeckleAlpha(input) {
  const img = sharp(input).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  // アルファチャンネルだけを抜き出してメディアンフィルタ(3x3)
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

let report = [];
for (let i = 0; i < ORDER.length; i++) {
  const n = i + 1;
  const id = ORDER[i];
  const src = join(DL, `1-${n}.png`);
  const cleaned = await despeckleAlpha(src);
  // 被写体の自然な縦横比のままだと、剛毛口のような横長の1体だけが極端に小さく/縦位置が
  // ズレて表示される(Icon は正方形の size に収める作りなので、横長画像は高さが潰れる)。
  // 先に正方形キャンバスへ透過パディングしてから縮小することで、どの個体も同じ「枠」を
  // 占有するようにし、一覧表示での大きさ・位置を他のアイコンと揃える。
  const trimmed = await cleaned.trim({ threshold: 10 }).png().toBuffer();
  const buf = await sharp(trimmed)
    .resize(LONG_SIDE, LONG_SIDE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 88, alphaQuality: 95, effort: 6 }).toBuffer();
  await sharp(buf).toFile(join(OUT, `${id}.webp`));
  const stats = await sharp(buf).stats();
  const alphaMean = Math.round(stats.channels[3]?.mean ?? 255);
  report.push({ n, id, alphaMean, note: alphaMean > 120 ? "背景の塗り残しが多い可能性(要目視確認)" : "OK" });
}
console.log("wrote:", report.map((r) => `1-${r.n}(${r.id}) alphaMean=${r.alphaMean} ${r.note}`).join("\n"));
