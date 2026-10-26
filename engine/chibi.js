// Sticker-style "chibi" characters: big round head, tiny body, blush, expressive eyes and emotes.
// Used instead of the ink stick figure when brand.json has "character_style": "chibi".
// Same footprint as sam(): feet at (0,0), about 580 units tall, same pose/mood/talk/look options.
(function () {
  const E = window.E;
  const OL = '#3A2E2B';
  const POSES = {
    idle: [20, 20], wave: [20, 150], point: [20, 95], cheer: [150, 150], shrug: [110, 110], think: [20, 160],
    phone: [20, 140], facepalm: [20, 170], thumbsup: [20, 120], present: [20, 70],
  };
  const st = (w = 7) => `stroke="${OL}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const star = (cx, cy, r, fill) => {
    let d = '';
    for (let k = 0; k < 10; k++) {
      const a = (Math.PI / 5) * k - Math.PI / 2, rr = k % 2 ? r * 0.45 : r;
      d += (k ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1);
    }
    return E.path(d + 'Z', fill, st(4));
  };
  const heart = (cx, cy, s, fill) =>
    `<path transform="translate(${cx} ${cy}) scale(${s})" d="M0 8 C-14 -4 -22 -14 -12 -22 C-6 -26 -1 -22 0 -16 C1 -22 6 -26 12 -22 C22 -14 14 -4 0 8 Z" fill="${fill}" ${st(3 / s)}/>`;

  window.chibi = function (o = {}) {
    const LK = E.castLook(o.who) || {};
    const M = Object.assign({}, E.brand.mascot || {}, LK);
    const t = o.t || 0, mood = o.mood || 'happy', pose = o.pose || 'idle', dir = o.dir || 1;
    const its = [].concat(LK.items || LK.item || []);
    const has = (k) => its.includes(k);
    const skin = LK.skin || '#FFFFFF';
    const outfit = has('coat') ? '#FFFFFF' : M.hoodie || E.brand.color;
    const ic = LK.item_color || OL;
    const hc = LK.hair_color || '#3B2A20';
    const abs = o.abs == null ? t : o.abs;
    const talking = o.talk && E.speaking(abs);
    const open = talking ? E.clamp(E.amp(abs) * 1.3) : 0;
    let [L, R] = POSES[pose] || POSES.idle;
    if (pose === 'wave') R += Math.sin(t * 9) * 22;
    if (pose === 'cheer') { L += Math.sin(t * 8) * 10; R -= Math.sin(t * 8) * 10; }
    const breathe = 1 + Math.sin(t * 3) * 0.015;
    const hop = pose === 'cheer' || mood === 'excited' || mood === 'laugh' ? Math.abs(Math.sin(t * 7)) * -22 : 0;
    const nod = talking ? Math.sin(abs * 11) * 4 : 0;
    const tilt = Math.sin(t * 1.4) * 2.5 + (mood === 'think' ? -8 : 0) + (o.look || 0) * 4;
    const hy = -345;

    // ---------- body (behind the head)
    let b = '';
    b += E.ell(0, 4, 95, 14, '#000', 'opacity=".08"');
    if (has('backpack')) b += E.rect(-122, -190, 70, 130, 26, ic, st());
    const arm = (side, deg) => {
      const sx = side * 62, sy = -168, a = (deg * Math.PI) / 180, len = 82;
      const ex = sx + side * Math.sin(a) * len, ey = sy + Math.cos(a) * len;
      const d = `M${sx} ${sy} L${ex.toFixed(1)} ${ey.toFixed(1)}`;
      return { svg: `<path d="${d}" stroke="${OL}" stroke-width="44" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${outfit}" stroke-width="30" stroke-linecap="round" fill="none"/>` + E.circ(ex, ey, 19, skin, st(6)), ex, ey };
    };
    const la = arm(-1, L), ra = arm(1, R);
    b += E.ell(-40, -16, 36, 20, M.shoes || '#6B4F3A', st()) + E.ell(40, -16, 36, 20, M.shoes || '#6B4F3A', st());
    b += E.path('M-66 -205 Q-112 -70 -84 -28 Q0 -12 84 -28 Q112 -70 66 -205 Z', outfit, st());
    if (has('coat')) b += E.path('M-26 -205 L0 -140 L26 -205 Z', ic, st(5)) + `<path d="M0 -140 V-30" fill="none" ${st(5)} opacity=".5"/>`;
    if (has('cardigan')) b += `<path d="M0 -200 V-28" fill="none" ${st(5)}/>` + [-160, -115, -70].map((y) => E.circ(14, y, 6, OL)).join('');
    if (has('vest')) b += E.path('M-30 -205 L0 -150 L30 -205 Z', '#FFFFFF', st(5)) + E.rect(20, -110, 30, 24, 6, 'none', st(5));
    if (has('apron')) b += E.path(`M-46 -180 Q-56 -80 -58 -36 Q0 -24 58 -36 Q56 -80 46 -180 Z`, LK.apron || '#FFFFFF', st(6)) + E.rect(-20, -110, 40, 28, 8, 'none', st(5));
    if (has('backpack')) b += `<path d="M-52 -200 Q-40 -140 -50 -80" fill="none" ${st(9)} stroke="${OL}"/>`;
    b += la.svg + ra.svg;
    if (pose === 'phone') b += E.at(ra.ex + 4, ra.ey - 30, 1, 10, E.rect(-24, -40, 48, 80, 10, '#FFFFFF', st(6)) + E.rect(-16, -30, 32, 50, 4, '#BFE3FF'));
    if (pose === 'thumbsup') b += E.at(ra.ex, ra.ey - 30, 1, 0, E.rect(-8, -22, 16, 30, 8, skin, st(5)));

    // ---------- head
    let h = '';
    if ((LK.hair || '') === 'bun') h += E.circ(0, hy - 150, 52, hc, st());
    if ((LK.hair || '') === 'ponytail') h += E.path(`M120 ${hy - 80} Q230 ${hy - 70} 205 ${hy + 70} Q190 ${hy + 120} 160 ${hy + 90} Q190 ${hy} 110 ${hy - 30} Z`, hc, st());
    if ((LK.hair || '') === 'long') h += E.path(`M-150 ${hy - 20} Q-180 ${hy + 110} -130 ${hy + 160} L-90 ${hy + 60} Z M150 ${hy - 20} Q180 ${hy + 110} 130 ${hy + 160} L90 ${hy + 60} Z`, hc, st());
    if (has('headphones')) h += E.rect(-180, hy - 40, 44, 84, 20, ic, st()) + E.rect(136, hy - 40, 44, 84, 20, ic, st());
    if (has('scarf')) h += E.path(`M-80 ${hy + 128} Q0 ${hy + 168} 80 ${hy + 128} L76 ${hy + 160} Q0 ${hy + 196} -76 ${hy + 160} Z M30 ${hy + 160} l24 70 l-36 4 Z`, ic, st(6));
    h += E.ell(0, hy, 160, 142, skin, st(8));
    const cap = `M-160 ${hy + 10} Q-176 ${hy - 160} 0 ${hy - 148} Q176 ${hy - 160} 160 ${hy + 10} Q146 ${hy - 70} 70 ${hy - 82} Q40 ${hy - 44} 6 ${hy - 86} Q-40 ${hy - 48} -64 ${hy - 86} Q-140 ${hy - 70} -160 ${hy + 10} Z`;
    const hair = LK.hair || 'messy';
    if (hair === 'curly') h += [-120, -70, -20, 30, 80, 125].map((x, i) => E.circ(x, hy - 108 - (i % 2) * 18 + Math.abs(x) * 0.18, 44, hc, st(6))).join('');
    else if (hair === 'bald') h += E.path(`M-156 ${hy - 4} Q-170 ${hy - 50} -138 ${hy - 66} Q-130 ${hy - 30} -150 ${hy + 10} Z M156 ${hy - 4} Q170 ${hy - 50} 138 ${hy - 66} Q130 ${hy - 30} 150 ${hy + 10} Z`, hc, st(5)) + `<path d="M-30 ${hy - 120} q20 -16 40 0" fill="none" ${st(5)} opacity=".45"/>`;
    else if (hair === 'messy') h += E.path(cap, hc, st()) + E.path(`M-40 ${hy - 140} l-10 -46 l40 30 l20 -44 l14 50 Z`, hc, st());
    else h += E.path(cap, hc, st());
    if (has('cap')) h += E.path(`M-150 ${hy - 50} Q-150 ${hy - 175} 0 ${hy - 172} Q150 ${hy - 175} 150 ${hy - 50} Z`, ic, st()) + E.path(`M60 ${hy - 56} Q170 ${hy - 70} 220 ${hy - 40} Q150 ${hy - 30} 60 ${hy - 40} Z`, ic, st());
    if (has('headphones')) h += `<path d="M-158 ${hy - 30} Q-160 ${hy - 200} 0 ${hy - 196} Q160 ${hy - 200} 158 ${hy - 30}" fill="none" stroke="${OL}" stroke-width="30" stroke-linecap="round"/><path d="M-158 ${hy - 30} Q-160 ${hy - 200} 0 ${hy - 196} Q160 ${hy - 200} 158 ${hy - 30}" fill="none" stroke="${ic}" stroke-width="18" stroke-linecap="round"/>`;
    if (has('pencil')) h += E.at(150, hy - 70, 1, 35, E.rect(-9, -50, 18, 100, 5, '#FFC94D', st(5)) + E.path('M-9 50 L0 70 L9 50 Z', '#F6D7B0', st(4)));

    // face
    const ey = hy + 16, ex = 58, lx = (o.look || 0) * 10;
    const blink = t % 3.9 > 3.75;
    const arc = (x, up) => `<path d="M${x - 20} ${ey + (up ? 6 : -4)} Q${x} ${ey + (up ? -22 : 16)} ${x + 20} ${ey + (up ? 6 : -4)}" fill="none" ${st(8)}/>`;
    const oval = (x) => E.ell(x + lx, ey, 15, 21, OL) + E.circ(x + lx + 5, ey - 8, 6, '#FFFFFF') + E.circ(x + lx - 5, ey + 8, 3, '#FFFFFF');
    let f = '';
    f += E.ell(-96, ey + 44, 28, 15, '#FF9EAA', 'opacity=".85"') + E.ell(96, ey + 44, 28, 15, '#FF9EAA', 'opacity=".85"');
    const eyes = {
      happy: () => (blink ? arc(-ex, true) + arc(ex, true) : oval(-ex) + oval(ex)),
      smile: () => arc(-ex, true) + arc(ex, true),
      laugh: () => `<path d="M${-ex - 20} ${ey - 14} L${-ex + 14} ${ey} L${-ex - 20} ${ey + 14} M${ex + 20} ${ey - 14} L${ex - 14} ${ey} L${ex + 20} ${ey + 14}" fill="none" ${st(8)}/>`,
      shock: () => E.circ(-ex, ey, 27, '#FFFFFF', st(6)) + E.circ(ex, ey, 27, '#FFFFFF', st(6)) + E.circ(-ex + lx, ey + 2, 8, OL) + E.circ(ex + lx, ey + 2, 8, OL),
      excited: () => star(-ex, ey, 28, '#FFD43B') + star(ex, ey, 28, '#FFD43B'),
      love: () => heart(-ex, ey + 6, 1.7, '#FF4D6D') + heart(ex, ey + 6, 1.7, '#FF4D6D'),
      sad: () => arc(-ex, false) + arc(ex, false) + E.path(`M${-ex - 6} ${ey + 14} q-6 30 4 48 q10 -18 4 -48 Z M${ex + 6} ${ey + 14} q-6 30 4 48 q10 -18 4 -48 Z`, '#7CC4FF', st(4)),
      worried: () => oval(-ex) + oval(ex) + `<path d="M${-ex - 26} ${ey - 30} L${-ex + 18} ${ey - 44} M${ex + 26} ${ey - 30} L${ex - 18} ${ey - 44}" fill="none" ${st(7)}/>`,
      think: () => `<path d="M${-ex - 18} ${ey} h36" fill="none" ${st(8)}/>` + oval(ex) + `<path d="M${ex - 24} ${ey - 40} Q${ex} ${ey - 52} ${ex + 24} ${ey - 36}" fill="none" ${st(7)}/>`,
      smug: () => `<path d="M${-ex - 22} ${ey - 4} h44 M${ex - 22} ${ey - 4} h44" fill="none" ${st(8)}/>` + E.circ(-ex + 6, ey + 6, 7, OL) + E.circ(ex + 6, ey + 6, 7, OL),
      angry: () => `<path d="M${-ex - 20} ${ey - 12} L${-ex + 16} ${ey + 2} M${ex + 20} ${ey - 12} L${ex - 16} ${ey + 2}" fill="none" ${st(9)}/>` + E.circ(-ex, ey + 12, 8, OL) + E.circ(ex, ey + 12, 8, OL),
      sleepy: () => `<path d="M${-ex - 18} ${ey + 4} q18 10 36 0 M${ex - 18} ${ey + 4} q18 10 36 0" fill="none" ${st(8)}/>`,
    };
    f += (eyes[mood] || eyes.happy)();
    if (has('glasses')) f += `<g fill="#FFFFFF" fill-opacity=".25" ${st(6)}><circle cx="${-ex}" cy="${ey}" r="36"/><circle cx="${ex}" cy="${ey}" r="36"/></g><path d="M-22 ${ey - 4} h44" fill="none" ${st(6)}/>`;
    if (has('flour')) f += E.ell(-104, ey + 66, 22, 12, '#FFFFFF', st(3)) + E.circ(-76, ey + 78, 6, '#FFFFFF', st(2));
    // mouth
    const my = ey + 58;
    if (open > 0.05 || mood === 'laugh' || mood === 'shock') {
      const oh = mood === 'shock' ? 26 + 8 * open : 8 + 26 * Math.max(open, mood === 'laugh' ? 0.8 : 0);
      const ow = mood === 'shock' ? 18 : 26;
      f += E.ell(0, my + oh / 2 - 6, ow, oh / 2 + 4, OL) + E.ell(0, my + oh - 6, ow * 0.6, Math.max(3, oh * 0.18), '#FF7A8A');
    } else if (mood === 'sad' || mood === 'worried') f += `<path d="M-18 ${my + 8} Q0 ${my - 8} 18 ${my + 8}" fill="none" ${st(7)}/>`;
    else if (mood === 'angry') f += `<path d="M-20 ${my + 6} q10 -10 20 0 t20 0" fill="none" ${st(7)}/>`;
    else if (mood === 'think' || mood === 'sleepy') f += E.ell(10, my, 9, 7, OL);
    else if (mood === 'smug') f += `<path d="M-16 ${my} Q6 ${my + 14} 24 ${my - 8}" fill="none" ${st(7)}/>`;
    else f += `<path d="M-24 ${my - 4} q12 16 24 0 q12 16 24 0" fill="none" ${st(7)}/>`;
    h += f;

    // ---------- emotes around the head
    const em = o.emote || { worried: 'sweat', think: 'question', shock: '!', love: 'hearts', sleepy: 'zzz', angry: 'anger', excited: 'sparkle', laugh: 'sparkle', sad: 'rain' }[mood];
    const fl = Math.sin(t * 4) * 8;
    let e = '';
    if (em === 'sweat') e += E.path(`M150 ${hy - 90 + fl} q16 30 0 44 q-16 -14 0 -44 Z`, '#7CC4FF', st(5));
    if (em === 'question') e += E.text('?', 170, hy - 150 + fl, 110, OL, { weight: 700 });
    if (em === '!') e += E.text('!', 175, hy - 150 + fl, 120, '#FF4D4D', { weight: 700 }) + `<path d="M-180 ${hy - 120} l-30 -30 M-196 ${hy - 50} l-40 -6" fill="none" ${st(8)}/>`;
    if (em === 'hearts') e += heart(160, hy - 150 + fl, 2.2, '#FF4D6D') + heart(-170, hy - 120 - fl, 1.6, '#FF8FA3');
    if (em === 'zzz') e += E.text('z', 150, hy - 120 + fl, 60, OL, { weight: 700 }) + E.text('Z', 200, hy - 180 + fl, 84, OL, { weight: 700 });
    if (em === 'anger') e += `<g transform="translate(140 ${hy - 130}) scale(${1 + Math.sin(t * 9) * 0.08})"><path d="M-30 -10 Q-10 -10 -10 -30 M10 -30 Q10 -10 30 -10 M30 10 Q10 10 10 30 M-10 30 Q-10 10 -30 10" fill="none" stroke="#E5484D" stroke-width="10" stroke-linecap="round"/></g>`;
    if (em === 'sparkle') e += star(-180, hy - 120 + fl, 22, '#FFD43B') + star(180, hy - 160 - fl, 30, '#FFD43B') + star(200, hy - 40 + fl, 16, '#FFD43B');
    if (em === 'rain') e += E.path(`M-30 ${hy - 250} q-50 0 -50 -40 q0 -40 50 -40 q20 -36 70 -20 q50 -10 60 36 q30 10 20 44 Z`, '#C9D6E3', st(6));

    const headG = `<g transform="translate(0 ${(hop + nod).toFixed(1)}) rotate(${tilt.toFixed(2)} 0 ${hy + 120})">${h}${e}</g>`;
    const bodyG = `<g transform="translate(0 ${hop.toFixed(1)}) scale(1 ${breathe.toFixed(4)})">${b}</g>`;
    return `<g transform="scale(${dir} 1)">${bodyG}${headG}</g>`;
  };

  // brand.json "character_style": "chibi" switches every character (cast and mascot) to this style
  const inkSam = window.sam;
  window.sam = (o = {}) => (E.brand.character_style === 'chibi' ? window.chibi(o) : inkSam(o));
})();
