// src/assets/creatures/**/*.webp(通常敵・変異個体アイコン)を全て正方形キャンバスへ
// 透過パディングし直す。Icon コンポーネントは正方形の size に収める作りなので、
// 被写体の自然な縦横比のまま切り出すと、細身/横長の個体だけ他より小さく/位置がズレて
// 見える(剛毛口で顕在化した問題)。全個体を同じ「枠」に統一する。
//   node scripts/square-pad-creatures.mjs
import sharp from "sharp";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../src/assets/creatures/", import.meta.url).pathname;
const LONG_SIDE = 320;

let count = 0;
for (const stage of readdirSync(ROOT)) {
  const dir = join(ROOT, stage);
  if (!statSync(dir).isDirectory()) continue;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".webp")) continue;
    const p = join(dir, file);
    const meta = await sharp(p).metadata();
    if (meta.width === LONG_SIDE && meta.height === LONG_SIDE) continue; // 既に正方形
    const buf = await sharp(p)
      .resize(LONG_SIDE, LONG_SIDE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 88, alphaQuality: 95, effort: 6 })
      .toBuffer();
    await sharp(buf).toFile(p);
    count++;
  }
}
console.log(`squared ${count} creature icons`);
