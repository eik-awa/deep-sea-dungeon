// vitest(happy-dom環境)向けの共通セットアップ。
// StillDepths.jsx が使う canvas 2D コンテキスト・requestAnimationFrame・matchMedia を
// happy-dom には無い/不完全なぶんだけスタブする(scripts/smoke.mjs と同じ方針)。
const stubCtx = new Proxy({}, { get: () => (..._a) => stubCtx });
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = () => stubCtx;
}
if (typeof window !== "undefined") {
  window.matchMedia = window.matchMedia || (() => ({
    matches: false, addEventListener() {}, removeEventListener() {},
  }));
  window.requestAnimationFrame = window.requestAnimationFrame || (() => 0);
  window.cancelAnimationFrame = window.cancelAnimationFrame || (() => {});

  // vitest の happy-dom 環境が用意する window.localStorage は getItem/setItem 等を
  // 持たない空オブジェクトのことがあるため、簡易ポリフィルで確実に動く実装に差し替える。
  // StillDepths.jsx は素の `localStorage`(グローバル)を参照するので両方に設定する。
  const hasWorkingStorage = window.localStorage && typeof window.localStorage.setItem === "function";
  if (!hasWorkingStorage) {
    const store = new Map();
    const polyfill = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(k, String(v)); },
      removeItem: (k) => { store.delete(k); },
      clear: () => { store.clear(); },
      key: (i) => Array.from(store.keys())[i] ?? null,
      get length() { return store.size; },
    };
    window.localStorage = polyfill;
  }
  globalThis.localStorage = window.localStorage;
}
