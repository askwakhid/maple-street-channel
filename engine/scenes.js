// Scene templates. Each one draws in a logical 1000x1000 box (ground line ~ y 900).
// sc = one resolved storyboard scene (times already converted to local seconds by pf.py).
// T  = { t: local time, dur, abs }.
(function () {
  const E = window.E;
  const P = () => E.theme;
  const pick = (v, d) => (v === undefined || v === null || v === '' ? d : v);
  const W0 = (sc) => sc._seed || 1;

  // icon that pops in at t0 and then floats gently
  const ic = (name, x, y, size, t0, T, seed = 0) => {
    const [sx, sy] = E.popSS(T.t, t0, 0.5);
    if (sx <= 0.01) return '';
    const fl = Math.sin(T.t * 2.2 + seed) * 6;
    return E.atXY(x, y + fl, (sx * size) / 200, (sy * size) / 200, E.wob(seed + 3, 1.5), E.stk(window.iconSVG(name, P())));
  };
  // paper label
  const tag = (txt, x, y, t0, T, o = {}) => {
    if (!txt) return '';
    const [sx, sy] = E.popSS(T.t, t0, 0.45);
    if (sx <= 0.01) return '';
    const size = o.size || 46;
    const lines = E.wrap(txt, o.chars || 16).slice(0, 3);
    const w = Math.max(...lines.map((l) => E.measure(l, size))) + 60;
    const h = lines.length * size * 1.15 + 34;
    return E.atXY(x, y, sx, sy, (o.rot || 0) + E.wob(x + y, 0.6),
      E.stk(E.rect(-w / 2, -h / 2, w, h, 16, o.bg || P().paper)) + E.para(txt, 0, 3, size, o.color || P().ink, o.chars || 16, { maxLines: 3 }));
  };
  const enter = (T) => E.pop(T.t, 0.05, 0.5);
  const mascotAt = (x, y, s, T, o) => E.at(x, y, s * E.pop(T.t, 0.1, 0.5), 0, window.mascot(Object.assign({ t: T.t, abs: T.abs }, o)));
  const items = (sc) => (Array.isArray(sc.items) ? sc.items : []);
  const stamp = (txt, x, y, t0, T, color) => {
    const p = E.prog(T.t, t0, 0.35);
    if (p <= 0) return '';
    const s = lerp(2.2, 1, E.ease.out(p));
    const body = E.rect(-190, -70, 380, 140, 20, 'none', `stroke="${color}" stroke-width="14"`) + E.text(txt, 0, 4, 78, color, { weight: 700, ls: 4 });
    return E.at(x, y, s, -12, E.op(Math.min(1, p * 2) * 0.92, body));
  };
  const lerp = E.lerp;
  // in 16:9 spread layouts sideways into the empty side zones
  const SX = (x) => (E.fmt === 'long' ? 500 + (x - 500) * 1.45 : x);

  const S = (window.SCENES = {});

  S.hook = (sc, T) => {
    let o = '';
    const shocked = sc.t != null && T.t > sc.t;
    o += mascotAt(250, 740, 1.7, T, { pose: shocked ? 'shrug' : 'think', mood: shocked ? 'shock' : 'think', talk: true });
    const b = E.pop(T.t, 0.25, 0.5);
    o += E.at(640, 360, b, E.wob(5, 1), E.stk(E.path('M-230 60 Q-280 -40 -190 -90 Q-170 -190 -50 -170 Q30 -250 140 -170 Q270 -170 250 -60 Q300 40 200 90 Q130 170 0 120 Q-150 170 -230 60 Z', '#fff')));
    o += E.op(b, E.circ(400, 560, 26, '#fff', 'filter="url(#shd)"') + E.circ(350, 620, 16, '#fff', 'filter="url(#shd)"'));
    o += ic(sc.icon || 'question', 640, 340, 230, 0.6, T, 1);
    [[880, 180, 0.9], [420, 150, 0.7], [860, 560, 0.6]].forEach(([x, y, k], i) => {
      o += E.at(x, y + Math.sin(T.t * 3 + i) * 10, E.pop(T.t, 0.9 + i * 0.25, 0.4) * k, -15 + i * 15, E.text('?', 0, 0, 130, [P().a, P().b, P().e][i], { weight: 700 }));
    });
    o += tag(sc.text, 640, 640, pick(sc.t, 0.6) + 0.2, T, { size: 50 });
    return o;
  };

  S.title = (sc, T) => {
    let o = '';
    const e = enter(T);
    o += ic(sc.icon, 500, 230, 260, 0.15, T, 2);
    o += E.at(500, 560, e, -2 + E.wob(9, 0.6),
      E.card(860, sc.subtitle ? 340 : 260, P().paper) + E.para(sc.title || sc.text || '', 0, sc.subtitle ? -40 : 0, 82, P().ink, 18, { weight: 700, maxLines: 2 }) +
        (sc.subtitle ? E.para(sc.subtitle, 0, 95, 44, P().a, 30, { maxLines: 1 }) : ''));
    if (sc.mascot !== false) o += mascotAt(820, 800, 1.1, T, { pose: 'wave', mood: 'happy', talk: true, dir: -1 });
    return o;
  };

  S.icons = (sc, T) => {
    const it = items(sc).slice(0, 4);
    const n = it.length;
    const pos = { 1: [[500, 440]], 2: [[270, 440], [730, 440]], 3: [[190, 470], [500, 330], [810, 470]], 4: [[280, 270], [720, 270], [280, 640], [720, 640]] }[n] || [];
    const size = { 1: 380, 2: 300, 3: 250, 4: 220 }[n] || 250;
    let o = '';
    it.forEach((x, i) => {
      const [px0, py] = pos[i];
      const px = SX(px0);
      o += ic(x.icon, px, py, size, x.t, T, i * 7);
      o += tag(x.label, px, py + size * 0.62 + 20, x.t + 0.15, T, { size: n > 2 ? 40 : 48, chars: 12 });
    });
    if (sc.title) o += tag(sc.title, 500, 70, 0.1, T, { size: 50, chars: 28, bg: P().c });
    return o;
  };

  S.list = (sc, T) => {
    const it = items(sc).slice(0, 5);
    const n = it.length;
    const top = sc.title ? 230 : 150;
    const gap = Math.min(165, (870 - top) / Math.max(1, n));
    let o = sc.title ? tag(sc.title, 500, 95, 0.1, T, { size: 54, chars: 26, bg: P().c }) : '';
    it.forEach((x, i) => {
      const y = top + gap * (i + 0.5);
      const p = E.ease.back(E.prog(T.t, x.t, 0.45));
      if (p <= 0) return;
      const dx = lerp(-900, 0, Math.min(1, p));
      let row = E.stk(E.rect(-420, -gap * 0.4, 840, gap * 0.8, 22, P().paper));
      row += E.at(-345, 0, Math.min(1, p) * (gap * 0.6) / 200, 0, window.iconSVG(x.icon || ['check', 'star', 'heart', 'lightbulb', 'shield'][i], P()));
      const fs = Math.min(50, gap * 0.32);
      const lines = E.wrap(x.text || x.label || '', 26).slice(0, 2);
      row += lines.map((l, k) => E.text(l, -270, (k - (lines.length - 1) / 2) * fs * 1.15 + 2, fs, P().ink, { anchor: 'start' })).join('');
      if (sc.style === 'number') row += E.circ(400, -gap * 0.32, 30, P().a) + E.text(String(i + 1), 400, -gap * 0.32 + 2, 36, '#fff', { weight: 700 });
      o += E.at(500 + dx, y, 1, E.wob(i * 3, 0.5) + (i % 2 ? 0.8 : -0.8), row);
    });
    return o;
  };

  S.versus = (sc, T) => {
    const L = sc.left || {}, R = sc.right || {};
    let o = '';
    [[L, SX(255), 0.15, -3, P().b], [R, SX(745), 0.35, 3, P().a]].forEach(([s, x, t0, rot, col], i) => {
      const e = E.pop(T.t, pick(s.t, t0), 0.5);
      o += E.at(x, 430, e, rot + E.wob(i + 20, 0.7), E.stk(E.rect(-215, -300, 430, 600, 30, P().paper)) + E.rect(-215, 180, 430, 120, 30, col) + E.rect(-215, 180, 430, 40, 0, col));
      o += ic(s.icon, x, 370, 270, pick(s.t, t0) + 0.15, T, i * 5);
      o += E.op(e, E.para(s.label || '', x, 665, 46, '#fff', 14, { maxLines: 2, weight: 700 }));
    });
    const vt = pick(sc.t, Math.max(pick(L.t, 0.15), pick(R.t, 0.35)) + 0.4);
    o += E.at(500, 430, E.pop(T.t, vt, 0.4), -8, E.stk(E.circ(0, 0, 80, P().c)) + E.text(sc.vs || 'VS', 0, 4, 64, P().ink, { weight: 700 }));
    if (sc.winner === 'left' || sc.winner === 'right') {
      const wx = SX(sc.winner === 'left' ? 255 : 745);
      o += E.at(wx + 150, 150, E.pop(T.t, pick(sc.winner_t, vt + 0.8), 0.4), 12, E.stk(window.iconSVG('check', P())));
    }
    return o;
  };

  const claimCard = (sc, T, good) => {
    let o = '';
    const e = enter(T);
    o += E.at(500, 450, e, -2 + E.wob(4, 0.6), E.card(720, 640, P().paper));
    o += ic(sc.icon, 500, 380, 330, 0.25, T, 3);
    o += E.op(e, E.para(sc.label || sc.text || '', 500, 680, 54, P().ink, 18, { maxLines: 2, weight: 600 }));
    const st = pick(sc.t, T.dur * 0.6);
    o += stamp(sc.stamp || (good ? 'FACT' : 'MYTH'), 560, 420, st, T, good ? '#2E9E5B' : '#E23B3B');
    if (sc.mascot !== false) o += mascotAt(140, 800, 0.95, T, { pose: T.t > st ? (good ? 'cheer' : 'shrug') : 'idle', mood: T.t > st ? (good ? 'happy' : 'sad') : 'think', talk: true });
    return o;
  };
  S.myth = (sc, T) => claimCard(sc, T, false);
  S.fact = (sc, T) => claimCard(sc, T, true);

  S.number = (sc, T) => {
    let o = '';
    const t0 = pick(sc.t, 0.3);
    const v = parseFloat(String(sc.value).replace(/[^0-9.\-]/g, '')) || 0;
    const dec = (String(sc.value).split('.')[1] || '').length;
    const p = E.ease.out(E.prog(T.t, t0, 1.2));
    const shown = (v * p).toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, sc.thousands || ',');
    o += ic(sc.icon, 500, 200, 220, 0.1, T, 4);
    const e = enter(T);
    const txt = `${sc.prefix || ''}${shown}${sc.suffix || ''}`;
    const fs = Math.min(230, 1500 / Math.max(3, txt.length));
    o += E.at(500, 500, e * (1 + 0.06 * Math.sin(Math.min(1, E.prog(T.t, t0 + 1.2, 0.3)) * Math.PI)), -2,
      E.card(820, 330, P().paper) + E.text(txt, 0, 10, fs, P().a, { weight: 700 }));
    o += tag(sc.label, 500, 780, t0 + 0.4, T, { size: 50, chars: 22, bg: P().c });
    return o;
  };

  S.steps = (sc, T) => {
    const it = items(sc).slice(0, 4);
    const n = it.length;
    const pos = { 1: [[500, 450]], 2: [[270, 450], [730, 450]], 3: [[180, 330], [500, 600], [820, 330]], 4: [[260, 250], [740, 250], [740, 640], [260, 640]] }[n] || [];
    let o = '';
    pos.forEach((q) => (q[0] = SX(q[0])));
    for (let i = 0; i < n - 1; i++) {
      const [x1, y1] = pos[i], [x2, y2] = pos[i + 1];
      const p = E.prog(T.t, it[i + 1].t - 0.35, 0.35);
      if (p <= 0) continue;
      const mx = (x1 + x2) / 2 + (y2 - y1) * 0.25, my = (y1 + y2) / 2 - (x2 - x1) * 0.15;
      const len = Math.hypot(x2 - x1, y2 - y1) * 1.1;
      o += E.line(`M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`, P().ink, 9, `stroke-dasharray="${len * p} ${len}" opacity=".55"`);
    }
    it.forEach((x, i) => {
      const [px, py] = pos[i];
      o += E.at(px, py, E.pop(T.t, x.t, 0.45), 0, E.stk(E.circ(0, 0, 135, P().paper)));
      o += ic(x.icon, px, py - 10, 170, x.t + 0.08, T, i * 4);
      o += E.at(px - 105, py - 105, E.pop(T.t, x.t + 0.15, 0.4), 0, E.circ(0, 0, 34, P().a) + E.text(String(i + 1), 0, 2, 40, '#fff', { weight: 700 }));
      o += tag(x.label, px, py + 170, x.t + 0.2, T, { size: 40, chars: 13 });
    });
    return o;
  };

  S.cycle = (sc, T) => {
    const it = items(sc).slice(0, 5);
    const n = it.length || 1;
    const cx = 500, cy = 460, R = 300;
    let o = '';
    const e = E.prog(T.t, 0.1, 1.2);
    o += E.circ(cx, cy, R, 'none', `stroke="${P().ink}" stroke-width="8" stroke-dasharray="4 22" stroke-linecap="round" opacity="${(0.5 * e).toFixed(2)}"`);
    if (sc.icon) o += ic(sc.icon, cx, cy, 200, 0.2, T, 9);
    const runner = (T.t * 0.35) % 1;
    const ra = runner * Math.PI * 2 - Math.PI / 2;
    o += E.op(e, E.at(cx + Math.cos(ra) * R, cy + Math.sin(ra) * R, 0.35, 0, window.iconSVG(sc.runner || 'drop', P())));
    it.forEach((x, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R;
      o += E.at(px, py, E.pop(T.t, x.t, 0.45), 0, E.stk(E.circ(0, 0, 105, P().paper)));
      o += ic(x.icon, px, py - 5, 130, x.t + 0.05, T, i * 3);
      o += tag(x.label, px, py + 125, x.t + 0.15, T, { size: 36, chars: 12 });
    });
    return o;
  };

  S.talk = (sc, T) => {
    const big = E.fmt === 'long' ? 1.2 : 1;
    let o = mascotAt(SX(230), 730, 1.6 * big, T, { pose: sc.pose || 'point', mood: sc.mood || 'happy', talk: true });
    const b = E.pop(T.t, 0.25, 0.45);
    const lines = E.wrap(sc.text || '', 16).slice(0, 4);
    const fs = 52;
    const h = Math.max(260, lines.length * fs * 1.2 + (sc.icon ? 230 : 90));
    let bub = E.stk(E.rect(-290, -h / 2, 580, h, 46, '#fff') + E.path(`M-200 ${h / 2 - 20} L-290 ${h / 2 + 70} L-130 ${h / 2 - 10} Z`, '#fff'));
    if (sc.icon) bub += E.at(0, -h / 2 + 110, 0.85, 0, window.iconSVG(sc.icon, P()));
    bub += E.para(sc.text || '', 0, sc.icon ? 70 : 0, fs, P().ink, 16, { maxLines: 4, weight: 600 });
    o += E.at(SX(650), 380, b * big, E.wob(11, 0.8), bub);
    return o;
  };

  S.warning = (sc, T) => {
    let o = '';
    const e = enter(T);
    const shake = T.t < 1.2 ? Math.sin(T.t * 40) * 6 * (1 - T.t / 1.2) : 0;
    const tapeRow = (y, rot) => {
      let s = E.rect(-700, -40, 1400, 80, 0, P().c);
      for (let i = -12; i < 12; i++) s += E.path(`M${i * 70} -40 h35 l-40 80 h-35 Z`, P().ink);
      return E.at(500 + ((T.t * 40) % 140) * (rot > 0 ? 1 : -1), y, 1, rot, s);
    };
    o += E.op(e, tapeRow(60, -4) + tapeRow(900, 3));
    o += E.at(500 + shake, 380, 1.9 * e * (1 + 0.04 * Math.sin(T.t * 6)), 0, E.stk(window.iconSVG(sc.icon || 'warning', P())));
    o += tag(sc.label || sc.text, 500, 680, 0.4, T, { size: 60, chars: 18, bg: '#E23B3B', color: '#fff' });
    return o;
  };

  S.zoom = (sc, T) => {
    let o = '';
    o += ic(sc.icon, 430, 470, 420, 0.1, T, 2);
    const t0 = pick(sc.t, 0.8);
    const p = E.ease.inOut(E.prog(T.t, t0, 0.7));
    if (p > 0) {
      const x = lerp(1100, 610, p), y = lerp(900, 380, p);
      let lens = E.circ(0, 0, 175, '#E6F4FB') + E.at(0, -15, 1.2, 0, window.iconSVG(sc.detail || 'virus', P()));
      lens += E.circ(0, 0, 175, 'none', `stroke="${P().ink}" stroke-width="28"`) + E.line('M125 125 L270 270', P().ink, 46) + E.circ(-70, -70, 25, '#fff', 'opacity=".5"');
      o += E.at(x, y, 1, E.wob(8, 1), E.shd(lens));
    }
    o += tag(sc.label, 500, 860, t0 + 0.5, T, { size: 48, chars: 22, bg: P().c });
    return o;
  };

  S.chart = (sc, T) => {
    const it = items(sc).slice(0, 6);
    const n = it.length || 1;
    const max = Math.max(...it.map((x) => parseFloat(x.value) || 0), 1);
    let o = '';
    const e = enter(T);
    o += E.at(500, 480, e, 0, E.card(900, 760, P().paper));
    if (sc.title) o += E.op(e, E.para(sc.title, 500, 170, 48, P().ink, 30, { maxLines: 1, weight: 700 }));
    const bw = Math.min(150, 700 / n - 30);
    const cols = [P().b, P().a, P().d, P().c, P().e];
    it.forEach((x, i) => {
      const cx = 500 + (i - (n - 1) / 2) * (700 / n);
      const h = (520 * (parseFloat(x.value) || 0)) / max;
      const p = E.ease.out(E.prog(T.t, x.t, 0.7));
      o += E.rect(cx - bw / 2, 760 - h * p, bw, h * p, 10, cols[i % cols.length]);
      o += E.op(p, E.text(`${sc.prefix || ''}${x.value}${sc.suffix || ''}`, cx, 760 - h * p - 30, 38, P().ink, { weight: 700 }));
      o += E.op(e, E.para(x.label || '', cx, 800, 32, P().ink, 10, { maxLines: 2 }));
    });
    o += E.op(e, E.line('M90 760 H910', P().ink, 6));
    return o;
  };

  S.timeline = (sc, T) => {
    const it = items(sc).slice(0, 5);
    const n = it.length || 1;
    let o = '';
    const e = E.prog(T.t, 0.05, 0.8);
    o += E.line(`M80 500 H${80 + 840 * e}`, P().ink, 10, 'opacity=".6"');
    let cur = -1;
    it.forEach((x, i) => {
      if (T.t >= x.t) cur = i;
    });
    it.forEach((x, i) => {
      const px = 80 + (840 * (i + 0.5)) / n;
      const up = i % 2 === 0;
      o += E.at(px, 500, E.pop(T.t, x.t, 0.4), 0, E.circ(0, 0, 26, i === cur ? P().a : P().paper, `stroke="${P().ink}" stroke-width="6"`));
      o += ic(x.icon, px, up ? 300 : 690, 150, x.t + 0.05, T, i);
      o += tag(x.label, px, up ? 420 : 590, x.t + 0.12, T, { size: 34, chars: 10 });
    });
    if (cur >= 0) {
      const px = 80 + (840 * (cur + 0.5)) / n;
      o += E.at(px, 840, 0.6, 0, window.mascot({ t: T.t, abs: T.abs, pose: 'point', talk: true }));
    }
    return o;
  };

  S.cause = (sc, T) => {
    const A = sc.from || {}, B = sc.to || {};
    let o = '';
    const ta = pick(A.t, 0.15), tb = pick(B.t, Math.max(ta + 0.8, T.dur * 0.5));
    o += E.at(SX(230), 420, E.pop(T.t, ta, 0.45), 0, E.stk(E.circ(0, 0, 180, P().paper)));
    o += ic(A.icon, SX(230), 410, 240, ta + 0.1, T, 1);
    o += tag(A.label, SX(230), 660, ta + 0.2, T, { size: 44, chars: 12 });
    const p = E.ease.inOut(E.prog(T.t, tb - 0.6, 0.6));
    if (p > 0) {
      const x2 = lerp(SX(230) + 200, SX(770) - 220, p);
      o += E.line(`M${SX(230) + 190} 420 L${x2} 420`, P().a, 26) + E.at(x2, 420, 1, 0, E.path('M-10 -45 L45 0 L-10 45 Z', P().a));
    }
    o += E.at(SX(770), 420, E.pop(T.t, tb, 0.45), 0, E.stk(E.circ(0, 0, 180, P().paper)));
    o += ic(B.icon, SX(770), 410, 240, tb + 0.1, T, 2);
    o += tag(B.label, SX(770), 660, tb + 0.2, T, { size: 44, chars: 12 });
    if (sc.text) o += tag(sc.text, 500, 140, 0.1, T, { size: 50, chars: 26, bg: P().c });
    return o;
  };

  S.bigtext = (sc, T) => {
    const e = enter(T);
    const words = String(sc.text || '').split(/\s+/);
    const hi = String(sc.highlight || '').toLowerCase();
    const lines = E.wrap(sc.text || '', 12).slice(0, 4);
    const fs = Math.min(120, 900 / Math.max(6, Math.max(...lines.map((l) => l.length)) * 0.6));
    let body = E.stk(E.path('M-430 -300 L-380 -320 L-300 -295 L-200 -318 L-80 -300 L40 -322 L160 -298 L280 -320 L430 -300 L420 300 L300 318 L180 296 L40 320 L-100 298 L-240 320 L-430 300 Z', P().paper));
    let k = 0;
    lines.forEach((ln, li) => {
      const y = (li - (lines.length - 1) / 2) * fs * 1.15;
      const lw = E.measure(ln, fs, 700);
      let x = -lw / 2;
      ln.split(' ').forEach((w) => {
        const ww = E.measure(w, fs, 700);
        const s = E.pop(T.t, 0.15 + k * 0.08, 0.35);
        const isHi = hi && w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '').includes(hi.replace(/[^\p{L}\p{N}]/gu, ''));
        if (isHi) body += E.op(s, E.rect(x - 10, y - fs * 0.5, ww + 20, fs * 1.0, 10, P().c));
        body += E.at(x + ww / 2, y + 4, s, 0, E.text(w, 0, 0, fs, isHi ? P().ink : P().ink, { weight: 700 }));
        x += ww + E.measure(' ', fs, 700);
        k++;
      });
    });
    void words;
    return E.at(500, 450, e, -2 + E.wob(2, 0.5), body);
  };

  S.image = (sc, T) => {
    const e = enter(T);
    const src = E.data.images[sc.image];
    let body = E.stk(E.rect(-340, -380, 680, 760, 14, '#fff'));
    body += src ? `<image href="${src}" x="-300" y="-340" width="600" height="560" preserveAspectRatio="xMidYMid slice"/>` : E.rect(-300, -340, 600, 560, 4, '#ddd');
    body += E.para(sc.label || '', 0, 290, 46, P().ink, 22, { maxLines: 2 }) + E.tape(0, -380, 160, 4);
    return E.at(500, 470, e, -3 + E.wob(6, 0.6), body);
  };

  S.outro = (sc, T) => {
    const B = E.brand;
    let o = '';
    const e = E.pop(T.t, 0.1, 0.5);
    const sz = 230;
    let badge;
    if (E.data.logo) badge = `<image href="${E.data.logo}" x="${-sz / 2}" y="${-sz / 2}" width="${sz}" height="${sz}"/>`;
    else badge = E.circ(0, 0, sz / 2, B.color) + E.circ(0, 0, sz / 2 - 12, 'none', `stroke="${B.color2}" stroke-width="5" stroke-dasharray="12 10"`) + E.text(B.initials || 'PF', 0, 5, sz * 0.38, B.color2, { weight: 700 });
    o += E.at(500, 190, e, E.wob(1, 1), E.shd(badge));
    o += E.op(e, E.text(B.channel || '', 500, 360, 64, P().ink, { weight: 700 }));
    o += tag(sc.text || (B.outro && B.outro.cta) || 'Subscribe!', 500, 470, 0.4, T, { size: 50, chars: 24 });
    const st = pick(sc.t, 0.9);
    const clicked = T.t > st + 0.5;
    const btn = E.rect(-210, -55, 420, 110, 55, clicked ? '#9AA0A6' : '#FF3B30') + E.text(clicked ? (B.outro && B.outro.subscribed) || 'SUBSCRIBED' : (B.outro && B.outro.button) || 'SUBSCRIBE', 0, 4, 46, '#fff', { weight: 700 });
    o += E.at(390, 640, E.pop(T.t, st, 0.45) * (clicked && T.t < st + 0.65 ? 0.92 : 1), 0, E.stk(btn));
    o += E.at(700, 640, E.pop(T.t, st + 0.1, 0.45) * 0.55, Math.sin(Math.max(0, T.t - st - 0.6) * 18) * 14 * Math.exp(-Math.max(0, T.t - st - 0.6) * 2), E.stk(window.iconSVG('bell', P())));
    // pointing hand that clicks
    const hp = E.ease.inOut(E.prog(T.t, st + 0.1, 0.4));
    if (hp > 0 && T.t < st + 1.3) o += E.at(lerp(620, 450, hp), lerp(860, 680, hp), 1, -20, E.circ(0, 0, 26, P().skin, 'filter="url(#shd)"') + E.rect(-8, -70, 16, 60, 8, P().skin));
    o += mascotAt(800, 800, 1.1, T, { pose: 'wave', mood: 'happy', talk: true, dir: -1 });
    return o;
  };
})();
