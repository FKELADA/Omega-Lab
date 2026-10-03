// End-to-end smoke test: walks every lesson in a real browser — predictions,
// misconception feedback, step checks — then language, theme and phone layout.
// Usage: npm run dev (in another terminal), then `node tests/smoke.mjs [outDir]`.
// Uses the locally installed Chrome; set CHROME_PATH to override.

import { chromium } from 'playwright-core';

const URL = process.env.OMEGA_URL ?? 'http://localhost:5173/';
const out = process.argv[2] ?? '.';
const executablePath = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, locale: 'fr-FR' });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

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

async function open(id) {
  await page.goto(`${URL}#${id}`);
  await page.reload();
  await page.waitForSelector('.u-over');
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

// ── Language, theme, phone ────────────────────────────────────────────────────
await page.getByRole('button', { name: 'EN', exact: true }).click();
await page.locator('.icon').click(); // auto → light
await page.locator('.icon').click(); // light → dark
check('English labels', (await page.getByText('Live equations').count()) === 1);
await page.screenshot({ path: `${out}/smoke-dark-en.png` });
for (const id of ['1.2', '1.3', '1.4', '2.1']) {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(id);
  await page.waitForTimeout(200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  check(`${id} no horizontal scroll at 390 px`, overflow <= 0, `overflow ${overflow}px`);
}
await page.screenshot({ path: `${out}/smoke-phone.png`, fullPage: true });

check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
