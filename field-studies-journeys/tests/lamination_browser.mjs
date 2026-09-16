/**
 * Acceptance: depth lamination — the sequence's spatial dual. A multi-state
 * formation switched to "Laminate in depth" renders its states simultaneously
 * as depth layers of one laminated body; the lamination span scales the stack.
 * Drives the real studio controls (image suite, transition control, span) and
 * reads settled GPU particle state back. Software WebGL needs generous
 * convergence waits.
 *
 * Run with the dev server up:  node tests/lamination_browser.mjs
 */

import { chromium } from 'playwright';
const URL = process.env.OI_TEST_URL || 'http://localhost:3001/';
const results = [];
const check = (name, ok, detail = '') => { results.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ` — ${detail}` : '')); };
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE || undefined, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e));
await page.goto(URL, { waitUntil: 'load' });
await page.waitForFunction('() => !!window.__FIELD_STUDIES__', null, { timeout: 45000 });
await page.waitForTimeout(4000);

const zProfile = () => page.evaluate(`(() => {
  const p = window.__FIELD_STUDIES__.inspect(true).positions;
  let maxAbs = 0, nan = 0, nonzero = 0;
  for (let i = 0; i < p.length; i += 4) {
    const z = p[i + 2];
    if (!Number.isFinite(z)) { nan++; continue; }
    const a = Math.abs(z);
    if (a > 5) nonzero++;
    if (a > maxAbs) maxAbs = a;
  }
  return { maxAbs, nonzero, nan };
})()`);
const waitStable = async (timeout = 150000) => {
  // Poll until maxAbsZ stops growing meaningfully (settled body).
  let prev = -1;
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const { maxAbs } = await zProfile();
    if (prev > 0 && Math.abs(maxAbs - prev) < Math.max(1, prev * 0.02)) return maxAbs;
    prev = maxAbs;
    await page.waitForTimeout(4000);
  }
  return prev;
};

await page.evaluate(`(() => { window.__FIELD_STUDIES__.openEditor('objects'); const b = document.querySelector('[data-action="image-suite"]'); if (b) b.click(); })()`);
await page.waitForTimeout(700);
const setAscii = async (art) => {
  await page.evaluate(`(() => { const k = document.querySelector('select[data-action="source-kind"]'); if (k) { k.value = 'ascii'; k.dispatchEvent(new Event('change', {bubbles: true})); } })()`);
  await page.waitForTimeout(600);
  await page.evaluate(`((art) => { const ta = document.querySelector('textarea[data-bind="step.source.ascii.text"]'); if (!ta) return; ta.value = art; ta.dispatchEvent(new Event('change', {bubbles: true})); })()`, [art]);
  await page.waitForTimeout(900);
};
await setAscii(['########', '#      #', '#  ##  #', '#      #', '########'].join('\n'));
for (const art of [['  ####  ', ' ##  ## ', '##    ##', ' ##  ## ', '  ####  '].join('\n'), ['   ##   ', '  ####  ', '########', '  ####  ', '   ##   '].join('\n')]) {
  await page.evaluate(`(() => { const b = document.querySelector('[data-action="source-add"]'); if (b && !b.disabled) b.click(); })()`);
  await page.waitForTimeout(900);
  await setAscii(art);
}

const laminated = await page.evaluate(`(() => {
  const el = document.querySelector('select[data-action="sequence-mode"]');
  if (!el) return false;
  el.value = 'laminate'; el.dispatchEvent(new Event('change', {bubbles: true}));
  return el.value === 'laminate';
})()`);
check('the sequence mode offers Laminate', laminated);
const before = await waitStable();
const prof = await zProfile();
check('the three states laminate into depth layers', before > 30 && prof.nonzero > 12000,
  `settled max|z| ${before.toFixed(1)}, ${prof.nonzero} particles off the plane`);
check('no NaN particles', prof.nan === 0, `${prof.nan} NaN`);

await page.evaluate(`(() => {
  const el = document.querySelector('input[data-bind="entity.sequence.laminate.span"]');
  if (!el) return false;
  el.value = '1.2';
  el.dispatchEvent(new Event('input', {bubbles: true}));
  el.dispatchEvent(new Event('change', {bubbles: true}));
  return true;
})()`);
const after = await waitStable();
check('widening the span scales the stack', after > before * 1.8, `max|z| ${before.toFixed(1)} → ${after.toFixed(1)} (target ×2.4)`);

const frames = await page.evaluate(`(() => new Promise(res => {
  let n = 0; const t0 = performance.now();
  const step = () => { n++; performance.now() - t0 < 1500 ? requestAnimationFrame(step) : res(n); };
  requestAnimationFrame(step);
}))()`);
check('the renderer kept drawing the laminated body', frames > 3, `${frames} frames in 1.5s`);
check('no page errors', !errors.length, errors.slice(0, 2).join(' | '));

await browser.close();
const failed = results.filter(r2 => !r2).length;
console.log(`\n${results.length} checks — ${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
