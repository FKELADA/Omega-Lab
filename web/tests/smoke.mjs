// End-to-end smoke test: walks every lesson in a real browser — predictions,
// misconception feedback, step checks — then language, theme and phone layout.
// Usage: npm run dev (in another terminal), then `node tests/smoke.mjs [outDir]`.
// Uses the locally installed Chrome; set CHROME_PATH to override.

import { chromium } from 'playwright-core';

const URL = process.env.OMEGA_URL ?? 'http://localhost:5173/';
const out = process.argv[2] ?? '.';
const executablePath = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await chromium.launch({ executablePath });
// One context (shared storage: language, theme), and a page that can be renewed:
// hundreds of reloads of one tab in dev mode exhaust Chrome's resources.
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'fr-FR' });
const errors = [];
const watch = (pg) => {
  pg.on('pageerror', (e) => errors.push(e.message));
  pg.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return pg;
};
let page = watch(await context.newPage());

const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) process.exitCode = 1;
};
const doneSteps = () => page.locator('.dot.done').count();

/** Moves the k-th slider of the parameter rail to `value`. */
const setParam = (k, value, min, max, log = false) =>
  page.evaluate(
    ([k, pos]) => {
      const el = document.querySelectorAll('.params input[type=range]')[k];
      el.value = String(pos);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    },
    [k, Math.round(1000 * (log ? Math.log(value / min) / Math.log(max / min) : (value - min) / (max - min)))],
  );
const scrubToEnd = () =>
  page.evaluate(() => {
    const t = document.getElementById('tcursor');
    t.value = '1000';
    t.dispatchEvent(new Event('input', { bubbles: true }));
  });

/** Sketches y(f) on the oscilloscope, f ∈ [0, 1] across, y ∈ [0, 1] down, then reveals. */
async function predict(y) {
  await page.locator('.lesson .btn.primary').click();
  const box = await page.locator('.u-over').boundingBox();
  await page.mouse.move(box.x + 2, box.y + y(0) * box.height);
  await page.mouse.down();
  for (let k = 0; k <= 120; k++) {
    const f = k / 120;
    await page.mouse.move(box.x + 2 + f * (box.width - 4), box.y + y(f) * box.height);
  }
  await page.mouse.up();
  await page.getByRole('button', { name: 'Révéler' }).first().click();
  return (await page.locator('.feedback').textContent().catch(() => '')) ?? '';
}

let opened = 0;
async function open(id) {
  // A fresh tab every 40 lessons: hundreds of reloads of one tab in dev mode exhaust Chrome.
  if (++opened % 40 === 0) {
    const size = page.viewportSize();
    await page.close();
    page = watch(await context.newPage());
    if (size) await page.setViewportSize(size);
  }
  await page.goto(`${URL}#${id}`);
  await page.reload();
  try {
    await page.waitForSelector('.u-over', { timeout: 60000 });
  } catch (e) {
    // Say what the page shows when a lesson does not come up.
    const body = (await page.locator('body').innerHTML().catch(() => '')).replace(/s+/g, ' ').slice(0, 400);
    console.log('STUCK', id, 'overlay:', await page.locator('vite-error-overlay').count(), 'errors:', errors.slice(-3).join(' | '), 'body:', body);
    throw e;
  }
}

// ── 1.2 RLC transients ────────────────────────────────────────────────────────
await open('1.2');
await page.locator('.lesson .btn.primary').click();
check('1.2 equations concealed while predicting', (await page.locator('.eqs .concealed').count()) === 1);
await page.reload(); // start the prediction afresh
await page.waitForSelector('.u-over');
let fb = await predict((f) => 0.5 - 0.35 * Math.sin(Math.PI * Math.min(1, f * 3)) * Math.exp(-2 * f));
check('1.2 prediction scored', /\d+ %/.test((await page.locator('.score b').textContent()) ?? ''));
check('1.2 misconception: current reverses', /change de signe/.test(fb), fb.slice(0, 70));
await scrubToEnd();
await setParam(0, 20, 0.1, 200, true); // R = Rc
check('1.2 critical damping reached', /critique/.test((await page.locator('.regime').textContent()) ?? ''));
await setParam(0, 0.1, 0.1, 200, true);
await page.getByRole('button', { name: '❄ Figer et comparer' }).click();
await setParam(1, 40e-3, 1e-3, 1, true); // L × 4
await page.locator('.param').first().getByRole('button', { name: /Balayer/ }).click();
check('1.2 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);
check('1.2 a completed step shows its full explanation', (await page.locator('.lesson .answer .katex').count()) > 0);
await page.locator('.dot').nth(2).click(); // a done step
check('1.2 explanation shown on a done step', (await page.locator('.lesson .answer').count()) === 1);
await page.screenshot({ path: `${out}/smoke-answer.png` });
await page.getByRole('button', { name: 'Chercheur' }).click();
check('1.2 researcher sees state-space form', (await page.getByText('Représentation d’état').count()) === 1);
await page.getByRole('button', { name: 'Apprenant' }).click();
await page.locator('.dot').last().click();
await page.locator('footer a.btn').click();
await page.waitForTimeout(200);
check('1.2 last step links to lesson 1.3', (await page.evaluate(() => location.hash)) === '#1.3');

// ── 1.3 AC and RMS ────────────────────────────────────────────────────────────
await open('1.3');
fb = await predict((f) => 0.45 - 0.3 * Math.sin(2 * Math.PI * 2 * f));
check('1.3 misconception: power never negative', /jamais/.test(fb), fb.slice(0, 70));
await scrubToEnd();
await page.getByRole('radio', { name: 'Continu' }).click();
await setParam(0, 230, 1, 400);
await page.getByRole('radio', { name: 'Carré' }).click();
const meterErr = (await page.locator('.err b').textContent()) ?? '';
check('1.3 average-responding meter reads a square wave 11 % high', /\+11/.test(meterErr), meterErr);
check('1.3 all steps completed', (await doneSteps()) === 4, `${await doneSteps()}/4`);
await page.screenshot({ path: `${out}/smoke-1.3.png` });

// ── 1.4 Resonance ─────────────────────────────────────────────────────────────
await open('1.4');
await scrubToEnd();
const bode = await page.locator('.bode svg').boundingBox();
await page.mouse.click(bode.x + bode.width * 0.8, bode.y + bode.height / 2);
const fAfterClick = (await page.locator('.bode .foot b').textContent()) ?? '';
check('1.4 clicking the frequency response retunes f', !/^100 Hz$/.test(fAfterClick), fAfterClick);
await setParam(0, 159.15, 10, 2000, true); // f = f0
check('1.4 resonance note shown', (await page.getByText('Résonance', { exact: false }).count()) > 0);
await setParam(1, 1, 0.2, 200, true); // R = 1 Ω → Q = 10
await page.locator('.param').nth(1).getByRole('button', { name: /Balayer/ }).click();
await setParam(0, 300, 10, 2000, true); // inductive side
check('1.4 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);
await page.screenshot({ path: `${out}/smoke-1.4.png` });

// ── 2.1 Euler ─────────────────────────────────────────────────────────────────
await open('2.1');
fb = await predict((f) => 0.5 - 0.42 * Math.cos(2 * Math.PI * 2 * f));
check('2.1 misconception: amplitudes do not simply add', /en phase/.test(fb), fb.slice(0, 70));
await page.getByRole('button', { name: 'Bout : cercle' }).click();
await setParam(3, 0, -180, 180); // φ2 = φ1 → in phase
await setParam(3, 180, -180, 180); // opposite → cancel
await setParam(1, 120, -180, 180);
await setParam(3, -120, -180, 180);
check('2.1 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);
await page.screenshot({ path: `${out}/smoke-2.1.png` });

// ── 2.2 Impedance ─────────────────────────────────────────────────────────────
await open('2.2');
fb = await predict((f) => 0.5 - 0.35 * Math.cos(2 * Math.PI * 2 * f)); // in phase with v
check('2.2 misconception: inductor current lags', /ne suit pas/.test(fb), fb.slice(0, 70));
await page.getByRole('radio', { name: 'C', exact: true }).click();
await page.getByRole('radio', { name: 'L', exact: true }).click();
await setParam(0, 500, 5, 5000, true);
await page.getByRole('radio', { name: 'R + L' }).click();
await setParam(0, 10 / (2 * Math.PI * 0.05), 5, 5000, true); // corner frequency
await page.getByRole('radio', { name: 'R + C' }).click();
await setParam(0, 5000, 5, 5000, true);
check('2.2 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// ── 2.3 Power ─────────────────────────────────────────────────────────────────
await open('2.3');
fb = await predict((f) => 0.25 - 0.15 * Math.cos(2 * Math.PI * 4 * f)); // never below zero
check('2.3 misconception: power goes negative', /négative/.test(fb), fb.slice(0, 70));
await page.locator('.chip').nth(3).click(); // p_Q
await scrubToEnd();
await setParam(2, 420e-6, 0, 1.5e-3);
await setParam(2, 613e-6, 0, 1.5e-3);
await setParam(2, 1000e-6, 0, 1.5e-3);
check('2.3 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// ── 2.4 Three-phase ───────────────────────────────────────────────────────────
await open('2.4');
check('2.4 starts with no step done', (await doneSteps()) === 0, `${await doneSteps()}`);
fb = await predict((f) => 0.45 - 0.3 * Math.sin(2 * Math.PI * 4 * f)); // pulsing
check('2.4 misconception: total power is constant', /constante/.test(fb), fb.slice(0, 70));
await page.getByRole('radio', { name: 'Monophasé' }).click();
await page.getByRole('radio', { name: 'Triphasé' }).click();
await setParam(1, 100, 5, 500, true); // unbalance phase B
await page.getByRole('switch').click(); // break the neutral
const bad = await page.locator('.u.bad').count();
check('2.4 broken neutral flags an out-of-tolerance load voltage', bad > 0, `${bad}`);
await page.getByRole('switch').click(); // reconnect
await setParam(1, 26.45, 5, 500, true);
check('2.4 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// ── 2.5 Clarke and Park ───────────────────────────────────────────────────────
await open('2.5');
fb = await predict((f) => 0.5 - 0.3 * Math.cos(2 * Math.PI * 2 * f)); // oscillating
check('2.5 misconception: v_d is constant', /immobile/.test(fb), fb.slice(0, 70));
await setParam(0, 0, 0, 1.5); // fixed frame
await setParam(0, 1, 0, 1.5);
await setParam(1, 0, -180, 180); // align d
await setParam(2, 0.6, 0, 1.5); // unbalance
await setParam(2, 1, 0, 1.5);
await setParam(3, 12, 0, 30); // 5th harmonic
check('2.5 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// ── 2.6 Per-unit ──────────────────────────────────────────────────────────────
await open('2.6');
await page.getByRole('radio', { name: '10 MVA' }).click();
await setParam(0, 30e6, 1e6, 40e6); // heavy load
await setParam(2, 1.1, 0.9, 1.1); // tap up
await setParam(2, 1, 0.9, 1.1);
await setParam(1, 1, 0.7, 1); // unity power factor
check('2.6 all steps completed', (await doneSteps()) === 4, `${await doneSteps()}/4`);

// ── 2.7 Fourier ───────────────────────────────────────────────────────────────
await open('2.7');
await setParam(0, 15, 1, 49);
await setParam(0, 49, 1, 49);
await page.getByRole('radio', { name: 'Triangle' }).click();
await setParam(0, 3, 1, 49);
await page.getByRole('radio', { name: 'Redresseur 6 pulses' }).click();
const thd = (await page.locator('.thd b').first().textContent()) ?? '';
check('2.7 six-pulse rectifier THD ≈ 31 %', /^31/.test(thd), thd);
await page.getByRole('button', { name: '♪ Écouter' }).click();
check('2.7 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// ── 2.8 Symmetrical components ────────────────────────────────────────────────
await open('2.8');
await page.locator('.presets').getByRole('button', { name: 'Équilibré', exact: true }).click();
await page.locator('.presets').getByRole('button', { name: 'b ↔ c', exact: true }).click();
await page.locator('.presets').getByRole('button', { name: 'Homopolaire pur', exact: true }).click();
await page.locator('.presets').getByRole('button', { name: 'Défaut phase a – terre', exact: true }).click();
await page.locator('.presets').getByRole('button', { name: 'Équilibré', exact: true }).click();
await setParam(3, 0.95, 0, 1.5); // 5 % dip on phase c
check('2.8 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// ── 3.1 Poles and zeros ───────────────────────────────────────────────────────
await open('3.1');
// y-range is [−0.3, 2]: a value v sits at (2 − v)/2.3 from the top.
fb = await predict((f) => (2 - (1 - Math.exp(-5 * f))) / 2.3); // smooth, no overshoot
check('3.1 misconception: lightly damped poles overshoot', /peu amortie/.test(fb), fb.slice(0, 70));
const pz = await page.locator('svg[aria-label="s-plane"]').boundingBox();
await page.mouse.click(pz.x + pz.width * 0.95, pz.y + pz.height * 0.3); // click right of the axis
check('3.1 clicking the s-plane moves the poles to the right half-plane', /Instable/.test((await page.locator('.verdict').textContent()) ?? ''));
await setParam(0, -10, -40, 5);
await setParam(1, 5, 0, 40);
await page.getByRole('radio', { name: 'Avec zéro' }).click();
check('3.1 all steps completed', (await doneSteps()) === 4, `${await doneSteps()}/4`);

// ── 3.2 Bode and Nyquist ──────────────────────────────────────────────────────
await open('3.2');
fb = await predict((f) => (1.8 - (1 - Math.exp(-6 * f))) / 2.0); // settles at 1
check('3.2 misconception: type-0 loop keeps a steady-state error', /ne rejoint pas/.test(fb), fb.slice(0, 70));
await setParam(0, 40, 0.1, 300, true);
await setParam(0, 150, 0.1, 300, true); // beyond the critical gain (≈ 122)
check('3.2 Nyquist reports instability', /instable/.test((await page.locator('.verdict').textContent()) ?? ''));
// K for a 45° phase margin, computed independently: phase(ωc) = −135°, K = Π√(1 + (ωc/p)²).
const poles = [1, 10, 100];
let lo = 0.01, hi = 1000;
for (let i = 0; i < 100; i++) {
  const w = Math.sqrt(lo * hi);
  const ph = -poles.reduce((s, p) => s + Math.atan(w / p), 0) * (180 / Math.PI);
  if (ph > -135) lo = w; else hi = w;
}
const K45 = poles.reduce((k, p) => k * Math.hypot(1, lo / p), 1);
await setParam(0, K45, 0.1, 300, true);
await setParam(0, 25, 0.1, 300, true);
check('3.2 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5 (K45 = ${K45.toFixed(2)})`);

// ── 3.3 Swing equation ────────────────────────────────────────────────────────
await open('3.3');
fb = await predict((f) => 0.583 - 0.166 * (1 - Math.exp(-8 * f))); // monotonic
check('3.3 misconception: the rotor overshoots and swings', /dépasse/.test(fb), fb.slice(0, 70));
await scrubToEnd();
await setParam(1, 0.3, -0.4, 0.6);
await setParam(1, 0.5, -0.4, 0.6);
check('3.3 loss of synchronism shown', (await page.getByText('perte de synchronisme').count()) > 0);
await setParam(1, 0.05, -0.4, 0.6);
await setParam(2, 0.7, 0.6, 2);
await setParam(4, 12, 0, 30);
check('3.3 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);

// ── 3.4 PLL ───────────────────────────────────────────────────────────────────
await open('3.4');
fb = await predict(() => 0.5); // flat: "the frequency did not change"
check('3.4 misconception: a phase jump spikes the frequency estimate', /accélérer/.test(fb), fb.slice(0, 70));
await setParam(2, 60, 2, 100, true);
await setParam(2, 20, 2, 100, true);
await setParam(1, 1, -2, 2);
await page.getByRole('radio', { name: 'P seul' }).click();
await page.getByRole('radio', { name: 'PI', exact: true }).click();
await setParam(0, 70, -90, 90);
await setParam(4, 2, 1, 50, true);
await page.getByRole('radio', { name: 'Sans', exact: true }).click();
await page.getByRole('radio', { name: 'Anti-emballement' }).click();
check('3.4 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);

// ── 0.1 A day on the grid ─────────────────────────────────────────────────────
await open('0.1');
fb = await predict(() => 0.5); // flat demand
check('0.1 misconception: demand varies over the day', /varie/.test(fb), fb.slice(0, 70));
await scrubToEnd();
await page.getByRole('radio', { name: '400 kV', exact: true }).click();
await setParam(2, 30, 0, 40); // lots of PV
await setParam(2, 10, 0, 40);
await setParam(0, 45, 0, 60); // nuclear 45 GW balances the day
check('0.1 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// ── 0.2 Blackout replay ───────────────────────────────────────────────────────
await open('0.2');
const fy = (v) => (50.3 - v) / 2; // y-range [48.3, 50.3]
fb = await predict((f) => (f < 1 / 60 ? fy(50) : fy(48.8))); // an instant step down
check('0.2 misconception: frequency cannot drop instantly', /instantanément/.test(fb), fb.slice(0, 70));
await scrubToEnd();
await setParam(1, 2, 1.5, 8); // low inertia
await setParam(1, 4, 1.5, 8);
await page.getByRole('radio', { name: 'Protections RoCoF : non' }).click();
await page.getByRole('radio', { name: 'Protections RoCoF : oui' }).click();
await setParam(1, 8, 1.5, 8);
await setParam(2, 2500, 200, 2500);
await setParam(3, 1, 1, 20, true);
check('0.2 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// ── 1.1 R, L, C as energy elements ────────────────────────────────────────────
await open('1.1');
const tri = (f) => {
  const ph = (2 * f) % 1;
  return ph < 0.25 ? 4 * ph : ph < 0.75 ? 2 - 4 * ph : 4 * ph - 4;
};
fb = await predict((f) => 0.5 - 0.3 * tri(f)); // copies the current's triangle
check('1.1 misconception: v_L follows the slope, not the current', /pente/.test(fb), fb.slice(0, 70));
await page.getByRole('radio', { name: 'Sinus' }).click();
await scrubToEnd();
await page.getByRole('radio', { name: 'Condensateur' }).click();
await page.getByRole('radio', { name: 'Triangle' }).click();
await page.getByRole('radio', { name: 'Résistance' }).click();
await page.getByRole('radio', { name: 'Bobine' }).click();
await page.getByRole('radio', { name: 'Trapèze' }).click();
await setParam(2, 1e-4, 5e-5, 2e-2, true);
check('1.1 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// ── 1.5 DC versus AC ──────────────────────────────────────────────────────────
await open('1.5');
await scrubToEnd();
await setParam(0, 30, 10, 2000, true);
await setParam(0, 800, 10, 2000, true);
await page.getByRole('radio', { name: /Câble/ }).click();
await setParam(0, 150, 10, 2000, true);
check('1.5 all steps completed', (await doneSteps()) === 4, `${await doneSteps()}/4`);

// ── 4.1 Transmission lines ────────────────────────────────────────────────────
const wave = (f) => 0.5 - 0.3 * Math.sin(2 * Math.PI * 2 * f);
const scored = async (id) => check(`${id} prediction scored`, /\d+ %/.test((await page.locator('.score b').textContent()) ?? ''));
await open('4.1');
await predict(wave);
await scored('4.1');
await setParam(1, 529, 0, 2000); // the natural load
await setParam(1, 800, 0, 2000);
await page.getByRole('radio', { name: 'Ligne courte' }).click();
await page.getByRole('radio', { name: 'π nominal' }).click();
await setParam(0, 150, 10, 1000, true);
check('4.1 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// ── 4.2 Transformers ──────────────────────────────────────────────────────────
await open('4.2');
await predict((f) => 0.85 - 0.6 * Math.max(0, Math.sin(2 * Math.PI * 4 * f)) * Math.exp(-2 * f));
await scored('4.2');
await setParam(0, 90, 0, 180); // energise at the voltage peak …
await setParam(1, 0, -0.8, 0.8); // … with no residual flux: no inrush
await setParam(1, -0.8, -0.8, 0.8); // residual flux of the wrong sign
await setParam(3, 0.03, 0.002, 0.05, true);
await setParam(4, 0.447, 0, 1.2); // copper losses = iron losses
check('4.2 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// ── 4.3 Tap changer, phase shifter, vector groups ─────────────────────────────
await open('4.3');
await predict(() => 0.4);
await scored('4.3');
await setParam(0, 0.86, 0.85, 1.08); // beyond the regulating range
check('4.3 tap changer at its limit', /butée/.test((await page.locator('.panel').first().textContent()) ?? ''));
await setParam(0, 0.92, 0.85, 1.08);
await setParam(1, 0.8, 0.5, 4); // band narrower than a tap step
check('4.3 hunting shown', /pompage/.test((await page.locator('.panel').first().textContent()) ?? ''));
await setParam(1, 2, 0.5, 4);
await setParam(2, 8, 5, 60);
await setParam(3, -6, -15, 15);
await page.getByRole('radio', { name: 'Dyn11' }).click();
check('4.3 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);

// ── 4.4 Synchronous machine ───────────────────────────────────────────────────
await open('4.4');
await predict((f) => 0.5 - 0.35 * Math.sin(2 * Math.PI * 12 * f) * Math.exp(-3 * f));
await scored('4.4');
await setParam(5, 90, 0, 90); // fault at the voltage zero: full DC offset
await page.getByRole('radio', { name: 'Régime établi' }).click();
await setParam(1, 2.4, 0.3, 2.8); // over-excited
await setParam(1, 1.55, 0.3, 2.8); // under-excited
await setParam(1, 1.753, 0.3, 2.8); // unity power factor
await setParam(0, 1, 0, 1);
await setParam(1, 1.9, 0.3, 2.8); // δ ≈ 71°
check('4.4 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);

// ── 4.5 Synchronous machine: models and controls ──────────────────────────────
await open('4.5');
await predict((f) => (f < 0.05 ? 0.2 : 0.2 + 0.3 * Math.min(1, (f - 0.05) * 10)));
await scored('4.5');
await setParam(1, 4, 2, 10); // 4 % droop holds 49.8 Hz
await page.getByRole('radio', { name: 'Défaut puis déclenchement de ligne' }).click();
await page.getByRole('radio', { name: 'Un axe (3 états + AVR)' }).click();
await setParam(2, 30, 0, 400);
await setParam(2, 100, 0, 400);
await setParam(3, 0.5, 0.2, 0.6); // weak grid: the swing grows
check('4.5 growing oscillations flagged', /oscillations croissantes|perte de synchronisme/.test((await page.locator('.panel').first().textContent()) ?? ''));
check('4.5 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);

// ── 4.6 Loads ─────────────────────────────────────────────────────────────────
await open('4.6');
await predict((f) => (f < 0.08 ? 0.2 : 0.7));
await scored('4.6');
await setParam(2, 0, 0, 1);
await setParam(1, 1, 0, 1); // pure constant impedance
await setParam(1, 0, 0, 1); // pure constant power …
await page.locator('.chip').nth(2).click(); // … and show its current
await setParam(3, 0.8, 0, 1);
await scrubToEnd();
await setParam(3, 0, 0, 1);
await setParam(1, 0.7, 0, 1);
await setParam(0, 0.96, 0.85, 1.05); // conservation voltage reduction
check('4.6 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// ── 4.7 Loads: exponential and frequency ──────────────────────────────────────
await open('4.7');
await setParam(0, 2, 0, 2.5);
await setParam(0, 0, 0, 2.5);
await setParam(0, 1.1, 0, 2.5); // the ZIP equivalent
await setParam(1, 3, 0, 5);
await setParam(2, 2, 0, 3);
await setParam(4, -0.5, -1, 0.5);
check('4.7 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// ── 4.8 Induction motor ───────────────────────────────────────────────────────
await open('4.8');
await predict((f) => (f < 0.35 ? 0.15 : 0.8));
await scored('4.8');
await page.getByRole('radio', { name: 'Couple constant' }).click(); // 0.8 pu > starting torque
await page.getByRole('radio', { name: 'En marche' }).click();
await setParam(0, 0.9, 0, 1.5);
await setParam(5, 0.2, 0.2, 3);
await setParam(2, 0.5, 0.3, 1);
await setParam(3, 0.5, 0.05, 1, true);
await scrubToEnd();
check('4.8 constant torque stalls in the dip', /calé/.test((await page.locator('.panel').first().textContent()) ?? ''));
await page.getByRole('radio', { name: 'Ventilateur' }).click();
await setParam(4, 0.07, 0.005, 0.1, true);
check('4.8 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// ── 4.9 Compensation ──────────────────────────────────────────────────────────
await open('4.9');
await setParam(0, 0.8, 0, 2.2); // already below 0.9 pu at 0.6 pu load
await setParam(2, 0.45, -0.5, 1);
await setParam(0, 0.1, 0, 2.2);
await setParam(2, 0.6, -0.5, 1);
await setParam(3, 0.5, 0, 0.7);
await setParam(3, 0, 0, 0.7);
await setParam(0, 2.2, 0, 2.2); // beyond the nose
check('4.9 collapse shown', /effondr/i.test((await page.locator('.panel').first().textContent()) ?? ''));
check('4.9 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// ── 4.10 FACTS ─────────────────────────────────────────────────────────────────
await open('4.10');
await scrubToEnd();
await setParam(0, 0.45, 0.4, 0.95);
await setParam(1, 9, 1.5, 10);
await setParam(4, 0.01, 0.005, 0.2, true);
await setParam(1, 3, 1.5, 10);
await setParam(0, 0.7, 0.4, 0.95);
await setParam(2, 0.7, 0.2, 1); // STATCOM sized to hold 0.9 pu
check('4.10 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// ── Module 5 ──────────────────────────────────────────────────────────────────
const setCursor = (f) =>
  page.evaluate((v) => {
    const t = document.getElementById('tcursor');
    t.value = String(Math.round(v * 1000));
    t.dispatchEvent(new Event('input', { bubbles: true }));
  }, f);

// 5.1 Y-bus and Newton–Raphson
await open('5.1');
fb = await predict((f) => 0.08 + 0.5 * f); // a slow, straight decline
check('5.1 misconception: quadratic convergence', /quadratiquement/.test(fb), fb.slice(0, 70));
const ybtn = page.locator('.panel header .btn', { hasText: /Construire|Ajouter/ });
for (let k = 0; k < 6; k++) await ybtn.click();
await page.getByRole('radio', { name: 'Ligne 3–4' }).click();
await setParam(2, 1.06, 0.95, 1.08); // generator 2 setpoint
await page.getByRole('radio', { name: 'Aucune' }).click();
await setParam(2, 1.01, 0.95, 1.08);
await setParam(0, 3.2, 0.2, 4); // six iterations
await setParam(0, 4, 0.2, 4); // beyond the nose
check('5.1 divergence shown', /ne converge pas/.test((await page.locator('.panel').first().textContent()) ?? ''));
check('5.1 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);

// 5.2 P–V and Q–V
await open('5.2');
fb = await predict((f) => 0.2 + 0.25 * f); // keeps falling gently to 3.5×
check('5.2 misconception: no solution beyond the nose', /plus de solution/.test(fb), fb.slice(0, 70));
await scrubToEnd();
await setParam(1, 1, 0.3, 5); // generator 2 reactive limit
await setParam(2, 0.5, 0, 0.8); // capacitor at bus 4
await page.getByRole('radio', { name: 'Ligne 1–3' }).click();
await setCursor(1.26 / 3.5); // close to the nose
check('5.2 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);

// 5.3 Faults
await open('5.3');
fb = await predict((f) => 0.5 - 0.04 * Math.sin(2 * Math.PI * 6 * f)); // load-sized current throughout
check('5.3 misconception: fault current is several times load', /plusieurs fois/.test(fb), fb.slice(0, 70));
await page.getByRole('radio', { name: 'Triphasé' }).click();
await page.getByRole('radio', { name: 'Phase–terre' }).click();
await page.getByRole('radio', { name: 'Isolé' }).click();
await page.getByRole('radio', { name: 'À la terre' }).click();
await setParam(0, 5, 0, 100);
await page.getByRole('radio', { name: 'Biphasé', exact: true }).click();
await page.getByRole('radio', { name: 'Phase–terre' }).click();
await setParam(1, 0.6, 0, 1);
check('5.3 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);

// 5.4 Economic dispatch
await open('5.4');
fb = await predict(() => 0.55); // a flat price
check('5.4 misconception: the price is not fixed', /pas fixe/.test(fb), fb.slice(0, 70));
await setParam(0, 1050, 600, 1300);
await setCursor(19 / 24); // G2 and G3 both running
await setParam(2, 400, 200, 1000);
await setParam(1, 350, 0, 600);
check('5.4 congestion shown at the evening peak', /congestion/.test((await page.locator('.panel').first().textContent()) ?? ''));
await setParam(1, 600, 0, 600);
await setParam(2, 250, 200, 1000);
check('5.4 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);

// 5.5 A day on a feeder
await open('5.5');
fb = await predict((f) => 0.35 + 0.1 * Math.sin(Math.PI * f)); // always below the substation
check('5.5 misconception: voltage rises at midday', /élévation/.test(fb), fb.slice(0, 70));
await setCursor(13 / 24);
check('5.5 reverse flow shown', /flux inverse/.test((await page.locator('.panel').first().textContent()) ?? ''));
await setParam(0, 3.51, 0, 6);
await page.getByRole('radio', { name: 'Q(V)' }).click();
await page.getByRole('radio', { name: 'Aucun', exact: true }).click();
await setParam(1, 0.99, 0.97, 1.06);
await page.getByRole('radio', { name: 'Écrêtement P(V)' }).click();
await setParam(0, 5.1, 0, 6);
check('5.5 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);

// ── Module 6 ──────────────────────────────────────────────────────────────────
// 6.1 Choppers
await open('6.1');
fb = await predict(() => 0.4); // a constant current
check('6.1 misconception: the inductor current is a triangle', /triangle/.test(fb), fb.slice(0, 70));
await setParam(0, 0.25, 0.05, 0.9); // 12 V
await page.getByRole('radio', { name: 'Élévateur' }).click();
await setParam(0, 0.5, 0.05, 0.9); // 96 V
await setParam(2, 20, 10, 2000, true);
await setParam(4, 50, 2, 100, true); // discontinuous
await setParam(2, 2000, 10, 2000, true);
await setParam(4, 10, 2, 100, true);
await setParam(1, 100, 5, 100, true); // smooth
await page.getByRole('radio', { name: 'Inverseur' }).click();
await setParam(0, 0.7, 0.05, 0.9);
check('6.1 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);

// 6.2 Thyristor bridge
await open('6.2');
fb = await predict(() => 0.2); // a flat DC voltage
check('6.2 misconception: six caps per period', /six calottes/.test(fb), fb.slice(0, 70));
await setParam(0, 0, 0, 165);
await setParam(1, 0, 0, 2); // diode bridge
await setParam(0, 60, 0, 165);
await setParam(0, 120, 0, 165); // inverter
await setParam(0, 30, 0, 165);
await setParam(1, 1, 0, 2);
await setParam(2, 600, 50, 1000); // overlap ≈ 48°
await setParam(0, 150, 0, 165); // commutation failure
check('6.2 commutation failure shown', /échec de commutation/.test((await page.locator('.panel').first().textContent()) ?? ''));
check('6.2 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);

// 6.3 PWM
await open('6.3');
fb = await predict((f) => 0.5 - 0.3 * Math.sin(2 * Math.PI * f)); // a sine wave
check('6.3 misconception: a leg has two levels', /deux états/.test(fb), fb.slice(0, 70));
await setParam(0, 1, 0, 1.4);
await setParam(0, 1.2, 0, 1.4); // overmodulation
await page.getByRole('radio', { name: 'Sinus + 3ᵉ harmonique' }).click();
await setParam(0, 1.13, 0, 1.4);
await setParam(0, 1.3, 0, 1.4);
await scrubToEnd(); // the reference circles the hexagon
await setParam(1, 28, 3, 45);
check('6.3 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);

// 6.4 Averaged model and LCL filter
await open('6.4');
await page.locator('.chip').nth(0).click(); // hide the switching model
await page.locator('.chip').nth(0).click(); // and show it again
await setParam(2, 0, 0, 30); // L filter only
await setParam(2, 10, 0, 30);
await setParam(4, 10, 1.5, 20, true);
await setParam(3, 0, 0, 10);
await setParam(4, 2, 1.5, 20, true); // switching near the resonance
await setParam(3, 2, 0, 10); // damped
await setParam(4, 10, 1.5, 20, true);
check('6.4 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);

// ── Module 7 ──────────────────────────────────────────────────────────────────
// 7.1 VSC control
await open('7.1');
fb = await predict((f) => (f < 0.1 ? 0.857 : 0.286)); // P jumps instantly
check('7.1 misconception: P rises through the outer loop', /boucle externe/.test(fb), fb.slice(0, 70));
await setParam(1, 40, 1, 100, true); // fast outer loop
await setParam(0, 100, 50, 2000, true); // current loop too slow
await setParam(1, 5, 1, 100, true);
await setParam(0, 500, 50, 2000, true); // separation restored
await setParam(4, 1, 0, 1.1);
await setParam(5, 0.8, -0.8, 0.8); // current limit
await setParam(3, 1.5, 1.2, 20, true);
await setParam(2, 100, 2, 150, true); // weak grid, fast PLL
check('7.1 instability shown', /instable/.test((await page.locator('.panel').first().textContent()) ?? ''));
check('7.1 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);

// 7.2 Grid-following vs grid-forming
await open('7.2');
fb = await predict(() => 0.667); // no reaction
check('7.2 misconception: grid-forming reacts instantly', /instantanément/.test(fb), fb.slice(0, 70));
await scrubToEnd();
await page.getByRole('radio', { name: 'Chute de fréquence' }).click();
await setParam(0, 8, 0.1, 10, true);
await page.getByRole('radio', { name: 'Saut de phase −20°' }).click();
await setParam(1, 1.3, 1.2, 20, true);
await setParam(2, 100, 5, 150, true);
check('7.2 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// 7.3 PV
await open('7.3');
fb = await predict(() => 0.25); // ignores the cloud
check('7.3 misconception: power follows irradiance', /proportionnel/.test(fb), fb.slice(0, 70));
await scrubToEnd();
await setParam(2, 65, -10, 75);
await setParam(3, 3, 0.1, 4, true); // large step
await setParam(2, 25, -10, 75);
await setParam(3, 0.5, 0.1, 4, true);
await setParam(4, 0.6, 0, 0.9); // shading
check('7.3 local maximum flagged', /maximum local/.test((await page.locator('.panel').first().textContent()) ?? ''));
await page.getByRole('radio', { name: 'Oui' }).click();
check('7.3 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);

// 7.4 Wind
await open('7.4');
fb = await predict(() => 0.6); // ignores the gust
check('7.4 misconception: power goes with v³', /cube/.test(fb), fb.slice(0, 70));
await setParam(1, 0, 0, 8); // no gust, λ stays optimal
await setParam(0, 15, 4, 20); // above rated
await setParam(1, 6.5, 0, 8); // strong gust
await setParam(0, 8, 4, 20);
await setParam(2, 6, 0, 10); // synthetic inertia
check('7.4 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// 7.5 Battery
await open('7.5');
fb = await predict((f) => 0.1 + 0.8 * f); // keeps falling
check('7.5 misconception: the frequency has a nadir', /creux/.test(fb), fb.slice(0, 70));
await setParam(1, 600, 0, 1000);
await setParam(3, 2.5, 0.05, 3, true); // slow
await setParam(3, 0.2, 0.05, 3, true);
await setParam(2, 2, 0.5, 50, true); // runs out
await setParam(2, 20, 0.5, 50, true);
await page.getByRole('radio', { name: 'FFR déclenchée' }).click();
await page.getByRole('radio', { name: 'Statisme' }).click();
await setParam(0, 2, 1.5, 8); // low inertia
check('7.5 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);

// 7.6 MMC
await open('7.6');
await setParam(0, 20, 4, 24);
await setCursor(0.5);
await page.getByRole('radio', { name: 'Ordre fixe' }).click();
await page.getByRole('radio', { name: 'Tri des tensions' }).click();
await setParam(1, 0.1, 0.1, 3, true); // small capacitors
await page.getByRole('radio', { name: 'Pont complet' }).click();
check('7.6 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);

// 7.7 Grid codes
await open('7.7');
fb = await predict(() => 0.86); // no reactive current
check('7.7 misconception: plants inject reactive current', /courant réactif/.test(fb), fb.slice(0, 70));
await page.getByRole('radio', { name: /Conforme/ }).click();
await setParam(0, 0.1, 0, 0.9); // deep dip
await setParam(1, 0.6, 0.05, 1.2, true); // below the envelope
await setParam(1, 0.15, 0.05, 1.2, true);
await setParam(0, 0.5, 0, 0.9);
await setParam(3, 0.3, 0.2, 20, true); // slow recovery
check('7.7 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);

// ── Module 8 ──────────────────────────────────────────────────────────────────
const panelText = async () => (await page.locator('.panel').first().textContent()) ?? '';

// 8.1 Transient stability
await open('8.1');
fb = await predict(() => 0.86); // angle stays put
check('8.1 misconception: the rotor accelerates', /accélère/.test(fb), fb.slice(0, 70));
await setParam(0, 400, 20, 400); // far too long
// Bisect the fault duration on the chart verdict, to sit just below the critical time.
{
  let lo = 0, hi = 1000;
  const stableAt = async (pos) => {
    await page.evaluate((pos) => {
      const el = document.querySelectorAll('.params input[type=range]')[0];
      el.value = String(pos);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, pos);
    return (await page.getByText(/^Stable : l’aire/).count()) > 0;
  };
  for (let k = 0; k < 11; k++) {
    const m = Math.round((lo + hi) / 2);
    if (await stableAt(m)) lo = m;
    else hi = m;
  }
  await stableAt(lo);
}
await setParam(2, 8, 2, 8);
await setParam(1, 0.6, 0.3, 1);
await page.getByRole('radio', { name: 'En milieu de ligne' }).click();
check('8.1 classification tree links every leaf', (await page.locator('svg a[href^="#8."]').count()) === 7);
check('8.1 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);

// 8.2 Small-signal stability
await open('8.2');
fb = await predict((f) => 0.5 - 0.4 * Math.exp(-4 * f) * Math.sin(20 * Math.PI * f)); // decaying swing
check('8.2 misconception: the AVR gives negative damping', /négatif/.test(fb), fb.slice(0, 70));
await setParam(0, 10, 10, 400, true); // gentle regulator
await setParam(0, 200, 10, 400, true);
await setParam(1, 10, 0, 40); // PSS
await setParam(2, 0.95, 0.2, 1); // weak link
await setParam(1, 0, 0, 40);
await setParam(3, 0.6, 0.4, 1); // less load
check('8.2 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// 8.3 Long-term voltage stability
await open('8.3');
fb = await predict((f) => (f < 0.03 ? 0.1 : 0.3)); // HV voltage holds after the trip
check('8.3 misconception: the tap changer drags HV down', /enfonce/.test(fb), fb.slice(0, 70));
await scrubToEnd();
await page.getByRole('radio', { name: 'Hors service' }).click();
await page.getByRole('radio', { name: 'Bloqué si V_HT < 0,9' }).click();
await page.getByRole('radio', { name: 'Normal' }).click();
await setParam(1, 0.3, 0, 0.5); // capacitors
await setParam(1, 0, 0, 0.5);
await page.getByRole('radio', { name: 'Bloqué si V_HT < 0,9' }).click();
await setParam(2, 1, 0, 1); // all thermostatic
check('8.3 collapse shown', /effondrement/.test(await panelText()));
check('8.3 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);

// 8.4 Frequency stability
await open('8.4');
fb = await predict((f) => {
  const v = f < 0.025 ? 50 : f < 0.2 ? 50 - (0.8 * (f - 0.025)) / 0.175 : Math.min(50, 49.2 + (0.8 * (f - 0.2)) / 0.5);
  return (50.2 - v) / 1.7;
}); // dips then returns to 50 Hz
check('8.4 misconception: primary control leaves an offset', /secondaire/.test(fb), fb.slice(0, 70));
await setParam(0, 0.65, 0, 0.9); // load shedding
await setParam(0, 0.85, 0, 0.9); // RoCoF relays
await setParam(2, 800, 0, 1500);
await setParam(0, 0.8, 0, 0.9); // fast reserve at 80 %
await setParam(2, 0, 0, 1500);
await setParam(1, 0.3, 0, 1); // grid-forming
check('8.4 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// 8.5 Converter-driven stability
await open('8.5');
fb = await predict((f) => (f < 0.1 ? 0.8 : 0.4)); // clean step to 1 pu
check('8.5 misconception: the PLL sees its own action', /diverge/.test(fb), fb.slice(0, 70));
check('8.5 instability shown', /instable/.test(await panelText()));
await setParam(1, 20, 5, 150, true); // slower PLL
await setParam(1, 60, 5, 150, true);
await setParam(0, 3, 1.2, 10, true); // stronger grid
await setParam(0, 2, 1.2, 10, true);
await setParam(2, 0.5, 0.2, 1); // curtail
await setParam(2, 1, 0.2, 1);
await setParam(1, 20, 5, 150, true);
await setParam(0, 1.35, 1.2, 10, true); // minimum SCR
check('8.5 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// 8.6 Subsynchronous resonance
await open('8.6');
fb = await predict((f) => 0.5 - 0.3 * Math.exp(-3 * f) * Math.sin(16 * Math.PI * f)); // decays
check('8.6 misconception: resonance grows (Mohave)', /Mohave/.test(fb), fb.slice(0, 70));
await setParam(0, 0.4, 0.1, 0.8); // detune
await setParam(1, 20, 10, 30);
await setParam(0, 0.36, 0.1, 0.8); // 20 Hz resonance
await setParam(2, 0.5, 0.05, 2.5, true); // more shaft damping
await page.getByRole('radio', { name: 'TCSC' }).click();
await setParam(0, 0.5, 0.1, 0.8);
check('8.6 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// 8.7 Inter-area oscillations
await open('8.7');
fb = await predict(() => 0.5); // G3 does not move
check('8.7 misconception: the inter-area mode reaches G3', /inter-zones/.test(fb), fb.slice(0, 70));
await page.getByRole('radio', { name: 'local 1' }).click();
await setParam(0, 1.8, 0.4, 2); // weak tie
await setParam(0, 1, 0.4, 2);
await setParam(1, 0.85, 0, 0.9); // heavy transfer
await page.getByRole('radio', { name: 'G3', exact: true }).click();
await page.getByRole('radio', { name: 'local 2' }).click();
await setParam(3, 10, 0, 10); // damping
check('8.7 all steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);
await page.screenshot({ path: `${out}/smoke-8.7.png` });

// Hints are offered before a step is done
await open('8.8');
await page.locator('.dot').nth(1).click();
await page.locator('.lesson button.link').click();
check('8.8 hint opens on a step not yet done', (await page.locator('.lesson .hintbox').count()) === 1);

// 8.8 Modes and participation on real networks (baked G2ELin results)
await open('8.8');
const row = (j) => page.locator('table tbody tr').nth(j).click();
await row(0); // Kundur inter-area mode
check('8.8 mode shape: areas in opposition', (await page.locator('line.arr.a').count()) === 2 && (await page.locator('line.arr.b').count()) === 2);
check('8.8 participation bars drawn', (await page.locator('.bars .row').count()) === 10);
await row(1); // local mode
await row(3); // electrical mode
await setParam(1, 3, 1, 10); // kick G3
await scrubToEnd();
await page.getByRole('radio', { name: 'Kundur classique' }).click();
await row(0);
check('8.8 classical inter-area mode is unstable', (await page.locator('table tbody tr.sel td.neg').count()) === 1);
await page.getByRole('radio', { name: 'WSCC 9', exact: true }).click();
await page.getByRole('radio', { name: 'WSCC 9 + formeur' }).click();
await page.getByRole('radio', { name: 'IEEE 39' }).click();
check('8.8 IEEE 39 lists 20 modes', (await page.locator('table tbody tr').count()) === 20);
await row(10); // 1.20 Hz, negative damping
check('8.8 all steps completed', (await doneSteps()) === 7, `${await doneSteps()}/7`);
await page.screenshot({ path: `${out}/smoke-8.8.png` });

// 8.9 Model reduction, EMT against RMS
await open('8.9');
await scrubToEnd();
await page.getByRole('radio', { name: 'RMS', exact: true }).click();
await page.getByRole('radio', { name: 'ordre 4' }).click();
await page.getByRole('radio', { name: 'ordre 3' }).click();
await page.getByRole('radio', { name: 'classique' }).click();
check('8.9 ladder highlights the classical model', /classique/.test((await page.locator('table tbody tr.sel').textContent()) ?? ''));
await page.locator('.chip').nth(2).click(); // linearised response
check('8.9 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);
await page.screenshot({ path: `${out}/smoke-8.9.png` });

// Zoomable panels: a chart opens in a large window and zooms with the wheel
await page.locator('.zoomable button.grow').last().click();
await page.waitForSelector('.zoom-modal svg');
const box = await page.locator('.zoom-modal svg').first().boundingBox();
check('zoom window is large', box.width > 900, `${Math.round(box.width)} px`);
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.wheel(0, -400);
await page.waitForTimeout(100);
check('chart zoomed by the wheel', (await page.locator('.zoom-modal button', { hasText: '⟲' }).count()) === 1);
await page.screenshot({ path: `${out}/smoke-zoom.png` });
await page.keyboard.press('Escape');
check('zoom window closes with Escape', (await page.locator('.zoom-modal').count()) === 0);

// ── Module 9 ──────────────────────────────────────────────────────────────────
const radio = (name) => page.getByRole('radio', { name, exact: true }).click();

// 9.1 Voltage levels
await open('9.1');
await radio('400 kV');
await setParam(2, 2, 1, 4); // two circuits
await radio('225 kV');
await radio('20 kV');
await setParam(2, 1, 1, 4); // one feeder
await setParam(0, 5, 0.05, 3000, true);
await setParam(1, 20, 0.1, 400, true);
await radio('400 V');
await setParam(0, 0.1, 0.05, 3000, true);
await setParam(1, 0.54, 0.1, 400, true);
check('9.1 all steps completed', (await doneSteps()) === 4, `${await doneSteps()}/4`);

// 9.2 Balancing
await open('9.2');
await predict((f) => (f < 0.02 ? 0.2 : 0.5 - 0.3 * Math.min(1, f * 3)));
await scored('9.2');
await radio('Hors service');
await radio('Chez un voisin');
await radio('En service');
await radio('En France');
await setParam(0, 3000, 200, 3000); // the reference incident
await setParam(0, 1000, 200, 3000);
await setParam(2, 120, 60, 900); // mFRR called early
check('9.2 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// 9.3 N-1 security
await open('9.3');
await setCursor(19 / 24);
check('9.3 N-1 constraint flagged', /contrainte N-1/.test(await panelText()));
await setParam(0, 300, 0, 600); // redispatch
await setParam(0, 0, 0, 600);
await setParam(1, -12, -15, 15); // phase shifter
await setParam(1, 0, -15, 15);
await radio('Ouvrir L5');
await radio('Fermer L8');
await setParam(2, 10, 0, 15); // cold spell: combine
await setParam(1, -12, -15, 15);
await setParam(0, 300, 0, 600);
check('9.3 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// 9.4 Voltage plan
await open('9.4');
await setCursor(19 / 24);
await radio('En service');
check('9.4 generators at their limit', /butée/.test(await panelText()));
await setParam(1, 300, 0, 600);
await setParam(1, 600, 0, 600);
await setParam(1, 300, 0, 600);
await setParam(0, 410, 395, 415);
check('9.4 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// 9.5 Defence plan
await open('9.5');
await predict((f) => (f < 0.05 ? 0.1 : 0.3));
await scored('9.5');
await setParam(3, 0, 0, 15);
check('9.5 blackout without shedding', /panne généralisée/.test(await panelText()));
await setParam(0, 10, 2, 40);
await setParam(3, 15, 0, 15);
await setParam(0, 30, 2, 40);
await setParam(3, 7.5, 0, 15);
await setParam(0, 25, 2, 40);
await setParam(1, 1.5, 1, 6);
await setParam(3, 5, 0, 15);
check('9.5 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// 9.6 Connection study
await open('9.6');
await setParam(0, 198, 10, 1500, true);
await radio('Poste B 225 kV');
await setParam(0, 400, 10, 1500, true);
await radio('Poste A 400 kV');
await radio('Centrale synchrone');
await setParam(0, 1000, 10, 1500, true);
check('9.6 synchronous plant refused', /refusé/.test(await panelText()));
await radio('Éolien / PV (onduleurs)');
check('9.6 all steps completed', (await doneSteps()) === 4, `${await doneSteps()}/4`);

// ── Module 10 ─────────────────────────────────────────────────────────────────
// 10.1 MV loop
await open('10.1');
await setParam(0, 9, 0, 19); // balanced open point
await radio('Aérien 148 mm² Almélec');
await radio('Souterrain 240 mm² Al');
await setParam(2, 2, -1, 19); // fault on section 2
check('10.1 substations cut off', /postes coupés/.test(await panelText()));
await radio('Fermer le point d’ouverture');
await setParam(1, 130, 40, 160);
check('10.1 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// 10.2 Voltage plan
await open('10.2');
await setParam(2, 2.5, -2.5, 5);
await setParam(3, 10, 0, 12);
await radio('tan φ = −0,35');
await setParam(1, 3, 0, 4);
await radio('Q(U)');
check('10.2 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// 10.3 Neutral earthing
await open('10.3');
await setParam(0, 200, 10, 300);
await radio('Impédant (résistance)');
check('10.3 healthy feeder trips wrongly', /intempestif/.test(await panelText()));
await setParam(4, 150, 5, 400, true);
await setParam(3, 600, 0.5, 5000, true);
await setParam(3, 1, 0.5, 5000, true);
await radio('Compensé (bobine de Petersen)');
await radio('Wattmétrique');
check('10.3 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// 10.4 Protection plan
await open('10.4');
await setParam(0, 400, 200, 3000, true);
await setParam(2, 20, 0.5, 20);
await setParam(1, 0.4, 0.1, 1);
await radio('Rapide + lent');
await radio('Permanent (câble endommagé)');
check('10.4 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// 10.5 Planning
await open('10.5');
await setCursor(9.5 / 20);
await setParam(1, 5, 0, 10);
await setParam(1, 0, 0, 10);
await setParam(2, 3, 0, 10);
await setParam(3, 20, 5, 100);
await setParam(0, 4, 0, 5);
check('10.5 all steps completed', (await doneSteps()) === 5, `${await doneSteps()}/5`);

// The lesson list opens on the current lesson, not at the top.
await page.locator('button.crumbs').click();
await page.waitForTimeout(300);
const cur = await page.locator('.drawer .lesson.cur').boundingBox();
check('lesson list opens on the current lesson', cur !== null && cur.y > 0 && cur.y < (page.viewportSize()?.height ?? 1000), `y ${cur?.y}`);
await page.keyboard.press('Escape');
await page.locator('.scrim').click({ force: true }).catch(() => {});

// The home page: default route, progress recorded by the lessons above, resume link, phone width.
await page.goto(URL);
await page.reload();
await page.waitForSelector('.home');
check('home page opens by default', (await page.locator('.home h1').textContent()) === 'Omega Lab');
check('home page shows recorded progress', /Ma progression : [1-9]/.test((await page.locator('.home').textContent()) ?? ''));
check('home page offers to resume', (await page.locator('.home a.btn.primary', { hasText: 'Reprendre' }).count()) === 1);
check('home page lists every module', (await page.locator('.home .mod').count()) === 11);
await page.screenshot({ path: `${out}/smoke-home.png`, fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(200);
check('home page: no horizontal scroll at 390 px', (await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0);
await page.setViewportSize({ width: 1600, height: 1000 });
await page.locator('.home .profile', { hasText: 'Ingénieur' }).click();
await page.waitForSelector('.u-over');
check('engineer profile starts at 4.1', page.url().endsWith('#4.1'));

// Enlarged charts draw their curves (each copy has its own clip region).
await open('4.9');
await page.locator('.zoomable button.grow').nth(2).click();
await page.waitForSelector('.zoom-modal svg');
const clipIds = await page.evaluate(() => [...document.querySelectorAll('clipPath')].map((c) => c.id));
check('enlarged chart has its own clip region', new Set(clipIds).size === clipIds.length, clipIds.join(','));
await page.keyboard.press('Escape');

// ── Documentation page and teaching notes ─────────────────────────────────────
await page.goto(`${URL}#1.2`);
await page.reload();
await page.waitForSelector('.u-over');
await page.getByRole('button', { name: /Documentation/ }).click();
await page.waitForSelector('article h2');
check('docs page opens from the top bar', (await page.evaluate(() => location.hash)) === '#docs');
check('docs render formulas and tables', (await page.locator('article .katex').count()) > 50 && (await page.locator('article table').count()) > 20);
await page.locator('nav a', { hasText: '3.4 PI control and the PLL' }).click();
await page.waitForTimeout(800);
const top = await page.locator('[id="34-pi-control-and-the-pll--34--lessonspll"]').evaluate((el) => el.getBoundingClientRect().top);
check('contents link scrolls to its section, URL unchanged', top < 200 && (await page.evaluate(() => location.hash)) === '#docs', `top ${Math.round(top)}`);
await page.screenshot({ path: `${out}/smoke-docs.png` });
await page.getByRole('button', { name: /Retour aux leçons/ }).click();
await page.waitForSelector('.u-over');
check('back button returns to the lesson', (await page.evaluate(() => location.hash)) === '#1.2');
await page.getByRole('button', { name: /Note pédagogique/ }).click();
await page.waitForSelector('[role="dialog"]');
check('lesson note opens on its lesson', (await page.locator('[role="dialog"] .formulas li').count()) >= 3);
await page.screenshot({ path: `${out}/smoke-note-lesson.png` });
await page.getByRole('button', { name: 'Close' }).click();
await page.locator('.crumbs').click();
await page.getByRole('button', { name: 'Note pédagogique — module 3' }).click();
await page.waitForSelector('[role="dialog"]');
check('module note opens from the course map', (await page.locator('[role="dialog"] .lesson').count()) === 4);
await page.locator('[role="dialog"] .lh', { hasText: '3.3' }).click();
check('a lesson note lists one objective per exercise', (await page.locator('[role="dialog"] .exercises li').count()) === 6);
await page.screenshot({ path: `${out}/smoke-note-module.png` });
await page.getByRole('button', { name: 'Close' }).click();

// ── Atelier (free-style mode) ─────────────────────────────────────────────────
await page.locator('.seg.mode button', { hasText: 'Atelier' }).click();
await page.waitForSelector('.atelier');
check('Atelier opens from the mode switch', (await page.evaluate(() => location.hash)) === '#atelier');
await page.getByRole('button', { name: /RLC série sous échelon/ }).click();
await page.waitForSelector('g.el[aria-label="L1"]');
check('Atelier template draws its elements and wires', (await page.locator('g.el').count()) === 5 && (await page.locator('g.wire').count()) === 5);
check('Atelier oscilloscope plots the bench', (await page.locator('.atelier .u-over').count()) === 1);
await page.locator('g.el[aria-label="L1"] .hitbox').click();
check('selecting an element shows its formulas', (await page.getByText('L1 — Loi de la bobine').count()) === 1);
await page.locator('.insp input.num').fill('40 mH');
await page.locator('.insp input.num').press('Enter');
check('typed values with units', (await page.locator('g.el[aria-label="L1"] .val').textContent()) === '40 mH');
await page.locator('.toolbar button[title="Ctrl+Z"]').click();
check('undo', (await page.locator('g.el[aria-label="L1"] .val').textContent()) === '10 mH');
await page.locator('.lib button.item', { hasText: 'Résistance' }).click();
check('a library item lands on the bench', (await page.locator('g.el').count()) === 6);
await page.locator('circle.port[aria-label="R2.a"]').click();
await page.locator('circle.port[aria-label="C1.a"]').click();
check('two terminal clicks draw a wire', (await page.locator('g.wire').count()) === 6);
await page.screenshot({ path: `${out}/smoke-atelier.png` });
// Selection tool: box, select all, delete selection, clear all (undoable)
{
  const box = await page.locator('.canvas svg').boundingBox();
  await page.mouse.move(box.x + 8, box.y + 8);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 8, box.y + box.height - 8, { steps: 6 });
  await page.mouse.up();
  check('box selection takes every element', (await page.locator('g.el.sel').count()) === 6);
  await page.screenshot({ path: `${out}/smoke-atelier-box.png` });
  await page.locator('.canvas').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Control+a');
  check('Ctrl+A selects everything', (await page.locator('g.el.sel').count()) === 6 && (await page.locator('g.wire.sel').count()) === 6);
  await page.getByRole('button', { name: /Effacer la sélection/ }).first().click();
  check('delete the selection', (await page.locator('g.el').count()) === 0);
  await page.locator('.toolbar button[title="Ctrl+Z"]').click();
  await page.getByRole('button', { name: /Tout effacer/ }).first().click();
  check('clear all', (await page.locator('g.el').count()) === 0 && (await page.locator('g.wire').count()) === 0);
  await page.locator('.toolbar button[title="Ctrl+Z"]').click();
  check('clear all can be undone', (await page.locator('g.el').count()) === 6);
}
// A2: frequency analyses, poles, harmonics, measurements
await page.locator('.canvas').click({ position: { x: 5, y: 5 } });
await page.getByRole('button', { name: /Circuit bouchon/ }).click();
await page.waitForSelector('g.el[aria-label="Z1"]');
await page.getByRole('tab', { name: 'Impédance' }).click();
check('impedance scan marks the parallel resonance', /∥ 50/.test((await page.locator('.dock-panel').textContent()) ?? ''));
await page.getByRole('tab', { name: 'Pôles' }).click();
check('poles of the tank circuit: one complex pair', (await page.locator('.poles tbody tr').count()) === 1);
await page.locator('.poles tbody tr').first().click();
check('clicking a pole lights up L1 and C1', (await page.locator('rect.glow').count()) === 2);
await page.getByRole('tab', { name: 'Phaseurs' }).click();
check('phasor diagram in steady state', (await page.locator('.dock-panel svg line, .dock-panel svg path').count()) > 3);
await page.locator('.canvas').click({ position: { x: 5, y: 5 } });
await page.getByRole('button', { name: /Filtrer une onde carrée/ }).click();
await page.waitForSelector('g.el[aria-label="VM1"]');
await page.getByRole('tab', { name: 'Harmoniques' }).click();
{ const th = (await page.locator('.thd header').textContent()) ?? ''; check('harmonic analyser: square source THD ≈ 48 %', /THD = 4[78],\d %/.test(th), th); }
await page.getByRole('tab', { name: 'Bode' }).click();
check('Bode gain and phase charts', (await page.locator('.bode .panel').count()) === 2);
await page.locator('g.el[aria-label="R1"] .hitbox').click();
check('measurements in the inspector', /cos φ/.test((await page.locator('.insp').textContent()) ?? ''));
await page.screenshot({ path: `${out}/smoke-atelier-a2.png` });
await page.getByRole('button', { name: 'Leçons' }).click();
await page.waitForSelector('.lesson');

// A6: lesson → Atelier, and a challenge from start to finish
await open('1.2');
await page.locator('.note-btn.atelier').click();
await page.waitForSelector('g.el[aria-label="R1"]');
check('a lesson opens its bench in the Atelier, with its settings', (await page.locator('g.el[aria-label="R1"] .val').textContent()) === '2 Ω');
await page.locator('.canvas').click({ position: { x: 5, y: 5 } });
await page.locator('.insp button.link', { hasText: 'Amortir sans dépasser' }).click();
await page.waitForSelector('.challenge');
check('a challenge starts unmet', (await page.locator('.challenge.ok').count()) === 0);
await page.locator('g.el[aria-label="L1"] .hitbox').click();
check('locked parameters are read-only', (await page.locator('.insp .param.ro').count()) === 1);
await page.locator('g.el[aria-label="R1"] .hitbox').click();
await page.locator('.insp input.num').fill('20');
await page.locator('.insp input.num').press('Enter');
await page.waitForSelector('.challenge.ok', { timeout: 10000 }).catch(() => {});
check('the challenge is met at critical damping, and explained', (await page.locator('.challenge.ok .answer').count()) === 1);
await page.screenshot({ path: `${out}/smoke-challenge.png` });
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(300);
check('Atelier: no horizontal scroll at 390 px', (await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0);
await page.screenshot({ path: `${out}/smoke-atelier-phone.png`, fullPage: true });
await page.setViewportSize({ width: 1600, height: 1000 });
await page.getByRole('button', { name: 'Leçons' }).click();
await page.waitForSelector('.lesson');

// Module 10 benches: lesson 10.4 opens the feeder-protection bench; the Petersen challenge is played.
await open('10.4');
await page.locator('.note-btn.atelier').click();
await page.waitForSelector('g.el[aria-label="P1"]');
check('10.4 opens the feeder-protection bench', (await page.locator('g.el[aria-label="P0"]').count()) === 1);
await page.locator('.canvas').click({ position: { x: 5, y: 5 } });
await page.locator('.insp button.link', { hasText: 'Accorder la bobine de Petersen' }).click();
await page.waitForSelector('.challenge');
check('Petersen challenge starts unmet', (await page.locator('.challenge.ok').count()) === 0);
await page.locator('g.el[aria-label="LN"] .hitbox').click();
await page.locator('.insp input.num').fill('225 mH');
await page.locator('.insp input.num').press('Enter');
await page.waitForSelector('.challenge.ok', { timeout: 20000 }).catch(() => {});
check('Petersen challenge met with a tuned coil', (await page.locator('.challenge.ok').count()) === 1);
await page.locator('.challenge button', { hasText: 'Quitter le défi' }).click();
await page.getByRole('button', { name: 'Leçons' }).click();
await page.waitForSelector('.lesson');

// ── Language, theme, phone ────────────────────────────────────────────────────
await page.getByRole('button', { name: 'EN', exact: true }).click();
await page.locator('.icon').click(); // auto → light
await page.locator('.icon').click(); // light → dark
check('English labels', (await page.getByText('Live equations').count()) === 1);
await page.screenshot({ path: `${out}/smoke-dark-en.png` });
for (const id of ['0.1', '0.2', '1.1', '1.2', '1.3', '1.4', '1.5', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8', '3.1', '3.2', '3.3', '3.4', '4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8', '4.9', '4.10', '5.1', '5.2', '5.3', '5.4', '5.5', '6.1', '6.2', '6.3', '6.4', '7.1', '7.2', '7.3', '7.4', '7.5', '7.6', '7.7', '8.1', '8.2', '8.3', '8.4', '8.5', '8.6', '8.7', '8.8', '8.9', '9.1', '9.2', '9.3', '9.4', '9.5', '9.6', '10.1', '10.2', '10.3', '10.4', '10.5']) {
  if (['2.1', '4.1', '6.1', '8.1', '9.4'].includes(id)) {
    await page.close();
    page = watch(await context.newPage());
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await open(id);
  await page.waitForTimeout(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  check(`${id} no horizontal scroll at 390 px`, overflow <= 0, `overflow ${overflow}px`);
}
await page.screenshot({ path: `${out}/smoke-phone.png`, fullPage: true });

check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
