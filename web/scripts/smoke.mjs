// happy-dom 上で StillDepths.jsx を実際にレンダーし、例外が出ないことだけを確認する軽量スモークテスト。
// ビルド不要(vite-node が JSX をその場で変換する)。`npm run smoke` で実行。
import { Window } from "happy-dom";
const w = new Window({ url: "http://localhost/" });
globalThis.window = w; globalThis.document = w.document;
globalThis.HTMLElement = w.HTMLElement;
const stubCtx = new Proxy({}, { get: () => (...a) => stubCtx });
w.HTMLCanvasElement.prototype.getContext = () => stubCtx;
globalThis.localStorage = w.localStorage; globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
w.matchMedia = globalThis.matchMedia;
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};

const React = (await import("react")).default;
const { createRoot } = await import("react-dom/client");
const mod = await import("../src/StillDepths.jsx");
const App = mod.default;

const el = document.createElement("div");
document.body.appendChild(el);
const root = createRoot(el);
let err = null;
const origErr = console.error;
console.error = (...a) => { err = a.join(" "); origErr(...a); };
root.render(React.createElement(App));
await new Promise((r) => setTimeout(r, 400));
if (err && /Warning: ReactDOM/.test(err)) err = null;
console.log("RENDER_OK textlen=", el.textContent.length);
if (err) { console.log("HAD_ERROR:", err); process.exit(1); }
process.exit(0);
