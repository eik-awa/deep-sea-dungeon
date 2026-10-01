# 深海ダンジョン ― クルー拡張(将来構想・全30種)キャラクターコンセプトプロンプト

**これは長期構想用のプロンプト集です。今すぐコードに組み込む前提のものではありません。**
現状クルーは8職種(掃海兵/銛撃手/電纜技師/熱核技師/医療士/観測士/深潜兵/共鳴者)しか
実際の絵が無く、名簿はこの8種のみで管理しています(強さは強化画面での育成で伸ばす方式)。
将来、名簿を「30種くらいから選ぶ」規模まで拡張したくなった時のために、方向性の異なる
新規クルー案を先にまとめておくものです。実装(コード側の紐付け・アイコン配線)は、実際に
拡張へ着手するタイミングで別途行ってください。

## コンセプトの方針(重要・既存クルーからブレないこと)

既存8種のクルー画像(`web/src/assets/icons/harpoon.webp` 等)を実際に確認して分かった、
このゲームのクルーバッジの実物のスタイルは以下の通り。**新規30種は絵柄をこれに完全一致
させる**こと。

- **円形バッジの中の胸像(チェストアップ)ポートレート**。全身でも平面アイコンでもない。
- **丸いガラスドーム型の潜水ヘルメットを頭に完全に被っており、中の顔は見えない**(暗く
  仄かに光るだけで、目や表情は描かない)。ヘルメット基部には真鍮のリベット付きカラー、
  側面には小さなリベットライトが2つ、ガラスには反射のハイライトが1つ。古典的な
  ダイビングヘルメット(潜水兜)の形。
  - 参考: [harpoon.webp](../web/src/assets/icons/harpoon.webp) / [medic.webp](../web/src/assets/icons/medic.webp) /
    [sweeper.webp](../web/src/assets/icons/sweeper.webp) / [cabler.webp](../web/src/assets/icons/cabler.webp) /
    [thermal.webp](../web/src/assets/icons/thermal.webp) / [scanner.webp](../web/src/assets/icons/scanner.webp) /
    [diver.webp](../web/src/assets/icons/diver.webp) / [resonator.webp](../web/src/assets/icons/resonator.webp)
- **濃紺〜ダークティール地に真鍮/ブロンズの金具**の厚手潜水服。肩と首元にリベット継ぎ目、
  斜め掛けの真鍮バックル付きストラップ、裾に小物ポーチ。
- **バッジ自体が円形の背景**(正方形キャンバスの中に円が収まり、円の外側は透明)。円の中は
  外周が暗い紺色、中心にかけてほんのり明るいティール〜シアンのグラデーション、うっすらと
  同心円のソナーリング模様が背後に透けて見え、円のフチ全体に発光するシアンのリムライトが
  走り、そのすぐ外側にほんのり滲むような光の滲みが残る。
- **色付きの発光アクセントが職種ごとの識別要素**(シアン/バイオレット/アンバー)。
- 塗りはフラットなベクター線画ではなく、**細かいピクセルディザ/レトロなペイント調の陰影**
  (このゲームの敵・遺物・武器アイコン群とは別系統の、クルー専用のスタイル)。

### 深度エスカレーションの方針(3回目の改訂・ユーザー指示により強化)

以前の版は「キャラごとの違いが小さすぎる」「深さによる強さの違いが伝わらない」と
指摘を受けた。今回は**深海に行くほど、見ただけで明らかに強そうな・恐ろしい見た目になる**
ことを最優先し、次の2軸をはっきり分けて全キャラへ適用している。

1. **サイズ/威圧感の3段階エスカレーション**: 浅海は小型・軽量な道具(ハンドツール
   サイズ)。中層は浅海よりひと回り大きく重そうな道具。深層は**古代の大型兵装**
   (背丈ほどある銛槍、体格の半分もある古代砲、剣というより大剣クラスの遺物ブレード等)
   ―― 見た目だけで「深層のキャラは明らかに格上」と伝わるようにする。
2. **深海生物による侵食(禍々しさ)の3段階エスカレーション**: 浅海は侵食ゼロ。中層は
   フジツボの付着や小魚・ウナギが装備に絡まっている程度の**軽い**侵食を1キャラにつき
   1箇所。深層は**フジツボの厚い層・装備に融合した魚(骨や顎がそのまま武具の意匠に
   なっている)・小型のウナギが装備に巻きつく**など、**複数箇所・より露骨な**侵食を
   重ねる。ただし骨魔術・宗教衣装・玉座演出は引き続き使わない(あくまで「深海生物に
   侵食された古代の装備」であって、怪物そのものやファンタジーの魔物ではない)。
   深層内の1体(#29 compactProbeDiver)だけは意図的に無傷・現代的なままにし、対比を作る。

## 使い方(おすすめ: まとめて1枚で生成)

30個バラバラに生成すると画風がブレやすく手間もかかるので、**下の「まとめて生成する版」の
3枚のコンタクトシート(浅海10種/中層10種/深層10種、それぞれ5列×2行のグリッド1枚)を
先に試してください**。既存のクリーチャー・遺物・武器アイコンと同じ方式(1枚の画像に格子状に
並べて生成 → 自動で1体ずつ切り出す)です。実物のクルーバッジ自体も元は
`深海ダイバー・ネオンバッジ集.png`(4列×2行)という1枚のコンタクトシートから切り出されて
います。

1. 下の「まとめて生成する版」のプロンプトをそれぞれ画像生成に使う。
2. 出てきた画像をそのまま `~/Downloads/` に、コードブロック直前のファイル名で保存する
   (`深海クルー拡張・浅海10種.png` / `深海クルー拡張・中層10種.png` /
   `深海クルー拡張・深層10種.png`)。
3. 実際に拡張へ着手する段階で、`web/scripts/slice-icons.mjs` の `SHEETS` に上記3枚を
   5列×2行の設定で追加し、`ICONS` に各キャラの id(下記の英語 id)を割り当ててから
   `node scripts/slice-icons.mjs` を実行すれば1体ずつ切り出せます(既存の `SHEETS.crew`
   と同じパターン)。**この登録は今回は行っていません** ―― 拡張に着手するタイミングで
   行ってください。
4. グリッドの区切りとズレて変な位置で切れてしまった場合は、上記の inset 数値を実際の画像に
   合わせて調整してください。

1枚のグリッドにうまく収まらなかった/一部だけ描き直したい/1体ずつ試したい場合のために、
**「個別に作り直す版」の30個の単体プロンプト**もそのまま下に残してあります(1個ずつ
コピペで完結)。

---

## まとめて生成する版(推奨)

### 深海クルー拡張・浅海10種(5列×2行のグリッド1枚)
```
A single reference contact sheet for a deep-sea exploration roguelike's crew character
badge set. Layout: a clean 5-column × 2-row grid of 10 equally-sized cells with generous
even gutters between cells, no cell borders, no labels, no text anywhere on the sheet.
Background: pure flat solid chroma-key magenta #ff00ff across the ENTIRE sheet including
every gutter — perfectly flat and uniform, no gradient, no vignette, no blur, no shadow,
no glow spilling onto it, no texture of any kind on the background (it will be removed
by color-key in post, so any softness or non-uniform color on it will show as a visible
fringe on the final badge).

Each cell contains ONE circular badge portrait, matching this game's existing
8-character crew badge set exactly. The badge: an opaque circle filling ~90% of the
frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to a lighter
glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring circles
radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring traced
right along the badge's outer edge, with a soft blurred glow bleeding slightly beyond
the circle's rim before fading to transparent. Retro-modern painted illustration with
visible fine pixel-art dithering in the shading (not flat vector linework), bold clean
dark ink outlines, moderate specular highlights on metal and glass.

Subject in every badge: a bust (chest-up) portrait of a diver, facing forward, centered
and filling most of the badge. They wear a bulky old-fashioned brass diving suit: dark
navy-teal segmented plating, prominent brass/bronze rivets and joint rings at the
shoulders and neck, a diagonal brass-buckled chest strap, small utility pouches visible
at the very bottom edge of the crop. They wear a large round glass diving-helmet that
fully encloses the head, a riveted brass collar ring at its base, a couple of small
brass bolt-domes on top, and two small round rivet-lights set into the sides of the
helmet with one lit by a soft warm glow; the glass dome carries a bright specular
highlight glinting across its curve and otherwise shows only a dark, softly glowing void
behind it — no visible face. The suit and helmet silhouette stay the same base family in
every cell, but give each character a visibly distinct build, helmet-dome shape, and
small distinguishing detail so the ten do not look like repeats of the same figure —
characters are told apart by build, gear details, AND by the ONE signature tool or
instrument they hold at chest height, with that tool's glow color (cyan / violet /
amber).

These 10 are shallow-zone crew (zones 1-3): junior recruits. Brass fittings are bright
and freshly polished, navy-teal fabric is clean and unscuffed, no dents or patch marks,
and absolutely no marine growth of any kind. Small, lightweight tools throughout. This
band should read as completely sane, clean, and unremarkable-looking — the clear low end
of the roster's power presentation, so the escalation toward the mid and deep tiers
below reads as dramatic and obvious rather than incremental.

No pet drones, no animal-costume theming, no religious or ceremonial dress, no
throne-like framing — the same grounded diver/suit/helmet family as this game's existing
8-character crew roster in every case.

Grid contents, left-to-right then top-to-bottom (build note; tool held, glow color):
1. トライデントダイバー: tall/lean, elongated oval dome, "03" shoulder stencil — trident, cyan glow along its tines.
2. ブイランナー: small/compact, rounder dome, slate-blue undertone — folded marker buoy, cyan beacon glow.
3. ウィンチハンド: broad/stocky, flat wide dome, double collar ring — hand-winch with coiled cable, cyan glow.
4. フィールドメディック候補生: leanest build, extra side porthole window, teal-green undertone — first-aid case, cyan glowing cross.
5. シグナルフレアオペレーター: one raised shoulder pauldron, three bolt-domes in a row — flare launcher, warm amber glow.
6. ライトシールドベアラー: stockiest build, flat wide dome, chest proto-shield plate — round pressure-shield, cyan glow.
7. テザースプライサー: slim/wiry, narrow faceted dome, spool-clips on belt — cable reel, cyan glow.
8. トーチダイバー: scorched forearm patch, flipped-up amber shade-flap — cutting-torch, blue-white flame glow.
9. チャートスカウト: flat mapping-case backpack, antenna rod on helmet — handheld scanner, cyan glow.
10. フィンスプリンター: leanest/most athletic, smallest low-profile dome, mid-stride pose — no tool, cyan motion-glow trailing from fists.
```

### 深海クルー拡張・中層10種(5列×2行のグリッド1枚)
```
A single reference contact sheet for a deep-sea exploration roguelike's crew character
badge set. Layout: a clean 5-column × 2-row grid of 10 equally-sized cells with generous
even gutters between cells, no cell borders, no labels, no text anywhere on the sheet.
Background: pure flat solid chroma-key magenta #ff00ff across the ENTIRE sheet including
every gutter — perfectly flat and uniform, no gradient, no vignette, no blur, no shadow,
no glow spilling onto it, no texture of any kind on the background (it will be removed
by color-key in post, so any softness or non-uniform color on it will show as a visible
fringe on the final badge).

Each cell contains ONE circular badge portrait, matching this game's existing
8-character crew badge set exactly. The badge: an opaque circle filling ~90% of the
frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to a lighter
glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring circles
radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring traced
right along the badge's outer edge, with a soft blurred glow bleeding slightly beyond
the circle's rim before fading to transparent. Retro-modern painted illustration with
visible fine pixel-art dithering in the shading (not flat vector linework), bold clean
dark ink outlines, moderate specular highlights on metal and glass.

Subject in every badge: a bust (chest-up) portrait of a diver, facing forward, centered
and filling most of the badge. They wear a bulky old-fashioned brass diving suit: dark
navy-teal segmented plating, prominent brass/bronze rivets and joint rings at the
shoulders and neck, a diagonal brass-buckled chest strap, small utility pouches visible
at the very bottom edge of the crop. They wear a large round glass diving-helmet that
fully encloses the head, a riveted brass collar ring at its base, a couple of small
brass bolt-domes on top, and two small round rivet-lights set into the sides of the
helmet with one lit by a soft warm glow; the glass dome carries a bright specular
highlight glinting across its curve and otherwise shows only a dark, softly glowing void
behind it — no visible face. The suit and helmet silhouette stay the same base family in
every cell, but give each character a visibly distinct build, helmet-dome shape, and
small distinguishing detail so the ten do not look like repeats of the same figure —
characters are told apart by build, gear details, AND by the ONE signature tool or
instrument they hold at chest height, with that tool's glow color (cyan / violet /
amber).

These 10 are mid-zone crew (zones 4-6): experienced field hands. Brass fittings are
tarnished, navy-teal fabric is visibly weathered with patch plates and scuff marks, and
tools/weapons are noticeably larger and heavier than the shallow-zone set. Give EACH of
the 10 exactly one small-to-moderate sign of the deep sea physically encroaching onto
their gear — a patch of barnacles, a small fish or eel caught, tangled, or fused into
their equipment. This should read as a clear, visible step up in both size/menace and
marine corruption from the shallow-zone set, and a clear step below the deep-zone set.

No pet drones, no animal-costume theming, no religious or ceremonial dress, no
throne-like framing — the same grounded diver/suit/helmet family as this game's existing
8-character crew roster in every case.

Grid contents, left-to-right then top-to-bottom (build note; tool held, glow color):
11. サルベージカッター: bulky, barnacle patch on one shoulder + a small fish tail at the collar crack — oversized cutting tool, amber glow.
12. トロールネットハンドラー: broad build, a small eel caught and stuck in the net, barnacle-crusted weights — heavy net, cyan glow.
13. プレッシャーエンジニア: thickest mid-zone armor; small lanternfish fused into forearm plating, its lure glowing — chest-mounted pressure console, cyan glow.
14. ディープケーブルリガー: cable-draped; a thin eel coiled in among the cables, barnacle-dotted shoulder — heavy cable tangle, cyan glow.
15. リアクターハンドラー: reactor ringed with barnacle crust, a small fish fused flat against the hot casing — large reactor core, amber glow.
16. トリアージオフィサー: barnacle-crusted case hinge, a fish fin poking from a crack in one boot — large medical case, cyan glowing cross.
17. ディープソナーオペレーター: barnacle-rimmed dish with a small fish nested in a puddle at its center — large sonar dish, cyan glow.
18. バラストマスター: heavy barnacle-crusted ballast weight with a small crab clinging to it — heavier ballast, cyan glow.
19. ドリルオペレーター: drill housing crusted with barnacles, a small fused fish glowing faintly on the bit — large rotary drill, amber glow.
20. ラインアンカー: barnacle-crusted anchor flukes, a small fish skeleton caught in the chain — heavy anchor and chain, cyan glow.
```

### 深海クルー拡張・深層10種(5列×2行のグリッド1枚)
```
A single reference contact sheet for a deep-sea exploration roguelike's crew character
badge set. Layout: a clean 5-column × 2-row grid of 10 equally-sized cells with generous
even gutters between cells, no cell borders, no labels, no text anywhere on the sheet.
Background: pure flat solid chroma-key magenta #ff00ff across the ENTIRE sheet including
every gutter — perfectly flat and uniform, no gradient, no vignette, no blur, no shadow,
no glow spilling onto it, no texture of any kind on the background (it will be removed
by color-key in post, so any softness or non-uniform color on it will show as a visible
fringe on the final badge).

Each cell contains ONE circular badge portrait, matching this game's existing
8-character crew badge set exactly. The badge: an opaque circle filling ~90% of the
frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to a lighter
glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring circles
radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring traced
right along the badge's outer edge, with a soft blurred glow bleeding slightly beyond
the circle's rim before fading to transparent. Retro-modern painted illustration with
visible fine pixel-art dithering in the shading (not flat vector linework), bold clean
dark ink outlines, moderate specular highlights on metal and glass.

Subject in every badge: a bust (chest-up) portrait of a diver, facing forward, centered
and filling most of the badge. They wear a bulky old-fashioned brass diving suit: dark
navy-teal segmented plating, prominent brass/bronze rivets and joint rings at the
shoulders and neck, a diagonal brass-buckled chest strap, small utility pouches visible
at the very bottom edge of the crop. They wear a large round glass diving-helmet that
fully encloses the head, a riveted brass collar ring at its base, a couple of small
brass bolt-domes on top, and two small round rivet-lights set into the sides of the
helmet with one lit by a soft warm glow; the glass dome carries a bright specular
highlight glinting across its curve and otherwise shows only a dark, softly glowing void
behind it — no visible face. The suit and helmet silhouette stay the same base family in
every cell, but give each character a visibly distinct build, helmet-dome shape, and
small distinguishing detail so the ten do not look like repeats of the same figure —
characters are told apart by build, gear details, AND by the ONE signature tool or
instrument they hold at chest height, with that tool's glow color (cyan / violet /
amber).

These 10 are deep-zone crew (zones 7-10): the most hardened veterans, and they must look
unmistakably, overtly powerful and dangerous at a glance — this is the single most
important thing to get right, since previous drafts of this roster read as too similar
in apparent strength across bands. Their gear should be ancient rather than
modern-looking: corroded brass and bone-white relic construction, ornate worn
engravings, oversized weapons and instruments that visibly dwarf the shallow/mid-tier
equivalents (massive drill-spears, harpoon-cannons, furnace-hearts, a blade-spear taller
than the diver). Layer heavy, visible deep-sea marine encroachment onto the gear and
suit seams — thick barnacle crusts, small fish or eels caught, nested, or fused directly
into the equipment, an anglerfish skull or jaw worked into the design. This is meant to
look like ancient, reclaimed war-gear the abyss itself has grown onto, worn by the
single most powerful-looking characters in the whole 30-character roster. One character
(#29) should deliberately break the pattern and stay small, clean, and modern-looking,
as a contrast.

No religious or ceremonial dress, no throne-like framing, no skeletal or bone-magic
fusion — the corruption here is specifically deep-sea marine life (barnacles, small
fish, eels, tendrils, bioluminescent growths) visibly overtaking an otherwise
recognizable diver/suit/helmet silhouette, not a generic monster transformation.

Grid contents, left-to-right then top-to-bottom (build note; tool held, glow color):
21. ヘビープレッシャートルーパー: the most massive build of all 30, gauntlet-fists the size of anvils, an anglerfish skull with a glowing lure fused into a barnacle-crusted shoulder — no tool, fists raised.
22. ツインドリルリガー: wields two ancient drill-spears half again as tall as the diver; an eel coiled around one haft — massive twin drill-spears, amber glow.
23. ディープチャージセッター: carries a massive ancient bronze harpoon-cannon crusted in barnacles, glowing fish eggs near the trigger — oversized relic cannon, blinking amber glow.
24. アンビリカルウォーデン: cables have become fleshy tentacle-cords fused to the chest, converging in a small toothed lamprey-mouth at the collar — pulsing cyan glow.
25. ファーネスダイバー: an ancient torso-sized furnace-heart with a huge anglerfish jaw fused open around its glow like a feeding maw — intense amber glow.
26. トラウマサージョン: an ancient claymore-sized relic blade lined with small fish teeth, a fin-growth on one shoulder — cyan glowing cross on the hilt.
27. ロングレンジソナーチーフ: an ancient torso-dwarfing ammonite-shell sonar array, small fish nested and swimming in its barnacle-crusted grooves — pulsing cyan glow.
28. シグナルリレーベテラン: a massive ancient conch-and-brass transmitter horn worn like a club, an eel threaded through its mouthpiece — flickering cyan glow.
29. コンパクトプローブダイバー: small/light build; deliberately clean, unscarred, untouched by any deep-sea growth — the calm exception in the deep-zone set — probe-scanner, steady cyan glow.
30. コマンドダイバー: the most imposing figure of all 30; plants a colossal ancient blade-spear taller than themselves, barnacles and small fish fused along it and one side of the suit — no hand tool, calm composed stance.
```

---

## 個別に作り直す版(30個・1個ずつ差し替えたい時用)

英語 id は将来コードへ組み込む際の仮の識別子案です(既存8職の id: harpoon / sweeper /
cabler / thermal / medic / scanner / diver / resonator とは重複しません)。

### 浅海10種(zones 1-3・真新しい綺麗な装備・侵食ゼロ)

### tridentDiver(トライデントダイバー)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
Notably tall and lean build; the helmet dome is slightly taller and more elongated
(oval) than standard; a small stenciled squad number "03" marks one shoulder plate;
stands with a confident forward-leaning posture. Brass fittings bright and freshly
polished, navy-teal fabric clean and unscuffed — a shallow-zone junior recruit, nothing
unsettling about this badge at all.

Holding: a short three-pronged trident held upright in both hands, a cyan glow running
along its tines.

No pet drones, no animal-costume theming, no religious or ceremonial dress, no
throne-like framing — the same grounded diver/suit/helmet family as this game's existing
8-character crew roster in every case.
```

### buoyRunner(ブイランナー)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
The smallest, most compact build of the set; the helmet dome is noticeably smaller and
rounder; the suit runs a lighter slate-blue undertone rather than navy; the chest strap
is looped twice across the body; head tilted at a relaxed angle. Brass fittings bright
and freshly polished, fabric clean and unscuffed — a shallow-zone junior recruit,
nothing unsettling about this badge at all.

Holding: a small folded marker buoy tucked under one arm, a soft cyan glow from its
beacon light.

No pet drones, no animal-costume theming, no religious or ceremonial dress, no
throne-like framing — the same grounded diver/suit/helmet family as this game's existing
8-character crew roster in every case.
```

### winchHand(ウィンチハンド)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
Broad-shouldered, stocky build; the helmet dome is flatter and wider, with a double
collar ring instead of one; several external rope-loop attachment points run across the
chest in place of the single strap; feet planted wide. Brass fittings bright and freshly
polished, fabric clean and unscuffed — a shallow-zone junior recruit, nothing unsettling
about this badge at all.

Holding: a small hand-winch with coiled cable held in both hands, a cyan glow running
along the cable.

No pet drones, no animal-costume theming, no religious or ceremonial dress, no
throne-like framing — the same grounded diver/suit/helmet family as this game's existing
8-character crew roster in every case.
```

### fieldMedicCadet(フィールドメディック候補生)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
The leanest, youngest-looking silhouette of the set; the helmet has one extra small
round porthole window on its side in addition to the usual bolt-domes; the suit runs a
lighter teal-green undertone; the case is slung diagonally across the body on its own
strap. Brass fittings bright and freshly polished, fabric clean and unscuffed — a
shallow-zone junior recruit, nothing unsettling about this badge at all.

Holding: a small first-aid case held open at chest height, a cyan glowing cross marking
on the lid.

No pet drones, no animal-costume theming, no religious or ceremonial dress, no
throne-like framing — the same grounded diver/suit/helmet family as this game's existing
8-character crew roster in every case.
```

### signalFlareOp(シグナルフレアオペレーター)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
Medium build with one asymmetric raised shoulder pauldron (right side only); three small
bolt-domes sit in a row on the helmet instead of the usual two; a faded diagonal
warning-stripe band wraps one forearm. Brass fittings bright and freshly polished,
fabric clean and unscuffed — a shallow-zone junior recruit, nothing unsettling about
this badge at all.

Holding: a flare launcher held upright in one hand, a warm amber glow at its tip.

No pet drones, no animal-costume theming, no religious or ceremonial dress, no
throne-like framing — the same grounded diver/suit/helmet family as this game's existing
8-character crew roster in every case.
```

### lightShieldBearer(ライトシールドベアラー)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
The stockiest build of the shallow set; the helmet dome sits flatter and wider at its
base; a small extra round plate is riveted at the center of the chest as a proto-shield
motif; wide, firmly planted stance. Brass fittings bright and freshly polished, fabric
clean and unscuffed — a shallow-zone junior recruit, nothing unsettling about this badge
at all.

Holding: a small round pressure-shield held across the chest, a cyan glow tracing its
rim.

No pet drones, no animal-costume theming, no religious or ceremonial dress, no
throne-like framing — the same grounded diver/suit/helmet family as this game's existing
8-character crew roster in every case.
```

### tetherSplicer(テザースプライサー)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
Slim, wiry build; the helmet dome is narrower and slightly faceted rather than fully
spherical; several small spool-clip attachments line the belt; head tilted as if
listening for something. Brass fittings bright and freshly polished, fabric clean and
unscuffed — a shallow-zone junior recruit, nothing unsettling about this badge at all.

Holding: a small reel of cable held in both hands, a cyan glow along the spooled wire.

No pet drones, no animal-costume theming, no religious or ceremonial dress, no
throne-like framing — the same grounded diver/suit/helmet family as this game's existing
8-character crew roster in every case.
```

### torchDiver(トーチダイバー)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
Medium build with a single heat-scorched dark patch on one forearm sleeve (from their
own tool's use, not from wear); a small tinted amber shade-flap is flipped up above the
helmet dome. Brass fittings bright and freshly polished, fabric clean and unscuffed — a
shallow-zone junior recruit, nothing unsettling about this badge at all.

Holding: a compact cutting-torch tool held in one hand, a small blue-white flame glowing
at its tip.

No pet drones, no animal-costume theming, no religious or ceremonial dress, no
throne-like framing — the same grounded diver/suit/helmet family as this game's existing
8-character crew roster in every case.
```

### chartScout(チャートスカウト)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
Back-heavy build carrying a large flat mapping-case backpack over one shoulder; a slim
antenna rod is fixed to the top of the helmet in place of the usual bolt-domes; alert,
tilted head. Brass fittings bright and freshly polished, fabric clean and unscuffed — a
shallow-zone junior recruit, nothing unsettling about this badge at all.

Holding: a handheld mapping scanner held up near the helmet, a cyan glow from its small
screen.

No pet drones, no animal-costume theming, no religious or ceremonial dress, no
throne-like framing — the same grounded diver/suit/helmet family as this game's existing
8-character crew roster in every case.
```

### finSprinter(フィンスプリンター)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
The leanest, most athletic build of all thirty; the helmet dome is the smallest and
lowest-profile of the set; minimal belt pouches; caught in a dynamic mid-stride pose.
Brass fittings bright and freshly polished, fabric clean and unscuffed — a shallow-zone
junior recruit, nothing unsettling about this badge at all.

Holding: no tool — both gloved fists raised in a ready stance, a faint cyan motion-glow
trailing from the gloves.

No pet drones, no animal-costume theming, no religious or ceremonial dress, no
throne-like framing — the same grounded diver/suit/helmet family as this game's existing
8-character crew roster in every case.
```

### 中層10種(zones 4-6・使い込まれた大きめの装備・軽い侵食を1つずつ)

### salvageCutter(サルベージカッター)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
Heavy-set, bulky build, visibly bigger than any shallow-zone recruit. Brass fittings
tarnished, fabric visibly weathered, two mismatched replacement shoulder plates.
Encroachment: a fist-sized patch of barnacles has taken hold on one shoulder plate, and
a single small fish tail pokes out from a crack near the collar.

Holding: a large two-handed cutting tool, twice the size of a shallow-zone tool, a warm
amber glow along its worn, scorched blade edge.

No pet drones, no animal-costume theming, no religious or ceremonial dress, no
throne-like framing — the same grounded diver/suit/helmet family as this game's existing
8-character crew roster in every case.
```

### trawlNetHandler(トロールネットハンドラー)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
Broad build, salt-crust staining down one side of the suit. Brass fittings tarnished,
fabric visibly weathered. Encroachment: a small eel is tangled and stuck in the net
itself, still faintly twitching; a few barnacles cling to the net's weights.

Holding: a heavy weighted net bundled over one arm, noticeably bigger and heavier than
the shallow-zone net, a cyan glow along its mesh.

No pet drones, no animal-costume theming, no religious or ceremonial dress, no
throne-like framing — the same grounded diver/suit/helmet family as this game's existing
8-character crew roster in every case.
```

### pressureEngineer(プレッシャーエンジニア)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
The thickest-armored build of the mid set. Brass fittings tarnished, fabric visibly
weathered. Encroachment: a cluster of small barnacles has grown along one forearm's
rivet line, and a single small lanternfish is fused into the plating there, its tiny
lure still faintly glowing.

Holding: a large pressure-gauge control console strapped to the chest, bigger than a
handheld unit, a cyan glow from its dial.

No pet drones, no animal-costume theming, no religious or ceremonial dress, no
throne-like framing — the same grounded diver/suit/helmet family as this game's existing
8-character crew roster in every case.
```

### deepCableRigger(ディープケーブルリガー)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
Wiry, cable-draped build. Brass fittings tarnished, fabric visibly weathered.
Encroachment: a thin eel has coiled itself in among the cables, indistinguishable at a
glance from the wiring; a few barnacles dot one shoulder.

Holding: a heavy tangle of thick cables slung over both shoulders, visibly heavier than
the shallow-zone reel, a cyan glow pulsing along them.

No pet drones, no animal-costume theming, no religious or ceremonial dress, no
throne-like framing — the same grounded diver/suit/helmet family as this game's existing
8-character crew roster in every case.
```

### reactorHandler(リアクターハンドラー)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
Stocky build, the reactor's light casting uneven flickers across the badge. Brass
fittings tarnished, fabric visibly weathered. Encroachment: barnacle crust rings the
base of the reactor housing, and a small fish skeleton is visible pressed flat against
the hot casing, fused there.

Holding: a large portable reactor core, noticeably bigger than the shallow-zone tools,
strapped to the chest with a warm amber glow.

No pet drones, no animal-costume theming, no religious or ceremonial dress, no
throne-like framing — the same grounded diver/suit/helmet family as this game's existing
8-character crew roster in every case.
```

### triageOfficer(トリアージオフィサー)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
Gaunt, thin-shouldered build, head tilted slightly too far to one side. Brass fittings
tarnished, fabric visibly weathered. Encroachment: small barnacles have grown along the
case's hinge, and a tiny fish fin pokes out from a crack in one boot.

Holding: a large medical case, bigger and heavier than the shallow-zone kit, held open
at chest height, a cyan glowing cross on the lid.

No pet drones, no animal-costume theming, no religious or ceremonial dress, no
throne-like framing — the same grounded diver/suit/helmet family as this game's existing
8-character crew roster in every case.
```

### deepSonarOperator(ディープソナーオペレーター)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
Build weighed down asymmetrically by the dish. Brass fittings tarnished, fabric visibly
weathered. Encroachment: barnacles crust the rim of the dish, and a small fish is nested
and swimming lazily in a puddle collected at its center.

Holding: a large dish-shaped sonar array strapped to one shoulder, visibly bigger than
the shallow-zone handheld scanner, a cyan glow from its dial.

No pet drones, no animal-costume theming, no religious or ceremonial dress, no
throne-like framing — the same grounded diver/suit/helmet family as this game's existing
8-character crew roster in every case.
```

### ballastMaster(バラストマスター)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
Squat, heavy-bottomed build. Brass fittings tarnished, fabric visibly weathered.
Encroachment: the ballast weight itself is crusted thick with barnacles and a single
small crab clings to its underside.

Holding: a heavy ballast weight, larger and denser-looking than the shallow-zone
version, held in both hands, a cyan glow tracing its rim.

No pet drones, no animal-costume theming, no religious or ceremonial dress, no
throne-like framing — the same grounded diver/suit/helmet family as this game's existing
8-character crew roster in every case.
```

### drillOperator(ドリルオペレーター)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
Forward-hunched build. Brass fittings tarnished, fabric visibly weathered. Encroachment:
barnacles have grown along the drill's housing, and a small fish is impaled and fused
onto the drill bit itself, long dead but still glowing faintly.

Holding: a hand-held rotary drill, noticeably larger than the shallow-zone torch, held
upright, a warm amber glow at its tip.

No pet drones, no animal-costume theming, no religious or ceremonial dress, no
throne-like framing — the same grounded diver/suit/helmet family as this game's existing
8-character crew roster in every case.
```

### lineAnchor(ラインアンカー)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
The widest stance of the mid-zone set. Brass fittings tarnished, fabric visibly
weathered. Encroachment: the anchor's flukes are thick with barnacles, and a small fish
skeleton hangs caught in the chain links near the shoulder.

Holding: a heavy mooring anchor and coiled chain, larger than the shallow-zone version,
held across the chest, a cyan glow along the links.

No pet drones, no animal-costume theming, no religious or ceremonial dress, no
throne-like framing — the same grounded diver/suit/helmet family as this game's existing
8-character crew roster in every case.
```

### 深層10種(zones 7-10・古代大型兵装・露骨な深海生物の侵食)

### heavyPressureTrooper(ヘビープレッシャートルーパー)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
By far the most physically massive build of all thirty, towering and broad, built to
look like a wall of muscle and old brass. Ancient, deeply corroded brass plating crusted
thick with barnacles across both shoulders. Encroachment: a small anglerfish skull, its
lure still faintly glowing amber, is fused into the barnacle crust on one shoulder like
a grim mascot. This is unmistakably the most physically powerful-looking silhouette in
the whole roster.

Holding: no hand tool — both forearms have been replaced/reinforced with a pair of
massive ancient brass gauntlets, each the size of a small anvil, corroded and
barnacle-crusted.

No religious or ceremonial dress, no throne-like framing, no skeletal or bone-magic
fusion — the corruption here is specifically deep-sea marine life (barnacles, small
fish, eels, tendrils, bioluminescent growths) visibly overtaking an otherwise
recognizable diver/suit/helmet silhouette, not a generic monster transformation.
```

### twinDrillRigger(ツインドリルリガー)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
Tall, wide-stanced build needed to brace the sheer size of the twin drill-spears.
Ancient corroded bronze plating. Encroachment: a small eel is coiled tightly around the
haft of one drill-spear, and barnacle crust climbs the shaft of the other; both weapons
look far older and grander than any tool seen in the shallow or mid tiers.

Holding: two colossal ancient drill-spears, each half again as tall as the diver,
corroded bronze shafts engraved with worn ritual spirals, a warm amber glow pulsing at
both tips.

No religious or ceremonial dress, no throne-like framing, no skeletal or bone-magic
fusion — the corruption here is specifically deep-sea marine life (barnacles, small
fish, eels, tendrils, bioluminescent growths) visibly overtaking an otherwise
recognizable diver/suit/helmet silhouette, not a generic monster transformation.
```

### deepChargeSetter(ディープチャージセッター)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
Broad, braced stance needed to carry the harpoon-cannon's weight. Ancient bronze
plating, deeply corroded. Encroachment: barnacle crust runs the length of the cannon's
barrel, and a cluster of tiny fish eggs glow faintly cyan in a crevice near the trigger
— the weapon looks like a relic that has spent centuries on the seafloor before being
reclaimed.

Holding: a massive ancient bronze harpoon-cannon slung across the back, ornately
engraved, far larger than any shallow or mid-tier tool, a demolition charge nested
glowing amber in its open muzzle.

No religious or ceremonial dress, no throne-like framing, no skeletal or bone-magic
fusion — the corruption here is specifically deep-sea marine life (barnacles, small
fish, eels, tendrils, bioluminescent growths) visibly overtaking an otherwise
recognizable diver/suit/helmet silhouette, not a generic monster transformation.
```

### umbilicalWarden(アンビリカルウォーデン)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
Heavily cable-draped silhouette, the tentacle-cords adding significant visual bulk.
Ancient brass plating beneath the growth. Encroachment: the tentacle-cords converge at
the collar into a small lamprey-like circular mouth, ringed with tiny teeth, fused where
a simple cable coupler would once have been — deeply unsettling and clearly very
powerful.

Holding: what were once cables have become thick, fleshy, tentacle-like cords, clearly
overtaken by some deep-sea organism, fused directly into the chest plating, pulsing with
a cyan glow.

No religious or ceremonial dress, no throne-like framing, no skeletal or bone-magic
fusion — the corruption here is specifically deep-sea marine life (barnacles, small
fish, eels, tendrils, bioluminescent growths) visibly overtaking an otherwise
recognizable diver/suit/helmet silhouette, not a generic monster transformation.
```

### furnaceDiver(ファーネスダイバー)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
Broad-chested build, the largest heat source of the entire roster. Ancient brass
plating, scorched and corroded. Encroachment: a large anglerfish jaw, easily as wide as
the furnace itself, is fused open around the glow like a hungry maw feeding on the
light; small fish bones are visible caught in its teeth.

Holding: an ancient furnace-heart the size of the whole torso, bound on with thick
barnacle-crusted brass bands, an intense amber glow leaking from every seam.

No religious or ceremonial dress, no throne-like framing, no skeletal or bone-magic
fusion — the corruption here is specifically deep-sea marine life (barnacles, small
fish, eels, tendrils, bioluminescent growths) visibly overtaking an otherwise
recognizable diver/suit/helmet silhouette, not a generic monster transformation.
```

### traumaSurgeon(トラウマサージョン)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
Unnaturally rigid, upright posture despite the size of the blade. Ancient
brass-and-bone-white fittings. Encroachment: one shoulder pauldron has sprouted a small
fan of translucent fish-fin growths, and barnacles crust the blade's crossguard — an
object that looks equally capable of healing or ending a fight.

Holding: an oversized ancient bone-white relic blade the size of a claymore in place of
any small medical tool, its edge lined with rows of small embedded fish teeth, a cyan
glowing cross etched into the hilt.

No religious or ceremonial dress, no throne-like framing, no skeletal or bone-magic
fusion — the corruption here is specifically deep-sea marine life (barnacles, small
fish, eels, tendrils, bioluminescent growths) visibly overtaking an otherwise
recognizable diver/suit/helmet silhouette, not a generic monster transformation.
```

### longRangeSonarChief(ロングレンジソナーチーフ)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
Build visibly bowed forward slightly under the sheer size and weight of the shell-array.
Ancient, deeply corroded brass. Encroachment: barnacles crust every ridge of the spiral
shell, and several small deep-sea fish can be seen nested and swimming slowly within its
coiled grooves, at home in the ancient device.

Holding: a massive ancient brass array shaped like a coiled ammonite shell, strapped
across the entire back and dwarfing the diver, a cyan glow pulsing from within its
spiral.

No religious or ceremonial dress, no throne-like framing, no skeletal or bone-magic
fusion — the corruption here is specifically deep-sea marine life (barnacles, small
fish, eels, tendrils, bioluminescent growths) visibly overtaking an otherwise
recognizable diver/suit/helmet silhouette, not a generic monster transformation.
```

### signalRelayVeteran(シグナルリレーベテラン)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
Heavily built to carry the transmitter horn's weight, listing slightly to one side under
it. Ancient brass fittings, deeply corroded. Encroachment: barnacle crust runs up the
entire strap, and a small eel is threaded through the horn's mouthpiece, occasionally
flexing as if still half-alive.

Holding: a massive ancient brass-and-conch-shell transmitter horn, large enough to
double as a club, slung like a weapon across one shoulder, a flickering cyan glow deep
within its bell.

No religious or ceremonial dress, no throne-like framing, no skeletal or bone-magic
fusion — the corruption here is specifically deep-sea marine life (barnacles, small
fish, eels, tendrils, bioluminescent growths) visibly overtaking an otherwise
recognizable diver/suit/helmet silhouette, not a generic monster transformation.
```

### compactProbeDiver(コンパクトプローブダイバー)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
Small and lightly built despite belonging to the deep-zone veterans — the deliberate
exception. Deliberately breaking the pattern of the rest of this set: brass fittings
stay clean and untouched by any barnacle or marine growth, no fish, no ancient oversized
relic weapon, just small orderly modern-looking gear — the calmest, most unassuming
badge in the entire deep-zone roster, and precisely because of that, the most unsettling
one to find down here unscathed.

Holding: a small, well-kept probe-scanner tool held up in one hand, a steady, even cyan
glow.

No religious or ceremonial dress, no throne-like framing, no skeletal or bone-magic
fusion — the corruption here is specifically deep-sea marine life (barnacles, small
fish, eels, tendrils, bioluminescent growths) visibly overtaking an otherwise
recognizable diver/suit/helmet silhouette, not a generic monster transformation.
```

### commandDiver(コマンドダイバー)
```
A single circular badge-style character portrait for a deep-sea exploration roguelike
crew roster, matching this game's existing 8-character crew badge set exactly. Square
canvas, transparent background outside the badge. The badge: an opaque circle filling
~90% of the frame, a smooth radial gradient from dark abyssal navy #030711 at the rim to
a lighter glowing teal #0d2b3a near the center, a few faint thin concentric sonar-ring
circles radiating behind the character, and a soft glowing cyan #4fd6e8 rim-light ring
traced right along the badge's outer edge, with a soft blurred glow bleeding slightly
beyond the circle's rim before fading to transparent. Retro-modern painted illustration
with visible fine pixel-art dithering in the shading (not flat vector linework), bold
clean dark ink outlines, moderate specular highlights on metal and glass.

Subject: a bust (chest-up) portrait of a diver, facing forward, centered and filling
most of the badge. They wear a bulky old-fashioned brass diving suit: dark navy-teal
segmented plating, prominent brass/bronze rivets and joint rings at the shoulders and
neck, a diagonal brass-buckled chest strap, small utility pouches visible at the very
bottom edge of the crop. They wear a large round glass diving-helmet that fully encloses
the head, a riveted brass collar ring at its base, a couple of small brass bolt-domes on
top, and two small round rivet-lights set into the sides of the helmet with one lit by a
soft warm glow; the glass dome carries a bright specular highlight glinting across its
curve and otherwise shows only a dark, softly glowing void behind it — no visible face.
The most senior and most imposing figure in the entire 30-character roster, standing
perfectly composed beside the planted blade-spear. Ancient brass-and-bone-white plating,
weathered but deliberately well-kept rather than crudely damaged. Encroachment:
barnacles and small fish are fused along the length of the planted blade-spear and up
one side of the suit's seams, yet worn with total calm — this is clearly the single most
powerful-looking character in the roster, and the only one who seems entirely
undisturbed by what has grown onto them.

Holding: no hand tool — instead, a colossal ancient ceremonial blade-spear, taller than
the diver themselves, is planted upright beside them like a standard, its head wrought
in corroded brass and bone-white metal.

No religious or ceremonial dress, no throne-like framing, no skeletal or bone-magic
fusion — the corruption here is specifically deep-sea marine life (barnacles, small
fish, eels, tendrils, bioluminescent growths) visibly overtaking an otherwise
recognizable diver/suit/helmet silhouette, not a generic monster transformation.
```
