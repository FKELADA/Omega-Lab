// End-to-end smoke test: drives the RLC lesson in a real browser.
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
const setSlider = (k, pos) =>
  page.evaluate(
    ([k, pos]) => {
      const el = document.querySelectorAll('.params input[type=range]')[k];
      el.value = String(pos);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    },
    [k, pos],
  );

await page.goto(URL);
await page.waitForSelector('.u-over');

// 1. Predict then reveal: sketch a curve that rises and decays without reversing.
await page.locator('.lesson .btn.primary').click();
check('equations concealed while predicting', (await page.locator('.eqs .concealed').count()) === 1);
const box = await page.locator('.u-over').boundingBox();
await page.mouse.move(box.x + 2, box.y + box.height / 2);
await page.mouse.down();
for (let k = 0; k <= 60; k++) {
  const f = k / 60;
  const y = 0.5 - 0.35 * Math.sin(Math.PI * Math.min(1, f * 3)) * Math.exp(-2 * f);
  await page.mouse.move(box.x + 2 + f * (box.width - 4), box.y + y * box.height);
}
await page.mouse.up();
await page.getByRole('button', { name: 'Révéler' }).first().click();
const score = await page.locator('.score b').textContent();
const feedback = (await page.locator('.feedback').textContent().catch(() => '')) ?? '';
check('prediction scored', /\d+ %/.test(score ?? ''), score ?? '');
check('misconception detected (current reverses)', /change de signe/.test(feedback), feedback.slice(0, 80));
await page.screenshot({ path: `${out}/smoke-1-predict.png` });

// 2. Scrub to the end of the window.
await setSlider(0, 0); // R slider is the first .params input; time cursor is outside .params
await page.evaluate(() => {
  const t = document.getElementById('tcursor');
  t.value = '1000';
  t.dispatchEvent(new Event('input', { bubbles: true }));
});
// 3. Critical damping: R = 2√(L/C) = 20 Ω with the defaults.
await setSlider(0, Math.round((1000 * Math.log(20 / 0.1)) / Math.log(200 / 0.1)));
check('critical damping reached', /critique/.test((await page.locator('.regime').textContent()) ?? ''));
// 4. Low damping.
await setSlider(0, 0);
// 5. Freeze, then L × 4 (10 mH → 40 mH).
await page.getByRole('button', { name: '❄ Figer et comparer' }).click();
await setSlider(1, Math.round(1000 * (Math.log(40e-3 / 1e-3) / Math.log(1000))));
// 6. Sweep R.
await page.locator('.param').first().getByRole('button', { name: /Balayer/ }).click();
check('all six steps completed', (await doneSteps()) === 6, `${await doneSteps()}/6`);

// Researcher profile shows the state-space card.
await page.getByRole('button', { name: 'Chercheur' }).click();
check('researcher sees state-space form', (await page.getByText('Représentation d’état').count()) === 1);
await page.screenshot({ path: `${out}/smoke-2-research.png` });

// English + dark theme.
await page.getByRole('button', { name: 'EN', exact: true }).click();
await page.locator('.icon').click(); // auto → light
await page.locator('.icon').click(); // light → dark
check('English labels', (await page.getByText('Live equations').count()) === 1);
await page.screenshot({ path: `${out}/smoke-3-dark-en.png` });

// Phone width: no horizontal scroll.
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(300);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
check('no horizontal scroll at 390 px', overflow <= 0, `overflow ${overflow}px`);
await page.screenshot({ path: `${out}/smoke-4-phone.png`, fullPage: true });

check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
