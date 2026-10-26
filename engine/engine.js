// PaperFold engine: every frame is a pure function of frame number F.
// Do not edit per video. Videos are described only by storyboard.json.
(function () {
  const E = (window.E = {});
  const clamp = (E.clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)));
  const lerp = (E.lerp = (a, b, t) => a + (b - a) * t);
  const ease = (E.ease = {
    out: (t) => 1 - Math.pow(1 - t, 3),
    in: (t) => t * t * t,
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    back: (t) => {
      const c1 = 1.9, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
  });
  E.prog = (t, t0, d) => clamp((t - t0) / d);
  // pop-in scale, 0 before t0
  E.pop = (t, t0, d = 0.45) => {
    const p = E.prog(t, t0, d);
    return p <= 0 ? 0 : ease.back(p);
  };
  E.fade = (t, t0, d = 0.3) => ease.out(E.prog(t, t0, d));
  // pop with squash & stretch: [sx, sy]; wide-and-short first, then tall, then settles
  E.popSS = (t, t0, d = 0.5) => {
    const p = E.prog(t, t0, d);
    if (p <= 0) return [0, 0];
    const s = ease.back(p);
    const k = Math.sin(Math.PI * Math.min(1, p * 1.4)) * (1 - p) * 0.35;
    return [s * (1 + k), s * (1 - k * 0.8)];
  };
  E.atXY = (x, y, sx, sy, r, inner) =>
    sx <= 0.01 || sy <= 0.01 ? '' : `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})${r ? ` rotate(${r.toFixed(2)})` : ''} scale(${sx.toFixed(3)} ${sy.toFixed(3)})">${inner}</g>`;
  // voice loudness at absolute time t (0..1), from cues.amp (one value per frame)
  E.amp = (t) => {
    const a = E.cues.amp;
    if (!a || !a.length) return E.speaking(t) ? 0.5 + 0.5 * Math.abs(Math.sin(t * 21)) : 0;
    const f = t * E.fps, i = Math.floor(f), u = f - i;
    const v0 = a[Math.min(a.length - 1, Math.max(0, i))] || 0, v1 = a[Math.min(a.length - 1, i + 1)] || 0;
    return v0 + (v1 - v0) * u;
  };
  E.hash = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  // stop-motion wobble: changes 10 times per second
  E.wob = (seed, amt) => {
    const step = Math.floor((E.F * 10) / E.fps);
    return (E.hash(seed * 13.7 + step * 3.1) - 0.5) * 2 * amt;
  };
  E.esc = (s) =>
    String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  // ---------- primitives ----------
  E.at = (x, y, s, r, inner) => {
    if (s !== undefined && s <= 0.01) return '';
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})${r ? ` rotate(${r.toFixed(2)})` : ''}${
      s !== undefined && s !== 1 ? ` scale(${s.toFixed(3)})` : ''
    }">${inner}</g>`;
  };
  E.op = (o, inner) => (o <= 0.01 ? '' : o >= 0.99 ? inner : `<g opacity="${o.toFixed(3)}">${inner}</g>`);
  E.circ = (x, y, r, fill, extra = '') => (r > 0.3 ? `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>` : '');
  E.ell = (x, y, rx, ry, fill, extra = '') =>
    rx > 0.3 && ry > 0.3 ? `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>` : '';
  E.rect = (x, y, w, h, r, fill, extra = '') =>
    w > 0.3 && h > 0.3 ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>` : '';
  E.path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
  E.line = (d, color, w, extra = '') =>
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  // sticker = die-cut white border + soft shadow (signature look)
  E.stk = (inner) => `<g filter="url(#${E.theme.sticker ? 'stk' : 'shd'})">${inner}</g>`;
  E.shd = (inner) => `<g filter="url(#shd)">${inner}</g>`;

  // real text width using the loaded font
  let mctx = null;
  E.measure = (str, size, weight = 600) => {
    if (!mctx) mctx = document.createElement('canvas').getContext('2d');
    mctx.font = `${weight} ${size}px ${E.theme.font}, Nunito, sans-serif`;
    return mctx.measureText(str).width;
  };
  E.text = (str, x, y, size, color, o = {}) => {
    const w = o.weight || 600;
    const anchor = o.anchor || 'middle';
    return `<text x="${x}" y="${y}" font-family="${E.theme.font}, Nunito, sans-serif" font-size="${size}" font-weight="${w}" fill="${color}" text-anchor="${anchor}" dominant-baseline="middle"${
      o.ls ? ` letter-spacing="${o.ls}"` : ''
    }>${E.esc(str)}</text>`;
  };
  // greedy word wrap by character count
  E.wrap = (str, maxChars) => {
    const words = String(str || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let cur = '';
    for (const w of words) {
      if (!cur) cur = w;
      else if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
      else {
        lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  };
  // multi-line text centred on (x,y); shrinks to fit maxLines
  E.para = (str, x, y, size, color, maxChars, o = {}) => {
    let lines = E.wrap(str, maxChars);
    let s = size;
    const maxLines = o.maxLines || 3;
    if (lines.length > maxLines) {
      const k = Math.sqrt(maxLines / lines.length);
      s = size * k;
      lines = E.wrap(str, Math.round(maxChars / k));
    }
    const lh = s * (o.lh || 1.18);
    const y0 = y - ((lines.length - 1) * lh) / 2;
    return lines.map((l, i) => E.text(l, x, y0 + i * lh, s, color, o)).join('');
  };
  // washi tape strip
  E.tape = (x, y, w, rot, color) =>
    E.at(x, y, 1, rot, E.rect(-w / 2, -14, w, 28, 3, color || E.theme.tape, 'opacity=".82"') +
      E.path(`M${-w / 2} -14 l-6 7 l6 7 l-6 7 l6 7 Z M${w / 2} -14 l6 7 l-6 7 l6 7 l-6 7 Z`, color || E.theme.tape, 'opacity=".82"'));
  // paper card with tape
  E.card = (w, h, fill, o = {}) =>
    E.stk(E.rect(-w / 2, -h / 2, w, h, o.r == null ? 22 : o.r, fill)) + (o.tape === false ? '' : E.tape(0, -h / 2, Math.min(150, w * 0.4), -3));

  // handwritten annotation with a curved arrow pointing at (ax, ay)
  E.note = (txt, x, y, ax, ay, t0, T, o = {}) => {
    if (!txt) return '';
    const p = E.prog(T.t, t0, 0.45);
    if (p <= 0) return '';
    const fs = o.size || 56;
    const col = o.color || E.theme.ink;
    const mx = (x + ax) / 2 + (o.bend == null ? 60 : o.bend), my = (y + ay) / 2;
    const len = Math.hypot(ax - x, ay - y) * 1.3;
    let s = `<path d="M${x} ${y} Q${mx} ${my} ${ax} ${ay}" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(len * p).toFixed(0)} ${len.toFixed(0)}"/>`;
    if (p >= 1) {
      const ang = Math.atan2(ay - my, ax - mx);
      const h = (a) => `${(ax - 22 * Math.cos(ang + a)).toFixed(1)} ${(ay - 22 * Math.sin(ang + a)).toFixed(1)}`;
      s += `<path d="M${h(0.5)} L${ax} ${ay} L${h(-0.5)}" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    const tx = o.tx == null ? x : o.tx, ty = o.ty == null ? y - fs * 0.6 : o.ty;
    s += E.op(Math.min(1, p * 2), `<text x="${tx}" y="${ty}" font-family="${E.theme.hand || 'Caveat'}, cursive" font-size="${fs}" font-weight="700" fill="${col}" text-anchor="${o.anchor || 'middle'}" transform="rotate(${o.rot == null ? -5 : o.rot} ${tx} ${ty})">${E.esc(txt)}</text>`);
    return s;
  };
  // marker-pen highlight behind text
  E.marker = (x, y, w, h, p, col) => p <= 0 ? '' : E.path(`M${x} ${y + h * 0.12} L${x + w * p} ${y} L${x + w * p + 6} ${y + h} L${x + 4} ${y + h * 1.04} Z`, col || E.theme.d, 'style="mix-blend-mode:multiply" opacity=".9"');

  // ---------- defs ----------
  E.defs = () => (E.theme.style === 'ink' ? E.inkDefs() : E.paperDefs());
  // ink: black outline + hard offset shadow (neo-brutalist sticker)
  E.inkDefs = () => `<defs>
  <filter id="stk" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
    <feMorphology in="SourceAlpha" operator="dilate" radius="4" result="d"/>
    <feFlood flood-color="${E.theme.ink}"/><feComposite in2="d" operator="in" result="w"/>
    <feOffset in="w" dx="7" dy="7" result="sh"/>
    <feMerge><feMergeNode in="sh"/><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="shd" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
    <feFlood flood-color="${E.theme.ink}" flood-opacity=".9"/><feComposite in2="SourceAlpha" operator="in"/><feOffset dx="5" dy="5" result="o"/>
    <feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="2.2" fill="${E.theme.ink}" opacity=".12"/></pattern>
  <pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="${E.theme.c}"/><line x1="0" y1="0" x2="0" y2="14" stroke="${E.theme.ink}" stroke-width="5"/></pattern>
  </defs>`;
  E.paperDefs = () => `<defs>
  <filter id="stk" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
    <feMorphology in="SourceAlpha" operator="dilate" radius="6" result="d"/>
    <feFlood flood-color="#FFFFFF"/><feComposite in2="d" operator="in" result="w"/>
    <feGaussianBlur in="d" stdDeviation="5" result="b"/><feOffset in="b" dx="0" dy="7" result="o"/>
    <feFlood flood-color="${E.theme.shadow}" flood-opacity=".30"/><feComposite in2="o" operator="in" result="sh"/>
    <feMerge><feMergeNode in="sh"/><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="shd" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
    <feDropShadow dx="0" dy="7" stdDeviation="5" flood-color="${E.theme.shadow}" flood-opacity=".28"/>
  </filter>
  </defs>`;

  // ---------- frame layout ----------
  // Scenes draw in a logical 1000x1000 box placed in the "art area".
  E.layout = (fmt, W, H) => {
    if (fmt === 'long') {
      const art = { x: 0, y: 20, w: W, h: 880 };
      const s = art.h / 1000;
      return { art, s, ox: (W - 1000 * s) / 2, oy: art.y, capY: 985, capW: 1500, capLines: 1, capChars: 46, capSize: 50, groundY: 800 };
    }
    const art = { x: 0, y: 170, w: W, h: 1130 };
    const s = Math.min(art.w / 1000, art.h / 1000);
    return { art, s, ox: (W - 1000 * s) / 2, oy: art.y + (art.h - 1000 * s) / 2, capY: 1470, capW: 940, capLines: 2, capChars: 24, capSize: 56, groundY: 1180 };
  };

  // ---------- backgrounds (frame space) ----------
  const hillPath = (W, y, amp, n, seed, H) => {
    let d = `M0 ${H} L0 ${y}`;
    const step = W / n;
    for (let i = 0; i < n; i++) {
      const x1 = i * step, x2 = (i + 1) * step;
      const h = amp * (0.6 + 0.8 * E.hash(seed + i));
      d += ` Q${(x1 + x2) / 2} ${y - h} ${x2} ${y + (E.hash(seed + i + 50) - 0.5) * amp * 0.4}`;
    }
    return d + ` L${W} ${H} Z`;
  };
  E.cloud = (x, y, s, fill) =>
    E.at(x, y, s, 0, E.shd(E.path('M-90 30 Q-110 -10 -70 -20 Q-60 -70 -10 -60 Q20 -95 60 -60 Q105 -60 100 -15 Q125 5 100 30 Z', fill)));

  E.background = (L, t, tint) => {
    const T = E.theme, W = E.W, H = E.H, sd = E.seed;
    let o = '';
    const sky = tint && T.tints && T.tints[tint] ? T.tints[tint] : T.sky;
    o += `<linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient>`;
    o += E.rect(0, 0, W, H, 0, 'url(#skyg)');
    const gy = L.groundY;
    if (T.bg === 'pastel') {
      // soft modern look for the chibi cast: warm gradient, round bokeh, wooden floor
      for (let i = 0; i < 6; i++) {
        const x = E.hash(sd + i * 7) * W, y = E.hash(sd + i * 11) * gy * 0.8, r = 40 + 90 * E.hash(sd + i * 3);
        o += E.circ(x + Math.sin(t * 0.4 + i) * 12, y + Math.cos(t * 0.3 + i) * 8, r, '#FFFFFF', 'opacity=".35"');
      }
      o += E.rect(0, gy, W, H - gy, 0, T.floor || T.ground[0]);
      for (let i = 1; i < 4; i++) o += E.rect(0, gy + i * ((H - gy) / 4), W, 3, 0, '#000', 'opacity=".05"');
      o += E.rect(0, gy - 4, W, 10, 4, '#000', 'opacity=".08"');
      return o;
    }
    if (T.bg === 'ink') {
      o += E.rect(0, 0, W, H, 0, 'url(#dots)');
      // faint doodles that wobble like hand-drawn animation
      const marks = ['M-14 0 h28 M0 -14 v28', 'M-18 6 q9 -18 18 0 t18 0', 'M0 -16 l4 11 h12 l-10 7 l4 12 l-10 -7 l-10 7 l4 -12 l-10 -7 h12 z'];
      for (let i = 0; i < 7; i++) {
        const x = 60 + E.hash(sd + i * 13) * (W - 120), y = 60 + E.hash(sd + i * 29) * (gy - 140);
        o += E.at(x, y, 1, E.wob(i + 40, 6), E.line(marks[i % 3], T.ink, 4, 'opacity=".16"'));
      }
      let d = `M-20 ${gy}`;
      for (let i = 1; i <= 8; i++) d += ` Q${(W / 8) * (i - 0.5)} ${gy + (E.hash(sd + i) - 0.5) * 14 + E.wob(i + 60, 1.5)} ${(W / 8) * i + (i === 8 ? 20 : 0)} ${gy + (E.hash(sd + i + 9) - 0.5) * 10}`;
      o += E.line(d, T.ink, 7);
      return o;
    }
    if (T.bg === 'meadow' || T.bg === 'night') {
      if (T.bg === 'night') {
        for (let i = 0; i < 40; i++) {
          const tw = 0.5 + 0.5 * Math.sin(t * 2 + i);
          o += E.circ((E.hash(sd + i) * W).toFixed(0), (E.hash(sd + i + 99) * gy * 0.8).toFixed(0), 2 + 3 * E.hash(i + 7), '#FFF', `opacity="${(0.3 + 0.6 * tw).toFixed(2)}"`);
        }
        o += E.at(W * 0.82, gy * 0.14, 1, 0, E.shd(E.circ(0, 0, 70, '#FFF3C4') + E.circ(26, -14, 58, sky[0])));
      } else {
        o += E.at(((E.brand.watermark || {}).position || 'top-right').includes('right') ? W * (0.1 + 0.3 * E.hash(sd + 3)) : W * (0.6 + 0.3 * E.hash(sd + 3)), (E.fmt === 'shorts' ? 260 : 120) + 40 * E.hash(sd + 4), 1, (t * 8) % 360,
          E.shd(Array.from({ length: 10 }, (_, i) => E.rect(-9, -95, 18, 34, 9, T.c, `transform="rotate(${i * 36})"`)).join('') + E.circ(0, 0, 58, T.c)));
      }
      for (let i = 0; i < 4; i++) {
        const sp = 8 + 6 * E.hash(sd + i * 5);
        const x = ((E.hash(sd + i * 11) * (W + 400) + t * sp) % (W + 400)) - 200;
        o += E.cloud(x, 80 + i * (gy * 0.12) + 30 * E.hash(sd + i), 0.6 + 0.5 * E.hash(sd + i * 2), T.bg === 'night' ? '#C9D3F2' : '#FFFFFF');
      }
      o += E.shd(E.path(hillPath(W, gy - 70, 70, 4, sd + 10, H), T.ground[0]));
      o += E.shd(E.path(hillPath(W, gy, 45, 3, sd + 20, H), T.ground[1]));
      o += E.path(hillPath(W, gy + 120, 30, 5, sd + 30, H), T.ground[2]);
      for (let i = 0; i < 9; i++) {
        const x = 40 + E.hash(sd + i * 17) * (W - 80), y = gy + 40 + E.hash(sd + i * 19) * 60;
        o += E.at(x, y, 1, E.wob(i, 3), E.line('M0 0 L0 -26', T.ground[2], 5) + E.circ(0, -30, 9, [T.a, T.c, '#FFF'][i % 3]));
      }
    } else if (T.bg === 'desk' || T.bg === 'notebook') {
      // kraft desk or squared notebook
      const step = 54;
      let grid = '';
      for (let x = step / 2; x < W; x += step) grid += `M${x} 0 V${H} `;
      for (let y = step / 2; y < H; y += step) grid += `M0 ${y} H${W} `;
      o += `<path d="${grid}" stroke="${T.gridLine}" stroke-width="2" fill="none"/>`;
      if (T.bg === 'notebook') o += E.line(`M${W * 0.07} 0 V${H}`, T.a, 4, 'opacity=".45"');
      for (let i = 0; i < 6; i++) {
        const x = E.hash(sd + i * 7) * W, y = E.hash(sd + i * 9) * H;
        o += E.at(x, y, 1, E.hash(i) * 90, E.rect(-30, -12, 60, 24, 4, [T.a, T.b, T.c, T.d][i % 4], 'opacity=".22"'));
      }
      o += E.path(`M0 ${H} L0 ${gy + 60} ${Array.from({ length: 41 }, (_, i) => `L${(W / 40) * i} ${gy + 60 + (i % 2 ? 14 : 0)}`).join(' ')} L${W} ${H} Z`, T.ground[0]);
    } else {
      // pastel confetti
      for (let i = 0; i < 26; i++) {
        const x = E.hash(sd + i * 3) * W, y = ((E.hash(sd + i * 5) * H + t * (10 + 10 * E.hash(i))) % (H + 40)) - 20;
        o += E.at(x, y, 1, t * 30 * (E.hash(i) - 0.5) + i * 20, E.rect(-10, -5, 20, 10, 3, [T.a, T.b, T.c, T.d][i % 4], 'opacity=".55"'));
      }
      o += E.shd(E.path(hillPath(W, gy + 40, 40, 3, sd + 20, H), T.ground[0]));
    }
    return o;
  };

  // ---------- caption ----------
  E.caption = (L, t) => {
    const C = E.cues, T = E.theme;
    if (!C.chunks || !C.chunks.length) return '';
    let ch = null;
    for (const c of C.chunks) if (t >= c.s - 0.05 && t < c.e + 0.25) ch = c;
    if (!ch) return '';
    const app = E.pop(t, ch.s - 0.05, 0.3);
    const lines = ch.lines;
    const size = L.capSize;
    const lh = size * 1.25;
    const h = lines.length * lh + 50;
    const cy = L.capY;
    let body = E.stk(E.rect(-L.capW / 2, -h / 2, L.capW, h, 20, T.capBg)) + (T.style === 'ink' ? '' : E.tape(-L.capW / 2 + 40, -h / 2 + 4, 90, -28) + E.tape(L.capW / 2 - 40, -h / 2 + 4, 90, 28));
    if (E.wmCfg().caption_tag !== false && E.brand.handle && E.wmCfg().enabled !== false)
      body += `<text x="${L.capW / 2 - 22}" y="${h / 2 - 16}" text-anchor="end" font-family="Space Grotesk, ${T.font}, sans-serif" font-size="20" font-weight="700" fill="${T.capInk}" opacity=".45">${E.esc(E.brand.handle)}</text>`;
    // dialogue: speaker name tag on the card's top-right edge (the watermark badge never sits there)
    if (ch.speaker) {
      const ts = size * 0.62, tw = E.measure(ch.speaker, ts, 700) + ts * 1.2, tx = L.capW / 2 - 24 - tw;
      body += E.rect(tx, -h / 2 - ts * 0.75, tw, ts * 1.5, ts * 0.75, ch.color || T.ink) +
        E.text(ch.speaker, tx + tw / 2, -h / 2 + 2, ts, '#FFFFFF', { weight: 700 });
    }
    const y0 = -((lines.length - 1) * lh) / 2;
    lines.forEach((ln, li) => {
      const cw = T.capWeight || 600;
      const sp = E.measure(' ', size, cw);
      const full = ln.map((w) => w.w).join(' ');
      let x = -E.measure(full, size, cw) / 2;
      ln.forEach((w) => {
        const ww = E.measure(w.w, size, cw);
        const active = t >= w.s && t < w.e;
        const said = t >= w.s;
        if (active) {
          const p = ease.out(E.prog(t, w.s, 0.12));
          body += E.path(`M${x - 8} ${y0 + li * lh - size * 0.38} L${x - 8 + (ww + 16) * p} ${y0 + li * lh - size * 0.44} L${x - 8 + (ww + 16) * p} ${y0 + li * lh + size * 0.42} L${x - 8} ${y0 + li * lh + size * 0.38} Z`, T.capHi);
        }
        body += E.text(w.w, x, y0 + li * lh + 2, size, said ? T.capInk : T.capDim, { anchor: 'start', weight: T.capWeight || 600 });
        x += ww + sp;
      });
    });
    return E.at(E.W / 2, cy, 0.85 + 0.15 * app, E.wob(77, 0.4), E.op(clamp(app * 2), body));
  };

  // ---------- watermark ----------
  // Badge (logo + @handle + "on YouTube") that hops between safe spots, plus optional
  // ghost handle drifting over the artwork and a tag inside the caption card.
  // Hard to crop or blur away without ruining the video.
  const WM_SPOTS = {
    shorts: { 'top-left': [36, 190, 'l'], 'top-right': [1044, 190, 'r'], 'low-left': [36, 1335, 'l'], 'low-center': [540, 1335, 'c'] },
    long: { 'top-left': [36, 46, 'l'], 'top-right': [1884, 46, 'r'], 'mid-left': [36, 470, 'l'], 'mid-right': [1884, 470, 'r'], 'low-left': [36, 880, 'l'], 'low-right': [1884, 880, 'r'] },
  };
  E.wmCfg = () => Object.assign({ move: 'scene', hop_every: 6, opacity: 0.92, size: 96, show_handle: true, subtitle: 'on YouTube', ghost: { enabled: true, opacity: 0.08 }, caption_tag: true }, E.brand.watermark || {});
  const wmBadge = (sz, side) => {
    const B = E.brand, W = E.wmCfg();
    const logo = E.data.logo
      ? `<image href="${E.data.logo}" x="0" y="${-sz / 2}" width="${sz}" height="${sz}" preserveAspectRatio="xMidYMid meet"/>`
      : E.at(sz / 2, 0, 1, 0, E.circ(0, 0, sz / 2, B.color) + E.text(B.initials || '', 0, 2, sz * 0.4, B.color2, { weight: 700 }));
    if (W.show_handle === false || !B.handle) return logo;
    const f1 = sz * 0.34, f2 = sz * 0.21;
    const tw = Math.max(E.measure(B.handle, f1, 700), W.subtitle ? E.measure(W.subtitle, f2, 500) + f2 * 1.4 : 0);
    const pw = sz * 0.55 + tw + sz * 0.34;
    let pill = E.rect(sz * 0.45, -sz * 0.36, pw, sz * 0.72, sz * 0.36, '#FFFFFF', `stroke="${E.theme.ink}" stroke-width="${(sz * 0.035).toFixed(1)}" opacity=".94"`);
    const tx = sz * 1.0;
    pill += `<text x="${tx}" y="${W.subtitle ? -sz * 0.06 : 2}" font-family="Space Grotesk, ${E.theme.font}, sans-serif" font-size="${f1}" font-weight="700" fill="${E.theme.ink}" dominant-baseline="middle">${E.esc(B.handle)}</text>`;
    if (W.subtitle) {
      pill += E.at(tx + f2 * 0.5, sz * 0.2, 1, 0, E.rect(-f2 * 0.5, -f2 * 0.36, f2, f2 * 0.72, f2 * 0.2, '#FF0033') + E.path(`M${-f2 * 0.14} ${-f2 * 0.2} L${f2 * 0.22} 0 L${-f2 * 0.14} ${f2 * 0.2} Z`, '#fff'));
      pill += `<text x="${tx + f2 * 1.3}" y="${sz * 0.2}" font-family="Space Grotesk, ${E.theme.font}, sans-serif" font-size="${f2}" font-weight="500" fill="${E.theme.ink}" dominant-baseline="middle">${E.esc(W.subtitle)}</text>`;
    }
    const g = pill + logo;
    const total = sz * 0.45 + pw;
    const dx = side === 'r' ? -total : side === 'c' ? -total / 2 : 0;
    return dx ? `<g transform="translate(${dx.toFixed(1)} 0)">${g}</g>` : g;
  };
  E.watermark = (L, t) => {
    const W = E.wmCfg();
    if (W.enabled === false) return '';
    const cur = E.data.story.scenes[E.sceneIndex || 0];
    if (cur && cur.type === 'outro' && t > cur.start + 0.3) return '';
    const table = WM_SPOTS[E.fmt] || WM_SPOTS.shorts;
    let def = Object.keys(table);
    // ink layouts use the side zones in 16:9, so keep the badge in the corners there
    if (E.fmt === 'long' && E.theme.style === 'ink') def = def.filter((k) => !k.startsWith('mid'));
    // multi-character channels: keep the badge away from the speaker tag on the caption's top-right
    if ((E.brand.voice || {}).cast) def = def.filter((k) => k !== 'low-right');
    let names = (W.spots || def).filter((k) => table[k]);
    if (W.move === 'static') names = [W.position && table[W.position] ? W.position : names[0]];
    let slot = 0, fade = 1;
    if (W.move === 'timer') {
      const hop = Math.max(2, W.hop_every);
      slot = Math.floor(t / hop);
      const ph = t - slot * hop;
      fade = Math.min(1, ph / 0.3, (hop - ph) / 0.3);
    } else if (W.move !== 'static') {
      const sc = E.data.story.scenes;
      slot = E.sceneIndex || 0;
      const nb = Math.min(...sc.slice(1).map((s) => Math.abs(t - s.start)), 99);
      fade = Math.min(1, nb / 0.25);
    }
    // deterministic shuffle so consecutive slots never share a spot
    let k = 0, prev = -1;
    for (let s = 0; s <= slot; s++) {
      let c = Math.floor(E.hash(E.seed * 7.3 + s * 1.91) * names.length);
      if (c === prev && names.length > 1) c = (c + 1) % names.length;
      prev = k = c;
    }
    const [x, y, side] = table[names[k]];
    return E.at(x, y, 1, 0, E.op((W.opacity == null ? 0.92 : W.opacity) * fade, E.shd(wmBadge(W.size || 96, side))));
  };
  E.ghost = (L, t) => {
    const W = E.wmCfg(), G = W.ghost || {};
    if (W.enabled === false || !G.enabled || !E.brand.handle) return '';
    const cx = E.W / 2 + E.W * 0.28 * Math.sin(t * 0.19 + E.seed);
    const cy = L.art.y + L.art.h * (0.5 + 0.32 * Math.sin(t * 0.13 + 1.7));
    return E.at(cx, cy, 1, -14, `<text x="0" y="0" text-anchor="middle" font-family="Space Grotesk, ${E.theme.font}, sans-serif" font-size="${E.fmt === 'long' ? 64 : 58}" font-weight="700" fill="${E.theme.ink}" opacity="${G.opacity || 0.08}">${E.esc(E.brand.handle)}</text>`);
  };

  // ---------- transitions ----------
  // returns {mask: svg string drawn over everything, showNew: bool}
  E.transition = (kind, p) => {
    const W = E.W, H = E.H, T = E.theme;
    if (kind === 'slide') {
      const x = lerp(W * 1.1, -W * 1.1, ease.inOut(p));
      return E.at(x, 0, 1, 0, E.shd(E.rect(-W / 2 - 60, -40, W + 120, H + 80, 40, T.sheet) + E.text(E.brand.initials || '', 0, H / 2, 160, T.sheetInk, { weight: 700 })));
    }
    if (kind === 'ink') {
      // three diagonal bands (accent, highlight, ink) sweep across, slightly staggered
      const d = Math.hypot(W, H);
      let o = '';
      [[T.d, 0], [T.c, 0.07], [T.ink, 0.14]].forEach(([col, lag], k) => {
        const q = E.clamp((p - lag) / (1 - 0.14));
        const x = lerp(d * 1.1, -d * 1.1, ease.inOut(q));
        const wdt = d * (0.55 - k * 0.1);
        o += E.at(W / 2 + x, H / 2, 1, -20, E.rect(-wdt / 2, -d, wdt, d * 2, 0, col));
      });
      if (p > 0.38 && p < 0.62) o += E.op(1 - Math.abs(p - 0.5) * 8, E.at(W / 2, H / 2, 1, 0, E.text(E.brand.handle || '', 0, 0, 64, T.paper, { weight: 700 })));
      return o;
    }
    if (kind === 'torn') {
      const y = lerp(H * 1.15, -H * 1.15, ease.inOut(p));
      let edge = `M0 0 `;
      for (let i = 0; i <= 24; i++) edge += `L${(W / 24) * i} ${(i % 2 ? 26 : 0) + E.hash(i) * 14} `;
      let edge2 = '';
      for (let i = 24; i >= 0; i--) edge2 += `L${(W / 24) * i} ${H + (i % 2 ? -26 : 0) - E.hash(i + 9) * 14} `;
      return E.at(0, y, 1, 0, E.shd(E.path(edge + edge2 + 'Z', T.sheet)));
    }
    // "fold": diagonal paper sheet with a crease sweeping across
    const d = Math.hypot(W, H);
    const x = lerp(d * 1.05, -d * 1.05, ease.inOut(p));
    const half = d * 0.62;
    const sheet =
      E.rect(-half, -d, half * 2, d * 2, 0, T.sheet) +
      E.rect(-half, -d, half * 0.55, d * 2, 0, T.sheetFold) +
      E.line(`M${-half + half * 0.55} ${-d} V${d}`, T.sheetInk, 3, 'opacity=".25" stroke-dasharray="14 12"');
    return E.at(W / 2 + x, H / 2, 1, -24, E.shd(sheet));
  };

  // ---------- progress bar (long videos) ----------
  E.progress = (t) => {
    if (E.fmt !== 'long' || E.brand.progress_bar === false) return '';
    const p = clamp(t / E.cues.duration);
    return E.rect(0, E.H - 10, E.W, 10, 0, '#000', 'opacity=".12"') + E.rect(0, E.H - 10, E.W * p, 10, 0, E.brand.color);
  };

  // speaking? (for mascot mouth)
  E.speaking = (t) => {
    const ws = E.cues.words;
    let lo = 0, hi = ws.length - 1;
    while (lo <= hi) {
      const m = (lo + hi) >> 1;
      if (ws[m].e < t) lo = m + 1;
      else if (ws[m].s > t) hi = m - 1;
      else return true;
    }
    return false;
  };

  // ---------- main ----------
  window.renderFrame = function (F) {
    const D = E.data;
    E.F = F;
    const t = F / E.fps;
    const L = E.L;
    const scenes = D.story.scenes;
    let i = 0;
    while (i < scenes.length - 1 && t >= scenes[i + 1].start) i++;
    const TR = 0.5; // transition length (s)
    const drawScene = (k) => {
      const sc = scenes[k];
      const lt = t - sc.start;
      const fn = window.SCENES[sc.type] || window.SCENES.title;
      let inner = '';
      try {
        inner = fn(sc, { t: lt, dur: sc.end - sc.start, abs: t });
      } catch (err) {
        inner = E.text('scene error: ' + err.message, 500, 500, 30, '#c00');
      }
      // slow camera: alternate push-in / pull-out with a little drift, so still panels keep moving
      const u = E.ease.inOut(E.clamp(lt / Math.max(0.5, sc.end - sc.start)));
      const zin = (sc._seed || k) % 2 === 1;
      const z = zin ? 1 + 0.04 * u : 1.04 - 0.04 * u;
      const dx = Math.sin((sc._seed || k) * 1.7) * 10 * (zin ? u : 1 - u);
      const cam = `translate(${(500 + dx).toFixed(1)} 450) scale(${z.toFixed(4)}) translate(-500 -450)`;
      return E.background(L, t, sc.tint) + `<g transform="translate(${L.ox.toFixed(1)} ${L.oy.toFixed(1)}) scale(${L.s.toFixed(4)})"><g transform="${cam}">${inner}</g></g>`;
    };
    E.sceneIndex = i;
    if (D.thumb) {
      document.getElementById('stage').innerHTML = E.thumbnail(D.thumb, scenes[i], t, L);
      return true;
    }
    let body = '';
    let mask = '';
    // transition centred on scene boundary
    const sc = scenes[i];
    const kind = D.story.transition || E.theme.transition || 'fold';
    if (i > 0 && t < sc.start + TR / 2) {
      const p = (t - (sc.start - TR / 2)) / TR;
      body = p < 0.5 ? drawScene(i - 1) : drawScene(i);
      mask = E.transition(kind, p);
    } else if (i < scenes.length - 1 && t >= scenes[i + 1].start - TR / 2) {
      const p = (t - (scenes[i + 1].start - TR / 2)) / TR;
      body = drawScene(i);
      mask = E.transition(kind, p);
    } else body = drawScene(i);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${E.W}" height="${E.H}" viewBox="0 0 ${E.W} ${E.H}">${E.defs()}${body}${E.ghost(L, t)}${mask}${E.caption(L, t)}${E.watermark(L, t)}${E.progress(t)}</svg>`;
    document.getElementById('stage').innerHTML = svg;
    return true;
  };

  // ---------- thumbnail / cover ----------
  // A still of one scene (no caption, no moving watermark) plus a big headline card.
  E.thumbnail = (th, sc, t, L) => {
    const T = E.theme, W = E.W, H = E.H;
    const long = E.fmt === 'long';
    const fn = window.SCENES[sc.type] || window.SCENES.title;
    let inner = '';
    try {
      inner = fn(sc, { t: t - sc.start, dur: sc.end - sc.start, abs: t });
    } catch (err) {
      inner = '';
    }
    // headline card: fit text into up to 3 lines
    const cw = long ? W * 0.37 : W - 120, cx = long ? 60 : 60, pad = long ? 52 : 54;
    const text = String(th.text || '').trim();
    const words = text.split(/\s+/).filter(Boolean);
    const font = `${T.font}, sans-serif`;
    let fs = long ? 150 : 140, lines = [];
    for (; fs >= 60; fs -= 6) {
      lines = [];
      let cur = [];
      for (const w of words) {
        const trial = cur.concat([w]).join(' ');
        if (cur.length && E.measure(trial, fs, 700) > cw - pad * 2) {
          lines.push(cur);
          cur = [w];
        } else cur.push(w);
      }
      if (cur.length) lines.push(cur);
      if (lines.length <= 3 && lines.every((l) => E.measure(l.join(' '), fs, 700) <= cw - pad * 2)) break;
    }
    const lh = fs * 1.08;
    const ch = lines.length * lh + pad * 1.6;
    const cy = long ? (H - ch) / 2 - 20 : 120;
    let card = E.stk(E.rect(cx, cy, cw, ch, 26, T.paper || '#fff'));
    const hi = String(th.highlight || '').toLowerCase().replace(/[^\p{L}\p{N}$%]/gu, '');
    lines.forEach((ln, li) => {
      const y = cy + pad * 0.8 + li * lh + fs * 0.5;
      let x = cx + pad;
      const sp = E.measure(' ', fs, 700);
      ln.forEach((w) => {
        const ww = E.measure(w, fs, 700);
        const key = w.toLowerCase().replace(/[^\p{L}\p{N}$%]/gu, '');
        if (hi && key && (key === hi || key.includes(hi))) card += E.marker(x - 10, y - fs * 0.48, ww + 20, fs * 0.92, 1, T.capHi || T.d);
        card += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="${font}" font-size="${fs}" font-weight="700" fill="${T.ink}" dominant-baseline="middle">${E.esc(w)}</text>`;
        x += ww + sp;
      });
    });
    // brand mark on the card corner
    const lg = long ? 150 : 140;
    const mark = E.data.logo
      ? `<image href="${E.data.logo}" x="${-lg / 2}" y="${-lg / 2}" width="${lg}" height="${lg}"/>`
      : E.circ(0, 0, lg / 2, E.brand.color) + E.text(E.brand.initials || '', 0, 3, lg * 0.4, E.brand.color2, { weight: 700 });
    card += E.at(cx + cw - lg * 0.35, cy + ch - lg * 0.2, 1, 8, E.shd(mark));
    // make room for the headline: 16:9 shrinks the whole scene into the right side (feet stay on the
    // ground line); 9:16 moves the scene below the card
    // 16:9: frame x 256..1708 holds every layout's content; fit it into x 800..1880, ground at y 900
    const k = 0.74, gy2 = 900;
    const dy = long ? 0 : Math.max(330, cy + ch + lg * 0.3 + 30 - L.art.y);
    const sceneG = long
      ? `<g transform="translate(${(800 - 256 * k).toFixed(1)} ${(gy2 - L.groundY * k).toFixed(1)}) scale(${k})"><g transform="translate(${L.ox.toFixed(1)} ${L.oy.toFixed(1)}) scale(${L.s.toFixed(4)})">${inner}</g></g>`
      : `<g transform="translate(${L.ox.toFixed(1)} ${L.oy.toFixed(1)}) scale(${L.s.toFixed(4)})">${inner}</g>`;
    let body = E.rect(0, 0, W, H, 0, (T.tints && sc.tint && T.tints[sc.tint] ? T.tints[sc.tint] : T.sky)[0]);
    body += long ? E.background(Object.assign({}, L, { groundY: gy2 }), t, sc.tint) + sceneG : `<g transform="translate(0 ${dy.toFixed(1)})">${E.background(L, t, sc.tint)}${sceneG}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${E.defs()}${body}${card}</svg>`;
  };

  window.initEngine = function (D) {
    E.data = D;
    E.theme = D.theme;
    E.brand = D.brand;
    E.cues = D.cues;
    E.fps = D.fps;
    E.W = D.W;
    E.H = D.H;
    E.fmt = D.format;
    E.seed = D.brand.seed || 7;
    E.L = E.layout(D.format, D.W, D.H);
  };
})();
