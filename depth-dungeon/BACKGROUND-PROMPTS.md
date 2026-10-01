# 深海ダンジョン ― 画面背景 画像生成プロンプト

対象: 紺色一色で寂しい3画面の背景画像。

1. **観測記録(図鑑)** ― 海域ごとの縦長(3:4)背景 10枚。「スクロールするほど深く沈んでいく」一覧UIの
   カード背景として使う。**既存の `web/src/assets/bg/zoneN.webp`(横長)を、この10枚の縦長版で
   置き換える想定**(zoneSelect 画面でも同じファイルを使い回すので、置き換えると両方に反映される)。
2. **装備・収納画面** の背景 1枚。
3. **スキルツリー画面** の背景 1枚。

各プロンプトはコードブロック1つでそのままコピペして使える完結した文章にしてあります(共通の
スタイル指定を毎回全文含めているので、他のブロックを見に行ったり貼り合わせたりする必要はありません)。

## 使い方

1. 下のプロンプトをそれぞれ画像生成に使う(1枚ずつでOK。まとめて生成する必要はない)。
2. 見出しに書いてある**保存ファイル名**でそのまま `web/src/assets/bg/` に保存する
   (拡張子は `.webp` 推奨。`.png`/`.jpg` で出てきた場合は変換してから置く)。
3. コード側は既に対応済みで、置くだけで自動的に反映される(`import.meta.glob` でフォルダを
   丸ごと読み込んでいるため、ファイル名が一致していればビルドし直すだけで良い)。
   - 図鑑・海域選択: `zone1.webp` 〜 `zone10.webp`(**既存ファイルを上書き**)
   - 装備・収納: `equip.webp`(新規)
   - スキルツリー: `skilltree.webp`(新規)
4. 生成解像度: 縦長 3:4 を推奨(例: 1080×1440px)。長辺1600px程度あれば十分。書き出し後は
   webp で長辺1200px前後・ファイルサイズ200KB以下程度に圧縮して置くと軽くて良い。
5. **なぜ縦長にするか**: 図鑑の海域一覧は画面いっぱいの縦長カードを1枚ずつスクロールで見せる
   UIにしたため、既存の横長画像だと `object-fit: cover` で中央の細い帯しか見えず、絵の情報量が
   少なくて「ただの色の板」に見えてしまっていた(グレーに見えていた原因の一つ)。縦長で構図から
   作り直すことで、スクロールで画面いっぱいに見えたときにちゃんと絵として成立する。

---

## 1. 観測記録・海域選択 ― 海域ごとの縦長背景(10枚)

### 海域1「薄明層 / TWILIGHT」(-200m) → `zone1.webp`
```
A single full-bleed background illustration for a deep-sea exploration roguelike, portrait
orientation (3:4 aspect ratio), no text, no UI, no border, no vignette frame, no watermark.
Style: bioluminescent scientific-instrument aesthetic — like a sonar readout crossed with a
naturalist's ink field-guide plate, rendered as an immersive environment rather than a single
centered subject. Limited shared palette: abyssal navy #030711 base, glowing biolume cyan
#4fd6e8, soft violet #c58cff, warning amber #ffd27f, bone off-white #dff0f6, plus one accent
color specified below. Fine 1.5px linework on foreground details, faint concentric sonar-ring
texture drifting in the water, very subtle CRT scanline texture, soft volumetric light shafts
from above. Sense of real depth and scale (near/mid/far layers, atmospheric perspective fading
into the dark at the bottom of the frame). The lower ~40% of the frame should read comfortably
dark/uncluttered (this area will have text overlaid on it), while the upper ~60% can carry the
most detail and visual interest. Cohesive with a matching icon set — same lighting angle, same
stroke weight, same glow intensity.

Scene: a sunlit kelp forest twilight zone just below the surface, soft cyan-teal light shafts
filtering down through swaying kelp fronds, silhouettes of small jellyfish and a lanternfish
drifting mid-water, gentle upward-rising light motes. Accent color: cyan #4fd6e8. Mood: calm,
inviting, the shallowest and safest-feeling zone.
```

### 海域2「珊瑚礁址 / REEF RUINS」(-600m) → `zone2.webp`
```
A single full-bleed background illustration for a deep-sea exploration roguelike, portrait
orientation (3:4 aspect ratio), no text, no UI, no border, no vignette frame, no watermark.
Style: bioluminescent scientific-instrument aesthetic — like a sonar readout crossed with a
naturalist's ink field-guide plate, rendered as an immersive environment rather than a single
centered subject. Limited shared palette: abyssal navy #030711 base, glowing biolume cyan
#4fd6e8, soft violet #c58cff, warning amber #ffd27f, bone off-white #dff0f6, plus one accent
color specified below. Fine 1.5px linework on foreground details, faint concentric sonar-ring
texture drifting in the water, very subtle CRT scanline texture, soft volumetric light shafts
from above. Sense of real depth and scale (near/mid/far layers, atmospheric perspective fading
into the dark at the bottom of the frame). The lower ~40% of the frame should read comfortably
dark/uncluttered (this area will have text overlaid on it), while the upper ~60% can carry the
most detail and visual interest. Cohesive with a matching icon set — same lighting angle, same
stroke weight, same glow intensity.

Scene: the ruins of a bleached coral reef structure, broken coral archways and spires in the
mid-ground, a large crab silhouette and urchin spines among the rubble, teal-green ambient
light. Accent color: seafoam teal #5ee0c4. Mood: overgrown, quietly eerie ruins reclaimed by
crustacean life.
```

### 海域3「沈船墓場 / WRECK FIELD」(-1200m) → `zone3.webp`
```
A single full-bleed background illustration for a deep-sea exploration roguelike, portrait
orientation (3:4 aspect ratio), no text, no UI, no border, no vignette frame, no watermark.
Style: bioluminescent scientific-instrument aesthetic — like a sonar readout crossed with a
naturalist's ink field-guide plate, rendered as an immersive environment rather than a single
centered subject. Limited shared palette: abyssal navy #030711 base, glowing biolume cyan
#4fd6e8, soft violet #c58cff, warning amber #ffd27f, bone off-white #dff0f6, plus one accent
color specified below. Fine 1.5px linework on foreground details, faint concentric sonar-ring
texture drifting in the water, very subtle CRT scanline texture, soft volumetric light shafts
from above. Sense of real depth and scale (near/mid/far layers, atmospheric perspective fading
into the dark at the bottom of the frame). The lower ~40% of the frame should read comfortably
dark/uncluttered (this area will have text overlaid on it), while the upper ~60% can carry the
most detail and visual interest. Cohesive with a matching icon set — same lighting angle, same
stroke weight, same glow intensity.

Scene: a graveyard of shipwrecks resting on a silty seabed, the broken hull and ribs of a large
vessel looming in the mid-ground, scattered cargo and an anchor chain, muted grey-blue light,
drifting silt particles. Accent color: dull steel blue #8aa0b4. Mood: solemn, industrial decay,
history sinking into the dark.
```

### 海域4「熱水噴出帯 / HYDROTHERMAL」(-2000m) → `zone4.webp`
```
A single full-bleed background illustration for a deep-sea exploration roguelike, portrait
orientation (3:4 aspect ratio), no text, no UI, no border, no vignette frame, no watermark.
Style: bioluminescent scientific-instrument aesthetic — like a sonar readout crossed with a
naturalist's ink field-guide plate, rendered as an immersive environment rather than a single
centered subject. Limited shared palette: abyssal navy #030711 base, glowing biolume cyan
#4fd6e8, soft violet #c58cff, warning amber #ffd27f, bone off-white #dff0f6, plus one accent
color specified below. Fine 1.5px linework on foreground details, faint concentric sonar-ring
texture drifting in the water, very subtle CRT scanline texture, soft volumetric light shafts
from above. Sense of real depth and scale (near/mid/far layers, atmospheric perspective fading
into the dark at the bottom of the frame). The lower ~40% of the frame should read comfortably
dark/uncluttered (this area will have text overlaid on it), while the upper ~60% can carry the
most detail and visual interest. Cohesive with a matching icon set — same lighting angle, same
stroke weight, same glow intensity.

Scene: a hydrothermal vent field, black smoker chimneys billowing dark mineral plumes lit from
within by warm orange-red glow, tubeworm colonies clustered at the base, shimmering heat
distortion in the water. Accent color: ember orange #ff8a5c. Mood: hostile, geologically alive,
warm light against the cold dark.
```

### 海域5「発光生物圏 / BIOLUMEN」(-3000m) → `zone5.webp`
```
A single full-bleed background illustration for a deep-sea exploration roguelike, portrait
orientation (3:4 aspect ratio), no text, no UI, no border, no vignette frame, no watermark.
Style: bioluminescent scientific-instrument aesthetic — like a sonar readout crossed with a
naturalist's ink field-guide plate, rendered as an immersive environment rather than a single
centered subject. Limited shared palette: abyssal navy #030711 base, glowing biolume cyan
#4fd6e8, soft violet #c58cff, warning amber #ffd27f, bone off-white #dff0f6, plus one accent
color specified below. Fine 1.5px linework on foreground details, faint concentric sonar-ring
texture drifting in the water, very subtle CRT scanline texture, soft volumetric light shafts
from above. Sense of real depth and scale (near/mid/far layers, atmospheric perspective fading
into the dark at the bottom of the frame). The lower ~40% of the frame should read comfortably
dark/uncluttered (this area will have text overlaid on it), while the upper ~60% can carry the
most detail and visual interest. Cohesive with a matching icon set — same lighting angle, same
stroke weight, same glow intensity.

Scene: a garden of bioluminescent jellyfish and glowing spores suspended in deep violet water,
layered silhouettes of drifting jelly-bells glowing from within, soft floating light particles
throughout the frame. Accent color: violet #c58cff. Mood: dreamlike, hypnotic, faintly
dangerous beauty.
```

### 海域6「氷結海淵 / GLACIAL」(-4200m) → `zone6.webp`
```
A single full-bleed background illustration for a deep-sea exploration roguelike, portrait
orientation (3:4 aspect ratio), no text, no UI, no border, no vignette frame, no watermark.
Style: bioluminescent scientific-instrument aesthetic — like a sonar readout crossed with a
naturalist's ink field-guide plate, rendered as an immersive environment rather than a single
centered subject. Limited shared palette: abyssal navy #030711 base, glowing biolume cyan
#4fd6e8, soft violet #c58cff, warning amber #ffd27f, bone off-white #dff0f6, plus one accent
color specified below. Fine 1.5px linework on foreground details, faint concentric sonar-ring
texture drifting in the water, very subtle CRT scanline texture, soft volumetric light shafts
from above. Sense of real depth and scale (near/mid/far layers, atmospheric perspective fading
into the dark at the bottom of the frame). The lower ~40% of the frame should read comfortably
dark/uncluttered (this area will have text overlaid on it), while the upper ~60% can carry the
most detail and visual interest. Cohesive with a matching icon set — same lighting angle, same
stroke weight, same glow intensity.

Scene: a submerged glacial rift, pale blue-white ice walls and hanging icicle formations
framing the mid-ground, fine ice particles falling like snow through the water, a faint aurora-
like shimmer in the ambient light. Accent color: ice blue #aadcff. Mood: cold, crystalline,
hushed.
```

### 海域7「磁気異常帯 / MAGNETIC」(-5600m) → `zone7.webp`
```
A single full-bleed background illustration for a deep-sea exploration roguelike, portrait
orientation (3:4 aspect ratio), no text, no UI, no border, no vignette frame, no watermark.
Style: bioluminescent scientific-instrument aesthetic — like a sonar readout crossed with a
naturalist's ink field-guide plate, rendered as an immersive environment rather than a single
centered subject. Limited shared palette: abyssal navy #030711 base, glowing biolume cyan
#4fd6e8, soft violet #c58cff, warning amber #ffd27f, bone off-white #dff0f6, plus one accent
color specified below. Fine 1.5px linework on foreground details, faint concentric sonar-ring
texture drifting in the water, very subtle CRT scanline texture, soft volumetric light shafts
from above. Sense of real depth and scale (near/mid/far layers, atmospheric perspective fading
into the dark at the bottom of the frame). The lower ~40% of the frame should read comfortably
dark/uncluttered (this area will have text overlaid on it), while the upper ~60% can carry the
most detail and visual interest. Cohesive with a matching icon set — same lighting angle, same
stroke weight, same glow intensity.

Scene: a field of magnetized iron debris and metallic spires suspended at odd angles as if
gravity is uncertain, faint electromagnetic distortion lines rippling through the water, a
flickering blue-violet glow. Accent color: electric indigo #7fa7ff. Mood: unsettling, physics
gone slightly wrong.
```

### 海域8「巨骸の谷 / OSSUARY」(-7000m) → `zone8.webp`
```
A single full-bleed background illustration for a deep-sea exploration roguelike, portrait
orientation (3:4 aspect ratio), no text, no UI, no border, no vignette frame, no watermark.
Style: bioluminescent scientific-instrument aesthetic — like a sonar readout crossed with a
naturalist's ink field-guide plate, rendered as an immersive environment rather than a single
centered subject. Limited shared palette: abyssal navy #030711 base, glowing biolume cyan
#4fd6e8, soft violet #c58cff, warning amber #ffd27f, bone off-white #dff0f6, plus one accent
color specified below. Fine 1.5px linework on foreground details, faint concentric sonar-ring
texture drifting in the water, very subtle CRT scanline texture, soft volumetric light shafts
from above. Sense of real depth and scale (near/mid/far layers, atmospheric perspective fading
into the dark at the bottom of the frame). The lower ~40% of the frame should read comfortably
dark/uncluttered (this area will have text overlaid on it), while the upper ~60% can carry the
most detail and visual interest. Cohesive with a matching icon set — same lighting angle, same
stroke weight, same glow intensity.

Scene: a valley floor covered in the bones of a colossal ancient creature, giant rib bones
arching overhead like a cathedral, a skull half-buried in silt in the mid-ground, warm
bone-white and grey tones, minimal ambient light. Accent color: bone tan #c8beaa. Mood:
monumental, funereal, awe mixed with dread.
```

### 海域9「無音海溝 / SILENCE」(-8500m) → `zone9.webp`
```
A single full-bleed background illustration for a deep-sea exploration roguelike, portrait
orientation (3:4 aspect ratio), no text, no UI, no border, no vignette frame, no watermark.
Style: bioluminescent scientific-instrument aesthetic — like a sonar readout crossed with a
naturalist's ink field-guide plate, rendered as an immersive environment rather than a single
centered subject. Limited shared palette: abyssal navy #030711 base, glowing biolume cyan
#4fd6e8, soft violet #c58cff, warning amber #ffd27f, bone off-white #dff0f6, plus one accent
color specified below. Fine 1.5px linework on foreground details, faint concentric sonar-ring
texture drifting in the water, very subtle CRT scanline texture, soft volumetric light shafts
from above. Sense of real depth and scale (near/mid/far layers, atmospheric perspective fading
into the dark at the bottom of the frame). The lower ~40% of the frame should read comfortably
dark/uncluttered (this area will have text overlaid on it), while the upper ~60% can carry the
most detail and visual interest. Cohesive with a matching icon set — same lighting angle, same
stroke weight, same glow intensity.

Scene: an extremely deep ocean trench, walls barely visible at the edges of near-total
blackness, one faint distant point of pale light suggesting something watching from far below,
almost no ambient light. Accent color: muted slate #78a0aa, used very sparingly. Mood:
oppressive silence, the deepest kind of dread, mostly negative space.
```

### 海域10「星海境界 / STARSEA」(-10000m) → `zone10.webp`
```
A single full-bleed background illustration for a deep-sea exploration roguelike, portrait
orientation (3:4 aspect ratio), no text, no UI, no border, no vignette frame, no watermark.
Style: bioluminescent scientific-instrument aesthetic — like a sonar readout crossed with a
naturalist's ink field-guide plate, rendered as an immersive environment rather than a single
centered subject. Limited shared palette: abyssal navy #030711 base, glowing biolume cyan
#4fd6e8, soft violet #c58cff, warning amber #ffd27f, bone off-white #dff0f6, plus one accent
color specified below. Fine 1.5px linework on foreground details, faint concentric sonar-ring
texture drifting in the water, very subtle CRT scanline texture, soft volumetric light shafts
from above. Sense of real depth and scale (near/mid/far layers, atmospheric perspective fading
into the dark at the bottom of the frame). The lower ~40% of the frame should read comfortably
dark/uncluttered (this area will have text overlaid on it), while the upper ~60% can carry the
most detail and visual interest. Cohesive with a matching icon set — same lighting angle, same
stroke weight, same glow intensity.

Scene: the ocean floor gives way to an impossible star-filled void, a threshold where deep-sea
water blends into open cosmos, faint starfield and nebula wisps visible through a tear in the
water above jagged threshold rock formations, warm amber-gold light. Accent color: amber
#ffd27f. Mood: awe, transcendence, the boundary between sea and stars — the final zone.
```

---

## 2. 装備・収納画面の背景 → `equip.webp`

```
A single full-bleed background illustration for a deep-sea exploration roguelike, portrait
orientation (3:4 aspect ratio), no text, no UI, no border, no vignette frame, no watermark.
Style: bioluminescent scientific-instrument aesthetic — like a sonar readout crossed with a
naturalist's ink field-guide plate, rendered as an immersive environment rather than a single
centered subject. Limited shared palette: abyssal navy #030711 base, glowing biolume cyan
#4fd6e8, soft violet #c58cff, warning amber #ffd27f, bone off-white #dff0f6, plus one accent
color specified below. Fine 1.5px linework on foreground details, faint concentric sonar-ring
texture drifting in the water, very subtle CRT scanline texture, soft volumetric light shafts
from above. Sense of real depth and scale (near/mid/far layers, atmospheric perspective fading
into the dark at the bottom of the frame). The lower ~40% of the frame should read comfortably
dark/uncluttered (this area will have text overlaid on it), while the upper ~60% can carry the
most detail and visual interest. Cohesive with a matching icon set — same lighting angle, same
stroke weight, same glow intensity.

Scene: a submarine's equipment locker / cargo hold, rendered in the same bioluminescent
scientific-instrument style — rows of diving gear silhouettes (helmets, tanks, coiled cables,
crates) racked along the walls, soft cyan instrument-panel glow reflecting off metal surfaces,
a few floating motes of light. No jellyfish or creatures — this is a man-made interior space,
not open water. Accent color: cyan #4fd6e8. Mood: orderly, functional, quietly technical —
a calm workspace between dives.
```

## 3. スキルツリー画面の背景 → `skilltree.webp`

```
A single full-bleed background illustration for a deep-sea exploration roguelike, portrait
orientation (3:4 aspect ratio), no text, no UI, no border, no vignette frame, no watermark.
Style: bioluminescent scientific-instrument aesthetic — like a sonar readout crossed with a
naturalist's ink field-guide plate, rendered as an immersive environment rather than a single
centered subject. Limited shared palette: abyssal navy #030711 base, glowing biolume cyan
#4fd6e8, soft violet #c58cff, warning amber #ffd27f, bone off-white #dff0f6, plus one accent
color specified below. Fine 1.5px linework on foreground details, faint concentric sonar-ring
texture drifting in the water, very subtle CRT scanline texture, soft volumetric light shafts
from above. Sense of real depth and scale (near/mid/far layers, atmospheric perspective fading
into the dark at the bottom of the frame). The lower ~40% of the frame should read comfortably
dark/uncluttered (this area will have text overlaid on it), while the upper ~60% can carry the
most detail and visual interest. Cohesive with a matching icon set — same lighting angle, same
stroke weight, same glow intensity.

Scene: an abstract constellation of glowing nodes and connecting threads suspended in deep
water, evoking a neural network or star chart rather than a literal place — soft cyan and
violet nodes of varying size linked by thin glowing lines, faint concentric sonar-ring texture
behind them, generous dark negative space between clusters. Accent colors: cyan #4fd6e8 and
violet #c58cff mixed. Mood: contemplative, systemic, "mapping what the crew has learned" —
distinct from the literal underwater scenes used elsewhere.
```

---

## 実装状況(参考)

- コード側の対応は完了しています(`web/src/StillDepths.jsx`)。`src/assets/bg/` に上記ファイル名
  で置くだけで、ビルドし直せば自動的に反映されます(コードの追加変更は不要)。
- 装備・収納 / スキルツリー画面は、専用画像が無い間は今まで通りの紺色の地色のままなので、
  一部だけ先に生成して試すのも問題ありません。
