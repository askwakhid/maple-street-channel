// Original mascot: a folded paper sheet with a dog-eared corner and a scarf in the brand colour.
// Name and colours come from brand.json -> mascot.
(function () {
  const E = window.E;
  // arm: angle in degrees from straight down, positive = outward
  const arm = (side, deg, col, hand, bend = 0) => {
    const sx = side * 72, sy = 10;
    const a = (deg * Math.PI) / 180;
    const len = 78;
    const ex = sx + side * Math.sin(a) * len, ey = sy + Math.cos(a) * len;
    const mx = (sx + ex) / 2 + side * bend, my = (sy + ey) / 2 + Math.abs(bend) * 0.4;
    return E.line(`M${sx} ${sy} Q${mx} ${my} ${ex} ${ey}`, col, 15) + E.circ(ex, ey, 14, hand);
  };
  window.mascot = function (o = {}) {
    // ink style: Sam stands in for the paper mascot (same footprint: feet at y~140)
    if (E.theme.style === 'ink') return `<g transform="translate(0 140) scale(0.46)">${window.sam(o)}</g>`;
    const M = Object.assign({ body: '#FFFFFF', fold: '#E9E2D3', limb: '#2B2D42', cheek: '#FF9AA2', scarf: '#FF6F59' }, E.brand.mascot || {});
    const P = E.theme;
    const t = o.t || 0;
    const pose = o.pose || 'idle';
    const mood = o.mood || 'happy';
    const dir = o.dir || 1;
    const bob = Math.sin(t * 4.2) * 4;
    let L = 22, R = 22, bendR = 0;
    if (pose === 'wave') R = 150 + Math.sin(t * 9) * 22;
    if (pose === 'point') { R = 95; }
    if (pose === 'cheer') { L = 155 + Math.sin(t * 8) * 8; R = 155 - Math.sin(t * 8) * 8; }
    if (pose === 'shrug') { L = 115; R = 115; }
    if (pose === 'think') { R = 160; bendR = -60; }
    let s = '';
    // legs
    s += E.line('M-30 88 L-34 128 M30 88 L34 128', M.limb, 15) + E.ell(-40, 130, 20, 10, M.limb) + E.ell(40, 130, 20, 10, M.limb);
    s += arm(-1, L, M.limb, M.limb);
    // body with dog-ear corner
    s += E.stk(E.path('M-72 -78 Q-72 -92 -58 -92 H30 L72 -50 V78 Q72 92 58 92 H-58 Q-72 92 -72 78 Z', M.body));
    s += E.path('M30 -92 L30 -58 Q30 -50 38 -50 L72 -50 Z', M.fold);
    s += E.line('M-50 -70 H10 M-50 -55 H0', P.b, 4, 'opacity=".25"');
    // scarf
    s += E.path('M-72 22 Q0 40 72 22 V44 Q0 62 -72 44 Z', M.scarf) + E.path('M40 40 L58 88 L30 80 L22 46 Z', M.scarf);
    // face
    const blink = (t % 3.3) > 3.15;
    const ey = -22;
    const look = (o.look || 0) * 6 * dir;
    if (mood === 'shock') {
      s += E.circ(-26 + look, ey, 15, '#fff', `stroke="${M.limb}" stroke-width="4"`) + E.circ(26 + look, ey, 15, '#fff', `stroke="${M.limb}" stroke-width="4"`) + E.circ(-26 + look, ey, 6, M.limb) + E.circ(26 + look, ey, 6, M.limb);
    } else if (blink || mood === 'content') {
      s += E.line(`M${-36 + look} ${ey} Q${-26 + look} ${ey + 8} ${-16 + look} ${ey} M${16 + look} ${ey} Q${26 + look} ${ey + 8} ${36 + look} ${ey}`, M.limb, 5);
    } else {
      s += E.ell(-26 + look, ey, 9, 13, M.limb) + E.ell(26 + look, ey, 9, 13, M.limb) + E.circ(-23 + look, ey - 5, 3.5, '#fff') + E.circ(29 + look, ey - 5, 3.5, '#fff');
    }
    if (mood === 'sad') s += E.line(`M-38 ${ey - 22} L-16 ${ey - 16} M38 ${ey - 22} L16 ${ey - 16}`, M.limb, 5);
    if (mood === 'think') s += E.line(`M-38 ${ey - 20} L-16 ${ey - 22} M16 ${ey - 26} L38 ${ey - 18}`, M.limb, 5);
    s += E.ell(-44, 2, 11, 7, M.cheek, 'opacity=".75"') + E.ell(44, 2, 11, 7, M.cheek, 'opacity=".75"');
    const abs = o.abs == null ? t : o.abs;
    const talking = o.talk && E.speaking(abs);
    const open = talking ? E.clamp(E.amp(abs) * 1.25) : 0;
    if (mood === 'shock') s += E.ell(0, 8, 10, 13, M.limb);
    else if (mood === 'sad') s += E.line('M-12 12 Q0 4 12 12', M.limb, 5);
    else if (open > 0.05) s += E.ell(0, 7, 12, 4 + 9 * open, M.limb) + E.ell(0, 10 + 4 * open, 6, 3 * open, '#FF8A8A');
    else s += E.line('M-14 3 Q0 16 14 3', M.limb, 5);
    s += arm(1, R, M.limb, M.limb, bendR);
    return `<g transform="translate(0 ${bob.toFixed(1)}) scale(${dir} 1)">${s}</g>`;
  };
})();
