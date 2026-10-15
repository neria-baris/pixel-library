// Local headless-Chrome check for design/pixel-library/library.html. No installs, no network.
// node --experimental-websocket scripts/design/verify_library_roaming.mjs [outDir] [step...]
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const out = resolve(process.argv[2] || 'outputs/ux/library-roaming');
const only = process.argv.slice(3);
mkdirSync(out, { recursive: true });
const chrome = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9341 + Math.floor(Math.random() * 200);
const profile = mkdtempSync(join(tmpdir(), 'lib-roam-'));
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0;
const pending = new Map(), errors = [];
async function connect() {
  for (let i = 0; i < 60; i++) {
    try { const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const page = list.find(p => p.type === 'page'); if (page) return page.webSocketDebuggerUrl; } catch {}
    await sleep(250);
  }
  throw new Error('Chrome did not start');
}
function send(method, params = {}) {
  return new Promise((res, rej) => { const n = ++id; pending.set(n, { res, rej }); ws.send(JSON.stringify({ id: n, method, params })); });
}
async function js(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 600));
  return r.result.value;
}
async function shot(name, full = false) {
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full });
  writeFileSync(join(out, name + '.png'), Buffer.from(r.data, 'base64'));
}
async function viewport(width, height, mobile = false) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
}
async function load(hash = '') {
  const url = pathToFileURL(resolve('design/pixel-library/library.html')).href + '?run=' + Date.now() + hash;
  await send('Page.navigate', { url });
  await sleep(1500);
}
const results = [];
function check(name, ok, detail = '') { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); }
// Is the cat clear of every interactive rect and inside the viewport below the header?
const catClear = `(() => { const d = libraryCat.debug(); const cat = document.querySelector('.roam-cat'); if (cat.hidden || cat.classList.contains('away')) return {visible:false, ...d};
  const r = document.querySelector('.roam-body').getBoundingClientRect();
  const hits = [...document.querySelectorAll('button,a[href],input,select,textarea,summary,label,[tabindex]:not([tabindex="-1"]),h1,[data-cat-avoid]')].filter(e => !cat.contains(e) && e.getClientRects().length)
    .map(e => [e, e.getBoundingClientRect()]).filter(([, b]) => b.left < r.right - 6 && b.right > r.left + 6 && b.top < r.bottom - 4 && b.bottom > r.top + 4).map(([e]) => e.tagName + (e.className ? '.' + String(e.className).split(' ')[0] : ''));
  return {visible:true, hits, ...d}; })()`;

try {
  ws = new WebSocket(await connect());
  await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); return; }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value || a.description).join(' '));
  });
  await send('Page.enable'); await send('Runtime.enable');
  const want = s => !only.length || only.includes(s);

  if (want('sprites')) {
    await viewport(1200, 1000); await load();
    await js(`(() => { const sheet = document.createElement('div'); sheet.id='sheet'; sheet.style.cssText='position:fixed;inset:0;z-index:999;background:#f3ead3;display:flex;flex-wrap:wrap;gap:14px;padding:14px;align-content:flex-start';
      const src = document.querySelector('.cat-svg');
      ['sit', 'look', 'happy', 'yawn', 'groom', 'walk', 'jump', 'held', 'loaf'].forEach(pose => { const box = document.createElement('figure'); box.style.cssText = 'margin:0;font:12px monospace;text-align:center;background:#efe5d1;padding:8px;border-radius:8px';
        const svg = src.cloneNode(true); svg.dataset.pose = pose; svg.style.cssText = 'width:240px;height:180px;display:block'; box.append(svg); const cap = document.createElement('figcaption'); cap.textContent = pose; box.append(cap); sheet.append(box); });
      document.body.append(sheet); })()`);
    await sleep(200); await shot('sprites');
  }
  if (want('library')) {
    await viewport(1440, 900); await load();
    await sleep(3500);
    let positions = [], clear = true, hitsSeen = [];
    for (let i = 0; i < 34; i++) { // Behaviour is random; watch up to ~30s for real movement.
      if (i >= 16 && new Set(positions.map(p => p.slice(0, 2).join(','))).size >= 3) break;
      const c = await js(catClear);
      positions.push([Math.round(c.x), Math.round(c.y), c.pose, c.anchor]);
      if (c.visible && !c.free && c.anchor) { clear = false; }
      if (c.visible && c.hits.length && c.anchor && c.pose !== 'held') hitsSeen.push(c.hits.join(','));
      if (i === 2) await shot('library-desktop');
      await sleep(900);
    }
    const distinct = new Set(positions.map(p => p.slice(0, 2).join(','))).size;
    check('cat moves over time on the library', distinct >= 3, JSON.stringify(positions.slice(0, 6)));
    check('cat never covers controls while perched', hitsSeen.length === 0, hitsSeen.slice(0, 3).join(' | '));
    // Pet by click.
    await js(`document.querySelector('.roam-body').click()`); await sleep(300);
    const petted = await js(`libraryCat.debug()`);
    check('petting makes the cat happy and think', petted.pose === 'happy' && petted.thought.length > 0, petted.thought);
    await shot('cat-petted');
    // Select a book and check the detail card.
    await js(`document.querySelector('.spine').click()`); await sleep(300);
    check('spine opens book detail', await js(`!!document.querySelector('.book-card h3')`));
    await js(`document.querySelector('[data-act=delete]').click()`); await sleep(200);
    check('delete asks for permanent confirmation (no undo)', await js(`document.querySelector('#modal').open && /לצמיתות|permanently/.test(document.querySelector('#modal').textContent) && /אי אפשר לבטל/.test(document.querySelector('#modal').textContent)`));
    check('cat pauses while a dialog is open', await js(`libraryCat.debug().paused`));
    await shot('delete-confirm');
    await js(`document.querySelector('[data-act=close-modal]').click()`); await sleep(400);
    check('cat resumes after dialog closes', !(await js(`libraryCat.debug().paused`)));
    await js(`window.scrollTo(0, 420)`); await sleep(2600);
    const followed = await js(catClear);
    check('cat follows the scroll into view', followed.visible && followed.y - followed.h >= scrollYOf(followed), JSON.stringify({ y: followed.y, anchor: followed.anchor }));
    await shot('library-scrolled');
    await js(`document.querySelector('[data-tab=progress]').click()`); await sleep(500);
    await js(`window.scrollTo(0,0)`); await sleep(300);
    await shot('library-progress', true);
  }
  if (want('drag')) {
    await viewport(1440, 900); await load(); await sleep(3200);
    const c = await js(`(() => { const r = document.querySelector('.roam-body').getBoundingClientRect(); return {x:r.left+r.width/2, y:r.top+r.height/2}; })()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: c.x, y: c.y, button: 'left', clickCount: 1 });
    for (let i = 1; i <= 8; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: c.x + i * 30, y: c.y + i * 40, button: 'left', buttons: 1 }); await sleep(40); }
    const held = await js(`libraryCat.debug()`);
    check('dragging picks the cat up', held.pose === 'held', held.thought);
    await shot('cat-held');
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: c.x + 240, y: c.y + 320, button: 'left', clickCount: 1 });
    await sleep(1800);
    const landed = await js(catClear);
    check('dropped cat lands on a perch', !!landed.anchor && landed.pose !== 'held', JSON.stringify({ anchor: landed.anchor, pose: landed.pose }));
  }
  if (want('new')) {
    await viewport(1440, 900); await load('#new'); await sleep(1500);
    check('Auto: English target disabled', await js(`document.querySelector('input[name=target][value=en]').disabled`));
    check('Auto: checked/thorough disabled', await js(`document.querySelector('input[name=quality][value=checked]').disabled`));
    check('translate disabled without a file', await js(`document.getElementById('translate-button').disabled`));
    await js(`document.querySelector('[data-act=sample]').click()`); await sleep(400);
    check('sample enables translate in Auto', !(await js(`document.getElementById('translate-button').disabled`)));
    await js(`document.getElementById('options').open = true`); await sleep(200);
    await js(`(() => { const r = document.querySelector('input[name=model][value=configured]'); r.checked = true; r.dispatchEvent(new Event('change', {bubbles:true})); })()`); await sleep(300);
    check('own model requires budget and key', await js(`document.getElementById('translate-button').disabled && document.querySelectorAll('#readiness li:not(.ok)').length === 2`));
    await js(`document.querySelector('[data-budget="5"]').click()`); await sleep(200);
    await js(`window.libraryApp.state.keys.openai = 'available'; window.libraryApp.render()`); await sleep(200);
    check('budget + key enable translate', !(await js(`document.getElementById('translate-button').disabled`)));
    await shot('new-own-model', true);
    await js(`document.getElementById('translate-button').click()`); await sleep(300);
    check('own model asks for provider consent', await js(`document.querySelector('#modal').open && /אישור שליחה|Confirm sending/.test(document.querySelector('#modal').textContent)`));
    await shot('consent');
    await js(`window.libraryApp.state.demo.speed = 4; window.libraryApp.state.job = null; document.querySelector('[data-act=start-job]').click()`); await sleep(2600);
    check('job page renders with bindery', await js(`!!document.querySelector('.bindery[data-running=true]')`));
    await shot('job-desktop');
    await js(`document.querySelector('[data-act=pause]').click()`); await sleep(300);
    check('pause freezes the bindery', await js(`document.querySelector('.bindery').dataset.running === 'false'`));
    await js(`document.querySelector('[data-act=resume]').click()`); await sleep(100);
    for (let i = 0; i < 60 && (await js(`window.libraryApp.state.route`)) === 'job'; i++) await sleep(500);
    check('job finishes into result', (await js(`window.libraryApp.state.route`)) === 'result');
    await sleep(1500);
    await shot('result-desktop');
    await js(`document.querySelector('[data-act=review]').click()`); await sleep(500);
    await shot('review-desktop');
  }
  if (want('bindery')) {
    // Freeze the page turn at fixed moments so each frame can be reviewed.
    await viewport(1200, 900); await load('#new'); await sleep(800);
    await js(`document.querySelector('[data-act=sample]').click()`); await sleep(200);
    await js(`document.getElementById('translate-button').click()`); await sleep(1200);
    await js(`window.libraryApp.state.job.pct = 40; window.libraryApp.state.job.status = 'translating'; window.libraryApp.state.job.lastStage = 'translating'; window.libraryApp.render()`); await sleep(400);
    const box = await js(`(() => { window.scrollTo(0, 0); const r = document.querySelector('.bindery').getBoundingClientRect(); return {x:r.left, y:r.top, width:r.width, height:r.height}; })()`);
    for (const f of [0.1, 0.3, 0.45, 0.6, 0.75]) {
      await js(`document.querySelector('.bindery').getAnimations({subtree:true}).forEach(a => { a.pause(); const d = a.effect.getComputedTiming().duration; a.currentTime = ${f} * d - (a.effect.getTiming().delay || 0); })`);
      await sleep(120);
      const r = await send('Page.captureScreenshot', { format: 'png', clip: { ...box, scale: 1 } });
      writeFileSync(join(out, `bindery-${Math.round(f * 100)}.png`), Buffer.from(r.data, 'base64'));
    }
    check('bindery has two turning leaves', (await js(`document.querySelectorAll('.bindery .leaf').length`)) === 2);
  }
  if (want('shelf')) {
    await viewport(1440, 900); await load(); await sleep(1200);
    await js(`(() => { const s = window.libraryApp.state; s.demo.library = 'big'; document.querySelector('[data-act=demo]').click(); })()`); await sleep(200);
    await js(`(() => { const r = document.querySelector('input[name=demo-library][value=big]'); r.checked = true; r.dispatchEvent(new Event('change', {bubbles:true})); document.getElementById('modal').close(); })()`); await sleep(600);
    const first = await js(`document.querySelectorAll('.spine').length`);
    check('large library opens a few shelves, not all 120', first > 0 && first < 120 && await js(`!!document.querySelector('.shelf-more')`), String(first));
    await js(`document.querySelector('[data-act=more-shelves]').click()`); await sleep(300);
    check('“more shelves” adds books', (await js(`document.querySelectorAll('.spine').length`)) > first);
    await js(`document.querySelector('.bookcase').scrollIntoView({block:'start'}); window.scrollBy(0, -60)`); await sleep(400);
    const sp = await js(`(() => { const r = document.querySelectorAll('.spine')[6].getBoundingClientRect(); return {x:r.left + r.width/2, y:r.top + r.height/2}; })()`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: sp.x, y: sp.y }); await sleep(900);
    check('hovered book turns to show its cover', await js(`getComputedStyle(document.querySelectorAll('.spine')[6].querySelector('.book3d')).transform !== getComputedStyle(document.querySelectorAll('.spine')[1].querySelector('.book3d')).transform`));
    await shot('shelf-hover');
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 });
    await js(`document.querySelector('[data-view=list]').click()`); await sleep(400);
    check('list view shows every book', (await js(`document.querySelectorAll('.list-book').length`)) >= 120);
    await shot('library-list');
  }
  if (want('decision')) {
    await viewport(1440, 900); await load('#new'); await sleep(800);
    await js(`(() => { const s = window.libraryApp.state; s.demo.next = 'decision'; s.demo.speed = 4; s.keys.openai = 'available'; s.form.model = 'configured'; s.form.budget = '2'; window.libraryApp.render(); document.querySelector('[data-act=sample]').click(); })()`); await sleep(300);
    await js(`document.getElementById('translate-button').click()`); await sleep(200);
    await js(`document.querySelector('[data-act=start-job]').click()`);
    for (let i = 0; i < 60 && !(await js(`!!document.querySelector('[data-act=decide]')`)); i++) await sleep(400);
    check('decision scenario shows the decision box', await js(`!!document.querySelector('[data-act=decide]')`));
    await sleep(1200); await shot('job-decision', true);
  }
  if (want('learning')) {
    await viewport(1440, 900); await load('#learning'); await sleep(2500);
    await js(`document.querySelector('.gloss-word').click()`); await sleep(300);
    check('gloss opens', await js(`!!document.querySelector('.gloss')`));
    await shot('learning-desktop');
  }
  if (want('english')) {
    await viewport(1440, 900); await load(); await sleep(800);
    await js(`document.querySelector('[data-act=lang]').click()`); await sleep(2500);
    check('English switches direction', await js(`document.documentElement.dir === 'ltr' && /Your translations/.test(document.body.textContent)`));
    await shot('library-english');
  }
  if (want('mobile')) {
    await viewport(390, 844, true); await load(); await sleep(3500);
    const w = await js(`document.documentElement.scrollWidth`);
    check('no horizontal overflow at 390', w <= 390, String(w));
    await shot('library-390');
    await js(`location.hash = '#new'`); await sleep(2500);
    check('no horizontal overflow on new at 390', (await js(`document.documentElement.scrollWidth`)) <= 390);
    await shot('new-390');
    const c = await js(catClear);
    check('mobile cat clear of controls', !c.visible || !c.anchor || c.hits.length === 0, c.hits?.join(','));
  }
  if (want('hidden')) {
    await viewport(1440, 900); await load(); await sleep(2500);
    await send('Emulation.setFocusEmulationEnabled', { enabled: false });
    await js(`Object.defineProperty(document, 'hidden', {configurable:true, get: () => true}); document.dispatchEvent(new Event('visibilitychange'))`); await sleep(300);
    check('cat pauses on hidden tab', await js(`libraryCat.debug().paused`));
  }
  check('no page errors', errors.length === 0, errors.slice(0, 4).join(' | '));
} catch (e) {
  console.error(e); check('script completed', false, String(e.message).slice(0, 300));
} finally {
  writeFileSync(join(out, 'verification.json'), JSON.stringify({ date: new Date().toISOString(), results, errors }, null, 2));
  try { ws?.close(); } catch {}
  proc.kill();
  const failed = results.filter(r => !r.ok).length;
  console.log(`${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}
function scrollYOf() { return 420 + 70; }
