#!/usr/bin/env python3
"""Generate channel logo files from brand/brand.json (no design software needed).

  python3 tools/logo.py                                  (brand/)
  python3 tools/logo.py --brand channels/<id>/brand      (a channel's brand folder)

Writes into the brand folder:
  logo.png               1024x1024 transparent mark (used by the video watermark + outro)
  logo-wordmark.png      1600x440 transparent mark + channel name
  youtube-profile.png    800x800 profile picture (solid background, circle-safe)
  youtube-watermark.png  150x150 for YouTube Studio > Customization > Branding > Video watermark
  youtube-banner.png     2560x1440 channel banner (text inside the 1546x423 safe area)

Colours come from brand.json -> logo {ink, accent, accent_dark, highlight, background}.
mark = "wallet" draws a wallet mark; any other value draws an initials badge.
"""
import json
import sys
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "brand"
if "--brand" in sys.argv:  # python3 tools/logo.py --brand channels/<id>/brand
    BRAND = Path(sys.argv[sys.argv.index("--brand") + 1]).resolve()


def font_css():
    f = ROOT / "assets" / "fonts"
    return "".join(
        f"@font-face{{font-family:'{n}';src:url('{(f / file).as_uri()}');font-weight:300 800}}"
        for n, file in (("Space Grotesk", "SpaceGrotesk.ttf"), ("Caveat", "Caveat.ttf"), ("Fredoka", "Fredoka.ttf"))
    )


def mark_svg(b, L, outline=True):
    """Mark in a 512x512 box."""
    ink, acc, dark, hi = L["ink"], L["accent"], L["accent_dark"], L["highlight"]
    halo = '<filter id="halo" x="-20%" y="-20%" width="140%" height="140%"><feMorphology in="SourceAlpha" operator="dilate" radius="14" result="d"/><feFlood flood-color="#fff"/><feComposite in2="d" operator="in" result="w"/><feMerge><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
    if L.get("mark", "wallet") != "wallet":
        body = (f'<circle cx="256" cy="256" r="200" fill="{acc}" stroke="{ink}" stroke-width="22"/>'
                f'<text x="256" y="262" text-anchor="middle" dominant-baseline="middle" font-family="Space Grotesk" font-weight="700" font-size="190" fill="{ink}">{b.get("initials", "")}</text>')
    else:
        body = f"""
  <g transform="rotate(-6 256 270)">
    <rect x="150" y="96" width="210" height="130" rx="14" fill="{hi}" stroke="{ink}" stroke-width="18" transform="rotate(-10 255 160)"/>
    <path d="M196 150 h90" stroke="{ink}" stroke-width="14" stroke-linecap="round" transform="rotate(-10 255 160)"/>
    <rect x="70" y="160" width="372" height="262" rx="54" fill="{acc}" stroke="{ink}" stroke-width="22"/>
    <path d="M110 214 Q256 196 402 214" stroke="{ink}" stroke-width="12" stroke-linecap="round" fill="none" opacity=".35"/>
    <rect x="300" y="244" width="168" height="112" rx="34" fill="{dark}" stroke="{ink}" stroke-width="22"/>
    <path d="M378 264 C396 290 410 304 410 320 A32 32 0 0 1 346 320 C346 304 360 290 378 264 Z" fill="{ink}"/>
    <ellipse cx="366" cy="318" rx="6" ry="10" fill="#fff" opacity=".8"/>
  </g>
  """
        dots = "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{ink}" {"stroke=\"#fff\" stroke-width=\"10\" paint-order=\"stroke\"" if outline else ""}/>'
                       for x, y, r in ((92, 452, 16), (132, 474, 9), (62, 410, 7)))
        return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%"><defs>{halo}</defs><g {"filter=\"url(#halo)\"" if outline else ""}>{body}</g>{dots}</svg>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%"><defs>{halo}</defs><g {"filter=\"url(#halo)\"" if outline else ""}>{body}</g></svg>'


def page(inner, W, H, bg="transparent"):
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{font_css()}
html,body{{margin:0;width:{W}px;height:{H}px;background:{bg};overflow:hidden}}
.wm{{font-family:'Space Grotesk';font-weight:700;letter-spacing:-0.02em}}</style></head><body>{inner}</body></html>"""


def render(html, out, W, H):
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(html)
        tmp = f.name
    subprocess.run(["node", str(ROOT / "engine" / "renderer.mjs"), "png", tmp, str(out), str(W), str(H)], check=True)
    Path(tmp).unlink()
    print("wrote", out)


def wordmark_svg(b, L, W, H, mark_px):
    name = b.get("channel", "")
    split = L.get("split", 3)
    a, c = name[:split], name[split:]
    halo = 'paint-order="stroke" stroke="#fff" stroke-width="22" stroke-linejoin="round"'
    return (f'<div style="display:flex;align-items:center;gap:{mark_px * 0.08}px;width:{W}px;height:{H}px;justify-content:center">'
            f'<div style="width:{mark_px}px;height:{mark_px}px">{mark_svg(b, L)}</div>'
            f'<svg height="{mark_px * 0.62}" viewBox="0 0 {len(name) * 120} 200" style="overflow:visible"><text class="wm" x="0" y="150" font-size="200" {halo}>'
            f'<tspan fill="{L["ink"]}">{a}</tspan><tspan fill="{L["accent_dark"]}">{c}</tspan></text></svg></div>')


def main():
    b = json.loads((BRAND / "brand.json").read_text(encoding="utf-8"))
    L = {"mark": "wallet", "ink": "#141414", "accent": b.get("color", "#19C37D"), "accent_dark": "#0E8F57",
         "highlight": "#FFE45C", "background": "#F6F1E7", "split": 3}
    L.update(b.get("logo", {}))
    render(page(mark_svg(b, L), 1024, 1024), BRAND / "logo.png", 1024, 1024)
    render(page(wordmark_svg(b, L, 1600, 440, 360), 1600, 440), BRAND / "logo-wordmark.png", 1600, 440)
    render(page(f'<div style="width:800px;height:800px;display:flex;align-items:center;justify-content:center"><div style="width:560px;height:560px">{mark_svg(b, L, False)}</div></div>', 800, 800, L["background"]),
           BRAND / "youtube-profile.png", 800, 800)
    render(page(mark_svg(b, L), 150, 150), BRAND / "youtube-watermark.png", 150, 150)
    tag = b.get("tagline", "")
    dots = "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{L["ink"]}" opacity=".12"/>' for x, y, r in [(300, 300, 40), (2200, 1150, 60), (2350, 260, 24), (180, 1120, 18), (1300, 1300, 30)])
    banner = (f'<div style="position:relative;width:2560px;height:1440px">'
              f'<svg width="2560" height="1440" style="position:absolute;inset:0">{dots}<path d="M0 1240 Q640 1180 1280 1240 T2560 1230 V1440 H0 Z" fill="{L["accent"]}" opacity=".18"/></svg>'
              f'<div style="position:absolute;left:507px;top:508px;width:1546px;height:423px;display:flex;flex-direction:column;align-items:center;justify-content:center">'
              f'{wordmark_svg(b, L, 1546, 300, 260)}'
              f'<div style="font-family:Caveat;font-weight:700;font-size:78px;color:{L["ink"]};margin-top:-10px">{tag}</div></div></div>')
    render(page(banner, 2560, 1440, L["background"]), BRAND / "youtube-banner.png", 2560, 1440)


if __name__ == "__main__":
    main()
