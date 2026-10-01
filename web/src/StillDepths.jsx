// ============================================================
//  STILL DEPTHS — 深海探査ローグライク
//
//  ◆ 画像差し替えガイド
//  絵素材は ASSETS レジストリで一元管理しています。
//  各エントリの img にURLを入れるとアイコンの代わりに画像が出ます。
//    例: sweeper: { icon: Waves, img: "https://.../sweeper.png" }
// ============================================================

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Waves, Crosshair, Zap, Flame, HeartPulse, Radar, Shield, AudioLines,
  Anchor, Gem, Cpu, Battery, Pill, Syringe, Bomb, Snowflake, Orbit,
  Fish, Shell, Bone, Rss,
  Sparkles, X, Package, Compass, Activity,
  Droplet, Moon, Aperture,
  Lock, Unlock, BookOpen, FlaskConical, Settings, Waypoints, PlayCircle,
  Repeat, ArrowLeftRight,
} from "lucide-react";
import ICON_IMG from "./assets/icons/index.js";
import MESSAGES from "./messages.json";

/* ------------------------------------------------------------
   素材レジストリ
   icon = lucide フォールバック / img = 差し替え画像(assets/icons/)
------------------------------------------------------------ */
const ASSETS = {
  // クルー職種 8種
  sweeper:   { icon: Waves,      img: null },
  harpoon:   { icon: Crosshair,  img: null },
  cabler:    { icon: Zap,        img: null },
  thermal:   { icon: Flame,      img: null },
  medic:     { icon: HeartPulse, img: null },
  scanner:   { icon: Radar,      img: null },
  diver:     { icon: Shield,     img: null },
  resonator: { icon: AudioLines, img: null },
  // 装備・遺物
  suit:      { icon: Shield,     img: null },
  module:    { icon: Cpu,        img: null },
  weapon:    { icon: Crosshair,  img: null },
  relic:     { icon: Gem,        img: null },
  // 消耗品
  medkit:    { icon: Pill,       img: null },
  serum:     { icon: Syringe,    img: null },
  charge:    { icon: Battery,    img: null },
  torpedo:   { icon: Bomb,       img: null },
  coolant:   { icon: Snowflake,  img: null },
  core:      { icon: Orbit,      img: null },
  shard:     { icon: Sparkles,   img: null },
  specimen:  { icon: FlaskConical, img: null },
  echo:      { icon: Waypoints,  img: null },
  // 敵(通常敵は creatures/*.webp を import.meta.glob で動的登録。ここは異常個体のみ)
  anomaly:   { icon: Sparkles,   img: null },
  // 道中イベント(廃品回収/行商/関所/人魚)。画像未生成の間は lucide アイコンで代用。
  nodeScrap:   { icon: Package,  img: null },
  nodeShop:    { icon: Compass,  img: null },
  nodeGate:    { icon: Shield,   img: null },
  nodeMermaid: { icon: Sparkles, img: null },
  // 主(ボス)
  bossKraken:{ icon: Waves,      img: null },
  bossHulk:  { icon: Anchor,     img: null },
  bossVent:  { icon: Flame,      img: null },
  bossBloom: { icon: Droplet,    img: null },
  bossGlacier:{ icon: Snowflake, img: null },
  bossMagnet:{ icon: Zap,        img: null },
  bossLeviathan:{ icon: Bone,    img: null },
  bossSilence:{ icon: Moon,      img: null },
  bossStar:  { icon: Aperture,   img: null },
  bossReef:  { icon: Shell,      img: null },
};
// 生成済みアイコン画像を割り当てる(未生成のキーは lucide アイコンのまま)
for (const k of Object.keys(ASSETS)) if (ICON_IMG[k]) ASSETS[k].img = ICON_IMG[k];

// 装備の 海域帯 × レアリティ = 3×3×5 種のアイコン枠(suit/module/weapon)。
// 専用画像 icons/<slot>_<band>_<n>.webp があればそれを、無ければ slot 共通アイコンにフォールバック。
const GEAR_SLOT_ICON = { suit: Shield, module: Cpu, weapon: Crosshair };
for (const slot of ["suit", "module", "weapon"]) {
  for (const band of ["shallow", "mid", "deep"]) {
    for (let n = 1; n <= 5; n++) {
      const key = `${slot}_${band}_${n}`;
      ASSETS[key] = { icon: GEAR_SLOT_ICON[slot], img: ICON_IMG[key] || ASSETS[slot]?.img || null };
    }
  }
}

// クルー8職 × 海域帯(浅/中/深)= 24 種のアイコン枠。
// 専用画像 icons/<type>_<band>.webp があればそれを、無ければ職種の基本アイコンにフォールバック。
for (const type of ["sweeper", "harpoon", "cabler", "thermal", "medic", "scanner", "diver", "resonator"]) {
  for (const band of ["shallow", "mid", "deep"]) {
    const key = `${type}_${band}`;
    ASSETS[key] = { icon: ASSETS[type].icon, img: ICON_IMG[key] || ASSETS[type].img || null };
  }
}

// クリーチャー100体+レアモンスター10体の画像を ASSETS に登録。
// ステージ(海域)ごとにフォルダ分け(./assets/creatures/stage<N>/<slug>.webp)
const CREATURE_IMG = import.meta.glob("./assets/creatures/*/*.webp", { eager: true, import: "default" });
for (const [path, url] of Object.entries(CREATURE_IMG)) {
  const slug = path.split("/").pop().replace(".webp", "");
  ASSETS[slug] = { icon: Fish, img: url };
}
// 海域背景(src/assets/bg/zoneN.webp)
const ZONE_BG = import.meta.glob("./assets/bg/*.webp", { eager: true, import: "default" });
const zoneBgUrl = (zi) => ZONE_BG[`./assets/bg/zone${zi + 1}.webp`] || null;
// 海域以外の画面(装備・スキルツリー等)用の固定背景。src/assets/bg/<name>.webp を
// 置くだけで自動的に反映される(無ければ何も表示せず、紺色の地色のまま)。
const staticBgUrl = (name) => ZONE_BG[`./assets/bg/${name}.webp`] || null;
// 気泡演出(src/assets/bg/bubbleWhite/bubbleCyan/bubbleRose.webp があれば使う。無ければCSSだけの丸で代用)
// 白を出やすくして、シアン/ローズを差し色程度に散らす。大玉は白のみ(色付きは小粒だけ)。
const BUBBLE_WHITE = ZONE_BG["./assets/bg/bubbleWhite.webp"] || null;
const BUBBLE_IMGS = [
  { img: BUBBLE_WHITE, weight: 3 },
  { img: ZONE_BG["./assets/bg/bubbleCyan.webp"], weight: 1 },
  { img: ZONE_BG["./assets/bg/bubbleRose.webp"], weight: 1 },
].filter((b) => b.img);
function pickBubbleImg() {
  if (!BUBBLE_IMGS.length) return null;
  const total = BUBBLE_IMGS.reduce((a, b) => a + b.weight, 0);
  let r = Math.random() * total;
  for (const b of BUBBLE_IMGS) { if ((r -= b.weight) <= 0) return b.img; }
  return BUBBLE_IMGS[BUBBLE_IMGS.length - 1].img;
}

/* ------------------------------------------------------------
   レアリティ — 上位ほど厳しく絞る
   crewWeight: クルー勧誘時の重み(高レアほど極端に低い)
------------------------------------------------------------ */
const RARITIES = [
  { id: "std",   label: "☆",         short: "☆",         color: "#7f96a8", glow: "none",                          weight: 58,  crewWeight: 62,  mult: 1.00 },
  { id: "elite", label: "☆☆",       short: "☆☆",       color: "#4fd6e8", glow: "0 0 10px rgba(79,214,232,.30)",  weight: 26,  crewWeight: 25,  mult: 1.28 },
  { id: "rare",  label: "☆☆☆",     short: "☆☆☆",     color: "#7fa7ff", glow: "0 0 12px rgba(127,167,255,.42)", weight: 11,  crewWeight: 9.4, mult: 1.62 },
  { id: "deep",  label: "☆☆☆☆",   short: "☆☆☆☆",   color: "#c58cff", glow: "0 0 15px rgba(197,140,255,.52)", weight: 4.2, crewWeight: 3.0, mult: 2.10 },
  { id: "abyss", label: "☆☆☆☆☆", short: "☆☆☆☆☆", color: "#ffd27f", glow: "0 0 20px rgba(255,210,127,.62)", weight: 0.8, crewWeight: 0.6, mult: 2.85 },
];
const rarityOf = (id) => RARITIES.find((r) => r.id === id) || RARITIES[0];
const rarityIdx = (id) => RARITIES.findIndex((r) => r.id === id);

/* ------------------------------------------------------------
   ダメージ属性: 徹甲 / 熱量 / 電磁 / 音響 / 生体
------------------------------------------------------------ */
const DMG = { KIN: "徹甲", THR: "熱量", EM: "電磁", SON: "音響", BIO: "生体" };

/* ------------------------------------------------------------
   クルー職種 8種 — それぞれ通常攻撃と固有スキル
------------------------------------------------------------ */
// クルー職種のゲームバランス値(hp/atk/cd等)。表示名・紹介文・スキル名は src/messages.json で管理。
const CREW_TYPES_DATA = {
  harpoon:   { asset: "harpoon",   dmg: DMG.KIN, role: "単体火力", hp: 34, atk: 11, skill: { cd: 2 } },
  sweeper:   { asset: "sweeper",   dmg: DMG.SON, role: "全体攻撃", hp: 32, atk: 7,  skill: { cd: 2 } },
  cabler:    { asset: "cabler",    dmg: DMG.EM,  role: "連鎖",     hp: 30, atk: 9,  skill: { cd: 2 } },
  thermal:   { asset: "thermal",   dmg: DMG.THR, role: "継続",     hp: 31, atk: 10, skill: { cd: 3 } },
  medic:     { asset: "medic",     dmg: DMG.BIO, role: "回復",     hp: 29, atk: 6,  skill: { cd: 2 } },
  scanner:   { asset: "scanner",   dmg: DMG.EM,  role: "看破",     hp: 30, atk: 7,  skill: { cd: 2 } },
  diver:     { asset: "diver",     dmg: DMG.KIN, role: "防御",     hp: 44, atk: 8,  skill: { cd: 2 } },
  resonator: { asset: "resonator", dmg: DMG.BIO, role: "支援",     hp: 28, atk: 8,  skill: { cd: 3 } },
};
const CREW_TYPES = Object.fromEntries(Object.entries(CREW_TYPES_DATA).map(([id, t]) => {
  const m = MESSAGES.crewTypes[id];
  return [id, { ...t, label: m.label, desc: m.desc, skill: { ...t.skill, name: m.skillName, desc: m.skillDesc, tag: m.skillTag } }];
}));

// クルー名(レアリティ順に印象を変える)。文言は src/messages.json で管理。
const CREW_NAMES = MESSAGES.crewNames;

/* ------------------------------------------------------------
   装備(クルー1人に1つ) / 遺物(隊全体のパッシブ) / 消耗品
------------------------------------------------------------ */
// 装備部位のゲームバランス値(hp/atk/def)。表示名は src/messages.json で管理。
const GEAR_TYPES_DATA = {
  suit:   { hp: 9, atk: 0, def: 2 },
  module: { hp: 3, atk: 4, def: 0 },
  // 攻撃力特化の専用枠。suit/module とは別枠(c.weapon)で、両方同時に装備できる。
  weapon: { hp: 0, atk: 6, def: 0 },
};
// suit/module は同じ1枠(c.gear)を取り合うが、weapon は独立した2つめの枠(c.weapon)。
const GEAR_SLOT_FIELD = { suit: "gear", module: "gear", weapon: "weapon" };
const GEAR_TYPES = Object.fromEntries(Object.entries(GEAR_TYPES_DATA).map(([id, t]) =>
  [id, { ...t, label: MESSAGES.gear.types[id].label, asset: id }]));
// 海域帯(浅層 Z1-3 / 中層 Z4-7 / 深層 Z8-10)× レアリティ5段 で見た目と名前が変わる
const GEAR_BANDS = ["shallow", "mid", "deep"];
const gearBandOf = (depth) => (depth <= 30 ? "shallow" : depth <= 70 ? "mid" : "deep");
const GEAR_BAND_MUL = { shallow: 1.0, mid: 1.55, deep: 2.25 };
const GEAR_NAMES = MESSAGES.gear.names;

// 遺物: 隊全体に効くパッシブ。持てる数は限られる
// 遺物のゲームバランス値(rarity)。名前・説明は src/messages.json で管理。
const RELICS_DATA = [
  { id: "sonarLens",  rarity: "rare" },
  { id: "ballast",    rarity: "elite" },
  { id: "coilHeart",  rarity: "deep" },
  { id: "tideGlass",  rarity: "elite" },
  { id: "blackBox",   rarity: "rare" },
  { id: "pressureFin",rarity: "std" },
  { id: "echoDrive",  rarity: "deep" },
  { id: "starCore",   rarity: "abyss" },
  { id: "gillFilter", rarity: "std" },
  { id: "driftAnchor",  rarity: "elite" },
  { id: "pressureCell", rarity: "rare"  },
  { id: "deepMemory",   rarity: "std"   },
  { id: "toxinFin",     rarity: "rare"  },
  { id: "crewNet",      rarity: "rare"  },
  { id: "temperedHull", rarity: "deep"  },
];
// 遺物の解禁海域(0-indexed。0=海域1)。ゲームバランスを大きく揺らす遺物ほど深い海域
// でしか出ないようにし、浅い海域の難易度が「遺物ガチャ」次第で乱高下しないようにする。
// 例: echoDrive(スキル再使用待ち-1)は連発できる技と組み合わさるだけで難易度が大きく
// 変わるため、終盤の海域7以降まで出現しない。未指定(0)は海域1から通常通り出現する。
const RELIC_MIN_ZONE = {
  // 強力(終盤・海域7以降): スキル連発・被弾上限・戦闘不能からの復帰・毎戦スキル即応 —
  // 単体で戦い方そのものを変えてしまう遺物
  echoDrive: 6, pressureCell: 6, blackBox: 6, temperedHull: 6,
  // 中程度(中盤・海域4以降): 恒常的な火力/生存の底上げ
  coilHeart: 3, starCore: 3, crewNet: 3,
};
const RELICS = RELICS_DATA.map((r) => ({ ...r, ...MESSAGES.relics[r.id] }));
// 遺物: id ごとの個別画像(./assets/relics/<relicId>.webp)があればそれを、
// 無ければ共通の Gem アイコン/画像にフォールバックする(creatures と同じ考え方)。
// 先に全 id を共通アイコンで登録しておくことで、専用画像が無い間も Icon が
// Package(汎用箱アイコン)へ落ちずに済む。
for (const r of RELICS_DATA) ASSETS[r.id] = { icon: Gem, img: ASSETS.relic.img };
const RELIC_IMG = import.meta.glob("./assets/relics/*.webp", { eager: true, import: "default" });
for (const [path, url] of Object.entries(RELIC_IMG)) {
  const slug = path.split("/").pop().replace(".webp", "");
  if (ASSETS[slug]) ASSETS[slug].img = url;
}

// 消耗品のゲームバランス値(kind/power等)。表示名・説明は src/messages.json で管理。
const CONSUMABLES_DATA = {
  medkit:   { asset: "medkit",  kind: "heal",   power: 0.45 },
  serum:    { asset: "serum",   kind: "healAll", power: 0.30 },
  charge:   { asset: "charge",  kind: "cd" },
  torpedo:  { asset: "torpedo", kind: "bomb" },
  coolant:  { asset: "coolant", kind: "guard" },
  // 異常個体からのみ落ちるレアアイテム。継承枠(全滅時に持ち帰れる装備・消耗品の数)を
  // 永続的に+1する唯一の手段(ボス撃破では増やさない方針にしたため、この枠の伸びは
  // 完全にこのアイテムの入手数に委ねる)。
  core:     { asset: "core",    kind: "carrySlot" },
  shard:    { asset: "shard",   kind: "shards", shardValue: 1 },
  echo:     { asset: "echo",    kind: "shards", shardValue: 1 },
  specimen: { asset: "specimen", kind: "specimen" },
};
const CONSUMABLES = Object.fromEntries(Object.entries(CONSUMABLES_DATA).map(([id, c]) =>
  [id, { ...c, ...MESSAGES.consumables[id] }]));
// 固定ダメージの全体攻撃(小型魚雷等、kind:"bomb")の威力。敵全体に一律・確定でこの数値を
// 与える(命中判定・弱点補正なし)。以前は 22+depth*2 と控えめで、ターン+アイテムを
// 消費する割に見劣りし使い所が少なかったため、底上げした。深度による伸びも大きくして
// 深い海域でも選択肢になるようにしてある。
const bombPower = (depth) => 40 + depth * 4;
// 行商(ショップ)の品揃え。鉄屑(この潜航限定の資源)で交換する。
const SHOP_STOCK = [
  { id: "medkit", price: 3 }, { id: "serum", price: 5 }, { id: "charge", price: 4 },
  { id: "coolant", price: 4 }, { id: "torpedo", price: 4 },
];

/* ------------------------------------------------------------
   敵図鑑 — 海域ごとに傾向が変わる
   weak(1.6倍) / resist(0.5倍)
------------------------------------------------------------ */
const _K = DMG.KIN, _T = DMG.THR, _E = DMG.EM, _S = DMG.SON, _B = DMG.BIO;
// 海域ごと10体。位置(n=0..9)で強さのティアが決まる。上位ほど禍々しく狂気度も上がる。
// [slug, 和名, 弱[], 耐[], メモ, opts?{p,b,dr,st,def,hp,atk,mad}]
const ZONE_CREATURES = [
  [ // Z1 薄明層 — まだ普通の深海魚
    ["lanternfish","提灯魚",[_K],[_B],"額の擬似餌で小魚を釣る、ごく普通の待ち伏せ型。"],
    ["hatchetfish","斧頭魚",[_T],[],"銀の薄い体、真上を向いた望遠鏡の目。"],
    ["viperfish","毒牙魚",[_K,_E],[],"閉じない牙で獲物を口の外から貫く。"],
    ["driftjelly","浮遊クラゲ",[_T,_E],[_K],"発光細胞を並べ水流に漂う。触れると刺胞が弾ける。"],
    ["glassSquid","硝子烏賊",[_S],[_K],"透明な体、内臓だけが宙に浮いて見える。"],
    ["combJelly","櫛水母",[_T],[_S],"8列の繊毛が虹色に走る。"],
    ["krillSwarm","微生物群",[_S,_T],[_K],"単体は無害。危機に一つの塊として振る舞う。"],
    ["bristlemouth","剛毛口",[_K],[],"海で最も数の多い脊椎動物。口に発光点の列。"],
    ["paleShrimp","白皙エビ",[_T],[_B],"色素を失った甲殻。光を嫌う。"],
    ["siphonChain","管水母鎖",[_E],[_K],"数百個体が一本の鎖を成す群体。端が見えない。",{mad:1}],
  ],
  [ // Z2 珊瑚礁址 — 数体は「様子がおかしい」
    ["armoredCrab","装甲甲殻",[_K],[_S,_B],"岩と見分けがつかない。鋏が耐圧殻をへこます。",{def:6}],
    ["stonePolyp","石化ポリプ",[_S],[_B],"固着し石灰の棘で守る。倒すと毒胞子を撒く。",{p:1}],
    ["coralWraith","珊瑚の亡霊",[_K,_T],[],"死んだ珊瑚の骨格が人型に伸び上がる。",{mad:1}],
    ["urchinCrown","棘冠",[_T],[_K],"直径2mの棘の王冠。中心に一つの目。",{mad:1}],
    ["moray","縄うつぼ",[_E],[],"岩穴から二重顎を伸ばす。"],
    ["clamMaw","貝口",[_K],[_S],"人を丸呑みできる二枚貝。真珠層が眼球のよう。",{mad:1}],
    ["reefLantern","礁の提灯",[_T],[_E],"提灯魚に似るが擬似餌が小さな手の形。",{mad:1}],
    ["brittleNest","蛇尾の巣",[_S],[_K],"無数のクモヒトデが絡み合い一体で這う。",{mad:1}],
    ["spongeChoir","海綿の合唱",[_E],[_B],"濾過口から低い和音を発し、獲物を眠らせる。",{st:1,mad:2}],
    ["anemoneVeil","磯巾着の帳",[_T],[_S],"触手のカーテンの奥に溶けかけた人影。",{p:1,mad:2}],
  ],
  [ // Z3 沈船墓場 — 腐敗・機械・死者
    ["hollowSuit","漂流者",[_S,_B],[_K,_T],"空の与圧服。顔のあった所に静電の靄。",{mad:1}],
    ["hulkCore","船骸の核",[_E],[_B],"腐食した機関に何かが宿り、関節から放電する。",{st:1,mad:1}],
    ["rustChoir","錆の合唱団",[_S],[_E],"沈んだ乗員の声が金属を軋ませて鳴る。",{mad:2}],
    ["barnacleHost","藤壺の宿主",[_K],[_S],"一人分の骨格に藤壺と管虫が密生。まだ歩く。",{mad:2}],
    ["drownLantern","溺者の灯",[_T],[_K],"錆びたランタンを掲げて泳ぐ。炎は水中で燃える。",{b:1,mad:1}],
    ["cargoSwarm","船倉の群れ",[_E,_T],[],"積荷に湧いた等脚類の大群。金属を食う。",{mad:1}],
    ["anchorWraith","錨の亡霊",[_B],[_K],"巨大な錨を引きずる影。鎖は海底まで続く。",{mad:2}],
    ["propGhast","螺旋の亡者",[_S],[_T],"スクリューが逆回転しながら近づいてくる。",{mad:2}],
    ["logbookThing","航海日誌の主",[_E],[_B],"濡れた紙束が魚の形をとる。読むと正気を失う。",{mad:3}],
    ["brineDoll","塩の人形",[_K],[_S],"溺死体が塩の結晶に覆われ、人形のように動く。",{mad:2}],
  ],
  [ // Z4 熱水噴出帯 — 化学合成の異形
    ["ventHeart","噴出孔生物",[_K],[_T],"硫化物を漉し取る。体表は常に高温。",{mad:1}],
    ["scorchMoth","焼灼虫",[_E],[_T],"熱泥で羽化。翅の粉が触れたものを発火させる。",{b:1,mad:1}],
    ["sulfurGrazer","硫黄の食み手",[_E],[_T],"白い菌糸を刈る芋虫。血が黄色い。",{p:1,mad:1}],
    ["blackSmoker","黒煙柱の子",[_K],[_T],"煙突そのものが立ち上がり歩き出す。",{mad:2}],
    ["tubewormKing","管虫の王",[_K,_S],[_T],"2mの管から真紅の羽冠。心臓が体外にある。",{mad:2}],
    ["magmaJelly","熔岩水母",[_K],[_T,_E],"傘の中で液状の岩が脈打つ。",{b:1,mad:2}],
    ["thermophage","熱喰らい",[_E],[_T],"熱を吸って冷たくなる。触れた水が凍る。",{mad:2}],
    ["brimstoneCrab","硫火蟹",[_S],[_T],"甲羅の割れ目から炎。挟むと相手が燃える。",{b:1,mad:2}],
    ["ashChoir","灰の合唱",[_E],[_T],"舞い上がる火山灰が人の顔を次々に形作る。",{mad:3}],
    ["ventLarva","孔の幼体",[_K],[_T],"まだ小さい噴出孔の心臓。成長場所を探して這う。",{mad:1}],
  ],
  [ // Z5 発光生物圏 — 光による狂気
    ["luminMatrix","発光母体",[_T],[_E,_B],"光で獲物を惑わせ体液を吸う。倒すと分裂を試みる。",{dr:1,mad:2}],
    ["sirenLure","誘引体",[_S],[_B],"音のパターンで他個体を操る。単体では脆い。",{mad:2}],
    ["eyeBloom","眼の花畑",[_T],[_E],"光る花の一つ一つが瞬きする眼。",{mad:3}],
    ["phosphorSaint","燐光の聖者",[_S],[_B],"光輪を持つ人型。近づくと自分の名前で呼ばれる。",{mad:3}],
    ["glowGospel","光の福音",[_T],[_E],"明滅が言葉で、読むと従いたくなる。",{mad:3}],
    ["jellyChandelier","水母の枝燭",[_K],[_E],"天井から吊り下がる巨大な群体。無数の光の粒。",{mad:2}],
    ["deepFirefly","深海蛍",[_E],[],"誘蛾灯のように潜航者を惹きつける小群。",{mad:2}],
    ["mirrorFish","鏡面魚",[_K],[_S],"体表に自分の光を映す。群れると方向感覚を奪う。",{mad:2}],
    ["haloLeech","光輪蛭",[_T],[_B],"光を吸って肥大。吸われると視界が暗くなる。",{dr:1,mad:2}],
    ["radiantChild","眩き落とし子",[_S,_B],[_T],"幼い人型。全身が眩しく、正視できない。",{mad:3}],
  ],
  [ // Z6 氷結海淵 — 凍結保存された古い恐怖
    ["iceShellBeast","氷殻生物",[_T],[_K,_S],"氷の殻を何層もまとう。一撃が重い。",{def:7,mad:1}],
    ["frostWisp","凍気の影",[_T,_E],[_K],"殻を持たず、冷気そのものが形をとる。",{mad:2}],
    ["glacierCorpse","氷漬けの先客",[_T],[_K],"何百年も前の潜航者。氷の中で目を開ける。",{mad:3}],
    ["rimeCrawler","霜の這うもの",[_T],[_S],"触れた所から凍らせながら這う多足。",{st:1,mad:2}],
    ["hushWhale","静寂鯨の仔",[_E],[_K],"氷の下で歌う。聞くと体温が下がっていく。",{dr:1,mad:3}],
    ["shatterPolyp","砕けるポリプ",[_T],[_K],"倒すと氷の破片を撒く。破片も集まって動く。",{mad:2}],
    ["frozenChoir","凍てついた合唱",[_T],[_S],"氷柱の一本一本が人の顔で、口が動く。",{mad:3}],
    ["permafrostHand","永久凍土の手",[_T],[_K,_B],"海底から突き出た巨大な手。指が一本ずつ動く。",{def:5,mad:3}],
    ["blizzardEye","吹雪の眼",[_T],[_E],"渦を巻く氷晶の中心に、閉じない一つの目。",{mad:3}],
    ["cryoSpawn","氷結の落とし子",[_T,_S],[_K],"氷から生まれたばかり。まだ何になるか決まっていない。",{mad:2}],
  ],
  [ // Z7 磁気異常帯 — 幾何学と方向感覚の崩壊
    ["magnetite","磁鉄塊",[_S],[_E,_K],"磁鉄を取り込んで成長。周囲の金属を引き寄せる。",{def:6,mad:1}],
    ["pulseNode","脈動節",[_K],[_E],"一定間隔で強い電磁パルス。機器が誤作動する。",{st:1,mad:2}],
    ["compassWraith","羅針の亡霊",[_S],[_E],"常に北を指す腕。その先には何もない。",{mad:3}],
    ["polarityTwin","極性の双子",[_K],[_E],"二体で一体。片方を殴るともう片方が痛がる。",{mad:3}],
    ["ironChoir","鉄の聖歌隊",[_S],[_E,_K],"砂鉄が人型に立ち上がり磁場で低く唸る。",{mad:3}],
    ["lodestoneSaint","磁石の聖人",[_S],[_E],"全ての金属が彼を向く。近づくと装備が剥がれる。",{mad:3}],
    ["fluxSerpent","磁束の蛇",[_K],[_E],"磁力線に沿って泳ぐ。触れると自分の位置を見失う。",{mad:3}],
    ["reverseFish","反転魚",[_S],[_E],"鏡像。攻撃すると自分が受ける錯覚に陥る。",{mad:3}],
    ["hollowNorth","虚ろな北",[_K,_B],[_E],"方角そのものが結晶化した存在。帰り道を忘れる。",{mad:3}],
    ["magnetSpawn","磁気の落とし子",[_S],[_E],"鉄屑が集合しただけの子。まだ形が定まらない。",{mad:2}],
  ],
  [ // Z8 巨骸の谷 — 骨。神の死骸
    ["ossuaryLord","骨層の主",[_T,_S],[_K],"無数の骨が一個体としてまとまり谷を這う。",{def:5,mad:2}],
    ["marrowEater","髄喰い",[_E],[_B],"死骸の髄を食べて増える。倒した敵から湧く。",{dr:1,mad:2}],
    ["ribCathedral","肋骨の聖堂",[_S],[_K],"巨大な肋骨が建物のように立ち、中で何かが息をする。",{def:5,mad:3}],
    ["skullTide","髑髏の潮",[_T],[_K],"頭蓋骨だけの大群が波のように押し寄せる。",{mad:3}],
    ["boneChoir","骨の聖歌隊",[_T,_S],[_K],"顎骨だけが宙に浮き、噛み合わせで讃美歌を刻む。",{mad:3}],
    ["godRemnant","神の残骸",[_B],[_K,_T],"種の分からない巨大生物の一部。まだ体温がある。",{def:4,hp:1.9,mad:3}],
    ["calciteWidow","方解石の寡婦",[_S],[_K],"骨で編んだドレスの人型。喪服のように黒い。",{mad:3}],
    ["gnawSwarm","齧りの群れ",[_E,_T],[],"骨を削る小型種。装備を齧って弱らせる。",{mad:2}],
    ["hollowIdol","虚ろな偶像",[_T],[_B],"骨を積んだ祭壇。祈られると力を増す。",{mad:3}],
    ["valeSpawn","谷の落とし子",[_T,_S],[_K],"骨の隙間から這い出たばかり。谷そのものの子。",{mad:2}],
  ],
  [ // Z9 無音海溝 — 音の消えた観測者
    ["silentOne","無音の個体",[_B],[_S,_E],"音を発さず水の張力で位置がわかる。攻撃は速く正確。",{atk:1.5,mad:2}],
    ["voidFish","空隙魚",[_K],[_T],"体内に空隙を保つ。近づくと圧が抜ける音がする。",{mad:2}],
    ["theWatching","見ているもの",[_B],[_S,_E],"観測されると振る舞いが変わる。見ない間に近づく。",{mad:3}],
    ["muteChoir","沈黙の聖歌隊",[_B],[_S],"口を開けて讃美するが音は一切しない。耳鳴りだけ残る。",{mad:3}],
    ["angleThing","角度のもの",[_T],[_S,_K],"体の角度が合わない。見ていると首が痛くなる。",{mad:3}],
    ["pressureSaint","水圧の聖者",[_B],[_S],"周囲の圧を操る人型。近づくと耐圧殻が軋む。",{mad:3}],
    ["namelessGuest","名の無い客",[_B],[_S,_E],"ずっと隊にいた気がする四人目。数えると消える。",{mad:3}],
    ["hollowChord","虚ろな和音",[_T],[_S],"聞こえない音の塊。当たると数ターン指示が通らなくなる。",{st:1,mad:3}],
    ["trenchMother","海溝の母",[_B],[_S,_K],"溝そのものが胎で silentOne を産み続ける。",{def:4,hp:1.8,mad:3}],
    ["quietSpawn","静寂の落とし子",[_B],[_S],"音を吸って育つ。周りが静かになるほど強くなる。",{mad:2}],
  ],
  [ // Z10 星海境界 — 海が宇宙になる
    ["starSpawn","星の落とし子",[_B],[_K,_T],"海底にあるはずのない鉱物組成。星の残骸が芽吹いた。",{mad:3}],
    ["nebulite","星雲体",[_S],[_E],"雲状の体。触れたもののエネルギーを吸って光る。",{dr:1,mad:3}],
    ["voidWarden","境界の番人",[_T],[_B,_K],"内と外を行き来する。観測されると動きが変わる。",{mad:3}],
    ["theOpening","開きゆくもの",[_S,_B],[_K,_T],"空間に開いた瞳孔。向こう側に星がある。",{mad:3}],
    ["constellationBeast","星座の獣",[_T],[_K],"光点を線で結ぶと獣の形。見上げるたび形が違う。",{mad:3}],
    ["cosmicChoir","天の聖歌隊",[_S],[_E,_B],"銀河の回転が讃美歌。聞くと自分が小さすぎて笑い出す。",{mad:3}],
    ["theGeometer","幾何学する者",[_B],[_K,_T,_E],"不可能な立体。隊のスキルが一つ無かったことになる。",{mad:3}],
    ["drownedGod","沈んだ神",[_S,_B],[_K,_T],"深度10000mで眠る巨躯。目を開けると潜航が終わる。",{def:4,hp:2.1,mad:3}],
    ["observerChild","観測者の落とし子",[_T],[_B,_K],"幼い形の番人。こちらを記録しようとする。",{mad:3}],
    ["theReturn","還るもの",[_K,_T,_E,_S,_B],[_K,_T,_E,_S,_B],"全属性が弱点かつ全属性を半減。潜航隊の誰かの顔をしている。",{mad:3}],
  ],
];

const HP_TIER  = [0.80, 0.90, 1.00, 1.05, 1.12, 1.18, 1.25, 1.38, 1.52, 1.65];
const ATK_TIER = [0.90, 1.00, 1.02, 1.10, 1.15, 1.20, 1.26, 1.32, 1.38, 1.45];
const DEF_TIER = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];

const ENEMY_BOOK = {};
const ENEMY_LORE = {};
ZONE_CREATURES.forEach((zone, zi) => {
  zone.forEach(([slug, name, weak, resist, note, o = {}], n) => {
    ENEMY_BOOK[slug] = {
      name, asset: slug,
      hpK: o.hp ?? HP_TIER[n],
      atkK: o.atk ?? ATK_TIER[n],
      def: (o.def ?? DEF_TIER[n]) + Math.floor(zi / 3),
      weak, resist,
      poison: !!o.p, burn: !!o.b, drain: !!o.dr, stun: !!o.st,
      mad: o.mad ?? 0, zone: zi,
    };
    const lows = weak.map((w) => Object.keys(DMG).find((k) => DMG[k] === w));
    ENEMY_LORE[slug] = {
      note,
      deep: `弱点 ${weak.join("・") || "なし"} / 耐性 ${resist.join("・") || "なし"}。標本の解析で行動傾向が明らかになった。`,
      chain: n >= 7 ? [] : [zone[9][0]], // 下位個体は海域の「落とし子/主」に連なる
    };
  });
});

// 異常個体(レアエンカウント、7%・3ターンで逃げる) — 海域ごとに専用の1体。文言は src/messages.json で管理。
const ANOMALIES = MESSAGES.anomalies.list;
const ANOMALY_WEAK = [DMG.KIN, DMG.THR, DMG.EM, DMG.SON, DMG.BIO];
// 各海域専用の異常個体アイコン枠。creatures/<asset>.webp(上の glob)で既に登録済みなら
// それを優先し、無ければ汎用の異常個体アイコン(Sparkles / anomaly.webp)にフォールバックする。
for (const a of ANOMALIES) {
  if (ASSETS[a.asset]) continue; // creatures/*.webp から既に登録済み
  ASSETS[a.asset] = { icon: ASSETS.anomaly.icon, img: ASSETS.anomaly.img || null };
}

const SPECIMEN_UNLOCK = 3;
// ボスのロア文(図鑑詳細)。文言は src/messages.json で管理。
const BOSS_LORE = MESSAGES.bossLore;

/* ------------------------------------------------------------
   海域定義 — 10海域 × 各10階層 = 深度100
   降りるほど海が宇宙に近づいていく
------------------------------------------------------------ */
const ZONES = [
  {
    name: "薄明層", en: "TWILIGHT", depth: "-200m",
    enemies: ["lanternfish","hatchetfish","viperfish","driftjelly","glassSquid","combJelly","krillSwarm","bristlemouth","paleShrimp","siphonChain"],
    terrain: "kelp",
    bg: { top: [16, 40, 58], mid: [8, 26, 42], deep: [3, 10, 20], accent: "79,214,232", light: 0.55 },
    motes: { color: [150, 220, 235], mode: "rise", density: 26 },
    boss: { id: "bossKraken", name: "薄明の触手体", asset: "bossKraken", weak: [DMG.THR, DMG.EM], resist: [DMG.KIN], summons: ["driftjelly","krillSwarm"], chargeLine: "触手が水を巻き込んでいく……", bigLine: "渦潮の締め上げ!!", summonLine: "水中に群れが呼び寄せられた!" },
  },
  {
    name: "珊瑚礁址", en: "REEF RUINS", depth: "-600m",
    enemies: ["armoredCrab","stonePolyp","coralWraith","urchinCrown","moray","clamMaw","reefLantern","brittleNest","spongeChoir","anemoneVeil"],
    terrain: "coral",
    bg: { top: [14, 44, 50], mid: [7, 27, 34], deep: [2, 9, 16], accent: "94,224,196", light: 0.45 },
    motes: { color: [140, 235, 210], mode: "drift", density: 30 },
    boss: { id: "bossReef", name: "礁址の甲殻王", asset: "bossReef", weak: [DMG.KIN], resist: [DMG.SON, DMG.BIO], summons: ["armoredCrab","stonePolyp"], chargeLine: "巨大な鋏が硬く閉じられる……", bigLine: "断裂の鋏撃!!", summonLine: "岩陰から甲殻が這い出した!" },
  },
  {
    name: "沈船墓場", en: "WRECK FIELD", depth: "-1200m",
    enemies: ["hollowSuit","hulkCore","rustChoir","barnacleHost","drownLantern","cargoSwarm","anchorWraith","propGhast","logbookThing","brineDoll"],
    terrain: "wreck",
    bg: { top: [20, 34, 44], mid: [10, 19, 28], deep: [3, 7, 12], accent: "138,160,180", light: 0.32 },
    motes: { color: [170, 190, 205], mode: "drift", density: 20 },
    boss: { id: "bossHulk", name: "沈没船の意志", asset: "bossHulk", weak: [DMG.EM], resist: [DMG.BIO], summons: ["hollowSuit","hulkCore"], chargeLine: "船体が軋みながら傾いていく……", bigLine: "崩落の船首撃!!", summonLine: "船倉から漂流者が溢れ出す!" },
  },
  {
    name: "熱水噴出帯", en: "HYDROTHERMAL", depth: "-2000m",
    enemies: ["ventHeart","scorchMoth","sulfurGrazer","blackSmoker","tubewormKing","magmaJelly","thermophage","brimstoneCrab","ashChoir","ventLarva"],
    terrain: "vents",
    bg: { top: [46, 22, 18], mid: [26, 11, 12], deep: [8, 3, 5], accent: "255,138,92", light: 0.42 },
    motes: { color: [255, 160, 90], mode: "rise", density: 38 },
    boss: { id: "bossVent", name: "噴出孔の心臓", asset: "bossVent", weak: [DMG.KIN], resist: [DMG.THR], burn: true, summons: ["scorchMoth","ventLarva"], chargeLine: "熱水が限界まで圧縮されていく……", bigLine: "灼熱の噴出!!", summonLine: "熱泥から焼灼虫が湧いた!" },
  },
  {
    name: "発光生物圏", en: "BIOLUMEN", depth: "-3000m",
    enemies: ["luminMatrix","sirenLure","eyeBloom","phosphorSaint","glowGospel","jellyChandelier","deepFirefly","mirrorFish","haloLeech","radiantChild"],
    terrain: "bloom",
    bg: { top: [34, 16, 52], mid: [18, 8, 32], deep: [5, 2, 12], accent: "197,140,255", light: 0.40 },
    motes: { color: [220, 160, 255], mode: "float", density: 40 },
    boss: { id: "bossBloom", name: "発光の母体", asset: "bossBloom", weak: [DMG.THR], resist: [DMG.EM, DMG.BIO], drain: true, summons: ["luminMatrix","sirenLure"], chargeLine: "母体が光を溜め込んでいく……", bigLine: "眩耀の放射!!", summonLine: "光の群体が分裂した!" },
  },
  {
    name: "氷結海淵", en: "GLACIAL", depth: "-4200m",
    enemies: ["iceShellBeast","frostWisp","glacierCorpse","rimeCrawler","hushWhale","shatterPolyp","frozenChoir","permafrostHand","blizzardEye","cryoSpawn"],
    terrain: "ice",
    bg: { top: [24, 42, 60], mid: [12, 24, 40], deep: [3, 8, 16], accent: "170,220,255", light: 0.48 },
    motes: { color: [225, 240, 255], mode: "fall", density: 42 },
    boss: { id: "bossGlacier", name: "氷結の巨殻", asset: "bossGlacier", weak: [DMG.THR], resist: [DMG.KIN, DMG.SON], summons: ["iceShellBeast","frostWisp"], chargeLine: "巨殻の表面に霜が走る……", bigLine: "絶対零度の圧壊!!", summonLine: "氷が割れ、眷属が現れた!" },
  },
  {
    name: "磁気異常帯", en: "MAGNETIC", depth: "-5600m",
    enemies: ["magnetite","pulseNode","compassWraith","polarityTwin","ironChoir","lodestoneSaint","fluxSerpent","reverseFish","hollowNorth","magnetSpawn"],
    terrain: "magnet",
    bg: { top: [22, 24, 54], mid: [11, 12, 32], deep: [3, 4, 12], accent: "127,167,255", light: 0.38, flicker: true },
    motes: { color: [160, 190, 255], mode: "float", density: 30, fast: true },
    boss: { id: "bossMagnet", name: "磁気の中枢", asset: "bossMagnet", weak: [DMG.SON], resist: [DMG.EM, DMG.KIN], stun: true, summons: ["pulseNode","magnetite"], chargeLine: "磁場が渦を巻いて収束する……", bigLine: "磁極反転衝!!", summonLine: "鉄塊が引き寄せられ集合した!" },
  },
  {
    name: "巨骸の谷", en: "OSSUARY", depth: "-7000m",
    enemies: ["ossuaryLord","marrowEater","ribCathedral","skullTide","boneChoir","godRemnant","calciteWidow","gnawSwarm","hollowIdol","valeSpawn"],
    terrain: "bones",
    bg: { top: [30, 30, 28], mid: [15, 15, 15], deep: [4, 4, 5], accent: "200,190,170", light: 0.26 },
    motes: { color: [210, 200, 180], mode: "drift", density: 22 },
    boss: { id: "bossLeviathan", name: "巨骸の残響", asset: "bossLeviathan", weak: [DMG.THR, DMG.SON], resist: [DMG.KIN], summons: ["marrowEater","valeSpawn"], chargeLine: "骨の谷全体が低く鳴りはじめる……", bigLine: "巨骸の咆哮!!", summonLine: "骨の隙間から髄喰いが這い出た!" },
  },
  {
    name: "無音海溝", en: "SILENCE", depth: "-8500m",
    enemies: ["silentOne","voidFish","theWatching","muteChoir","angleThing","pressureSaint","namelessGuest","hollowChord","trenchMother","quietSpawn"],
    terrain: "trench",
    bg: { top: [10, 12, 18], mid: [5, 6, 11], deep: [1, 2, 4], accent: "120,140,170", light: 0.18 },
    motes: { color: [150, 170, 200], mode: "float", density: 14 },
    boss: { id: "bossSilence", name: "無音の王", asset: "bossSilence", weak: [DMG.BIO], resist: [DMG.SON, DMG.EM], summons: ["silentOne","quietSpawn"], chargeLine: "音が完全に消え、水が張り詰める……", bigLine: "静寂の圧殺!!", summonLine: "闇の中から個体が滲み出た!" },
  },
  {
    name: "星海境界", en: "STARSEA", depth: "-10000m",
    enemies: ["starSpawn","nebulite","voidWarden","theOpening","constellationBeast","cosmicChoir","theGeometer","drownedGod","observerChild","theReturn"],
    terrain: "stars",
    bg: { top: [8, 8, 26], mid: [4, 4, 16], deep: [1, 1, 6], accent: "255,210,127", light: 0.30, stars: true },
    motes: { color: [255, 225, 180], mode: "float", density: 34 },
    boss: { id: "bossStar", name: "境界の観測者", asset: "bossStar", weak: [DMG.SON, DMG.BIO], resist: [DMG.KIN], summons: ["voidWarden","nebulite"], chargeLine: "観測者の環がゆっくりと開いていく……", bigLine: "境界崩落!!", summonLine: "空間が裂け、番人が滑り出た!", final: true },
  },
];
const zoneOf = (d) => Math.min(9, Math.floor((d - 1) / 10));
const layerOf = (d) => ((d - 1) % 10) + 1;
const depthLabel = (d) => `${zoneOf(d) + 1}-${layerOf(d)}`;
const depthMeters = (d) => Math.round(d * 100);

// ネイティブへ効果音再生を要求(iOS WKWebView ブリッジ。無ければ何もしない)
function playSE(name) {
  try { window.webkit?.messageHandlers?.sound?.postMessage?.(name); } catch { /* noop */ }
}

/* 海域 zi の図鑑エントリ一覧(通常敵 + 変異種 + ボス)。BestiaryOverlay と
   コンプ判定の両方で使う。ID は seen / scanned のキーと一致させる。 */
function zoneBookIds(zi) {
  const z = ZONES[zi];
  return {
    enemies: [...new Set(z.enemies)],
    mutant: `mutant${zi}`,
    boss: z.boss.id,
  };
}
function zoneBestiaryStatus(zi, meta) {
  const { enemies, mutant, boss } = zoneBookIds(zi);
  const seen = meta?.seen || {};
  const scanned = meta?.scanned || {};
  const all = [...enemies, boss]; // 変異種はコンプ必須にしない
  const seenN = all.filter((id) => seen[id]).length + (seen[mutant] ? 1 : 0);
  const total = all.length + 1;
  // 弱点まで確定しているか(ボスは看破済み前提なので敵のみ厳密判定)
  const weakDone = enemies.every((id) => {
    const want = (ENEMY_BOOK[id]?.weak) || [];
    const got = scanned[id]?.w || [];
    return want.every((w) => got.includes(w));
  });
  const complete = all.every((id) => seen[id]) && weakDone;
  return { seenN, total, complete };
}

/* ------------------------------------------------------------
   生成ユーティリティ
------------------------------------------------------------ */
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
let UID = 1;
const uid = () => `u${UID++}_${Date.now() % 100000}`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// レアリティ抽選。field: "weight"(物資) / "crewWeight"(クルー)
// luck>0 で高レア寄り(残骸・ボス報酬など)
// depth=50 を基準(既存バランス)に、浅いほど高レアを強く抑え、深いほど強く押し上げる。
// 低階層を周回するだけで最高レアが出てしまわないようにするための係数。
function rollRarity(luck = 0, field = "weight", depth = 50) {
  const depthT = Math.min(1.6, Math.max(0.12, depth / 50));
  const ws = RARITIES.map((r, i) => r[field] * (1 + luck * i * 0.85) * Math.pow(depthT, i * 0.9));
  const total = ws.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < RARITIES.length; i++) {
    roll -= ws[i];
    if (roll <= 0) return RARITIES[i];
  }
  return RARITIES[0];
}

// クルーの永続レベル(名簿の type ごとに meta.crewLevels で管理)。名簿は8種のクルー職
// そのものだけで、レアリティは別の名簿枠を作らない(実際の絵は職種ごとに1種類しか無いため、
// レアリティで名簿を水増ししても「大人数いるように見えて実は同じ8人」になってしまう)。
// 育成は「戦って少しずつ」「強化画面で武器を消費して」の2通りで、この8種を直接強くする形にする。
// 1レベルにつきHP/攻撃力+3%。最大20レベル(+60%)で頭打ちにし、際限ない成長にしない。
const CREW_LEVEL_MAX = 20;
const CREW_LEVEL_BONUS_PER = 0.03;
function crewLevelOf(crewLevels, typeId) {
  return Math.min(CREW_LEVEL_MAX, Math.max(0, (crewLevels || {})[typeId] || 0));
}
function makeCrew(depth, opts = {}) {
  const typeId = opts.type || pick(Object.keys(CREW_TYPES));
  const t = CREW_TYPES[typeId];
  // レアリティは名簿(永続)には影響しない演出上の値として残しているが、常に std 固定にする
  // (名簿の水増しをやめ、強さは crewLevels 側の育成に一本化するため)。
  const rar = rarityOf(opts.rarity || "std");
  const idx = rarityIdx(rar.id);
  const scale = 1 + (depth - 1) * 0.05;
  const level = crewLevelOf(opts.crewLevels, typeId);
  const levelMul = 1 + level * CREW_LEVEL_BONUS_PER;
  const maxHp = Math.round(t.hp * rar.mult * scale * levelMul);
  const band = gearBandOf(depth); // 見た目は発見した海域帯(浅/中/深)で変わる
  return {
    id: uid(), kind: "crew", type: typeId, name: CREW_NAMES[typeId][idx],
    rarity: rar.id, asset: `${t.asset}_${band}`, band,
    maxHp, hp: maxHp, atk: Math.round(t.atk * rar.mult * scale * levelMul),
    gear: null, weapon: null, cd: 0, buffAtk: 0, guard: 0, down: false,
    level,
  };
}

function makeGear(depth, opts = {}) {
  const slot = opts.slot || pick(Object.keys(GEAR_TYPES));
  const g = GEAR_TYPES[slot];
  const rar = opts.rarity ? rarityOf(opts.rarity) : rollRarity(opts.luck || 0, "weight", depth);
  const idx = rarityIdx(rar.id);
  const band = gearBandOf(depth);
  const bandMul = GEAR_BAND_MUL[band];
  const s = 1 + depth * 0.02;
  return {
    id: uid(), kind: "gear", slot, band,
    name: GEAR_NAMES[slot][band][idx], rarity: rar.id,
    asset: `${slot}_${band}_${idx + 1}`,
    hp: Math.round(g.hp * rar.mult * bandMul * s),
    atk: Math.round(g.atk * rar.mult * bandMul * s),
    def: Math.round(g.def * rar.mult * (band === "deep" ? 1.5 : band === "mid" ? 1.2 : 1)),
  };
}

function makeRelic(owned = [], opts = {}) {
  // depth 未指定(呼び出し側の対応漏れ等)の場合は安全側(全解禁しない)に倒さず、
  // 従来通り全遺物を対象にする(海域情報が無い場所からの呼び出しを壊さないため)。
  const zi = opts.depth != null ? zoneOf(opts.depth) : 9;
  const pool = RELICS.filter((r) => !owned.some((o) => o.relicId === r.id) && (RELIC_MIN_ZONE[r.id] || 0) <= zi);
  if (pool.length === 0) return null;
  const r = opts.luck > 0
    ? pool.sort((a, b) => rarityIdx(b.rarity) - rarityIdx(a.rarity))[ri(0, Math.min(2, pool.length - 1))]
    : pick(pool);
  return { id: uid(), kind: "relic", relicId: r.id, name: r.name, desc: r.desc, rarity: r.rarity, asset: r.id };
}

function makeConsumable(idOverride, opts = {}) {
  const table = [["medkit", 32], ["serum", 16], ["charge", 14], ["torpedo", 20], ["coolant", 18]];
  let id = idOverride;
  if (!id) {
    const total = table.reduce((a, [, w]) => a + w, 0);
    let roll = Math.random() * total;
    for (const [cid, w] of table) { roll -= w; if (roll <= 0) { id = cid; break; } }
  }
  const c = CONSUMABLES[id];
  return { id: uid(), kind: "item", itemId: id, name: c.label, asset: c.asset,
    ...(opts.bookId ? { bookId: opts.bookId } : {}),
    rarity: id === "core" || id === "shard" ? "abyss" : id === "specimen" ? "rare" : "std" };
}

// 序盤(深度1〜5)は敵のHP/ATKを少しだけ抑える(6以降は通常どおり)。
// 属性の相性が悪いクルーだけで組んでも、ただ攻撃するだけで安定して抜けられるようにするための手加減。
const rookieMercy = (depth) => (depth >= 6 ? 1 : 0.72 + (depth - 1) * 0.05);

function makeEnemy(bookId, depth) {
  const b = ENEMY_BOOK[bookId];
  const mercy = rookieMercy(depth);
  const hp = Math.round((22 + depth * 9) * b.hpK * rnd(0.92, 1.08) * mercy);
  const atk = Math.round((5 + depth * 1.05) * b.atkK * mercy);
  return {
    id: uid(), bookId, name: b.name, asset: b.asset,
    hp, maxHp: hp, atk, def: b.def + Math.floor(depth / 14),
    weak: b.weak, resist: b.resist,
    poison: !!b.poison, burn: !!b.burn, drain: !!b.drain, stun: !!b.stun,
    scanned: false, paralyzed: 0, paralyzeImmune: 0, burning: 0, exposed: 0, anomaly: false, boss: false,
  };
}
function makeAnomaly(depth) {
  const hp = Math.round(70 + depth * 12);
  const zi = zoneOf(depth);
  const A = ANOMALIES[zi];
  return {
    id: uid(), bookId: `mutant${zi}`, name: A.name, asset: A.asset,
    hp, maxHp: hp, atk: 3, def: 0, weak: ANOMALY_WEAK, resist: [],
    anomaly: true, fleeIn: 3, scanned: true, paralyzed: 0, paralyzeImmune: 0, burning: 0, exposed: 0, boss: false,
  };
}
function makeBoss(depth) {
  const z = zoneOf(depth);
  const B = ZONES[z].boss;
  const hp = Math.round((22 + depth * 9) * (3.4 + z * 0.45));
  return {
    id: uid(), bookId: B.id, name: B.name, asset: B.asset,
    hp, maxHp: hp, atk: Math.round((5 + depth * 1.05) * 1.35), def: 3 + z * 2,
    weak: B.weak, resist: B.resist, boss: true, anomaly: false,
    burn: !!B.burn, drain: !!B.drain, stun: !!B.stun,
    scanned: true, paralyzed: 0, paralyzeImmune: 0, burning: 0, exposed: 0, charge: false, summoned: 0,
    summons: B.summons, chargeLine: B.chargeLine, bigLine: B.bigLine, summonLine: B.summonLine,
    final: !!B.final,
  };
}

function encounterFor(depth) {
  const z = ZONES[zoneOf(depth)];
  const l = layerOf(depth);
  // 階層が進むごとに図鑑の下位→上位個体が順に解放される(10階層で全10体)
  const avail = z.enemies.slice(0, Math.min(z.enemies.length, 3 + l));
  let count = l <= 2 ? ri(1, 2) : l <= 6 ? 2 : ri(2, 3);
  if (zoneOf(depth) >= 4) count = Math.max(count, 2);
  // 序盤(深度1〜5)は単体戦のみ。「ただ攻撃するだけ」でも安定して抜けられるように
  if (depth <= 5) count = 1;
  const list = Array.from({ length: count }, () => makeEnemy(pick(avail), depth));
  if (Math.random() < 0.07) list.push(makeAnomaly(depth)); // 7%で異常個体
  return list;
}

/* ------------------------------------------------------------
   スキルツリー — 残響片で解放する恒久強化
   effect.type を skillEffectTotal() で集計して戦闘/潜航に反映する。
   構造的な効果(枠数・開始品)は skillStructural() で個別参照。
------------------------------------------------------------ */
const SKILL_TREE = [
  // ── 火力 ── 属性ごとに 心得(+8%) → 極意(+さらに16%)
  { id: "kinI",  name: "徹甲の心得", cat: "火力", cost: 3, req: null,
    desc: "徹甲(KIN)属性の与ダメージ +8%。", effect: { type: "elemDmg", element: DMG.KIN, value: 0.08 } },
  { id: "kinII", name: "徹甲の極意", cat: "火力", cost: 8, req: "kinI",
    desc: "徹甲属性の与ダメージ さらに +16%(合計+24%)。", effect: { type: "elemDmg", element: DMG.KIN, value: 0.16 } },
  { id: "thrI",  name: "熱量の心得", cat: "火力", cost: 3, req: null,
    desc: "熱量(THR)属性の与ダメージ +8%。", effect: { type: "elemDmg", element: DMG.THR, value: 0.08 } },
  { id: "thrII", name: "熱量の極意", cat: "火力", cost: 8, req: "thrI",
    desc: "熱量属性の与ダメージ さらに +16%(合計+24%)。", effect: { type: "elemDmg", element: DMG.THR, value: 0.16 } },
  { id: "emI",   name: "電磁の心得", cat: "火力", cost: 3, req: null,
    desc: "電磁(EM)属性の与ダメージ +8%。", effect: { type: "elemDmg", element: DMG.EM, value: 0.08 } },
  { id: "emII",  name: "電磁の極意", cat: "火力", cost: 8, req: "emI",
    desc: "電磁属性の与ダメージ さらに +16%(合計+24%)。", effect: { type: "elemDmg", element: DMG.EM, value: 0.16 } },
  { id: "sonI",  name: "音響の心得", cat: "火力", cost: 3, req: null,
    desc: "音響(SON)属性の与ダメージ +8%。", effect: { type: "elemDmg", element: DMG.SON, value: 0.08 } },
  { id: "sonII", name: "音響の極意", cat: "火力", cost: 8, req: "sonI",
    desc: "音響属性の与ダメージ さらに +16%(合計+24%)。", effect: { type: "elemDmg", element: DMG.SON, value: 0.16 } },
  { id: "bioI",  name: "生体の心得", cat: "火力", cost: 3, req: null,
    desc: "生体(BIO)属性の与ダメージ +8%。", effect: { type: "elemDmg", element: DMG.BIO, value: 0.08 } },
  { id: "bioII", name: "生体の極意", cat: "火力", cost: 8, req: "bioI",
    desc: "生体属性の与ダメージ さらに +16%(合計+24%)。", effect: { type: "elemDmg", element: DMG.BIO, value: 0.16 } },
  { id: "weakEdge", name: "弱点看破の徹底", cat: "火力", cost: 14,
    reqAll: ["kinII", "thrII", "emII", "sonII", "bioII"],
    desc: "弱点を突いた時のダメージ倍率 +0.20。五属性すべての極意に至った証。", effect: { type: "weakMult", value: 0.20 } },

  // ── 生存 ── 耐圧の基礎から「もっとHPを盛る(耐圧殻)」「回復で粘る(始動時の呼吸)」に分岐。
  //           被弾の軽減からも「低HP時に強くなる(土壇場)」「常に軽減幅を増やす(軽減II)」に分岐する。
  { id: "hullSeed", name: "耐圧の基礎", cat: "生存", cost: 3, req: null,
    desc: "全クルーの最大HP +6%。", effect: { type: "maxHpPct", value: 0.06 } },
  { id: "hullI", name: "耐圧殻I", cat: "生存", cost: 7, req: "hullSeed",
    desc: "全クルーの最大HP さらに +8%(合計+14%)。", effect: { type: "maxHpPct", value: 0.08 } },
  { id: "hullII", name: "耐圧殻II", cat: "生存", cost: 12, req: "hullI",
    desc: "全クルーの最大HP さらに +10%(合計+24%)。", effect: { type: "maxHpPct", value: 0.10 } },
  { id: "battleHeal", name: "始動時の呼吸", cat: "生存", cost: 8, req: "hullSeed",
    desc: "各戦闘の開始時、隊全体のHPを 8% 回復する(耐圧の基礎からの分岐)。", effect: { type: "battleStartHeal", value: 0.08 } },
  // 到達した海域で解放される上位スキル(深い海域まで潜った人向け)。unlock.zone: その海域に到達(最深到達)で解放。
  { id: "hullDeep", name: "深淵の耐圧殻", cat: "生存", cost: 20, req: "hullII", unlock: { zone: 6 },
    desc: "全クルーの最大HP さらに +10%(合計+34%)。海域6に到達で解放。", effect: { type: "maxHpPct", value: 0.10 } },
  { id: "endure", name: "踏みとどまる意志", cat: "生存", cost: 30, req: "lowHp", unlock: { zone: 9 },
    desc: "敵ターンの開始時にHPが50%以上のクルーは、そのターン中の致死ダメージをHP1で耐える(1人1回)。海域9に到達で解放。", effect: { type: "endure", value: 1 } },
  { id: "titanSeal", name: "覇者の刻印", cat: "火力", cost: 30, req: "weakEdge", unlock: { zone: 9 },
    desc: "全クルーの与ダメージ +10%。海域9に到達で解放。", effect: { type: "allDmgPct", value: 0.10 } },
  { id: "wardSeed", name: "被弾の軽減I", cat: "生存", cost: 4, req: null,
    desc: "受けるダメージを一律 -1(最低1)。", effect: { type: "flatDR", value: 1 } },
  { id: "wardSeed2", name: "被弾の軽減II", cat: "生存", cost: 7, req: "wardSeed",
    desc: "受けるダメージの軽減が さらに -1(合計-2、最低1)。常時発動する軽減を伸ばす分岐。", effect: { type: "flatDR", value: 1 } },
  { id: "lowHp", name: "土壇場の粘り", cat: "生存", cost: 10, req: "wardSeed",
    desc: "HPが最大の25%以下のクルーは被ダメージ -25%。崖際の一撃に強くなる分岐。", effect: { type: "lowHpDR", value: 0.25, threshold: 0.25 } },
  { id: "toxinWard", name: "鰓の濾過", cat: "生存", cost: 6, req: null,
    desc: "毒・燃焼で受ける継続ダメージを半減する。", effect: { type: "dotHalf", value: 1 } },
  { id: "primeSkill", name: "予圧起動", cat: "生存", cost: 9, req: null,
    desc: "各戦闘の開始時、全クルーの固有スキルを即使用可能にする。", effect: { type: "primeSkill", value: 1 } },

  // ── 探索 ── 救難感度から「隠しルートが見える(海図読み)」「もっと救難が増える(感度II)」に分岐。
  { id: "bagI", name: "拡張収納I", cat: "探索", cost: 4, req: null,
    desc: "収納枠 12 → 16。", struct: { bag: 4 } },
  { id: "bagII", name: "拡張収納II", cat: "探索", cost: 8, req: "bagI",
    desc: "収納枠 16 → 20。", struct: { bag: 4 } },
  { id: "storageI", name: "船倉拡張I", cat: "探索", cost: 8, req: null,
    desc: "船内ストレージの上限 50 → 65。", struct: { storageBonus: 15 } },
  { id: "storageII", name: "船倉拡張II", cat: "探索", cost: 14, req: "storageI",
    desc: "船内ストレージの上限 さらに+15(合計80)。", struct: { storageBonus: 15 } },
  { id: "bagIII", name: "果てなき収納", cat: "探索", cost: 25, req: "bagII",
    desc: "収納枠 20 → 26。高レアスキル(残響片25)。", struct: { bag: 6 } },
  { id: "relicFloor", name: "遺物の常備", cat: "探索", cost: 10, req: null,
    desc: "潜航開始時の遺物枠の下限が 3 になる。", struct: { relicFloor: 3 } },
  { id: "wreckLuck", name: "残骸の目利き", cat: "探索", cost: 6, req: null,
    desc: "残骸・戦利品のレア度がわずかに上がる。", effect: { type: "dropLuck", value: 0.2 } },
  { id: "signalSense", name: "救難感度I", cat: "探索", cost: 6, req: null,
    desc: "救難信号ノードの出現率が上がる。", effect: { type: "signalRate", value: 0.08 } },
  { id: "chartRead", name: "海図読み", cat: "探索", cost: 9, req: "signalSense",
    desc: "海図に隠された海溝分岐が見えるようになる。未知の場所を求める分岐。", effect: { type: "revealHidden", value: 1 } },
  { id: "signalSense2", name: "救難感度II", cat: "探索", cost: 8, req: "signalSense",
    desc: "救難信号ノードの出現率が さらに上がる。仲間集めを求める分岐。", effect: { type: "signalRate", value: 0.08 } },
  { id: "scanBook", name: "観測者の記録術", cat: "探索", cost: 7, req: null,
    desc: "戦闘中に敵を撃破すると、その種の標本をまれに(15%)採取する。", effect: { type: "killSpecimen", value: 0.15 } },

  // ── 編成 ── 出航人数と、潜航開始時の持ち物を整える系統。継承(死亡時の持ち帰り)は別カテゴリへ分離。
  { id: "packMed", name: "旅装の記憶I", cat: "編成", cost: 3, req: null,
    desc: "潜航の開始時に救命キットが1つ追加される。", struct: { start: "medkit" } },
  { id: "packMed2", name: "旅装の記憶II", cat: "編成", cost: 5, req: "packMed",
    desc: "潜航の開始時にさらに救命キットが1つ追加される。", struct: { start: "medkit" } },
  { id: "packCoolant", name: "旅装の記憶III", cat: "編成", cost: 6, req: "packMed",
    desc: "潜航の開始時に冷却剤が1つ追加される。", struct: { start: "coolant" } },
  // ── 編成拡大 ── 出航できる人数を 3 → 8 まで1人ずつ広げる長い一本道
  { id: "partyI", name: "編成拡大I", cat: "編成", cost: 8, req: null,
    desc: "出航できる隊員が 3 → 4 人になる。", struct: { crewSlots: 1 } },
  { id: "partyII", name: "編成拡大II", cat: "編成", cost: 14, req: "partyI",
    desc: "出航できる隊員が 4 → 5 人になる。", struct: { crewSlots: 1 } },
  { id: "partyIII", name: "編成拡大III", cat: "編成", cost: 20, req: "partyII",
    desc: "出航できる隊員が 5 → 6 人になる。", struct: { crewSlots: 1 } },
  { id: "partyIV", name: "編成拡大IV", cat: "編成", cost: 28, req: "partyIII",
    desc: "出航できる隊員が 6 → 7 人になる。", struct: { crewSlots: 1 } },
  { id: "partyV", name: "編成拡大V", cat: "編成", cost: 36, req: "partyIV",
    desc: "出航できる隊員が 7 → 8 人になる(上限)。", struct: { crewSlots: 1 } },

  // ── 継承 ── 全滅時の持ち帰り枠(死亡してもロスト海域へ残せる装備・遺物の数)。
  // 以前は20段階・総コスト1500超で、ボス撃破で得られる残響片の量と釣り合っておらず
  // 実質到達不能な水増しになっていた。周回制限(同じ海域のボスを再撃破しても満額の
  // 報酬が出ないようにする対策)と合わせて、現実的に積める規模(全8段・総計約120)に
  // 縮小した。持ち帰り枠は最大 1(基礎)+8 = 9 まで伸びる。
  ...(() => {
    const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
    const COST = [5, 7, 9, 12, 15, 19, 23, 28];
    return ROMAN.map((roman, i) => {
      const n = i + 1;
      return {
        id: n === 1 ? "carryFloor" : `carryFloor${n}`,
        name: `回収の余裕${roman}`, cat: "継承", cost: COST[i],
        req: n === 1 ? null : `carryFloor${n - 1}`,
        desc: `全滅時の持ち帰り枠が常に +1 される(合計 +${n})。`,
        struct: { carryBonus: 1 },
      };
    });
  })(),

  // ── 深淵の恵み ── 廃品回収・行商・関所・人魚など、道中のイベントを底上げする
  { id: "scrapYield", name: "分解効率I", cat: "深淵の恵み", cost: 5, req: null,
    desc: "廃品回収で得られる鉄屑 +1(個数固定加算)。", effect: { type: "scrapBonus", value: 1 } },
  { id: "scrapYield2", name: "分解効率II", cat: "深淵の恵み", cost: 11, req: "scrapYield",
    desc: "廃品回収で得られる鉄屑 さらに +1。", effect: { type: "scrapBonus", value: 1 } },
  { id: "shopDiscount", name: "行商の顔なじみ", cat: "深淵の恵み", cost: 8, req: null,
    desc: "行商の交換に必要な鉄屑が2割安くなる。", effect: { type: "shopDiscount", value: 0.2 } },
  { id: "shopDiscount2", name: "行商の信用", cat: "深淵の恵み", cost: 15, req: "shopDiscount",
    desc: "行商の交換価格が さらに2割安くなる(合計4割引)。", effect: { type: "shopDiscount", value: 0.2 } },
  { id: "gateWard", name: "関所の心得", cat: "深淵の恵み", cost: 9, req: null,
    desc: "関所を強行突破した時のダメージを 10 → 6 に軽減。", effect: { type: "gateDR", value: 4 } },
  { id: "mermaidBond", name: "人魚との縁", cat: "深淵の恵み", cost: 12, req: null,
    desc: "人魚の祝福の効果量 +10%、持続 +4ターン。", effect: { type: "blessingBoost", value: 0.10 } },
  { id: "mermaidBond2", name: "人魚との誓約", cat: "深淵の恵み", cost: 22,
    reqAll: ["mermaidBond", "gateWard", "shopDiscount", "scrapYield"],
    desc: "道中のイベント全ての効果が一段と高まる証。人魚の祝福の効果量 さらに +10%。",
    effect: { type: "blessingBoost", value: 0.10 } },
];
const SKILL_BY_ID = Object.fromEntries(SKILL_TREE.map((s) => [s.id, s]));
const SKILL_CATS = [...new Set(SKILL_TREE.map((s) => s.cat))];

// 解放条件(到達海域)を満たしているか。unlock.zone: 最深到達の海域番号(1〜10)以上で解放。
function skillUnlocked(skill, meta) {
  const z = skill.unlock?.zone;
  if (z == null) return true;
  return Math.floor(((meta?.bestDepth || 1) - 1) / 10) + 1 >= z;
}
const skillUnlockText = (skill) => (skill.unlock?.zone ? `海域${skill.unlock.zone}に到達すると解放されます。` : "");
function skillPrereqsMet(skill, skills) {
  if (skill.reqAll) return skill.reqAll.every((id) => !!skills?.[id]);
  if (skill.req) return !!skills?.[skill.req];
  return true;
}

/* ------------------------------------------------------------
   スキルツリーの円環レイアウト ― 中心(残響核)から6系統が枝分かれして
   外側へ広がる配置をワールド座標(px, 原点=中心)で1回だけ計算する。
   SKILL_TREE は静的データなので、モジュール読み込み時に一度だけ求めればよい。
------------------------------------------------------------ */
const SK_CAT_META = {
  "火力":       { icon: Flame,      color: "var(--danger)" },
  "生存":       { icon: HeartPulse, color: "var(--ok)" },
  "探索":       { icon: Compass,    color: "var(--cyan)" },
  "編成":       { icon: Anchor,     color: "var(--sk-party)" },
  "継承":       { icon: Gem,        color: "var(--amber)" },
  "深淵の恵み": { icon: Sparkles,   color: "var(--sk-blessing)" },
};
// スキル単位のアイコン。専用アイコン素材が無いため、効果の系統ごとに手持ちのアイコンを
// 割り当てて視認性を出す(同カテゴリでも枝によって見た目が変わるようにする)。
function skillIconFor(s) {
  if (s.effect?.type === "elemDmg") {
    return { [DMG.KIN]: Shield, [DMG.THR]: Flame, [DMG.EM]: Zap, [DMG.SON]: AudioLines, [DMG.BIO]: HeartPulse }[s.effect.element] || Sparkles;
  }
  if (s.id === "weakEdge" || s.id === "titanSeal") return Crosshair;
  if (s.id.startsWith("hull")) return Shield;
  if (s.id === "battleHeal") return HeartPulse;
  if (s.id.startsWith("wardSeed") || s.id === "lowHp") return Shield;
  if (s.id === "toxinWard") return Droplet;
  if (s.id === "primeSkill") return Zap;
  if (s.id === "endure") return Anchor;
  if (s.id.startsWith("bag") || s.id.startsWith("storage")) return Package;
  if (s.id === "relicFloor") return Gem;
  if (s.id === "wreckLuck") return Sparkles;
  if (s.id.startsWith("signalSense")) return Rss;
  if (s.id === "chartRead") return Compass;
  if (s.id === "scanBook") return Radar;
  if (s.id.startsWith("party")) return Anchor;
  if (s.id.startsWith("pack")) return Package;
  if (s.cat === "継承") return Gem;
  if (s.id.startsWith("scrapYield")) return Cpu;
  if (s.id.startsWith("shopDiscount")) return Package;
  if (s.id === "gateWard") return Shield;
  if (s.id.startsWith("mermaidBond")) return Sparkles;
  return SK_CAT_META[s.cat]?.icon || Sparkles;
}
const SK_RING_BASE = 58; // 中心(核)から最初の輪までの距離
const SK_RING_GAP = 66;  // 輪と輪(前提→次)の間隔
const SK_ARC = 52;       // 1系統が占める扇の角度(系統間に隙間を残す)
function buildSkillLayout() {
  const cats = SKILL_CATS;
  const n = cats.length;
  const pos = {}; // id -> { x, y, depth, cat }
  const parentOf = {};
  const catMaxR = {};
  cats.forEach((cat, ci) => {
    const baseAngle = -90 + (360 / n) * ci; // 12時の方向から時計回りに均等配置
    const list = SKILL_TREE.filter((s) => s.cat === cat);
    const ids = new Set(list.map((s) => s.id));
    const childOf = {};
    list.forEach((s) => {
      const parents = s.reqAll || (s.req ? [s.req] : []);
      const p = parents.find((x) => ids.has(x));
      parentOf[s.id] = p || null;
      if (p) (childOf[p] = childOf[p] || []).push(s.id);
    });
    const hasParent = new Set(Object.values(childOf).flat());
    const roots = list.filter((s) => !hasParent.has(s.id)).map((s) => s.id);
    let leafCounter = 0;
    const depth = {};
    const slot = {};
    // 葉(末端スキル)に等間隔の角度スロットを振り、親は子スロットの中間値を取る
    // (Reingold-Tilford 風の単純な整列)。総葉数で割って [0,1) → 扇の角度へ写す。
    const assign = (id, d) => {
      depth[id] = d;
      const kids = childOf[id] || [];
      if (kids.length === 0) { slot[id] = leafCounter; leafCounter += 1; return [slot[id], slot[id]]; }
      let lo = Infinity, hi = -Infinity;
      kids.forEach((k) => { const [klo, khi] = assign(k, d + 1); lo = Math.min(lo, klo); hi = Math.max(hi, khi); });
      slot[id] = (lo + hi) / 2;
      return [lo, hi];
    };
    roots.forEach((r) => assign(r, 0));
    const total = Math.max(leafCounter, 1);
    let maxR = 0;
    list.forEach((s) => {
      const t = total <= 1 ? 0.5 : (slot[s.id] + 0.5) / total;
      const angle = baseAngle - SK_ARC / 2 + t * SK_ARC;
      const r = SK_RING_BASE + depth[s.id] * SK_RING_GAP;
      const rad = (angle * Math.PI) / 180;
      pos[s.id] = { x: Math.cos(rad) * r, y: Math.sin(rad) * r, angle, depth: depth[s.id], r, cat };
      maxR = Math.max(maxR, r);
    });
    catMaxR[cat] = maxR;
  });
  const maxRadius = Math.max(...Object.values(catMaxR), SK_RING_BASE);
  return { pos, parentOf, catMaxR, maxRadius };
}
const SKILL_LAYOUT = buildSkillLayout();

// effect.type の合計値(filter で element などを絞る)
function skillEffectTotal(skills, type, filter) {
  let sum = 0;
  for (const s of SKILL_TREE) {
    if (!skills?.[s.id] || !s.effect || s.effect.type !== type) continue;
    if (filter && !filter(s.effect)) continue;
    sum += s.effect.value || 0;
  }
  return sum;
}
const skillHas = (skills, type) => skillEffectTotal(skills, type) > 0;
// 構造的効果を集計。{ bag, relicFloor, carryBonus, crewSlots, start:[itemId...] }
function skillStructural(skills) {
  const out = { bag: 0, relicFloor: 0, carryBonus: 0, crewSlots: 0, storageBonus: 0, start: [] };
  for (const s of SKILL_TREE) {
    if (!skills?.[s.id] || !s.struct) continue;
    if (s.struct.bag) out.bag += s.struct.bag;
    if (s.struct.relicFloor) out.relicFloor = Math.max(out.relicFloor, s.struct.relicFloor);
    if (s.struct.carryBonus) out.carryBonus += s.struct.carryBonus;
    if (s.struct.crewSlots) out.crewSlots += s.struct.crewSlots;
    if (s.struct.storageBonus) out.storageBonus += s.struct.storageBonus;
    if (s.struct.start) out.start.push(s.struct.start);
  }
  return out;
}
// 船内ストレージ(meta.carried)の総容量。種類を問わない共通プールとして1つの数で数える。
const storageCapOf = (meta) => (meta?.storageCap || 50) + skillStructural(meta?.skills).storageBonus;
// 編成枠(基本3人・スキルツリーで最大8人まで拡張)
const PARTY_BASE = 3, PARTY_MAX = 8;
const partyCap = (skills) => Math.min(PARTY_MAX, PARTY_BASE + skillStructural(skills).crewSlots);
// スキルツリー再設計時、失効スキルの分だけ残響片を全額還元する
// 世代2の再設計で廃止されたスキルの「当時のコスト」。migrateSkillTree の全額還元に使う。
// 現在の SKILL_TREE には既に存在しないため、還元額を正しく計算するにはここに残しておく必要がある。
const LEGACY_SKILL_COST = {
  // 回収の余裕 IX〜XX(20段階版で存在した上位ティア。8段階版への縮小で廃止)
  carryFloor9: 56, carryFloor10: 64, carryFloor11: 72, carryFloor12: 81, carryFloor13: 90,
  carryFloor14: 100, carryFloor15: 110, carryFloor16: 121, carryFloor17: 132, carryFloor18: 144,
  carryFloor19: 156, carryFloor20: 169,
};
function migrateSkillTree(meta) {
  if ((meta.skillTreeGen || 1) >= SKILLTREE_GEN) return { ...meta, skillTreeGen: SKILLTREE_GEN };
  const owned = Object.keys(meta.skills || {}).filter((id) => meta.skills[id]);
  const orphan = owned.filter((id) => !SKILL_BY_ID[id]);
  if (orphan.length === 0) return { ...meta, skillTreeGen: SKILLTREE_GEN };
  // 廃止時点で実際に支払っていたコストを全額還元する(一律の少額還元だと、高コストだった
  // 上位ティアを購入済みのプレイヤーだけ大きく損をしてしまう)。記録が無い未知のIDは
  // 念のため安全側の少額(6)にフォールバックする。
  const refund = orphan.reduce((sum, id) => sum + (LEGACY_SKILL_COST[id] ?? 6), 0);
  const skills = { ...meta.skills };
  orphan.forEach((id) => { delete skills[id]; });
  return { ...meta, skills, shards: (meta.shards || 0) + refund, skillTreeGen: SKILLTREE_GEN, skillRefund: refund };
}

// 名簿(meta.roster)と永久レベル(meta.crewLevels)を、旧「type:rarity」キー形式から
// 現行の「type」単独キー形式へ変換する。以前は名簿がレアリティ別の枠(最大8×5=40枠)を
// 持っていたが、実際のクルー絵は職種ごとに1種類しか無いためレアリティ枠を廃止した。
// この変換をしないと、旧セーブの "harpoon:elite" のようなキーが現行コードの
// CREW_TYPES[type] 判定に一致せず、名簿・強化画面から静かに消えてしまう
// (プレイヤーには「所持していたクルーが消えた」ように見える不具合になる)。
// 同じ職種で複数レアリティ枠のレベルを持っていた場合は、その中で最も高いレベルを採用する
// (合算すると水増しになり、切り捨てると損失になるため)。何度実行しても安全(冪等)。
function migrateCrewRoster(meta) {
  const roster = meta.roster || [];
  const crewLevels = meta.crewLevels || {};
  const newRoster = [];
  const seen = new Set();
  for (const r of roster) {
    const type = typeof r === "string" ? r.split(":")[0] : r;
    if (CREW_TYPES[type] && !seen.has(type)) { seen.add(type); newRoster.push(type); }
  }
  const newCrewLevels = {};
  for (const [key, level] of Object.entries(crewLevels)) {
    const type = key.split(":")[0];
    if (!CREW_TYPES[type]) continue;
    newCrewLevels[type] = Math.max(newCrewLevels[type] || 0, level || 0);
  }
  return { ...meta, roster: newRoster, crewLevels: newCrewLevels };
}

/* ------------------------------------------------------------
   永続データ
------------------------------------------------------------ */
const SAVE_KEY = "deep-sea-dungeon-save-v1";
const GAME_KEY = "deep-sea-dungeon-game-v1";
// スキルツリーを再設計(回収の余裕を20段→8段に縮小、primeSkillの移動、被弾軽減II/救難感度II
// の追加など)したため世代を1つ進める。migrateSkillTree() が旧世代で購入済みだった
// 廃止スキル(carryFloor9〜20 等)分の残響片を自動で全額還元する。
const SKILLTREE_GEN = 2;
// デバッグ端末(native が document 生成前に注入 / URL に ?debug でも可)
const DEBUG = (typeof window !== "undefined" &&
  (window.__IS_DEBUG__ === true || /[?&]debug\b/.test(window.location?.search || "")));
const DEFAULT_META = {
  roster: [],
  // 初期の遺物枠は1(スキル「遺物の常備」で3まで拡張)。序盤から遺物を複数運用できると
  // 難易度が遺物ガチャ次第になりすぎるため、最初は控えめにしてある。
  // 既存セーブは loadMeta() の {...DEFAULT_META, ...saved} マージで保存済みの値が
  // 優先されるため、この変更で既存プレイヤーの枠が遡って減ることはない。
  relicSlots: 1,
  carrySlots: 1,
  bonusHp: 0,
  dives: 0, deaths: 0, bestDepth: 1, clears: 0, checkpoint: 1,
  // 船内ストレージ(帰還・全滅時に持ち帰った物をまとめて保管する場所)の上限。
  // 潜航1回で実際に持ち出せる数(carryN/relicN、装備・消耗品と遺物で別枠)とは別物で、
  // こちらは1つの共通プールとして種類を問わず数える。スキルツリーで拡張できる。
  storageCap: 50,
  carried: [],
  // クルーの永続レベル。{ type: level } の形(名簿は職種のみ・全8種)。海域の初回クリアで
  // 自動的に少しずつ上がるほか、「強化」画面で持ち越した武器を消費して直接上げられる。
  crewLevels: {},
  scanned: {},
  // ── 観測記録(図鑑) ──
  seen: {},          // { [bookId]: true }  遭遇済み
  specimens: {},     // { [bookId]: n }     採取した標本の数
  zoneCompRewarded: {}, // { [zoneIdx]: true } 図鑑コンプ報酬の受領済み
  // ── スキルツリー ──
  shards: 0,         // 残響片
  skills: {},        // { [skillId]: true }
  skillTreeGen: SKILLTREE_GEN,
  // ── アイテム保護 ──
  protectRare: true,
  protectHeals: false,
  // ── 広告(リワード共通・1日3回) ──
  rewardAd: null,    // { date, count }
};
async function loadMeta() {
  try {
    const s = localStorage.getItem(SAVE_KEY);
    if (s) {
      const parsed = JSON.parse(s);
      const migrated = migrateCrewRoster(migrateSkillTree({ ...DEFAULT_META, ...parsed }));
      // migrateSkillTree(廃止スキルの削除・残響片の還元)/ migrateCrewRoster(名簿・
      // crewLevels の type:rarity → type 変換)の結果はここで確定させて保存する。保存せず
      // React state だけに乗せていると、変換された直後に他の操作を何もしないままアプリを
      // 終了した場合に変換結果が失われ、次回起動時にまた同じ旧形式から移行することになる
      // (crewLevels の Math.max マージは冪等だが、保存を怠ると毎回同じ変換をやり直す
      // 無駄が生じるだけでなく、旧形式のままの meta がどこかで再度書き込まれた場合に
      // 上書きされて消える窓ができてしまう)。
      const rosterChanged = JSON.stringify(migrated.roster) !== JSON.stringify(parsed.roster || []);
      const levelsChanged = JSON.stringify(migrated.crewLevels) !== JSON.stringify(parsed.crewLevels || {});
      if (migrated.skillTreeGen !== (parsed.skillTreeGen || 1) || rosterChanged || levelsChanged) {
        await saveMeta(migrated);
      }
      return migrated;
    }
  } catch (e) {}
  return { ...DEFAULT_META };
}
async function saveMeta(m) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(m)); } catch (e) {}
}

/* ------------------------------------------------------------
   リワード広告 — 枠(復活/2倍物資)ごとに独立した1日の回数上限。
   一般的な放置・カジュアル系アプリの目安(1枠あたり3〜6回、合計15〜20回/日)に合わせて
   1枠あたり1日6回とした(復活6+2倍物資6+インタースティシャル6=合計18回/日)。
   以前は復活・2倍物資が1つの共有プール(合計3回)で、枠ごとの回数としてはかなり少なかった。
------------------------------------------------------------ */
const REWARD_AD_DAILY_LIMIT = 6;
const rewardAdTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
const rewardAdUsesLeft = (meta, context) => {
  const ra = meta?.rewardAd;
  const count = ra && ra.date === rewardAdTodayKey() ? (ra.counts?.[context] || 0) : 0;
  return Math.max(0, REWARD_AD_DAILY_LIMIT - count);
};
const consumeRewardAdUse = (meta, context) => {
  const today = rewardAdTodayKey();
  const ra = meta?.rewardAd;
  const prevCounts = ra && ra.date === today ? (ra.counts || {}) : {};
  const counts = { ...prevCounts, [context]: (prevCounts[context] || 0) + 1 };
  return { ...meta, rewardAd: { date: today, counts } };
};
function saveGameState(g) {
  try {
    const slim = { ...g, floats: [], hitId: null, busy: false };
    localStorage.setItem(GAME_KEY, JSON.stringify(slim));
  } catch (e) {}
}
function loadGameState() {
  try {
    const s = localStorage.getItem(GAME_KEY);
    return s ? JSON.parse(s) : null;
  } catch (e) { return null; }
}
function clearGameState() {
  try { localStorage.removeItem(GAME_KEY); } catch (e) {}
}

/* ------------------------------------------------------------
   スタイル — 観測コンソール風HUD
   深藍 × 生体発光シアン × 等幅数値 (1作目の和風とは別系統)
------------------------------------------------------------ */
const CSS = `
:root {
  --abyss: #030711;
  --hull: rgba(10, 22, 36, .82);
  --hull-2: rgba(14, 30, 46, .9);
  --line: rgba(120, 190, 220, .18);
  --line-2: rgba(120, 190, 220, .34);
  --ink: #dff0f6;
  --ink-dim: #8fa9ba;
  --ink-dimmer: #869aa8;
  --cyan: #4fd6e8;
  --cyan-soft: rgba(79, 214, 232, .28);
  --amber: #ffd27f;
  --danger: #ff7b6b;
  --ok: #6fe0a8;
  --sk-party: #c58cff;
  --sk-blessing: #ff9ecb;
  --mono: 'Chivo Mono', ui-monospace, monospace;
  --sans: 'Zen Kaku Gothic New', system-ui, sans-serif;
  --display: 'Shippori Mincho', 'Zen Kaku Gothic New', serif;
  --tech: 'Orbitron', 'Chivo Mono', ui-monospace, monospace;
}
* { box-sizing: border-box; margin: 0; padding: 0;
    -webkit-user-select: none; user-select: none;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    /* タッチ操作前提のアプリなのでスクロールバーは常に非表示にする(実機では元々
       ほとんど出ないが、デスクトップブラウザでの確認時などに見た目を汚さないため)。
       スクロール自体(overflow:auto/scroll)は無効化しない。 */
    scrollbar-width: none; -ms-overflow-style: none; }
*::-webkit-scrollbar { display: none; width: 0; height: 0; }
img { -webkit-user-drag: none; pointer-events: none; }
button { font-family: inherit; touch-action: manipulation; }

html, body { height: 100%; overflow-x: hidden; background: var(--abyss); }

/* iPad 等の横幅が大きい画面では、スマホ向けの密度・ボタン配置をそのまま保ったまま
   中央に程よい幅で表示し、左右は演出用の余白にする(要素が間延びしたり、ボタンが
   画面端まで引き伸ばされて逆に押しにくくなるのを防ぐ)。 */
.sd-root {
  min-height: 100vh; width: 100%; max-width: 560px; margin: 0 auto;
  background: var(--abyss); color: var(--ink);
  font-family: var(--sans); position: relative; overflow-x: hidden;
  display: flex; flex-direction: column; align-items: center;
}
.sd-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.sd-bg svg, .sd-bg canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.sd-bg-photo { position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; object-position: center 30%; opacity: .92;
  filter: saturate(.92) brightness(.82); }
.sd-scan { position: fixed; inset: 0; z-index: 1; pointer-events: none;
  background: repeating-linear-gradient(180deg, rgba(120,190,220,.03) 0 1px, transparent 1px 3px);
  mix-blend-mode: screen; }
/* 気泡が画面下から立ちのぼる演出 */
.sd-bubbles { position: fixed; inset: 0; z-index: 1; pointer-events: none; overflow: hidden; }
.sd-bubble { position: absolute; bottom: -30px; border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, rgba(223,240,246,.85), rgba(79,214,232,.25) 55%, rgba(79,214,232,0) 78%);
  box-shadow: inset 0 0 4px rgba(255,255,255,.5);
  animation-name: sdBubbleRise; animation-timing-function: ease-out; animation-iteration-count: infinite; }
.sd-bubble.img { background-size: contain; background-repeat: no-repeat; background-position: center; box-shadow: none; }
/* 経由点を作らず0%→100%を単一区間にすることで、途中(画面中央付近)で
   減速→再加速するような不自然な引っ掛かりを無くす。ease-out なので
   減速そのものは終盤(画面上部・水面に近づく所)でだけ自然に起こる。
   また下端での滞留(不透明度0のまま留まる時間)も短くして「泡だまり」に見えないようにする。 */
@keyframes sdBubbleRise {
  0%   { transform: translate(0, 0) scale(.7); opacity: 0; }
  4%   { opacity: .8; }
  85%  { opacity: .6; }
  100% { transform: translate(var(--drift), -108vh) scale(1.1); opacity: 0; }
}
/* 深度上昇の瞬間だけ、数秒間ぼこぼこっと溢れるバースト気泡(1回限りで消える) */
.sd-bubble.burst { animation-name: sdBubbleBurst; animation-timing-function: ease-out; animation-iteration-count: 1; }
@keyframes sdBubbleBurst {
  0%   { transform: translate(0, 0) scale(.5); opacity: 0; }
  6%   { opacity: 1; }
  82%  { opacity: .7; }
  100% { transform: translate(var(--drift), -112vh) scale(1.15); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) { .sd-bubbles { display: none; } }
.sd-vig { position: fixed; inset: 0; z-index: 1; pointer-events: none;
  background: radial-gradient(ellipse 88% 66% at 50% 40%, transparent 42%, rgba(1,3,8,.72) 100%); }
/* 深度が変わった瞬間だけ画面中央に約2秒出す「100m → 200m」表示。
   薄いグラデーションのガラス板のようなスタイリッシュな見た目にする。 */
.sd-depth-notice { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(.9);
  z-index: 25; pointer-events: none; display: flex; align-items: center; gap: 12px;
  font-family: var(--tech); font-size: 22px; font-weight: 600; letter-spacing: .12em;
  padding: 14px 28px; border-radius: 18px;
  background: linear-gradient(135deg, rgba(79,214,232,.14), rgba(197,140,255,.12));
  box-shadow: 0 0 0 1px rgba(223,240,246,.22), 0 10px 44px rgba(79,214,232,.16), 0 0 70px rgba(197,140,255,.14);
  backdrop-filter: blur(8px) saturate(1.4); -webkit-backdrop-filter: blur(8px) saturate(1.4);
  opacity: 0; animation: sdDepthNotice 2s cubic-bezier(.16,.8,.3,1) forwards; }
.sd-depth-notice .val { background: linear-gradient(135deg, #dff0f6, #4fd6e8 55%, #c58cff);
  -webkit-background-clip: text; background-clip: text; color: transparent; }
.sd-depth-notice .arrow { color: rgba(223,240,246,.5); font-size: .78em; }
@keyframes sdDepthNotice {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(.90); }
  10%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  82%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.035); }
}

.sd-stage { position: relative; z-index: 2; width: 100%; max-width: 560px;
  min-height: 100vh; display: flex; flex-direction: column;
  /* Dynamic Island / ノッチを避けるため safe-area-inset-top を使用 */
  padding: calc(env(safe-area-inset-top, 0px) + 6px) 10px 14px; }

/* 潜航画面は画面全体をスクロールさせず、スクロールは敵領域(.sd-field)の中だけに閉じ込める */
.sd-root-dive { height: 100dvh; overflow: hidden; }
.sd-root-dive .sd-stage { min-height: 0; height: 100dvh; padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 10px + 84px); }
.sd-root-dive .sd-field { flex: 1 1 0; min-height: 0; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; }
/* 行動ボタン(攻撃・技・収納)を、クルー一覧のすぐ下・ログより上に置く。
   マークアップの並びは変えず、表示順序だけを flex order で入れ替える。
   技ボタンを押した後は敵をタップして対象を選ぶ必要があるため、行動ボタンは
   画面最下部(ログの下)ではなく敵表示に近い位置に置き、ボタン→対象選択の
   移動距離を短くする(ログは読むだけで操作は要らないので最下部でよい)。 */
.sd-root-dive .sd-stage > .sd-field { order: 1; }
.sd-root-dive .sd-stage > .sd-crew { order: 2; }
.sd-root-dive .sd-stage > .sd-acts { order: 3; margin-top: 6px; }
.sd-root-dive .sd-stage > .sd-log { order: 4; }

/* ── 上部テレメトリ ── */
.sd-tele { display: flex; align-items: center; gap: 8px; padding: 8px 12px; margin-bottom: 10px;
  border: 1px solid var(--line); border-radius: 14px; background: var(--hull);
  font-family: var(--mono); font-size: 11px; letter-spacing: .06em; color: var(--ink-dim);
  flex-wrap: wrap; }
.sd-tele .sd-zone { color: var(--cyan); font-weight: 700; letter-spacing: .1em; font-family: var(--tech); }
.sd-tele .sd-depth { color: var(--ink); font-size: 14px; font-weight: 600; font-family: var(--tech); }
.sd-tele .sd-sep { width: 1px; height: 14px; background: var(--line); flex-shrink: 0; }
/* 潜航画面のテレメトリ行だけ: 左=進捗(見るだけで操作は不要)、中央=海域名+深度
   (今どこで・どれだけ深いか、一番見る頻度が高い情報)、右=設定(滅多に押さないので
   上部でも支障がない)の3カラムにする。配置の意図がそのまま並び順の理由になるよう
   固定する。 */
.sd-tele.sd-tele-3col { display: grid; grid-template-columns: 1fr auto 1fr; flex-wrap: nowrap; }
.sd-tele-l { justify-self: start; display: flex; align-items: center; gap: 8px; min-width: 0; overflow: hidden; }
.sd-tele-c { justify-self: center; display: flex; align-items: baseline; gap: 8px; white-space: nowrap; }
.sd-tele-r { justify-self: end; }
.sd-tele-settings { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px;
  border: 1px solid var(--line-2); border-radius: 8px; background: rgba(120,190,220,.08); color: var(--ink-dim);
  cursor: pointer; flex-shrink: 0; }
.sd-tele-settings:active { border-color: var(--cyan); color: var(--cyan); }
.sd-tele-settings.on { border-color: var(--cyan); color: var(--cyan); }
.sd-nodes { display: flex; gap: 5px; align-items: center; }
.sd-nd { width: 14px; height: 4px; background: rgba(120,190,220,.2); border-radius: 3px; }
.sd-nd.done { background: var(--cyan); box-shadow: 0 0 6px var(--cyan-soft); }
.sd-nd.now { background: var(--amber); box-shadow: 0 0 8px rgba(255,210,127,.5); }

/* ── 深度ゲージ(左端) ── */
.sd-gauge { position: fixed; left: 6px; top: 50%; transform: translateY(-50%); z-index: 3;
  width: 20px; height: 40vh; border-left: 1px solid var(--line);
  display: flex; flex-direction: column; justify-content: space-between; padding: 2px 0; }
.sd-gauge span { font-family: var(--mono); font-size: 7px; color: var(--ink-dimmer);
  letter-spacing: .04em; padding-left: 4px; }
.sd-gauge .sd-cursor { position: absolute; left: -3px; width: 6px; height: 6px;
  background: var(--amber); box-shadow: 0 0 8px rgba(255,210,127,.7); transition: top .5s ease; }

/* ── 敵スキャン領域 ── */
.sd-field { display: flex; align-items: center; align-content: center; justify-content: center;
  gap: 10px; flex-wrap: wrap; padding: 10px 0 10px; min-height: 160px; flex: 1; position: relative; }

/* ── ボス戦シネマ表示(大きく見せつつ、ログ等を圧迫しないようレイアウト予約は控えめに。
   画像自体はそれより大きく置き、入り切らない分は overflow:hidden で下側だけ見切れさせる) ── */
.sd-field.hasboss { align-items: flex-end; align-content: flex-end; padding-top: 40vh; padding-bottom: 8px; }
.sd-boss-cinema { position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
  width: 100vw; height: 50vh; z-index: 0; pointer-events: none;
  display: flex; align-items: flex-start; justify-content: center; overflow: hidden; }
.sd-boss-cinema img { height: 100%; width: auto; max-width: 150%; object-fit: contain; display: block;
  filter: drop-shadow(0 12px 46px rgba(0,0,0,.72)) drop-shadow(0 0 34px rgba(255,210,127,.16));
  animation: sdBossBreath 6.5s ease-in-out infinite; }
@keyframes sdBossBreath { 0%,100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.045) translateY(6px); } }
/* HPバー等の情報カードは常にボス画像より手前(裏に隠れない)に出す */
.sd-enemy.boss.cinema { width: 300px; margin-top: 0; background: rgba(6,16,22,.72); backdrop-filter: blur(3px);
  position: relative; z-index: 1; }
.sd-enemy.boss.cinema .sd-eicon { display: none; }
@media (max-width: 560px) {
  .sd-boss-cinema { height: 44vh; }
  .sd-field.hasboss { padding-top: 34vh; }
  .sd-enemy.boss.cinema { width: 88vw; }
}
.sd-enemy { position: relative; width: 150px; padding: 8px 6px 10px; text-align: center;
  border: 1px solid var(--line); background: var(--hull); cursor: default; border-radius: 16px;
  overflow: visible;
  transition: border-color .16s ease, transform .16s ease, box-shadow .16s ease; }
.sd-enemy.aim { cursor: crosshair; }
.sd-enemy.aim:hover { border-color: var(--amber); transform: translateY(-2px);
  box-shadow: 0 0 0 1px var(--amber), 0 8px 20px rgba(0,0,0,.5); }
.sd-enemy.good { border-color: var(--amber); box-shadow: 0 0 14px rgba(255,210,127,.28); }
.sd-enemy.good::before, .sd-enemy.good::after { border-color: var(--amber); }
.sd-enemy.dead { opacity: 0; transform: scale(.86); pointer-events: none; transition: all .45s ease; }
.sd-enemy.anom { border-color: var(--amber); box-shadow: 0 0 20px rgba(255,210,127,.34); }
.sd-enemy.boss { width: 220px; }
.sd-enemy.hit { animation: sdJolt .3s ease; }
@keyframes sdJolt { 0%,100% { transform: translateX(0); } 30% { transform: translateX(-5px); } 70% { transform: translateX(4px); } }
.sd-eicon { display: inline-flex; padding: 0; margin-bottom: 2px; margin-top: -14px;
  overflow: visible; }
.sd-eicon img { filter: drop-shadow(0 3px 10px rgba(0,0,0,.6)); }
.sd-ename { font-size: 11.5px; font-weight: 700; letter-spacing: .03em; }
.sd-enemy.anom .sd-ename, .sd-enemy.boss .sd-ename { color: var(--amber); }
.sd-bar { height: 5px; background: rgba(0,0,0,.55); margin-top: 6px; overflow: hidden; border-radius: 4px; }
.sd-bar i { display: block; height: 100%; background: var(--cyan); transition: width .3s ease; border-radius: 4px; }
.sd-bar.boss i { background: linear-gradient(90deg, var(--danger), var(--amber)); }
.sd-hpnum { font-family: var(--mono); font-size: 9px; color: var(--ink-dimmer); margin-top: 3px; letter-spacing: .05em; }
/* height を固定(min-height ではなく)し overflow:hidden にすることで、弱点/耐性/状態異常
   タグがどれだけ増えても(ボスなど)カードの高さが絶対に変わらないようにする。4個を超える分は
   EnemyCard 側で数秒おきに切り替えて表示する(ページング)ので、情報自体は失われない。 */
.sd-tags { display: flex; justify-content: center; align-content: flex-start;
  gap: 3px; margin-top: 5px; flex-wrap: wrap; height: 40px; overflow: hidden; position: relative; }
.sd-tag { font-family: var(--mono); font-size: 8.5px; padding: 2px 6px; letter-spacing: .05em; border: 1px solid; border-radius: 6px; }
.sd-tag.w { color: var(--amber); border-color: rgba(255,210,127,.45); }
.sd-tag.r { color: var(--ink-dimmer); border-color: rgba(120,190,220,.22); }
.sd-tag.q { color: var(--ink-dim); border-color: rgba(120,190,220,.22); border-style: dashed; }
.sd-tag.st { color: var(--danger); border-color: rgba(255,123,107,.4); }
.sd-tag-page { position: absolute; right: 0; bottom: 0; font-family: var(--mono); font-size: 7.5px;
  color: var(--ink-dimmer); letter-spacing: .05em; }

/* 浮遊ダメージ */
.sd-float { position: absolute; left: 50%; top: 4%; transform: translateX(-50%);
  font-family: var(--mono); font-weight: 600; pointer-events: none; z-index: 6;
  animation: sdRise .95s ease forwards; white-space: nowrap; text-shadow: 0 2px 8px rgba(0,0,0,.8); }
@keyframes sdRise { 0% { opacity: 0; transform: translate(-50%, 6px) scale(.85); }
  20% { opacity: 1; transform: translate(-50%, -3px) scale(1.1); }
  100% { opacity: 0; transform: translate(-50%, -38px) scale(1); } }

/* ── クルー3枠 ── */
.sd-crew { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.sd-cc { position: relative; padding: 8px 10px; border: 1px solid var(--line);
  background: var(--hull); text-align: left; transition: border-color .16s ease, box-shadow .16s ease; }
.sd-cc.active { border-color: var(--cyan); box-shadow: 0 0 0 1px var(--cyan-soft), 0 0 16px rgba(79,214,232,.16); }
.sd-cc.down { opacity: .42; }
.sd-cc.acted { opacity: .58; }
.sd-cc .sd-cname { font-size: 11.5px; font-weight: 700; margin: 2px 0 1px; line-height: 1.25; }
.sd-cc .sd-crole { font-family: var(--mono); font-size: 8.5px; color: var(--ink-dim); letter-spacing: .04em; }
.sd-cc .sd-chp { font-family: var(--mono); font-size: 9px; color: var(--ink-dim); margin-top: 4px; letter-spacing: .04em; }
.sd-cbar { height: 5px; background: rgba(0,0,0,.5); margin-top: 3px; overflow: hidden; border-radius: 4px; }
.sd-cbar i { display: block; height: 100%; background: var(--ok); transition: width .3s ease; border-radius: 4px; }
.sd-cbar.low i { background: var(--danger); }
.sd-badge { position: absolute; top: 7px; right: 8px; font-family: var(--mono); font-size: 8px;
  letter-spacing: .06em; color: var(--ink-dimmer); }
.sd-badge.cd { color: var(--amber); }
.sd-chip { display: inline-block; font-family: var(--mono); font-size: 8px; padding: 0 5px;
  border: 1px solid var(--line-2); border-radius: 5px; color: var(--ink-dim); margin-right: 2px; letter-spacing: .05em; }

/* ── 行動バー ── */
.sd-acts { display: flex; flex-direction: column; gap: 5px; margin-top: 5px; }
.sd-acts-sub { display: flex; align-items: center; gap: 8px; min-height: 32px; }
.sd-acts-main { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.sd-btn { font-family: var(--sans); font-size: 12px; font-weight: 700; letter-spacing: .08em;
  cursor: pointer; background: transparent; color: var(--ink);
  border: 1px solid var(--line-2); padding: 10px 16px; transition: all .16s ease;
  min-height: 44px; border-radius: 12px; }
.sd-btn:active:not(:disabled) { border-color: var(--cyan); color: var(--cyan); }
.sd-btn.pri { background: var(--cyan); border-color: var(--cyan); color: #04121a; }
.sd-btn.pri:active { background: #6fe3f2; color: #04121a; }
.sd-btn.amber { border-color: var(--amber); color: var(--amber); }
.sd-btn.amber:active { background: rgba(255,210,127,.14); }
.sd-btn.on { border-color: var(--amber); color: var(--amber); background: rgba(255,210,127,.14); }
.sd-btn.sm { padding: 7px 11px; font-size: 10.5px; letter-spacing: .05em; min-height: 36px; }
.sd-btn:disabled { opacity: .32; cursor: default; box-shadow: none; }
/* 大ボタン: 攻撃・スキル用 */
.sd-btn-lg { min-height: 56px; padding: 8px 6px; font-size: 15px; letter-spacing: .12em;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; width: 100%; }
.sd-btn-lg-sub { font-size: 9px; font-weight: 400; letter-spacing: .05em; opacity: 0.65; font-family: var(--mono); }
/* 照準中(対象選択中)のボタンを強調 — 押せば今の照準を破棄してもう一方へすり替わる */
.sd-btn-lg.aiming { border-color: var(--amber); box-shadow: 0 0 0 1px var(--amber), 0 0 14px rgba(255,210,127,.28); }
.sd-prompt { font-family: var(--mono); font-size: 11px; color: var(--amber); letter-spacing: .06em; }

/* ── ログ ── */
.sd-log { margin-top: 8px; padding: 7px 12px; border: 1px solid var(--line); background: var(--hull);
  font-family: var(--mono); font-size: 10.5px; color: var(--ink-dim); line-height: 1.8;
  min-height: 58px; max-height: 96px; overflow-y: auto; -webkit-overflow-scrolling: touch;
  display: flex; flex-direction: column; border-radius: 12px; }
.sd-log b { color: var(--cyan); font-weight: 600; }
.sd-log .cur { color: var(--ink); }

/* ── オーバーレイ ── */
.sd-ov { position: fixed; inset: 0; z-index: 30; display: flex; align-items: flex-start; justify-content: center;
  background: rgba(2,5,12,.88); backdrop-filter: blur(4px); overflow-y: auto;
  padding: calc(env(safe-area-inset-top, 0px) + 12px) 12px calc(env(safe-area-inset-bottom, 0px) + 16px);
  animation: sdFade .3s ease; }
/* sd-fs-root(装備・スキルツリー等の全画面パネル)は z-index:60。その中から開く
   確認・選択ポップアップ(装着先選択・回復対象選択・破棄確認 等)は必ずそれより
   手前に出す必要があるため、.top は60を超える値にする(以前50のままだった時、
   装備画面から開く「誰に装着するか選ぶ」ポップアップが装備画面の後ろに隠れて
   見えなくなる不具合があった)。 */
.sd-ov.top { z-index: 70; }
.sd-ov-inner { display: flex; align-items: flex-start; justify-content: center;
  width: 100%; margin: auto 0; }
@keyframes sdFade { from { opacity: 0; } to { opacity: 1; } }
.sd-sheet { width: 100%; max-width: 680px; padding: 20px 18px 16px;
  border: 1px solid var(--line-2); background: linear-gradient(180deg, var(--hull-2), var(--hull));
  border-radius: 22px; }
/* 収納シートは外枠を固定し、中身だけスクロール */
.sd-ov-scroll { overflow: hidden; align-items: center; }
.sd-ov-scroll .sd-ov-inner { max-height: 100%; }
.sd-sheet-scroll { max-height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 28px);
  overflow-y: auto; -webkit-overflow-scrolling: touch; }
/* スクロールするポップアップの見出し行(タイトル・バツボタン)を、スクロールしても
   常に上部に留める。sticky はスクロールする祖先要素(.sd-sheet-scroll、または
   ヘッダーごと親の .sd-ov がスクロールする場合はその内側)に対して効く。
   sd-sheet の余白をはみ出して端まで塗るため負のマージンで打ち消し、
   スクロールしてきた本文がヘッダーの下に隠れて見えないよう背景も不透明にする。 */
.sd-sheet-head { position: sticky; top: 0; z-index: 2; margin: -20px -18px 12px;
  padding: 20px 18px 10px; background: var(--hull-2); border-radius: 22px 22px 0 0;
  border-bottom: 1px solid var(--line); }
.sd-sheet h2 { font-family: var(--display); font-weight: 700; font-size: 17px; letter-spacing: .16em; color: var(--cyan); }
.sd-sheet .sd-sub { color: var(--ink-dim); font-size: 12px; margin: 7px 0 14px; line-height: 1.85; }
.sd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 7px; }
.sd-cell { padding: 10px; border: 1px solid var(--line); background: rgba(6,14,24,.7);
  text-align: left; cursor: pointer; position: relative; color: var(--ink); width: 100%;
  transition: border-color .15s ease, box-shadow .15s ease; border-radius: 14px;
  display: flex; flex-direction: column; }
.sd-cell:active { border-color: var(--line-2); }
.sd-cell.on { border-color: var(--amber); box-shadow: 0 0 0 1px rgba(255,210,127,.4); }
.sd-cell .sd-nm { font-size: 12px; font-weight: 700; margin: 4px 0 2px; line-height: 1.35; }
.sd-cell .sd-mt { font-family: var(--mono); font-size: 9.5px; color: var(--ink-dim); line-height: 1.6; min-height: 30px; }
.sd-cell .sd-hint { font-family: var(--mono); font-size: 9px; margin-top: 3px; }
.sd-cell .sd-act { font-family: var(--mono); font-size: 9px; color: var(--cyan); margin-top: auto; padding-top: 6px; letter-spacing: .07em; }
.sd-rar { font-size: 12px; font-weight: 800; letter-spacing: .02em; line-height: 1;
  display: inline-block; padding: 3px 7px; border-radius: 6px; white-space: nowrap;
  border: 1px solid rgba(4,18,26,.55); text-shadow: 0 1px 0 rgba(255,255,255,.25); }
.sd-rows { display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px; flex-wrap: wrap; }
/* 本体をスクロールさせつつ、決定ボタンの行だけ画面下部に固定表示するための汎用クラス
   (出航編成など、一覧が長くなりがちな画面で「潜航する」等の決定ボタンを毎回スクロール
   せず押せるようにする)。 */
.sd-scroll-body { flex: 1 1 0; min-height: 0; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; }
.sd-fixed-footer { flex-shrink: 0; padding: 0 2px calc(env(safe-area-inset-bottom,0px) + 14px);
  background: linear-gradient(180deg, transparent, var(--abyss) 30%); }
.sd-note { font-family: var(--mono); font-size: 10.5px; color: var(--danger);
  border: 1px solid rgba(255,123,107,.35); padding: 7px 11px; margin-top: 10px; line-height: 1.6;
  border-radius: 10px; }
.sd-hr { height: 1px; background: var(--line); margin: 12px 0; }
.sd-lab { font-family: var(--mono); font-size: 9.5px; color: var(--ink-dimmer);
  letter-spacing: .14em; margin: 10px 0 7px; border-left: 2px solid var(--line-2); padding-left: 6px; }

/* ── タイトル ── */
.sd-title { position: relative; z-index: 2; min-height: 100vh; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 14px; text-align: center; padding: 20px; }
.sd-title h1 { font-family: var(--mono); font-weight: 300; font-size: clamp(32px, 8vw, 72px);
  letter-spacing: .28em; text-indent: .28em; color: var(--ink);
  text-shadow: 0 0 50px rgba(79,214,232,.32); line-height: 1.1; }
.sd-title .sd-en { font-family: var(--display); font-weight: 700; font-size: 15px; letter-spacing: .5em;
  text-indent: .5em; color: var(--cyan); }
.sd-title .sd-lead { color: var(--ink-dim); font-size: 12px; line-height: 2.0; }
.sd-title .sd-stat { font-family: var(--mono); font-size: 10.5px; color: var(--ink-dimmer); letter-spacing: .07em; line-height: 1.9; }

/* ── 案内 ── */
.sd-coach { position: fixed; left: 12px; right: 12px; bottom: 16px; z-index: 40;
  max-width: 520px; margin: 0 auto; padding: 12px 15px;
  border: 1px solid var(--line-2); background: var(--hull-2); animation: sdFade .35s ease;
  border-radius: 16px; }
.sd-coach h4 { font-family: var(--mono); font-size: 11px; letter-spacing: .14em; color: var(--cyan); margin-bottom: 5px; }
.sd-coach p { font-size: 11.5px; color: var(--ink-dim); line-height: 1.8; }

/* ── エンディング ── */
.sd-credits { max-height: 44vh; overflow: hidden; position: relative; margin: 12px 0; }
.sd-credits-in { animation: sdScroll 44s linear forwards; line-height: 2.5; font-size: 12px; color: var(--ink-dim); }
.sd-credits-in h3 { font-family: var(--mono); color: var(--cyan); letter-spacing: .28em; margin: 22px 0 6px; font-weight: 400; font-size: 12.5px; }
@keyframes sdScroll { from { transform: translateY(44vh); } to { transform: translateY(-100%); } }

/* ── ゾーン選択 ── */
.sd-zone-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin: 10px 0; }
.sd-zone-cell { position: relative; overflow: hidden; padding: 16px 10px 12px; min-height: 118px;
  border: 1px solid var(--line); background: var(--hull); display: flex; flex-direction: column;
  align-items: center; justify-content: flex-end; gap: 1px;
  text-align: center; cursor: pointer; transition: all .16s ease; border-radius: 14px; }
.sd-zone-cell .zc-bg { position: absolute; inset: 0; z-index: 0; width: 100%; height: 100%;
  object-fit: cover; opacity: .55; }
.sd-zone-cell::after { content: ""; position: absolute; inset: 0; z-index: 1;
  background: linear-gradient(180deg, rgba(3,7,17,.15) 0%, rgba(3,7,17,.55) 55%, rgba(3,7,17,.9) 100%); }
.sd-zone-cell > * { position: relative; z-index: 2; }
.sd-zone-cell.locked { cursor: default; }
.sd-zone-cell.locked .zc-bg { opacity: .14; filter: grayscale(1); }
.sd-zone-cell.locked::after { background: rgba(3,7,17,.72); }
.sd-zone-cell:not(.locked):active { border-color: var(--cyan); transform: scale(.98); }
.sd-zone-cell .zc-en { font-family: var(--mono); font-size: 8.5px; color: var(--ink-dim); letter-spacing: .12em;
  text-shadow: 0 1px 3px rgba(0,0,0,.9); }
.sd-zone-cell .zc-name { font-size: 13px; font-weight: 800; margin: 3px 0 1px; text-shadow: 0 1px 4px rgba(0,0,0,.9); }
.sd-zone-cell .zc-depth { font-family: var(--mono); font-size: 9px; color: var(--ink); opacity: .85; text-shadow: 0 1px 3px rgba(0,0,0,.9); }
.sd-zone-cell .zc-lock { font-size: 20px; margin-bottom: 4px; }

@media (max-width: 480px) {
  .sd-gauge { display: none; }
  .sd-enemy { width: 110px; }
  .sd-enemy.boss { width: 160px; }
  .sd-cc .sd-cname { font-size: 10.5px; }
  .sd-cc .sd-crole { display: none; }
  .sd-tele .sd-sep { display: none; }
  .sd-title h1 { letter-spacing: .16em; text-indent: .16em; }
  .sd-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (prefers-reduced-motion: reduce) {
  .sd-credits-in { animation: none; }
}

/* ── コンパクトクルー行(縦4×横2 = 最大8人・スクロールなし) ── */
.sd-crew { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; }
@media (max-width: 380px) { .sd-crew { grid-template-columns: 1fr; } }
.sd-cr { display: flex; align-items: center; gap: 8px; padding: 6px 12px 6px 8px;
  border: 1px solid var(--line); background: var(--hull); min-height: 54px;
  border-radius: 14px; overflow: visible; cursor: pointer; }
.sd-cr.active { border-color: var(--cyan); box-shadow: 0 0 0 1px var(--cyan-soft); }
.sd-cr.down { opacity: .32; }
.sd-cr.acted { opacity: .48; }
.sd-cr.empty { justify-content: center; opacity: .22; }
.sd-crew.picking .sd-cr.pick { cursor: pointer; opacity: 1; border-color: var(--ok);
  box-shadow: 0 0 0 1px var(--ok), 0 0 14px rgba(111,224,168,.3); }
.sd-crew.picking .sd-cr.pick:active { transform: scale(.985); }
.sd-cr-icon { position: relative; display: flex; align-items: center; justify-content: center;
  width: 44px; height: 44px; flex-shrink: 0; overflow: visible; }
.sd-cr-icon img, .sd-eicon img { filter: drop-shadow(0 2px 6px rgba(0,0,0,.5)); }
.sd-rar-overlay { position: absolute; left: 50%; bottom: -5px; transform: translateX(-50%);
  font-size: 8px; padding: 1px 4px; border-radius: 5px; white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0,0,0,.55); z-index: 1; }
.sd-cr-mid { flex: 1; display: flex; flex-direction: column; gap: 3px; overflow: hidden; min-width: 0; }
.sd-cr-name { display: flex; align-items: baseline; gap: 6px; overflow: hidden; }
.sd-cr-nm { font-size: 12px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sd-wchip { flex-shrink: 0; font-family: var(--mono); font-size: 8.5px; font-weight: 700;
  padding: 1px 5px; border: 1px solid; border-radius: 5px; letter-spacing: .04em; }
.sd-cr-stat { display: flex; align-items: center; gap: 6px; }
.sd-cr-bar { flex: 1; height: 5px; background: rgba(0,0,0,.55); overflow: hidden; max-width: 90px; border-radius: 4px; }
.sd-cr-bar i { display: block; height: 100%; background: var(--ok); border-radius: 4px; }
.sd-cr-bar.low i { background: var(--danger); }
.sd-cr-hp { font-family: var(--mono); font-size: 8px; color: var(--ink-dimmer); white-space: nowrap; }
.sd-cr-cd { font-family: var(--mono); font-size: 8.5px; min-width: 30px; text-align: right; color: var(--ink-dimmer); }
.sd-cr-cd.cd { color: var(--amber); }
.sd-cr-cd.ok { color: var(--ok); }

/* ── スキルツールチップ ── */
/* 常に最前面(装備画面等の sd-fs-root=60、確認ポップアップの sd-ov.top=70 より上)に出す */
.sd-tip { position: fixed; inset: 0; z-index: 80; display: flex; align-items: flex-end;
  justify-content: center; padding: 0 12px 72px; background: rgba(2,5,12,.75);
  backdrop-filter: blur(3px); animation: sdFade .18s ease; }
.sd-tip-body { width: 100%; max-width: 520px; padding: 16px 18px 14px;
  border: 1px solid var(--line-2); background: var(--hull-2); border-radius: 20px; }
.sd-tip-name { font-family: var(--mono); font-size: 13px; letter-spacing: .16em;
  color: var(--amber); margin-bottom: 8px; }
.sd-tip-desc { font-size: 12px; color: var(--ink); line-height: 1.9; }
.sd-tip-tag { font-family: var(--mono); font-size: 9.5px; color: var(--cyan);
  letter-spacing: .1em; margin-top: 7px; }
.sd-tip-close { font-family: var(--mono); font-size: 9px; color: var(--ink-dimmer);
  margin-top: 11px; text-align: center; letter-spacing: .08em; }

/* ── ホームタブバー(タイトル画面下部に固定) ──
   以前は「観測記録・スキルツリー」がボタン列、設定だけ右上固定という別々の置き場だった。
   メイン/強化/スキル/図鑑/設定をすべて同格のタブとして画面最下部にまとめ、押しやすい
   位置に統一する。iPad 等の横幅が大きい画面でも sd-root と同じ中央寄せの幅に揃える。 */
.sd-hometabs { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 560px; z-index: 10; display: flex;
  border-top: 1px solid var(--line); background: rgba(3,7,17,.92); backdrop-filter: blur(6px);
  padding: 6px 4px calc(env(safe-area-inset-bottom,0px) + 6px); }
.sd-hometab { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
  font-family: var(--mono); font-size: 9.5px; letter-spacing: .04em; color: var(--ink-dimmer);
  background: transparent; border: none; padding: 6px 2px; cursor: pointer; position: relative; min-height: 48px; }
.sd-hometab.on { color: var(--cyan); }
.sd-hometab .sd-meta-badge { position: absolute; top: 2px; right: 18%; font-family: var(--mono); font-size: 8.5px; color: var(--amber); }
/* タブバー分、タイトル画面の下側コンテンツが隠れないよう余白を確保する */
.sd-title { padding-bottom: 84px; }

/* ── 図鑑(観測記録)── 海域一覧は「下へスクロールするほど深く沈んでいく」1本道にする。
   画像は縦長(3:4)のカードを縦に積んで scroll-snap で1枚ずつ止まるようにし、
   スクロール=潜降という体験そのものを選択UIにする。
   画像は不透明度を落とさずそのまま見せ、下端だけグラデーションで暗くして文字を読ませる
   (以前は画像全体を暗く透過させていたため、グレーの板のように見えてしまっていた)。 */
.sd-bst-descent { display: flex; flex-direction: column; gap: 12px; scroll-snap-type: y proximity; }
.sd-bst-zcard { position: relative; overflow: hidden; border: 1px solid var(--line); border-radius: 18px;
  aspect-ratio: 3 / 4; scroll-snap-align: start; cursor: pointer; text-align: left; color: var(--ink);
  display: flex; flex-direction: column; justify-content: flex-end; padding: 16px; background: var(--hull); }
.sd-bst-zcard .zc-bg { position: absolute; inset: 0; z-index: 0; width: 100%; height: 100%; object-fit: cover; }
.sd-bst-zcard::after { content: ""; position: absolute; inset: 0; z-index: 1;
  background: linear-gradient(180deg, rgba(3,7,17,0) 45%, rgba(3,7,17,.55) 75%, rgba(3,7,17,.92) 100%); }
.sd-bst-zcard > * { position: relative; z-index: 2; }
.sd-bst-zcard:active { border-color: var(--cyan); }
.sd-bst-zcard .zdepth { position: absolute; top: 12px; left: 14px; z-index: 2; font-family: var(--mono);
  font-size: 9.5px; color: var(--ink-dim); letter-spacing: .1em; text-shadow: 0 1px 3px rgba(0,0,0,.9); }
.sd-bst-zcard .zn { font-size: 16px; font-weight: 800; text-shadow: 0 1px 6px rgba(0,0,0,.9); }
.sd-bst-zcard .zp { font-family: var(--mono); font-size: 10px; color: var(--ink-dim); margin-top: 4px; text-shadow: 0 1px 4px rgba(0,0,0,.9); }
.sd-bst-zcard .zc { color: var(--amber); }
/* 海域を開いた後(一覧・詳細どちらも): その海域の背景画像をパネル全体に敷く。
   .sd-fs-root は position:fixed なので、その直下に inset:0 で1枚敷くだけで
   常にパネル全面を覆い、スクロールしても切れたりズレたりしない。
   凝った演出(グラデーション・ぼかし)は付けず、単純に透過させるだけにする
   (端末によっては backdrop-filter が正しく描画されず灰色の板になることがあるため使わない)。
   以前は画像の不透明度を強く落としていたため、写真がほぼ見えず灰色の板のように
   見えてしまっていた。文字が読める最低限の暗さに留め、写真自体ははっきり見せる。 */
.sd-fs-bg { position: absolute; inset: 0; z-index: 0; width: 100%; height: 100%;
  object-fit: cover; opacity: .55; pointer-events: none; }
.sd-bst-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 7px; }
.sd-bst-cell { padding: 9px 6px; border: 1px solid var(--line); background: rgba(6,14,24,.32);
  border-radius: 12px; text-align: center; cursor: pointer; }
.sd-bst-cell.unseen { opacity: .5; cursor: default; }
.sd-bst-cell.boss { border-color: rgba(255,210,127,.4); }
.sd-bst-cell .bn { font-size: 10px; font-weight: 700; margin-top: 5px; line-height: 1.3; text-shadow: 0 1px 3px rgba(0,0,0,.8); }
.sd-bst-icon { display: inline-flex; padding: 2px; }
/* 観測記録の詳細: 上部の大部分をモンスター画像にする「ヒーロー」表示。
   sd-fs-body の padding をはみ出して端まで塗る(sd-sheet-head と同じ負マージンの手法)。 */
.sd-bst-hero { position: relative; width: 100%; height: 190px; display: flex; align-items: center;
  justify-content: center; margin: 0 -16px 12px; overflow: hidden;
  background: radial-gradient(circle at 50% 38%, rgba(79,214,232,.16), transparent 68%), rgba(6,14,24,.28); }
.sd-bst-hero.rare { background: radial-gradient(circle at 50% 38%, rgba(255,210,127,.2), transparent 68%), rgba(6,14,24,.28); }
.sd-bst-hero img { max-height: 170px; }
.sd-bst-lore { font-size: 11.5px; color: var(--ink-dim); line-height: 1.85; margin: 8px 0; }
.sd-bst-lore.deep { color: var(--cyan); border-left: 2px solid var(--cyan-soft); padding-left: 8px; }
.sd-spec-dots { display: inline-flex; gap: 3px; margin-left: 6px; }
.sd-spec-dots i { width: 6px; height: 6px; border-radius: 50%; background: rgba(120,190,220,.25); display: block; }
.sd-spec-dots i.on { background: var(--amber); }

/* ── スキルツリー(円環) ── */
/* カテゴリタブ(.sd-sk-cats/.sd-sk-cat)は今は遊び方(HelpOverlay)専用。スキルツリー
   本体は下記の円環キャンバスに統合し、タブでの絞り込みは廃止した。 */
.sd-sk-cats { position: relative; z-index: 1; flex-shrink: 0; display: flex; gap: 12px;
  flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch;
  padding: 12px 16px; scroll-snap-type: x proximity; }
.sd-sk-cat { flex-shrink: 0; scroll-snap-align: start; font-family: var(--mono); font-size: 11.5px; font-weight: 700; letter-spacing: .1em;
  padding: 10px 18px; min-height: 38px; border: 1px solid var(--line-2); border-radius: 10px;
  color: var(--ink); background: rgba(120,190,220,.08); cursor: pointer; }
.sd-sk-cat.on { border-color: var(--cyan); color: #04121a; background: var(--cyan); font-weight: 800; }

/* 中心の核から各系統が枝分かれして広がる円環ツリー。キャンバスは常にビューポートいっぱいの
   絶対配置(inset:0)にしておき、子要素は「中心(50%)+ワールド座標px」で置く。パン/ズームは
   キャンバス全体への transform 一発で行うので、個々のノードの位置計算はワールド座標のまま
   でよい(コンテナの実サイズが分からないテスト環境でも崩れない)。 */
.sd-sktree-body { position: relative; overflow: hidden; padding: 0 !important; touch-action: none; }
.sd-sktree-viewport { position: absolute; inset: 0; overflow: hidden; touch-action: none; }
.sd-sktree-canvas { position: absolute; inset: 0; transform-origin: 50% 50%; will-change: transform; }
.sd-sktree-hub { position: absolute; left: 50%; top: 50%; width: 40px; height: 40px; margin: -20px 0 0 -20px;
  border-radius: 50%; border: 1px solid var(--line-2); background: radial-gradient(circle, rgba(79,214,232,.22), transparent 70%);
  display: flex; align-items: center; justify-content: center; color: var(--cyan); pointer-events: none; }
.sd-sktree-link { position: absolute; height: 2px; background: var(--line); transform-origin: 0 50%; pointer-events: none; }
.sd-sktree-link.owned { background: var(--cn, var(--cyan)); opacity: .55; height: 2.5px; }
.sd-sktree-link.buyable { background: var(--cn, var(--amber)); opacity: .4; }
.sd-sktree-catlabel { position: absolute; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 5px;
  font-family: var(--mono); font-size: 10.5px; font-weight: 700; letter-spacing: .08em; white-space: nowrap;
  padding: 5px 10px; border-radius: 999px; border: 1px solid currentColor; background: rgba(3,7,17,.72); pointer-events: none; opacity: .85; }
/* スキル1個 = アイコンのみの円ノード。名前や数値はここには出さず、タップした時だけ
   下の詳細パネルに表示する(「アイコンだけがずらっと円周上に並ぶ」という見た目の要望)。 */
.sd-sktree-node { position: absolute; width: 40px; height: 40px; margin: -20px 0 0 -20px;
  border-radius: 50%; border: 1.5px solid var(--cn, var(--line-2)); background: rgba(6,14,24,.82);
  color: var(--cn, var(--ink-dim)); display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: transform .12s ease; }
.sd-sktree-node.owned { background: color-mix(in srgb, var(--cn, var(--ok)) 22%, rgba(6,14,24,.82)); color: var(--cn, var(--ok)); }
.sd-sktree-node.buyable { box-shadow: 0 0 0 1px var(--cn, var(--amber)), 0 0 10px color-mix(in srgb, var(--cn, var(--amber)) 55%, transparent); }
.sd-sktree-node.locked { opacity: .38; }
.sd-sktree-node.sel { transform: scale(1.18); box-shadow: 0 0 0 2px var(--ink), 0 0 14px color-mix(in srgb, var(--cn, var(--cyan)) 70%, transparent); }
.sd-sktree-zoom { position: absolute; right: 10px; bottom: 10px; z-index: 2; display: flex; flex-direction: column; gap: 6px; }
.sd-sktree-zoom button { width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--line-2);
  background: rgba(6,14,24,.82); color: var(--ink); font-size: 15px; line-height: 1; cursor: pointer; }
.sd-sktree-hint { position: absolute; left: 10px; bottom: 10px; z-index: 2; font-family: var(--mono); font-size: 9.5px;
  color: var(--ink-dimmer); background: rgba(6,14,24,.6); border-radius: 8px; padding: 5px 8px; pointer-events: none; }

/* 選択中スキルの詳細(下部シート)。以前は決定ボタンだけが画面右端に固定されていて
   違和感があったため、アイコン・名称・説明・コスト・習得ボタンを1枚の帯にまとめた。 */
.sd-sktree-detail { position: relative; z-index: 1; flex-shrink: 0; margin: 0 16px 8px; padding: 12px 14px;
  border: 1px solid var(--line-2); border-radius: 14px; background: rgba(6,14,24,.86); animation: sdFade .15s ease; }
.sk-detail-head { display: flex; align-items: center; gap: 10px; }
.sk-detail-icon { flex-shrink: 0; width: 34px; height: 34px; border-radius: 50%; border: 1.5px solid var(--cn, var(--line-2));
  display: flex; align-items: center; justify-content: center; color: var(--cn, var(--ink)); }
.sk-cat-chip { font-family: var(--mono); font-size: 9.5px; color: var(--cn, var(--ink-dim)); margin-top: 1px; }
.sd-sktree-detail .sk-desc { font-size: 11px; color: var(--ink-dim); line-height: 1.65; margin-top: 8px; }
.sd-sktree-detail .sk-desc.dim { color: var(--ink-dimmer); }
.sk-detail-actions { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
.sk-detail-actions .sk-cost { font-family: var(--mono); font-size: 11px; color: var(--amber); }
.sk-detail-actions .sk-cost.owned { color: var(--ok); }

/* ── フルスクリーン画面(スキルツリー等)。上部は情報のみ、操作は下部に寄せる ──
   iPad 等の横幅が大きい画面では、.sd-root と同じ中央寄せの幅に揃える
   (inset:0 だと端末の全幅まで広がってしまい、背後のゲーム画面と幅が食い違う)。 */
.sd-fs-root { position: fixed; top: 0; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 560px; z-index: 60; background: var(--abyss);
  display: flex; flex-direction: column; overflow: hidden; animation: sdFade .2s ease; }
/* 強化/スキル/図鑑/設定/遊び方は「今どの画面にいてもいつでも開ける」共通メニューの
   オーバーレイなので、装備・収納など各画面固有のポップアップ(同じ .sd-fs-root, z-index:60)
   より確実に手前へ来るよう、DOM順序に頼らず明示的に高い z-index を指定する。 */
.sd-fs-root.sd-fs-meta { z-index: 65; }
/* 背景画像(sd-fs-bg 等)は sd-fs-root 直下に inset:0 で敷く。中身は position:relative で
   その上に確実に乗せる(位置指定していない画像より下に沈んでしまわないようにする)。 */
.sd-fs-top, .sd-fs-body, .sd-fs-actions { position: relative; z-index: 1; }
.sd-fs-top { flex-shrink: 0; padding: calc(env(safe-area-inset-top,0px) + 14px) 16px 8px; }
.sd-fs-body { flex: 1; min-height: 0; overflow-y: auto; padding: 4px 16px 12px; -webkit-overflow-scrolling: touch; }
.sd-fs-actions { flex-shrink: 0; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
  gap: 10px; padding: 8px 16px calc(env(safe-area-inset-bottom,0px) + 14px);
  background: linear-gradient(180deg, transparent, var(--abyss) 30%); }
/* 戻るは全画面のうち最も押される頻度が高いナビゲーションなので、通常サイズより
   一回り大きくして確実に押しやすくする(以前は sm サイズで右下の「習得する」より
   小さく、押しにくいという指摘があった)。 */
.sd-fs-actions .fs-back { grid-column: 2; justify-self: center; padding: 12px 22px; min-height: 48px; font-size: 13px; }
.sd-fs-actions .fs-primary { grid-column: 3; justify-self: end; }
.sd-sk-indent { margin-left: 16px; border-left: 1px dashed var(--line-2); }

/* ── アイテムのロック鍵 ── */
.sd-lock-btn { font-family: var(--mono); font-size: 9px; padding: 4px 8px; border: 1px solid var(--line-2);
  border-radius: 7px; background: transparent; color: var(--ink-dim); cursor: pointer;
  display: inline-flex; align-items: center; gap: 4px; min-height: 30px; }
.sd-lock-btn.on { border-color: var(--amber); color: var(--amber); }
.sd-toggle { display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 8px 11px; border: 1px solid var(--line); border-radius: 10px; margin-bottom: 6px; }
.sd-toggle .tl { font-size: 11px; color: var(--ink-dim); }
.sd-toggle button { font-family: var(--mono); font-size: 10px; padding: 5px 12px; border-radius: 8px;
  border: 1px solid var(--line-2); background: transparent; color: var(--ink-dim); cursor: pointer; }
.sd-toggle button.on { border-color: var(--cyan); color: var(--cyan); }

`;

/* ------------------------------------------------------------
   背景 — 海域ごとに地形・配色・浮遊物が変化
   最深部では海が星海に変わる
------------------------------------------------------------ */
function Motes({ color = [150, 220, 235], mode = "rise", density = 26, fast = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const cvs = ref.current; if (!cvs) return;
    const ctx = cvs.getContext("2d");
    let w, h, raf;
    const fit = () => { w = cvs.width = window.innerWidth; h = cvs.height = window.innerHeight; };
    fit(); window.addEventListener("resize", fit);
    const [cr, cg, cb] = color;
    const ps = Array.from({ length: density }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      r: rnd(0.6, 1.9), v: rnd(0.1, 0.42), ph: Math.random() * Math.PI * 2,
      a: Math.random() * Math.PI * 2, tw: rnd(0.004, 0.011), sway: rnd(0.3, 1),
    }));
    let t = 0;
    const step = () => {
      t += 1; ctx.clearRect(0, 0, w, h);
      for (const f of ps) {
        if (mode === "rise") { f.y -= f.v * 1.5; f.x += Math.sin(t * 0.006 + f.ph) * 0.35; }
        else if (mode === "fall") { f.y += f.v * (fast ? 4.5 : 1.7); f.x += Math.sin(t * 0.007 + f.ph) * f.sway * 0.6; }
        else if (mode === "drift") { f.x += Math.cos(f.ph) * f.v * 0.7; f.y += Math.sin(t * 0.004 + f.ph) * 0.22; }
        else { f.a += rnd(-0.05, 0.05); f.x += Math.cos(f.a) * f.v * (fast ? 1.8 : 1); f.y += Math.sin(f.a) * f.v; }
        if (f.x < -12) f.x = w + 12; if (f.x > w + 12) f.x = -12;
        if (f.y < -12) f.y = h + 12; if (f.y > h + 12) f.y = -12;
        const glow = 0.3 + 0.7 * Math.abs(Math.sin(t * f.tw + f.ph));
        const rad = f.r * 6;
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, rad);
        g.addColorStop(0, `rgba(${cr},${cg},${cb},${0.7 * glow})`);
        g.addColorStop(0.42, `rgba(${cr},${cg},${cb},${0.18 * glow})`);
        g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, rad, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(step);
    };
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mq.matches) raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", fit); };
  }, [color[0], color[1], color[2], mode, density, fast]);
  return <canvas ref={ref} aria-hidden="true" />;
}

// 気泡が画面下から立ちのぼる演出(CSSアニメのみ・軽量)。
// src/assets/bg/bubbleWhite/Cyan/Rose.webp があれば大小・色を混ぜて使い、無ければ丸いグラデで代用する。
// 大玉は白で統一(色付きは小粒のみ)。burstActive の間だけ、深度上昇の合図として
// 数秒間だけ密集した気泡が画面に溢れる(burstKey が変わるたびに再抽選)。
function Bubbles({ n = 12, burstActive = false, burstKey = 0, ambient = true }) {
  const bubbles = useMemo(() => Array.from({ length: n }, (_, i) => {
    const big = Math.random() < 0.12;
    return {
      id: i,
      left: Math.round(rnd(2, 98)),
      size: Math.round(big ? rnd(22, 34) : rnd(5, 18)),
      dur: big ? rnd(9, 16) : rnd(6, 12),
      delay: rnd(0, 13),
      drift: Math.round(rnd(-20, 20)),
      img: big ? BUBBLE_WHITE : pickBubbleImg(),
    };
  }), [n]);
  const burst = useMemo(() => {
    if (!burstActive) return [];
    return Array.from({ length: 26 }, (_, i) => {
      const big = Math.random() < 0.35;
      return {
        id: i,
        left: Math.round(rnd(1, 99)),
        size: Math.round(big ? rnd(24, 44) : rnd(6, 22)),
        dur: rnd(2.2, 3.6),
        delay: rnd(0, 1),
        drift: Math.round(rnd(-26, 26)),
        img: big ? BUBBLE_WHITE : pickBubbleImg(),
      };
    });
  }, [burstActive, burstKey]);
  return (
    <div className="sd-bubbles" aria-hidden="true">
      {ambient && bubbles.map((b) => (
        <span key={`a${b.id}`} className={`sd-bubble ${b.img ? "img" : ""}`}
          style={{
            left: `${b.left}%`, width: b.size, height: b.size,
            animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s`,
            "--drift": `${b.drift}px`,
            backgroundImage: b.img ? `url(${b.img})` : undefined,
          }} />
      ))}
      {burst.map((b) => (
        <span key={`b${b.id}`} className={`sd-bubble burst ${b.img ? "img" : ""}`}
          style={{
            left: `${b.left}%`, width: b.size, height: b.size,
            animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s`,
            "--drift": `${b.drift}px`,
            backgroundImage: b.img ? `url(${b.img})` : undefined,
          }} />
      ))}
    </div>
  );
}

function seeded(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

// 海域ごとの地形シルエット
function terrainOf(mode, seed) {
  const rand = seeded(seed);
  const W = 1200, base = 690;
  let d = `M 0 800 L 0 ${base}`;
  const seg = 14;
  for (let i = 0; i <= seg; i++) {
    const x = (W / seg) * i;
    if (mode === "kelp") {
      const h = 120 + rand() * 210;
      d += ` L ${x - 4} ${base} L ${x} ${base - h} L ${x + 4} ${base}`;
    } else if (mode === "coral") {
      const h = 60 + rand() * 130, wd = 22 + rand() * 30;
      d += ` L ${x - wd} ${base} Q ${x} ${base - h * 2} ${x + wd} ${base}`;
    } else if (mode === "wreck" || mode === "magnet") {
      const h = 40 + rand() * 170, wd = 26 + rand() * 44;
      d += ` L ${x} ${base} L ${x} ${base - h} L ${x + wd} ${base - h * (0.5 + rand() * 0.4)} L ${x + wd} ${base}`;
    } else if (mode === "vents" || mode === "spire" || mode === "stars") {
      const h = 90 + rand() * 220, wd = 14 + rand() * 22;
      d += ` L ${x - wd} ${base} L ${x} ${base - h} L ${x + wd} ${base}`;
    } else if (mode === "ice") {
      const h = 70 + rand() * 190, wd = 30 + rand() * 40;
      d += ` L ${x - wd} ${base} L ${x - wd * 0.3} ${base - h} L ${x + wd * 0.4} ${base - h * 0.8} L ${x + wd} ${base}`;
    } else if (mode === "bones") {
      const h = 50 + rand() * 120;
      d += ` L ${x - 30} ${base} Q ${x - 15} ${base - h} ${x} ${base - h * 0.5} Q ${x + 15} ${base - h} ${x + 30} ${base}`;
    } else if (mode === "bloom") {
      const h = 50 + rand() * 110, wd = 26 + rand() * 32;
      d += ` L ${x - wd} ${base} Q ${x} ${base - h * 1.9} ${x + wd} ${base}`;
    } else { // trench
      const h = 20 + rand() * 70;
      d += ` L ${x} ${base - h * 0.5} L ${x + 40} ${base - h}`;
    }
  }
  d += ` L ${W} ${base} L ${W} 800 Z`;
  return d;
}

function Backdrop({ depth = 1 }) {
  const z = zoneOf(depth);
  const Z = ZONES[z];
  const prog = (layerOf(depth) - 1) / 9;
  const seed = (z + 1) * 137;

  const path = useMemo(() => terrainOf(Z.terrain, seed), [Z.terrain, seed]);
  const stars = useMemo(() => {
    if (!Z.bg.stars) return [];
    const rand = seeded(seed + 41);
    return Array.from({ length: 90 }, () => ({ x: rand() * 1200, y: rand() * 620, r: 0.4 + rand() * 1.5, o: 0.25 + rand() * 0.7 }));
  }, [Z.bg.stars, seed]);
  // 遠景を横切る巨影
  const shade = useMemo(() => {
    const rand = seeded(seed + 77);
    return { y: 180 + rand() * 220, s: 0.7 + rand() * 0.6, dur: 46 + rand() * 26 };
  }, [seed]);

  const rgb = (a, dim = 0) => `rgb(${Math.max(0, a[0] - dim)},${Math.max(0, a[1] - dim)},${Math.max(0, a[2] - dim)})`;
  const dim = Math.round(prog * 5);
  const bgUrl = zoneBgUrl(z);

  return (
    <div className="sd-bg" aria-hidden="true">
      {bgUrl && <img className="sd-bg-photo" src={bgUrl} alt="" />}
      <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice"
        style={{ opacity: bgUrl ? 0.4 : 1 }}>
        <defs>
          <linearGradient id="sdWater" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={rgb(Z.bg.top, dim)} />
            <stop offset="0.5" stopColor={rgb(Z.bg.mid, dim)} />
            <stop offset="1" stopColor={rgb(Z.bg.deep)} />
          </linearGradient>
          <linearGradient id="sdShaft" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={`rgba(${Z.bg.accent},${0.10 * Z.bg.light})`} />
            <stop offset="1" stopColor={`rgba(${Z.bg.accent},0)`} />
          </linearGradient>
          <radialGradient id="sdHalo" cx="0.5" cy="0" r="1">
            <stop offset="0" stopColor={`rgba(${Z.bg.accent},${0.20 * Z.bg.light})`} />
            <stop offset="1" stopColor={`rgba(${Z.bg.accent},0)`} />
          </radialGradient>
        </defs>
        <rect width="1200" height="800" fill="url(#sdWater)" />
        {stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={`rgba(235,240,255,${s.o})`} />)}
        <rect width="1200" height="520" fill="url(#sdHalo)" />
        {/* 上から差す光柱 */}
        {[180, 470, 760, 1030].map((x, i) => (
          <polygon key={i} points={`${x - 40},0 ${x + 40},0 ${x + 130},640 ${x - 130},640`} fill="url(#sdShaft)">
            <animate attributeName="opacity" values="0.55;1;0.55" dur={`${13 + i * 4}s`} repeatCount="indefinite" />
          </polygon>
        ))}
        {/* 遠景を横切る巨大な影 */}
        <g opacity="0.2">
          <ellipse cx="-260" cy={shade.y} rx={190 * shade.s} ry={30 * shade.s} fill={rgb(Z.bg.deep)}>
            <animate attributeName="cx" values="-260;1460" dur={`${shade.dur}s`} repeatCount="indefinite" />
          </ellipse>
        </g>
        {/* ソナーの走査円 */}
        <g fill="none" stroke={`rgba(${Z.bg.accent},0.16)`} strokeWidth="1">
          <circle cx="600" cy="400" r="80">
            <animate attributeName="r" values="60;540" dur="8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0" dur="8s" repeatCount="indefinite" />
          </circle>
          <circle cx="600" cy="400" r="80">
            <animate attributeName="r" values="60;540" dur="8s" begin="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0" dur="8s" begin="4s" repeatCount="indefinite" />
          </circle>
        </g>
        <path d={path} fill={rgb(Z.bg.deep)} opacity="0.96" />
        <path d={path} fill="none" stroke={`rgba(${Z.bg.accent},0.22)`} strokeWidth="1" />
      </svg>
      <Motes color={Z.motes.color} mode={Z.motes.mode}
        density={Z.motes.density + Math.round(prog * 8)} fast={Z.motes.fast} />
    </div>
  );
}

/* ------------------------------------------------------------
   共通パーツ
------------------------------------------------------------ */
function Icon({ assetId, size = 22, color, style }) {
  const a = ASSETS[assetId];
  // 画像は整形(円/正方形)せず元の縦横比のまま表示。size は長辺の大きさ。
  if (a && a.img) return (
    <img src={a.img} alt=""
      style={{ maxWidth: size, maxHeight: size, width: "auto", height: "auto",
        objectFit: "contain", display: "block", ...style }} />
  );
  const I = (a && a.icon) || Package;
  return <I size={size} color={color} strokeWidth={1.5} style={style} />;
}

function RarTag({ rarity }) {
  const r = rarityOf(rarity);
  const n = rarityIdx(rarity) + 1;
  return (
    <span className="sd-rar" style={{ background: r.color, color: "#04121a" }}>
      {"★".repeat(n)}
    </span>
  );
}

// 一覧セル(クルー/装備/遺物/消耗品を共通表示)
function Cell({ item, onClick, on, actionLabel, hint, sub }) {
  const r = rarityOf(item.rarity);
  const meta = item.kind === "crew"
    ? `${CREW_TYPES[item.type].label}・${CREW_TYPES[item.type].role}・HP${item.maxHp}/攻${item.atk}`
    : item.kind === "gear"
      ? `${GEAR_TYPES[item.slot].label}・HP+${item.hp} 攻+${item.atk} 防+${item.def}`
      : item.kind === "relic" ? item.desc
      : CONSUMABLES[item.itemId].desc;
  return (
    <button className={`sd-cell ${on ? "on" : ""}`} onClick={onClick}
      style={{ boxShadow: on ? undefined : r.glow === "none" ? undefined : r.glow }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ background: `${r.color}28`, borderRadius: 10, padding: 2, display: "flex", flexShrink: 0 }}>
          <Icon assetId={item.asset} size={38} color={r.color} />
        </div>
        <RarTag rarity={item.rarity} />
      </div>
      <div className="sd-nm">{item.name}</div>
      <div className="sd-mt">{meta}</div>
      {sub && <div className="sd-mt" style={{ color: "var(--ink-dimmer)" }}>{sub}</div>}
      {hint && <div className="sd-hint" style={{ color: hint.up ? "var(--ok)" : hint.down ? "var(--ink-dimmer)" : "var(--amber)" }}>{hint.text}</div>}
      {actionLabel && <div className="sd-act">{actionLabel}</div>}
    </button>
  );
}

// 敵カード(モジュールレベル=浮遊数字が再アニメしない)
function EnemyCard({ e, scanned, aiming, hitId, floats, onPick, cinema }) {
  const known = scanned[e.bookId] || { w: [], r: [] };
  const shown = e.scanned || e.exposed > 0 ? { w: e.weak, r: e.resist } : known;
  const unknown = [...e.weak, ...e.resist].some((t) => !shown.w?.includes(t) && !shown.r?.includes(t));
  const good = aiming && e.hp > 0 && shown.w?.includes(aiming);
  const mine = floats.filter((f) => f.target === e.id);
  // 弱点・耐性・状態異常タグの合計数は敵によってまちまち(ボスは2〜3属性+状態異常が
  // 重なることもある)。全部並べて折り返すと行数が敵ごとに変わり、戦闘中の並びが
  // ガタつく(位置がブレる)ため、表示領域を固定した上で入りきらない分は数秒おきに
  // 切り替えて見せる(ページング)。カードの高さは常に一定になる。
  const allTags = [
    ...(shown.w || []).map((t) => ({ key: "w" + t, cls: "w", text: `弱 ${t}` })),
    ...(shown.r || []).map((t) => ({ key: "r" + t, cls: "r", text: `耐 ${t}` })),
    ...(unknown ? [{ key: "unk", cls: "q", text: "未走査" }] : []),
    ...(e.burning > 0 ? [{ key: "burn", cls: "st", text: `燃焼${e.burning}` }] : []),
    ...(e.paralyzed > 0 ? [{ key: "para", cls: "st", text: `麻痺${e.paralyzed}` }] : []),
    ...(e.paralyzeImmune > 0 ? [{ key: "pimm", cls: "r", text: `麻痺耐性${e.paralyzeImmune}` }] : []),
    ...(e.exposed > 0 ? [{ key: "exp", cls: "w", text: `露出${e.exposed}` }] : []),
    ...(e.anomaly ? [{ key: "flee", cls: "w", text: `離脱まで${e.fleeIn}` }] : []),
  ];
  const TAGS_PER_PAGE = 4;
  const pageCount = Math.max(1, Math.ceil(allTags.length / TAGS_PER_PAGE));
  const [tagPage, setTagPage] = useState(0);
  useEffect(() => {
    if (pageCount <= 1) { setTagPage(0); return; }
    const id = setInterval(() => setTagPage((p) => (p + 1) % pageCount), 2200);
    return () => clearInterval(id);
  }, [pageCount]);
  const visibleTags = allTags.slice(tagPage * TAGS_PER_PAGE, tagPage * TAGS_PER_PAGE + TAGS_PER_PAGE);
  return (
    <div className={`sd-enemy ${e.hp <= 0 ? "dead" : ""} ${e.anomaly ? "anom" : ""} ${e.boss ? "boss" : ""} ${cinema ? "cinema" : ""} ${aiming ? "aim" : ""} ${good ? "good" : ""} ${hitId === e.id ? "hit" : ""}`}
      onClick={() => { if (aiming && e.hp > 0) onPick(e.id); }} role="button">
      {mine.map((f) => (
        <div key={f.key} className="sd-float" style={{ color: f.color, fontSize: f.size }}>{f.text}</div>
      ))}
      <div className="sd-eicon">
        <Icon assetId={e.asset} size={e.boss ? 132 : 92} color={e.anomaly || e.boss ? "var(--amber)" : "var(--cyan)"} />
      </div>
      <div className="sd-ename">{e.name}</div>
      <div className={`sd-bar ${e.boss ? "boss" : ""}`}><i style={{ width: `${(e.hp / e.maxHp) * 100}%` }} /></div>
      <div className="sd-hpnum">{e.hp} / {e.maxHp}{e.def > 0 ? ` · 装甲${e.def}` : ""}</div>
      <div className="sd-tags">
        {visibleTags.map((t) => <span key={t.key} className={`sd-tag ${t.cls}`}>{t.text}</span>)}
        {pageCount > 1 && <span className="sd-tag-page">{tagPage + 1}/{pageCount}</span>}
      </div>
    </div>
  );
}

// クルーカード
function CrewCard({ c, active, acted, floats, onClick }) {
  if (!c) return <div className="sd-cc" style={{ opacity: .3, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 78 }}>
    <span className="sd-crole">空席</span></div>;
  const t = CREW_TYPES[c.type];
  const r = rarityOf(c.rarity);
  const mine = floats.filter((f) => f.target === c.id);
  const pct = (c.hp / c.maxHp) * 100;
  return (
    <div className={`sd-cc ${active ? "active" : ""} ${c.down ? "down" : ""} ${acted ? "acted" : ""}`}
      onClick={onClick} style={{ position: "relative" }}>
      {mine.map((f, i) => (
        // 同時に複数のフロート(回復+同時ダメージ等)が同じクルーに出ると、既定では
        // 全て画面中央に完全に重なって読めなくなる。2つ以上ある時だけ、中央を軸に
        // 左右へ均等にずらして表示する。
        <div key={f.key} className="sd-float" style={{
          color: f.color, fontSize: f.size, top: "-14%",
          left: mine.length > 1 ? `calc(50% + ${(i - (mine.length - 1) / 2) * 30}px)` : "50%",
        }}>{f.text}</div>
      ))}
      <span className={`sd-badge ${c.cd > 0 ? "cd" : ""}`}>
        {c.down ? "行動不能" : c.cd > 0 ? `技 ${c.cd}` : "技 可"}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Icon assetId={c.asset} size={28} color={r.color} />
        <RarTag rarity={c.rarity} />
      </div>
      <div className="sd-cname">{c.name}</div>
      <div className="sd-crole">{t.label} · {t.dmg} · {t.role}</div>
      <div className={`sd-cbar ${pct < 30 ? "low" : ""}`}><i style={{ width: `${pct}%` }} /></div>
      <div className="sd-chp">
        {c.hp} / {c.maxHp}
        {c.buffAtk > 0 && <span className="sd-chip" style={{ marginLeft: 6 }}>攻+{Math.round(c.buffAtk * 100)}%</span>}
        {c.gear && <span className="sd-chip" style={{ marginLeft: 4 }}>{GEAR_TYPES[c.gear.slot].label}</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   長押し判定フック
------------------------------------------------------------ */
function useLongPress(onLongPress, delay = 530) {
  const timer = useRef(null);
  const fired = useRef(false);
  const start = () => {
    fired.current = false;
    timer.current = setTimeout(() => { fired.current = true; onLongPress(); }, delay);
  };
  const cancel = () => clearTimeout(timer.current);
  return {
    fired,
    props: {
      onTouchStart: start, onTouchEnd: cancel, onTouchCancel: cancel,
      onMouseDown: start, onMouseUp: cancel, onMouseLeave: cancel,
    },
  };
}

/* ------------------------------------------------------------
   コンパクトクルー行(戦闘中の下部ステータス表示)
   タップ不要・情報が2行に収まるようデザイン
------------------------------------------------------------ */
const DMG_COLOR = { 徹甲: "#c9d6e0", 熱量: "#ff9b6b", 電磁: "#7fb2ff", 音響: "#9fe6d8", 生体: "#8fe08f" };

function CrewRow({ c, active, acted, pick, onPick, onInfo }) {
  if (!c) return <div className="sd-cr empty"><span style={{ fontSize: 11 }}>空 席</span></div>;
  const r = rarityOf(c.rarity);
  const t = CREW_TYPES[c.type];
  const pct = (c.hp / c.maxHp) * 100;
  return (
    <div className={`sd-cr ${active ? "active" : ""} ${c.down ? "down" : ""} ${acted ? "acted" : ""} ${pick ? "pick" : ""}`}
      onClick={pick ? onPick : onInfo} role="button">
      <div className="sd-cr-icon">
        <Icon assetId={c.asset} size={52} color={r.color} />
        <span className="sd-rar sd-rar-overlay" style={{ background: r.color, color: "#04121a" }}>
          {"★".repeat(rarityIdx(c.rarity) + 1)}
        </span>
      </div>
      <div className="sd-cr-mid">
        <div className="sd-cr-name">
          <span className="sd-cr-nm">{c.name}</span>
          {c.buffAtk > 0 && <span style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--ok)", flexShrink: 0 }}>攻+{Math.round(c.buffAtk * 100)}%</span>}
        </div>
        <div className="sd-cr-stat">
          <span className="sd-wchip" style={{ borderColor: DMG_COLOR[t.dmg], color: DMG_COLOR[t.dmg] }}>{t.dmg}</span>
          <div className={`sd-cr-bar ${pct < 30 ? "low" : ""}`}><i style={{ width: `${pct}%` }} /></div>
          <span className="sd-cr-hp">{c.hp}/{c.maxHp}</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   メイン
============================================================ */
const AFF_W = 1.6, AFF_R = 0.5;
const BAG_CAP_BASE = 12;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function layerNodes(depth, signalBonus = 0) {
  if (layerOf(depth) === 10) return ["boss"];
  const roll = Math.random();
  const mid = roll < 0.15 ? "wreck"
    : roll < 0.27 ? "supply"
    : roll < 0.39 ? "scrap"
    : roll < 0.49 ? "shop"
    : roll < 0.59 ? "gate"
    : roll < 0.69 ? "mermaid"
    : roll < (0.69 + signalBonus) ? "signal"
    : "battle";
  return ["battle", mid, "battle"];
}
const NODE_LABEL = {
  battle: "交戦", wreck: "残骸", supply: "補給", scrap: "廃品回収", shop: "行商",
  gate: "関所", mermaid: "人魚", signal: "救難信号", boss: "主",
};

/* ---------- 全滅・撤退時の持ち帰り候補(モジュールスコープ — 純粋関数なのでフック不要な
   場所からも呼べる) ----------
   遺物は装備・消耗品と別枠(遺物枠 relicN と同じ上限)で持ち帰れる。以前は「回収枠」
   (carryN、初期値1)を装備・消耗品と取り合う一本のプールしか無く、遺物枠を伸ばして
   複数の遺物を運用していても、死亡・撤退のたびに回収枠を他の物に取られて遺物が
   実質ほぼ継承できなかった(「遺物が継承できない」という報告の原因)。
   遺物枠自体が relicFloor スキル(コスト10)でしか伸びない小さな上限(既定1 / 最大3)
   なので、そのまま持ち帰り枠として使っても難易度への影響は小さい。 */
function itemScore(it) {
  if (it.locked) return 1e9; // ロック品は最優先で持ち帰る
  const ri2 = rarityIdx(it.rarity);
  if (it.kind === "item") return 10 + ri2;
  if (it.kind === "relic") return 500 + ri2 * 100;
  return ri2 * 100 + it.hp + it.atk * 2 + it.def * 3;
}
const allSalvage = (s) => [
  ...s.crew.filter(Boolean).map((c) => c.gear).filter(Boolean),
  ...(s.relics || []), ...s.bag,
];
// 遺物は relicN 件まで、それ以外(装備・消耗品)は carryN 件まで、それぞれ独立に持ち帰れる。
function recommendCarry(s, carryN, relicN) {
  const byScore = (a, b) => itemScore(b) - itemScore(a);
  const all = allSalvage(s);
  const relics = all.filter((it) => it.kind === "relic").sort(byScore).slice(0, relicN);
  const others = all.filter((it) => it.kind !== "relic").sort(byScore).slice(0, carryN);
  return [...relics, ...others].map((it) => it.id);
}
// 船内ストレージ(帰還・全滅時に持ち帰る物を選ぶ画面)向け。種類を問わない共通プールとして
// storageN 件まで、スコアの高い順に推奨する(recommendCarry と違い遺物とそれ以外を分けない)。
function recommendStorage(s, storageN) {
  const byScore = (a, b) => itemScore(b) - itemScore(a);
  return allSalvage(s).sort(byScore).slice(0, storageN).map((it) => it.id);
}

export default function StillDepths() {
  const [meta, setMeta] = useState(null);
  const [g, setG] = useState({ screen: "title" });
  const gRef = useRef(g); gRef.current = g;
  // act() の二重発火防止用の同期ロック。React state(busy)は反映まで1レンダー分の
  // ラグがあるため、攻撃/技ボタンの連打などで「busy がまだ false に見える」瞬間に
  // 2回目が素通りしうる。ref は書き込みが即座に反映されるのでこの穴を塞げる。
  const actLockRef = useRef(false);
  // proceed()/leaveNow()/takeAllGo() の二重発火防止用の同期ロック(actLockRef と同じ理由)。
  // これらは nextNode() を通じて現在の g.phase を見ずに無条件でノード/深度を進めるため、
  // ボタン連打で同一ティック内に複数回呼ばれると(再レンダー前で古いDOM要素へのクリックが
  // まだ束の間バブリングする間に)ノードや深度が2つ以上まとめて進み、その間の戦闘やイベントを
  // プレイヤーが経験しないまま黙って読み飛ばしてしまう。
  const advanceLockRef = useRef(false);
  const withAdvanceLock = (fn) => (...args) => {
    if (advanceLockRef.current) return;
    advanceLockRef.current = true;
    queueMicrotask(() => { advanceLockRef.current = false; });
    return fn(...args);
  };
  const metaRef = useRef(meta); metaRef.current = meta;
  const [skillTip, setSkillTip] = useState(null);
  const [overlay, setOverlay] = useState(null); // "bestiary" | "skills" | "settings" | null
  // 中断中の潜航データ(起動直後の中断復帰、または潜航中に「メイン」へ戻った場合)。
  // ここに値がある間、タイトル画面に「続きから再開」ボタンが出る。起動時は自動で
  // 潜航画面へは入らず、必ずタイトルから始まるようにするため、setG では直接反映しない。
  const [resumable, setResumable] = useState(null);
  const [bagSort, setBagSort] = useState("type"); // 袋の並び順: "type"(種類順=レア度順) | "acq"(入手順)
  const [logOpen, setLogOpen] = useState(false); // 戦闘ログの全文ポップアップ
  // クルーカードの操作モード。null=閲覧のみ(ドラッグ&入れ替え無効)、"reorder"=並び順入れ替え、
  // "gearSwap"=装備一式の入れ替え。以前はモードを選ばなくても常にドラッグで装備が入れ替わって
  // しまっていた(誤操作の元)ため、明示的にアイコンで選んだ時だけドラッグ/タップ入れ替えが
  // 有効になるようにする。
  const [interactionMode, setInteractionMode] = useState(null); // null | "reorder" | "gearSwap"
  const reorderMode = interactionMode === "reorder";
  const gearSwapMode = interactionMode === "gearSwap";
  const [reorderFirst, setReorderFirst] = useState(null); // 並び替え/装備交換で最初に選んだクルーID
  // クルーカードのドラッグ&ドロップ(並び替えモード中は並び順の入れ替え、それ以外は装備の
  // 入れ替えに使う)。タップだけの操作(ドラッグ量がほぼ無い)は従来通りの並び替えモードの
  // タップ選択に委ねるため、ドロップ先が「自分自身」の場合は何もしない。
  const [weaponSwapOpen, setWeaponSwapOpen] = useState(false); // 武器だけの入れ替えポップアップ
  const [weaponSwapFirst, setWeaponSwapFirst] = useState(null); // タップ入れ替えで最初に選んだクルーID
  const [dragCrewId, setDragCrewId] = useState(null);
  const [dragOverCrewId, setDragOverCrewId] = useState(null);
  const [dragPos, setDragPos] = useState(null);
  const logRef = useRef(null);
  const fieldRef = useRef(null);

  // 新しいログが増えたらログ枠を最下部へスクロール
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [g.logs]);

  // フェーズが切り替わるたび(行商・関所・人魚・制圧完了など、あらゆるノート画面で)
  // 敵カード/イベント表示エリアのスクロール位置を一番上に戻す
  useEffect(() => {
    if (fieldRef.current) fieldRef.current.scrollTop = 0;
  }, [g.phase]);

  // 海域ごとに BGM を切り替える(母船=zone1)。ボスと交戦中はボス専用BGMに差し替え、
  // ボスがいなくなれば(撃破・撤退問わず)通常の海域BGMへ自動的に戻る。
  const inBossFight = g.screen === "dive" && g.phase === "battle" && g.enemies.some((e) => e.boss && e.hp > 0);
  const bgmZone = g.screen === "dive" && g.depth ? zoneOf(g.depth) + 1 : 1;
  const bgmTrack = inBossFight ? "boss" : `zone${bgmZone}`;
  useEffect(() => {
    try { window.webkit?.messageHandlers?.bgm?.postMessage?.({ track: bgmTrack }); } catch { /* noop */ }
  }, [bgmTrack]);

  // ショップ入場SE(フェーズがショップに変わった瞬間だけ)
  const prevPhaseRef = useRef(g.phase);
  useEffect(() => {
    if (g.phase !== prevPhaseRef.current) {
      if (g.phase === "shop") playSE("shopEnter");
      prevPhaseRef.current = g.phase;
    }
  }, [g.phase]);

  // 降下ボタンで深度が増えた瞬間、次のシーンで数秒間だけ気泡が一気に沸き立ち、
  // 音も鳴らす(次のシーンが戦闘でも、降下した瞬間の演出として出す)
  const prevDepthRef = useRef(g.depth);
  const [depthBurst, setDepthBurst] = useState(false);
  const [depthNotice, setDepthNotice] = useState(null); // { from, to } in meters、約1秒だけ表示
  useEffect(() => {
    const prev = prevDepthRef.current;
    prevDepthRef.current = g.depth;
    if (prev && g.depth && g.depth > prev) {
      setDepthBurst(true);
      playSE("bubbleBurst");
      const t = setTimeout(() => setDepthBurst(false), 4800);
      setDepthNotice({ from: depthMeters(prev), to: depthMeters(g.depth) });
      const t2 = setTimeout(() => setDepthNotice(null), 2000);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
  }, [g.depth]);

  useEffect(() => {
    loadMeta().then((m) => {
      setMeta(m);
      // タスキル後の中断データを確認
      const saved = loadGameState();
      if (saved && saved.screen === "dive" && saved.depth) {
        // 欠損フィールドを補完してからマージする。旧バージョンの保存形式や、万一壊れた
        // 保存データを読み込んだ場合に g.crew などが undefined のままレンダリングされ、
        // アプリ全体がクラッシュする(何も操作できない白画面になる)のを防ぐ。
        let cleaned = {
          crew: [], enemies: [], bag: [], relics: [], drops: [], logs: [],
          nodes: [], node: 0, turnIdx: 0, guardTurns: 0, scrapCount: 0, eventDone: true,
          ...saved,
          floats: [], hitId: null, busy: false, aiming: null, allyAim: null, healPick: null, equipPick: null, dangerConfirm: null, pendingSkill: false,
        };
        // 以前のビルドの不具合で、ボス撃破などの勝利処理が途中でクラッシュし、
        // 「戦闘フェーズなのに敵が全員撃破済み」のまま固まったセーブが残っている
        // 場合がある。再開時にこの状態を検知したら、確認プロンプトを出さずその場で
        // 勝利処理をやり直し、自動的に次のシーンへ進める(何も操作できないまま
        // 固まって見えるのを防ぐ)。
        const stuckAfterVictory = saved.phase === "battle" && Array.isArray(saved.enemies)
          && saved.enemies.length > 0 && saved.enemies.every((e) => e.hp <= 0);
        if (stuckAfterVictory) {
          victory(saved.enemies, cleaned);
        } else {
          // 以前はここで即座に潜航画面へ切り替えて確認プロンプトを重ねていたが、
          // 「毎回メイン画面から始めたい」という要望により、起動直後は必ずタイトルに
          // 留まり、続きから再開するかはタイトル側のボタンで明示的に選べるようにする。
          setResumable(cleaned);
        }
      }
    });
  }, []);

  // ゲーム状態を定期的に保存(タスキル対策)
  useEffect(() => {
    if (g.screen !== "dive" || g.phase === "lost" || g.phase === "ending" || g.phase === "return") return;
    saveGameState(g);
  }, [g.depth, g.phase, g.node, g.crew, g.bag, g.relics, g.enemies, g.drops]);

  /* ---- 遺物・スキルの効果参照 ---- */
  const hasRelic = (s, id) => (s.relics || []).some((r) => r.relicId === id);
  const struct0 = skillStructural(meta?.skills);
  const bagCap = BAG_CAP_BASE + struct0.bag;
  // 袋の表示順。種類順は同じ種類の中でレア度が高い物を先頭にする(安定ソートなので
  // 同レア度なら入手順のまま)。入手順は g.bag の並びそのまま。
  const viewBag = bagSort === "type"
    ? [...(g.bag || [])].sort((a, b) => rarityIdx(b.rarity) - rarityIdx(a.rarity))
    : (g.bag || []);
  const relicN = Math.max(meta?.relicSlots || 1, struct0.relicFloor);
  const carryN = (meta?.carrySlots || 1) + struct0.carryBonus;
  const storageN = storageCapOf(meta);
  const crewMaxHp = (c, s, m = meta) => {
    let v = c.baseMaxHp ?? c.maxHp;
    if (c.gear) v += c.gear.hp;
    if (c.weapon) v += c.weapon.hp;
    v += (m?.bonusHp || 0);
    if (hasRelic(s, "ballast")) v = Math.round(v * 1.12);
    const sp = skillEffectTotal(m?.skills, "maxHpPct");
    if (sp > 0) v = Math.round(v * (1 + sp));
    return v;
  };
  const crewAtk = (c, s) => {
    let v = c.atk + (c.gear ? c.gear.atk : 0) + (c.weapon ? c.weapon.atk : 0);
    if (hasRelic(s, "starCore")) v = Math.round(v * 1.15);
    if (c.buffAtk > 0) v = Math.round(v * (1 + c.buffAtk));
    return v;
  };
  const crewDef = (c) => (c.gear ? c.gear.def : 0) + (c.weapon ? c.weapon.def : 0);
  const skillCd = (s, base) => hasRelic(s, "echoDrive") ? Math.max(1, base - 1) : base;

  const pushLog = (s, text, hi = false) => ({ ...s, logs: [...(s.logs || []).slice(-60), { text, hi, k: uid() }] });
  const addFloat = (s, target, text, color, size = 19) =>
    ({ ...s, floats: [...(s.floats || []), { key: uid(), target, text, color, size, t: Date.now() }] });

  /* ---- ネイティブ橋渡し(iOS WKWebView。無ければ何もしない) ---- */
  const native = (name, body) => {
    try { window.webkit?.messageHandlers?.[name]?.postMessage?.(body); } catch (e) {}
  };
  // インタースティシャルの表示依頼(頻度判定はネイティブ側)。結果は待たない。
  const showInterstitial = (context) => native("interstitial", { action: "show", context });
  // リワード広告を要求。結果は window.__onRewardAdResult__(context, result) で届く。
  const requestRewardAd = (context) => {
    if (!window.webkit?.messageHandlers?.rewardAd) {
      // ネイティブ不在(ブラウザ確認時): 失敗として扱う
      setG((s) => ({ ...s, rewardAdPending: null, rewardAdFailedAt: Date.now(), rewardAdFailReason: "unavailable" }));
      return;
    }
    setG((s) => ({ ...s, rewardAdPending: context, rewardAdFailedAt: null, rewardAdFailReason: null }));
    native("rewardAd", { action: "show", context });
  };

  // 浮遊数字の自動消去
  useEffect(() => {
    if (!g.floats || g.floats.length === 0) return;
    const id = setInterval(() => {
      setG((s) => {
        if (!s.floats || s.floats.length === 0) return s;
        const now = Date.now();
        const kept = s.floats.filter((f) => now - f.t < 1050);
        return kept.length === s.floats.length ? s : { ...s, floats: kept };
      });
    }, 240);
    return () => clearInterval(id);
  }, [!g.floats || g.floats.length === 0]);

  /* ---- リワード広告の結果を受け取る(ネイティブ → JS) ---- */
  useEffect(() => {
    window.__onRewardAdResult__ = (context, result) => {
      const r = result === true ? "rewarded" : (result || "unavailable");
      native("progress", { event: "reward_ad_result", context, result: r });
      if (r !== "rewarded") {
        setG((s) => (s.rewardAdPending === context
          ? { ...s, rewardAdPending: null, rewardAdFailedAt: Date.now(), rewardAdFailReason: result === "dismissed" ? "dismissed" : "load" }
          : s));
        return;
      }
      // 成功 — g.rewardAdPending の消費チェックと適用を同じ updater 内で行い、
      // ネイティブ側が結果コールバックを二重発火しても g 側・meta 側とも1回しか消費されないようにする。
      // (「まだ保留中か」を gRef 等で同期的に読んでから別に setMeta するのは非原子的で危険)
      let applied = false;
      setG((s) => {
        if (s.rewardAdPending !== context) return s;
        applied = true;
        if (context === "revive") {
          const crew = s.crew.map((c) => c ? {
            ...c, down: false, burning: 0, poisoned: 0,
            hp: c.down ? Math.round(c.maxHp * 0.6) : Math.min(c.maxHp, Math.round(c.maxHp * 0.8)),
          } : c);
          return pushLog({ ...s, phase: "battle", busy: false, rewardAdPending: null, reviveUsed: true,
            crew, turnIdx: firstActive(crew, -1) }, "観測機を再起動。隊が息を吹き返した!", true);
        }
        if (context === "double") {
          const extra = rollDrops(s.enemies.filter((e) => e.hp <= 0 && !e.fled), s.depth, s);
          return pushLog({ ...s, rewardAdPending: null, doubleClaimed: true, drops: [...s.drops, ...extra] },
            "広告視聴で、追加の物資が浮上した。", true);
        }
        return { ...s, rewardAdPending: null };
      });
      if (!applied) return; // 既に処理済み(二重発火)なら meta 側の消費もスキップする
      setMeta((prev) => {
        const m = consumeRewardAdUse(prev, context);
        const m2 = context === "revive" ? { ...m, reviveUsedThisRun: true } : m;
        saveMeta(m2);
        return m2;
      });
      if (context === "revive") native("progress", { event: "revive" });
    };
    window.__onInterstitialClosed__ = () => {};
    return () => { delete window.__onRewardAdResult__; delete window.__onInterstitialClosed__; };
  }, []);

  const rewardAdFailNote = (style) => {
    const s = g;
    if (!s.rewardAdFailedAt || s.rewardAdPending != null) return null;
    const loadfail = s.rewardAdFailReason !== "dismissed";
    return (
      <div className="sd-note" style={{ color: "var(--ink-dim)", borderColor: "var(--line-2)", ...style }}>
        {loadfail
          ? "広告を読み込めませんでした。通信環境をご確認ください。広告ブロック・コンテンツブロッカー・VPN が有効な場合は解除のうえ、アプリを再起動してお試しください。"
          : "広告の視聴が途中で中断されました。もう一度お試しください。"}
      </div>
    );
  };

  /* ---------- 潜航の開始 ---------- */
  function startDive(chosenCrew, fromZone = null) {
    clearGameState();
    const start = fromZone != null ? fromZone * 10 + 1 : (Math.min(meta.checkpoint, 10) - 1) * 10 + 1;
    // 持ち越し品は、海域を選んでの再挑戦(fromZone 指定あり)でも通常の潜航と同じく適用する。
    // 以前は再挑戦時だけ「持ち込めません」として弾いていたが、それだと今まで持ち越し装備・
    // 遺物込みでクリアできていた海域が、再挑戦のたびに素の状態へ戻されて急にクリアできなく
    // なってしまっていた(実質的な弱体化に感じられるため撤廃)。
    // 船内ストレージ(meta.carried、最大 storageN 点)は潜航1回で全部は持ち出せない
    // (装備・消耗品 carryN 点 ＋ 遺物 relicN 点、それぞれ独立した枠)。スコアの高い順に
    // 選ばれた分だけをこの潜航へ積み込み、選ばれなかった残りはストレージに置いたままにする
    // (以前は毎回ストレージを丸ごと空にして全部持ち出していたため、ストレージを大きくする
    // 意味が無かった)。
    const storagePool = meta.carried || [];
    const pickedIds = new Set(recommendCarry({ crew: [], relics: storagePool.filter((x) => x.kind === "relic"), bag: storagePool.filter((x) => x.kind !== "relic") }, carryN, relicN));
    const picked = storagePool.filter((x) => pickedIds.has(x.id));
    const leftoverStorage = storagePool.filter((x) => !pickedIds.has(x.id));
    const carriedGear = picked.filter((x) => x.kind === "gear").map((x) => ({ ...x, id: uid() }));
    const carriedRelics = picked.filter((x) => x.kind === "relic").map((x) => ({ ...x, id: uid() }));
    const carriedItems = picked.filter((x) => x.kind === "item").map((x) => ({ ...x, id: uid() }));
    const crew = chosenCrew.map((c) => {
      const nc = { ...c, id: uid(), cd: 0, buffAtk: 0, guard: 0, down: false };
      nc.baseMaxHp = nc.maxHp;
      return nc;
    });
    const struct = skillStructural(meta.skills);
    const startBag = [makeConsumable("medkit"), ...struct.start.map((id) => makeConsumable(id))]
      .map((it) => matchesAutoLock(it) ? { ...it, locked: true } : it);
    let base = {
      screen: "dive", depth: start, node: 0, nodes: layerNodes(start, skillEffectTotal(meta.skills, "signalRate")), phase: "battle",
      crew, relics: carriedRelics, bag: startBag, enemies: [],
      turnIdx: 0, aiming: null, pendingSkill: false, busy: false,
      logs: [], floats: [], drops: [], hitId: null, guardTurns: 0,
      confirm: null, full: false, bagOpen: false, eventDone: false, recruit: null,
      reviveUsed: false, scrapCount: 0,
      coach: meta.dives === 0,
    };
    // 持ち越した装備は収納へ。装備画面で任意のクルーに装着する
    base.bag.push(...carriedGear, ...carriedItems);
    base.crew = base.crew.map((c) => {
      const mx = crewMaxHp(c, base);
      return { ...c, maxHp: mx, hp: mx };
    });
    // 編成枠(3〜8、スキルツリー「編成拡大」で拡張)まで空席を詰めておく。
    // 途中の救難信号での勧誘先を確保するため。
    const cap = Math.min(PARTY_MAX, PARTY_BASE + struct.crewSlots);
    while (base.crew.length < cap) base.crew.push(null);
    // 積み込んだ分(picked)だけをストレージから消費する。選ばれなかった残り
    // (leftoverStorage)は次の潜航のためにそのままストレージへ残す。
    setMeta((prev) => {
      const m2 = { ...prev, dives: prev.dives + 1, reviveUsedThisRun: false, carried: leftoverStorage };
      saveMeta(m2);
      return m2;
    });
    native("progress", { event: "dive_start", depth: start });
    setG(enterNode(base));
  }

  // 海域図鑑コンプ報酬(残響片+5)。未受領かつコンプ済みなら 5、それ以外 0。
  function zoneCompShards(depth) {
    const zi = zoneOf(depth);
    if (meta?.zoneCompRewarded?.[zi]) return 0;
    return zoneBestiaryStatus(zi, meta).complete ? 5 : 0;
  }

  // 遭遇した敵を観測記録(図鑑)へ永続登録
  function registerSeen(enemies, depth) {
    setMeta((prev) => {
      const seen = { ...(prev?.seen || {}) };
      let changed = false;
      for (const e of enemies) {
        const key = e.anomaly ? `mutant${zoneOf(depth)}` : e.bookId;
        if (key && !seen[key]) { seen[key] = true; changed = true; }
      }
      if (!changed) return prev;
      const m = { ...prev, seen };
      saveMeta(m);
      return m;
    });
  }
  // awardSpecimen() の戻り値から、ログに残す「何段まで更新されたか」の一文を作る。
  function specimenProgressText(prog) {
    if (!prog) return "";
    return prog.unlocked
      ? `${prog.subject}の生態レポートが解放された(${prog.stage}/${SPECIMEN_UNLOCK})!`
      : `${prog.subject}の生態レポートが ${prog.stage}/${SPECIMEN_UNLOCK} 段まで進んだ。`;
  }
  // 観測対象(通常種 or 変異種)の表示名。ログに「何を何段まで記録したか」を出すために使う。
  function specimenSubjectName(bookId) {
    if (ENEMY_BOOK[bookId]) return ENEMY_BOOK[bookId].name;
    const m = /^mutant(\d+)$/.exec(bookId || "");
    if (m) return ANOMALIES[Number(m[1])]?.name || bookId;
    return bookId || "標本";
  }
  // 標本を1つ追加(SPECIMEN_UNLOCK 個で生態レポート第2段が解放)。
  // 呼び出し側がログに「◯◯の生態レポートが n/SPECIMEN_UNLOCK 段まで進んだ」と残せるよう、
  // 適用後の段数を戻り値で返す(変化が無かった場合は null)。
  function awardSpecimen(bookId, n = 1) {
    // 「回収してすべて」等で同じ種の標本を1アクション内で複数個回収すると、この関数が
    // 再描画を挟まず連続で呼ばれる。metaRef.current を都度読むと後の呼び出しが前の加算を
    // 見落として上書きしてしまう(取りこぼし)ため、必ず functional updater で積み上げる。
    // 加えて、戻り値用の段数もこの同一ティック内の連続呼び出しに追従させるため、
    // metaRef.current 自身もここで即座に最新化しておく(次のレンダーを待たない)。
    const cur = metaRef.current?.specimens?.[bookId] || 0;
    const next = Math.min(SPECIMEN_UNLOCK, cur + n);
    setMeta((prev) => {
      const prevCur = prev.specimens?.[bookId] || 0;
      const prevNext = Math.min(SPECIMEN_UNLOCK, prevCur + n);
      if (prevNext === prevCur) return prev;
      const m2 = { ...prev, specimens: { ...(prev.specimens || {}), [bookId]: prevNext } };
      saveMeta(m2);
      return m2;
    });
    if (next === cur) return null;
    metaRef.current = { ...metaRef.current, specimens: { ...(metaRef.current?.specimens || {}), [bookId]: next } };
    return { subject: specimenSubjectName(bookId), stage: next, unlocked: next >= SPECIMEN_UNLOCK && cur < SPECIMEN_UNLOCK };
  }

  function enterNode(s0) {
    const kind = s0.nodes[s0.node];
    let s = { ...s0, aiming: null, pendingSkill: false, drops: [], eventDone: false, recruit: null, confirm: null };
    // 潮汐硝子: 階層開始時に回復
    if (hasRelic(s, "tideGlass")) {
      s.crew = s.crew.map((c) => !c || c.down ? c : { ...c, hp: Math.min(c.maxHp, c.hp + Math.round(c.maxHp * 0.08)) });
    }
    if (kind === "battle" || kind === "boss") {
      // 深度が切り替わった直後(そのレイヤーの最初の戦闘)は、装備を整理する間もなく
      // 戦闘に入ってしまい、装備を調整する場が無いという問題があった。実際の戦闘
      // フェーズへ入る前に必ず一度「準備」フェーズを挟み、装備・収納を自由に開けるように
      // した上で、プレイヤーが任意のタイミングで戦闘を開始できるようにする(2戦目以降・
      // イベント直後の戦闘は、直前のノードで既に整理の機会があるため対象外)。
      if (s0.node === 0) return { ...s, phase: "prep" };
      return startBattlePhase(s, kind);
    }
    s.phase = kind;
    if (kind === "signal") s.recruit = rollRecruits(s.depth);
    return s;
  }
  // enterNode から分離: 実際に戦闘フェーズへ入る処理(敵生成・開幕効果)。
  // 「準備」フェーズから「戦闘を開始する」を押した時にも同じ処理を使う。
  function startBattlePhase(s0, kind) {
    let s = { ...s0, phase: "battle" };
    s.enemies = kind === "boss" ? [makeBoss(s.depth)] : encounterFor(s.depth);
    registerSeen(s.enemies, s.depth);
    // 残響レンズ: 開幕で全弱点を看破
    if (hasRelic(s, "sonarLens")) s.enemies = s.enemies.map((e) => ({ ...e, scanned: true }));
    // 与圧電池 / 予圧起動: 戦闘開始時に全スキルCD解除
    if (hasRelic(s, "pressureCell") || skillHas(meta?.skills, "primeSkill")) s.crew = s.crew.map((c) => c ? { ...c, cd: 0 } : c);
    // 始動時の呼吸: 戦闘開始時にHP回復
    // (map のコールバック内で代入先と同じ変数 s を書き換えると、その代入が握りつぶされる
    // 実バグ(bomb-item.test.jsx で回帰済み)と同じ形になるため、新しい配列の計算と
    // s へのログ/フロート積み上げを完全に分離してから、最後に一度だけ s.crew を差し替える)。
    const bsh = skillEffectTotal(meta?.skills, "battleStartHeal");
    if (bsh > 0) {
      const newCrew = [];
      for (const c of s.crew) {
        if (!c || c.down) { newCrew.push(c); continue; }
        const amt = Math.round(c.maxHp * bsh);
        if (amt <= 0) { newCrew.push(c); continue; }
        s = addFloat(s, c.id, `回復+${amt}`, "var(--ok)", 16);
        s = pushLog(s, `${c.name}のHPが${amt}回復した。`);
        newCrew.push({ ...c, hp: Math.min(c.maxHp, c.hp + amt) });
      }
      s = { ...s, crew: newCrew };
    }
    s.crew = s.crew.map((c) => c ? { ...c, guard: 0 } : c);
    s.guardTurns = 0;
    s.turnIdx = firstActive(s.crew, -1);
    s.turn = 1;
    s = pushLog(s, "【戦闘開始】");
    s = pushLog(s, kind === "boss" ? `── ${ZONES[zoneOf(s.depth)].boss.name} を捕捉。` : "反応あり。交戦を開始する。", kind === "boss");
    if (s.enemies.some((e) => e.anomaly)) s = pushLog(s, "……未知の反応。異常個体が混ざっている!", true);
    s = pushLog(s, `── ターン${s.turn} ──`);
    return s;
  }
  // 「準備」フェーズから戦闘を開始する
  const beginBattle = withAdvanceLock(() => setG((s) => {
    if (s.phase !== "prep") return s;
    return startBattlePhase(s, s.nodes[s.node]);
  }));
  const firstActive = (crew, from) => {
    for (let i = from + 1; i < crew.length; i++) if (crew[i] && !crew[i].down) return i;
    return -1;
  };

  function nextNode(s0) {
    let s = { ...s0 };
    if (s.node + 1 < s.nodes.length) { s.node += 1; return enterNode(s); }
    const nd = s.depth + 1;
    if (nd > 100) return s;
    s.depth = nd; s.node = 0; s.nodes = layerNodes(nd, skillEffectTotal(meta?.skills, "signalRate"));
    if (layerOf(nd) === 1) s = pushLog(s, `海域 ${zoneOf(nd) + 1}「${ZONES[zoneOf(nd)].name}」へ到達。深度 ${depthMeters(nd)}m。`, true);
    else s = pushLog(s, `深度 ${depthMeters(nd)}m。水圧が増していく。`);
    return enterNode(s);
  }

  /* ---------- ダメージ計算 ---------- */
  function strike(enemy, atk, dmgType, mult, s, scannedRec) {
    let aff = 1, tag = null;
    const weakBonus = (hasRelic(s, "coilHeart") ? 0.25 : 0)
      + skillEffectTotal(meta?.skills, "weakMult");
    if (enemy.weak.includes(dmgType)) { aff = AFF_W + weakBonus; tag = "weak"; }
    else if (enemy.resist.includes(dmgType)) { aff = AFF_R; tag = "res"; }
    if (enemy.exposed > 0) aff *= 1.25;
    const elemPct = skillEffectTotal(meta?.skills, "elemDmg", (e) => e.element === dmgType);
    const allPct = skillEffectTotal(meta?.skills, "allDmgPct");
    const dmg = Math.max(1, Math.round(atk * mult * aff * (1 + elemPct + allPct) * rnd(0.92, 1.08)) - enemy.def);
    enemy.hp = Math.max(0, enemy.hp - dmg);
    if (tag && enemy.bookId && !enemy.anomaly) {
      const rec = scannedRec[enemy.bookId] || (scannedRec[enemy.bookId] = { w: [], r: [] });
      const list = tag === "weak" ? rec.w : rec.r;
      if (!list.includes(dmgType)) list.push(dmgType);
    }
    return { dmg, tag };
  }
  const fLabel = (r) => r.tag === "weak" ? `弱点 ${r.dmg}` : r.tag === "res" ? `耐性 ${r.dmg}` : `${r.dmg}`;
  const fColor = (r) => r.tag === "weak" ? "var(--amber)" : r.tag === "res" ? "var(--ink-dimmer)" : "var(--ink)";

  /* ---------- クルーの行動 ---------- */
  async function act(useSkill, targetId, allyId) {
    if (actLockRef.current) return; // 同一ターン内での二重発火をここで確実に止める
    const s0 = gRef.current;
    if (s0.busy || s0.phase !== "battle") return;
    const c = s0.crew[s0.turnIdx];
    if (!c || c.down) return;
    const t = CREW_TYPES[c.type];
    if (useSkill && c.cd > 0) return;
    actLockRef.current = true;
    try {

    // ネイティブへ行動SEを要求(医療士の回復技は heal、それ以外は attack)
    playSE(useSkill && c.type === "medic" ? "heal" : "attack");

    let s = { ...s0, busy: true, aiming: null, allyAim: null, healPick: null, pendingSkill: false };
    const enemies = s.enemies.map((e) => ({ ...e }));
    // 空席(null)は必ず null のまま保つ({...null} は {} を作ってしまい、
    // 以後 Boolean 判定で「実在するクルー」と誤認されて落ちる原因になる)
    let crew = s.crew.map((x) => x ? { ...x } : x);
    const scannedRec = JSON.parse(JSON.stringify(meta.scanned || {}));
    const atk = crewAtk(c, s);
    const floats = [];
    // 敵は同名の個体が複数いることがあるため、名前だけでは区別できない。画面上の並び順
    // (enemies配列のインデックス)で「敵1」「敵2」…とログに残す。
    const enemyTag = (id) => {
      const idx = enemies.findIndex((e) => e.id === id);
      return idx >= 0 ? `敵${idx + 1}` : "敵";
    };
    const F = (id, r) => {
      floats.push({ key: uid(), target: id, text: fLabel(r), color: fColor(r), size: r.tag === "weak" ? 22 : 18, t: Date.now() });
      s = pushLog(s, `${enemyTag(id)}に${r.dmg}ダメージを与えた。`);
    };
    const alive = () => enemies.filter((e) => e.hp > 0);
    let target = enemies.find((e) => e.id === targetId && e.hp > 0) || alive()[0];

    if (!useSkill) {
      // 通常攻撃
      if (!target) { setG({ ...s, busy: false }); return; }
      const r = strike(target, atk, t.dmg, 1.0, s, scannedRec); F(target.id, r);
      // 毒腺フィン: 25%で毒付与
      if (hasRelic(s, "toxinFin") && target.hp > 0 && !target.poisoned && Math.random() < 0.25) {
        target.poisoned = 3;
        floats.push({ key: uid(), target: target.id, text: "毒", color: "#9f9", size: 14, t: Date.now() });
      }
      s = pushLog(s, `${c.name}の攻撃。`);
    } else {
      switch (c.type) {
        case "harpoon": {
          if (!target) break;
          const r = strike(target, atk, t.dmg, 2.3, s, scannedRec); F(target.id, r);
          target.def = Math.max(0, target.def - 3);
          floats.push({ key: uid(), target: target.id, text: "装甲-3", color: "var(--ink-dim)", size: 12, t: Date.now() });
          s = pushLog(s, `${c.name}の貫通銛が装甲を抉る。`, true);
          break;
        }
        case "sweeper": {
          for (const e of alive()) { const r = strike(e, atk, t.dmg, 1.1, s, scannedRec); F(e.id, r); }
          s = pushLog(s, `${c.name}の掃海波が広がる。`, true);
          break;
        }
        case "cabler": {
          if (!target) break;
          const r = strike(target, atk, t.dmg, 1.4, s, scannedRec); F(target.id, r);
          // 麻痺耐性(paralyzeImmune)が立っている間は麻痺が乗らない(はめ殺し対策)。
          if (!target.paralyzeImmune) {
            target.paralyzed = 2;
            s = pushLog(s, `${c.name}の連鎖放電。対象が麻痺した。`, true);
          } else {
            s = pushLog(s, `${c.name}の連鎖放電。対象は麻痺耐性で効かなかった。`, true);
          }
          const idx = enemies.findIndex((e) => e.id === target.id);
          const near = enemies.slice(idx + 1).find((e) => e.hp > 0) || enemies.slice(0, idx).reverse().find((e) => e.hp > 0);
          if (near) { const r2 = strike(near, atk, t.dmg, 0.8, s, scannedRec); F(near.id, r2); }
          break;
        }
        case "thermal": {
          if (!target) break;
          const r = strike(target, atk, t.dmg, 1.8, s, scannedRec); F(target.id, r);
          target.burning = 3; target.burnDmg = Math.max(3, Math.round(atk * 0.35));
          s = pushLog(s, `${c.name}が炉心を開放。対象が燃え続ける。`, true);
          break;
        }
        case "medic": {
          // プレイヤーが選んだ味方を回復(未指定なら最も傷ついた味方/戦闘不能を優先)
          const cand = crew.filter(Boolean);
          const downed = cand.filter((x) => x.down);
          // HP満タンの相手は対象にしない(指定IDが満タンでも無視して自動選択にフォールバック)
          const tgt = (allyId && cand.find((x) => x.id === allyId && x.hp < x.maxHp))
            || downed[0] || cand.filter((x) => !x.down && x.hp < x.maxHp).sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
          if (tgt) {
            const wasDown = tgt.down;
            const amt = wasDown
              ? Math.round(tgt.maxHp * (hasRelic(s, "blackBox") ? 0.5 : 0.3))
              : Math.round(tgt.maxHp * 0.55);
            tgt.down = false;
            tgt.hp = Math.min(tgt.maxHp, (wasDown ? 0 : tgt.hp) + amt);
            floats.push({ key: uid(), target: tgt.id, text: `回復+${amt}`, color: "var(--ok)", size: 20, t: Date.now() });
            s = pushLog(s, wasDown ? `${c.name}が${tgt.name}を蘇生した!` : `${c.name}が${tgt.name}を縫合した。`, true);
            s = pushLog(s, `${tgt.name}のHPが${amt}回復した。`);
          }
          break;
        }
        case "scanner": {
          for (const e of enemies) if (e.hp > 0) { e.scanned = true; e.exposed = 3; }
          s = pushLog(s, `${c.name}の全域走査。敵の弱点が露わになった。`, true);
          break;
        }
        case "diver": {
          s.guardTurns = 2;
          crew = crew.map((x) => x ? { ...x, guard: 2 } : x);
          s = pushLog(s, `${c.name}が耐圧殻を展開。隊の被害を抑える。`, true);
          break;
        }
        case "resonator": {
          for (const e of alive()) { const r = strike(e, atk, t.dmg, 0.9, s, scannedRec); F(e.id, r); }
          crew = crew.map((x) => x ? { ...x, buffAtk: 0.30, buffT: 3 } : x);
          s = pushLog(s, `${c.name}の深層共鳴。隊全体が高揚する。`, true);
          break;
        }
      }
    }

    // スキル使用でクールダウン
    crew = crew.map((x) => x && x.id === c.id && useSkill ? { ...x, cd: skillCd(s, t.skill.cd) + 1 } : x);
    s.enemies = enemies; s.crew = crew;
    s.floats = [...s.floats, ...floats];
    s.hitId = target ? target.id : null;
    setG(s);
    setMeta((prev) => { const m2 = { ...prev, scanned: scannedRec }; saveMeta(m2); return m2; });
    await sleep(560);
    await afterAction();
    } finally {
      actLockRef.current = false;
    }
  }

  // 行動後: 撃破判定 → 次のクルー or 敵ターン
  async function afterAction() {
    let s = gRef.current;
    const killed = s.enemies.filter((e) => e.hp <= 0 && !e.counted);
    if (killed.length) {
      let n = { ...s, enemies: s.enemies.map((e) => e.hp <= 0 ? { ...e, counted: true } : e) };
      const specChance = skillEffectTotal(meta?.skills, "killSpecimen");
      let gotSpec = null;
      for (const k of killed) {
        if (k.anomaly) n = pushLog(n, `${k.name}を捕獲! 異層コアが零れ落ちる。`, true);
        else if (k.boss) n = pushLog(n, `${k.name}、沈黙。`, true);
        else {
          n = pushLog(n, `${k.name}を撃破。`);
          // 観測者の記録術: 撃破時にまれに標本採取
          if (specChance > 0 && k.bookId && Math.random() < specChance) gotSpec = k.bookId;
        }
      }
      if (gotSpec) {
        const prog = awardSpecimen(gotSpec);
        n = pushLog(n, `破片から標本を採取した。${specimenProgressText(prog)}`, true);
      }
      setG(n); s = n; await sleep(380);
    }
    if (s.enemies.filter((e) => e.hp > 0).length === 0) return victory(s.enemies);
    // 次に動けるクルー
    const next = firstActive(s.crew, s.turnIdx);
    if (next >= 0) { setG({ ...s, turnIdx: next, busy: false }); return; }
    await enemyPhase();
  }

  /* ---------- 敵ターン ---------- */
  async function enemyPhase() {
    let s = { ...gRef.current };
    let enemies = s.enemies.map((e) => ({ ...e }));
    let crew = s.crew.map((c) => c ? { ...c } : c);
    const gillHalf = hasRelic(s, "gillFilter");
    const finCut = hasRelic(s, "pressureFin");

    // 踏みとどまる意志: 敵ターン開始時にHPが50%以上のクルーは、このターン1回だけ致死ダメージをHP1で耐える
    const endureReady = new Set(skillEffectTotal(meta?.skills, "endure") > 0
      ? crew.filter((c) => c && !c.down && c.hp >= c.maxHp * 0.5).map((c) => c.id) : []);
    const count = enemies.length;
    for (let i = 0; i < count; i++) {
      const e = enemies[i];
      if (!e || e.hp <= 0) continue;
      if (crew.every((c) => !c || c.down)) break;

      // 異常個体は攻撃せず、時間切れで逃走
      if (e.anomaly) {
        e.fleeIn -= 1;
        if (e.fleeIn <= 0) { e.hp = 0; e.counted = true; e.fled = true; s = pushLog(s, `${e.name}は深部へ消えていった……`); }
        else s = pushLog(s, `${e.name}は不安定に明滅している(残り${e.fleeIn})。`);
        continue;
      }
      // 麻痺で行動不能
      if (e.paralyzed > 0) {
        e.paralyzed -= 1;
        // 麻痺が解けた直後は2ターン、麻痺耐性がついて再び麻痺しない(はめ殺し対策)。
        // 連鎖放電の再使用間隔だけに頼ると、クールダウン短縮(反響機関)や複数の電纜技師を
        // 交代で使い回すことで永久に行動不能へ固定できてしまうため、対象側にも
        // クールダウンとは独立した猶予を必ず設ける。
        if (e.paralyzed <= 0) e.paralyzeImmune = 2;
        s = pushLog(s, `${e.name}は麻痺して動けない。`);
        setG({ ...s, enemies, crew }); await sleep(280);
        s = gRef.current; enemies = s.enemies.map((x) => ({ ...x })); crew = s.crew.map((c) => c ? { ...c } : c);
        continue;
      }
      // ボスの行動
      if (e.boss) {
        const maxS = e.final ? 2 : 1;
        if (e.hp < e.maxHp * (e.summoned === 0 ? 0.55 : 0.25) && e.summoned < maxS && enemies.filter((x) => x.hp > 0).length < 3) {
          e.summoned += 1;
          enemies = [...enemies, ...e.summons.map((id) => makeEnemy(id, s.depth))];
          s = pushLog(s, e.summonLine, true);
          setG({ ...s, enemies, crew }); await sleep(400);
          s = gRef.current; enemies = s.enemies.map((x) => ({ ...x })); crew = s.crew.map((c) => c ? { ...c } : c);
          continue;
        }
        if (!e.charge && Math.random() < 0.28) {
          e.charge = true; s = pushLog(s, `${e.chargeLine}(次は大技)`, true);
          setG({ ...s, enemies, crew }); await sleep(400);
          s = gRef.current; enemies = s.enemies.map((x) => ({ ...x })); crew = s.crew.map((c) => c ? { ...c } : c);
          continue;
        }
      }
      // 標的: 生存クルーからランダム(HPが低い者をやや狙う)
      const living = crew.filter((c) => c && !c.down);
      if (living.length === 0) break;
      const tgt = Math.random() < 0.35
        ? living.slice().sort((a, b) => a.hp - b.hp)[0]
        : pick(living);
      let dmg = Math.max(1, Math.round(e.atk * rnd(0.9, 1.1)) - crewDef(tgt));
      if (e.boss && e.charge) { dmg = Math.round(dmg * 2); e.charge = false; s = pushLog(s, e.bigLine, true); }
      if (tgt.guard > 0 || s.guardTurns > 0) dmg = Math.max(1, Math.round(dmg * 0.65));
      if (s.coolTurns > 0) dmg = Math.max(1, Math.round(dmg * 0.6));
      if (finCut) dmg = Math.max(1, dmg - 1);
      // スキル 被弾の軽減 / 土壇場の粘り
      const flatDR = skillEffectTotal(meta?.skills, "flatDR");
      if (flatDR > 0) dmg = Math.max(1, dmg - flatDR);
      const lowHpDR = skillEffectTotal(meta?.skills, "lowHpDR");
      if (lowHpDR > 0 && tgt.hp <= tgt.maxHp * 0.25) dmg = Math.max(1, Math.round(dmg * (1 - lowHpDR)));
      // 焼き入れ殻: 1撃の被ダメ上限15
      if (hasRelic(s, "temperedHull")) dmg = Math.min(dmg, 15);
      if (tgt.hp - dmg <= 0 && endureReady.has(tgt.id)) {
        endureReady.delete(tgt.id);
        dmg = Math.max(0, tgt.hp - 1);
        s = pushLog(s, `${tgt.name}は踏みとどまった! HPが1残った。`, true);
      }
      tgt.hp = Math.max(0, tgt.hp - dmg);
      s = addFloat(s, tgt.id, `${dmg}`, "var(--danger)", 19);
      s = pushLog(s, `${tgt.name}が${dmg}ダメージを受けた。`);
      if (e.drain) {
        const rec = Math.round(dmg / 2);
        e.hp = Math.min(e.maxHp, e.hp + rec);
        s = addFloat(s, e.id, `回復+${rec}`, "var(--ok)", 14);
        s = pushLog(s, `${e.name}のHPが${rec}回復した。`);
      }
      if (e.burn && Math.random() < 0.35 && !tgt.burning) { tgt.burning = 2; s = pushLog(s, `${tgt.name}が燃えている!`); }
      if (e.poison && Math.random() < 0.35 && !tgt.poisoned) { tgt.poisoned = 3; s = pushLog(s, `${tgt.name}が毒に侵された。`); }
      if (tgt.hp <= 0) {
        tgt.down = true; tgt.cd = 0;
        s = pushLog(s, `${tgt.name}が戦闘不能になった。`, true);
        // 乗員通信網: 仲間が倒れると生存者の攻撃力+20%
        if (hasRelic(s, "crewNet")) {
          crew = crew.map((c) => (c && !c.down && c.id !== tgt.id) ? { ...c, buffAtk: (c.buffAtk || 0) + 0.2, buffT: Math.max(c.buffT || 0, 3) } : c);
          s = pushLog(s, "乗員通信網が応答した。生存者の戦意が高まっている。", true);
        }
      }
      crew = crew.map((c) => c && c.id === tgt.id ? tgt : c);
      setG({ ...s, enemies, crew }); await sleep(340);
      s = gRef.current; enemies = s.enemies.map((x) => ({ ...x })); crew = s.crew.map((c) => c ? { ...c } : c);
    }

    // ターン終了処理
    const half = hasRelic(s, "gillFilter") || skillHas(meta?.skills, "dotHalf");
    for (const e of enemies) {
      if (e.hp > 0 && e.burning > 0) {
        const d = e.burnDmg || 4;
        e.hp = Math.max(0, e.hp - d); e.burning -= 1;
        s = { ...s, floats: [...s.floats, { key: uid(), target: e.id, text: `燃焼 ${d}`, color: "#ff9b6b", size: 15, t: Date.now() }] };
      }
      if (e.exposed > 0) e.exposed -= 1;
      if (e.paralyzeImmune > 0) e.paralyzeImmune -= 1;
    }
    crew = crew.map((c) => {
      if (!c) return c;
      const n = { ...c };
      if (!n.down && n.burning > 0) {
        const d = Math.max(1, Math.round(n.maxHp * (half ? 0.03 : 0.06)));
        n.hp = Math.max(0, n.hp - d); n.burning -= 1;
        if (n.hp <= 0) n.down = true;
      }
      if (!n.down && n.poisoned > 0) {
        const d = Math.max(1, Math.round(n.maxHp * (half ? 0.025 : 0.05)));
        n.hp = Math.max(0, n.hp - d); n.poisoned -= 1;
        if (n.hp <= 0) n.down = true;
      }
      if (n.cd > 0) n.cd -= 1;
      if (n.guard > 0) n.guard -= 1;
      if (n.buffT > 0) { n.buffT -= 1; if (n.buffT <= 0) n.buffAtk = 0; }
      return n;
    });
    if (s.guardTurns > 0) s.guardTurns -= 1;
    if (s.coolTurns > 0) s.coolTurns -= 1;

    // 撃破された敵の掃除と全滅判定
    const stillAlive = enemies.filter((e) => e.hp > 0).length > 0;
    if (crew.every((c) => !c || c.down)) {
      const downed = { ...s, enemies, crew, busy: false };
      // 復活オファー: リワード残あり & この潜航で未使用
      if (rewardAdUsesLeft(meta, "revive") > 0 && !s.reviveUsed && !meta.reviveUsedThisRun) {
        setG({ ...downed, phase: "reviveOffer" });
        return;
      }
      finalizeLost(downed);
      return;
    }
    if (!stillAlive) { setG({ ...s, enemies, crew, busy: false }); return victory(enemies); }
    const turn = (s.turn || 1) + 1;
    s = pushLog(s, `── ターン${turn} ──`);
    setG({ ...s, enemies, crew, busy: false, turnIdx: firstActive(crew, -1), turn });
  }

  // 全滅を確定して浮上画面へ(復活を使わなかった / 断った場合)
  function finalizeLost(s0) {
    const s = s0 || gRef.current;
    setMeta((prev) => {
      const m2 = { ...prev, deaths: prev.deaths + 1, bestDepth: Math.max(prev.bestDepth, s.depth) };
      saveMeta(m2);
      return m2;
    });
    native("progress", { event: "party_wipe", depth: s.depth });
    const dead = { ...s, enemies: s.enemies, crew: s.crew, busy: false };
    setG({ ...dead, phase: "lost", pick: recommendStorage(dead, storageN) });
    showInterstitial("wipe");
  }

  /* ---------- 戦利品 ---------- */
  function rollDrops(enemies, depth, s) {
    const out = [];
    const luck = skillEffectTotal(metaRef.current?.skills, "dropLuck");
    for (const e of enemies) {
      if (e.anomaly) {
        out.push(makeConsumable("core"));
        // 異常個体は特別な報酬だが、レア度は据え置きの固定ではなく深度で変わる
        // (rollRarity に委ねる。低階層の周回で確定に近い形の最高レアが出ないように)
        out.push(makeGear(depth, { luck: 2 + luck }));
        out.push(makeConsumable("specimen", { bookId: `mutant${zoneOf(depth)}` }));
        continue;
      }
      if (e.boss) {
        out.push(makeConsumable("shard"));
        out.push(makeGear(depth, { rarity: "deep", luck: 1 + luck }));
        const rel = makeRelic([...(s.relics || []), ...out], { luck: 1, depth });
        if (rel) out.push(rel);
        continue;
      }
      const r = Math.random();
      if (r < 0.42) out.push(makeConsumable());
      else if (r < 0.66) out.push(makeGear(depth, { luck }));
    }
    if (out.length === 0) out.push(makeConsumable());
    return out;
  }

  async function victory(enemies, s0) {
    // s0 を渡すと gRef.current の代わりにそちらを使う(タスキル復帰時、まだ描画が
    // 済んでおらず gRef.current が更新されていない状態からでも呼び直せるようにするため)。
    const s = s0 || gRef.current;
    const isBoss = enemies.some((e) => e.boss);
    const caughtAnomaly = enemies.some((e) => e.anomaly && e.hp <= 0 && !e.fled);
    const drops = rollDrops(enemies.filter((e) => e.hp <= 0 && !e.fled), s.depth, s);
    let n = { ...s, busy: false, phase: "spoils", drops, aiming: null, pendingSkill: false };
    // 戦闘を進めるごとに、たまに少しだけ鉄屑が手に入るようにする
    // (行商に着いた時に交換できるものが何も無い、という状況を減らすため)
    if (Math.random() < 0.35) {
      n.scrapCount = (n.scrapCount || 0) + 1;
      n = pushLog(n, "鉄屑を1個回収した。");
    }
    // 異常個体を捕獲すると残響片 +1
    if (caughtAnomaly) {
      setMeta((prev) => {
        const m = { ...prev, shards: (prev.shards || 0) + 1 };
        saveMeta(m);
        return m;
      });
      n = pushLog(n, "異常個体を捕獲。残響片が零れ落ちた。", true);
    }
    // 深海記憶体: 勝利後にHP最少のクルーを8%回復
    if (hasRelic(n, "deepMemory")) {
      const cand = n.crew.filter((c) => c && !c.down).sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
      if (cand) {
        const amt = Math.round(cand.maxHp * 0.08);
        n.crew = n.crew.map((c) => c && c.id === cand.id ? { ...c, hp: Math.min(c.maxHp, c.hp + amt) } : c);
        n = { ...n, floats: [...(n.floats || []), { key: uid(), target: cand.id, text: `回復+${amt}`, color: "var(--ok)", size: 16, t: Date.now() }] };
        n = pushLog(n, `${cand.name}のHPが${amt}回復した。`);
      }
    }
    if (isBoss) {
      // ボス討伐という達成感のあるタイミングでレビューを促す(表示するかはOS側が判断・制御する)
      native("requestReview", {});
      const zone = zoneOf(s.depth) + 1;
      // 「海域を選んで再挑戦」は、その海域の10階層さえ抜ければ何度でも同じボスへ
      // 挑める(他の海域を経由する必要が無い)。checkpoint(=クリア済みの最先端)より
      // 手前の海域を倒した場合は「既に初回撃破済みの再挑戦」とみなし、大きな永続報酬
      // (満額の残響片)は初回撃破時にしか渡さない(再挑戦でも残響片をわずかに得られる
      // 程度は残す)。
      // 永続ステータス(継承枠・最大HP)は、ボスを倒すだけで際限なく伸び続けると
      // スキルツリーや装備の意味が薄れてしまうため、ボス撃破からは一切増やさない。
      // 継承枠(carrySlots)はレアアイテム(異層コア)からのみ、最大HPはスキルツリー
      // からのみ増える形に統一し、代わりに初回撃破の残響片(スキルツリー通貨)を
      // 大きく増額して報酬としての達成感を確保する。
      const firstClear = zone >= (meta?.checkpoint || 1);
      if (zone >= 10) {
        const keep = [
          ...s.crew.filter(Boolean).flatMap((c) => [c.gear, c.weapon]).filter(Boolean),
          ...(s.relics || []), ...s.bag, ...drops,
        ].sort((a, b) => (b.locked ? 1 : 0) - (a.locked ? 1 : 0));
        setMeta((prev) => {
          const m2 = {
            ...prev, clears: prev.clears + 1,
            bestDepth: 100, carried: keep.slice(0, carryN + 1),
            shards: (prev.shards || 0) + (firstClear ? 10 : 2),
          };
          saveMeta(m2);
          return m2;
        });
        native("progress", { event: "depth_stage_clear_10" });
        n.phase = "ending";
      } else {
        const gain = zoneCompShards(s.depth);
        setMeta((prev) => {
          const m2 = {
            ...prev,
            bestDepth: Math.max(prev.bestDepth, s.depth),
            checkpoint: Math.max(prev.checkpoint || 1, zone + 1),
            shards: (prev.shards || 0) + (firstClear ? 6 + gain : 1),
            ...(gain > 0 ? { zoneCompRewarded: { ...(prev.zoneCompRewarded || {}), [zoneOf(s.depth)]: true } } : {}),
          };
          saveMeta(m2);
          return m2;
        });
        native("progress", { event: "zone_clear", zone });
        native("progress", { event: `depth_stage_clear_${zone}` });
        n.phase = "zoneClear";
        n.zoneShards = firstClear ? 6 + gain : 1;
        n.zoneCompBonus = gain;
      }
    }
    setG(n);
  }

  /* ---------- 収集: 拾う ---------- */
  function takePure(s, item) {
    // 同じ item を指す回収を二重に実行しても付与されないよう、
    // 「まだ現在の drops に残っているか」を必ずここで(= setG の updater 内)確認する。
    // 連打で take() が同じ item に対し2回呼ばれても、2回目はここで弾かれる。
    if (!s.drops.some((d) => d.id === item.id)) return s;
    let n = { ...s, drops: s.drops.filter((d) => d.id !== item.id), full: false };
    // 標本 / 残響片 は収納せず即時に反映する
    if (item.itemId === "specimen") {
      const prog = item.bookId ? awardSpecimen(item.bookId) : null;
      return pushLog(n, `標本を採取した。${specimenProgressText(prog) || "観測記録が進む。"}`, true);
    }
    // 記憶結晶/残響片は即時に残響片(スキルツリーの通貨)へ変換する。
    if (CONSUMABLES[item.itemId]?.kind === "shards") {
      // 「回収してすべて」で同一バッチ内に複数の残響片系アイテムが含まれると、この分岐が
      // 再描画を挟まず連続で呼ばれる。functional updater で必ず積み上げること(取りこぼし防止)。
      const gain = CONSUMABLES[item.itemId].shardValue || 1;
      setMeta((prev) => {
        const m = { ...prev, shards: (prev.shards || 0) + gain };
        saveMeta(m);
        return m;
      });
      return pushLog(n, `${item.name}を回収した。残響片+${gain}。`, true);
    }
    // 異層コアは継承枠(全滅時に持ち帰れる装備・消耗品の数)を永続的に+1する唯一の手段。
    // ボス撃破ではこの枠を増やさない方針にしたため、収納を経由せずここで即時反映する。
    if (CONSUMABLES[item.itemId]?.kind === "carrySlot") {
      setMeta((prev) => {
        const m = { ...prev, carrySlots: (prev.carrySlots || 1) + 1 };
        saveMeta(m);
        return m;
      });
      return pushLog(n, `${item.name}を回収した。継承枠が永続的に+1された。`, true);
    }
    // 保護設定(レア以上/回復品)に該当する物は、収納・遺物枠に入る時点で自動的にロックする
    if (matchesAutoLock(item)) item = { ...item, locked: true };
    // 装備(gear)は自動装着しない。収納に入れ、装備画面で任意のクルーに装着する
    if (item.kind === "relic") {
      if ((n.relics || []).length < relicN) {
        n.relics = [...(n.relics || []), item];
        n = refreshHp(n);
        return pushLog(n, `遺物「${item.name}」を確保した。`, true);
      }
    }
    if (n.bag.length >= bagCap) return { ...s, full: true };
    n.bag = [...n.bag, item];
    return n;
  }
  // 装備/遺物の変動を最大HPへ反映
  // 差分は必ず両方向(増減とも)に適用すること。上げ幅だけ加算して下げ幅を無視すると、
  // 高HP装備の着脱を繰り返すだけで現在HPが際限なく回復する無料回復バグになる。
  function refreshHp(s) {
    const crew = s.crew.map((c) => {
      if (!c) return c;
      const mx = crewMaxHp(c, s);
      const diff = mx - c.maxHp;
      return { ...c, maxHp: mx, hp: c.down ? c.hp : clamp(c.hp + diff, 0, mx) };
    });
    return { ...s, crew };
  }
  const take = (item) => setG((s) => takePure(s, item));
  function takeAllPure(s) {
    let n = { ...s, full: false };
    const ordered = [...n.drops].sort((a, b) => (a.kind === "item" ? 1 : 0) - (b.kind === "item" ? 1 : 0));
    for (const d of ordered) n = takePure(n, d);
    return n;
  }
  const takeAll = () => setG((s) => takeAllPure(s));
  const takeAllGo = withAdvanceLock(() => setG((s) => {
    const n = takeAllPure(s);
    return n.drops.length === 0 ? nextNode({ ...n, confirm: null }) : n;
  }));

  const proceed = withAdvanceLock(() => {
    setG((s) => {
      if (s.drops.length > 0) return { ...s, confirm: "drops", full: false };
      if ((s.phase === "wreck" || s.phase === "supply") && !s.eventDone) return { ...s, confirm: "event" };
      if (s.phase === "signal" && s.recruit && !s.eventDone) return { ...s, confirm: "signal" };
      return nextNode({ ...s, confirm: null, full: false });
    });
  });
  const leaveNow = withAdvanceLock(() => setG((s) => nextNode({ ...s, drops: [], confirm: null, full: false, eventDone: true })));

  /* ---- アイテムのロック(旧・保護設定を統合) ----
     以前は「個別ロック」と「保護設定(レア以上/回復品を自動で保護)」が別系統で、
     保護設定に該当するアイテムはロックボタンを押しても(it.locked を反転させても)
     破棄・スクラップの禁止が解けなかった。ここでは保護設定を「取得した瞬間に
     自動でロックを ON にするだけ」の機能に一本化し、以後の可否判定はすべて
     it.locked の一点だけで行う。これにより、保護設定に該当する物でもロック
     ボタンをもう一度押せばその個体だけ解除できる(設定自体は ON のまま)。 */
  const isHighRarity = (it) => rarityIdx(it.rarity) >= rarityIdx("rare");
  const isHealItem = (it) => it.kind === "item" && ["medkit", "serum", "coolant"].includes(it.itemId);
  // 保護設定に該当するか(自動ロックの対象かどうかの判定にのみ使う)
  const matchesAutoLock = (it, m = meta) =>
    (m?.protectRare && isHighRarity(it)) || (m?.protectHeals && isHealItem(it));
  // 保護設定は「これから拾う物」にだけ効く(設定を切り替えても、今持っている物のロックは変えない)。
  const toggleLock = (id) => setG((s) => ({
    ...s,
    bag: (s.bag || []).map((x) => x.id === id ? { ...x, locked: !x.locked } : x),
    relics: (s.relics || []).map((r) => r.id === id ? { ...r, locked: !r.locked } : r),
    crew: (s.crew || []).map((c) => c && c.gear && c.gear.id === id ? { ...c, gear: { ...c.gear, locked: !c.gear.locked } } : c),
  }));
  const DiscardRow = ({ it }) => (
    <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
      <button className={`sd-lock-btn ${it.locked ? "on" : ""}`} onClick={() => toggleLock(it.id)}>
        {it.locked ? <Lock size={10} /> : <Unlock size={10} />}{it.locked ? "解除" : "ロック"}
      </button>
      <button className="sd-btn sm" disabled={it.locked}
        style={{ flex: 1, fontSize: 9.5, color: it.locked ? "var(--ink-dimmer)" : "var(--danger)",
          borderColor: it.locked ? "var(--line)" : "rgba(255,123,107,.4)", opacity: it.locked ? .5 : 1 }}
        onClick={() => {
          if (isHighRarity(it)) { setG((s) => ({ ...s, dangerConfirm: { kind: "discard", itemId: it.id } })); return; }
          setG((s) => ({ ...s, bag: s.bag.filter((x) => x.id !== it.id) }));
        }}>
        {it.locked ? "ロック中" : "破棄"}
      </button>
    </div>
  );

  // 装備の比較ヒント
  function gearHint(item, s = g) {
    if (item.kind !== "gear") return null;
    // suit/module は c.gear、weapon は c.weapon で「空き枠があるか」「今の最弱より強いか」を見る
    const field = GEAR_SLOT_FIELD[item.slot] || "gear";
    const equipped = s.crew.filter((c) => c && c[field]).map((c) => c[field]);
    if (s.crew.some((c) => c && !c[field])) return { text: "空き枠に装着できます", up: true };
    if (equipped.length === 0) return null;
    const score = (x) => x.hp + x.atk * 2 + x.def * 3;
    const worst = Math.min(...equipped.map(score));
    return score(item) > worst
      ? { text: field === "weapon" ? `↑ 最弱の武器より優秀` : `↑ 最弱の装備より優秀`, up: true }
      : { text: field === "weapon" ? `↓ 現状の武器の方が良い` : `↓ 現状の装備の方が良い`, down: true };
  }
  // 装備1つのステータス補正を項目ごとに({label, value})。0の項目は含めない。
  function gearStatParts(gear) {
    if (!gear) return [];
    const parts = [];
    if (gear.hp) parts.push({ label: "HP", value: gear.hp });
    if (gear.atk) parts.push({ label: "攻", value: gear.atk });
    if (gear.def) parts.push({ label: "防", value: gear.def });
    return parts;
  }
  // 今の装備(oldGear)から候補(newGear)に替えた時の増減(装着プレビュー用)。
  // 各項目を個別に見て、増える(緑)/減る(赤)を項目ごとに色分けできるようにする。
  function gearDeltaParts(newGear, oldGear) {
    const dHp = (newGear?.hp || 0) - (oldGear?.hp || 0);
    const dAtk = (newGear?.atk || 0) - (oldGear?.atk || 0);
    const dDef = (newGear?.def || 0) - (oldGear?.def || 0);
    const parts = [];
    if (dHp) parts.push({ label: "HP", value: dHp });
    if (dAtk) parts.push({ label: "攻", value: dAtk });
    if (dDef) parts.push({ label: "防", value: dDef });
    return parts;
  }
  // 数値の増減を色分けして描画する共通パーツ(増: 緑 / 減: 赤)
  function StatDelta({ parts, emptyText = "変化なし" }) {
    if (!parts.length) return <span style={{ color: "var(--ink-dimmer)" }}>{emptyText}</span>;
    return parts.map((p, i) => (
      <span key={p.label} style={{ color: p.value > 0 ? "var(--ok)" : "var(--danger)", marginRight: i < parts.length - 1 ? 8 : 0 }}>
        {p.label}{p.value > 0 ? `+${p.value}` : p.value}
      </span>
    ));
  }

  /* ---------- 消耗品 ---------- */
  async function consumeItem(item) {
    const s0 = gRef.current;
    const inBattle = s0.phase === "battle";
    if (inBattle && s0.busy) return;
    const c = CONSUMABLES[item.itemId];
    if (c.kind === "bomb" && !inBattle) return;
    // 二重適用・多重タップ防止: すでに収納から消えているアイテムは無視する
    if (!s0.bag.some((x) => x.id === item.id)) return;
    // 回復キットは対象をプレイヤーに選ばせる(戦闘中/外どちらも)。
    // 対象選択オーバーレイを出すため一旦収納は閉じる(戦闘外なら選択後に再度開く)。
    if (c.kind === "heal") {
      const sh = { ...s0, bagOpen: false, healPick: item };
      setG(sh);
      gRef.current = sh; // 同一ティック内の連続呼び出しに備え、ref も即座に最新化する
      return;
    }

    // 戦闘中はすぐ閉じる。戦闘外はアイテム整理を続けられるよう収納を開いたままにする。
    let s = { ...s0, bagOpen: inBattle ? false : s0.bagOpen };
    s.bag = s.bag.filter((x) => x.id !== item.id);

    if (c.kind === "healAll") {
      playSE("heal");
      s = pushLog(s, `${c.label}を散布。隊が持ち直した。`, true);
      // map のコールバック内で s を書き換えず(実バグ回帰と同じ形になるため)、新しい配列を
      // 先に作ってから、ログ/フロートの積み上げは別のループで行う。
      const newCrew = [];
      for (const x of s.crew) {
        if (!x || x.down) { newCrew.push(x); continue; }
        const amt = Math.round(x.maxHp * c.power);
        if (amt > 0) {
          s = addFloat(s, x.id, `回復+${amt}`, "var(--ok)", 18);
          s = pushLog(s, `${x.name}のHPが${amt}回復した。`);
        }
        newCrew.push({ ...x, hp: Math.min(x.maxHp, x.hp + amt), burning: 0, poisoned: 0 });
      }
      s = { ...s, crew: newCrew };
    } else if (c.kind === "cd") {
      s.crew = s.crew.map((x) => x ? { ...x, cd: 0 } : x);
      s = pushLog(s, `${c.label}で全クルーの技が再使用可能になった。`, true);
    } else if (c.kind === "guard") {
      s.coolTurns = 2;
      s = pushLog(s, `${c.label}を展開。2ターン被害を抑える。`, true);
    } else if (c.kind === "bomb") {
      // 実バグ回帰: 以前は `s.enemies = s.enemies.map(e => { s = addFloat(s, ...); ... })` という
      // 形で、map のコールバック内で代入先と同じ変数 s を書き換えていた。JS の代入は
      // 「左辺(s.enemies の s)」を右辺の評価より先に確定させるため、コールバック内で
      // s を別オブジェクトへ差し替えても、s.enemies への代入はその「先に確定した古い s」
      // に対して行われてしまう。その後 `s = pushLog(s, ...)` で s がコールバック内で
      // 積み上がった(addFloat 由来の)方のオブジェクトに戻ってしまい、ダメージを反映した
      // 方のオブジェクトが握りつぶされていた。見た目は浮遊ダメージ数値が出るのに実際の
      // HP は一切減らない、という重大な不具合(=「使い所が少ない」の実態はほぼ無効化
      // されていたこと)。map で新しい配列を作る処理と、s を差し替える addFloat の呼び出しを
      // 完全に分離して修正する。
      const power = bombPower(s.depth);
      const newEnemies = s.enemies.map((e) => e.hp <= 0 ? e : { ...e, hp: Math.max(0, e.hp - power) });
      for (const e of s.enemies) {
        if (e.hp > 0) s = addFloat(s, e.id, `${power}`, "#ff9b6b", 21);
      }
      s = { ...s, enemies: newEnemies };
      s = pushLog(s, `${c.label}が炸裂した!`, true);
    } else if (c.kind === "shards") {
      // 本来は拾った瞬間に残響片へ変換され収納には入らないが、旧仕様のセーブ等で
      // 収納に紛れ込んでいた場合の保険。「使う」を押しても何も起きず消えるだけ、を防ぐ。
      const gain = c.shardValue || 1;
      setMeta((prev) => {
        const m = { ...prev, shards: (prev.shards || 0) + gain };
        saveMeta(m);
        return m;
      });
      s = pushLog(s, `${c.label}を分解した。残響片+${gain}。`, true);
    } else if (c.kind === "carrySlot") {
      // 同様に、異層コアが収納に紛れ込んでいた場合の保険
      setMeta((prev) => {
        const m = { ...prev, carrySlots: (prev.carrySlots || 1) + 1 };
        saveMeta(m);
        return m;
      });
      s = pushLog(s, `${c.label}を回収した。継承枠が永続的に+1された。`, true);
    } else if (c.kind === "specimen") {
      // 同様に、標本が収納に紛れ込んでいた場合の保険
      const prog = item.bookId ? awardSpecimen(item.bookId) : null;
      s = pushLog(s, `標本を記録した。${specimenProgressText(prog) || "観測記録が進む。"}`, true);
    }
    setG(s);
    gRef.current = s; // 異なる2つの消耗品をほぼ同時に使っても片方が後勝ちで消えないよう即座に最新化
    if (inBattle && (c.kind === "bomb" || c.kind === "heal" || c.kind === "healAll")) {
      // 攻撃・回復系はターンを消費する
      setG((x) => ({ ...x, busy: true }));
      await sleep(520);
      await afterAction();
    }
  }

  // 照準で選ばれた味方へ回復キットを使う
  async function applyHealItem(item, crewId) {
    const s0 = gRef.current;
    if (s0.busy) return;
    const inBattle = s0.phase === "battle";
    const c = CONSUMABLES[item.itemId];
    const tgt = s0.crew.find((x) => x && x.id === crewId);
    if (!c || !tgt || !s0.bag.some((x) => x.id === item.id)) return;
    const amt = Math.round(tgt.maxHp * c.power);
    playSE("heal");
    let s = { ...s0, healPick: null, allyAim: null, bag: s0.bag.filter((x) => x.id !== item.id) };
    s.crew = s.crew.map((x) => x && x.id === crewId
      ? { ...x, down: false, hp: Math.min(x.maxHp, (x.down ? 0 : x.hp) + amt) } : x);
    s = addFloat(s, crewId, `回復+${amt}`, "var(--ok)", 20);
    s = pushLog(s, `${tgt.name}に${c.label}を使用。`);
    s = pushLog(s, `${tgt.name}のHPが${amt}回復した。`);
    if (inBattle) {
      const sb = { ...s, busy: true };
      setG(sb);
      gRef.current = sb;
      await sleep(520);
      await afterAction();
    } else {
      // 戦闘外は対象選択オーバーレイを閉じたあと、収納画面に戻しておく
      const sb = { ...s, bagOpen: true };
      setG(sb);
      gRef.current = sb;
    }
  }

  /* ---------- 地点イベント ---------- */
  function searchWreck() {
    setG((s) => {
      if (s.eventDone) return s; // 連打で二重に調査イベントが走っても、ドロップが上書きされないようにする
      const roll = Math.random();
      const item = roll < 0.20
        ? (makeRelic(s.relics || [], { luck: 1, depth: s.depth }) || makeGear(s.depth, { luck: 1.2 }))
        : roll < 0.72 ? makeGear(s.depth, { luck: 1.2 }) : makeConsumable();
      return pushLog({ ...s, drops: [item], eventDone: true }, "残骸を調査した。", true);
    });
  }
  function resupply() {
    playSE("heal");
    setG((s) => {
      if (s.eventDone) return s; // 連打で二重に回復イベントが走ると無料で追加回復できてしまうため必ず一度だけに絞る
      const mul = hasRelic(s, "driftAnchor") ? 1.5 : 1;
      let n = { ...s, eventDone: true };
      n.crew = n.crew.map((c) => {
        if (!c) return c;
        const amt = Math.round(c.maxHp * 0.45 * mul);
        return { ...c, down: false, burning: 0, poisoned: 0, hp: c.down ? Math.round(c.maxHp * 0.4 * mul) : Math.min(c.maxHp, c.hp + amt) };
      });
      n = pushLog(n, "補給地点。隊を立て直し、戦闘不能者も復帰した。", true);
      if (Math.random() < 0.4) { n.drops = [makeConsumable()]; n = pushLog(n, "物資が少し残っていた。"); }
      return n;
    });
  }
  // 廃品回収(スクラッパー): 不要な収納品を鉄屑に変える。鉄屑はこの潜航限定の資源(全滅すると消える)。
  function scrapItem(item) {
    setG((s) => {
      // 連打での二重付与を防ぐため、必ず s.bag から生きているアイテムを再取得して判定する
      // (UI 側のボタン無効化だけに頼らず、ここでもロック中を弾く)
      const live = s.bag.find((x) => x.id === item.id);
      if (!live) return s;
      if (live.locked) return pushLog(s, "ロック中のアイテムはスクラップできません。");
      const gain = rarityIdx(live.rarity) + 1 + skillEffectTotal(meta?.skills, "scrapBonus");
      return pushLog({ ...s, bag: s.bag.filter((x) => x.id !== live.id),
        scrapCount: (s.scrapCount || 0) + gain, eventDone: true },
        `${live.name}を分解した。鉄屑 +${gain}。`, true);
    });
  }
  // ショップ: 鉄屑で消耗品と交換する(scrapYield/shopDiscount で割引)
  const shopPrice = (base) => Math.max(1, Math.round(base * (1 - skillEffectTotal(meta?.skills, "shopDiscount"))));
  function buyShopItem(itemId, price) {
    setG((s) => {
      if ((s.scrapCount || 0) < price) return pushLog(s, "鉄屑が足りません。");
      if (s.bag.length >= bagCap) return { ...s, full: true };
      let item = makeConsumable(itemId);
      if (matchesAutoLock(item)) item = { ...item, locked: true };
      return pushLog({ ...s, scrapCount: s.scrapCount - price, bag: [...s.bag, item], eventDone: true },
        `${CONSUMABLES[itemId].label}と交換した。`, true);
    });
  }
  // 関所: 何かを捧げれば無傷で通過。捧げなければ隊全員がダメージ(戦闘不能にはならない。gateWard で軽減)
  function gateOffer(item) {
    setG((s) => {
      if (s.eventDone) return s;
      const live = s.bag.find((x) => x.id === item.id);
      if (!live) return s;
      if (live.locked) return pushLog(s, "ロック中のアイテムは捧げられません。");
      return pushLog({ ...s, bag: s.bag.filter((x) => x.id !== live.id), eventDone: true },
        `${live.name}を関所へ捧げた。道が開いた。`, true);
    });
  }
  function gateForceThrough() {
    setG((s) => {
      if (s.eventDone) return s;
      const dmg = Math.max(1, 10 - skillEffectTotal(meta?.skills, "gateDR"));
      const crew = s.crew.map((c) => (c && !c.down) ? { ...c, hp: Math.max(1, c.hp - dmg) } : c);
      return pushLog({ ...s, crew, eventDone: true }, `関所を強行突破した。隊員全員が${dmg}ダメージを受けた。`, true);
    });
  }
  // 人魚との出会い: 隊全体に一定ターンの祝福(攻撃力アップ)を付与。mermaidBond/mermaidBond2 で強化
  function receiveBlessing() {
    const boost = skillEffectTotal(meta?.skills, "blessingBoost");
    const atkBonus = 0.25 + boost;
    const turns = 10 + Math.round(boost * 40);
    setG((s) => {
      if (s.eventDone) return s;
      const crew = s.crew.map((c) => c ? { ...c, buffAtk: (c.buffAtk || 0) + atkBonus, buffT: Math.max(c.buffT || 0, turns) } : c);
      return pushLog({ ...s, crew, eventDone: true },
        `人魚の祝福を受けた。隊全体の攻撃力が${turns}ターン上昇する。`, true);
    });
  }
  // 救難信号: 候補3人から1人だけ勧誘できる
  function rollRecruits(depth) {
    const types = Object.keys(CREW_TYPES);
    const picked = [];
    while (picked.length < 3) {
      const t = pick(types);
      if (!picked.includes(t) || picked.length >= types.length) picked.push(t);
    }
    return picked.map((t) => makeCrew(depth, { type: t, crewLevels: meta?.crewLevels }));
  }
  function recruit(c) {
    setG((s) => {
      let n = { ...s, eventDone: true, recruit: null };
      const empty = n.crew.findIndex((x) => !x);
      const nc = { ...c, baseMaxHp: c.maxHp, cd: 0, buffAtk: 0, guard: 0, down: false };
      if (empty >= 0) n.crew = n.crew.map((x, i) => i === empty ? nc : x);
      else n.crew = [...n.crew.slice(0, -1), nc]; // 空席が無ければ最後の枠と入れ替え
      n = refreshHp(n);
      n = pushLog(n, `${c.name}が隊に加わった。`, true);
      return n;
    });
    // 名簿(職種のみ・8種)へ永続登録。レアリティでは水増ししない。
    setMeta((prev) => {
      if ((prev.roster || []).includes(c.type)) return prev;
      const m2 = { ...prev, roster: [...(prev.roster || []), c.type] };
      saveMeta(m2);
      return m2;
    });
  }
  function swapRecruit(c, slot) {
    setG((s) => {
      let n = { ...s, eventDone: true, recruit: null };
      const nc = { ...c, baseMaxHp: c.maxHp, cd: 0, buffAtk: 0, guard: 0, down: false };
      n.crew = n.crew.map((x, i) => i === slot ? nc : x);
      n = refreshHp(n);
      return pushLog(n, `${c.name}と交代した。`, true);
    });
    setMeta((prev) => {
      if ((prev.roster || []).includes(c.type)) return prev;
      const m2 = { ...prev, roster: [...(prev.roster || []), c.type] };
      saveMeta(m2);
      return m2;
    });
  }

  // クルーの並び替え: 2人選ぶとその位置を入れ替える(カードに常設ボタンを置くと
  // 横幅が伸びて収納一覧が横スクロールしてしまうため、モード切り替え式にしている)
  function swapCrewPositions(idA, idB) {
    setG((s) => {
      const i1 = s.crew.findIndex((c) => c && c.id === idA);
      const i2 = s.crew.findIndex((c) => c && c.id === idB);
      if (i1 < 0 || i2 < 0 || i1 === i2) return s;
      const crew = [...s.crew];
      [crew[i1], crew[i2]] = [crew[i2], crew[i1]];
      return { ...s, crew };
    });
  }
  // 2人のクルー間で武器(c.weapon)だけを入れ替える(片方が未装備でも成立=受け渡しになる)。
  // 収納画面のクルーカードはスクロール領域の中にありドラッグがスクロールと競合するため、
  // 武器専用のポップアップ(スクロールしない小さな一覧)から、タップまたはドラッグで使う。
  function swapCrewWeapons(idA, idB) {
    setG((s) => {
      const a = s.crew.find((c) => c && c.id === idA);
      const b = s.crew.find((c) => c && c.id === idB);
      if (!a || !b || idA === idB || s.phase === "battle") return s;
      const crew = s.crew.map((c) => {
        if (c && c.id === idA) return { ...c, weapon: b.weapon };
        if (c && c.id === idB) return { ...c, weapon: a.weapon };
        return c;
      });
      return refreshHp(pushLog({ ...s, crew }, `${a.name}と${b.name}の武器を入れ替えた。`));
    });
  }
  // 2人のクルー間で装備一式(装備・武器の両枠)を入れ替える(片方が未装備でも成立=受け渡しになる)。
  // クルーカードのドラッグ&ドロップから使う。戦闘中は(装備の着脱自体が禁止のため)呼ばない。
  function swapCrewGear(idA, idB) {
    setG((s) => {
      const a = s.crew.find((c) => c && c.id === idA);
      const b = s.crew.find((c) => c && c.id === idB);
      if (!a || !b || idA === idB) return s;
      const crew = s.crew.map((c) => {
        if (c && c.id === idA) return { ...c, gear: b.gear, weapon: b.weapon };
        if (c && c.id === idB) return { ...c, gear: a.gear, weapon: a.weapon };
        return c;
      });
      return refreshHp(pushLog({ ...s, crew }, `${a.name}と${b.name}の装備を入れ替えた。`));
    });
  }

  /* ---------- 全滅と持ち帰り ---------- */
  // 遺物は relicN 件、それ以外(装備・消耗品)は carryN 件まで、独立した枠として選べる
  // (以前は一本の carryN プールを取り合っており、遺物が実質ほぼ持ち帰れなかった)。
  function togglePick(item) {
    setG((s) => {
      if (s.pick.includes(item.id)) return { ...s, pick: s.pick.filter((x) => x !== item.id) };
      // 全滅時の持ち帰りも、船内ストレージ(種類を問わない共通プール)の空きまで選べる。
      if (s.pick.length >= storageN) return s;
      return { ...s, pick: [...s.pick, item.id] };
    });
  }
  async function surfaceAndRedive() {
    const s = gRef.current;
    const carried = allSalvage(s).filter((x) => s.pick.includes(x.id));
    setMeta((prev) => {
      const m2 = { ...prev, carried };
      saveMeta(m2);
      return m2;
    });
    setG({ screen: "select" });
  }

  // スキル長押しフック — 全条件分岐より前に配置(Reactのルール)
  const skillLp = useLongPress(() => {
    const activeC = gRef.current.crew[gRef.current.turnIdx];
    if (activeC && !activeC.down) setSkillTip(CREW_TYPES[activeC.type].skill);
  });

  /* ---- スキルツリーの購入 ---- */
  const buySkill = (id) => {
    const sk = SKILL_BY_ID[id]; if (!sk) return;
    // 「まだ未購入か・残響片が足りているか」の判定と適用を同じ functional updater 内で行う。
    // metaRef.current を同期的に読んでから別に setMeta すると、異なる2つのスキルをほぼ同時に
    // 購入確定した場合に片方の購入が黙って消えてしまう(非原子的な check-then-write)。
    setMeta((prev) => {
      if (prev.skills?.[id] || (prev.shards || 0) < sk.cost || !skillPrereqsMet(sk, prev.skills || {}) || !skillUnlocked(sk, prev)) return prev;
      const m2 = { ...prev, shards: prev.shards - sk.cost, skills: { ...(prev.skills || {}), [id]: true }, skillRefund: 0 };
      saveMeta(m2);
      return m2;
    });
  };
  // 名簿(type)を、船のストレージに持ち帰ったアーティファクト(遺物・meta.carried の
  // kind:"relic")を重ねて消費することで永久強化する。レア度が高いアーティファクトほど
  // レベルの伸びが大きい(☆1個につき+1)。武器・防具は強化には使えない(戦闘装備のまま)。
  // 消費したアーティファクトは、その分もう次の潜航には持ち込めなくなる。
  const reinforceCrew = (rosterKey, artifactId) => {
    setMeta((prev) => {
      const artifact = (prev.carried || []).find((x) => x.id === artifactId && x.kind === "relic");
      // まだ持ち越し一覧にある(連打などで二重消費していない)かをここで再確認する
      if (!artifact) return prev;
      const gain = rarityIdx(artifact.rarity) + 1;
      const crewLevels = { ...(prev.crewLevels || {}) };
      crewLevels[rosterKey] = Math.min(CREW_LEVEL_MAX, (crewLevels[rosterKey] || 0) + gain);
      const m2 = { ...prev, crewLevels, carried: (prev.carried || []).filter((x) => x.id !== artifactId) };
      saveMeta(m2);
      return m2;
    });
  };
  // 潜航中に「メイン」へ戻る。以前は潜航を終了しないとタイトルへ戻れなかったが、
  // ゲームを終了させずにいつでもメインメニューへ行き来できるようにする。
  // clearGameState は呼ばない(進行中の潜航データはそのまま保持する)。現在の g を
  // resumable に退避しておき、タイトルの「続きから再開」で全く同じ状態へ戻れるようにする。
  const pauseToTitle = () => {
    saveGameState(g);
    setResumable(g);
    setOverlay(null);
    setG({ screen: "title" });
  };
  // 船内ストレージから1点だけ捨てて空きを作る(「アイテム一覧」画面専用)。
  const discardFromStorage = (itemId) => {
    setMeta((prev) => {
      const m2 = { ...prev, carried: (prev.carried || []).filter((x) => x.id !== itemId) };
      saveMeta(m2);
      return m2;
    });
  };
  const metaOverlays = (
    <>
      {overlay === "bestiary" && <BestiaryOverlay meta={meta} onClose={() => setOverlay(null)} />}
      {overlay === "skills" && <SkillTreeOverlay meta={meta} onClose={() => setOverlay(null)} onBuy={buySkill} />}
      {overlay === "settings" && <SettingsOverlay meta={meta} setMeta={setMeta} onClose={() => setOverlay(null)} />}
      {overlay === "help" && <HelpOverlay onClose={() => setOverlay(null)} />}
      {overlay === "reinforce" && <ReinforceOverlay meta={meta} onClose={() => setOverlay(null)} onReinforce={reinforceCrew} />}
      {overlay === "storage" && <StorageOverlay meta={meta} storageN={storageN} onClose={() => setOverlay(null)} onDiscard={discardFromStorage} />}
    </>
  );
  // タイトル(ホーム)画面下部の固定タブバー。メイン/強化/スキル/図鑑/設定を同格の
  // タブとして並べ、常に画面下部の押しやすい位置から切り替えられるようにする。
  // 「メイン」はタブというより「今開いている物を閉じる」動作(overlayをnullに戻す)。
  // onHome を渡すと「メイン」タップ時にそれを呼ぶ(潜航中断・タイトルへ戻る等)。
  // 省略時(タイトル画面自身)は開いているオーバーレイを閉じるだけ。
  const HomeTabBar = ({ onHome }) => (
    <div className="sd-hometabs">
      <button className={`sd-hometab ${!overlay ? "on" : ""}`} onClick={() => { setOverlay(null); onHome?.(); }}>
        <Compass size={17} /><span>メイン</span>
      </button>
      <button className={`sd-hometab ${overlay === "reinforce" ? "on" : ""}`} onClick={() => setOverlay("reinforce")}>
        <Zap size={17} /><span>強化</span>
      </button>
      <button className={`sd-hometab ${overlay === "storage" ? "on" : ""}`} onClick={() => setOverlay("storage")}>
        <Package size={17} /><span>倉庫</span>
        {(meta?.carried || []).length >= storageN && <span className="sd-meta-badge">満</span>}
      </button>
      <button className={`sd-hometab ${overlay === "skills" ? "on" : ""}`} onClick={() => setOverlay("skills")}>
        <Waypoints size={17} /><span>スキル</span>
        {(meta?.shards || 0) > 0 && <span className="sd-meta-badge">{meta.shards}</span>}
      </button>
      <button className={`sd-hometab ${overlay === "bestiary" ? "on" : ""}`} onClick={() => setOverlay("bestiary")}>
        <BookOpen size={17} /><span>図鑑</span>
      </button>
      <button className={`sd-hometab ${overlay === "settings" ? "on" : ""}`} onClick={() => setOverlay("settings")}>
        <Settings size={17} /><span>設定</span>
      </button>
    </div>
  );

  /* ============================================================
     描画
  ============================================================ */
  if (!meta) return (
    <div className="sd-root"><style>{CSS}</style>
      <div className="sd-title"><div className="sd-en">READING LOGS...</div></div></div>
  );

  /* ---------- タイトル ---------- */
  if (g.screen === "title") {
    const collected = (meta.roster || []).length;
    const totalKinds = Object.keys(CREW_TYPES).length;
    const unlockedZones = Math.min(meta.checkpoint - 1, 9);
    return (
      <div className="sd-root">
        <style>{CSS}</style>
        <Backdrop depth={1} />
        <div className="sd-scan" /><div className="sd-vig" />
        <div className="sd-title">
          <div className="sd-en">深海ダンジョン</div>
          <div className="sd-lead">
            隊を組んで深く潜る。深度10000メートル、海の底は星に通じている。<br />
            隊が沈んでも、記録された仲間と回収した遺物だけが次の潜航へ残る。
          </div>
          {resumable ? (
            <>
              {/* セーブは維持したまま、明示的にこのボタンを押した時だけ続きを再開する
                  (以前は起動直後に自動でポップアップが出て潜航画面へ切り替わっていたが、
                  「毎回メイン画面から始めたい」という要望により、続けるかはここで選ぶ形にした)。
                  ボタンの文言は完全一致(byExactText)で検出しているテストが多数あるため、
                  ボタン内テキストは「続きから再開」のみで固定し、付随情報は別行で表示する。 */}
              <div className="sd-sub" style={{ marginTop: 4 }}>
                中断した潜航があります。<br />
                深度 {depthMeters(resumable.depth)}m ／ {ZONES[zoneOf(resumable.depth)].name}
              </div>
              <button className="sd-btn pri" style={{ marginTop: 4, padding: "12px 36px", fontSize: 14 }}
                onClick={() => { setG(resumable); setResumable(null); }}>
                続きから再開
              </button>
              <button className="sd-btn sm"
                onClick={() => setG({ ...resumable, newGameReview: true })}>
                帰還する(今の持ち物を船に戻します)
              </button>
            </>
          ) : (
            <button className="sd-btn pri" style={{ marginTop: 4, padding: "12px 36px", fontSize: 14 }}
              onClick={() => setG({ screen: "select" })}>
              {meta.checkpoint > 1 ? `海域 ${Math.min(meta.checkpoint, 10)} から 潜 航` : "潜 航 開 始"}
            </button>
          )}
          {(unlockedZones > 0 || DEBUG) && (
            <button className="sd-btn sm amber" onClick={() => setG({ screen: "zoneSelect" })}>
              {DEBUG ? "🛠 ステージ選択(全解放)" : "海域を選んで再挑戦"}
            </button>
          )}
          <button className="sd-btn sm" onClick={() => setOverlay("help")}>
            <FlaskConical size={13} style={{ marginRight: 5, verticalAlign: -2 }} />遊び方
          </button>
          <div className="sd-stat">
            潜航 {meta.dives} 回 ／ 喪失 {meta.deaths} 回 ／ 最深 {depthLabel(meta.bestDepth)}({depthMeters(meta.bestDepth)}m)<br />
            名簿 {collected} / {totalKinds} 種 ／ 遺物枠 {relicN} ／ ストレージ持出枠 {carryN}
            {meta.clears > 0 && <> ／ 星海到達 {meta.clears} 回</>}
          </div>
        </div>
        {metaOverlays}
        <HomeTabBar />
      </div>
    );
  }

  /* ---------- ゾーン選択(再挑戦 / デバッグ全解放) ---------- */
  if (g.screen === "zoneSelect") {
    const unlockedZones = DEBUG ? 10 : Math.min(meta.checkpoint - 1, 9);
    return (
      <div className="sd-root sd-root-dive">
        <style>{CSS}</style>
        <Backdrop depth={1} />
        <div className="sd-scan" /><div className="sd-vig" />
        <div className="sd-stage">
          {/* 一覧が短い時に画面上部だけに寄って戻るボタンが浮いてしまわないよう、
              本体をスクロール領域にして戻るボタンは画面下部に固定する。 */}
          <div className="sd-scroll-body">
            <div style={{ position: "relative", zIndex: 2, padding: "20px 0 0" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 14, letterSpacing: ".2em", color: "var(--cyan)", marginBottom: 8 }}>
                {DEBUG ? "🛠 ステージ選択(デバッグ)" : "海域を選択"}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink-dim)", marginBottom: 16, lineHeight: 1.8 }}>
                {DEBUG
                  ? "デバッグ端末: 全10海域を任意に選んで開始できます。持ち越し品なし・進行は保存されます。"
                  : "クリア済みの海域から再挑戦できます。チェックポイントを超えた先は引き継がれません。"}
              </div>
              <div className="sd-zone-grid">
                {ZONES.map((z, i) => {
                  const locked = i >= unlockedZones;
                  const bg = zoneBgUrl(i);
                  return (
                    <button key={i} className={`sd-zone-cell ${locked ? "locked" : ""}`}
                      onClick={() => { if (!locked) setG({ screen: "select", pendingZone: i }); }}
                      style={{ borderColor: locked ? undefined : `rgba(${z.bg.accent},.5)` }}>
                      {bg && <img className="zc-bg" src={bg} alt="" />}
                      {locked && <div className="zc-lock">🔒</div>}
                      <div className="zc-en">{z.en}</div>
                      <div className="zc-name" style={{ color: locked ? undefined : `rgba(${z.bg.accent},1)` }}>
                        海域 {i + 1}
                      </div>
                      <div className="zc-name">{z.name}</div>
                      <div className="zc-depth">{z.depth}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="sd-fixed-footer">
            <div className="sd-rows" style={{ margin: 0, justifyContent: "center" }}>
              <button className="sd-btn sm" onClick={() => setG({ screen: "title" })}>← 戻る</button>
            </div>
          </div>
        </div>
        {metaOverlays}
        <HomeTabBar onHome={() => setG({ screen: "title" })} />
      </div>
    );
  }

  /* ---------- 出航編成(収集の見せ場) ---------- */
  if (g.screen === "select") {
    return (
      <>
        <CrewSelect meta={meta} onStart={startDive} onBack={() => setG({ screen: "title" })}
          pendingZone={g.pendingZone ?? null} />
        {metaOverlays}
        <HomeTabBar onHome={() => setG({ screen: "title" })} />
      </>
    );
  }

  const Z = ZONES[zoneOf(g.depth)];
  const activeCrew = g.crew[g.turnIdx];
  const canAct = g.phase === "battle" && !g.busy && activeCrew && !activeCrew.down;
  const skillT = activeCrew ? CREW_TYPES[activeCrew.type].skill : null;
  const aimingType = g.aiming ? (g.pendingSkill ? CREW_TYPES[activeCrew.type].dmg : CREW_TYPES[activeCrew.type].dmg) : null;
  const livingEnemies = g.enemies.filter((e) => e.hp > 0);
  // 味方を対象に取る技(医療士)は味方カードから選ばせる。それ以外の自己完結技は即発動。
  const allySkill = activeCrew && activeCrew.type === "medic";
  const selfSkill = activeCrew && ["scanner", "diver", "sweeper", "resonator"].includes(activeCrew.type);

  // 行動を発火(対象が要る技は照準モードへ)。
  // 攻撃/技の照準中でも呼べるようにしてあり、その場合は今の照準を破棄して切り替える
  // (「攻撃対象を選択中でもスキルにすり替えられる」を成立させるため、必ず allyAim/aiming
  // の両方を明示的にリセットしてから新しいモードへ入る)。
  const doAct = (useSkill) => {
    if (!canAct) return;
    if (useSkill && allySkill) { setG((s) => ({ ...s, allyAim: true, aiming: null, pendingSkill: true })); return; }
    if (useSkill && selfSkill) { act(true, null); return; }
    if (livingEnemies.length === 1) { act(useSkill, livingEnemies[0].id); return; }
    setG((s) => ({ ...s, allyAim: null, aiming: CREW_TYPES[activeCrew.type].dmg, pendingSkill: useSkill }));
  };

  // 医療士スキル: 味方カードをタップして回復対象を確定
  const pickAlly = (crewId) => {
    if (!gRef.current.allyAim) return;
    setG((s) => ({ ...s, allyAim: null }));
    act(true, null, crewId);
  };

  // 「次へ進む」系ボタンは、以前は各イベントカードの一番下(スクロールしないと
  // 見えない位置)にしか無かった。フェーズごとに内容は違うが、行動バー(常に画面下部に
  // 固定)側にも同じ操作を出し、スクロールしなくても押せるようにする。
  const nextAction = (() => {
    if (g.phase === "battle" || g.phase === "lost" || g.phase === "ending" || g.phase === "return") return null;
    if (g.phase === "prep") return { label: "戦闘を開始する", onClick: beginBattle };
    if (g.phase === "gate" && !g.eventDone) return { label: "強行突破する", onClick: gateForceThrough, danger: true };
    if (g.phase === "spoils") {
      return {
        label: g.node + 1 < g.nodes.length ? "先へ進む →" : `深度 ${depthMeters(g.depth + 1)}m へ ↓`,
        onClick: proceed,
      };
    }
    return { label: "降下を続ける ↓", onClick: proceed };
  })();

  return (
    <div className="sd-root sd-root-dive">
      <style>{CSS}</style>
      <Backdrop depth={g.depth} />
      {/* バースト中は常時湧く環境泡を止め、バーストの泡だけが画面下から上へ抜けて消える
          ようにする(そうしないと、上まで昇りきった直後にまた別の泡が下に湧いて
          「溜まっている」ように見えてしまう)。 */}
      <Bubbles burstActive={depthBurst} burstKey={g.depth} ambient={g.phase !== "battle" && g.phase !== "spoils" && !depthBurst} />
      <div className="sd-scan" /><div className="sd-vig" />
      {depthNotice && (
        <div className="sd-depth-notice" aria-hidden="true">
          <span className="val">{depthNotice.from}m</span>
          <span className="arrow">→</span>
          <span className="val">{depthNotice.to}m</span>
        </div>
      )}

      {/* 深度ゲージ */}
      <div className="sd-gauge">
        {[0, 2, 4, 6, 8, 10].map((n) => <span key={n}>{n * 1000}m</span>)}
        <div className="sd-cursor" style={{ top: `${(g.depth / 100) * 100}%` }} />
      </div>

      <div className="sd-stage">
        {/* テレメトリ: 左=進捗(見るだけ)/ 中央=海域名・深度(一番見る情報)。
            メイン・強化・スキル・図鑑・設定は下部の固定タブバー(HomeTabBar)に一本化した
            (以前はここにも同じ行き先の小さいアイコンを並べていたが、タブバーが全画面で
            常時表示されるようになったため完全に重複していた)。 */}
        <div className="sd-tele sd-tele-3col">
          <div className="sd-tele-l">
            <div className="sd-nodes">
              <span>{NODE_LABEL[g.nodes[g.node]]}</span>
              {g.nodes.map((n, i) => (
                <span key={i} className={`sd-nd ${i < g.node ? "done" : i === g.node ? "now" : ""}`} />
              ))}
            </div>
            {g.scrapCount > 0 && (
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-dim)" }}>⚙{g.scrapCount}</span>
            )}
          </div>
          <div className="sd-tele-c">
            <span className="sd-zone">{Z.name}</span>
            <span className="sd-depth">{depthMeters(g.depth)}m</span>
          </div>
        </div>

        {/* メイン領域 */}
        {(() => {
          const bossE = g.phase === "battle" && g.enemies.find((e) => e.boss && e.hp > 0);
          const bossImg = bossE && ASSETS[bossE.asset]?.img;
          return (
        <div ref={fieldRef} className={`sd-field ${bossE ? "hasboss" : ""}`}>
          {bossE && bossImg && (
            <div className="sd-boss-cinema"><img src={bossImg} alt="" /></div>
          )}
          {g.phase === "battle" && g.enemies.map((e) => (
            <EnemyCard key={e.id} e={e} scanned={meta.scanned || {}} aiming={g.aiming}
              hitId={g.hitId} floats={g.floats} cinema={!!bossE && e.boss}
              onPick={(id) => act(g.pendingSkill, id)} />
          ))}

          {g.phase === "prep" && (
            <div style={{ border: "1px solid var(--line)", background: "var(--hull)", padding: "26px 30px", textAlign: "center", maxWidth: 440, borderRadius: 18 }}>
              <Shield size={38} color="var(--cyan)" strokeWidth={1.3} style={{ margin: "0 auto 10px" }} />
              <div style={{ fontFamily: "var(--mono)", fontSize: 14, letterSpacing: ".18em", color: "var(--cyan)" }}>
                {g.nodes[g.node] === "boss" ? "主との交戦が近い" : "反応を検知"}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-dim)", margin: "8px 0 14px", lineHeight: 1.85 }}>
                {g.nodes[g.node] === "boss"
                  ? "この深度の主が潜んでいる。戦闘の前に装備を整えておこう。"
                  : "この先で交戦になる。戦闘の前に装備を整えておこう。"}
              </div>
              <button className="sd-btn sm" onClick={() => setG((s) => ({ ...s, bagOpen: true }))}>装備・収納を開く</button>
              <div style={{ marginTop: 14 }}><button className="sd-btn pri" onClick={beginBattle}>戦闘を開始する →</button></div>
            </div>
          )}

          {g.phase === "wreck" && (
            <div style={{ border: "1px solid var(--line)", background: "var(--hull)", padding: "26px 30px", textAlign: "center", maxWidth: 440, borderRadius: 18 }}>
              <Anchor size={38} color="var(--cyan)" strokeWidth={1.3} style={{ margin: "0 auto 10px" }} />
              <div style={{ fontFamily: "var(--mono)", fontSize: 14, letterSpacing: ".18em", color: "var(--cyan)" }}>残骸を発見</div>
              <div style={{ fontSize: 12, color: "var(--ink-dim)", margin: "8px 0 14px", lineHeight: 1.85 }}>
                以前の潜航隊のものらしい。装備や遺物が残っている可能性が高い。
              </div>
              {!g.eventDone
                ? <button className="sd-btn pri" onClick={searchWreck}>調査する</button>
                : <div className="sd-grid">{g.drops.map((d) => <Cell key={d.id} item={d} onClick={() => take(d)} actionLabel="回収" hint={gearHint(d)} />)}</div>}
              <div style={{ marginTop: 14 }}><button className="sd-btn sm" onClick={proceed}>降下を続ける ↓</button></div>
            </div>
          )}

          {g.phase === "supply" && (
            <div style={{ border: "1px solid var(--line)", background: "var(--hull)", padding: "26px 30px", textAlign: "center", maxWidth: 440, borderRadius: 18 }}>
              <Activity size={38} color="var(--ok)" strokeWidth={1.3} style={{ margin: "0 auto 10px" }} />
              <div style={{ fontFamily: "var(--mono)", fontSize: 14, letterSpacing: ".18em", color: "var(--ok)" }}>補給地点</div>
              <div style={{ fontSize: 12, color: "var(--ink-dim)", margin: "8px 0 14px", lineHeight: 1.85 }}>
                与圧の効いた空洞。ここで隊を立て直せる(HP45%回復・戦闘不能者も復帰)。
              </div>
              {!g.eventDone
                ? <button className="sd-btn pri" onClick={resupply}>隊を休ませる</button>
                : g.drops.length > 0 && <div className="sd-grid">{g.drops.map((d) => <Cell key={d.id} item={d} onClick={() => take(d)} actionLabel="回収" />)}</div>}
              <div style={{ marginTop: 14 }}><button className="sd-btn sm" onClick={proceed}>降下を続ける ↓</button></div>
            </div>
          )}

          {g.phase === "scrap" && (
            <div style={{ border: "1px solid var(--line)", background: "var(--hull)", padding: "22px 26px", maxWidth: 620, width: "100%", borderRadius: 18 }}>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <Icon assetId="nodeScrap" size={84} color="var(--cyan)" style={{ margin: "0 auto 12px" }} />
                <div style={{ fontFamily: "var(--mono)", fontSize: 14, letterSpacing: ".18em", color: "var(--cyan)" }}>廃品回収機</div>
                <div style={{ fontSize: 12, color: "var(--ink-dim)", marginTop: 7, lineHeight: 1.8 }}>
                  不要な収納品を分解し、<b style={{ color: "var(--ink)" }}>鉄屑</b>に変える。レアなものほど多く戻る。<br />
                  <span style={{ color: "var(--ink-dimmer)" }}>鉄屑はこの潜航限定 — 全滅すると失われる。ロック中のアイテムはスクラップできません。</span>
                </div>
              </div>
              {g.bag.length > 0 ? (
                <div className="sd-grid">
                  {g.bag.map((it) => (
                    <Cell key={it.id} item={it} hint={gearHint(it)}
                      actionLabel={it.locked ? "ロック中" : `スクラップ(+${rarityIdx(it.rarity) + 1})`}
                      onClick={it.locked ? undefined : () => {
                        if (isHighRarity(it)) { setG((s) => ({ ...s, dangerConfirm: { kind: "scrap", itemId: it.id } })); return; }
                        scrapItem(it);
                      }} />
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", color: "var(--ink-dimmer)", fontSize: 12 }}>収納は空です。</div>
              )}
              <div style={{ marginTop: 14, textAlign: "center" }}><button className="sd-btn sm" onClick={proceed}>降下を続ける ↓</button></div>
            </div>
          )}

          {g.phase === "shop" && (
            <div style={{ border: "1px solid var(--line)", background: "var(--hull)", padding: "22px 26px", maxWidth: 620, width: "100%", borderRadius: 18 }}>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <Icon assetId="nodeShop" size={84} color="var(--amber)" style={{ margin: "0 auto 12px" }} />
                <div style={{ fontFamily: "var(--mono)", fontSize: 14, letterSpacing: ".18em", color: "var(--amber)" }}>行商</div>
                <div style={{ fontSize: 12, color: "var(--ink-dim)", marginTop: 7, lineHeight: 1.8 }}>
                  鉄屑と回復用品を交換できる。<span style={{ color: "var(--amber)" }}>所持 鉄屑 {g.scrapCount || 0}</span>
                </div>
              </div>
              <div className="sd-grid">
                {SHOP_STOCK.map((s) => {
                  const c = CONSUMABLES[s.id];
                  const price = shopPrice(s.price);
                  const afford = (g.scrapCount || 0) >= price;
                  return (
                    <Cell key={s.id} item={{ kind: "item", itemId: s.id, name: c.label, rarity: "std", asset: c.asset }}
                      actionLabel={afford ? `交換(鉄屑${price})` : `鉄屑${price}必要`}
                      onClick={afford ? () => buyShopItem(s.id, price) : undefined} />
                  );
                })}
              </div>
              {g.full && <div className="sd-note">収納に空きがありません。「装備」から不要な物を破棄するか、そのまま進んでください。</div>}
              <div style={{ marginTop: 14, textAlign: "center" }}><button className="sd-btn sm" onClick={proceed}>降下を続ける ↓</button></div>
            </div>
          )}

          {g.phase === "gate" && (
            <div style={{ border: "1px solid var(--line)", background: "var(--hull)", padding: "22px 26px", maxWidth: 620, width: "100%", borderRadius: 18 }}>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <Icon assetId="nodeGate" size={84} color="var(--danger)" style={{ margin: "0 auto 12px" }} />
                <div style={{ fontFamily: "var(--mono)", fontSize: 14, letterSpacing: ".18em", color: "var(--danger)" }}>関所</div>
                <div style={{ fontSize: 12, color: "var(--ink-dim)", marginTop: 7, lineHeight: 1.8 }}>
                  先へ進むには何かを1つ捧げる必要がある。<br />
                  捧げずに進むと、隊員全員が10ダメージを受ける(戦闘不能にはならない)。
                </div>
              </div>
              {!g.eventDone ? (
                <>
                  {g.bag.length > 0 && (
                    <div className="sd-grid">
                      {g.bag.map((it) => (
                        <Cell key={it.id} item={it} hint={gearHint(it)}
                          actionLabel={it.locked ? "ロック中" : "捧げる"}
                          onClick={it.locked ? undefined : () => gateOffer(it)} />
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: 14, textAlign: "center" }}>
                    <button className="sd-btn sm" style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                      onClick={gateForceThrough}>何も捧げず強行突破する</button>
                  </div>
                </>
              ) : (
                <div style={{ marginTop: 6, textAlign: "center" }}><button className="sd-btn pri" onClick={proceed}>降下を続ける ↓</button></div>
              )}
            </div>
          )}

          {g.phase === "mermaid" && (
            <div style={{ border: "1px solid var(--line)", background: "var(--hull)", padding: "22px 26px", maxWidth: 620, width: "100%", borderRadius: 18 }}>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <Icon assetId="nodeMermaid" size={84} color="var(--cyan)" style={{ margin: "0 auto 12px" }} />
                <div style={{ fontFamily: "var(--mono)", fontSize: 14, letterSpacing: ".18em", color: "var(--cyan)" }}>人魚との出会い</div>
                <div style={{ fontSize: 12, color: "var(--ink-dim)", marginTop: 7, lineHeight: 1.8 }}>
                  静かにこちらを見ている。祝福を受けると、隊全体の攻撃力が10ターンの間 +25%上昇する。
                </div>
              </div>
              {!g.eventDone
                ? <div style={{ textAlign: "center" }}><button className="sd-btn pri" onClick={receiveBlessing}>祝福を受ける</button></div>
                : <div style={{ textAlign: "center", color: "var(--ok)", fontSize: 12 }}>祝福を受けた。</div>}
              <div style={{ marginTop: 14, textAlign: "center" }}><button className="sd-btn sm" onClick={proceed}>降下を続ける ↓</button></div>
            </div>
          )}

          {g.phase === "signal" && (
            <div style={{ border: "1px solid var(--line)", background: "var(--hull)", padding: "22px 26px", maxWidth: 620, width: "100%", borderRadius: 18 }}>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <Rss size={32} color="var(--amber)" strokeWidth={1.3} style={{ margin: "0 auto 12px" }} />
                <div style={{ fontFamily: "var(--mono)", fontSize: 14, letterSpacing: ".18em", color: "var(--amber)" }}>救難信号</div>
                <div style={{ fontSize: 12, color: "var(--ink-dim)", marginTop: 7, lineHeight: 1.8 }}>
                  生存者の反応を3つ捕捉した。<b style={{ color: "var(--ink)" }}>連れて行けるのは1人だけ</b>。
                </div>
              </div>
              {g.recruit && !g.eventDone && (
                <div className="sd-grid">
                  {g.recruit.map((c) => (
                    <Cell key={c.id} item={c} onClick={() => {
                      if (g.crew.some((x) => !x)) recruit(c);
                      else setG((s) => ({ ...s, swapFor: c }));
                    }} actionLabel={g.crew.some((x) => !x) ? "隊に加える" : "誰かと交代"}
                      sub={CREW_TYPES[c.type].skill.name + ": " + CREW_TYPES[c.type].skill.tag} />
                  ))}
                </div>
              )}
              {g.eventDone && <div style={{ textAlign: "center", color: "var(--ink-dim)", fontSize: 12 }}>信号は途絶えた。</div>}
              <div style={{ marginTop: 14, textAlign: "center" }}>
                <button className="sd-btn sm" onClick={proceed}>降下を続ける ↓</button>
              </div>
            </div>
          )}

          {g.phase === "spoils" && (
            <div style={{ border: "1px solid var(--line)", background: "var(--hull)", padding: "22px 26px", textAlign: "center", maxWidth: 580, borderRadius: 18 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 15, letterSpacing: ".22em", color: "var(--cyan)" }}>制 圧 完 了</div>
              <div style={{ fontSize: 12, color: "var(--ink-dim)", margin: "8px 0 13px" }}>
                {g.drops.length > 0 ? <>回収可能な物資を検出。<span style={{ color: "var(--ink-dimmer)", marginLeft: 8 }}>収納 {g.bag.length}/{bagCap}</span></> : "回収できるものはなかった。"}
              </div>
              {g.drops.length > 0 && <div className="sd-grid">{g.drops.map((d) => <Cell key={d.id} item={d} onClick={() => take(d)} actionLabel="回収" hint={gearHint(d)} />)}</div>}
              {g.full && <div className="sd-note">収納に空きがありません。「装備」から不要な物を破棄するか、置いて進んでください。</div>}
              {rewardAdFailNote({ marginTop: 8 })}
              <div className="sd-rows" style={{ justifyContent: "center" }}>
                {g.drops.length > 1 && <button className="sd-btn sm" onClick={takeAll}>すべて回収</button>}
                <button className="sd-btn pri" onClick={proceed}>
                  {g.node + 1 < g.nodes.length ? "先へ進む →" : `深度 ${depthMeters(g.depth + 1)}m へ ↓`}
                </button>
              </div>
            </div>
          )}
        </div>
          );
        })()}

        {/* 行動バー — クルーHP表示より上に配置 */}
        <div className="sd-acts">
          {g.phase === "battle" && (
            <>
              {/* サブ行: 通常時はクルー名+収納 / 照準時は対象選択プロンプト。
                  行動解決中(busy)で activeCrew が無い/操作不可の間も空行にせず
                  「行動中…」を出し続け、ボタン群ごと画面から消えないようにする
                  (消えたり出たりで画面がガタつくのを避けるため)。 */}
              <div className="sd-acts-sub">
                {g.allyAim ? (
                  <>
                    <span className="sd-prompt">
                      回復する相手を選択 — {skillT.name}
                    </span>
                    <button className="sd-btn sm" style={{ marginLeft: "auto" }}
                      onClick={() => setG((s) => ({ ...s, bagOpen: true }))}>
                      収納 {g.bag.length}/{bagCap}
                    </button>
                  </>
                ) : g.aiming ? (
                  <>
                    <span className="sd-prompt">
                      目標を選択 — {g.pendingSkill ? skillT.name : "攻撃"}
                    </span>
                    <button className="sd-btn sm" style={{ marginLeft: "auto" }}
                      onClick={() => setG((s) => ({ ...s, bagOpen: true }))}>
                      収納 {g.bag.length}/{bagCap}
                    </button>
                  </>
                ) : (
                  <>
                    <span className="sd-prompt">{activeCrew ? `▶ ${activeCrew.name}` : "行動中…"}</span>
                    {(g.relics || []).length > 0 && (
                      <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-dimmer)" }}>
                        遺{g.relics.length}/{relicN}
                      </span>
                    )}
                    <button className="sd-btn sm" style={{ marginLeft: "auto" }}
                      onClick={() => setG((s) => ({ ...s, bagOpen: true }))}>
                      収納 {g.bag.length}/{bagCap}
                    </button>
                  </>
                )}
              </div>
              {/* メイン行: 戦闘中は常にレンダリングしてレイアウトを固定する(busy 中も消さず、
                  押せないだけにする)。照準中(攻撃/技どちらか)でもボタンは押せる — 押すと
                  今の照準を破棄してもう一方にすり替わる。今どちらを狙っているかは枠の
                  ハイライトで示す。 */}
              <div className="sd-acts-main">
                <button className={`sd-btn sd-btn-lg ${g.aiming && !g.pendingSkill ? "aiming" : ""}`}
                  disabled={!canAct}
                  onClick={() => doAct(false)}>
                  攻 撃
                </button>
                <button className={`sd-btn amber sd-btn-lg ${(g.aiming && g.pendingSkill) || g.allyAim ? "aiming" : ""}`}
                  disabled={!canAct || (activeCrew?.cd || 0) > 0}
                  {...skillLp.props}
                  onClick={() => { if (!skillLp.fired.current) doAct(true); }}>
                  <span>{skillT ? skillT.name : "技"}</span>
                  <span className="sd-btn-lg-sub">
                    {activeCrew?.cd > 0 ? `残 ${activeCrew.cd} ターン` : "長押しで詳細"}
                  </span>
                </button>
              </div>
            </>
          )}
          {g.phase !== "battle" && g.phase !== "lost" && g.phase !== "ending" && (
            <div className="sd-acts-sub">
              {(g.relics || []).length > 0 && (
                <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--ink-dimmer)" }}>
                  遺物: {g.relics.map((r) => r.name).join(" · ")}
                </span>
              )}
              {/* 戦闘中の「収納」ボタンと位置を揃えるため、常に右端固定にする */}
              <button className="sd-btn sm" style={{ marginLeft: nextAction ? 0 : "auto" }}
                onClick={() => setG((s) => ({ ...s, bagOpen: true }))}>
                装備・収納 {g.bag.length}/{bagCap}
              </button>
              {/* 次へ進む系のボタン。以前はイベントカードの一番下(スクロールしないと
                  見えない位置)にしか無く見づらかったため、ここにも常時固定で置く。 */}
              {nextAction && (
                <button className={`sd-btn sm ${nextAction.danger ? "" : "pri"}`}
                  style={nextAction.danger ? { marginLeft: "auto", color: "var(--danger)", borderColor: "var(--danger)" } : { marginLeft: "auto" }}
                  onClick={nextAction.onClick}>
                  {nextAction.label}
                </button>
              )}
            </div>
          )}
        </div>

        {/* クルー編成(最大8人・縦4×横2グリッド) — ボタンの下に配置 */}
        <div className={`sd-crew ${g.allyAim ? "picking" : ""}`} style={{ marginTop: 6 }}>
          {g.crew.map((c, i) => (
            <CrewRow key={c ? c.id : `slot${i}`} c={c}
              active={g.phase === "battle" && i === g.turnIdx && !g.busy}
              acted={g.phase === "battle" && i < g.turnIdx}
              pick={!!g.allyAim && !!c && c.hp < c.maxHp}
              onPick={() => c && pickAlly(c.id)}
              onInfo={() => c && setSkillTip(CREW_TYPES[c.type].skill)} />
          ))}
        </div>

        {/* ログ(スクロール可能) */}
        <div className="sd-log" ref={logRef} role="button" onClick={() => setLogOpen(true)}>
          {(g.logs || []).map((l, i, arr) => (
            <div key={l.k} className={i === arr.length - 1 ? "cur" : ""}>{l.hi ? <b>{l.text}</b> : l.text}</div>
          ))}
        </div>
      </div>

      {/* ── 武器の入れ替え(武器だけのポップアップ。タップ2回、またはドラッグ&ドロップ) ── */}
      {weaponSwapOpen && (
        <div className="sd-ov top" onClick={() => setWeaponSwapOpen(false)}>
          <div className="sd-ov-inner">
            <div className="sd-sheet" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
              <div className="sd-sheet-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h2>武器の入れ替え</h2>
                <button className="sd-btn sm" aria-label="閉じる" onClick={() => setWeaponSwapOpen(false)}><X size={14} /></button>
              </div>
              <div className="sd-sub" style={{ color: "var(--amber)" }}>
                {weaponSwapFirst ? "入れ替える相手をもう1人タップしてください。" : "2人を順にタップするか、ドラッグして重ねると武器を入れ替えます。"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "10px 0", touchAction: "none" }}>
                {g.crew.filter(Boolean).map((c) => (
                  <div key={c.id} data-wsw-id={c.id} role="button"
                    className={`sd-cell ${weaponSwapFirst === c.id ? "on" : ""}`}
                    style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", cursor: "pointer", userSelect: "none" }}
                    onPointerDown={(e) => { e.currentTarget.dataset.down = "1"; try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch (err) { /* noop */ } }}
                    onPointerUp={(e) => {
                      const el = e.currentTarget;
                      if (el.dataset.down !== "1") return;
                      el.dataset.down = "";
                      const hit = document.elementFromPoint?.(e.clientX, e.clientY)?.closest?.("[data-wsw-id]");
                      const targetId = hit?.getAttribute("data-wsw-id");
                      if (targetId && targetId !== c.id) { swapCrewWeapons(c.id, targetId); setWeaponSwapFirst(null); }
                    }}
                    onClick={() => {
                      if (!weaponSwapFirst) setWeaponSwapFirst(c.id);
                      else if (weaponSwapFirst === c.id) setWeaponSwapFirst(null);
                      else { swapCrewWeapons(weaponSwapFirst, c.id); setWeaponSwapFirst(null); }
                    }}>
                    <b>{c.name}</b>
                    <span>{c.weapon ? c.weapon.name : "武器なし"}</span>
                  </div>
                ))}
              </div>
              <div className="sd-rows" style={{ justifyContent: "center" }}>
                <button className="sd-btn pri" onClick={() => setWeaponSwapOpen(false)}>閉じる</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 戦闘ログ全文(ログ欄をタップで開く) ── */}
      {logOpen && (
        <div className="sd-ov top" onClick={() => setLogOpen(false)}>
          <div className="sd-ov-inner">
            <div className="sd-sheet sd-sheet-scroll" style={{ maxWidth: 560, maxHeight: "80dvh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
              <div className="sd-sheet-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h2>戦闘ログ</h2>
                <button className="sd-btn sm" aria-label="閉じる" onClick={() => setLogOpen(false)}><X size={14} /></button>
              </div>
              <div className="sd-log-full" style={{ overflowY: "auto", fontSize: 12.5, lineHeight: 1.9, minHeight: 0 }}>
                {(g.logs || []).map((l) => (
                  <div key={l.k} style={/^──/.test(l.text) || l.text === "【戦闘開始】" ? { color: "var(--cyan)", marginTop: 6 } : undefined}>
                    {l.hi ? <b>{l.text}</b> : l.text}
                  </div>
                ))}
              </div>
              <div className="sd-rows" style={{ justifyContent: "center", marginTop: 10 }}>
                <button className="sd-btn pri" onClick={() => setLogOpen(false)}>閉じる</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 帰還前の一覧確認(持ち帰る物を選べる) ──
          タイトルの「帰還する」・潜航中の「潜航をやめて母船へ戻る」いずれから開いても
          全く同じダイアログ・確定後の流れになる(区別する意味が無いので統合済み)。
          キャンセルはその場のダイアログを閉じるだけで、潜航はそのまま続けられる
          (タイトル起点でも、資産は既に g へ読み込まれているのでそのまま続行できる)。 */}
      {g.newGameReview && (
        <NewGameReviewOverlay g={g} storageN={storageN}
          onClose={() => setG((s) => ({ ...s, newGameReview: false }))}
          onConfirm={(carried) => {
            setMeta((prev) => {
              const m2 = { ...prev, carried };
              saveMeta(m2);
              return m2;
            });
            // 母船へ戻ってきた瞬間を、海域突破・エンディングと同格の一つの区切りとして
            // 明示的な画面で見せる(以前は無言でタイトルへ切り替わるだけだった)。
            setG((s) => ({ ...s, newGameReview: false, phase: "return", returnCarried: carried }));
          }} />
      )}

      {/* ── 収納・装備 ── */}
      {g.bagOpen && (
        <div className="sd-fs-root">
          {/* 紺色一色で寂しくならないよう、専用の背景画像があれば薄く敷く
              (src/assets/bg/equip.webp。無い間は今まで通り地色のまま)。 */}
          {staticBgUrl("equip") && <img className="sd-fs-bg" src={staticBgUrl("equip")} alt="" />}
          <div className="sd-fs-top">
            <h2>装 備 / 収 納</h2>
            <div className="sd-sub" style={{ margin: "7px 0 0" }}>
              {g.phase === "battle" ? "戦闘中は消耗品のみ使用できます(回復・魚雷はターンを消費)。"
                : "装備はクルーへ装着、遺物は隊全体に効果があります。"}
            </div>
          </div>
          <div className="sd-fs-body">
            <div className="sd-lab" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>クルーと装備</span>
              {g.phase !== "battle" && (
                <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                  {/* カードのドラッグ&タップ入れ替えは、ここでモードを明示的に選んだ時だけ有効。
                      アイコン+ラベルで「今どのモードか」が一目で分かるようにする。 */}
                  <button className={`sd-btn sm ${gearSwapMode ? "on" : ""}`}
                    aria-label="装備交換モード"
                    onClick={() => { setInteractionMode((m) => m === "gearSwap" ? null : "gearSwap"); setReorderFirst(null); }}>
                    <Repeat size={13} style={{ marginRight: 4, verticalAlign: -2 }} />装備交換
                  </button>
                  <button className={`sd-btn sm ${reorderMode ? "on" : ""}`}
                    aria-label="並び替えモード"
                    onClick={() => { setInteractionMode((m) => m === "reorder" ? null : "reorder"); setReorderFirst(null); }}>
                    <ArrowLeftRight size={13} style={{ marginRight: 4, verticalAlign: -2 }} />並び替え
                  </button>
                  <button className="sd-btn sm" onClick={() => { setWeaponSwapFirst(null); setWeaponSwapOpen(true); }}>
                    武器入れ替え
                  </button>
                </div>
              )}
            </div>
            {(reorderMode || gearSwapMode) && (
              <div className="sd-sub" style={{ color: "var(--amber)", marginBottom: 6 }}>
                {reorderFirst
                  ? "入れ替える相手をもう1人選んでください。"
                  : `${reorderMode ? "並び替え" : "装備一式を交換"}たいクルーを2人、順にタップするかドラッグしてください。`}
              </div>
            )}
            <div className="sd-grid">
              {g.crew.filter(Boolean).map((c) => {
                const r = rarityOf(c.rarity);
                const pct = (c.hp / c.maxHp) * 100;
                const swapModeActive = reorderMode || gearSwapMode;
                const picked = swapModeActive && reorderFirst === c.id;
                const isDragging = dragCrewId === c.id;
                const isDragOver = dragCrewId && dragCrewId !== c.id && dragOverCrewId === c.id;
                const doSwap = (idA, idB) => { if (reorderMode) swapCrewPositions(idA, idB); else swapCrewGear(idA, idB); };
                return (
                  <div key={c.id} data-crew-card data-crew-id={c.id} role={swapModeActive ? "button" : undefined}
                    onClick={!swapModeActive ? undefined : () => {
                      if (!reorderFirst) { setReorderFirst(c.id); return; }
                      if (reorderFirst === c.id) { setReorderFirst(null); return; }
                      doSwap(reorderFirst, c.id);
                      setReorderFirst(null);
                    }}
                    // ドラッグ&ドロップ: モード(並び替え/装備交換)を明示的に選んでいる時だけ有効。
                    // 何も選んでいない閲覧モードでは、誤操作で入れ替わらないようドラッグ自体を起動しない。
                    // 戦闘中は(装備の着脱そのものが禁止のため)ドラッグを起動しない。
                    onPointerDown={(e) => {
                      if (g.phase === "battle" || !swapModeActive) return;
                      e.currentTarget.setPointerCapture(e.pointerId);
                      setDragCrewId(c.id);
                      setDragOverCrewId(c.id);
                      setDragPos({ x: e.clientX, y: e.clientY });
                    }}
                    onPointerMove={(e) => {
                      if (dragCrewId !== c.id) return;
                      setDragPos({ x: e.clientX, y: e.clientY });
                      const el = document.elementFromPoint(e.clientX, e.clientY);
                      const cardEl = el && el.closest("[data-crew-card]");
                      setDragOverCrewId(cardEl ? cardEl.dataset.crewId : null);
                    }}
                    onPointerUp={() => {
                      if (dragCrewId !== c.id) return;
                      const targetId = dragOverCrewId;
                      setDragCrewId(null); setDragOverCrewId(null); setDragPos(null);
                      if (targetId && targetId !== c.id) { doSwap(c.id, targetId); setReorderFirst(null); }
                    }}
                    onPointerCancel={() => {
                      if (dragCrewId !== c.id) return;
                      setDragCrewId(null); setDragOverCrewId(null); setDragPos(null);
                    }}
                    style={{
                      border: `1px solid ${picked || isDragOver ? "var(--amber)" : "var(--line)"}`, padding: 10,
                      background: "rgba(6,14,24,.6)", borderRadius: 14,
                      boxShadow: picked || isDragOver ? "0 0 0 1px var(--amber), 0 0 14px rgba(255,210,127,.28)" : "none",
                      cursor: swapModeActive ? "pointer" : "default",
                      opacity: isDragging ? 0.4 : 1, touchAction: swapModeActive ? "none" : "auto",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <div className="sd-cr-icon">
                        <Icon assetId={c.asset} size={44} color={r.color} />
                        <span className="sd-rar sd-rar-overlay" style={{ background: r.color, color: "#04121a" }}>
                          {"★".repeat(rarityIdx(c.rarity) + 1)}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="sd-nm" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                        <div className={`sd-cr-bar ${pct < 30 ? "low" : ""}`} style={{ maxWidth: "none", marginTop: 4 }}><i style={{ width: `${pct}%` }} /></div>
                        <div className="sd-cr-hp" style={{ marginTop: 2 }}>{c.hp}/{c.maxHp}</div>
                      </div>
                    </div>
                    {[["gear", "装備"], ["weapon", "武器"]].map(([field, label]) => {
                      const item = c[field];
                      const parts = gearStatParts(item);
                      return (
                        <div key={field}>
                          <div className="sd-mt" style={{ marginTop: field === "weapon" ? 4 : 0, color: item ? "var(--cyan)" : "var(--ink-dimmer)" }}>
                            {label}: {item ? item.name : "なし"}
                          </div>
                          {parts.length > 0 && <div className="sd-mt" style={{ marginTop: 2 }}><StatDelta parts={parts} /></div>}
                          {item && g.phase !== "battle" && !reorderMode && (
                            <button className="sd-btn sm" style={{ marginTop: 4 }}
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                setG((s) => {
                                // 連打で二重に解除イベントが走っても、装備が「まだ本人についている」時だけ実行する
                                // (外側の item は描画時点のスナップショットなので、必ず s から再取得して確認する)
                                const tgt = s.crew.find((x) => x && x.id === c.id);
                                if (!tgt || !tgt[field]) return s;
                                // 収納が満杯だと外した装備の置き場が無い。満杯なら外さず、エラーを表示する。
                                if (s.bag.length >= bagCap) return pushLog(s, "収納がいっぱいです。装備を外せません。「装備」から不要な物を破棄してください。");
                                const removed = tgt[field];
                                let n = { ...s, crew: s.crew.map((x) => x && x.id === c.id ? { ...x, [field]: null } : x), bag: [...s.bag, removed] };
                                return refreshHp(n);
                                });
                              }}>{label}を外して収納</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            {/* ドラッグ中のゴースト表示。指(ポインタ)に追従させ、今つまんでいるのが
                誰かを分かりやすくする。ドロップ先の判定はポインタ座標で行うため、
                pointer-events: none にして下の要素へのヒットテストを妨げないようにする。 */}
            {dragCrewId && dragPos && (() => {
              const dc = g.crew.find((x) => x && x.id === dragCrewId);
              if (!dc) return null;
              const dr = rarityOf(dc.rarity);
              return (
                <div style={{
                  position: "fixed", left: dragPos.x, top: dragPos.y, transform: "translate(-50%, -50%)",
                  zIndex: 90, pointerEvents: "none", display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 10px", borderRadius: 12, border: "1px solid var(--cyan)",
                  background: "rgba(6,14,24,.92)", boxShadow: "0 6px 20px rgba(0,0,0,.5), 0 0 14px rgba(79,214,232,.35)",
                }}>
                  <Icon assetId={dc.asset} size={26} color={dr.color} />
                  <span style={{ fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                    {reorderMode ? dc.name : (dc.gear || dc.weapon ? [dc.gear?.name, dc.weapon?.name].filter(Boolean).join(" / ") : "装備なし")}
                  </span>
                </div>
              );
            })()}

            {(g.relics || []).length > 0 && (<>
              <div className="sd-lab">遺物 ({g.relics.length}/{relicN})</div>
              <div className="sd-grid">{g.relics.map((r) => <Cell key={r.id} item={r} onClick={() => {}} />)}</div>
            </>)}

            <div className="sd-hr" />
            <div className="sd-sub" style={{ margin: "4px 0 10px", fontSize: 10 }}>
              レア以上・回復品の自動ロックは「設定」画面でまとめて切り替えられます。
              ロックされた物は、個別に「ロック」ボタンをもう一度押せばその1点だけ解除できます。
            </div>
            <div className="sd-lab" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>収納 ({g.bag.length}/{bagCap})</span>
              <span style={{ display: "flex", gap: 6 }}>
                <button className={`sd-btn sm ${bagSort === "type" ? "pri" : ""}`} onClick={() => setBagSort("type")}>種類順</button>
                <button className={`sd-btn sm ${bagSort === "acq" ? "pri" : ""}`} onClick={() => setBagSort("acq")}>入手順</button>
              </span>
            </div>
            {g.bag.length === 0 && <div className="sd-sub">収納は空です。</div>}

            {/* 消耗品カテゴリ(回復系・バフ/支援系・攻撃系で分けて表示) */}
            {g.bag.some((x) => x.kind === "item") && (() => {
              const groupOf = (it) => {
                const k = CONSUMABLES[it.itemId]?.kind;
                if (k === "heal" || k === "healAll") return "回復";
                if (k === "cd" || k === "guard") return "バフ・支援";
                if (k === "bomb") return "攻撃";
                return "その他";
              };
              const items = viewBag.filter((it) => it.kind === "item");
              return ["回復", "バフ・支援", "攻撃", "その他"].map((gname) => {
                const list = items.filter((it) => groupOf(it) === gname);
                if (list.length === 0) return null;
                return (
                  <div key={gname}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--ink-dimmer)", margin: "6px 0 4px", letterSpacing: ".1em" }}>▸ 消耗品 ・ {gname}</div>
                    <div className="sd-grid">
                      {list.map((it) => (
                        <div key={it.id} style={{ position: "relative" }}>
                          <Cell item={it} actionLabel={g.phase === "battle" ? "使用(ターン消費)" : "使用"} onClick={() => consumeItem(it)}
                            sub={CONSUMABLES[it.itemId]?.kind === "bomb" ? `固定ダメージ ${bombPower(g.depth)}(敵全体)` : undefined} />
                          <DiscardRow it={it} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}

            {/* 装備カテゴリ(耐圧服・増幅器)/ 武器カテゴリ(攻撃力特化の別枠)。
                同じ kind:"gear" でも slot:"weapon" だけは独立した枠(c.weapon)に装着されるため、
                収納内でも見分けやすいよう分けて表示する。 */}
            {g.bag.some((x) => x.kind === "gear" && x.slot !== "weapon") && g.phase !== "battle" && (
              <>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-dimmer)", margin: "8px 0 4px", letterSpacing: ".1em" }}>▸ 装備</div>
                <div className="sd-grid">
                  {viewBag.filter((it) => it.kind === "gear" && it.slot !== "weapon").map((it) => (
                    <div key={it.id} style={{ position: "relative" }}>
                      <Cell item={it} hint={gearHint(it)} actionLabel="誰に装着するか選ぶ"
                        onClick={() => setG((s) => ({ ...s, equipPick: it.id }))} />
                      <DiscardRow it={it} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {g.bag.some((x) => x.kind === "gear" && x.slot === "weapon") && g.phase !== "battle" && (
              <>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-dimmer)", margin: "8px 0 4px", letterSpacing: ".1em" }}>▸ 武器(攻撃力特化・装備とは別枠)</div>
                <div className="sd-grid">
                  {viewBag.filter((it) => it.kind === "gear" && it.slot === "weapon").map((it) => (
                    <div key={it.id} style={{ position: "relative" }}>
                      <Cell item={it} hint={gearHint(it)} actionLabel="誰に装着するか選ぶ"
                        onClick={() => setG((s) => ({ ...s, equipPick: it.id }))} />
                      <DiscardRow it={it} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 遺物カテゴリ */}
            {g.bag.some((x) => x.kind === "relic") && g.phase !== "battle" && (
              <>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-dimmer)", margin: "8px 0 4px", letterSpacing: ".1em" }}>▸ 遺物</div>
                <div className="sd-grid">
                  {viewBag.filter((it) => it.kind === "relic").map((it) => (
                    <div key={it.id} style={{ position: "relative" }}>
                      <Cell item={it} actionLabel={`装着する (${(g.relics||[]).length}/${relicN})`}
                        onClick={() => setG((s) => {
                          // 連打で二重に装着イベントが走っても、遺物が「まだ収納にある」時だけ実行する
                          if (!s.bag.some((x) => x.id === it.id)) return s;
                          if ((s.relics || []).length >= relicN) return pushLog(s, "遺物の枠が埋まっています。");
                          return refreshHp({ ...s, relics: [...(s.relics || []), it], bag: s.bag.filter((x) => x.id !== it.id) });
                        })} />
                      <DiscardRow it={it} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 戦闘中の装備/遺物(表示のみ) */}
            {g.phase === "battle" && g.bag.some((x) => x.kind !== "item") && (
              <>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-dimmer)", margin: "8px 0 4px", letterSpacing: ".1em" }}>▸ 装備・遺物(戦闘中は使用不可)</div>
                <div className="sd-grid">
                  {g.bag.filter((it) => it.kind !== "item").map((it) => <Cell key={it.id} item={it} onClick={() => {}} />)}
                </div>
              </>
            )}

            <div className="sd-hr" />
            <div className="sd-rows">
              {/* タイトルの「帰還する」と全く同じ確認画面(newGameReview)を再利用する。
                  以前はここだけ完全に何も持ち帰れない特別扱いだったが、死亡時の持ち帰り
                  選択画面と同じ「持ち帰れる範囲は自動で次回に引き継ぐ」扱いに統一した
                  (自主的に撤退しただけなのに死亡より不利、という不整合の解消)。 */}
              <button className="sd-btn sm" style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                onClick={() => setG((s) => ({ ...s, bagOpen: false, newGameReview: true }))}>
                潜航をやめて母船へ戻る
              </button>
            </div>
          </div>
          <div className="sd-fs-actions" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
            <button className="sd-btn fs-back" onClick={() => setG((s) => ({ ...s, bagOpen: false }))}>戻る</button>
          </div>
        </div>
      )}

      {/* ── 回復キットを誰に使うか ── */}
      {g.healPick && (() => {
        const item = g.bag.find((x) => x.id === g.healPick.id);
        if (!item) return null;
        const cc = CONSUMABLES[item.itemId];
        return (
          <div className="sd-ov top" onClick={() => setG((s) => ({ ...s, healPick: null }))}>
            <div className="sd-ov-inner">
              <div className="sd-sheet" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
                <h2>誰に使う?</h2>
                <div className="sd-sub">「{cc.label}」(HP {Math.round(cc.power * 100)}% 回復)を使うクルーを選んでください。(HP満タンの相手は選べません)</div>
                <div className="sd-grid">
                  {g.crew.filter((c) => c && c.hp < c.maxHp).map((c) => {
                    const pct = Math.round((c.hp / c.maxHp) * 100);
                    return (
                      <div key={c.id} style={{ border: "1px solid var(--line)", padding: 10, background: "rgba(6,14,24,.6)", borderRadius: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <div style={{ display: "flex", flexShrink: 0 }}>
                            <Icon assetId={c.asset} size={38} color={rarityOf(c.rarity).color} />
                          </div>
                          <div>
                            <div className="sd-nm">{c.name}</div>
                            <div className="sd-mt">{CREW_TYPES[c.type].label}</div>
                          </div>
                        </div>
                        <div className="sd-mt" style={{ color: c.down ? "var(--danger)" : pct < 40 ? "var(--amber)" : "var(--ink-dim)", marginBottom: 6 }}>
                          {c.down ? "戦闘不能" : `HP ${c.hp}/${c.maxHp} (${pct}%)`}
                        </div>
                        <button className="sd-btn sm" style={{ width: "100%" }}
                          onClick={() => applyHealItem(item, c.id)}>
                          このクルーに使う
                        </button>
                      </div>
                    );
                  })}
                  {g.crew.every((c) => !c || c.hp >= c.maxHp) && (
                    <div className="sd-sub" style={{ color: "var(--ink-dimmer)" }}>全員HPが満タンです。</div>
                  )}
                </div>
                <div className="sd-rows">
                  <button className="sd-btn sm" onClick={() => setG((s) => ({ ...s, healPick: null }))}>やめる</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 装備を誰に装着するか ── */}
      {g.equipPick && (() => {
        const gear = g.bag.find((x) => x.id === g.equipPick);
        if (!gear) return null;
        // suit/module は c.gear(1枠を共有)、weapon は c.weapon(独立した2つめの枠)に入る。
        const field = GEAR_SLOT_FIELD[gear.slot] || "gear";
        return (
          <div className="sd-ov top" onClick={() => setG((s) => ({ ...s, equipPick: null }))}>
            <div className="sd-ov-inner">
              <div className="sd-sheet" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
                <h2>誰に装着する?</h2>
                <div className="sd-sub">「{gear.name}」を装着するクルーを選んでください。装備中の相手を選ぶと入れ替えます。</div>
                <div className="sd-grid">
                  {g.crew.filter(Boolean).map((c) => {
                    const r = rarityOf(c.rarity);
                    const pct = (c.hp / c.maxHp) * 100;
                    const current = c[field];
                    const deltaParts = gearDeltaParts(gear, current);
                    return (
                      <div key={c.id} style={{ border: "1px solid var(--line)", padding: 10, background: "rgba(6,14,24,.6)", borderRadius: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <div className="sd-cr-icon">
                            <Icon assetId={c.asset} size={38} color={r.color} />
                            <span className="sd-rar sd-rar-overlay" style={{ background: r.color, color: "#04121a" }}>
                              {"★".repeat(rarityIdx(c.rarity) + 1)}
                            </span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="sd-nm" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                            <div className={`sd-cr-bar ${pct < 30 ? "low" : ""}`} style={{ maxWidth: "none", marginTop: 4 }}><i style={{ width: `${pct}%` }} /></div>
                            <div className="sd-cr-hp" style={{ marginTop: 2 }}>{c.hp}/{c.maxHp}</div>
                          </div>
                        </div>
                        <div className="sd-mt" style={{ color: current ? "var(--cyan)" : "var(--ink-dimmer)" }}>
                          {current ? `現在(${gear.slot === "weapon" ? "武器" : "装備"}): ${current.name}` : `${gear.slot === "weapon" ? "武器" : "装備"}なし`}
                        </div>
                        <div className="sd-mt" style={{ marginTop: 2 }}>
                          装着すると: <StatDelta parts={deltaParts} />
                        </div>
                        <button className="sd-btn sm" style={{ width: "100%", marginTop: 6 }}
                          onClick={() => setG((s) => {
                            // 連打で二重に装着イベントが走っても、装備が「まだ収納にある」時だけ実行する。
                            // (1回目で既に装着済みなら、ここで弾いて二重付与を防ぐ)
                            if (!s.bag.some((x) => x.id === gear.id)) return s;
                            const tgt = s.crew.find((x) => x && x.id === c.id);
                            if (!tgt) return s;
                            const old = tgt[field];
                            let n = {
                              ...s, equipPick: null,
                              bag: s.bag.filter((x) => x.id !== gear.id).concat(old ? [old] : []),
                              crew: s.crew.map((x) => x && x.id === c.id ? { ...x, [field]: gear } : x),
                            };
                            return pushLog(refreshHp(n), `${tgt.name}が${gear.name}を装着した。`);
                          })}>
                          {current ? "入れ替えて装着" : "装着する"}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="sd-rows">
                  <button className="sd-btn sm" onClick={() => setG((s) => ({ ...s, equipPick: null }))}>やめる</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 交代選択(隊が満員のとき) ── */}
      {g.swapFor && (
        <div className="sd-ov top" onClick={() => setG((s) => ({ ...s, swapFor: null }))}>
          <div className="sd-ov-inner">
          <div className="sd-sheet" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <h2>誰と交代する?</h2>
            <div className="sd-sub">{g.swapFor.name} を隊に加えます。外したクルーはここで別れることになります。</div>
            <div className="sd-grid">
              {g.crew.map((c, i) => c && (
                <Cell key={c.id} item={c} actionLabel="この人と交代"
                  onClick={() => { const t = g.swapFor; setG((s) => ({ ...s, swapFor: null })); swapRecruit(t, i); }} />
              ))}
            </div>
            <div className="sd-rows">
              <button className="sd-btn sm" onClick={() => setG((s) => ({ ...s, swapFor: null }))}>やめる</button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* ── 進行前の確認 ── */}
      {g.confirm === "drops" && g.drops.length > 0 && (
        <div className="sd-ov top" onClick={() => setG((s) => ({ ...s, confirm: null }))}>
          <div className="sd-ov-inner">
          <div className="sd-sheet" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
            <h2>未 回 収 あ り</h2>
            <div className="sd-sub">
              まだ回収していない物資が <b style={{ color: "var(--amber)" }}>{g.drops.length} 点</b> あります。
              ここを離れると戻れません。<span style={{ color: "var(--ink-dimmer)" }}>(収納 {g.bag.length}/{bagCap})</span>
            </div>
            <div className="sd-grid">{g.drops.map((d) => <Cell key={d.id} item={d} onClick={() => take(d)} actionLabel="回収" hint={gearHint(d)} />)}</div>
            {g.full && <div className="sd-note">収納が満杯です。戻って整理するか、置いていってください。</div>}
            <div className="sd-rows">
              <button className="sd-btn sm" style={{ marginRight: "auto" }} onClick={() => setG((s) => ({ ...s, confirm: null }))}>← 戻る</button>
              <button className="sd-btn sm" onClick={takeAllGo}>すべて回収して進む</button>
              <button className="sd-btn pri" onClick={leaveNow}>置いて降下する ↓</button>
            </div>
          </div>
          </div>
        </div>
      )}
      {g.confirm === "event" && (
        <div className="sd-ov top" onClick={() => setG((s) => ({ ...s, confirm: null }))}>
          <div className="sd-ov-inner">
          <div className="sd-sheet" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <h2>{g.phase === "wreck" ? "残骸が未調査です" : "補給していません"}</h2>
            <div className="sd-sub">
              {g.phase === "wreck"
                ? "調べずに進むと、中の装備や遺物は失われます。残骸は高レアが出やすい地点です。"
                : "ここを逃すと、隊のHPと戦闘不能者を戻す機会を失います。"}
            </div>
            <div className="sd-rows">
              <button className="sd-btn pri" style={{ marginRight: "auto" }} onClick={() => setG((s) => ({ ...s, confirm: null }))}>
                ← 戻って{g.phase === "wreck" ? "調べる" : "休む"}
              </button>
              <button className="sd-btn sm" onClick={leaveNow}>このまま降下 ↓</button>
            </div>
          </div>
          </div>
        </div>
      )}
      {g.confirm === "signal" && (
        <div className="sd-ov top" onClick={() => setG((s) => ({ ...s, confirm: null }))}>
          <div className="sd-ov-inner">
          <div className="sd-sheet" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <h2>生存者を残していきます</h2>
            <div className="sd-sub">まだ誰も勧誘していません。ここで拾わなかった人物とは二度と会えません。</div>
            <div className="sd-rows">
              <button className="sd-btn pri" style={{ marginRight: "auto" }} onClick={() => setG((s) => ({ ...s, confirm: null }))}>← 戻って選ぶ</button>
              <button className="sd-btn sm" onClick={leaveNow}>見捨てて降下 ↓</button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* 「潜航をやめて母船へ戻る」は下の newGameReview(元は「新しく始める」専用)を共用する。
          以前はここに専用の確認ダイアログがあり、持ち帰り設定を一切無視して完全に何も
          持ち帰れなかったが、死亡・タイトルからの新規開始と挙動を揃えるため統合した。 */}

      {/* ── レア物資が出た時だけ出す「物資追加」広告ポップアップ(バツを押すまで出続ける) ── */}
      {g.phase === "spoils" && !g.doubleClaimed && !g.doubleAdDismissed
        && rewardAdUsesLeft(meta, "double") > 0 && g.drops.some((d) => rarityIdx(d.rarity) >= rarityIdx("rare")) && (
        <div className="sd-ov top">
          <div className="sd-ov-inner">
            <div className="sd-sheet" style={{ maxWidth: 420 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h2>高レア物資を検出</h2>
                <button className="sd-btn sm" onClick={() => setG((s) => ({ ...s, doubleAdDismissed: true }))}><X size={13} /></button>
              </div>
              <div className="sd-sub" style={{ margin: "8px 0 12px" }}>
                ☆☆☆以上の物資を検出しました。広告を見ると、さらに物資が追加されます
                (残り{rewardAdUsesLeft(meta, "double")}回)。
              </div>
              {rewardAdFailNote({ marginBottom: 10 })}
              <button className="sd-btn amber sd-btn-lg" style={{ width: "100%" }}
                disabled={!!g.rewardAdPending}
                onClick={() => requestRewardAd("double")}>
                <PlayCircle size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                {g.rewardAdPending === "double" ? "広告を読み込み中…" : "広告を見て物資を追加"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 高レアアイテムを手放す前の確認(スクラップ/破棄 共通) ── */}
      {g.dangerConfirm && (() => {
        const it = g.bag.find((x) => x.id === g.dangerConfirm.itemId);
        if (!it) { setG((s) => ({ ...s, dangerConfirm: null })); return null; }
        const r = rarityOf(it.rarity);
        const isScrap = g.dangerConfirm.kind === "scrap";
        return (
          <div className="sd-ov top" onClick={() => setG((s) => ({ ...s, dangerConfirm: null }))}>
            <div className="sd-ov-inner">
              <div className="sd-sheet" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
                <h2>{isScrap ? "スクラップしますか?" : "本当に破棄しますか?"}</h2>
                <div className="sd-sub" style={{ margin: "8px 0 12px" }}>
                  <span className="sd-rar" style={{ background: r.color, color: "#04121a", marginRight: 6 }}>
                    {"★".repeat(rarityIdx(it.rarity) + 1)}
                  </span>
                  <b style={{ color: "var(--ink)" }}>{it.name}</b> は高レア品です。
                  {isScrap ? "分解すると元には戻せません。" : "破棄すると二度と手に入りません。"}
                </div>
                <div className="sd-rows">
                  <button className="sd-btn sm" style={{ marginRight: "auto" }} onClick={() => setG((s) => ({ ...s, dangerConfirm: null }))}>やめる</button>
                  <button className="sd-btn pri" style={{ background: "var(--danger)", borderColor: "var(--danger)" }}
                    onClick={() => {
                      setG((s) => ({ ...s, dangerConfirm: null }));
                      if (isScrap) scrapItem(it);
                      else setG((s) => {
                        // ダイアログを開いてから閉じるまでの間にロック状態が変わっている可能性を考慮し、
                        // 実行直前にもう一度 s.bag から再確認してから破棄する。
                        const live = s.bag.find((x) => x.id === it.id);
                        if (!live || live.locked) return s;
                        return { ...s, bag: s.bag.filter((x) => x.id !== live.id) };
                      });
                    }}>{isScrap ? "スクラップする" : "破棄する"}</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── スキルツールチップ(長押し) ── */}
      {skillTip && (
        // onTouchStart で閉じると、閉じた直後に発生する合成 click イベントが
        // (このオーバーレイが既に消えているため)裏側のクルーカード等に素通りしてしまい、
        // 同じ場所がまたスキルだった場合に閉じたその場で再表示される不具合になっていた。
        // click だけで閉じるようにし、閉じるタップの間は必ずこのオーバーレイが
        // 裏側への操作を吸収し続けるようにする。
        <div className="sd-tip" onClick={() => setSkillTip(null)}>
          <div className="sd-tip-body" onClick={(e) => e.stopPropagation()}>
            <div className="sd-tip-name">{skillTip.name}</div>
            <div className="sd-tip-desc">{skillTip.desc}</div>
            <div className="sd-tip-tag">[{skillTip.tag}]</div>
            <div className="sd-tip-close">タップで閉じる</div>
          </div>
        </div>
      )}

      {/* ── 初回案内 ── */}
      {g.coach && g.phase === "battle" && (
        <div className="sd-coach">
          <h4>OPERATION BRIEFING</h4>
          <p>
            クルーは<b style={{ color: "var(--ink)" }}>1ターンに3人が順番に行動</b>します。攻撃か固有スキルを選び、目標を指定してください。<br />
            ダメージに「<b style={{ color: "var(--amber)" }}>弱点</b>」と出た属性は有効です。一度暴いた弱点は記録され、次の潜航にも残ります。<br />
            隊が全滅しても、名簿のクルーと回収した遺物は失われません。
          </p>
          <div className="sd-rows" style={{ marginTop: 9 }}>
            <button className="sd-btn pri sm" onClick={() => setG((s) => ({ ...s, coach: false }))}>了解</button>
          </div>
        </div>
      )}

      {/* ── 全滅直前: 広告で復活するか ── */}
      {g.phase === "reviveOffer" && (
        <div className="sd-ov top">
          <div className="sd-ov-inner">
          <div className="sd-sheet" style={{ maxWidth: 380, textAlign: "center" }}>
            <h2 style={{ color: "var(--danger)" }}>隊 が 沈 み か け て い る</h2>
            <div className="sd-sub" style={{ marginTop: 10 }}>
              観測機を再起動すれば、この場で戦線に踏みとどまれる。<br />
              この潜航で <b style={{ color: "var(--amber)" }}>1度だけ</b> 使えます。
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
              <button className="sd-btn pri" disabled={!!g.rewardAdPending}
                onClick={() => requestRewardAd("revive")}>
                {g.rewardAdPending === "revive" ? "広告を読み込み中…(15秒ほど)" : "広告を見て復活する"}
              </button>
              <button className="sd-btn sm" onClick={() => finalizeLost(g)}>あきらめる</button>
            </div>
            {rewardAdFailNote({ marginTop: 10 })}
          </div>
          </div>
        </div>
      )}

      {/* ── 全滅 → 浮上 ── */}
      {g.phase === "lost" && (
        <div className="sd-ov">
          <div className="sd-ov-inner">
          <div className="sd-sheet">
            <h2 style={{ color: "var(--danger)" }}>隊 は 沈 ん だ</h2>
            <div className="sd-sub">
              深度 {depthMeters(g.depth)}m、{Z.name}。緊急浮上装置が作動した。<br />
              船内ストレージへ持ち帰れるのは <b style={{ color: "var(--amber)" }}>{storageN} 点</b> まで(種類を問わない共通枠)。
              名簿のクルーは失われません(次の潜航で再編成できます)。<br />
              再開地点: <b style={{ color: "var(--cyan)" }}>海域 {Math.min(meta.checkpoint, 10)} の入口</b>
            </div>
            <div className="sd-grid">
              {allSalvage(g).map((it) => (
                <Cell key={it.id} item={it} on={g.pick.includes(it.id)} onClick={() => togglePick(it)}
                  actionLabel={g.pick.includes(it.id) ? "✓ 持ち帰る" : "選択する"} />
              ))}
            </div>
            <div className="sd-rows">
              <div style={{ marginRight: "auto", alignSelf: "center", fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-dim)" }}>
                選択 <span style={{ color: g.pick.length >= storageN ? "var(--amber)" : "var(--ink-dim)" }}>{g.pick.length}/{storageN}</span>
              </div>
              <button className="sd-btn sm" onClick={() => setG((s) => ({ ...s, pick: recommendStorage(s, storageN) }))}>推奨</button>
              <button className="sd-btn sm" onClick={() => setG((s) => ({ ...s, pick: [] }))}>解除</button>
              <button className="sd-btn pri" onClick={surfaceAndRedive}>浮上して再編成する</button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* ── 海域クリア ── */}
      {g.phase === "zoneClear" && (
        <div className="sd-ov">
          <div className="sd-ov-inner">
          <div className="sd-sheet" style={{ textAlign: "center" }}>
            <div style={{ marginBottom: 4 }}><Compass size={26} color="var(--cyan)" strokeWidth={1.3} /></div>
            <h2>海域 {zoneOf(g.depth) + 1} 突 破</h2>
            <div className="sd-sub">
              {Z.boss.name} は沈黙した。さらに下へ続く裂け目が開いている。<br />
              次は 海域 {zoneOf(g.depth) + 2}「{ZONES[Math.min(9, zoneOf(g.depth) + 1)].name}」({depthMeters(Math.min(100, g.depth + 1))}m〜)。<br /><br />
              <b style={{ color: "var(--cyan)" }}>獲得:</b> 残響片 +{g.zoneShards ?? 3}{g.zoneCompBonus > 0 && <span style={{ color: "var(--amber)" }}>(図鑑コンプ +{g.zoneCompBonus})</span>} ／ 以後この海域から再開 ／ 主の戦利品
            </div>
            <div className="sd-grid" style={{ textAlign: "left" }}>
              {g.drops.map((d) => <Cell key={d.id} item={d} onClick={() => take(d)} actionLabel="回収" hint={gearHint(d)} />)}
            </div>
            <div className="sd-rows" style={{ justifyContent: "center" }}>
              <button className="sd-btn pri" onClick={() => { showInterstitial("zoneClear"); takeAllGo(); }}>さらに深くへ ↓</button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* ── 星海到達 エンディング ── */}
      {g.phase === "ending" && (
        <div className="sd-ov">
          <div className="sd-ov-inner">
          <div className="sd-sheet" style={{ textAlign: "center" }}>
            <div style={{ marginBottom: 4 }}><Aperture size={28} color="var(--amber)" strokeWidth={1.2} /></div>
            <h2>境 界 を 越 え た</h2>
            <div className="sd-credits">
              <div className="sd-credits-in">
                <h3>── FINAL LOG ──</h3>
                深度10000メートル。<br />
                観測者の環が開いたとき、水圧の感覚が消えた。<br /><br />
                眼下に広がっていたのは、海底ではなく星だった。<br />
                この海は最初から、宇宙の一部を汲んでいたのだ。<br /><br />
                何度も隊は沈み、そのたびに新しい三人が潜った。<br />
                名簿に残る名前だけが、その全部を憶えている。<br /><br />
                <h3>── 航 海 記 録 ──</h3>
                潜航回数 …… {meta.dives}<br />
                喪失した隊 …… {meta.deaths}<br />
                記録したクルー …… {(meta.roster || []).length} 種<br />
                星海到達 …… {meta.clears} 回<br /><br />
                <h3>深海ダンジョン</h3>
                — 完 —<br /><br />
                ……海はまだ、下へ続いている。<br />
                (回収品と名簿を引き継いで、もう一度潜れます)
              </div>
            </div>
            <div className="sd-rows" style={{ justifyContent: "center" }}>
              <button className="sd-btn pri" onClick={async () => {
                clearGameState();
                native("progress", { event: "depth_game_clear", clears: (meta.clears || 0) });
                setMeta((prev) => {
                  const m2 = { ...prev, checkpoint: 1 };
                  saveMeta(m2);
                  return m2;
                });
                showInterstitial("ending");
                setG({ screen: "title" });
              }}>母船へ帰投する</button>
            </div>
          </div>
          </div>
        </div>
      )}
      {/* ── 帰還(自主的に潜航を切り上げて母船へ戻った直後) ──
          全滅(lost)や最終エンディング(ending)と同じく、独立した1つの区切りとして
          見せる。ここでストレージに入った物(returnCarried)は、この後「強化」タブで
          アーティファクトとして使ったり、次の潜航で持ち出したりできる。 */}
      {g.phase === "return" && (
        <div className="sd-ov">
          <div className="sd-ov-inner">
          <div className="sd-sheet" style={{ textAlign: "center" }}>
            <div style={{ marginBottom: 4 }}><Compass size={26} color="var(--cyan)" strokeWidth={1.3} /></div>
            <h2>帰 還</h2>
            <div className="sd-sub">
              深度 {depthMeters(g.depth)}m まで潜り、自らの意志で潜航を切り上げた。<br />
              持っていた物は船のストレージへ運び込まれ、以後いつでも使える。
            </div>
            {(g.returnCarried || []).length > 0 ? (
              <div className="sd-grid" style={{ textAlign: "left", margin: "10px 0" }}>
                {g.returnCarried.map((it) => <Cell key={it.id} item={it} onClick={() => {}} />)}
              </div>
            ) : (
              <div className="sd-sub" style={{ color: "var(--ink-dimmer)", margin: "10px 0" }}>今回は何も持ち帰れなかった。</div>
            )}
            <div className="sd-sub" style={{ fontSize: 10.5, lineHeight: 1.9, textAlign: "left", background: "rgba(6,14,24,.5)", padding: "8px 10px", borderRadius: 10 }}>
              船の中では、下部タブの「強化」でアーティファクト(遺物)を消費してクルーを永久強化したり、
              「スキル」で残響片を使ってスキルツリーを育てたりできます。装備・消耗品はいつでも収納から
              クルーへ着せ替えられます。準備が整ったら、また潜航を開始してください。
            </div>
            <div className="sd-rows" style={{ justifyContent: "center", marginTop: 10 }}>
              <button className="sd-btn pri" onClick={() => {
                showInterstitial("toTitle");
                clearGameState();
                setResumable(null);
                setG({ screen: "title" });
              }}>母船へ</button>
            </div>
          </div>
          </div>
        </div>
      )}
      {metaOverlays}
      <HomeTabBar onHome={pauseToTitle} />
    </div>
  );
}

/* ============================================================
   帰還前の確認 ― 船のストレージへ持ち帰る物を選べる
============================================================ */
function NewGameReviewOverlay({ g, storageN, onClose, onConfirm }) {
  const salvage = allSalvage(g);
  // 初期値は推奨(ロック品優先)。死亡時の持ち帰り選択画面と同じ操作感に揃える。
  // 船内ストレージは種類を問わない共通プール(storageN)として数える。
  const [pick, setPick] = useState(() => recommendStorage(g, storageN));
  const toggle = (it) => setPick((p) => {
    if (p.includes(it.id)) return p.filter((x) => x !== it.id);
    return p.length < storageN ? [...p, it.id] : p;
  });
  return (
    <div className="sd-ov top" onClick={onClose}>
      <div className="sd-ov-inner">
        <div className="sd-sheet sd-sheet-scroll" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
          <div className="sd-sheet-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <h2>この内容で帰還しますか?</h2>
            <button className="sd-btn sm" onClick={onClose}><X size={13} /></button>
          </div>
          <div className="sd-sub" style={{ margin: "8px 0 4px" }}>
            この潜航を終えて母船へ戻ります。船のストレージへ持ち帰る物を選んでください
            (船内ストレージ {storageN}点まで、種類を問わない共通枠)。
          </div>
          {salvage.length > 0 ? (
            <div className="sd-grid">
              {salvage.map((it) => (
                <Cell key={it.id} item={it} on={pick.includes(it.id)} onClick={() => toggle(it)}
                  actionLabel={pick.includes(it.id) ? "✓ 持ち帰る" : "選択する"} />
              ))}
            </div>
          ) : (
            <div className="sd-sub" style={{ color: "var(--ink-dimmer)" }}>持ち物はありません。</div>
          )}
          <div className="sd-rows" style={{ marginTop: 10 }}>
            <div style={{ marginRight: "auto", alignSelf: "center", fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-dim)" }}>
              選択 <span style={{ color: pick.length >= storageN ? "var(--amber)" : "var(--ink-dim)" }}>{pick.length}/{storageN}</span>
            </div>
            <button className="sd-btn sm" onClick={() => setPick(recommendStorage(g, storageN))}>推奨</button>
            <button className="sd-btn sm" onClick={() => setPick([])}>解除</button>
          </div>
          <div className="sd-rows">
            <button className="sd-btn sm" style={{ marginRight: "auto" }} onClick={onClose}>やめる</button>
            <button className="sd-btn pri"
              onClick={() => onConfirm(salvage.filter((it) => pick.includes(it.id)))}>
              この内容で帰還する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   観測記録(図鑑)オーバーレイ
============================================================ */
function BestiaryOverlay({ meta, onClose }) {
  const [zi, setZi] = useState(null);
  const [sel, setSel] = useState(null); // { id, isBoss, isMutant }
  const seen = meta?.seen || {};
  const scanned = meta?.scanned || {};
  const specimens = meta?.specimens || {};

  // 遭遇済みの海域だけ表示
  const zones = ZONES.map((z, i) => ({ z, i }))
    .filter(({ i }) => {
      const { enemies, mutant, boss } = zoneBookIds(i);
      return [...enemies, mutant, boss].some((id) => seen[id]);
    });
  const totalSeen = ZONES.reduce((sum, _z, i) => sum + zoneBestiaryStatus(i, meta).seenN, 0);
  const totalAll = ZONES.reduce((sum, _z, i) => sum + zoneBestiaryStatus(i, meta).total, 0);

  function chips(id, weak, resist) {
    const d = scanned[id] || { w: [], r: [] };
    const unknown = [...(weak || []), ...(resist || [])].some((t) => !d.w.includes(t) && !d.r.includes(t));
    return (
      <div className="sd-tags" style={{ justifyContent: "flex-start", marginTop: 6 }}>
        {d.w.map((t) => <span key={"w" + t} className="sd-tag w">弱 {t}</span>)}
        {d.r.map((t) => <span key={"r" + t} className="sd-tag r">耐 {t}</span>)}
        {unknown && <span className="sd-tag q">未走査</span>}
      </div>
    );
  }

  function Detail() {
    if (!sel || zi == null) return null;
    const Z = ZONES[zi];
    let name, asset, weak, resist, lore, id = sel.id;
    if (sel.isBoss) {
      name = Z.boss.name; asset = Z.boss.asset; weak = Z.boss.weak; resist = Z.boss.resist;
      lore = BOSS_LORE[Z.boss.id];
    } else if (sel.isMutant) {
      const A = ANOMALIES[zi];
      name = A.name; asset = A.asset;
      weak = ANOMALY_WEAK; resist = [];
      lore = { note: `${A.note} 全属性が通り、逃走の間際に標本を落とす。` };
    } else {
      const b = ENEMY_BOOK[id];
      name = b.name; asset = b.asset; weak = b.weak; resist = b.resist; lore = ENEMY_LORE[id];
    }
    const specN = specimens[id] || 0;
    const deepOpen = specN >= SPECIMEN_UNLOCK;
    return (
      <div>
        <div className={`sd-bst-hero ${sel.isBoss || sel.isMutant ? "rare" : ""}`}>
          <Icon assetId={asset} size={150} color={sel.isBoss || sel.isMutant ? "var(--amber)" : "var(--cyan)"} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div>
            {(sel.isBoss || sel.isMutant) && <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: ".2em", color: "var(--amber)" }}>{sel.isBoss ? "主" : "変異"}</div>}
            <div style={{ fontSize: 15, fontWeight: 700 }}>{name}</div>
          </div>
        </div>
        {lore?.note && <div className="sd-bst-lore">{lore.note}</div>}
        {chips(id, weak, resist)}
        {!sel.isBoss && !sel.isMutant && (
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-dim)", marginTop: 8 }}>
            標本
            <span className="sd-spec-dots">
              {Array.from({ length: SPECIMEN_UNLOCK }, (_, k) => <i key={k} className={k < specN ? "on" : ""} />)}
            </span>
          </div>
        )}
        {lore?.deep && (deepOpen
          ? <div className="sd-bst-lore deep">{lore.deep}</div>
          : <div className="sd-bst-lore" style={{ opacity: .5 }}>生態レポート — 標本を {SPECIMEN_UNLOCK} 個集めると解放</div>)}
        {lore?.chain?.length > 0 && (
          <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--ink-dimmer)", marginTop: 8 }}>
            生態連鎖: {lore.chain.map((c) => ENEMY_BOOK[c]?.name || c).join(" · ")}
          </div>
        )}
      </div>
    );
  }

  // 3階層(海域一覧→海域内グリッド→個体の詳細)を1つの戻るボタンで一段ずつ戻る。
  // 上部は情報のみ(タップは下部の「戻る」に集約)。
  const goBack = () => {
    if (sel) { setSel(null); return; }
    if (zi != null) { setZi(null); return; }
    onClose();
  };

  const zoneBg = zi != null ? zoneBgUrl(zi) : null;

  return (
    <div className="sd-fs-root sd-fs-meta">
      {/* 海域を開いている間は、その海域の画像をパネル全面に薄く透過させて敷く。
          sd-fs-root 直下(position:fixed の全面)に1枚だけ置くので、スクロールしても
          切れたりズレたりしない。 */}
      {zoneBg && <img className="sd-fs-bg" src={zoneBg} alt="" />}
      <div className="sd-fs-top">
        <h2>観 測 記 録</h2>
        {zi == null && !sel && <div className="sd-sub" style={{ margin: "6px 0 0" }}>記録 {totalSeen} / {totalAll} 種</div>}
        {zi != null && !sel && <div className="sd-sub" style={{ margin: "6px 0 0" }}>海域 {zi + 1} {ZONES[zi].name}</div>}
      </div>

      <div className="sd-fs-body">
        {zi == null ? (
          zones.length === 0
            ? <div className="sd-sub" style={{ textAlign: "center", padding: "24px 0" }}>まだ記録がありません。<br />潜航して生物と遭遇すると記録されます。</div>
            : <div className="sd-bst-descent">
                {zones.map(({ z, i }) => {
                  const st = zoneBestiaryStatus(i, meta);
                  const bg = zoneBgUrl(i);
                  return (
                    <button key={i} className="sd-bst-zcard" onClick={() => setZi(i)}>
                      {bg && <img className="zc-bg" src={bg} alt="" />}
                      <div className="zdepth">{z.depth}</div>
                      <div className="zn">海域 {i + 1} {z.name}</div>
                      <div className="zp">記録 {st.seenN}/{st.total} {st.complete && <span className="zc">◆ コンプ</span>}</div>
                    </button>
                  );
                })}
              </div>
        ) : sel ? <Detail /> : (() => {
          const { enemies, mutant, boss } = zoneBookIds(zi);
          const cells = [
            ...enemies.map((id) => ({ id, isBoss: false, isMutant: false })),
            { id: mutant, isBoss: false, isMutant: true },
            { id: boss, isBoss: true, isMutant: false },
          ];
          return (
            <div className="sd-bst-grid">
              {cells.map((c) => {
                const isSeen = !!seen[c.id];
                const b = c.isBoss ? ZONES[zi].boss : c.isMutant ? ANOMALIES[zi] : ENEMY_BOOK[c.id];
                return (
                  <div key={c.id} className={`sd-bst-cell ${isSeen ? "" : "unseen"} ${c.isBoss ? "boss" : ""}`}
                    onClick={isSeen ? () => setSel(c) : undefined}>
                    <div className="sd-bst-icon">
                      {isSeen
                        ? <Icon assetId={b.asset} size={36} color={c.isBoss || c.isMutant ? "var(--amber)" : "var(--cyan)"} />
                        : <span style={{ fontSize: 13, color: "var(--ink-dimmer)", fontWeight: 700 }}>?</span>}
                    </div>
                    <div className="bn" style={{ color: (c.isBoss || c.isMutant) && isSeen ? "var(--amber)" : undefined }}>
                      {isSeen ? b.name : "???"}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      <div className="sd-fs-actions" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
        <button className="sd-btn fs-back" onClick={goBack}>戻る</button>
      </div>
    </div>
  );
}

/* ============================================================
   スキルツリーオーバーレイ
============================================================ */
const SK_MIN_SCALE = 0.28;
const SK_MAX_SCALE = 2.4;
const clampScale = (v) => Math.max(SK_MIN_SCALE, Math.min(SK_MAX_SCALE, v));

function SkillTreeOverlay({ meta, onClose, onBuy }) {
  const skills = meta?.skills || {};
  const shards = meta?.shards || 0;
  const [selId, setSelId] = useState(null);
  const [view, setView] = useState({ scale: 0.5, x: 0, y: 0 });
  const viewportRef = useRef(null);
  const gestureRef = useRef({ mode: null });

  // 初期表示だけ、実際のビューポート寸法から全系統が収まる縮尺へ合わせる
  // (テスト環境など寸法が取れない場合は既定の0.5倍のまま)。
  useEffect(() => {
    const el = viewportRef.current;
    const w = el?.clientWidth || 0, h = el?.clientHeight || 0;
    if (w > 0 && h > 0) {
      const fit = (Math.min(w, h) * 0.46) / Math.max(SKILL_LAYOUT.maxRadius, 1);
      setView((v) => ({ ...v, scale: clampScale(fit) }));
    }
  }, []);

  const sel = selId ? SKILL_BY_ID[selId] : null;
  const owned = !!sel && !!skills[sel.id];
  const revealed = !!sel && skillPrereqsMet(sel, skills) && skillUnlocked(sel, meta);
  const buyable = !!sel && !owned && revealed && shards >= sel.cost;

  const bg = staticBgUrl("skilltree");

  const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      gestureRef.current = { mode: "pinch", startDist: dist(e.touches[0], e.touches[1]), startScale: view.scale };
    } else if (e.touches.length === 1) {
      gestureRef.current = { mode: "pan", startX: e.touches[0].clientX, startY: e.touches[0].clientY, startViewX: view.x, startViewY: view.y };
    }
  };
  const onTouchMove = (e) => {
    const g = gestureRef.current;
    if (g.mode === "pinch" && e.touches.length === 2) {
      try { e.preventDefault(); } catch { /* passive listener: 無視してよい */ }
      const d = dist(e.touches[0], e.touches[1]);
      setView((v) => ({ ...v, scale: clampScale(g.startScale * (d / (g.startDist || d))) }));
    } else if (g.mode === "pan" && e.touches.length === 1) {
      try { e.preventDefault(); } catch { /* passive listener: 無視してよい */ }
      const dx = e.touches[0].clientX - g.startX, dy = e.touches[0].clientY - g.startY;
      setView((v) => ({ ...v, x: g.startViewX + dx, y: g.startViewY + dy }));
    }
  };
  const onTouchEnd = (e) => {
    if (e.touches.length === 1) {
      gestureRef.current = { mode: "pan", startX: e.touches[0].clientX, startY: e.touches[0].clientY, startViewX: view.x, startViewY: view.y };
    } else {
      gestureRef.current = { mode: null };
    }
  };
  const onWheel = (e) => {
    try { e.preventDefault(); } catch { /* passive listener: 無視してよい */ }
    if (e.ctrlKey || e.metaKey) {
      setView((v) => ({ ...v, scale: clampScale(v.scale * (1 - e.deltaY * 0.012)) }));
    } else {
      setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
    }
  };
  const zoomBy = (mult) => setView((v) => ({ ...v, scale: clampScale(v.scale * mult) }));
  const resetView = () => setView((v) => ({ ...v, x: 0, y: 0 }));

  const links = [];
  SKILL_TREE.forEach((s) => {
    const p = SKILL_LAYOUT.parentOf[s.id];
    if (!p) return;
    const a = SKILL_LAYOUT.pos[p], b = SKILL_LAYOUT.pos[s.id];
    if (!a || !b) return;
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const state = skills[s.id] ? "owned" : (!owned && skillPrereqsMet(s, skills) && skillUnlocked(s, meta) && shards >= s.cost ? "buyable" : "");
    links.push({ id: s.id, x: a.x, y: a.y, len, angle, state, color: SK_CAT_META[s.cat]?.color });
  });

  const SelIcon = sel ? skillIconFor(sel) : null;

  return (
    <div className="sd-fs-root sd-fs-meta">
      {/* 紺色一色で寂しくならないよう、専用の背景画像があれば薄く敷く
          (src/assets/bg/skilltree.webp。無い間は今まで通り地色のまま)。 */}
      {bg && <img className="sd-fs-bg" src={bg} alt="" />}
      {/* 上部: 情報のみ(タップ操作が必要な要素は置かない=画面上のほうは押しづらいため) */}
      <div className="sd-fs-top">
        <h2>ス キ ル ツ リ ー</h2>
        <div className="sd-sub" style={{ margin: "6px 0 8px" }}>
          残響片 <b style={{ color: "var(--amber)" }}>{shards}</b> ／ ボスや変異個体、図鑑コンプで手に入ります。二本指で拡大縮小・移動できます。
        </div>
        {!!meta?.skillRefund && (
          <div className="sd-note" style={{ color: "var(--amber)", borderColor: "rgba(255,210,127,.35)", marginBottom: 8 }}>
            ツリーが再構成されました。失効分の残響片 {meta.skillRefund} を還元しました。
          </div>
        )}
      </div>

      {/* 中央: 中心の核から6系統が枝分かれして広がる円環キャンバス。ノードはアイコンのみ、
          タップで選ぶと下の詳細パネルに名称・説明・習得ボタンが出る(以前の縦一覧+
          右下固定ボタンから、パン/ピンチズーム可能な円環ツリーへ全面刷新した)。 */}
      <div className="sd-fs-body sd-sktree-body" ref={viewportRef}>
        <div className="sd-sktree-viewport"
          onWheel={onWheel} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <div className="sd-sktree-canvas" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
            {links.map((l) => (
              <div key={l.id} className={`sd-sktree-link ${l.state}`}
                style={{ left: `calc(50% + ${l.x}px)`, top: `calc(50% + ${l.y}px)`, width: `${l.len}px`, transform: `rotate(${l.angle}deg)`, "--cn": l.color }} />
            ))}
            {SKILL_CATS.map((c) => {
              const m = SK_CAT_META[c];
              const r = (SKILL_LAYOUT.catMaxR[c] || SK_RING_BASE) + 34;
              const ci = SKILL_CATS.indexOf(c);
              const angle = -90 + (360 / SKILL_CATS.length) * ci;
              const rad = (angle * Math.PI) / 180;
              const x = Math.cos(rad) * r, y = Math.sin(rad) * r;
              const Icon = m.icon;
              return (
                <div key={c} className="sd-sktree-catlabel" style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, color: m.color }}>
                  <Icon size={12} /><span>{c}</span>
                </div>
              );
            })}
            {SKILL_TREE.map((s) => {
              const p = SKILL_LAYOUT.pos[s.id];
              if (!p) return null;
              const o = !!skills[s.id];
              const r = skillPrereqsMet(s, skills) && skillUnlocked(s, meta);
              const b = !o && r && shards >= s.cost;
              const Icon = skillIconFor(s);
              const color = SK_CAT_META[s.cat]?.color;
              return (
                <button key={s.id} type="button"
                  className={`sd-sktree-node ${o ? "owned" : b ? "buyable" : !r ? "locked" : ""} ${s.id === selId ? "sel" : ""}`}
                  style={{ left: `calc(50% + ${p.x}px)`, top: `calc(50% + ${p.y}px)`, "--cn": color }}
                  aria-label={s.name} data-skill={s.id}
                  onClick={() => setSelId(s.id)}>
                  <Icon size={17} />
                </button>
              );
            })}
            <div className="sd-sktree-hub"><Waves size={16} /></div>
          </div>
          <div className="sd-sktree-zoom">
            <button type="button" onClick={() => zoomBy(1.25)} aria-label="拡大">+</button>
            <button type="button" onClick={() => zoomBy(0.8)} aria-label="縮小">−</button>
            <button type="button" onClick={resetView} aria-label="中心へ">⌖</button>
          </div>
          <div className="sd-sktree-hint">タップで選択 ／ 二本指で拡大縮小・移動</div>
        </div>
      </div>

      {/* 選択中スキルの詳細(下部シート)。決定ボタンをここへ集約し、以前あった
          画面右端固定の「習得する」ボタンは廃止した。 */}
      {sel && (
        <div className="sd-sktree-detail">
          <div className="sk-detail-head">
            <span className="sk-detail-icon" style={{ "--cn": SK_CAT_META[sel.cat]?.color }}>{SelIcon && <SelIcon size={17} />}</span>
            <div className="sk-mid" style={{ flex: 1 }}>
              <div className="sk-name" style={{ fontSize: 13, fontWeight: 700 }}>{sel.name}</div>
              <div className="sk-cat-chip" style={{ "--cn": SK_CAT_META[sel.cat]?.color }}>{sel.cat}</div>
            </div>
            <button className="sd-btn sm" onClick={() => setSelId(null)}><X size={13} /></button>
          </div>
          <div className="sk-desc">{sel.desc}</div>
          {!revealed && (
            <div className="sk-desc dim">
              {!skillUnlocked(sel, meta) ? skillUnlockText(sel) : `前提: ${(sel.reqAll || [sel.req]).map((id) => SKILL_BY_ID[id]?.name).join(" + ")}`}
            </div>
          )}
          <div className="sk-detail-actions">
            <div className={`sk-cost ${owned ? "owned" : ""}`} style={{ marginRight: "auto" }}>{owned ? "習得済み" : `${sel.cost} 片`}</div>
            <button className="sd-btn pri fs-primary" disabled={!buyable}
              onClick={() => { if (buyable) onBuy(sel.id); }}>
              {owned ? "習得済み" : "習得する"}
            </button>
          </div>
        </div>
      )}

      <div className="sd-fs-actions">
        <button className="sd-btn fs-back" onClick={onClose}>戻る</button>
      </div>
    </div>
  );
}

/* ============================================================
   設定オーバーレイ
============================================================ */
// 開発者の他アプリ紹介(App Store の開発者ページ。姉妹作「ダンジョンローグ」等が並ぶ)
const DEVELOPER_URL = "https://apps.apple.com/developer/eiki-ogawa/id1701253076";
// SettingsOverlay の内側に閉じ込めた関数コンポーネントとして定義すると、親の再レンダーの
// たびに「新しいコンポーネント型」とみなされて毎回アンマウント/再マウントされてしまい
// (スライダーの参照が毎回作り直される)、片方のスライダーを操作した直後にもう片方を
// 操作しても反応しないという不具合になる。モジュールスコープに出して型を安定させる。
function VolumeRow({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-dim)", marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ fontFamily: "var(--mono)" }}>{value == null ? "…" : `${value}%`}</span>
      </div>
      <input type="range" min={0} max={100} value={value ?? 70}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "var(--cyan)" }} />
    </div>
  );
}
function SettingsOverlay({ meta, setMeta, onClose }) {
  const bridge = (name, body) => { try { window.webkit?.messageHandlers?.[name]?.postMessage?.(body ?? {}); } catch (e) {} };
  // BGM・効果音は別々の音量を持つ。実体はネイティブ側 AudioManager.shared の
  // bgmVolume/seVolume。音量調整はこの設定画面に一本化している(かつてあった画面右下の
  // 音量フローティングボタンは、画面内の他のボタンと重なって押せなくなることが
  // あったため廃止した)。null = 取得できるまでの間。
  const [bgmVolume, setBgmVolume] = useState(null);
  const [seVolume, setSeVolume] = useState(null);
  useEffect(() => {
    window.__onVolumeChanged__ = (bgm, se) => { setBgmVolume(bgm); setSeVolume(se); };
    bridge("settings", { action: "getVolume" });
    return () => { delete window.__onVolumeChanged__; };
  }, []);
  const changeVolume = (track, v) => {
    if (track === "se") setSeVolume(v); else setBgmVolume(v);
    bridge("settings", { action: "setVolume", track, value: v });
  };
  return (
    <div className="sd-fs-root sd-fs-meta">
      <div className="sd-fs-top">
        <h2>設 定</h2>
        <div className="sd-sub" style={{ margin: "6px 0 0" }}>観測コンソール — 深海ダンジョン</div>
      </div>
      <div className="sd-fs-body">
        <div className="sd-lab">音量</div>
        <div style={{ margin: "6px 0 10px" }}>
          <VolumeRow label="BGM" value={bgmVolume} onChange={(v) => changeVolume("bgm", v)} />
          <VolumeRow label="効果音(SE)" value={seVolume} onChange={(v) => changeVolume("se", v)} />
        </div>
        <div className="sd-lab" style={{ marginTop: 6 }}>保護設定(該当する物を自動でロックする)</div>
        <div className="sd-toggle">
          <span className="tl">レア(☆☆☆)以上を自動でロック</span>
          <button className={meta?.protectRare ? "on" : ""}
            onClick={() => setMeta((prev) => {
              const m = { ...prev, protectRare: !prev.protectRare };
              saveMeta(m);
              return m;
            })}>
            {meta?.protectRare ? "ON" : "OFF"}
          </button>
        </div>
        <div className="sd-toggle">
          <span className="tl">回復・冷却の消耗品をロック</span>
          <button className={meta?.protectHeals ? "on" : ""}
            onClick={() => setMeta((prev) => {
              const m = { ...prev, protectHeals: !prev.protectHeals };
              saveMeta(m);
              return m;
            })}>
            {meta?.protectHeals ? "ON" : "OFF"}
          </button>
        </div>
        <div className="sd-sub" style={{ margin: "4px 0 14px", fontSize: 10 }}>
          設定は「これから拾う物」にだけ効きます(今持っている物のロックは変わりません)。
          ロックされた物は収納画面で個別に「ロック」ボタンをもう一度押せば、その1点だけ解除できます。
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="sd-btn sm" onClick={() => bridge("requestReview")}>このアプリを評価する</button>
          <button className="sd-btn sm" onClick={() => bridge("privacy", { action: "policy" })}>プライバシーポリシー</button>
          <button className="sd-btn sm" onClick={() => bridge("openURL", DEVELOPER_URL)}>他のアプリも見る</button>
        </div>
        <div className="sd-sub" style={{ marginTop: 14, fontSize: 10, color: "var(--ink-dimmer)", lineHeight: 1.8 }}>
          進行データはこの端末に保存されます。アプリを削除すると失われます。
        </div>
      </div>
      <div className="sd-fs-actions" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
        <button className="sd-btn fs-back" onClick={onClose}>戻る</button>
      </div>
    </div>
  );
}

/* ============================================================
   遊び方 ― タブ分けしたヘルプ(ダンジョンローグの遊び方画面を参考にした構成)。
   クルー職/戦闘/装備・強化/アイテム・レア度/帰還と継承/潜航の進め方の6タブに分け、
   数値まで含めた細かい仕様を記載する。タブを切り替えても枠の高さは変わらない
   (スキルツリーと同じ固定高さ + 下部タブ切り替えのパターン)。
============================================================ */
function HelpSection({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="sd-lab" style={{ fontSize: 12, color: "var(--cyan)" }}>{title}</div>
      <div style={{ marginTop: 8 }}>{children}</div>
    </div>
  );
}
const HELP_TABS = [
  { id: "crew", label: "クルー職", icon: Anchor },
  { id: "battle", label: "戦闘", icon: Crosshair },
  { id: "gear", label: "装備・強化", icon: Shield },
  { id: "item", label: "アイテム", icon: Package },
  { id: "return", label: "帰還と継承", icon: Compass },
  { id: "dive", label: "潜航の進め方", icon: Waves },
];
// 消耗品の種類(kind)ごとの表示ラベル。「遊び方」④アイテムタブの分類表示にのみ使う。
const ITEM_KIND_LABEL = {
  heal: "回復(単体)", healAll: "回復(全体)", cd: "スキル回復", bomb: "攻撃",
  guard: "防御", shards: "残響片", carrySlot: "ストレージ拡張", specimen: "標本",
};
function HelpOverlay({ onClose }) {
  const [helpTab, setHelpTab] = useState(HELP_TABS[0].id);
  return (
    <div className="sd-fs-root sd-fs-meta">
      <div className="sd-fs-top">
        <h2>遊 び 方</h2>
        <div className="sd-sub" style={{ margin: "6px 0 0" }}>下のタブを切り替えて読みたい項目を選んでください。</div>
      </div>
      <div className="sd-fs-body">
        {helpTab === "crew" && (
          <HelpSection title="クルー職ごとの効果(全8種)">
            <div className="sd-sub" style={{ marginBottom: 10 }}>
              クルーは職種ごとに使う属性・役割・技(スキル)が決まっています。出航編成で誰を連れて行くか選ぶ時の参考にしてください。
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(CREW_TYPES).map(([id, t]) => (
                <div key={id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: "9px 12px", background: "rgba(6,14,24,.6)" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700 }}>{t.label}</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--ink-dimmer)" }}>{t.role} ・ {t.dmg}属性</span>
                  </div>
                  <div className="sd-sub" style={{ margin: "4px 0 0" }}>{t.desc}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--amber)", marginTop: 4 }}>
                    技: {t.skill.name}(再使用まで{t.skill.cd}ターン) — {t.skill.desc}
                  </div>
                </div>
              ))}
            </div>
          </HelpSection>
        )}

        {helpTab === "battle" && (
          <>
            <HelpSection title="戦闘の進め方">
              <div className="sd-sub" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>・生存しているクルーが上から順に1体ずつ行動します。「攻撃」(通常攻撃)か「技」(スキル、使うとクールダウンに入る)のどちらかを選んでください。</div>
                <div>・自分(クルー全員)が1巡行動すると、必ず敵の番が1巡返ってきます。この繰り返しを「ターン」として数え、戦闘ログにも「── ターンN ──」の区切りで残ります。</div>
                <div>・敵を全員倒せば勝利。逆に隊員全員が戦闘不能になると、その回の潜航は終わり(「隊は沈んだ」)になります。</div>
              </div>
            </HelpSection>
            <HelpSection title="属性の相性(弱点・耐性)">
              <div className="sd-sub" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>・敵は<b style={{ color: "var(--ink)" }}>徹甲・熱量・電磁・音響・生体</b>の5属性のうち、弱点・耐性を持つことがあります。弱点を突くとダメージ<b style={{ color: "var(--amber)" }}>{Math.round(AFF_W * 100)}%</b>、耐性がある相手には<b style={{ color: "var(--ink-dimmer)" }}>{Math.round(AFF_R * 100)}%</b>になります(等倍は100%)。</div>
                <div>・弱点・耐性は「走査」(観測士のスキルや、その属性で攻撃が命中した時に少しずつ)しないと表示されません。分からない属性は「未走査」と出ます。一度判明した弱点・耐性は観測記録(図鑑)に永続保存され、同じ種と再会した時も引き継がれます。</div>
              </div>
            </HelpSection>
            <HelpSection title="状態異常など">
              <div className="sd-sub" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>・<b style={{ color: "var(--ink)" }}>麻痺</b>: その間、行動できません。麻痺が解けた直後の数ターンは麻痺耐性が付き、連続では麻痺しません。</div>
                <div>・<b style={{ color: "var(--ink)" }}>燃焼・毒</b>: 毎ターン継続ダメージを受けます。</div>
                <div>・<b style={{ color: "var(--ink)" }}>ガード</b>: 一部の技・遺物で被ダメージが一時的に下がります。</div>
                <div>・敵カードのタグに、現在付いている状態異常が表示されます。</div>
              </div>
            </HelpSection>
          </>
        )}

        {helpTab === "gear" && (
          <>
            <HelpSection title="装備はいつ整えるか">
              <div className="sd-sub" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>・<b style={{ color: "var(--ink)" }}>出航編成</b>で連れて行くクルーを選ぶ時(装備そのものはここでは選べず、収納から管理します)。</div>
                <div>・<b style={{ color: "var(--ink)" }}>各レイヤー最初の戦闘の前</b>には必ず「準備」画面が挟まり、装備・収納を自由に開いて整えられます。</div>
                <div>・残骸・補給・行商などの<b style={{ color: "var(--ink)" }}>イベントノード</b>でも、戦闘中でなければいつでも装備・収納を開けます。</div>
                <div>・<b style={{ color: "var(--danger)" }}>戦闘中は消耗品のみ使用可能</b>で、装備の着脱・入れ替えはできません。戦う前に整えておいてください。</div>
                <div>・装備には<b style={{ color: "var(--ink)" }}>耐圧服/増幅器(c.gear、同じ1枠を取り合う)</b>と<b style={{ color: "var(--ink)" }}>武器(c.weapon、独立した別枠)</b>があり、両方同時に装備できます。武器だけを入れ替えたい時は、収納画面の「武器入れ替え」から専用のポップアップで2人をタップして交換できます。</div>
                <div>・クルーカードを見た目のまま並び替えたり、装備一式(耐圧服/増幅器・武器の両方)をまとめて入れ替えたい時は、収納画面上部の「並び替え」「装備交換」アイコンでモードを選んでからドラッグ&ドロップしてください(モードを選んでいない間はドラッグしても何も起きません)。</div>
              </div>
            </HelpSection>
            <HelpSection title="強化(アーティファクトでクルーを永久に鍛える)">
              <div className="sd-sub" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>・下部タブ「強化」を開くと、船のストレージに持ち帰った<b style={{ color: "var(--ink)" }}>アーティファクト(遺物)</b>を1つ選び、名簿の職種(全8種)に重ねて消費できます。</div>
                <div>・アーティファクトのレア度が高いほど、1回で上がるレベルが大きくなります(☆の数だけレベルが上がる)。レベルは最大{CREW_LEVEL_MAX}まで、1レベルにつき最大HP・攻撃力が+{Math.round(CREW_LEVEL_BONUS_PER * 100)}%(上限で合計+{Math.round(CREW_LEVEL_MAX * CREW_LEVEL_BONUS_PER * 100)}%)されます。</div>
                <div>・強化で上がったレベルはその職種(名簿)に永続で残り、以後どの潜航でその職種を連れて行っても引き継がれます。武器・防具(kind:gear)は強化には使えません(戦闘装備のまま使ってください)。</div>
                <div>・最大HPを底上げしたい場合は、強化ではなく下部タブ「スキル」の生存系スキル(耐圧殻など)を育ててください。ボスを倒すだけでは最大HPも継承枠も増えません。</div>
              </div>
            </HelpSection>
          </>
        )}

        {helpTab === "item" && (
          <>
            <HelpSection title="消耗品の種類">
              <div className="sd-sub" style={{ marginBottom: 8 }}>
                戦闘に勝つ・残骸を漁る・行商で交換する、といった行動で装備・消耗品・遺物のいずれかが手に入ります。
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.entries(CONSUMABLES).filter(([id]) => id !== "specimen").map(([id, c]) => (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", background: "rgba(6,14,24,.5)", borderRadius: 8 }}>
                    <Icon assetId={c.asset} size={18} color="var(--cyan)" />
                    <div style={{ minWidth: 66, fontSize: 11, fontWeight: 700 }}>{c.label}</div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-dimmer)", border: "1px solid var(--line-2)", borderRadius: 6, padding: "1px 6px", flexShrink: 0 }}>
                      {ITEM_KIND_LABEL[c.kind] || c.kind}
                    </span>
                    <div style={{ fontSize: 10.5, color: "var(--ink-dim)", flex: 1 }}>{c.desc}</div>
                  </div>
                ))}
              </div>
            </HelpSection>
            <HelpSection title="レア度">
              <div className="sd-sub" style={{ marginBottom: 8 }}>
                装備(耐圧服/増幅器/武器)・遺物・クルーには5段階のレア度があります。レア度が高いほど性能が良く、深い海域ほど高レアが出やすくなります。
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {RARITIES.map((r) => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11 }}>
                    <span style={{ color: r.color, fontFamily: "var(--mono)", minWidth: 90 }}>{r.label}</span>
                    <span style={{ color: "var(--ink-dim)" }}>基礎性能 ×{r.mult.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="sd-sub" style={{ marginTop: 10 }}>
                一部の強力な遺物は、深い海域に到達するまで出現しません(例: 海域4以降/海域7以降でのみ解禁される遺物があります)。浅い海域の難易度が遺物ガチャだけで乱高下しないための調整です。
              </div>
            </HelpSection>
          </>
        )}

        {helpTab === "return" && (
          <>
            <HelpSection title="帰還(自主的に潜航を切り上げる)">
              <div className="sd-sub" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>・収納画面の「潜航をやめて母船へ戻る」を選ぶと、その時点で持っている物を確認したうえで<b style={{ color: "var(--cyan)" }}>帰還</b>できます。無理に深追いせず、成果を確定させて引き返す選択肢です。</div>
                <div>・帰還すると、持ち帰り枠(下記)の上限まで装備・消耗品・遺物が船のストレージ(meta.carried)へ入り、以後いつでも使えます。船に戻った直後は専用の「帰還」画面で、何を持ち帰ったかを確認できます。</div>
                <div>・帰還は全滅ではないので、ペナルティはありません。次の潜航も、それまでに突破した海域のチェックポイントから始まります。</div>
              </div>
            </HelpSection>
            <HelpSection title="全滅した場合">
              <div className="sd-sub" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>・隊員全員が戦闘不能になると全滅です。持ち帰れる物は限られますが、<b style={{ color: "var(--ink)" }}>ロックした装備・遺物</b>が優先して選ばれます。</div>
                <div>・ロック設定は「設定」タブでまとめて切り替えられます(レア以上/回復品を自動でロック)。ロックは拾った時点で効くだけで、既に持っている物には遡って効きません。</div>
                <div>・広告視聴で復活できる場合があります(1日の残り回数まで)。</div>
              </div>
            </HelpSection>
            <HelpSection title="船内ストレージとチェックポイント">
              <div className="sd-sub" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>・帰還・全滅で持ち帰った物は、種類を問わず<b style={{ color: "var(--ink)" }}>船内ストレージ</b>(下部タブ「倉庫」、既定50点)へまとめて入ります。上限はスキルツリー「船倉拡張」でさらに広げられます。</div>
                <div>・潜航を始める時は、ストレージのうちスコアの高い物から自動で<b style={{ color: "var(--ink)" }}>装備・消耗品と遺物、それぞれ決まった枠数</b>だけが積み込まれます(タイトル・出航編成画面に表示される「ストレージ持出枠」「遺物枠」の数)。選ばれなかった残りはそのままストレージに残り、次の機会に持ち出せます。</div>
                <div>・持出枠(装備・消耗品側)は<b style={{ color: "var(--ink)" }}>異層コア</b>(異常個体からのみ入手)を拾った時だけ永続的に+1されます。ボスを倒すだけでは増えません。</div>
                <div>・海域の主(ボス)を初めて倒すと、その海域がチェックポイントになります。以後、帰還・全滅のどちらで中断しても、次はそのチェックポイントから再開できます。</div>
                <div>・船の中(タイトル・帰還後)では、下部タブからいつでも「強化」「倉庫」「スキル」「図鑑」「設定」を開けます。潜航中もタブは常に固定表示されているので、深く潜る前にいつでも準備を整え直せます。</div>
              </div>
            </HelpSection>
          </>
        )}

        {helpTab === "dive" && (
          <HelpSection title="潜航の進め方">
            <div className="sd-sub" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div>・深度は1〜100まであり、10進むごとに1つの海域(全10海域)を突破したことになります。</div>
              <div>・1つの深度(レイヤー)は3つのノード(交戦 → イベントまたは交戦 → 交戦)からなり、各海域の最後(深度10・20…)は必ず主(ボス)です。</div>
              <div>・遺物は隊全体にかかる常時効果、装備はクルー1人につき1つ(耐圧服/増幅器と武器は別枠)、消耗品は収納から使う一度きりの道具です。</div>
              <div>・迷ったら、まずは装備を整え、弱点が分かっている敵から狙い、危なくなったら医療士で立て直す — の繰り返しでOKです。無理そうなら帰還して仕切り直しましょう。</div>
            </div>
          </HelpSection>
        )}
      </div>
      {/* カテゴリタブ(スキルツリーと同じ横スクロール式)。本文の下、戻るボタンの上に置く
         (アイコン主体で視覚的に選べるようにする)。 */}
      <div className="sd-sk-cats" style={{ flexShrink: 0 }}>
        {HELP_TABS.map((tb) => {
          const TbIcon = tb.icon;
          return (
            <button key={tb.id} className={`sd-sk-cat ${helpTab === tb.id ? "on" : ""}`}
              style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={() => setHelpTab(tb.id)}>
              <TbIcon size={14} /><span>{tb.label}</span>
            </button>
          );
        })}
      </div>
      <div className="sd-fs-actions" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
        <button className="sd-btn fs-back" onClick={onClose}>戻る</button>
      </div>
    </div>
  );
}

/* ============================================================
   強化 ― 船のストレージに持ち帰ったアーティファクト(遺物)を消費して、名簿(type)を
   永久強化する。強化した名簿は、以後どの潜航で連れて行っても(装備・消耗品とは別に)
   基礎ステータスが底上げされた状態で登場する。
============================================================ */
function ReinforceOverlay({ meta, onClose, onReinforce }) {
  const [selArtifactId, setSelArtifactId] = useState(null);
  // 強化に使えるのはアーティファクト(遺物)のみ。武器・防具は戦闘装備のまま強化の対象外にする。
  const artifacts = (meta?.carried || []).filter((x) => x.kind === "relic");
  const roster = (meta?.roster || []).map((type) => {
    if (!CREW_TYPES[type]) return null;
    return { key: type, type };
  }).filter(Boolean).sort((a, b) => crewLevelOf(meta?.crewLevels, b.type) - crewLevelOf(meta?.crewLevels, a.type) || a.type.localeCompare(b.type));
  const selArtifact = artifacts.find((a) => a.id === selArtifactId) || null;

  return (
    <div className="sd-fs-root sd-fs-meta">
      <div className="sd-fs-top">
        <h2>強 化</h2>
        <div className="sd-sub" style={{ margin: "6px 0 0" }}>
          船のストレージに持ち帰ったアーティファクト(遺物)を選び、強化したい名簿をタップすると
          重ねて消費し永久強化します(レア度が高いほどレベルの伸びが大きい)。
        </div>
      </div>
      <div className="sd-fs-body">
        <div className="sd-lab">ストレージのアーティファクト({artifacts.length})</div>
        {artifacts.length === 0 ? (
          <div className="sd-sub" style={{ color: "var(--ink-dimmer)", padding: "6px 0 14px" }}>
            強化に使えるアーティファクトがありません。潜航で遺物を見つけて船まで持ち帰ってください。
          </div>
        ) : (
          <div className="sd-grid" style={{ marginBottom: 14 }}>
            {artifacts.map((a) => (
              <Cell key={a.id} item={a} on={selArtifactId === a.id} onClick={() => setSelArtifactId((id) => id === a.id ? null : a.id)}
                actionLabel={selArtifactId === a.id ? "✓ 選択中" : `選ぶ(+${rarityIdx(a.rarity) + 1}Lv分)`} />
            ))}
          </div>
        )}

        <div className="sd-lab">名簿({roster.length})</div>
        {!selArtifact && artifacts.length > 0 && (
          <div className="sd-sub" style={{ color: "var(--amber)", margin: "4px 0 8px" }}>先に強化に使うアーティファクトを選んでください。</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {roster.map((r) => {
            const level = crewLevelOf(meta?.crewLevels, r.type);
            const name = CREW_NAMES[r.type]?.[0] || CREW_TYPES[r.type].label;
            return (
              <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid var(--line)", borderRadius: 12, padding: "8px 10px", background: "rgba(6,14,24,.6)" }}>
                <Icon assetId={`${CREW_TYPES[r.type].asset}_shallow`} size={34} color="var(--cyan)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-dimmer)" }}>{CREW_TYPES[r.type].label} ・ Lv {level}/{CREW_LEVEL_MAX}</div>
                  <div className={`sd-cr-bar`} style={{ maxWidth: "none", marginTop: 4 }}><i style={{ width: `${(level / CREW_LEVEL_MAX) * 100}%`, background: "var(--amber)" }} /></div>
                </div>
                <button className="sd-btn sm" disabled={!selArtifact}
                  onClick={() => { if (selArtifact) { onReinforce(r.key, selArtifact.id); setSelArtifactId(null); } }}>
                  Lv {level} → {selArtifact ? Math.min(CREW_LEVEL_MAX, level + rarityIdx(selArtifact.rarity) + 1) : level}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="sd-fs-actions" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
        <button className="sd-btn fs-back" onClick={onClose}>戻る</button>
      </div>
    </div>
  );
}

/* ============================================================
   倉庫 ― 船内ストレージ(meta.carried)の中身を一覧で確認する画面。
   種類を問わない共通プールで、上限(storageN、既定50・スキルで拡張)まで貯められる。
   潜航開始時にはこのうちスコアの高い物から carryN/relicN 件だけが自動で積み込まれる
   (積まれなかった残りはそのままここに残る)。空きを作りたい時はここから個別に捨てられる。
============================================================ */
function StorageOverlay({ meta, storageN, onClose, onDiscard }) {
  const items = meta?.carried || [];
  return (
    <div className="sd-fs-root sd-fs-meta">
      <div className="sd-fs-top">
        <h2>倉 庫</h2>
        <div className="sd-sub" style={{ margin: "6px 0 0" }}>
          船に持ち帰った物の一覧です({items.length}/{storageN})。潜航を始めると、この中からスコアの高い物が優先して積み込まれます。
        </div>
      </div>
      <div className="sd-fs-body">
        {items.length === 0 ? (
          <div className="sd-sub" style={{ color: "var(--ink-dimmer)", padding: "6px 0 14px" }}>
            倉庫は空です。潜航から帰還・生還すると、持ち帰った物がここに積まれます。
          </div>
        ) : (
          <div className="sd-grid">
            {items.map((it) => (
              <Cell key={it.id} item={it} onClick={() => onDiscard(it.id)} actionLabel="タップで捨てる" />
            ))}
          </div>
        )}
      </div>
      <div className="sd-fs-actions" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
        <button className="sd-btn fs-back" onClick={onClose}>戻る</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   出航編成 — 名簿から3人を選ぶ(収集の見せ場)
   名簿は「職種」のみ(全8種)で永続。レアリティでは名簿を水増ししない
   (実際の絵は職種ごとに1種類しか無いため)。強さは meta.crewLevels の育成で決まる。
------------------------------------------------------------ */
function CrewSelect({ meta, onStart, onBack, pendingZone }) {
  // 名簿の見た目(海域帯)は「これまでの最深到達」に合わせる。ステータスは常に depth=1 基準で不変。
  const previewBand = gearBandOf(Math.max(1, (Math.min(meta.checkpoint || 1, 10) - 1) * 10));
  const roster = useMemo(() => {
    const types = (meta.roster || []).slice();
    const base = ["harpoon", "medic", "scanner"];
    for (const b of base) if (!types.includes(b)) types.push(b);
    return types.map((type) => {
      if (!CREW_TYPES[type]) return null;
      const c = makeCrew(1, { type, crewLevels: meta.crewLevels });
      return { ...c, band: previewBand, asset: `${CREW_TYPES[type].asset}_${previewBand}` };
    }).filter(Boolean).sort((a, b) => (b.level || 0) - (a.level || 0) || a.type.localeCompare(b.type));
  }, [meta.roster, meta.crewLevels, previewBand]);

  const structC = skillStructural(meta.skills);
  const relicN = Math.max(meta.relicSlots || 1, structC.relicFloor);
  const carryN = (meta.carrySlots || 1) + structC.carryBonus;
  const partyN = partyCap(meta.skills);

  const [sel, setSel] = useState([]);
  const toggle = (c) => setSel((s) =>
    s.includes(c.id) ? s.filter((x) => x !== c.id) : s.length < partyN ? [...s, c.id] : s);
  const chosen = roster.filter((c) => sel.includes(c.id));
  const totalKinds = Object.keys(CREW_TYPES).length;
  // 役割の偏りを警告
  const roles = chosen.map((c) => CREW_TYPES[c.type].role);
  const noHeal = chosen.length === partyN && !chosen.some((c) => c.type === "medic");

  return (
    <div className="sd-root sd-root-dive">
      <style>{CSS}</style>
      <Backdrop depth={1} />
      <div className="sd-scan" /><div className="sd-vig" />
      <div className="sd-stage">
        <div className="sd-tele">
          <span className="sd-zone">CREW MANIFEST</span>
          <span className="sd-sep" />
          <span>名簿 {(meta.roster || []).length} / {totalKinds} 種</span>
          <span className="sd-sep" />
          <span>遺物枠 {relicN}</span>
          <span className="sd-sep" />
          <span>ストレージ持出枠 {carryN}</span>
          <span style={{ marginLeft: "auto", color: "var(--amber)" }}>選択 {sel.length}/{partyN}</span>
        </div>

        {/* 名簿が多くなっても、下部の決定ボタンは常に画面内に固定表示する
            (一覧だけがこの中でスクロールする)。 */}
        <div className="sd-scroll-body">
          <div style={{ padding: "14px 2px 8px" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 14, letterSpacing: ".18em", color: "var(--cyan)" }}>
              {pendingZone != null ? `海域 ${pendingZone + 1}「${ZONES[pendingZone].name}」へ再挑戦` : "出 航 編 成"}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-dim)", marginTop: 7, lineHeight: 1.85 }}>
              潜航に連れて行く3人を選んでください。救難信号で見つけた人物は名簿に永続記録され、以後いつでも編成できます。<br />
              <span style={{ color: "var(--ink-dimmer)" }}>高レアの生存者ほど出現率は低く設定されています(固有 UR は約0.6%)。</span>
            </div>
          </div>

          {pendingZone != null && (
            <div style={{ margin: "4px 0 10px", padding: "8px 12px", border: "1px solid rgba(255,210,127,.35)", background: "rgba(255,210,127,.06)" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--amber)", letterSpacing: ".1em" }}>再挑戦モード</div>
              <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 4, lineHeight: 1.75 }}>
                この海域のチェックポイントから開始します。持ち越しアイテムがあれば通常の潜航と同じく持ち込めます。
              </div>
            </div>
          )}

          {(meta.carried || []).length > 0 && (
            <div style={{ margin: "4px 0 10px", padding: "8px 12px", border: "1px solid var(--line)", background: "var(--hull)" }}>
              <div className="sd-lab" style={{ margin: "0 0 6px" }}>船内ストレージ({meta.carried.length}点)</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--cyan)" }}>
                {meta.carried.map((c) => c.name).join(" · ")}
              </div>
              <div className="sd-sub" style={{ marginTop: 6, fontSize: 10 }}>
                このうちスコアの高い物から、潜航1回分の枠(装備・消耗品 {carryN}点 ＋ 遺物 {relicN}点)まで自動で積み込まれます。全体の中身は下部タブ「倉庫」でいつでも確認できます。
              </div>
            </div>
          )}

          <div className="sd-lab">名簿(タップで選択)</div>
          <div className="sd-grid" style={{ paddingBottom: 12 }}>
            {roster.map((c) => (
              <Cell key={c.id} item={c} on={sel.includes(c.id)} onClick={() => toggle(c)}
                sub={`${CREW_TYPES[c.type].skill.name}: ${CREW_TYPES[c.type].skill.tag}`}
                actionLabel={sel.includes(c.id) ? "✓ 編成中" : "編成に加える"} />
            ))}
          </div>

          {noHeal && (
            <div className="sd-note" style={{ color: "var(--amber)", borderColor: "rgba(255,210,127,.35)" }}>
              医療士がいません。深部では立て直しが効かず、一度崩れると全滅しやすくなります。
            </div>
          )}
        </div>

        <div className="sd-fixed-footer">
          <div className="sd-rows" style={{ margin: 0 }}>
            <button className="sd-btn sm" style={{ marginRight: "auto" }} onClick={onBack}>← 戻る</button>
            <button className="sd-btn sm" onClick={() => setSel(roster.slice(0, partyN).map((c) => c.id))}>推奨編成</button>
            <button className="sd-btn pri" disabled={sel.length === 0}
              onClick={() => onStart(chosen, pendingZone)}>
              {sel.length === 0 ? "1人以上選んでください" : `${sel.length}人で潜航する ↓`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
