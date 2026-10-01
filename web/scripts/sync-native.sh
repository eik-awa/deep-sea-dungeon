#!/bin/bash
# ビルド済みの web/dist を depth-dungeon の WebApp(フォルダ参照)へ同期する。
# 古いハッシュ付きファイルが残らないよう assets を一度空にしてからコピーし、
# 最後に取りこぼし(dist にあるのに WebApp に無いファイル)が無いか確認する。
set -e
cd "$(dirname "$0")/.."

WEBAPP="../depth-dungeon/depth-dungeon/WebApp"

rm -f "$WEBAPP"/assets/*.{webp,js,css,woff,woff2} 2>/dev/null || true
cp -R dist/assets/. "$WEBAPP/assets/"
cp dist/index.html "$WEBAPP/index.html"

stale=$(comm -23 <(ls "$WEBAPP/assets" | sort) <(ls dist/assets | sort))
if [ -n "$stale" ]; then
  echo "取りこぼし(dist にあるのに WebApp に無い)があります:"
  echo "$stale"
  exit 1
fi
echo "sync OK — 取りこぼしなし"
