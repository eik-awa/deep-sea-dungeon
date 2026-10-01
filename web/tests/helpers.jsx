// StillDepths.jsx を happy-dom 上で実際に render し、実際のクリックで
// 状態不整合の回帰(複製・取りこぼし・一括ロスト)を検出するための共通ヘルパー。
import React from "react";
import { createRoot } from "react-dom/client";
import StillDepths from "../src/StillDepths.jsx";

export const SAVE_KEY = "deep-sea-dungeon-save-v1";
export const GAME_KEY = "deep-sea-dungeon-game-v1";

// meta は DEFAULT_META とマージされるので、テストに関係あるフィールドだけ渡せば良い。
// game(中断セーブ)は resume 時に丸ごと {...saved, ...} で復元されるため、
// StillDepths.jsx が参照しうるフィールドを一通り含めておく必要がある。
export function baseGame(overrides = {}) {
  return {
    screen: "dive", depth: 5, node: 0, nodes: ["wreck"], phase: "wreck",
    crew: [null, null, null], relics: [], bag: [], enemies: [],
    turnIdx: 0, aiming: null, pendingSkill: false, busy: false,
    logs: [], floats: [], drops: [], hitId: null, guardTurns: 0,
    confirm: null, full: false, bagOpen: false, eventDone: true, recruit: null,
    reviveUsed: false, scrapCount: 0, coach: false,
    ...overrides,
  };
}

export function makeCrewFixture(overrides = {}) {
  return {
    id: "crew-1", kind: "crew", type: "diver", name: "テスト潜兵",
    rarity: "std", asset: "diver_shallow", band: "shallow",
    maxHp: 100, hp: 50, baseMaxHp: 100, atk: 10,
    gear: null, weapon: null, cd: 0, buffAtk: 0, guard: 0, down: false,
    ...overrides,
  };
}

export function makeGearFixture(overrides = {}) {
  return {
    id: "gear-1", kind: "gear", slot: "suit", band: "shallow",
    name: "テスト耐圧服", rarity: "std", asset: "suit_shallow_1",
    hp: 20, atk: 0, def: 2,
    ...overrides,
  };
}

export function flush(ms = 30) {
  return new Promise((r) => setTimeout(r, ms));
}

export function click(el) {
  if (!el) throw new Error("click(): element not found");
  el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
}

// 同じボタンを間に await を挟まず2連打する(多重タップの複製/取りこぼしを検出する)。
export function doubleClickRace(el) {
  if (!el) throw new Error("doubleClickRace(): element not found");
  el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
}

// 異なる2つの要素を間に await を挟まず連続でクリックする(2つの別アクションが同じ
// 古いスナップショットを見て、片方が後勝ちで消える/両方適用されるクロスアクションの
// 競合を検出する)。
export function raceClicks(elA, elB) {
  if (!elA) throw new Error("raceClicks(): first element not found");
  if (!elB) throw new Error("raceClicks(): second element not found");
  elA.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  elB.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
}

// テキストを含む要素を全て探す(同名の複数セルから個別の要素を選びたい時に使う)。
export function allByContainsText(container, text, selector = "*") {
  return Array.from(container.querySelectorAll(selector)).filter((el) => el.textContent.includes(text));
}

// テキストが完全一致する要素(主にボタン)を探す
export function byExactText(container, text, selector = "button") {
  for (const el of container.querySelectorAll(selector)) {
    if (el.textContent.trim() === text) return el;
  }
  return null;
}

// テキストを含む要素を探す(名前+説明文などが混在するカード/行向け)
export function byContainsText(container, text, selector = "*") {
  for (const el of container.querySelectorAll(selector)) {
    if (el.textContent.includes(text)) return el;
  }
  return null;
}

// aria-label が完全一致する要素を探す(スキルツリーの円環ノードのように、見た目上は
// アイコンのみでテキストを持たない要素向け。名称は aria-label に入っている)。
export function byAriaLabel(container, text, selector = "*") {
  for (const el of container.querySelectorAll(selector)) {
    if (el.getAttribute("aria-label") === text) return el;
  }
  return null;
}

// skipResume: true にすると、中断データがあってもタイトル画面のまま返す
// (「続きから再開」ボタン自体や、起動直後は必ずタイトルから始まる、という挙動を
// 検証したいテスト用)。省略時(false)は従来通り自動で再開してdive画面まで進める。
export async function renderGame({ meta, game, skipResume = false } = {}) {
  // happy-dom の localStorage 実装によっては clear() が無いことがあるため、
  // 本テストが使う2キーだけを個別に削除する。
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(GAME_KEY);
  if (meta) localStorage.setItem(SAVE_KEY, JSON.stringify(meta));
  if (game) localStorage.setItem(GAME_KEY, JSON.stringify(game));
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(React.createElement(StillDepths));
  await flush(80);
  if (!skipResume) {
    // 中断データがあればタイトルに「続きから再開」ボタンが出るので、あれば押しておく
    const resumeBtn = byExactText(container, "続きから再開");
    if (resumeBtn) { click(resumeBtn); await flush(); }
  }
  return { container, root };
}

export function readGame() {
  const s = localStorage.getItem(GAME_KEY);
  return s ? JSON.parse(s) : null;
}

export function readMeta() {
  const s = localStorage.getItem(SAVE_KEY);
  return s ? JSON.parse(s) : null;
}
