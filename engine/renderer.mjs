// Zero-dependency frame renderer: drives an installed Chrome/Edge/Chromium over the
// DevTools protocol (Node 22+ built-in WebSocket) and pipes JPEG frames into ffmpeg.
//
//   node renderer.mjs video  <data.js> <out.mp4> <fromFrame> <toFrame>
//   node renderer.mjs stills <data.js> <outDir> <t1,t2,...>
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

function findChrome() {
  if (process.env.PF_CHROME && fs.existsSync(process.env.PF_CHROME)) return process.env.PF_CHROME;
  const home = os.homedir();
  const c = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium', '/usr/bin/microsoft-edge',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(home, 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const p of c) if (fs.existsSync(p)) return p;
  // Playwright-managed Chromium, if any
  for (const base of ['/opt/pw-browsers', path.join(home, 'Library/Caches/ms-playwright'), path.join(home, '.cache/ms-playwright'), path.join(home, 'AppData/Local/ms-playwright')]) {
    if (!fs.existsSync(base)) continue;
    for (const d of fs.readdirSync(base).filter((d) => d.startsWith('chromium-')).sort().reverse()) {
      for (const sub of ['chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium', 'chrome-linux/chrome', 'chrome-win/chrome.exe']) {
        const p = path.join(base, d, sub);
        if (fs.existsSync(p)) return p;
      }
    }
  }
  throw new Error('Chrome/Edge/Chromium not found. Install Google Chrome or set PF_CHROME=/path/to/chrome');
}

async function launch(W, H) {
  // PF_SCALE > 1 renders sharper frames (e.g. 1.3333 -> 1440x2560 from the 1080x1920 layout)
  const scale = parseFloat(process.env.PF_SCALE || '1') || 1;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pf-chrome-'));
  const proc = spawn(findChrome(), [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--allow-file-access-from-files',
    '--hide-scrollbars', '--mute-audio', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    `--force-device-scale-factor=${scale}`, `--window-size=${W},${H}`, '--force-color-profile=srgb', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((res, rej) => {
    let buf = '';
    const to = setTimeout(() => rej(new Error('Chrome did not start')), 30000);
    proc.stderr.on('data', (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(to); res(m[1]); }
    });
    proc.on('exit', (code) => rej(new Error('Chrome exited ' + code + '\n' + buf)));
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? rej(new Error(m.error.message)) : res(m.result);
    } else if (m.method) listeners.forEach((l) => l(m));
  };
  const send = (method, params = {}, sessionId) =>
    new Promise((res, rej) => {
      const i = ++id;
      pending.set(i, { res, rej });
      ws.send(JSON.stringify({ id: i, method, params, sessionId }));
    });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => send(m, p, sessionId);
  await s('Page.enable');
  await s('Runtime.enable');
  await s('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: scale, mobile: false });
  const close = () => { try { ws.close(); } catch {} proc.kill('SIGKILL'); try { fs.rmSync(dir, { recursive: true, force: true }); } catch {} };
  return { s, close, listeners };
}

async function openPage(dataPath) {
  const src = fs.readFileSync(dataPath, 'utf8');
  const m = src.match(/"W":\s*(\d+).*?"H":\s*(\d+)/s);
  const W = +m[1], H = +m[2];
  const b = await launch(W, H);
  const url = pathToFileURL(path.join(here, 'render.html')).href + '?data=' + encodeURIComponent(pathToFileURL(path.resolve(dataPath)).href);
  const loaded = new Promise((res) => b.listeners.push((m) => m.method === 'Page.loadEventFired' && res()));
  await b.s('Page.navigate', { url });
  await loaded;
  const wait = `new Promise((res, rej) => { const t0 = Date.now(); (function poll() {
    if (location.href.startsWith('file:') && window.__ready) window.__ready.then(res, (e) => rej(String(e)));
    else if (Date.now() - t0 > 30000) rej('render.html did not load');
    else setTimeout(poll, 50); })(); })`;
  const r = await b.s('Runtime.evaluate', { expression: wait, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error('page init failed: ' + JSON.stringify(r.exceptionDetails).slice(0, 500));
  return { b, W, H };
}

async function shot(b, F, q = 90) {
  const r = await b.s('Runtime.evaluate', { expression: `renderFrame(${F})`, returnByValue: true });
  if (r.exceptionDetails) throw new Error(`frame ${F}: ` + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  const { data } = await b.s('Page.captureScreenshot', { format: 'jpeg', quality: q, optimizeForSpeed: true });
  return Buffer.from(data, 'base64');
}

const [mode, dataPath, out, a, z] = process.argv.slice(2);
const fps = 30;
if (mode === 'stills') {
  const { b } = await openPage(dataPath);
  fs.mkdirSync(out, { recursive: true });
  const times = a.split(',').map(Number);
  for (const [i, t] of times.entries()) fs.writeFileSync(path.join(out, `s_${String(i).padStart(3, '0')}.jpg`), await shot(b, Math.round(t * fps), 88));
  b.close();
} else if (mode === 'video') {
  const from = +a, to = +z;
  const { b } = await openPage(dataPath);
  // Each part is encoded once, already with the paper texture, so pf.py only has to join the parts and add audio.
  // PF_* settings come from pf.py (CPU mode); defaults keep the old behaviour without texture.
  const env = process.env;
  const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-'];
  if (env.PF_OVERLAY) {
    args.push('-loop', '1', '-i', env.PF_OVERLAY, '-filter_complex',
      `[0:v]format=gbrp[a];[1:v]format=gbrp[b];[a][b]blend=all_mode=multiply:all_opacity=${env.PF_GRAIN || 0.35}:shortest=1,format=yuv420p[v]`,
      '-map', '[v]');
  }
  if (env.PF_FF_THREADS && env.PF_FF_THREADS !== '0') args.splice(1, 0, '-filter_threads', env.PF_FF_THREADS);
  args.push('-c:v', 'libx264', '-preset', env.PF_X264_PRESET || 'veryfast', '-crf', env.PF_CRF || '15', '-threads', env.PF_FF_THREADS || '0',
    '-pix_fmt', 'yuv420p', '-r', String(fps), out);
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let F = from; F < to; F++) {
    const buf = await shot(b, F, 93);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((F - from) % 150 === 0) console.log(`[${path.basename(out)}] frame ${F - from}/${to - from} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  b.close();
  console.log(`[${path.basename(out)}] done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
} else if (mode === 'which') {
  console.log(findChrome());
} else if (mode === 'png') {
  // node renderer.mjs png <page.html> <out.png> <W> <H>   (transparent background)
  const W = +a, H = +z;
  const b = await launch(W, H);
  await b.s('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  const loaded = new Promise((res) => b.listeners.push((m) => m.method === 'Page.loadEventFired' && res()));
  await b.s('Page.navigate', { url: pathToFileURL(path.resolve(dataPath)).href });
  await loaded;
  await b.s('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => true)', awaitPromise: true });
  const { data } = await b.s('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(out, Buffer.from(data, 'base64'));
  b.close();
} else {
  console.error('usage: node renderer.mjs video|stills|png ...');
  process.exit(2);
}
process.exit(0);
