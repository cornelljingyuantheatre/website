// Widescreen redesign prototype. State 1 (Figma 154:238) keeps the interaction model of
// stage/app.js at 25c8682: clockwise moving-head entrance, pointer-follow, beamAt(y)
// size/brightness/defocus, independent entrance cues, moving illumination mask, rim reveal
// and the whole-wordmark red state. One scroll gesture grows the scene into state 2
// (191:34); further scrolling moves content 1:1 while the light rises with parallax, then
// reveals the curtain photograph and The Other Shore (192:168).
// The light renderer is the only difference between ?light=css (A) and ?light=png (B).
const $ = s => document.querySelector(s);
const mode = document.documentElement.dataset.light;
const scene = $('.scene'), journey = $('.journey'), stageEl = $('.stage'), content = $('.content');
const lightCss = $('.light-css'), lightPng = $('.light-png'), light2 = $('.light2-png');
const lightEl = mode === 'png' ? lightPng : lightCss;
const titleGroup = $('#title-group');
const illumination = $('#illumination'), rimField = $('#rim-light-field'), coreField = $('#core-field');
const outerColorField = $('#outer-color-field'), lowerColorField = $('#lower-color-field');
const rimLettering = $('.rim-lettering'), redMark = $('.red-wordmark'), shadowGroup = $('.shadow-group');
const intro = $('.intro'), curtain = $('.curtain'), shore = $('.shore'), shoreFx = $('.shore-fx');
shoreFx.pauseAnimations();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const lerp = (a, b, t) => a + (b - a) * t;
const smootherstep = t => t * t * t * (t * (t * 6 - 15) + 10);
const smooth = (a, b, x) => smootherstep(clamp((x - a) / (b - a), 0, 1));

// ---------- geometry (design px) ----------
const origin = { x: 755.5, y: 490.5 };          // state-1 light centre (154:239)
const K = 307.5 / 244.5;                        // new body radius vs the 25c8682 light; fields keep their 689-unit frame
const STATE2 = { x: 729, y: 901, size: 2418 / 615 };   // 191:35
const TITLE_ORIGIN = { x: 613, y: 280 };
const TITLE2 = { x: 524, y: 217.843, s: 284.037 / 184 }; // 191:72 relative to 154:242
// Shadow group in title-local coordinates: 154:238 → offset (0,23); 191:34 → Group 55.
const SHADOW1 = { dx: 0, dy: 23, s: 1, blur: 12 };
const SHADOW2 = { dx: 9.069, dy: 51.926, s: 0.98471, blur: 20 / TITLE2.s };
const FIGMA_BLUR_TO_SIGMA = 1 / 2.37;            // layer-blur radius → Gaussian σ, from the light fit (251.5 → 106)
const U_SHORE = 2830, U_MAX = 2830;              // The Other Shore starts under frame 2 (2830 tall)
const PARALLAX = 0.6;                            // light rises at 60% of the content speed
const GROW_MS = 1500, GESTURE_GAP = 260;

const slots = [...document.querySelectorAll('.glyph-slot')].map(r => ({ x: +r.getAttribute('x'), y: +r.getAttribute('y'), width: +r.getAttribute('width'), height: +r.getAttribute('height') }));
const wordShadows = [...document.querySelectorAll('.word-shadow')].map((el, i) => {
  const s = slots[i], big = s.height > 100;
  return { el, sd: document.querySelector(`#shadow-blur-${el.dataset.word} feGaussianBlur`), cx: s.x + s.width / 2, cy: s.y + s.height / 2, height: big ? 80 : 46, last: '' };
});

// ---------- state ----------
const light = { ...origin }, target = { ...origin };
let scale = 1, stageX = 0, stageY = 0, vw = 1512, vh = 982;
let frame = 0, lastTime = 0;
let entering = !reducedMotion.matches, entranceStart = null, entrancePlan = null;
let aperture = entering ? .16 : 1, focusBlur = entering ? 18 : 0, brightness = entering ? 0 : 1;
let redReveal = 0, redRevealGoal = 0, redRevealFrom = 0, redRevealStart = null, centralHasLight = true;
const centralRedTriggerScale = .55;
let phase = 'state1';            // state1 | grow | state2 | shrink
let grow = 0;                    // eased-progress driver 0..1 (state1 → state2)
let anim = null;                 // { from, to, start, src }
let gestureLockUntil = 0, wheelSeenAt = 0;
let u = 0;                       // design-px scroll inside state 2
let state2Size = STATE2.size;    // ≥ Figma's 2418px; grows on wider viewports so the light fills it
let started = false;

// ---------- 25c8682: moving-head entrance (unchanged path, rates and landing) ----------
const fixtureLimits = { panRate: 2.31, tiltRate: 2.09, panAccel: 14, tiltAccel: 12 };
function aimAt(p, f) { const dx = p.x - f.x, dy = p.y - f.y; return { pan: Math.atan2(dx, dy), tilt: Math.atan2(Math.hypot(dx, dy), f.height) }; }
function projectAim(a, f) { const r = f.height * Math.tan(a.tilt); return { x: f.x + r * Math.sin(a.pan), y: f.y + r * Math.cos(a.pan) }; }
function blendAim(a, b, t) { return { pan: a.pan + (b.pan - a.pan) * t, tilt: a.tilt + (b.tilt - a.tilt) * t }; }
function boundedDuration(sample, minimum) {
  const count = 1000, h = 1 / count; let previous = sample(0), velocity = null, duration = minimum;
  for (let i = 1; i <= count; i++) {
    const current = sample(i / count), v = { pan: (current.pan - previous.pan) / h, tilt: (current.tilt - previous.tilt) / h };
    duration = Math.max(duration, Math.abs(v.pan) / fixtureLimits.panRate, Math.abs(v.tilt) / fixtureLimits.tiltRate);
    if (velocity) duration = Math.max(duration, Math.sqrt(Math.abs(v.pan - velocity.pan) / h / fixtureLimits.panAccel), Math.sqrt(Math.abs(v.tilt - velocity.tilt) / h / fixtureLimits.tiltAccel));
    previous = current; velocity = v;
  }
  return duration * 1.03;
}
function sweepProgress(u) {
  const acceleration = .30, braking = .14, distance = 1 - (acceleration + braking) / 2, integral = t => 2.5 * t ** 4 - 3 * t ** 5 + t ** 6;
  if (u < acceleration) return acceleration * integral(u / acceleration) / distance;
  if (u > 1 - braking) return 1 - braking * integral((1 - u) / braking) / distance;
  return (u - acceleration / 2) / distance;
}
function createEntrancePlan() {
  const fixture = { x: origin.x, y: -640, height: 900 };
  const rx = Math.min(535, Math.max(230, scene.clientWidth / (2 * scale) - 80)), ry = 350;
  const pointAt = angle => ({ x: origin.x + rx * Math.sin(angle), y: origin.y - ry * Math.cos(angle) });
  const topAim = aimAt(pointAt(0), fixture), endAim = aimAt(origin, fixture);
  const landingAt = q => blendAim(topAim, endAim, smootherstep(q));
  const count = 1536, table = [{ angle: 0, cost: 0 }]; let last = topAim, total = 0;
  for (let i = 1; i <= count; i++) { const angle = i / count * Math.PI * 2, aim = aimAt(pointAt(angle), fixture); total += Math.hypot(aim.pan - last.pan, aim.tilt - last.tilt); table.push({ angle, cost: total }); last = aim; }
  for (let i = 0; i <= count; i++) {
    const left = i ? (table[i].angle - table[i - 1].angle) / (table[i].cost - table[i - 1].cost) : null;
    const right = i < count ? (table[i + 1].angle - table[i].angle) / (table[i + 1].cost - table[i].cost) : null;
    table[i].slope = left === null ? right : right === null ? left : 2 * left * right / (left + right);
  }
  const orbitAt = q => {
    const cost = sweepProgress(q) * total; let lo = 0, hi = count;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (table[mid].cost < cost) lo = mid; else hi = mid; }
    const a = table[lo], b = table[hi], f = clamp((cost - a.cost) / (b.cost - a.cost), 0, 1), f2 = f * f, f3 = f2 * f, span = b.cost - a.cost;
    const angle = (2 * f3 - 3 * f2 + 1) * a.angle + (-2 * f3 + 3 * f2) * b.angle + (f3 - 2 * f2 + f) * span * a.slope + (f3 - f2) * span * b.slope;
    return aimAt(pointAt(angle), fixture);
  };
  const orbit = boundedDuration(orbitAt, 2.6), landing = boundedDuration(landingAt, .65), duration = orbit + landing;
  return { duration, sample(sec) { const t = clamp(sec, 0, duration); return projectAim(t < orbit ? orbitAt(t / orbit) : landingAt((t - orbit) / landing), fixture); } };
}

// ---------- 25c8682: position-dependent beam and red-state test ----------
function beamAt(y) {
  const throwRatio = (500 + clamp(y, 0, 982)) / (500 + origin.y);
  const belowFocus = clamp((y - origin.y) / (982 - origin.y), 0, 1);
  return { size: throwRatio ** 1.1, blur: 22 * belowFocus ** 1.6, intensity: Math.min(1, throwRatio ** -.28) };
}
function updateCentralRedState(time, L, sizeLocal) {
  const beam = beamAt(light.y);
  const radius = (344.5 + (focusBlur + beam.blur) * .75) * sizeLocal * K * centralRedTriggerScale;
  const reach = radius + (centralHasLight ? 3 : 0);
  centralHasLight = slots.some(b => { const dx = L.x - clamp(L.x, b.x, b.x + b.width), dy = L.y - clamp(L.y, b.y, b.y + b.height); return dx * dx + dy * dy <= reach * reach; });
  if (entering) { redReveal = redRevealGoal = redRevealFrom = 0; redRevealStart = null; return; }
  const goal = centralHasLight || phase !== 'state1' ? 0 : 1;
  if (goal !== redRevealGoal) { redRevealFrom = redReveal; redRevealGoal = goal; redRevealStart = time; }
  if (reducedMotion.matches) { redReveal = goal; return; }
  if (redReveal !== goal) { redRevealStart ??= time; redReveal = redRevealFrom + (goal - redRevealFrom) * smootherstep(clamp((time - redRevealStart) / 280, 0, 1)); }
}

// ---------- 25c8682 projection, applied per glyph relative to the designed resting shadow ----------
function projection(cx, cy, height, src) {
  const dx = cx - src.x, dy = cy - src.y, distance = Math.hypot(dx, dy), factor = height / (420 - height);
  const angle = Math.atan2(dy, dx), stretch = Math.min(.85, distance / 650) * factor * 2.1;
  return { x: dx * factor, y: dy * factor, stretch, c: Math.cos(angle), s: Math.sin(angle), distance };
}

// ---------- poses ----------
function restSize() { return beamAt(origin.y).size; }
function state1Pose() { const b = beamAt(light.y); return { x: light.x, y: light.y, size: aperture * b.size }; }
function lerpPose(a, b, t) { return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), size: Math.exp(lerp(Math.log(a.size), Math.log(b.size), t)) }; }
// Light pose in viewport-design coordinates (before the stage offset).
function currentPose() {
  if (phase === 'state1') return state1Pose();
  if (phase === 'state2') return { x: STATE2.x, y: STATE2.y - PARALLAX * u, size: state2Size };
  const e = smootherstep(grow);
  return lerpPose(anim.src, { ...STATE2, size: state2Size }, e);
}
function titleTransform(e) { return { x: lerp(TITLE_ORIGIN.x, TITLE2.x, e), y: lerp(TITLE_ORIGIN.y, TITLE2.y, e), s: lerp(1, TITLE2.s, e) }; }

// ---------- render ----------
let lastSoft = null, lastGk = null, lastA = null;
function render(time) {
  const e = phase === 'state1' ? 0 : phase === 'state2' ? 1 : smootherstep(grow);
  const pose = currentPose();
  const beam = beamAt(light.y);
  const inState1 = phase === 'state1';
  const beamBlur = (focusBlur + beam.blur) * (1 - e);
  const dim = 1 - .88 * smooth(1100, 1750, u);
  const intensity = brightness * lerp(beam.intensity, 1, e) * dim;
  const vx = stageX + pose.x * scale, vy = stageY + pose.y * scale;

  // Light renderer (the only A/B difference).
  if (mode === 'png') {
    const w2 = smooth(.35, .85, e);
    lightPng.style.transform = `translate(${vx - 807.5}px, ${vy - 850.3}px) scale(${scale * pose.size})`;
    lightPng.style.opacity = intensity;
    const soft = `${Math.round(beamBlur)}px`; if (soft !== lastSoft) { lightPng.style.setProperty('--defocus', soft); lastSoft = soft; }
    const a = (1 - w2).toFixed(3); if (a !== lastA) { lightPng.style.setProperty('--a', a); lastA = a; }
    light2.style.transform = `translate(${vx - 729}px, ${vy - 901}px) scale(${scale * pose.size / STATE2.size})`;
    light2.style.opacity = w2 * intensity;
  } else {
    lightCss.style.transform = `translate(${vx - 407.5}px, ${vy - 450.3}px) scale(${scale * pose.size})`;
    lightCss.style.opacity = intensity;
    // Figma keeps the progressive blur radius absolute (100) as the light grows to 2418px.
    const g0 = anim?.src?.size ?? restSize();
    const gk = e === 0 ? '1' : (Math.pow(g0 / pose.size, e)).toFixed(3);
    if (gk !== lastGk) { lightCss.style.setProperty('--gk', gk); lastGk = gk; }
    const soft = String(Math.round(beamBlur)); if (soft !== lastSoft) { lightCss.style.setProperty('--defocus', soft); lastSoft = soft; }
  }

  // Content: grows with the light (same eased driver), then scrolls 1:1.
  content.style.transform = `translateY(${-u}px)`;
  const T = titleTransform(e);
  titleGroup.setAttribute('transform', `translate(${T.x} ${T.y}) scale(${T.s}) translate(${-TITLE_ORIGIN.x} ${-TITLE_ORIGIN.y})`);
  intro.style.opacity = smooth(.55, 1, e);
  curtain.style.opacity = smooth(.55, 1, e);
  curtain.style.setProperty('--photo', smooth(1450, 1800, u).toFixed(3));
  const shoreOn = u > U_SHORE - 982 - 200;
  if (shore.classList.contains('playing') !== shoreOn) { shore.classList.toggle('playing', shoreOn); shoreFx[shoreOn && !reducedMotion.matches ? 'unpauseAnimations' : 'pauseAnimations'](); }

  // Light in title-local coordinates (content y = viewport y + u).
  const Lloc = { x: TITLE_ORIGIN.x + (pose.x - T.x) / T.s, y: TITLE_ORIGIN.y + (pose.y + u - T.y) / T.s };
  const sizeLocal = pose.size / T.s;
  updateCentralRedState(time, Lloc, sizeLocal);
  redMark.setAttribute('opacity', redReveal.toFixed(4));
  const field = `translate(${Lloc.x} ${Lloc.y}) scale(${sizeLocal * K}) translate(-344.5 -344.5)`;
  illumination.setAttribute('transform', field); illumination.setAttribute('opacity', brightness);
  rimField.setAttribute('transform', field); coreField.setAttribute('transform', field);
  rimLettering.style.opacity = .38 * (1 - redReveal) * brightness;
  const r = (460 + beamBlur * .75).toFixed(2);
  outerColorField.setAttribute('r', r); lowerColorField.setAttribute('r', r);

  // Per-glyph shadows: designed resting offset, plus projection away from the live light.
  const sh = { dx: lerp(SHADOW1.dx, SHADOW2.dx, e), dy: lerp(SHADOW1.dy, SHADOW2.dy, e), s: lerp(SHADOW1.s, SHADOW2.s, e), blur: lerp(SHADOW1.blur, SHADOW2.blur, e) };
  shadowGroup.setAttribute('transform', `translate(${TITLE_ORIGIN.x + sh.dx} ${TITLE_ORIGIN.y + sh.dy}) scale(${sh.s}) translate(${-TITLE_ORIGIN.x} ${-TITLE_ORIGIN.y})`);
  const restLoc = inState1 ? origin : { x: TITLE_ORIGIN.x + (STATE2.x - TITLE2.x) / TITLE2.s, y: TITLE_ORIGIN.y + (STATE2.y - TITLE2.y) / TITLE2.s };
  const rest = inState1 ? origin : lerpPose(origin, restLoc, e);
  const live = phase === 'state2' ? rest : Lloc;   // parked in state 2: shadows move with the text
  for (const w of wordShadows) {
    const p = projection(w.cx, w.cy, w.height, live), q = projection(w.cx, w.cy, w.height, rest);
    const ox = clamp((p.x - q.x) * .5, -130, 130), oy = clamp((p.y - q.y) * .5, -130, 130);
    const st = Math.max(0, p.stretch - q.stretch), a = 1 + st * p.c * p.c, b = st * p.c * p.s, d = 1 + st * p.s * p.s;
    const m = `translate(${(ox + w.cx).toFixed(2)} ${(oy + w.cy).toFixed(2)}) matrix(${a.toFixed(4)} ${b.toFixed(4)} ${b.toFixed(4)} ${d.toFixed(4)} 0 0) translate(${-w.cx} ${-w.cy})`;
    w.el.setAttribute('transform', m);
    const sigma = (sh.blur * FIGMA_BLUR_TO_SIGMA * (1 + .5 * clamp(Math.hypot(ox, oy) / 70, 0, 1) + beamBlur * .02)).toFixed(1);
    if (sigma !== w.last) { w.sd.setAttribute('stdDeviation', sigma); w.last = sigma; }
  }
}

// ---------- loop ----------
function tick(time) {
  frame = 0;
  const dt = Math.min((time - lastTime) || 16.7, 50); lastTime = time;
  let busy = false;
  if (entering) {
    entranceStart ??= time;
    const elapsed = Math.max(0, (time - entranceStart) / 1000);
    Object.assign(light, entrancePlan.sample(elapsed));
    // Independent cues on the shared entrance timeline (25c8682).
    const opening = smootherstep(clamp(elapsed / .2, 0, 1));
    aperture = .7 + .3 * opening; focusBlur = 6 * (1 - opening); brightness = smootherstep(clamp(elapsed / .12, 0, 1));
    if (elapsed >= entrancePlan.duration || reducedMotion.matches) finishEntrance(), Object.assign(light, origin), Object.assign(target, origin);
    busy = true;
  } else if (phase === 'state1') {
    const ease = reducedMotion.matches ? 1 : 1 - Math.exp(-dt / 65);
    light.x += (target.x - light.x) * ease; light.y += (target.y - light.y) * ease;
    if (Math.hypot(target.x - light.x, target.y - light.y) < .05) Object.assign(light, target); else busy = true;
  }
  if (anim) {
    const p = reducedMotion.matches ? 1 : clamp((time - anim.start) / GROW_MS, 0, 1);
    grow = anim.to === 'state2' ? p : 1 - p;
    if (p >= 1) {
      phase = anim.to; anim.to === 'state1' && (Object.assign(light, origin), Object.assign(target, origin), aperture = 1);
      if (anim.to === 'state1') anim = null; else anim = { ...anim, done: true };
    } else busy = true;
  }
  render(time);
  if (redReveal !== redRevealGoal) busy = true;
  if (busy) wake();
}
function wake() { if (!frame) frame = requestAnimationFrame(tick); }
function finishEntrance() { entering = false; aperture = brightness = 1; focusBlur = 0; }

// ---------- state 1 ⇄ state 2 ----------
function startGrow() {
  if (phase !== 'state1' || !started) return;
  finishEntrance();
  anim = { to: 'state2', start: performance.now(), src: state1Pose() };
  phase = 'grow'; window.scrollTo(0, 0); wake();
}
function startShrink() {
  if (phase !== 'state2') return;
  // Reverse the same eased path back to the resting state-1 pose.
  anim = { to: 'state1', start: performance.now(), src: { ...origin, size: restSize() } };
  phase = 'shrink'; wake();
}
function gestureLocked(now) { return phase === 'grow' || phase === 'shrink' || now < gestureLockUntil; }
addEventListener('wheel', ev => {
  const now = performance.now();
  if (gestureLocked(now)) { ev.preventDefault(); gestureLockUntil = Math.max(gestureLockUntil, now + GESTURE_GAP); return; }
  if (phase === 'state1') {
    if (ev.deltaY > 0) { ev.preventDefault(); startGrow(); gestureLockUntil = now + GESTURE_GAP; }
    return;
  }
  if (phase === 'state2' && window.scrollY <= 0 && ev.deltaY < 0) { ev.preventDefault(); startShrink(); gestureLockUntil = now + GESTURE_GAP; }
}, { passive: false });
let touchY = null;
addEventListener('touchstart', ev => { touchY = ev.touches[0]?.clientY ?? null; }, { passive: true });
addEventListener('touchmove', ev => {
  if (touchY === null) return; const dy = touchY - ev.touches[0].clientY;
  if (phase === 'grow' || phase === 'shrink') { ev.preventDefault(); return; }
  if (phase === 'state1' && dy > 12) { ev.preventDefault(); startGrow(); touchY = null; }
  else if (phase === 'state2' && window.scrollY <= 0 && dy < -12) { ev.preventDefault(); startShrink(); touchY = null; }
}, { passive: false });
addEventListener('keydown', ev => {
  if (ev.target.closest?.('button')) return;
  const down = ['ArrowDown', 'PageDown', ' ', 'Spacebar'].includes(ev.key), up = ['ArrowUp', 'PageUp', 'Home'].includes(ev.key);
  if (phase === 'grow' || phase === 'shrink') { if (down || up) ev.preventDefault(); return; }
  if (phase === 'state1') {
    if (down) { ev.preventDefault(); startGrow(); return; }
    const delta = { ArrowLeft: [-35, 0], ArrowRight: [35, 0] }[ev.key];
    if (ev.key === 'Escape') { finishEntrance(); Object.assign(target, origin); wake(); }
    if (delta) { ev.preventDefault(); finishEntrance(); const v = viewBounds(); target.x = clamp(target.x + delta[0], v.x0, v.x1); wake(); }
  } else if (phase === 'state2' && up && window.scrollY <= 0) { ev.preventDefault(); startShrink(); }
});
addEventListener('scroll', () => {
  if (phase === 'state1' && window.scrollY > 0 && started) { startGrow(); u = 0; return; }   // scrollbar / other inputs
  if (phase === 'state1' || phase === 'grow' || phase === 'shrink') { if (window.scrollY !== 0) window.scrollTo(0, 0); u = 0; return; }
  u = clamp(window.scrollY / scale, 0, U_MAX); wake();
}, { passive: true });

// ---------- pointer (state 1 only; parked in state 2) ----------
function viewBounds() { return { x0: -stageX / scale, x1: (vw - stageX) / scale, y0: -stageY / scale, y1: (vh - stageY) / scale }; }
function aimPointer(ev) { const v = viewBounds(), r = scene.getBoundingClientRect(); target.x = clamp((ev.clientX - r.left - stageX) / scale, v.x0, v.x1); target.y = clamp((ev.clientY - r.top - stageY) / scale, v.y0, v.y1); }
scene.addEventListener('pointermove', ev => { if (entering || phase !== 'state1') return; aimPointer(ev); wake(); });
scene.addEventListener('pointerdown', ev => { if (phase !== 'state1' || ev.target.closest('button,a')) return; finishEntrance(); aimPointer(ev); wake(); });
scene.addEventListener('pointerleave', () => { if (!entering && phase === 'state1') { Object.assign(target, origin); wake(); } });

// ---------- layout ----------
function resize() {
  vw = scene.clientWidth; vh = scene.clientHeight;
  scale = Math.min(vw / 1512, vh / 982);
  stageX = (vw - 1512 * scale) / 2; stageY = (vh - 982 * scale) / 2;
  stageEl.style.transform = `translate(${stageX}px, ${stageY}px) scale(${scale})`;
  journey.style.height = `${vh + U_MAX * scale}px`;
  // Let The Other Shore's photograph cover wider desktop ratios.
  shore.style.setProperty('--city-scale', Math.max(1, (vw / scale) / 1640).toFixed(3));
  // Parked light must cover every viewport corner (keep them inside 93% of the radius).
  const v = viewBounds(), far = Math.max(...[[v.x0, v.y0], [v.x1, v.y0], [v.x0, v.y1], [v.x1, v.y1]].map(([x, y]) => Math.hypot(x - STATE2.x, y - STATE2.y)));
  state2Size = Math.max(STATE2.size, far / .93 / 307.5);
  if (phase === 'state2') u = clamp(window.scrollY / scale, 0, U_MAX);
  wake();
}
addEventListener('resize', resize);
resize();

// ---------- prototype switch ----------
const badge = $('.proto-badge');
badge.textContent = mode === 'png' ? 'B · Figma PNG light ⇄' : 'A · CSS light ⇄';
badge.addEventListener('click', ev => { ev.preventDefault(); const q = new URLSearchParams(location.search); q.set('light', mode === 'png' ? 'css' : 'png'); location.search = q; });
if (new URLSearchParams(location.search).has('record')) document.documentElement.classList.add('recording');

// ---------- start once fonts and images are ready (dark until then) ----------
if (entering) { entrancePlan = createEntrancePlan(); Object.assign(light, entrancePlan.sample(0)); }
render(0);
const fontsReady = document.fonts ? Promise.all([document.fonts.load('184px AaRuiYaTi', '境缘'), document.fonts.load('600 32px "Noto Serif SC"', '台')]).catch(() => {}) : Promise.resolve();
Promise.race([Promise.all([fontsReady, ...[...document.images].map(i => i.decode().catch(() => {}))]), new Promise(r => setTimeout(r, 2500))])
  .then(() => { started = true; entranceStart = null; if (window.scrollY) window.scrollTo(0, 0); wake(); });
// Test hook (used by the comparison recorder; harmless otherwise).
window.__stage = { get phase() { return phase; }, get u() { return u; }, get redReveal() { return redReveal; }, get light() { return { ...light }; }, get entering() { return entering; } };
