// Screenshots every lesson (and reports page errors), for visual review.
// Usage: npm run dev, then `node tests/shots.mjs [outDir] [lesson ids…]`.

import { chromium } from 'playwright-core';

const URL = process.env.OMEGA_URL ?? 'http://localhost:5173/';
const [out = '.', ...only] = process.argv.slice(2);
const ids = only.length ? only : ['1.2', '1.3', '1.4', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8', '3.1', '3.2', '3.3', '3.4'];
const executablePath = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, locale: 'fr-FR' });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

for (const id of ids) {
  await page.goto(`${URL}#${id}`);
  await page.reload();
  await page.waitForSelector('.u-over', { timeout: 8000 }).catch(() => console.log('no plot for', id, errors));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/lesson-${id}.png` });
  console.log(`shot ${id}`);
}
console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'no page errors');
await browser.close();
