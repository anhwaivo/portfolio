// Switches to song 2 and reports the media element's full error/readiness
// state plus any play() rejection, then tries to play it directly.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const SITE = process.argv[2] || "http://127.0.0.1:8810";
const PORT = 9713;
const profile = mkdtempSync(join(tmpdir(), "cdp-a2-"));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--autoplay-policy=user-gesture-required",
  "--window-size=1280,1400", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error("HARD TIMEOUT"); try { chrome.kill(); } catch {} process.exit(2); }, 150000);

async function main() {
  let target = null;
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) { target = (await r.json()).webSocketDebuggerUrl; break; } } catch {}
    await sleep(250);
  }
  const ws = new WebSocket(target, { maxPayload: 1 << 28 });
  await new Promise((res, rej) => { ws.on("open", res); ws.on("error", rej); });
  let id = 0; const pending = new Map(); const errs = []; const logs = [];
  ws.on("message", (raw) => {
    const m = JSON.parse(raw);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") errs.push(m.params.exceptionDetails.text);
    if (m.method === "Log.entryAdded") logs.push(m.params.entry.level + ": " + m.params.entry.text);
  });
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const n = ++id; pending.set(n, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result)));
    ws.send(JSON.stringify({ id: n, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const S = (m, p) => send(m, p, sessionId);
  await S("Page.enable"); await S("Runtime.enable"); await S("Log.enable");
  await S("Emulation.setDeviceMetricsOverride", { width: 1280, height: 1400, deviceScaleFactor: 1, mobile: false });
  await S("Page.navigate", { url: SITE + "/" });
  await sleep(4000);
  const ev = async (e) => {
    const r = await S("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true });
    return r.exceptionDetails ? "EXC " + (r.exceptionDetails.exception?.description || "").slice(0, 300) : r.result.value;
  };
  const pt = JSON.parse(await ev(`(function(){var s=document.getElementById('bio-splash');var r=s.getBoundingClientRect();return JSON.stringify({x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)})})()`));
  for (const type of ["mousePressed", "mouseReleased"]) { await S("Input.dispatchMouseEvent", { type, x: pt.x, y: pt.y, button: "left", clickCount: 1 }); await sleep(150); }
  await sleep(1500);

  // canPlayType support check
  console.log("=== canPlayType ===");
  console.log(await ev(`(function(){var a=document.createElement('audio');
    return JSON.stringify({
      'audio/webm; codecs=opus': a.canPlayType('audio/webm; codecs=opus'),
      'audio/webm': a.canPlayType('audio/webm'),
      'video/webm; codecs=opus': a.canPlayType('video/webm; codecs=opus'),
      'video/webm': a.canPlayType('video/webm'),
      'audio/ogg; codecs=vorbis': a.canPlayType('audio/ogg; codecs=vorbis')})})()`));

  console.log("\n=== switch to song 2 via the dropdown ===");
  await ev(`document.querySelector('.music-list-toggle').click(); true`);
  await sleep(400);
  await ev(`document.querySelectorAll('.music-list-item')[1].click(); true`);
  await sleep(4000);

  console.log(await ev(`(function(){var a=document.querySelector('.music-audio');
    return JSON.stringify({src:(a.currentSrc||'').split('/').pop().slice(0,40), paused:a.paused, loop:a.loop,
      readyState:a.readyState, networkState:a.networkState, duration:a.duration, currentTime:a.currentTime,
      error: a.error ? {code:a.error.code, message:a.error.message} : null,
      toggle:document.querySelector('.music-toggle').getAttribute('aria-pressed'),
      cur:document.querySelector('.current-time').textContent,
      tot:document.querySelector('.total-time').textContent})})()`));

  console.log("\n=== READYSTATE legend: 0=HAVE_NOTHING 1=METADATA 2=CURRENT_DATA 3=FUTURE_DATA 4=ENOUGH_DATA ===");
  console.log("=== NETWORKSTATE: 0=EMPTY 1=IDLE 2=LOADING 3=NO_SOURCE ===");
  console.log("=== ERROR codes: 1=ABORTED 2=NETWORK 3=DECODE 4=SRC_NOT_SUPPORTED ===");

  console.log("\n=== try play() directly and report the rejection ===");
  console.log(await ev(`(async function(){var a=document.querySelector('.music-audio');
    try { await a.play(); return JSON.stringify({ok:true, paused:a.paused, t:a.currentTime}); }
    catch(e){ return 'play rejected: ' + e.name + ': ' + e.message; }})()`));

  console.log("\n=== wait 3s and see if position advances ===");
  await sleep(3000);
  console.log(await ev(`(function(){var a=document.querySelector('.music-audio');
    return JSON.stringify({paused:a.paused, currentTime:+a.currentTime.toFixed(2), readyState:a.readyState,
      error: a.error ? {code:a.error.code, message:a.error.message} : null})})()`));

  console.log("\n=== console/log entries ===");
  console.log(logs.length ? logs.join("\n") : "none");
  console.log("\npage errors:", errs.length ? errs.join(" | ") : "none");
  ws.close(); chrome.kill(); process.exit(0);
}
main().catch((e) => { console.error("FAILED:", e.message); try { chrome.kill(); } catch {} process.exit(1); });
