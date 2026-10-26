// Ink-style character "Sam": stick figure with a hoodie in the brand colour.
// Drawn with the feet at (0,0); about 580 units tall. Name/colour from brand.json -> mascot.
(function () {
  const E = window.E;
  const POSES = {
    // [leftArmDeg, rightArmDeg, rightBend] ; degrees from straight down, positive = outward
    idle: [18, 18, 0],
    wave: [18, 150, 0],
    point: [18, 95, 0],
    cheer: [155, 155, 0],
    shrug: [115, 115, 0],
    think: [18, 165, -70],
    phone: [18, 150, 40],
    facepalm: [18, 170, -95],
    thumbsup: [18, 125, -45],
    present: [18, 72, 10],
  };
  const arm = (side, deg, bend, ink, sw) => {
    const sx = side * 64, sy = -330;
    const a = (deg * Math.PI) / 180;
    const len = 150;
    const ex = sx + side * Math.sin(a) * len, ey = sy + Math.cos(a) * len;
    const mx = (sx + ex) / 2 + side * bend, my = (sy + ey) / 2 + Math.abs(bend) * 0.3;
    return { d: `M${sx} ${sy} Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`, ex, ey, sw };
  };

  // brand.json voice.cast[WHO] -> look: { hoodie, hair, hair_color, item(s), item_color, scale }
  E.castLook = (who) => {
    const C = (E.brand.voice || {}).cast || {};
    const c = who && (C[who] || C[String(who).toUpperCase()]);
    return c ? Object.assign({ hoodie: c.color }, c.look || {}) : null;
  };

  window.sam = function (o = {}) {
    const LK = E.castLook(o.who);
    const M = Object.assign({ scarf: '#19C37D' }, E.brand.mascot || {}, LK || {});
    const T = E.theme;
    const ink = T.ink;
    const its = LK ? [].concat(LK.items || LK.item || []) : [];
    const has = (k) => its.includes(k);
    const hood = has('coat') ? '#FFFFFF' : M.hoodie || M.scarf;
    const ic = LK && LK.item_color || ink;
    const t = o.t || 0;
    const pose = o.pose || 'idle';
    const mood = o.mood || 'happy';
    const dir = o.dir || 1;
    const sw = 10;
    const P = POSES[pose] || POSES.idle;
    let [L, R, bendR] = P;
    if (pose === 'wave') R += Math.sin(t * 9) * 20;
    if (pose === 'cheer') { L += Math.sin(t * 8) * 8; R -= Math.sin(t * 8) * 8; }
    const bob = Math.abs(Math.sin(t * 3.6)) * -8;
    const st = `stroke="${ink}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"`;
    let s = '';
    // legs (little bounce when cheering)
    const kick = pose === 'cheer' ? Math.sin(t * 8) * 10 : 0;
    s += `<path d="M-34 -170 L${-56 - kick} 0 M34 -170 L${60 + kick} 0 M${-72 - kick} 0 h30 M${46 + kick} 0 h34" fill="none" ${st}/>`;
    // body group bobs
    let b = '';
    const la = arm(-1, L, 0), ra = arm(1, R, bendR);
    if (has('backpack')) b += E.rect(-104, -340, 70, 150, 22, ic, st);
    b += `<path d="${la.d}" fill="none" ${st}/>`;
    b += `<path d="M-66 -350 Q-78 -250 -58 -160 L58 -160 Q78 -250 66 -350 Q0 -378 -66 -350 Z" fill="${hood}" ${st}/>`;
    if (has('coat')) b += `<path d="M-30 -350 L0 -250 L30 -350" fill="${ic}" ${st}/><path d="M0 -250 V-165" fill="none" ${st} opacity=".55"/>`;
    else if (has('cardigan')) b += `<path d="M0 -350 V-162" fill="none" ${st}/>` + [-300, -250, -200].map((y) => E.circ(14, y, 6, ink)).join('');
    else if (has('vest')) b += `<path d="M-30 -350 L0 -290 L30 -350" fill="#fff" ${st}/>` + E.rect(18, -250, 30, 24, 4, 'none', st.replace(`stroke-width="${sw}"`, 'stroke-width="6"'));
    else b += `<path d="M-28 -345 Q0 -312 28 -345 M-28 -230 h56" fill="none" ${st} opacity=".55"/>`;
    if (has('apron')) b += `<path d="M-38 -335 L-46 -170 L46 -170 L38 -335 Z" fill="${LK.apron || '#FFFFFF'}" ${st}/><path d="M-60 -270 H60" fill="none" ${st}/>` + E.rect(-20, -240, 40, 30, 6, 'none', st.replace(`stroke-width="${sw}"`, 'stroke-width="5"'));
    if (has('backpack')) b += `<path d="M-50 -350 Q-36 -280 -46 -200" fill="none" ${st}/>`;
    if (has('scarf')) b += `<path d="M-50 -362 Q0 -330 50 -362 L48 -340 Q0 -310 -48 -340 Z M24 -340 l14 70 l-26 0 Z" fill="${ic}" ${st}/>`;
    // head
    const hy = -450;
    if (has('headphones')) b += E.rect(-96, hy - 34, 30, 64, 14, ic, st) + E.rect(66, hy - 34, 30, 64, 14, ic, st);
    b += E.circ(0, hy, 76, '#fff', st);
    const hc = LK && LK.hair_color || ink;
    const cap = `M-76 ${hy - 4} Q-82 ${hy - 92} 0 ${hy - 86} Q82 ${hy - 92} 76 ${hy - 4} Q64 ${hy - 54} 0 ${hy - 58} Q-64 ${hy - 54} -76 ${hy - 4} Z`;
    const hair = LK && LK.hair || 'messy';
    if (hair === 'messy') b += `<path d="M-56 ${hy - 46} Q-40 ${hy - 96} 6 ${hy - 82} Q2 ${hy - 104} 40 ${hy - 90} Q66 ${hy - 76} 60 ${hy - 40}" fill="none" ${st}/>`;
    else if (hair === 'short') b += E.path(cap, hc, st);
    else if (hair === 'long') b += E.path(`M-76 ${hy - 10} Q-100 ${hy + 50} -74 ${hy + 96} L-56 ${hy + 20} Z M76 ${hy - 10} Q100 ${hy + 50} 74 ${hy + 96} L56 ${hy + 20} Z`, hc, st) + E.path(cap, hc, st);
    else if (hair === 'bun') b += E.circ(0, hy - 100, 30, hc, st) + E.path(cap, hc, st);
    else if (hair === 'ponytail') b += E.path(`M60 ${hy - 50} Q120 ${hy - 40} 104 ${hy + 50} Q90 ${hy - 10} 56 ${hy - 20} Z`, hc, st) + E.path(cap, hc, st);
    else if (hair === 'curly') b += [-60, -30, 0, 30, 60].map((x, i) => E.circ(x, hy - 66 - (i % 2) * 12, 26, hc, st)).join('');
    else if (hair === 'bald') b += `<path d="M-74 ${hy - 10} Q-80 ${hy - 40} -66 ${hy - 50} M74 ${hy - 10} Q80 ${hy - 40} 66 ${hy - 50}" fill="none" ${st} stroke="${hc}"/>`;
    if (has('cap')) b += E.path(`M-78 ${hy - 30} Q-76 ${hy - 104} 0 ${hy - 100} Q76 ${hy - 104} 78 ${hy - 30} Z`, ic, st) + `<path d="M40 ${hy - 32} Q100 ${hy - 40} 130 ${hy - 22}" fill="none" ${st}/>`;
    if (has('headphones')) b += `<path d="M-82 ${hy - 20} Q-86 ${hy - 120} 0 ${hy - 118} Q86 ${hy - 120} 82 ${hy - 20}" fill="none" ${st} stroke="${ic}" stroke-width="16"/>`;
    if (has('pencil')) b += E.at(70, hy - 60, 1, 35, E.rect(-6, -40, 12, 80, 3, '#FFC94D', st.replace(`stroke-width="${sw}"`, 'stroke-width="5"')));
    const blink = t % 3.7 > 3.55;
    const lx = (o.look || 0) * 8;
    const ey = hy - 6;
    const dot = (x) => E.circ(x + lx, ey, 7, ink);
    if (mood === 'shock') {
      b += E.circ(-26, ey, 15, '#fff', st.replace(`stroke-width="${sw}"`, 'stroke-width="6"')) + E.circ(26, ey, 15, '#fff', st.replace(`stroke-width="${sw}"`, 'stroke-width="6"')) + E.circ(-24 + lx, ey + 2, 5.5, ink) + E.circ(28 + lx, ey + 2, 5.5, ink);
      b += `<path d="M-46 ${ey - 26} Q-28 ${ey - 44} -10 ${ey - 32} M46 ${ey - 26} Q28 ${ey - 44} 10 ${ey - 32}" fill="none" ${st} stroke-width="7"/>`;
    } else if (mood === 'excited') {
      // star eyes
      const star = (cx) => E.path(`M${cx} ${ey - 14} L${cx + 4} ${ey - 4} L${cx + 14} ${ey - 3} L${cx + 6} ${ey + 4} L${cx + 9} ${ey + 14} L${cx} ${ey + 8} L${cx - 9} ${ey + 14} L${cx - 6} ${ey + 4} L${cx - 14} ${ey - 3} L${cx - 4} ${ey - 4} Z`, T.c, `stroke="${ink}" stroke-width="3"`);
      b += star(-24 + lx) + star(24 + lx);
    } else if (mood === 'smug') {
      b += `<path d="M-38 ${ey} h24 M14 ${ey} h24" fill="none" ${st} stroke-width="7"/>` + E.circ(-26 + lx, ey + 6, 5, ink) + E.circ(26 + lx, ey + 6, 5, ink);
    } else if (blink) {
      b += `<path d="M-34 ${ey} h18 M16 ${ey} h18" fill="none" ${st} stroke-width="7"/>`;
    } else {
      b += dot(-24) + dot(24);
    }
    if (mood === 'sad') b += `<path d="M-42 ${ey - 30} L-12 ${ey - 20} M42 ${ey - 30} L12 ${ey - 20}" fill="none" ${st} stroke-width="7"/>`;
    if (mood === 'worried') b += `<path d="M-40 ${ey - 22} L-14 ${ey - 32} M40 ${ey - 22} L14 ${ey - 32}" fill="none" ${st} stroke-width="7"/>`;
    if (mood === 'think') b += `<path d="M-40 ${ey - 24} L-12 ${ey - 28} M12 ${ey - 34} L40 ${ey - 24}" fill="none" ${st} stroke-width="7"/>`;
    // mouth
    const abs = o.abs == null ? t : o.abs;
    const talking = o.talk && E.speaking(abs);
    const open = talking ? E.clamp(E.amp(abs) * 1.25) : 0;
    const my = hy + 36;
    if (mood === 'shock') b += E.ell(2, my, 11 + 3 * open, 15 + 4 * open, ink);
    else if (mood === 'sad') b += `<path d="M-16 ${my + 8} Q0 ${my - 6} 16 ${my + 8}" fill="none" ${st} stroke-width="7"/>`;
    else if (mood === 'smug') b += `<path d="M-14 ${my} Q8 ${my + 10} 22 ${my - 8}" fill="none" ${st} stroke-width="7"/>`;
    else if (mood === 'excited') b += E.path(`M-24 ${my - 6} Q0 ${my + 30 + 8 * open} 24 ${my - 6} Z`, ink) + E.ell(0, my + 10 + 4 * open, 9, 5, '#FF8A8A');
    else if (mood === 'worried') b += `<path d="M-18 ${my + 4} q6 -6 12 0 t12 0 t12 0" fill="none" ${st} stroke-width="6"/>`;
    else if (open > 0.05) b += E.ell(0, my + 2, 14, 4 + 12 * open, ink);
    else if (mood === 'think') b += `<path d="M-12 ${my + 2} h24" fill="none" ${st} stroke-width="7"/>`;
    else b += `<path d="M-18 ${my - 2} Q0 ${my + 16} 18 ${my - 2}" fill="none" ${st} stroke-width="7"/>`;
    if (has('glasses')) b += `<g fill="none" ${st} stroke-width="6"><circle cx="-26" cy="${hy - 6}" r="22"/><circle cx="26" cy="${hy - 6}" r="22"/><path d="M-4 ${hy - 8} h8 M-48 ${hy - 10} l-24 -6 M48 ${hy - 10} l24 -6"/></g>`;
    if (has('flour')) b += E.ell(-44, hy + 22, 16, 9, '#FFFFFF', `opacity=".9" stroke="${ink}" stroke-width="2"`);
    // shock lines
    if (mood === 'shock') b += `<path d="M-100 ${hy - 70} l-18 -24 M104 ${hy - 74} l20 -22 M0 ${hy - 120} v-26" fill="none" ${st} stroke-width="8"/>`;
    if (mood === 'sad') b += E.path(`M60 ${hy - 10} q8 18 0 26 q-8 -8 0 -26 Z`, '#7CC4FF', `stroke="${ink}" stroke-width="4"`);
    if (mood === 'worried') b += E.path(`M-70 ${hy - 40 + Math.abs(Math.sin(t * 3)) * 6} q9 20 0 29 q-9 -9 0 -29 Z`, '#7CC4FF', `stroke="${ink}" stroke-width="4"`);
    if (mood === 'excited') b += `<path d="M-100 ${hy - 60} l-14 -14 M104 ${hy - 64} l14 -14 M-110 ${hy} h-18 M114 ${hy} h18" fill="none" ${st} stroke-width="7"/>`;
    // right arm on top (+ phone)
    b += `<path d="${ra.d}" fill="none" ${st}/>`;
    if (pose === 'thumbsup') {
      b += E.rect(ra.ex - 14, ra.ey - 16, 28, 26, 9, '#fff', st.replace(`stroke-width="${sw}"`, 'stroke-width="7"')) +
        E.rect(ra.ex - 6, ra.ey - 44, 12, 30, 6, '#fff', st.replace(`stroke-width="${sw}"`, 'stroke-width="7"'));
    }
    if (pose === 'phone') {
      b += E.at(ra.ex + 8, ra.ey - 30, 1, 12, E.rect(-34, -56, 68, 112, 12, '#fff', st.replace(`stroke-width="${sw}"`, 'stroke-width="8"')) +
        `<g transform="scale(${dir} 1)">${E.text(o.phoneText || '$0.00', 0, 0, 20, T.a, { weight: 700 })}</g>`);
    }
    return `<g transform="scale(${dir} 1)">${s}<g transform="translate(0 ${bob.toFixed(1)})">${b}</g></g>`;
  };
  // Sam placed with feet at (x, y)
  E.samAt = (x, y, s, o) => E.at(x, y, s, 0, window.sam(o));
})();
