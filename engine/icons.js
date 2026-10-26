// Paper icon library. Each icon draws inside a -100..100 box, centred on 0,0.
// Colours come from the theme (P.a .. P.e, P.ink, P.paper) so every channel looks different.
(function () {
  const E = window.E;
  const c = (x, y, r, f, ex) => E.circ(x, y, r, f, ex);
  const r = (x, y, w, h, rr, f, ex) => E.rect(x, y, w, h, rr, f, ex);
  const p = (d, f, ex) => E.path(d, f, ex);
  const l = (d, col, w, ex) => E.line(d, col, w, ex);
  const eyes = (P, y = 0, gap = 22, s = 1) =>
    c(-gap, y, 7 * s, P.ink) + c(gap, y, 7 * s, P.ink) + c(-gap + 2, y - 3, 2.4 * s, '#fff') + c(gap + 2, y - 3, 2.4 * s, '#fff');
  const smile = (P, y = 18, w = 16) => l(`M${-w} ${y} Q0 ${y + w * 0.9} ${w} ${y}`, P.ink, 5);

  const I = (window.ICONS = {
    heart: (P) => p('M0 80 C-70 30 -95 -10 -80 -45 C-65 -80 -20 -80 0 -45 C20 -80 65 -80 80 -45 C95 -10 70 30 0 80 Z', P.a) + p('M-55 -45 C-48 -60 -35 -62 -28 -55', 'none', `stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".6"`),
    lungs: (P) =>
      l('M0 -85 V-20 M0 -20 Q-20 0 -30 10 M0 -20 Q20 0 30 10', P.ink, 10) +
      p('M-12 -30 C-40 -45 -85 -10 -85 40 C-85 75 -55 85 -30 75 C-15 68 -12 50 -12 30 Z', P.a) +
      p('M12 -30 C40 -45 85 -10 85 40 C85 75 55 85 30 75 C15 68 12 50 12 30 Z', P.a) +
      l('M-45 10 Q-55 30 -50 50 M45 10 Q55 30 50 50', '#fff', 5, 'opacity=".5"'),
    brain: (P) =>
      p('M-10 -70 C-50 -80 -85 -50 -80 -15 C-95 10 -80 50 -45 55 C-30 80 0 70 -5 50 Z', P.e) +
      p('M10 -70 C50 -80 85 -50 80 -15 C95 10 80 50 45 55 C30 80 0 70 5 50 Z', P.e) +
      l('M-50 -35 Q-30 -20 -45 0 M-35 20 Q-20 30 -30 45 M50 -35 Q30 -20 45 0 M35 20 Q20 30 30 45', '#fff', 6, 'opacity=".55"'),
    eye: (P) => p('M-90 0 Q0 -75 90 0 Q0 75 -90 0 Z', '#fff') + c(0, 0, 38, P.b) + c(0, 0, 18, P.ink) + c(10, -10, 7, '#fff'),
    mask: (P) =>
      l('M-70 -20 Q-100 -30 -95 10 Q-92 35 -70 30 M70 -20 Q100 -30 95 10 Q92 35 70 30', P.ink, 6) +
      p('M-70 -35 Q0 -55 70 -35 L70 30 Q0 70 -70 30 Z', P.paper) +
      l('M-50 -15 H50 M-55 5 H55 M-50 25 H50', P.b, 5, 'opacity=".55"'),
    virus: (P) =>
      Array.from({ length: 8 }, (_, i) => `<g transform="rotate(${i * 45})">${l('M0 -50 V-78', P.d, 9)}${c(0, -82, 12, P.d)}</g>`).join('') +
      c(0, 0, 55, P.d) + c(-20, -15, 9, '#fff', 'opacity=".5"') + c(18, 15, 12, '#fff', 'opacity=".35"'),
    pill: (P) => `<g transform="rotate(-35)">${r(-80, -32, 160, 64, 32, P.paper)}${p('M0 -32 H48 A32 32 0 0 1 48 32 H0 Z', P.a)}${l('M-55 -12 H-20', '#fff', 7, 'opacity=".7"')}</g>`,
    hospital: (P) =>
      r(-80, -50, 160, 130, 10, P.paper) + p('M-90 -50 L0 -95 L90 -50 Z', P.b) + r(-28, -40, 56, 56, 8, '#fff') +
      r(-8, -34, 16, 44, 3, P.a) + r(-22, -20, 44, 16, 3, P.a) + r(-20, 35, 40, 45, 6, P.b) +
      r(-65, 30, 30, 26, 4, P.b, 'opacity=".5"') + r(35, 30, 30, 26, 4, P.b, 'opacity=".5"'),
    doctor: (P) =>
      r(-55, 10, 110, 90, 30, '#fff') + r(-8, 10, 16, 90, 0, P.b, 'opacity=".25"') + c(0, -40, 42, P.skin) + p('M-42 -50 Q0 -100 42 -50 Q20 -70 -42 -50 Z', P.ink) +
      eyes(P, -40, 15, 0.7) + l('M-25 30 Q-35 70 -5 70', P.ink, 5) + c(-5, 74, 8, P.b),
    thermometer: (P) => r(-20, -90, 40, 140, 20, '#fff') + c(0, 60, 36, P.a) + r(-8, -60, 16, 110, 8, P.a) + l('M22 -60 H34 M22 -35 H34 M22 -10 H34', P.ink, 5),
    drop: (P) => p('M0 -90 C30 -40 65 0 65 30 A65 65 0 0 1 -65 30 C-65 0 -30 -40 0 -90 Z', P.b) + p('M-35 25 Q-35 0 -15 -20', 'none', `stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".6"`),
    fire: (P) =>
      p('M0 90 C-60 90 -75 40 -60 0 C-50 -25 -30 -30 -30 -60 C0 -45 10 -20 5 0 C20 -10 25 -40 20 -85 C70 -40 75 30 60 55 C50 80 30 90 0 90 Z', P.a) +
      p('M0 88 C-30 88 -38 60 -28 40 C-20 25 -5 20 -5 0 C20 15 30 45 25 65 C20 82 12 88 0 88 Z', P.c),
    smoke: (P) =>
      c(-40, 30, 40, '#9AA0A6') + c(10, 10, 48, '#B0B5BA') + c(50, 35, 36, '#9AA0A6') + c(-5, -45, 34, '#C4C8CC') + c(30, -75, 22, '#D6D9DC') + c(-25, 40, 8, '#fff', 'opacity=".4"'),
    cloud: (P) => p('M-80 40 Q-100 0 -65 -10 Q-55 -60 -5 -50 Q25 -85 60 -50 Q100 -45 92 -5 Q115 15 92 40 Z', '#fff') + eyes(P, 0, 20, 0.8) + smile(P, 15, 10),
    rain: (P) => I.cloud(P) + [-50, -10, 30, 70].map((x, i) => p(`M${x} 60 q-8 18 0 26 q8 -8 0 -26 Z`, P.b)).join(''),
    sun: (P) =>
      Array.from({ length: 12 }, (_, i) => `<g transform="rotate(${i * 30})">${r(-8, -95, 16, 30, 8, P.c)}</g>`).join('') + c(0, 0, 55, P.c) + eyes(P, -5, 18, 0.8) + smile(P, 15, 12),
    moon: (P) => p('M20 -85 A85 85 0 1 0 85 20 A65 65 0 1 1 20 -85 Z', P.c) + c(-30, 10, 8, '#fff', 'opacity=".4"'),
    snow: (P) => Array.from({ length: 6 }, (_, i) => `<g transform="rotate(${i * 60})">${l('M0 0 V-80 M0 -50 L-18 -68 M0 -50 L18 -68', P.b, 10)}</g>`).join('') + c(0, 0, 14, P.b),
    tree: (P) => r(-12, 20, 24, 75, 6, '#A0703C') + c(0, -20, 60, P.d) + c(-40, 10, 38, P.d) + c(40, 10, 38, P.d) + c(-15, -40, 15, '#fff', 'opacity=".25"'),
    leaf: (P) => p('M-70 70 C-80 -20 -20 -80 75 -75 C80 20 20 80 -70 70 Z', P.d) + l('M-70 70 L40 -40 M-20 20 L-20 -20 M10 -10 L30 10', '#fff', 6, 'opacity=".55"'),
    forest: (P) => [[-55, 10, 0.75], [55, 10, 0.75], [0, -5, 1]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})">${p('M0 -85 L55 25 H-55 Z', P.d)}${r(-10, 25, 20, 40, 4, '#A0703C')}</g>`).join(''),
    mountain: (P) => p('M-95 80 L-25 -60 L20 20 L45 -15 L95 80 Z', P.d) + p('M-25 -60 L-45 -20 L-30 -28 L-20 -15 L-8 -30 Z', '#fff'),
    wave: (P) => p('M-95 20 Q-70 -30 -40 0 Q-10 30 20 0 Q50 -30 80 0 L95 10 V80 H-95 Z', P.b) + l('M-80 30 Q-60 15 -40 30', '#fff', 6, 'opacity=".6"'),
    house: (P) => r(-65, -10, 130, 95, 6, P.paper) + p('M-85 -5 L0 -85 L85 -5 Z', P.a) + r(-18, 30, 36, 55, 6, P.b) + r(30, 10, 25, 25, 4, P.b, 'opacity=".55"') + r(-55, 10, 25, 25, 4, P.b, 'opacity=".55"'),
    window: (P) => r(-75, -80, 150, 160, 12, '#A0703C') + r(-62, -67, 124, 134, 6, '#CFEFFC') + r(-4, -67, 8, 134, 0, '#A0703C') + r(-62, -4, 124, 8, 0, '#A0703C') + l('M-45 -50 L-20 -25', '#fff', 6, 'opacity=".7"'),
    factory: (P) => p('M-90 85 V-10 L-50 -40 V-10 L-10 -40 V-10 L30 -40 V85 Z', P.paper) + r(40, -80, 30, 165, 4, P.a) + r(-75, 20, 22, 22, 4, P.b) + r(-35, 20, 22, 22, 4, P.b) + r(5, 20, 22, 22, 4, P.b) + c(70, -95, 16, '#B0B5BA') + c(88, -110, 12, '#C4C8CC'),
    car: (P) => p('M-90 30 V0 Q-85 -15 -60 -18 L-35 -55 H35 L60 -18 Q90 -15 90 5 V30 Z', P.a) + r(-28, -48, 26, 28, 4, '#CFEFFC') + r(8, -48, 26, 28, 4, '#CFEFFC') + c(-50, 35, 22, P.ink) + c(50, 35, 22, P.ink) + c(-50, 35, 8, '#ccc') + c(50, 35, 8, '#ccc'),
    globe: (P) => c(0, 0, 80, P.b) + p('M-40 -60 Q-10 -55 -20 -25 Q-50 -10 -35 15 Q-60 20 -70 -10 Q-65 -45 -40 -60 Z M20 -30 Q55 -40 65 -10 Q50 20 25 25 Q10 0 20 -30 Z M-10 40 Q20 35 25 60 Q5 75 -15 65 Z', P.d) + c(-30, -40, 10, '#fff', 'opacity=".3"'),
    money: (P) => c(0, 0, 75, P.c) + c(0, 0, 60, 'none', `stroke="#fff" stroke-width="5" opacity=".6"`) + E.text('$', 0, 6, 90, '#A06A00', { weight: 700 }),
    coins: (P) => [60, 30, 0].map((y, i) => E.ell(-25, y, 55, 20, i ? P.c : '#E0A800') + E.ell(-25, y - 8, 55, 20, P.c)).join('') + c(45, -30, 45, P.c) + E.text('$', 45, -26, 54, '#A06A00', { weight: 700 }),
    chart: (P) => r(-85, -80, 170, 165, 14, P.paper) + r(-60, 20, 30, 45, 4, P.b) + r(-15, -10, 30, 75, 4, P.d) + r(30, -50, 30, 115, 4, P.a) + l('M-65 0 L-15 -35 L15 -25 L60 -70', P.ink, 6),
    chart_down: (P) => r(-85, -80, 170, 165, 14, P.paper) + r(-60, -50, 30, 115, 4, P.d) + r(-15, -10, 30, 75, 4, P.c) + r(30, 20, 30, 45, 4, P.a) + l('M-65 -70 L-15 -25 L15 -35 L60 10', P.a, 6),
    clock: (P) => c(0, 0, 80, P.paper) + c(0, 0, 80, 'none', `stroke="${P.a}" stroke-width="12"`) + l('M0 0 V-45 M0 0 L32 18', P.ink, 9) + c(0, 0, 8, P.ink),
    hourglass: (P) => r(-60, -90, 120, 18, 6, '#A0703C') + r(-60, 72, 120, 18, 6, '#A0703C') + p('M-45 -72 H45 Q40 -20 6 0 Q40 20 45 72 H-45 Q-40 20 -6 0 Q-40 -20 -45 -72 Z', '#E6F4FB') + p('M-30 -50 H30 Q20 -20 0 -5 Q-20 -20 -30 -50 Z M-38 72 Q0 30 38 72 Z', P.c),
    calendar: (P) => r(-80, -70, 160, 155, 14, P.paper) + r(-80, -70, 160, 45, 14, P.a) + r(-50, -90, 14, 36, 7, P.ink) + r(36, -90, 14, 36, 7, P.ink) + [[-45, 0], [0, 0], [45, 0], [-45, 45], [0, 45]].map(([x, y]) => r(x - 15, y - 12, 30, 26, 5, P.b, 'opacity=".5"')).join('') + r(30, 33, 30, 26, 5, P.a),
    lightbulb: (P) => c(0, -20, 60, P.c) + r(-28, 35, 56, 22, 6, '#B8BEC4') + r(-22, 60, 44, 18, 6, '#9AA0A6') + l('M-15 -10 Q0 15 15 -10', '#A06A00', 6) + c(-20, -40, 12, '#fff', 'opacity=".55"'),
    book: (P) => p('M0 -55 Q-45 -80 -90 -60 V70 Q-45 50 0 72 Z', P.b) + p('M0 -55 Q45 -80 90 -60 V70 Q45 50 0 72 Z', P.a) + l('M-70 -35 Q-45 -45 -20 -35 M-70 -10 Q-45 -20 -20 -10 M20 -35 Q45 -45 70 -35', '#fff', 5, 'opacity=".6"'),
    rocket: (P) => `<g transform="rotate(40)">${p('M0 -95 C40 -60 40 20 30 50 H-30 C-40 20 -40 -60 0 -95 Z', P.paper)}${c(0, -25, 18, P.b)}${p('M-30 20 L-60 65 L-28 50 Z M30 20 L60 65 L28 50 Z', P.a)}${p('M-20 55 Q0 110 20 55 Z', P.c)}</g>`,
    phone: (P) => r(-50, -90, 100, 180, 20, P.ink) + r(-40, -72, 80, 135, 8, '#CFEFFC') + c(0, 75, 7, '#fff') + r(-28, -55, 56, 12, 6, P.a, 'opacity=".7"') + r(-28, -35, 40, 12, 6, P.b, 'opacity=".7"'),
    laptop: (P) => r(-75, -65, 150, 105, 10, P.ink) + r(-65, -55, 130, 85, 4, '#CFEFFC') + p('M-95 45 H95 L80 65 H-80 Z', '#B8BEC4'),
    star: (P) => p('M0 -90 L24 -30 L88 -28 L38 12 L56 75 L0 38 L-56 75 L-38 12 L-88 -28 L-24 -30 Z', P.c) + eyes(P, 0, 16, 0.7) + smile(P, 18, 9),
    check: (P) => c(0, 0, 80, P.d) + l('M-38 2 L-10 30 L42 -28', '#fff', 20),
    cross: (P) => c(0, 0, 80, P.a) + l('M-32 -32 L32 32 M32 -32 L-32 32', '#fff', 20),
    warning: (P) => p('M0 -88 Q8 -88 14 -78 L90 62 Q95 78 78 78 H-78 Q-95 78 -90 62 L-14 -78 Q-8 -88 0 -88 Z', P.c) + r(-9, -40, 18, 70, 9, P.ink) + c(0, 52, 11, P.ink),
    question: (P) => c(0, 0, 80, P.b) + E.text('?', 0, 6, 120, '#fff', { weight: 700 }),
    exclaim: (P) => c(0, 0, 80, P.a) + E.text('!', 0, 6, 120, '#fff', { weight: 700 }),
    lock: (P) => l('M-38 -10 V-40 A38 38 0 0 1 38 -40 V-10', '#9AA0A6', 18) + r(-65, -15, 130, 100, 18, P.c) + c(0, 25, 13, P.ink) + r(-5, 30, 10, 28, 4, P.ink),
    shield: (P) => p('M0 -90 L75 -60 Q75 40 0 90 Q-75 40 -75 -60 Z', P.b) + p('M0 -70 L55 -48 Q55 30 0 68 Z', '#fff', 'opacity=".25"') + l('M-30 0 L-8 22 L32 -22', '#fff', 14),
    person: (P) => c(0, -50, 34, P.skin) + p('M-55 85 Q-60 0 0 -5 Q60 0 55 85 Z', P.b) + eyes(P, -50, 12, 0.6) + p('M-34 -62 Q0 -100 34 -62 Q0 -75 -34 -62 Z', P.ink),
    child: (P) => `<g transform="scale(.8) translate(0 20)">${c(0, -45, 40, P.skin)}${p('M-50 85 Q-55 5 0 0 Q55 5 50 85 Z', P.c)}${eyes(P, -45, 14, 0.7)}${smile(P, -30, 10)}${p('M-40 -55 Q-30 -100 20 -88 Q45 -80 40 -55 Q10 -78 -40 -55 Z', '#8B5A2B')}</g>`,
    elder: (P) => c(0, -50, 34, P.skin) + p('M-55 85 Q-60 0 0 -5 Q60 0 55 85 Z', P.e) + p('M-36 -55 Q-40 -95 0 -88 Q40 -95 36 -55 Q30 -72 0 -75 Q-30 -72 -36 -55 Z', '#E0E0E0') + c(-12, -50, 11, 'none', `stroke="${P.ink}" stroke-width="4"`) + c(12, -50, 11, 'none', `stroke="${P.ink}" stroke-width="4"`) + l('M60 0 V90', '#A0703C', 8) + l('M60 0 Q60 -15 45 -12', '#A0703C', 8),
    pregnant: (P) => c(-5, -55, 30, P.skin) + p('M-40 85 Q-45 0 -5 -15 Q30 -10 30 15 Q75 35 45 75 L40 85 Z', P.a) + p('M-35 -60 Q-25 -100 25 -75 Q40 -40 20 -30 Q20 -70 -35 -60 Z', '#8B5A2B'),
    family: (P) => `<g transform="translate(-45 0) scale(.75)">${I.person(P)}</g><g transform="translate(45 0) scale(.75)">${I.pregnant(P)}</g><g transform="translate(0 30) scale(.55)">${I.child(P)}</g>`,
    apple: (P) => p('M0 -45 C-35 -70 -85 -50 -80 5 C-75 60 -35 90 0 70 C35 90 75 60 80 5 C85 -50 35 -70 0 -45 Z', P.a) + l('M0 -45 Q5 -70 15 -85', '#8B5A2B', 8) + p('M8 -60 Q40 -95 60 -70 Q35 -50 8 -60 Z', P.d),
    food: (P) => E.ell(0, 30, 90, 30, '#fff') + p('M-70 25 Q0 -90 70 25 Z', P.c) + c(-25, -10, 10, P.a) + c(15, -25, 9, P.d) + c(30, 5, 10, P.a),
    water: (P) => p('M-50 -80 H50 L38 85 H-38 Z', '#E6F4FB') + p('M-46 -20 H46 L38 85 H-38 Z', P.b) + l('M-30 0 V60', '#fff', 7, 'opacity=".5"'),
    battery: (P) => r(-85, -40, 160, 80, 14, P.ink) + r(75, -18, 15, 36, 5, P.ink) + r(-75, -30, 100, 60, 6, P.d) + r(-75, -30, 30, 60, 6, '#fff', 'opacity=".2"'),
    gear: (P) => Array.from({ length: 8 }, (_, i) => `<g transform="rotate(${i * 45})">${r(-14, -88, 28, 30, 5, '#9AA0A6')}</g>`).join('') + c(0, 0, 65, '#9AA0A6') + c(0, 0, 25, P.paper),
    megaphone: (P) => p('M-60 -20 L40 -70 V70 L-60 20 Z', P.a) + r(-85, -25, 30, 50, 8, P.ink) + r(-55, 18, 22, 50, 8, P.ink) + l('M60 -30 Q75 0 60 30 M75 -50 Q100 0 75 50', P.ink, 7),
    trophy: (P) => p('M-55 -80 H55 V-20 Q55 30 0 35 Q-55 30 -55 -20 Z', P.c) + l('M-55 -60 Q-95 -55 -80 -20 Q-70 0 -50 -5 M55 -60 Q95 -55 80 -20 Q70 0 50 -5', P.c, 12) + r(-12, 30, 24, 30, 4, '#E0A800') + r(-45, 58, 90, 26, 8, '#A0703C'),
    target: (P) => c(0, 0, 85, P.a) + c(0, 0, 62, '#fff') + c(0, 0, 40, P.a) + c(0, 0, 18, '#fff') + l('M10 -10 L75 -75', P.ink, 8) + p('M75 -75 l-5 -25 l30 30 Z', P.b),
    egg: (P) => E.ell(0, 10, 62, 82, P.paper) + E.ell(-22, -20, 12, 20, '#fff', 'opacity=".7"'),
    fish: (P) => p('M-70 0 Q-20 -60 50 0 Q-20 60 -70 0 Z', P.b) + p('M45 0 L90 -40 V40 Z', P.b) + c(-40, -8, 9, P.ink),
    cat: (P) => c(0, 10, 65, P.c) + p('M-60 -15 L-55 -80 L-15 -45 Z M60 -15 L55 -80 L15 -45 Z', P.c) + eyes(P, 0, 25, 0.9) + p('M-8 18 H8 L0 26 Z', P.a) + l('M-30 25 H-80 M30 25 H80', P.ink, 4),
    dog: (P) => c(0, 10, 62, '#D9A066') + E.ell(-55, -5, 22, 45, '#8B5A2B') + E.ell(55, -5, 22, 45, '#8B5A2B') + eyes(P, -5, 22, 0.9) + E.ell(0, 25, 16, 11, P.ink),
    bird: (P) => E.ell(0, 0, 70, 55, P.b) + c(40, -30, 32, P.b) + p('M68 -30 L95 -22 L68 -15 Z', P.c) + c(48, -36, 6, P.ink) + p('M-20 -10 Q-60 -60 -70 10 Z', '#fff', 'opacity=".5"'),
    plant: (P) => p('M-45 30 H45 L35 90 H-35 Z', '#C46A3C') + l('M0 30 V-40', P.d, 8) + p('M0 -10 Q-60 -30 -55 -75 Q-10 -60 0 -10 Z M0 -30 Q55 -50 55 -90 Q10 -85 0 -30 Z', P.d),
    sleep: (P) => p('M20 -85 A85 85 0 1 0 85 20 A65 65 0 1 1 20 -85 Z', P.e) + E.text('z', 40, -55, 50, '#fff', { weight: 700 }) + E.text('z', 65, -85, 34, '#fff', { weight: 700 }),
    run: (P) => c(20, -65, 22, P.skin) + l('M10 -40 L-5 15 M-5 15 L25 45 L15 85 M-5 15 L-35 45 L-60 50 M5 -25 L40 -5 M5 -25 L-30 -20', P.b, 16),
    muscle: (P) => p('M-80 60 Q-90 -10 -40 -30 Q-30 -80 10 -75 Q30 -70 20 -45 Q10 -30 -5 -35 Q30 -10 60 -5 Q95 10 80 50 Q60 85 -80 60 Z', P.skin) + l('M-10 0 Q15 15 40 5', '#C98B6B', 6),
    soap: (P) => r(-70, -35, 140, 85, 24, P.e) + c(-40, -60, 18, '#fff', `stroke="${P.b}" stroke-width="4"`) + c(5, -75, 12, '#fff', `stroke="${P.b}" stroke-width="4"`) + c(45, -55, 22, '#fff', `stroke="${P.b}" stroke-width="4"`),
    idea: (P) => I.lightbulb(P) + Array.from({ length: 5 }, (_, i) => `<g transform="rotate(${-60 + i * 30} 0 -20)">${l('M0 -95 V-110', P.c, 8)}</g>`).join(''),
    search: (P) => c(-15, -15, 55, '#E6F4FB') + c(-15, -15, 55, 'none', `stroke="${P.ink}" stroke-width="14"`) + l('M25 25 L75 75', P.ink, 22) + c(-35, -35, 12, '#fff'),
    chat: (P) => p('M-85 -60 Q-85 -80 -65 -80 H65 Q85 -80 85 -60 V20 Q85 40 65 40 H-10 L-45 75 L-40 40 H-65 Q-85 40 -85 20 Z', P.paper) + c(-35, -20, 10, P.b) + c(0, -20, 10, P.b) + c(35, -20, 10, P.b),
    share: (P) => c(-50, 0, 24, P.b) + c(50, -50, 24, P.a) + c(50, 50, 24, P.d) + l('M-50 0 L50 -50 M-50 0 L50 50', P.ink, 9),
    bell: (P) => p('M0 -80 Q-60 -75 -60 -10 V30 L-80 55 H80 L60 30 V-10 Q60 -75 0 -80 Z', P.c) + c(0, 70, 16, P.c) + r(-8, -95, 16, 20, 8, P.c),
    wallet: (P) => r(-85, -50, 170, 125, 26, P.d) + r(-60, -78, 110, 50, 8, P.c, 'transform="rotate(-8)"') + r(-85, -50, 170, 125, 26, P.d) + l('M-62 -24 Q0 -32 62 -24', '#000', 5, 'opacity=".25"') + r(20, -10, 82, 56, 18, '#0E8F57') + c(58, 18, 11, P.ink),
    card: (P) => `<g transform="rotate(-8)">${r(-90, -58, 180, 116, 16, P.b)}${r(-90, -30, 180, 24, 0, P.ink)}${r(-70, 12, 40, 28, 6, P.c)}${l('M10 30 H70', '#fff', 7, 'opacity=".8"')}</g>`,
    piggy: (P) => E.ell(0, 10, 80, 62, '#FF9EB5') + c(62, -10, 26, '#FF9EB5') + E.ell(80, -6, 12, 10, '#F07895') + p('M-30 -45 L-20 -78 L0 -50 Z', '#FF9EB5') + r(-14, -52, 34, 8, 4, P.ink) + c(40, -18, 6, P.ink) + r(-50, 55, 18, 26, 6, '#FF9EB5') + r(30, 55, 18, 26, 6, '#FF9EB5') + l('M-80 0 q-20 -10 -12 -26', '#F07895', 6),
    receipt: (P) => p('M-60 -90 H60 V80 l-15 12 l-15 -12 l-15 12 l-15 -12 l-15 12 l-15 -12 l-15 12 l-15 -12 Z', '#fff') + l('M-40 -60 H40 M-40 -35 H20 M-40 -10 H40 M-40 15 H10', '#999', 7) + l('M-40 50 H40', P.ink, 9),
    bank: (P) => p('M-90 -40 L0 -92 L90 -40 Z', P.paper) + r(-90, -40, 180, 16, 2, P.ink) + [-60, -20, 20, 60].map((x) => r(x - 10, -18, 20, 80, 3, P.paper)).join('') + r(-95, 62, 190, 22, 3, P.ink) + E.text('$', 0, -58, 34, P.ink, { weight: 700 }),
    cart: (P) => l('M-95 -60 H-65 L-40 40 H60 L80 -30 H-55', P.ink, 12) + p('M-50 -25 H75 L60 30 H-37 Z', P.c) + c(-30, 70, 14, P.ink) + c(50, 70, 14, P.ink),
    percent: (P) => c(0, 0, 82, P.a) + c(-30, -30, 18, '#fff') + c(30, 30, 18, '#fff') + l('M40 -45 L-40 45', '#fff', 14),
    calculator: (P) => r(-62, -88, 124, 176, 18, P.ink) + r(-48, -72, 96, 40, 8, '#BFF0D4') + [[-30, 0], [0, 0], [30, 0], [-30, 30], [0, 30], [30, 30], [-30, 60], [0, 60]].map(([x, y]) => r(x - 11, y - 9, 22, 20, 5, '#fff')).join('') + r(19, 51, 22, 20, 5, P.a),
    cash: (P) => [20, 0, -20].map((y, i) => `<g transform="translate(0 ${y}) rotate(${-6 + i * 4})">${r(-90, -40, 180, 80, 10, i === 2 ? P.d : '#7BD9A9')}${c(0, 0, 24, 'none', `stroke="#0E8F57" stroke-width="6"`)}</g>`).join('') + E.text('$', 0, -18, 34, '#0E8F57', { weight: 700 }),
    coffee: (P) => p('M-60 -40 H50 L40 80 H-50 Z', '#fff') + r(-66, -56, 122, 22, 8, P.e) + p('M-56 0 H46 L42 40 H-52 Z', '#A0703C') + l('M50 -10 Q90 0 70 40 L44 45', P.ink, 9) + l('M-20 -75 q10 -15 0 -30 M10 -75 q10 -15 0 -30', '#999', 6),
    paycheck: (P) => r(-90, -55, 180, 110, 10, '#fff') + p('M-90 -55 L0 10 L90 -55', 'none', `stroke="${P.ink}" stroke-width="6"`) + c(55, 30, 22, P.d) + E.text('$', 55, 32, 28, '#fff', { weight: 700 }),
    key: (P) => c(-45, 0, 40, P.c) + c(-45, 0, 14, P.paper) + r(-10, -10, 110, 20, 6, P.c) + r(60, 10, 14, 26, 4, P.c) + r(84, 10, 14, 20, 4, P.c),
    briefcase: (P) => r(-90, -45, 180, 125, 16, '#A0703C') + l('M-30 -45 V-70 H30 V-45', P.ink, 10) + r(-90, -5, 180, 14, 0, '#7A5230') + r(-14, -12, 28, 28, 6, P.c),
    subscription: (P) => r(-80, -60, 160, 120, 16, P.e) + p('M-20 -28 L32 0 L-20 28 Z', '#fff') + c(62, 50, 28, P.a) + l('M50 50 a12 12 0 1 1 12 12', '#fff', 6),
    gift: (P) => r(-75, -20, 150, 100, 8, P.a) + r(-85, -45, 170, 30, 6, P.a) + r(-12, -45, 24, 125, 0, P.c) + p('M0 -45 Q-60 -100 -40 -50 Z M0 -45 Q60 -100 40 -50 Z', P.c),
    tag: (P) => p('M-80 -40 L0 -40 L80 40 L40 80 L-40 0 Z', P.c, 'transform="rotate(-10)"') + c(-50, -12, 12, '#fff'),
    play: (P) => r(-90, -62, 180, 124, 34, '#FF3B30') + p('M-22 -32 L38 0 L-22 32 Z', '#fff'),
  });

  // aliases make storyboards forgiving
  const alias = {
    lung: 'lungs', paru: 'lungs', jantung: 'heart', mata: 'eye', masker: 'mask', obat: 'pill', api: 'fire', asap: 'smoke',
    awan: 'cloud', hujan: 'rain', matahari: 'sun', bulan: 'moon', pohon: 'tree', hutan: 'forest', rumah: 'house', jendela: 'window',
    uang: 'money', dollar: 'money', jam: 'clock', time: 'clock', waktu: 'clock', buku: 'book', bintang: 'star', yes: 'check', no: 'cross',
    x: 'cross', alert: 'warning', bahaya: 'warning', danger: 'warning', anak: 'child', kid: 'child', lansia: 'elder', old: 'elder',
    hamil: 'pregnant', orang: 'person', people: 'person', makanan: 'food', air: 'water', ide: 'idea', bulb: 'lightbulb', cari: 'search',
    rumah_sakit: 'hospital', dokter: 'doctor', virus_: 'virus', germ: 'virus', bakteri: 'virus', telur: 'egg', ikan: 'fish',
    kucing: 'cat', anjing: 'dog', burung: 'bird', tanaman: 'plant', tidur: 'sleep', olahraga: 'run', exercise: 'run', otak: 'brain',
    dompet: 'wallet', kartu: 'card', credit: 'card', celengan: 'piggy', savings: 'piggy', tabungan: 'piggy', struk: 'receipt', bill: 'receipt', bills: 'receipt', tagihan: 'receipt', belanja: 'cart', shopping: 'cart', persen: 'percent', interest: 'percent', bunga: 'percent', kalkulator: 'calculator', tunai: 'cash', kopi: 'coffee', gaji: 'paycheck', salary: 'paycheck', paycheck_: 'paycheck', kunci: 'key', rent: 'key', sewa: 'key', kerja: 'briefcase', job: 'briefcase', langganan: 'subscription', subscriptions: 'subscription', hadiah: 'gift', diskon: 'tag', sale: 'tag',
    kalender: 'calendar', grafik: 'chart', growth: 'chart', decline: 'chart_down', hp: 'phone', komputer: 'laptop', computer: 'laptop',
  };
  window.iconSVG = function (name, P) {
    if (!name) return '';
    if (typeof name === 'string' && name.startsWith('img:')) {
      const src = E.data.images[name.slice(4)];
      return src ? `<image href="${src}" x="-90" y="-90" width="180" height="180" preserveAspectRatio="xMidYMid meet"/>` : I.star(P);
    }
    const k = String(name).toLowerCase();
    const fn = I[k] || I[alias[k]] || I.star;
    return fn(P);
  };
})();
