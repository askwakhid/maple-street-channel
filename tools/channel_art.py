#!/usr/bin/env python3
"""Channel art drawn with the video engine itself (the cast in the channel's character style).

  python3 tools/channel_art.py                              (brand/)
  python3 tools/channel_art.py --brand channels/<id>/brand  (a channel's brand folder)

Writes into the brand folder (run tools/logo.py first for logo.png and the watermark):
  youtube-banner.png   2560x1440, title and cast inside the 1546x423 safe area (visible on phones)
  youtube-profile.png  800x800, the main character's face (YouTube crops it to a circle)
  cast-lineup.png      1920x1080, the whole cast on the street (channel trailer, community posts)
Needs brand.json voice.cast (with looks); the first cast member that is not the narrator is the face.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import logo  # noqa: E402  (shares the page/render helpers and --brand handling)

ROOT, BRAND = logo.ROOT, logo.BRAND

JS = r"""
const B = __BRAND__, TH = __THEME__, KIND = __KIND__, W = __W__, H = __H__;
E.theme = TH; E.brand = B; E.fmt = 'long'; E.cues = { words: [], chunks: [] }; E.data = {};
const cast = Object.entries((B.voice || {}).cast || {}).filter(([, c]) => !c.default).map(([k]) => k);
const moods = ['happy', 'smile', 'excited', 'love', 'laugh', 'smug', 'happy', 'smile'];
const poses = ['wave', 'idle', 'cheer', 'present', 'thumbsup', 'idle', 'wave', 'present'];
const acc = (B.logo || {}).accent_dark || B.color, ink = TH.ink;
let s = `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${TH.sky[0]}"/><stop offset="1" stop-color="${TH.sky[1]}"/></linearGradient>`;
s += E.rect(0, 0, W, H, 0, 'url(#bg)');
const houses = (gy, k) => {
  let o = '';
  const cols = ['#F4A7B9', '#A7D8F4', '#F9D58B', '#B9E4C9', '#D3B8F4', '#FFC6A5'];
  for (let i = 0, x = -60; x < W + 200; i++, x += 300 * k) {
    const h = (230 + 90 * E.hash(i + 5)) * k, c = cols[i % cols.length];
    o += E.rect(x, gy - h, 250 * k, h, 18 * k, c, 'opacity=".55"') + E.path(`M${x - 18 * k} ${gy - h} L${x + 125 * k} ${gy - h - 120 * k} L${x + 268 * k} ${gy - h} Z`, c, 'opacity=".7"');
    o += E.rect(x + 95 * k, gy - 110 * k, 60 * k, 110 * k, 10 * k, '#FFFFFF', 'opacity=".6"');
  }
  return o + E.rect(0, gy, W, H - gy, 0, TH.floor || '#EDD3B4');
};
const person = (who, x, gy, sc, i) => E.at(x, gy, sc, 0, window.sam({ who, t: 1.3 + i * 0.37, abs: 0, mood: moods[i % 8], pose: poses[i % 8], look: x < W / 2 ? 1 : -1 }));
if (KIND === 'banner') {
  const gy = 925;
  s += houses(gy, 0.8);
  const x0 = 507, sw = 1546, n = cast.length;
  cast.forEach((who, i) => {
    const x = n < 2 ? W / 2 : i < n / 2 ? x0 + 80 + i * 132 : x0 + sw - 80 - (n - 1 - i) * 132;
    s += person(who, x, gy, 0.36 * ((E.castLook(who) || {}).scale || 1), i);
  });
  const name = B.channel || '', cut = name.lastIndexOf(' ');
  s += `<text x="${W / 2}" y="610" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="104" paint-order="stroke" stroke="#fff" stroke-width="18" stroke-linejoin="round"><tspan fill="${ink}">${E.esc(name.slice(0, cut + 1))}</tspan><tspan fill="${acc}">${E.esc(name.slice(cut + 1))}</tspan></text>`;
  s += `<text x="${W / 2}" y="680" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="64" fill="${ink}">${E.esc(B.tagline || '')}</text>`;
} else if (KIND === 'profile') {
  s += E.rect(0, 0, W, H, 0, B.color) + E.circ(400, 400, 330, '#FFFFFF', 'opacity=".22"');
  s += person(cast[0], 400, 1060, 1.75, 0);
} else {
  const gy = 900;
  s += houses(gy, 1);
  cast.forEach((who, i) => (s += person(who, 150 + i * ((W - 300) / Math.max(1, cast.length - 1)), gy, 0.6 * ((E.castLook(who) || {}).scale || 1), i)));
  s += E.text(B.channel || '', W / 2, 150, 96, ink, { weight: 700 });
}
document.body.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>`;
"""


def art(kind, W, H, out):
    b = json.loads((BRAND / "brand.json").read_text(encoding="utf-8"))
    th = json.loads((ROOT / "themes" / f'{b.get("theme", "maple")}.json').read_text(encoding="utf-8"))
    th.setdefault("font", "Fredoka")
    eng = ROOT / "engine"
    scripts = "".join(f'<script src="{(eng / f).as_uri()}"></script>' for f in ("engine.js", "icons.js", "sam.js", "chibi.js"))
    js = (JS.replace("__BRAND__", json.dumps(b)).replace("__THEME__", json.dumps(th)).replace("__KIND__", json.dumps(kind))
          .replace("__W__", str(W)).replace("__H__", str(H)))
    logo.render(logo.page(scripts + f"<script>{js}</script>", W, H), BRAND / out, W, H)


def main():
    art("banner", 2560, 1440, "youtube-banner.png")
    art("profile", 800, 800, "youtube-profile.png")
    art("lineup", 1920, 1080, "cast-lineup.png")


if __name__ == "__main__":
    main()
