// Story / finance templates designed for the ink style (they also work in paper themes).
// Long (16:9) layouts use the empty side zones: logical x from about -580 to 1580.
(function () {
  const E = window.E;
  const S = window.SCENES;
  const P = () => E.theme;
  const pick = (v, d) => (v === undefined || v === null || v === '' ? d : v);
  const wide = () => E.fmt === 'long';
  const items = (sc) => (Array.isArray(sc.items) ? sc.items : []);
  const num = (v) => parseFloat(String(v).replace(/[^0-9.\-]/g, '')) || 0;
  const money = (v, pre = '$', suf = '') => pre + Math.round(v).toLocaleString('en-US') + suf;
  const samAt = (x, y, s, T, o) => E.at(x, y, s * E.pop(T.t, 0.05, 0.5), 0, window.sam(Object.assign({ t: T.t, abs: T.abs, talk: true }, o)));
  // neo-brutalist card: white, ink border, hard shadow (via stk filter)
  const box = (x, y, w, h, fill) => E.stk(E.rect(x, y, w, h, 22, fill || '#fff'));
  // handwritten headline with marker swipe
  const headline = (txt, x, y, T, t0 = 0.1, size = 120) => {
    if (!txt) return '';
    const p = E.ease.out(E.prog(T.t, t0, 0.35));
    const w = E.measure(txt, size, 700) * 0.62;
    return E.marker(x - 14, y - size * 0.62, w, size * 0.75, p, P().d) +
      E.op(p, `<text x="${x}" y="${y}" font-family="${P().hand || 'Caveat'}, cursive" font-size="${size}" font-weight="700" fill="${P().ink}">${E.esc(txt)}</text>`);
  };
  const sub = (txt, x, y, T, t0 = 0.35, size = 40) =>
    txt ? E.op(E.fade(T.t, t0), E.text(txt, x, y, size, P().ink, { anchor: 'start', weight: 500 })) : '';

  // ---------------------------------------------------------------- meet
  S.meet = (sc, T) => {
    const it = items(sc).slice(0, 3);
    const W = wide();
    let o = '';
    o += headline(sc.title || 'Meet Sam.', W ? -440 : 70, W ? 150 : 170, T);
    o += sub(sc.subtitle, W ? -436 : 76, W ? 222 : 238, T);
    o += samAt(W ? -60 : 270, W ? 880 : 900, W ? 1.08 : 0.95, T, { pose: sc.pose || 'wave', mood: sc.mood || 'happy' });
    it.forEach((x, i) => {
      const bh = W ? 160 : 120, maxW = W ? 900 : 975 - 470;
      let cfs = W ? 58 : 42;
      const need = (f) => bh * 1.05 + E.measure(x.label || '', f, 700) + 40;
      if (need(cfs) > maxW) cfs *= (maxW - bh * 1.05 - 40) / (need(cfs) - bh * 1.05 - 40);
      const bw = Math.max(W ? 520 : 380, Math.min(maxW, need(cfs)));
      const bx = W ? 560 : 975 - bw, by = (W ? 230 : 360) + i * (W ? 210 : 165);
      const s = E.pop(T.t, x.t, 0.45);
      const body = box(0, 0, bw, bh) + E.at(bh * 0.55, bh / 2, (bh * 0.62) / 200, 0, window.iconSVG(x.icon || 'star', P())) +
        E.text(x.label || '', bh * 1.05, bh / 2 + 2, cfs, P().ink, { anchor: 'start', weight: 700 });
      o += E.at(bx + bw / 2, by + bh / 2, s, (i % 2 ? 1.5 : -1.5) + E.wob(i + 3, 0.5), `<g transform="translate(${-bw / 2} ${-bh / 2})">${body}</g>`);
    });
    if (sc.note) o += E.note(sc.note, W ? 1250 : 760, W ? 820 : 880, W ? 1110 : 620, W ? 720 : 840, pick(sc.t, 1.4), T, { rot: -6 });
    return o;
  };

  // ---------------------------------------------------------------- budget
  S.budget = (sc, T) => {
    const it = items(sc).slice(0, 5);
    const W = wide();
    const pre = pick(sc.prefix, '$');
    const total = num(sc.total) || it.reduce((a, x) => a + num(x.value), 0);
    const lastT = it.length ? Math.max(...it.map((x) => x.t)) : 0.5;
    const tl = pick(sc.t, lastT + 0.9);
    const shocked = T.t > tl;
    const px = W ? 420 : 455, py = W ? 160 : 230, pw = W ? 760 : 505, ph = W ? 660 : 600;
    let o = '';
    if (sc.title) o += headline(sc.title, W ? -440 : 60, W ? 150 : 170, T, 0.1, W ? 110 : 96);
    o += samAt(W ? -130 : 225, W ? 880 : 900, W ? 0.95 : 0.8, T, { pose: shocked ? 'phone' : 'think', mood: shocked ? 'shock' : 'worried', phoneText: sc.left || '$0' });
    const e = E.pop(T.t, 0.15, 0.5);
    let pnl = box(0, 0, pw, ph);
    const fs = W ? 34 : 28;
    pnl += `<text x="34" y="${W ? 78 : 70}" font-family="${P().font}, sans-serif" font-weight="700" font-size="${W ? 62 : 52}" fill="${P().ink}">${E.esc(sc.total || money(total, pre))}<tspan font-size="${W ? 32 : 26}" font-weight="500" fill="#666"> ${E.esc(pick(sc.period, '/ month'))}</tspan></text>`;
    const top = W ? 130 : 115, rowH = (ph - top - 110) / Math.max(1, it.length);
    const bw = pw - 68;
    const fills = ['url(#hatch)', P().ink, '#8A8A8A', P().d, P().b];
    it.forEach((x, i) => {
      const ry = top + i * rowH + fs;
      const p = E.ease.out(E.prog(T.t, x.t, 0.6));
      if (p <= 0) return;
      const v = num(x.value);
      pnl += E.op(Math.min(1, p * 3), E.text(x.label || '', 34, ry, fs, P().ink, { anchor: 'start', weight: 500 }) +
        E.text(money(v * p, pre), pw - 34, ry, fs, P().ink, { anchor: 'end', weight: 700 }));
      pnl += E.rect(34, ry + 16, bw, 28, 8, '#EEE9DF') + E.rect(34, ry + 16, Math.max(1, (bw * v * p) / total), 28, 8, x.color || fills[i % fills.length], `stroke="${P().ink}" stroke-width="4"`);
    });
    const lp = E.prog(T.t, tl, 0.4);
    if (lp > 0) {
      pnl += E.line(`M34 ${ph - 92} H${pw - 34}`, P().ink, 4, 'stroke-dasharray="10 10"');
      pnl += E.text(pick(sc.left_label, 'Left over'), 34, ph - 44, W ? 44 : 38, P().ink, { anchor: 'start', weight: 700 });
      const s = E.lerp(1.8, 1, E.ease.out(lp));
      pnl += E.at(pw - 110, ph - 46, s, -4, E.rect(-78, -30, 156, 60, 10, sc.left_color || P().a) + E.text(sc.left || '$0', 0, 2, W ? 42 : 38, '#fff', { weight: 700 }));
    }
    o += E.at(px + pw / 2, py + ph / 2, e, E.wob(5, 0.4), `<g transform="translate(${-pw / 2} ${-ph / 2})">${pnl}</g>`);
    if (sc.note) o += W ? E.note(sc.note, 1330, 700, 1200, 800, tl + 0.4, T, { bend: 60, ty: 640 })
      : E.note(sc.note, 760, 915, 600, 860, tl + 0.4, T, { bend: -40, ty: 960, tx: 760 });
    return o;
  };

  // ---------------------------------------------------------------- growth
  S.growth = (sc, T) => {
    const W = wide();
    const pre = pick(sc.prefix, '$');
    const a = num(pick(sc.start_value, 0)), b = num(sc.value);
    const t0 = pick(sc.t, 0.5), dur = Math.max(1.2, T.dur * 0.82 - t0); // ends near the spoken result
    const cx = W ? 300 : 40, cy = W ? 110 : 60, cw = W ? 1000 : 920, ch = W ? 640 : 660;
    let o = '';
    const e = E.pop(T.t, 0.1, 0.5);
    let card = box(0, 0, cw, ch);
    card += E.text(sc.label || '', 36, 62, W ? 44 : 40, P().ink, { anchor: 'start', weight: 700 });
    const gx0 = 70, gx1 = cw - 70, gy0 = ch - 90, gy1 = 150;
    card += E.line(`M${gx0} ${gy1 - 20} V${gy0} H${gx1 + 20}`, P().ink, 6);
    card += E.text(pick(sc.from_label, 'Now'), gx0, gy0 + 46, 30, P().ink, { weight: 500 }) + E.text(sc.years || '', gx1, gy0 + 46, 30, P().ink, { weight: 700 });
    const p = E.ease.inOut(E.prog(T.t, t0, dur));
    const k = 2.2;
    const f = (u) => (Math.exp(k * u) - 1) / (Math.exp(k) - 1);
    if (p > 0) {
      let d = '';
      const n = 60;
      for (let i = 0; i <= n * p; i++) {
        const u = i / n;
        d += `${i ? 'L' : 'M'}${(gx0 + (gx1 - gx0) * u).toFixed(1)} ${(gy0 - (gy0 - gy1) * f(u)).toFixed(1)} `;
      }
      const hx = gx0 + (gx1 - gx0) * p, hy = gy0 - (gy0 - gy1) * f(p);
      card += `<path d="${d} L${hx.toFixed(1)} ${gy0} L${gx0} ${gy0} Z" fill="${P().d}" opacity=".18"/>`;
      card += E.line(d, P().d, 12) + E.circ(hx, hy, 16, P().d, `stroke="${P().ink}" stroke-width="5"`);
      const val = money(a + (b - a) * (p >= 1 ? 1 : f(p)), pre, sc.suffix || '');
      const fsv = W ? 56 : 52;
      const vw = E.measure(val, fsv, 700) + 40;
      const lx = Math.min(hx, cw - vw / 2 - 30);
      card += E.at(lx, hy - 64, 1, -3, E.rect(-vw / 2, -38, vw, 76, 14, p >= 1 ? P().d : '#fff', `stroke="${P().ink}" stroke-width="5"`) + E.text(val, 0, 2, fsv, P().ink, { weight: 700 }));
    }
    o += E.at(cx + cw / 2, cy + ch / 2, e, E.wob(7, 0.3), `<g transform="translate(${-cw / 2} ${-ch / 2})">${card}</g>`);
    const done = T.t > t0 + dur;
    o += samAt(W ? -260 : 160, W ? 880 : 960, W ? 0.95 : 0.42, T, { pose: done ? 'cheer' : 'point', mood: done ? 'excited' : 'think' });
    if (sc.note) o += W ? E.note(sc.note, 1440, 300, 1320, 420, t0 + dur + 0.2, T, { bend: 50, ty: 240 }) : E.note(sc.note, 620, 900, 760, 760, t0 + dur + 0.2, T, { ty: 950 });
    return o;
  };

  // ---------------------------------------------------------------- phone
  S.phone = (sc, T) => {
    const it = items(sc).slice(0, 4);
    const W = wide();
    const fx = W ? 760 : 640, fy = W ? 450 : 460, pw = W ? 470 : 470, ph = W ? 820 : 840;
    let o = '';
    const e = E.pop(T.t, 0.1, 0.5);
    let ph_ = E.stk(E.rect(-pw / 2, -ph / 2, pw, ph, 56, P().ink)) + E.rect(-pw / 2 + 18, -ph / 2 + 18, pw - 36, ph - 36, 42, '#F4F1EA');
    ph_ += E.rect(-60, -ph / 2 + 30, 120, 26, 13, P().ink) + E.text(sc.time || '9:41', 0, -ph / 2 + 120, 64, P().ink, { weight: 700 });
    it.forEach((x, i) => {
      const p = E.ease.back(E.prog(T.t, x.t, 0.45));
      if (p <= 0) return;
      const ny = -ph / 2 + 200 + i * 150;
      const card = E.rect(-pw / 2 + 36, -60, pw - 72, 124, 22, '#fff', `stroke="${P().ink}" stroke-width="5"`) +
        E.circ(-pw / 2 + 96, 2, 42, '#F4F1EA', `stroke="${P().ink}" stroke-width="4"`) + E.at(-pw / 2 + 96, 2, 0.34, 0, window.iconSVG(x.icon || 'bell', P())) +
        E.text(x.title || '', -pw / 2 + 150, -18, 28, P().ink, { anchor: 'start', weight: 700 }) +
        E.text(x.text || '', -pw / 2 + 150, 24, 30, x.color || P().ink, { anchor: 'start', weight: 500 });
      o += '';
      ph_ += E.at(0, E.lerp(ny - 80, ny, Math.min(1, p)), 1, 0, E.op(Math.min(1, p * 2), card));
    });
    o += E.at(fx, fy, e, -3 + E.wob(3, 0.4), ph_);
    const lastT = it.length ? it[it.length - 1].t : 0.5;
    const shocked = T.t > lastT;
    o += samAt(W ? -160 : 200, W ? 880 : 920, W ? 0.95 : 0.72, T, { pose: shocked ? 'shrug' : 'idle', mood: sc.mood || (shocked ? 'shock' : 'happy') });
    if (sc.note) o += W ? E.note(sc.note, 1280, 300, 1010, 360, lastT + 0.4, T, { bend: -40, ty: 240 }) : E.note(sc.note, 200, 150, 380, 260, lastT + 0.4, T, { bend: -40, ty: 95, tx: 30, anchor: 'start', rot: -4 });
    return o;
  };
  // ---------------------------------------------------------------- Maple Street: places and dialogue
  // brand.json "places": { key: { no, name, short, kind: bakery|pharmacy|shop|home|busstop|street, color } }
  const PLACES = () => E.brand.places || {};
  const SHELF = { bakery: ['food', 'coffee', 'egg', 'gift'], pharmacy: ['pill', 'thermometer', 'drop', 'heart'], shop: ['apple', 'fish', 'water', 'gift'] };
  const line = (d, o = 1, w = 8) => `<path d="${d}" fill="none" stroke="${P().ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${o}"/>`;

  // mix a hex colour with white (k = share of white)
  const tint = (hex, k) => {
    const n = parseInt(String(hex).replace('#', ''), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v + (255 - v) * k))));
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  };
  const WOOD = '#C98B5B', WOOD_D = '#A86E44';

  const interior = (pl, T) => {
    if (!pl) return '';
    const W = wide(), x0 = W ? -700 : -100, x1 = W ? 1700 : 1100, kind = pl.kind || 'shop', col = pl.color || E.brand.color;
    const ol = `stroke="${P().ink}" stroke-width="6" stroke-linejoin="round"`;
    let o = '';
    const room = (wall) => E.rect(x0, -500, x1 - x0, 1400, 0, wall) +
      Array.from({ length: Math.ceil((x1 - x0) / 120) }, (_, k) => E.rect(x0 + k * 120, -500, 60, 1400, 0, '#FFFFFF', 'opacity=".18"')).join('') +
      E.rect(x0, 720, x1 - x0, 180, 0, tint(col, 0.55)) + E.rect(x0, 712, x1 - x0, 16, 0, '#FFFFFF', 'opacity=".7"');
    if (SHELF[kind]) {
      o += room(pl.wall || tint(col, 0.86));
      const ic = SHELF[kind], n = W ? 9 : 5, step = (x1 - x0 - 200) / n, sx = x0 + 100;
      [330, 540].forEach((y, r) => {
        o += E.rect(sx - 30, y, x1 - x0 - 140, 26, 13, WOOD, ol);
        for (let k = 0; k < n; k++) o += E.at(sx + step * (k + 0.5), y - 62, 0.62, E.wob(k + r * 9, 2), window.iconSVG(ic[(k + r * 2) % ic.length], P()));
      });
      const name = pl.short || pl.name || '';
      const sw = E.measure(name, 50, 700) + 90;
      o += E.rect(x0 - 20, 690, x1 - x0 + 40, 30, 15, WOOD, ol) + E.rect(x0, 718, x1 - x0, 182, 0, tint(col, 0.25), ol);
      for (let k = 0; k * 160 < x1 - x0; k++) o += E.rect(x0 + 30 + k * 160, 748, 110, 120, 18, '#FFFFFF', 'opacity=".22"');
      // shop name on the counter front, between the characters (the top stays free for speech bubbles)
      o += E.at(500, 810, 1, 0, E.stk(E.rect(-sw / 2, -44, sw, 88, 44, col)) + E.text(name, 0, 3, 50, '#FFFFFF', { weight: 700 }));
    } else if (kind === 'home') {
      o += room(pl.wall || tint(col, 0.8));
      const wx = W ? 1150 : 600;
      o += E.rect(wx, 150, 320, 280, 24, '#CFE8FF', ol) + E.circ(wx + 240, 230, 34, '#FFF3B0') + E.rect(wx + 154, 150, 12, 280, 0, '#FFFFFF') + E.rect(wx, 284, 320, 12, 0, '#FFFFFF');
      o += E.path(`M${wx - 30} 130 Q${wx + 30} 280 ${wx - 10} 450 L${wx - 50} 450 L${wx - 50} 130 Z M${wx + 350} 130 Q${wx + 290} 280 ${wx + 330} 450 L${wx + 370} 450 L${wx + 370} 130 Z`, tint(col, 0.2), ol);
      o += E.rect(wx - 70, 118, 460, 22, 11, WOOD, ol);
      const fx = W ? -420 : 80;
      o += E.rect(fx, 200, 190, 150, 14, '#FFFFFF', ol) + E.at(fx + 95, 275, 0.45, 0, window.iconSVG('heart', P()));
      const px = W ? 1560 : 940;
      o += E.rect(px - 50, 780, 100, 110, 18, '#E7A27A', ol) + [[-50, 690, 60], [40, 700, 55], [-5, 640, 62]].map(([dx, y, r]) => E.circ(px + dx, y, r, '#7BC47F', ol)).join('');
    } else {
      // outdoors (bus stop, street): pastel houses far away, round trees
      const xs = W ? [-560, -200, 160, 520, 880, 1240, 1600] : [-40, 300, 640, 980];
      xs.forEach((x, k) => {
        const c = tint(['#F4A7B9', '#A7D8F4', '#F9D58B', '#B9E4C9', '#D3B8F4'][k % 5], 0.2), h = 260 + 80 * E.hash(k + 3);
        o += E.rect(x - 130, 700 - h, 260, h, 18, c, 'opacity=".75"') + E.path(`M${x - 150} ${700 - h} L${x} ${560 - h} L${x + 150} ${700 - h} Z`, tint(c, -0.1), 'opacity=".75"');
      });
      o += E.rect(x0, 700, x1 - x0, 200, 0, '#E9E4DC') + E.rect(x0, 700, x1 - x0, 12, 0, '#FFFFFF', 'opacity=".8"');
      (W ? [-470, 1420] : [70, 930]).forEach((x, k) => {
        o += E.rect(x - 14, 600, 28, 290, 10, WOOD_D, ol) + E.circ(x, 540, 120, '#8CCB8F', ol) + E.circ(x - 40, 500, 50, '#A8DCA8');
      });
      if (kind === 'busstop') {
        const bx = W ? 1180 : 820;
        o += E.rect(bx - 10, 330, 20, 560, 10, '#9AA5B1', ol) + E.at(bx, 300, 1, Math.sin(T.t * 1.5) * 2, E.stk(E.rect(-100, -60, 200, 120, 60, col)) + E.text(pl.short || 'BUS', 0, 3, 46, '#FFFFFF', { weight: 700 }));
        o += E.rect(W ? -380 : 40, 760, 330, 34, 17, WOOD, ol) + E.rect(W ? -360 : 60, 790, 22, 100, 8, '#9AA5B1') + E.rect(W ? -92 : 328, 790, 22, 100, 8, '#9AA5B1');
      }
    }
    return o;
  };

  S.dialogue = (sc, T) => {
    const W = wide();
    const cast = (sc.cast || []).slice(0, 3).map((c) => String(c).toUpperCase());
    const n = cast.length;
    const xs = W ? { 1: [500], 2: [80, 920], 3: [-180, 500, 1180] }[n] : { 1: [500], 2: [250, 750], 3: [170, 500, 830] }[n];
    const turns = sc.turns || [];
    let ti = -1;
    turns.forEach((u, i) => { if (T.t >= u.s - 0.15) ti = i; });
    const cur = ti >= 0 && T.t <= turns[ti].e + 0.5 ? turns[ti] : null;
    const act = cur && cast.includes(cur.who) ? cur.who : null;
    let o = interior(PLACES()[sc.place], T);
    let bubble = '';
    cast.forEach((who, i) => {
      const lk = E.castLook(who) || {};
      const sz = (W ? 0.9 : 0.72) * (lk.scale || 1) * (E.brand.character_style === 'chibi' ? 1.2 : 1);
      const x = xs[i], talking = who === act;
      const toward = n > 1 ? (x < 500 ? 1 : x > 500 ? -1 : (act && xs[cast.indexOf(act)] < 500 ? -1 : 1)) : 0;
      const pose = (sc.poses || {})[who] || (talking ? ['present', 'point', 'idle'][ti % 3] : 'idle');
      const mood = (sc.moods || {})[who] || 'happy';
      const s = sz * E.pop(T.t, 0.05 + i * 0.12, 0.5);
      o += E.at(x, 900, s, 0, window.sam({ who, t: T.t + i * 0.7, abs: T.abs, talk: talking, pose, mood, look: talking ? 0 : toward }));
      if (talking && sc.bubble !== false) {
        const bw = W ? 620 : 470, fs = W ? 46 : 42, chars = W ? 24 : 18;
        const ls = E.wrap(cur.text, chars).slice(0, 3);
        const bh = ls.length * fs * 1.2 + 60;
        const head = 900 - 560 * sz;
        const bx = Math.max(W ? -560 + bw / 2 : 20 + bw / 2, Math.min(W ? 1560 - bw / 2 : 980 - bw / 2, x + (x < 500 ? 120 : x > 500 ? -120 : 0)));
        const by = Math.max(bh / 2 + 20, head - bh / 2 - 70);
        const p = E.pop(T.t, cur.s - 0.1, 0.35);
        const tx = x - bx;
        const body = E.stk(E.rect(-bw / 2, -bh / 2, bw, bh, 34, '#fff') + E.path(`M${tx - 30} ${bh / 2 - 8} L${tx * 0.85} ${bh / 2 + 56} L${tx + 30} ${bh / 2 - 8} Z`, '#fff')) +
          E.para(cur.text, 0, 0, fs, P().ink, chars, { maxLines: 3, weight: 600 });
        bubble = E.at(bx, by, p, E.wob(ti + 2, 0.6), body);
      }
    });
    return o + bubble;
  };

  // one building front, door at the bottom centre, feet line y = 0
  const building = (pl, w, hl) => {
    const kind = pl.kind || 'shop', col = pl.color || E.brand.color, ink = P().ink;
    const st = `stroke="${ink}" stroke-width="8" stroke-linejoin="round"`;
    const h = kind === 'home' ? 300 : 340;
    let o = '';
    if (kind === 'busstop') {
      o += line(`M0 0 V-300`, 1, 12) + E.at(0, -320, 1, 0, E.rect(-70, -45, 140, 90, 45, col, st) + E.text(pl.short || 'BUS', 0, 2, 34, '#fff', { weight: 700 }));
      o += line(`M-110 -90 h150 M-100 -90 v90 M30 -90 v90`, 0.8, 8);
    } else if (kind === 'street') {
      return '';
    } else {
      if (kind === 'home') o += E.path(`M${-w / 2 - 20} ${-h} L0 ${-h - 150} L${w / 2 + 20} ${-h} Z`, col, st);
      o += E.rect(-w / 2, -h, w, h, 6, '#FFFFFF', st);
      if (kind !== 'home') {
        o += E.rect(-w / 2 - 10, -h - 10, w + 20, 60, 6, col, st);
        for (let k = 0; k < 6; k++) o += E.path(`M${-w / 2 - 10 + (k * (w + 20)) / 6} ${-h + 50} q${(w + 20) / 12} 36 ${(w + 20) / 6} 0`, k % 2 ? '#fff' : col, st);
        o += E.rect(-w / 2 + 24, -h + 120, w * 0.36, 110, 6, '#EAF4FF', st);
        if (kind === 'pharmacy') o += E.path('M-12 -36 h24 v24 h24 v24 h-24 v24 h-24 v-24 h-24 v-24 h24 Z', '#E5484D', st).replace('<path', `<path transform="translate(${w / 4} ${-h + 170})"`);
        o += E.text(pl.short || pl.name || '', 0, -h + 22, Math.min(34, (w * 1.6) / Math.max(4, (pl.short || pl.name || '').length)), '#fff', { weight: 700 });
      } else {
        o += E.rect(-w / 2 + 24, -h + 50, 80, 80, 6, '#EAF4FF', st) + E.rect(w / 2 - 104, -h + 50, 80, 80, 6, '#EAF4FF', st);
      }
      o += E.rect(-38, -150, 76, 150, 8, col, st) + E.circ(22, -75, 6, ink);
      o += E.at(w / 2 - 44, -190, 1, 0, E.circ(0, 0, 30, hl ? P().c : '#fff', st) + E.text(String(pl.no == null ? '' : pl.no), 0, 2, 30, ink, { weight: 700 }));
    }
    return o;
  };

  S.location = (sc, T) => {
    const W = wide();
    const all = Object.entries(PLACES()).filter(([, v]) => v.no != null).sort((a, b) => a[1].no - b[1].no);
    const ti = Math.max(0, all.findIndex(([k]) => k === sc.place));
    const bw = 280, gap = 70, n = all.length || 1;
    const rowW = n * bw + (n - 1) * gap;
    const xOf = (i) => -rowW / 2 + bw / 2 + i * (bw + gap);
    const vis = W ? 2100 : 1000;
    const k0 = Math.min(1, (vis - 60) / rowW), k1 = W ? 1.7 : 1.45;
    // camera zooms in right away; the name sign and the episode card follow (sign on the AT word if later)
    const p = E.ease.inOut(E.prog(T.t, 0.25, 1.1));
    const t0 = Math.max(0.35, Math.min(pick(sc.t, 0.35), 1.6) - 1.0);
    const k = E.lerp(k0, k1, p);
    const fx = E.lerp(0, xOf(ti), p);
    const gy = W ? 760 : 820;
    let street = line(`M${-rowW} 0 H${rowW}`, 1, 10) + E.rect(-rowW, 10, rowW * 2, 70, 0, '#D9D4C7') + line(`M${-rowW} 45 H${rowW}`, 0.5, 6).replace('opacity', 'stroke-dasharray="40 40" opacity');
    all.forEach(([key, pl], i) => {
      if (i < n - 1) street += E.op(0.8, E.at(xOf(i) + (bw + gap) / 2, -10, 0.55, 0, window.iconSVG('tree', P())));
      street += E.at(xOf(i), 0, 1, 0, building(pl, bw, key === sc.place && p > 0.6));
    });
    let o = `<g transform="translate(500 ${gy}) scale(${k.toFixed(4)}) translate(${(-fx).toFixed(1)} 0)">${street}</g>`;
    const pl = (all[ti] || [])[1];
    if (pl) {
      const sp = E.pop(T.t, t0 + 1.0, 0.45);
      const nm = pl.name || '';
      const nw = E.measure(nm, 54, 700) + 80;
      o += E.at(500, W ? 120 : 200, sp, E.wob(7, 0.8), E.stk(E.rect(-nw / 2, -48, nw, 96, 20, pl.color || E.brand.color)) + E.text(nm, 0, 3, 54, '#fff', { weight: 700 }));
    }
    if (sc.title) o += headline(sc.title, W ? -500 : 60, W ? 150 : 380, T, t0 + 1.3, W ? 96 : 88);
    o += sub(sc.subtitle, W ? -496 : 66, W ? 222 : 440, T, t0 + 1.5);
    if (sc.badge) {
      const bp = E.pop(T.t, t0 + 1.6, 0.45);
      o += E.at(W ? 1460 : 880, W ? 130 : 380, bp, -8, E.stk(E.circ(0, 0, 70, P().c)) + E.text(sc.badge, 0, 4, 54, P().ink, { weight: 700 }));
    }
    return o;
  };
  // ---------------------------------------------------------------- repeat (speaking practice)
  // Turns from the scene's lines: a cast member says the phrase (slowly), then the silent pause is the
  // viewer's turn: the phrase stays on a card, a mic with a countdown ring, then a praise burst.
  // A narrator line right after a pause is shown as spoken praise; other narrator lines as the header.
  const PRAISE = ['Great job!', 'Nice!', 'Perfect!', 'Well done!', 'You got it!', 'Awesome!'];
  const mic = (x, y, s, p, col) => {
    const ring = 2 * Math.PI * 92;
    return E.at(x, y, s, 0,
      E.circ(0, 0, 92, '#FFFFFF', `stroke="${P().ink}" stroke-width="6"`) +
      `<circle cx="0" cy="0" r="92" fill="none" stroke="${col}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${(ring * p).toFixed(1)} ${ring.toFixed(1)}" transform="rotate(-90)"/>` +
      E.rect(-26, -58, 52, 84, 26, col, `stroke="${P().ink}" stroke-width="6"`) +
      `<path d="M-40 0 Q-40 44 0 44 Q40 44 40 0 M0 44 V62 M-22 62 H22" fill="none" stroke="${P().ink}" stroke-width="7" stroke-linecap="round"/>`);
  };
  const burst = (x, y, p, seed) => {
    if (p <= 0 || p >= 1) return '';
    let o = '';
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 + seed, r = 80 + 260 * E.ease.out(p);
      const c = ['#FFD43B', '#FF8FA3', '#7CC4FF', '#8CCB8F'][k % 4];
      o += E.op(1 - p, E.at(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7, 0.6 + 0.4 * (1 - p), p * 200, E.path('M0 -22 L6 -6 L22 0 L6 6 L0 22 L-6 6 L-22 0 L-6 -6 Z', c)));
    }
    return o;
  };

  S.repeat = (sc, T) => {
    const W = wide();
    const who = String((sc.cast || [])[0] || '').toUpperCase();
    const turns = sc.turns || [];
    const CAST = (E.brand.voice || {}).cast || {};
    const NARR = Object.keys(CAST).find((k) => CAST[k].default);
    const narr = (u) => !u.who || u.who === NARR;
    const col = (E.castLook(who) || {}).hoodie || E.brand.color;
    // state at time t
    let st = { mode: 'intro', text: '', u: null };
    turns.forEach((u, i) => {
      const next = turns[i + 1], end = next ? next.s : T.dur;
      if (T.t < u.s - 0.15) return;
      if (narr(u)) {
        const prev = turns[i - 1];
        st = prev && !narr(prev) ? { mode: 'praise', text: u.text, t0: u.s - 0.15, u } : { mode: 'intro', text: u.text, u };
      } else if (T.t <= u.e + 0.1) st = { mode: 'listen', text: u.text, u, other: u.who !== who };
      else {
        const gap = end - u.e, auto = !(next && narr(next)) && gap > 1.5;
        const praiseAt = end - 0.9;
        st = auto && T.t >= praiseAt ? { mode: 'praise', text: PRAISE[(sc._seed + i) % PRAISE.length], t0: praiseAt, u, phrase: u.text }
          : { mode: 'yourturn', text: u.text, u, p: E.clamp((T.t - u.e) / Math.max(0.5, gap - (auto ? 0.9 : 0))), other: u.who !== who };
      }
    });
    let o = interior((E.brand.places || {})[sc.place], T);
    const cx = W ? -40 : 250, cs = (W ? 0.95 : 0.78) * (E.brand.character_style === 'chibi' ? 1.05 : 1);
    const mood = st.mode === 'praise' ? 'excited' : st.mode === 'yourturn' ? 'smile' : 'happy';
    const pose = st.mode === 'praise' ? 'cheer' : st.mode === 'yourturn' ? 'present' : st.mode === 'listen' ? 'point' : 'wave';
    o += E.at(cx, 900, cs * E.pop(T.t, 0.05, 0.5), 0, window.sam({ who, t: T.t, abs: T.abs, talk: st.mode === 'listen' && !st.other, pose, mood, look: 1 }));
    // card on the right
    const kx = W ? 900 : 640, ky = W ? 420 : 380, kw = W ? 1080 : 620, kh = W ? 520 : 560;
    const label = { intro: 'Your turn!', listen: st.other ? 'Listen to the question' : 'Listen', yourturn: st.other ? 'Now you answer!' : 'Now you say it!', praise: '' }[st.mode];
    let card = E.stk(E.rect(-kw / 2, -kh / 2, kw, kh, 48, '#FFFFFF'));
    card += E.rect(-kw / 2 + 40, -kh / 2 + 36, E.measure(label, 44, 700) + 60, 70, 35, st.mode === 'yourturn' ? col : tint(col, 0.75)) +
      E.text(label, -kw / 2 + 70, -kh / 2 + 73, 44, st.mode === 'yourturn' ? '#FFFFFF' : P().ink, { anchor: 'start', weight: 700 });
    if (st.mode === 'intro') {
      card += mic(0, 30, 1.1, 0, col) + E.para(st.text || 'Listen and repeat.', 0, kh / 2 - 80, 40, P().ink, W ? 40 : 26, { maxLines: 2, weight: 600 });
    } else if (st.mode === 'praise') {
      const pp = E.pop(T.t, st.t0, 0.5);
      card += E.at(0, -20, pp, E.wob(3, 2), E.text(st.text, 0, 0, W ? 110 : 84, col, { weight: 700 }));
      card += E.at(0, 110, pp, 0, E.text('★ ★ ★', 0, 0, 64, '#FFD43B', { weight: 700 }));
      if (st.phrase) card += E.op(0.6, E.para(st.phrase, 0, kh / 2 - 70, 34, P().ink, W ? 44 : 30, { maxLines: 2, weight: 600 }));
    } else {
      // the phrase stays readable while the character is silent; words light up while it is spoken
      const fs = W ? 76 : 60, chars = W ? 24 : 16;
      card += E.para(st.text, W ? 120 : 0, st.mode === 'yourturn' ? -10 : 10, fs, P().ink, chars, { maxLines: 3, weight: 700 });
      if (st.mode === 'yourturn') card += mic(W ? -kw / 2 + 160 : 0, W ? 20 : kh / 2 - 110, W ? 0.95 : 0.7, st.p, col);
      else card += E.at(W ? -kw / 2 + 160 : 0, W ? 20 : kh / 2 - 100, 0.9, 0, window.iconSVG('chat', P()));
    }
    o += E.at(kx, ky, E.pop(T.t, 0.2, 0.5), E.wob(sc._seed || 1, 0.5), card);
    if (st.mode === 'praise') o += burst(kx, ky, E.prog(T.t, st.t0, 1.0), sc._seed || 0);
    return o;
  };
})();
