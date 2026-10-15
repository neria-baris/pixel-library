/* The library — consolidated prototype that mirrors the real app surface (scholarly_translation/ui).
   Synthetic data only: no fetch, no file contents, no keys, no providers, no persistent storage. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n, digits = 2) => '$' + Number(n || 0).toFixed(digits);
  const cat = (type, detail) => window.libraryCat?.react(type, detail);

  // ---------- State ----------
  const S = {
    lang: 'he', route: 'library',
    keys: { openai: 'missing', anthropic: 'missing' },
    account: 'signedOut', update: 'available', autoUpdate: true, accountMenu: false,
    demo: { next: 'smooth', library: 'sample', speed: 1 },
    prefs: { cat: 'roam', sound: false, art: true, soundError: false },
    libTab: 'done', search: '', selected: null, libView: 'shelf', libSort: 'recent', shelfLimit: 3,
    form: {
      file: null, fileError: '', optionsOpen: false, profile: 'scholarly', model: 'auto',
      roles: { translator: 'gpt-6-luna', semantic_reviewer: 'follow', chapter_qa: 'follow' },
      quality: 'fast', target: 'he', source: 'auto', budget: '', ocr: 'vision', fontBefore: 'frank'
    },
    terms: { he: 'memory = זיכרון\ninvoluntary memory | mémoire involontaire = זיכרון בלתי רצוני # פרוסט', en: '' },
    termsSaved: { he: true, en: true },
    job: null, result: null,
    review: { open: false, unit: 0, drafts: {}, saved: {} },
    deep: { cross: 'idle', suggestions: 'idle' },
    fontAfter: 'frank',
    learn: { lang: 'fr', effort: 1, book: 'jardin', chapter: 3, gloss: null, read: new Set(), met: 37 }
  };
  const t = (he, en) => (S.lang === 'en' ? en : he);
  const today = () => new Date().toLocaleDateString(S.lang === 'en' ? 'en-GB' : 'he-IL');

  // ---------- Catalog and sample data ----------
  const PROVIDERS = { openai: 'OpenAI', anthropic: 'Anthropic' };
  const MODELS = [
    { id: 'gpt-6-luna', provider: 'openai', name: 'GPT-6 Luna', price: .0009, vision: true },
    { id: 'gpt-6.1-sol', provider: 'openai', name: 'GPT-6.1 Sol', price: .004, vision: true },
    { id: 'claude-haiku-4-5', provider: 'anthropic', name: 'Claude Haiku 4.5', price: .0012, vision: true },
    { id: 'claude-sonnet-5-5', provider: 'anthropic', name: 'Claude Sonnet 5.5', price: .0045, vision: true },
    { id: 'claude-opus-5-5', provider: 'anthropic', name: 'Claude Opus 5.5', price: .012, vision: true }
  ];
  const model = id => MODELS.find(m => m.id === id);
  const ROLE_NAMES = { translator: ['מתרגם', 'Translator'], semantic_reviewer: ['בדיקת איכות (QA)', 'Quality check (QA)'], chapter_qa: ['מבקר פרקים', 'Chapter reviewer'] };
  const FONTS = [['frank', 'Frank Ruhl Libre'], ['david-libre', 'David Libre'], ['david-clm', 'David CLM'], ['hadasim', 'Hadasim CLM'], ['noto-serif', 'Noto Serif Hebrew']];
  const COLORS = ['#7b3f37', '#3f5f48', '#b4652f', '#5a5470', '#8a6a3b', '#2f5566', '#6d4a6b', '#57674a', '#9a4a3c', '#40626b'];
  const SAMPLE_DONE = [
    { id: 'memory', file: 'On Time and Memory.pdf', kind: 'pdf', date: '12.10.2026', units: 214, drive: 'synced', color: '#7b3f37', h: 158, w: 40 },
    { id: 'jardin', file: 'Le jardin des sentiers.epub', kind: 'epub', date: '09.10.2026', units: 386, drive: 'local', color: '#3f5f48', h: 146, w: 48 },
    { id: 'torrezno', file: 'Las Aventuras del Capitán Torrezno 01.pdf', kind: 'pdf', date: '14.10.2026', units: 58, drive: 'synced', color: '#b4652f', h: 124, w: 30 },
    { id: 'kokoro', file: 'こころ — Kokoro.epub', kind: 'epub', date: '28.09.2026', units: 512, drive: 'synced', color: '#5a5470', h: 166, w: 54 },
    { id: 'ethics', file: 'Notes on Ethics, vol. II.pdf', kind: 'pdf', date: '17.09.2026', units: 301, drive: 'local', color: '#8a6a3b', h: 150, w: 38 }
  ];
  const SAMPLE_DRIVE = [{ id: 'maps', file: 'Ancient Maps of the Levant.pdf', kind: 'pdf', date: '30.08.2026', units: 177, drive: 'cloud', color: '#2f5566', h: 138, w: 36 }];
  const SAMPLE_PROGRESS = [
    { id: 'light', file: 'Essays on Light.pdf', kind: 'pdf', date: '15.10.2026', status: 'paused', chapter: 4, chapters: 11, done: 120, total: 310, spent: 1.84, budget: 5, formats: ['pdf', 'html'], color: '#40626b', h: 150, w: 40 },
    { id: 'garten', file: 'Der Garten der Pfade.epub', kind: 'epub', date: '14.10.2026', status: 'paused', chapter: 7, chapters: 9, done: 402, total: 455, spent: 3.58, budget: 4, formats: ['epub', 'html'], color: '#6d4a6b', h: 142, w: 44,
      blocker: ['התקציב שנותר ($0.42) לא יספיק לבדיקת הפרקים (אומדן $0.95).', 'The remaining budget ($0.42) will not cover the chapter review (estimate $0.95).'] },
    { id: 'lectures', file: 'Lectures 1931 (scan).pdf', kind: 'pdf', date: '11.10.2026', status: 'interrupted', chapter: 2, chapters: 6, done: 31, total: 140, spent: .61, budget: 3, formats: [], color: '#57674a', h: 132, w: 34,
      error: ['החיבור לספק נקטע. אפשר להמשיך מאותה נקודה; שום מקטע שהושלם לא יישלח שוב.', 'The provider connection dropped. You can continue from the same point; no finished segment is sent again.'] }
  ];
  const books = { done: [], drive: [], progress: [] };
  function bigLibrary() {
    const a = ['Notes on', 'Letters from', 'A History of', 'Essays on', 'The Garden of', 'Fragments of', 'Lectures on', 'Journeys through', 'Studies in', 'Le livre de', 'Der Weg zum', 'Cuentos de'];
    const b = ['Memory', 'Light', 'the Sea', 'Silence', 'Rome', 'Time', 'Paper', 'the North', 'Ethics', 'Translation', 'Cats', 'Winter', 'Maps', 'Gardens', 'Clocks'];
    return Array.from({ length: 120 }, (_, i) => {
      const kind = i % 3 ? 'pdf' : 'epub', day = 1 + (i * 7) % 28, month = 1 + (i * 5) % 10;
      return { id: 'big-' + i, file: `${a[i % a.length]} ${b[(i * 7) % b.length]}${i % 4 ? '' : ', vol. ' + (1 + i % 5)}.${kind}`, kind,
        date: `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.2026`, units: 40 + (i * 37) % 560,
        drive: i % 4 ? 'synced' : 'local', color: COLORS[(i * 3) % COLORS.length], h: 120 + (i * 17) % 50, w: 26 + (i * 11) % 28 };
    });
  }
  function resetBooks() {
    if (S.demo.library === 'big') { books.done = bigLibrary(); books.drive = SAMPLE_DRIVE.map(b => ({ ...b })); books.progress = SAMPLE_PROGRESS.map(b => ({ ...b })); return; }
    const empty = S.demo.library === 'empty';
    books.done = empty ? [] : SAMPLE_DONE.map(b => ({ ...b }));
    books.drive = empty ? [] : SAMPLE_DRIVE.map(b => ({ ...b }));
    books.progress = empty ? [] : SAMPLE_PROGRESS.map(b => ({ ...b }));
  }
  resetBooks();
  const SEGMENTS = [
    { loc: [1, 3], src: 'Memory is not a drawer in which the past remains untouched. Each return to a familiar place changes the way we read it.', tgt: 'הזיכרון אינו מגירה שבה העבר נשאר ללא שינוי. כל חזרה למקום מוכר משנה את האופן שבו אנו קוראים אותו.',
      finding: ['בדקו שהמונח memory מתורגם בעקביות (״זיכרון״, כמו ברשימת המונחים שלכם).', 'Check that “memory” is rendered consistently (as in your term list).'] },
    { loc: [1, 4], src: 'Three windows open toward the garden; each one frames a different view.', tgt: 'שלושה חלונות נפתחים אל הגן; כל אחד מהם ממסגר מראה אחר.', finding: null },
    { loc: [2, 1], src: 'The reader paused at the margin. A small mark, almost invisible, connected this sentence to a question written many years before.', tgt: 'הקורא נעצר בשוליים. סימן קטן, כמעט בלתי נראה, קשר את המשפט הזה לשאלה שנכתבה שנים רבות קודם לכן.',
      finding: ['ייתכן ש״הקורא״ מתייחס לדמות מסוימת; בפרק 1 נבחר ״הקוראת״.', '“The reader” may refer to a specific character; chapter 1 chose the feminine form.'] },
    { loc: [2, 7], src: 'Involuntary memory, as Proust called it, arrives uninvited — like a cat at the door.', tgt: 'זיכרון בלתי רצוני, כפי שכינה אותו פרוסט, מגיע בלי הזמנה — כמו חתול בפתח הדלת.', finding: null },
    { loc: [3, 2], src: 'A library holds more than books. It preserves the distance between one reading and the next.', tgt: 'ספרייה מכילה יותר מספרים. היא משמרת את המרחק שבין קריאה אחת לבאה אחריה.', finding: null }
  ];
  const NOTEBOOK = [{ src: 'memory', tgt: 'זיכרון' }, { src: 'involuntary memory', tgt: 'זיכרון בלתי רצוני', note: 'Proust' }, { src: 'the reader', tgt: 'הקוראת' }];
  const LEARN_LANGS = {
    en: { he: 'אנגלית', native: 'English', words: ['morning', 'house', 'light', 'book', 'window', 'garden'] },
    fr: { he: 'צרפתית', native: 'Français', words: ['matin', 'maison', 'lumière', 'livre', 'fenêtre', 'jardin'] },
    es: { he: 'ספרדית', native: 'Español', words: ['mañana', 'casa', 'luz', 'libro', 'ventana', 'jardín'] },
    de: { he: 'גרמנית', native: 'Deutsch', words: ['Morgen', 'Haus', 'Licht', 'Buch', 'Fenster', 'Garten'] },
    it: { he: 'איטלקית', native: 'Italiano', words: ['mattina', 'casa', 'luce', 'libro', 'finestra', 'giardino'] },
    ar: { he: 'ערבית ספרותית', native: 'العربية', words: ['صباح', 'بيت', 'ضوء', 'كتاب', 'نافذة', 'حديقة'] }
  };
  const HE_WORDS = ['בוקר', 'בית', 'אור', 'ספר', 'חלון', 'גן'];
  const EFFORTS = [['היכרות', 'Warm-up', 10], ['בקצב שלי', 'My pace', 20], ['אתגר', 'Challenge', 30]];

  // ---------- Derived rules (mirroring the real app) ----------
  const own = () => S.form.model === 'configured';
  const resolveRole = (roles, role) => (roles[role] === 'follow' ? roles.translator : roles[role]);
  function requiredProviders(form = S.form) {
    if (form.model !== 'configured') return [];
    const roles = form.quality === 'fast' ? ['translator'] : ['translator', 'semantic_reviewer', 'chapter_qa'];
    return [...new Set(roles.map(r => model(resolveRole(form.roles, r)).provider))];
  }
  const missingKeys = () => requiredProviders().filter(p => S.keys[p] === 'missing');
  function unitsFor(file) { return file.sample ? 214 : Math.min(600, Math.max(40, Math.round(file.size / 4200))); }
  function estimate(form = S.form) {
    if (!form.file || form.model !== 'configured') return null;
    const units = unitsFor(form.file), tokens = units * 430, chapters = Math.max(1, Math.round(units / 28));
    const tr = model(form.roles.translator), qa = model(resolveRole(form.roles, 'semantic_reviewer')), ch = model(resolveRole(form.roles, 'chapter_qa'));
    let cost = tokens * 2.3 / 1000 * tr.price;
    if (form.quality !== 'fast') {
      cost += tokens * (form.quality === 'thorough' ? 1.6 : .55) / 1000 * qa.price;
      cost += chapters * 6200 / 1000 * ch.price;
    }
    return { units, chapters, low: cost * .85, high: cost * 1.3, mid: cost };
  }
  function budgetValue() { const v = Number(S.form.budget); return S.form.budget !== '' && Number.isFinite(v) && v >= .01 ? Math.round(v * 100) / 100 : null; }
  function readiness() {
    const items = [{ ok: !!S.form.file, text: t('בחירת קובץ PDF או EPUB', 'Choose a PDF or EPUB file'), focus: 'drop-zone' }];
    if (own()) {
      items.push({ ok: budgetValue() !== null, text: t('תקציב מרבי למסמך (חובה במודל משלי)', 'Maximum budget per document (required for your own model)'), focus: 'budget' });
      requiredProviders().forEach(p => items.push({ ok: S.keys[p] !== 'missing', text: t(`מפתח API של ${PROVIDERS[p]}`, `${PROVIDERS[p]} API key`), act: 'keys' }));
    }
    return items;
  }
  function parseTerms(text) {
    const lines = text.split('\n'), errors = [];
    let ok = 0;
    lines.forEach((raw, i) => {
      const line = raw.trim();
      if (!line || line.startsWith('#')) return;
      const body = line.split('#')[0];
      if (!body.includes('=')) { errors.push(t(`שורה ${i + 1}: חסר ״=״ בין המקור לתרגום`, `Line ${i + 1}: missing “=” between source and translation`)); return; }
      const [src, tgt] = body.split('=');
      if (!src.trim()) errors.push(t(`שורה ${i + 1}: חסר מונח מקור`, `Line ${i + 1}: missing source term`));
      else if (!tgt?.trim()) errors.push(t(`שורה ${i + 1}: חסר תרגום`, `Line ${i + 1}: missing translation`));
      else ok++;
    });
    return { ok, errors };
  }

  // ---------- Pixel art ----------
  function pixels(rows, pal, cls = '') {
    let d = {};
    rows.forEach((row, y) => [...row].forEach((c, x) => { if (c !== '.') (d[c] ||= []).push(`M${x} ${y}h1v1h-1z`); }));
    return `<svg class="${cls}" viewBox="0 0 ${rows[0].length} ${rows.length}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${Object.entries(d).map(([c, p]) => `<path fill="${pal[c]}" d="${p.join('')}"/>`).join('')}</svg>`;
  }
  const LOGO = pixels(['.....O....O.....', '....OBO..OBO....', '....OBBOOBBO....', '....OBEBBEBO....', 'OOO.OBBBBBBO.OOO', 'OCCOOOOOOOOOOCCO', 'OCCCCCCOOCCCCCCO', 'OCCCCCCOOCCCCCCO', 'OCCCCCCOOCCCCCCO', 'OOOOOOOOOOOOOOOO'],
    { O: '#e2c27f', B: '#d68b45', E: '#1f3328', C: '#f6ecd2' }, 'logo');
  const KEY_ICON = pixels(['..OOOO..........', '.O....O.........', 'O..OO..OOOOOOOOO', 'O..OO..OOOOOOOOO', '.O....O.....O.OO', '..OOOO......O.O.'], { O: 'currentColor' }, 'key-icon');
  function heroScene() {
    let s = '';
    const r = (x, y, w, h, f, c = '') => { s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"${c ? ` class="${c}"` : ''}/>`; };
    r(0, 0, 160, 80, '#203629');
    for (let x = 8; x < 160; x += 14) r(x, 0, 1, 64, '#1b2f24');
    // Window and night.
    r(104, 6, 44, 40, '#5b3a26'); r(106, 8, 40, 36, '#172739'); r(106, 20, 40, 12, '#1c3048'); r(106, 32, 40, 12, '#22405c');
    r(132, 12, 6, 1, '#f3e2a6'); r(131, 13, 8, 5, '#f3e2a6'); r(132, 18, 6, 1, '#f3e2a6'); r(133, 14, 2, 2, '#ddc887'); r(136, 16, 1, 1, '#ddc887');
    [[110, 12, 0], [117, 16, 1], [124, 10, 2], [112, 27, 3], [141, 28, 1], [121, 35, 2], [109, 38, 0], [144, 11, 3]].forEach(([x, y, d]) => r(x, y, 1, 1, '#fff6d0', `star s${d}`));
    r(125, 8, 2, 36, '#5b3a26'); r(106, 25, 40, 2, '#5b3a26');
    r(102, 46, 48, 3, '#7a5236'); r(103, 49, 46, 1, '#3b2718');
    r(136, 40, 7, 6, '#9b5a3a'); r(135, 39, 9, 2, '#b06a45'); r(139, 33, 2, 6, '#4f7a45'); r(136, 34, 3, 2, '#5f8f4f'); r(141, 32, 3, 2, '#5f8f4f'); r(137, 31, 2, 2, '#6fa05a'); r(142, 35, 2, 2, '#4f7a45');
    r(110, 41, 10, 5, '#d9c9a3'); r(110, 41, 10, 1, '#efe2c2'); r(111, 43, 8, 1, '#b8a47c');
    // Bookcase.
    r(6, 4, 72, 60, '#4a311f'); r(8, 6, 68, 56, '#25190f');
    const palette = ['#7b3f37', '#3f5f48', '#b4652f', '#5a5470', '#8a6a3b', '#2f5566', '#9a4a3c', '#c9a35e', '#57674a'];
    [20, 38, 56].forEach((plank, row) => {
      let x = 10, n = row * 3;
      while (x < 70) {
        const w = 2 + ((n * 7) % 3), h = 9 + ((n * 5 + row) % 6), col = palette[(n * 4 + row) % palette.length];
        if (n % 9 === 5) { r(x, plank - h + 2, w + 1, h - 2, col, 'tilt'); x += w + 3; n++; continue; }
        r(x, plank - h, w, h, col); r(x, plank - h + 2, w, 1, '#e2c27f'); r(x, plank - 3, w, 1, '#e2c27f');
        x += w + (n % 5 === 0 ? 2 : 1); n++;
      }
      r(8, plank, 68, 2, '#8a5d3b'); r(8, plank + 2, 68, 1, '#3b2718');
    });
    r(56, 7, 6, 10, '#c9a35e'); r(57, 8, 4, 8, '#e8d6a6');
    // Ladder, floor and rug.
    r(84, 8, 2, 56, '#9b6d47'); r(93, 8, 2, 56, '#9b6d47');
    for (let y = 13; y < 62; y += 7) r(84, y, 11, 1, '#c79b68');
    r(0, 64, 160, 16, '#56391f'); r(0, 64, 160, 1, '#8a5d3b');
    for (let x = 4; x < 160; x += 18) r(x, 65, 1, 15, '#47301b');
    r(96, 70, 56, 6, '#8e3b37'); r(98, 71, 52, 4, '#a8504a'); r(100, 72, 48, 2, '#8e3b37');
    // Pendant lamp with a soft cone.
    r(46, 0, 1, 7, '#8a7a5a'); r(41, 7, 11, 3, '#c9a35e'); r(42, 10, 9, 1, '#f5d98b');
    s += '<polygon class="glow" points="42,11 51,11 70,64 23,64" fill="#f8de95" opacity=".12"/>';
    [[30, 30, 1], [55, 22, 2], [62, 44, 3], [36, 50, 1], [48, 38, 2]].forEach(([x, y, d]) => r(x, y, 1, 1, '#f5e3b0', `mote m${d}`));
    return `<svg class="hero-scene" viewBox="0 0 160 80" preserveAspectRatio="xMaxYMid slice" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${s}</svg>`;
  }
  const DROP_ART = pixels([
    '....OOOOOOOOOO....', '....OPPPPPPPPO....', '....OPKKKKKKPO....', '....OPPPPPPPPO....', '..OOOPKKKKKPPOOO..',
    '..OCOPPPPPPPPOCO..', 'OOOCOOOOOOOOOOCOOO', 'OWWWWWWWWWWWWWWWWO', 'OWWWWOOOOOOOWWWWWO', 'OWWWWWWWWWWWWWWWWO', 'OOOOOOOOOOOOOOOOOO'],
    { O: '#4a311f', P: '#fffaf0', K: '#b8a47c', C: '#d9c9a3', W: '#9b6d47' }, 'drop-art');
  function resultBook(color = '#7b3f37') {
    return pixels([
      '..OOOOOOOOOOOOOOOOOO..', '.OGCCCCCCCCCCCCCCCCGO.', '.OCCCCCCCCCCCCCCCCCCOP', '.OCCCOOOOOOOOOOOOCCCOP', '.OCCCOTTTTTTTTTTOCCCOP',
      '.OCCCOTKKKKKKKKTOCCCOP', '.OCCCOTTTTTTTTTTOCCCOP', '.OCCCOTKKKKKKTTTOCCCOP', '.OCCCOOOOOOOOOOOOCCCOP', '.OCCCCCCCCCCCCCCCCCCOP',
      '.OCCCCCCCCCCCCCCCCCCOP', '.OCCCCCCCCCCCCCCCCCCOP', '.OCCCCCCCCCCCCCCRCCCOP', '.OCCCCCCCCCCCCCCRCCCOP', '.OGCCCCCCCCCCCCCRCCGOP',
      '..OOOOOOOOOOOOOOROOOOP', '...PPPPPPPPPPPPPRPPPPP', '...............RR.....', '................R.....'],
      { O: '#2a1d15', C: color, G: '#e2c27f', T: '#f6ecd2', K: '#8a7a5a', P: '#e8dcbf', R: '#b8453c' }, 'result-book');
  }

  // ---------- Small building blocks ----------
  function seg(name, legend, options, value, { hint = '', id = name } = {}) {
    return `<fieldset class="field"><legend id="${id}-legend">${legend}</legend><div class="seg">${options.map(o =>
      `<label class="seg-opt${o.disabled ? ' is-disabled' : ''}"><input type="radio" name="${name}" value="${o.value}" ${o.value === value ? 'checked' : ''} ${o.disabled ? 'disabled' : ''}><span><b>${o.label}</b>${o.caption ? `<small>${o.caption}</small>` : ''}</span></label>`).join('')}</div>${hint ? `<p class="hint">${hint}</p>` : ''}</fieldset>`;
  }
  function modelOptions(selected, { follow = false } = {}) {
    const groups = Object.entries(PROVIDERS).map(([pid, pname]) => `<optgroup label="${pname} · ${keyLabel(S.keys[pid])}">${MODELS.filter(m => m.provider === pid)
      .map(m => `<option value="${m.id}" ${m.id === selected ? 'selected' : ''}>${m.name}</option>`).join('')}</optgroup>`).join('');
    return (follow ? `<option value="follow" ${selected === 'follow' ? 'selected' : ''}>${t('כמו המתרגם', 'Same as translator')}</option>` : '') + groups;
  }
  const keyLabel = state => ({ missing: t('אין מפתח', 'no key'), available: t('זמין להרצה', 'available'), saved: t('שמור במחשב', 'saved on this computer') }[state]);
  function rolesBlock(prefix) {
    const r = S.form.roles;
    const sel = (role, follow) => `<div class="field"><label for="${prefix}-${role}">${t(...ROLE_NAMES[role])}</label><select id="${prefix}-${role}" data-role="${role}">${modelOptions(r[role], { follow })}</select></div>`;
    return `<div class="roles">${sel('translator', false)}${sel('semantic_reviewer', true)}<details class="mini-details" ${S.form.chapterOpen ? 'open' : ''} data-k="chapter-details"><summary>${t('בחירת מבקר פרקים מתקדמת (chapter_qa)', 'Advanced chapter reviewer (chapter_qa)')}</summary>${sel('chapter_qa', true)}</details></div>${keyRows()}`;
  }
  function keyRows() {
    const need = requiredProviders();
    if (!need.length) return '';
    return `<ul class="key-rows">${need.map(p => `<li data-state="${S.keys[p]}"><span class="key-dot" aria-hidden="true"></span><span>${PROVIDERS[p]}: <b>${keyLabel(S.keys[p])}</b></span>${S.keys[p] === 'missing' ? `<button type="button" class="link-btn" data-act="keys">${t('הזנת מפתח', 'Enter key')}</button>` : ''}</li>`).join('')}</ul>`;
  }
  function badge(kind) { return `<span class="kind" data-kind="${kind}">${kind.toUpperCase()}</span>`; }
  const arrow = () => ''; // Navigation is written out in words, never arrows (earlier user feedback on A).

  // ---------- Shell ----------
  function header() {
    const keyState = Object.values(S.keys).includes('saved') ? 'saved' : Object.values(S.keys).includes('available') ? 'available' : 'missing';
    const keyText = keyState === 'missing' ? t('אין מפתח API', 'No API key') : Object.entries(S.keys).filter(([, v]) => v !== 'missing').map(([p, v]) => `${PROVIDERS[p]} (${keyLabel(v)})`).join(', ');
    const mdl = own() ? model(S.form.roles.translator).name : 'Auto';
    const modelState = !own() ? 'auto' : missingKeys().length ? 'warn' : 'ok';
    const nav = [['library', t('הספרייה', 'Library')], ['new', t('תרגום חדש', 'New translation')], ['learning', t('למידת שפה', 'Language learning')]];
    const navRoute = S.route === 'job' || S.route === 'result' ? 'new' : S.route;
    const initial = 'נ';
    const account = S.account === 'signedOut'
      ? `<button type="button" class="tool" data-act="sign-in" aria-label="${t('התחברות עם Google', 'Sign in with Google')}"><span class="g-mark" aria-hidden="true">G</span><span class="tool-text">${t('התחברות עם Google', 'Sign in with Google')}</span></button>`
      : `<div class="account"><button type="button" class="tool avatar" data-act="account" aria-haspopup="true" aria-expanded="${S.accountMenu}" aria-controls="account-menu" aria-label="${t('חשבון Google', 'Google account')}"><span aria-hidden="true">${initial}</span>${S.account === 'syncing' ? '<i class="sync-spin" aria-hidden="true"></i>' : S.account === 'error' ? '<i class="sync-err" aria-hidden="true">!</i>' : ''}</button>
        <div id="account-menu" class="account-menu" ${S.accountMenu ? '' : 'hidden'}><p class="account-email" dir="ltr">reader@example.com</p><p class="account-sync" role="status">${syncLine()}</p><div class="row"><button type="button" class="btn small" data-act="sync-now" ${S.account === 'syncing' ? 'disabled' : ''}>${t('סנכרון עכשיו', 'Sync now')}</button><button type="button" class="link-btn" data-act="sign-out">${t('התנתקות', 'Sign out')}</button></div></div></div>`;
    return `<header class="site-header"><div class="header-row">
      <a class="brand" href="#library" data-go="library" aria-label="${t('הספרייה — עמוד הבית', 'The Library — home')}">${LOGO}<span><strong>${t('הספרייה', 'The Library')}</strong><small>${t('תרגום מסמכים · קריאה · למידה', 'Translate · read · learn')}</small></span></a>
      <nav class="main-nav" aria-label="${t('ניווט ראשי', 'Main navigation')}">${nav.map(([r, label]) => `<a href="#${r}" data-go="${r}" class="nav-tab" ${navRoute === r ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
      <div class="header-tools">
        <button type="button" class="tool key-tool" data-act="keys" data-state="${keyState}" aria-label="${esc(keyText)}" title="${esc(keyText)}">${KEY_ICON}<i class="state-dot" aria-hidden="true"></i><span class="tool-text">${keyState === 'missing' ? t('אין מפתח', 'No key') : keyState === 'saved' ? t('שמור במחשב', 'Saved') : t('מפתח זמין', 'Key ready')}</span></button>
        <button type="button" class="tool model-tool" data-act="models" data-state="${modelState}"><i class="state-dot" aria-hidden="true"></i><span>${t('מודל', 'Model')}: <bdi>${esc(mdl)}</bdi></span></button>
        ${account}
        <button type="button" class="tool" data-act="lang" lang="${S.lang === 'en' ? 'he' : 'en'}">${S.lang === 'en' ? 'עברית' : 'English'}</button>
        <button type="button" class="tool icon-tool" data-act="help" aria-label="${t('עזרה', 'Help')}">?</button>
      </div></div></header>`;
  }
  function syncLine() {
    return { signedIn: t('סונכרן עם Google Drive לפני 2 דקות.', 'Synced with Google Drive 2 minutes ago.'), syncing: t('מסנכרן עם Google Drive…', 'Syncing with Google Drive…'), error: t('הסנכרון נכשל. הספרים במחשב זמינים; ננסה שוב.', 'Sync failed. Books on this computer are available; we will retry.') }[S.account] || '';
  }
  function updateNotice() {
    if (S.update !== 'available') return '';
    return `<div class="update-notice" role="status"><span>${t('גרסה 1.9 זמינה. היא תותקן בפעם הבאה שתפתחו את היישום. החתול כבר בדק: אין כפתור טונה.', 'Version 1.9 is available. It installs the next time you open the app. The cat checked: still no tuna button.')}</span><button type="button" class="icon-btn" data-act="close-update" aria-label="${t('סגירה', 'Close')}">✕</button></div>`;
  }
  function footer() {
    const catText = { roam: t('החתול מסתובב', 'Cat: roaming'), nap: t('החתול ישן', 'Cat: napping'), away: t('החתול בחופשה', 'Cat: on holiday') }[S.prefs.cat];
    return `<footer class="site-footer" data-perch="footer"><div class="footer-row">
      <span>${t('הקובץ והתוצאה נשמרים במחשב שלכם.', 'Your file and the result stay on your computer.')}</span>
      <span class="footer-tools">
        ${S.update === 'ready' ? `<span class="update-ready">${t('עדכון מוכן — הוא יופעל בפעם הבאה שתפתחו את היישום.', 'Update ready — it applies the next time you open the app.')}</span>` : ''}
        <label class="check"><input type="checkbox" id="auto-update" ${S.autoUpdate ? 'checked' : ''}> ${t('עדכונים אוטומטיים', 'Automatic updates')}</label>
        <button type="button" class="link-btn" data-act="prefs"><span aria-hidden="true">🐾</span> ${catText}</button>
        <button type="button" class="link-btn" data-act="help">${t('עזרה', 'Help')}</button>
      </span></div>
      ${S.prefs.cat === 'away' ? `<p class="cat-note">${t('החתול בחופשה. הוא השאיר פתק: ״תחזרו עם טונה.״', 'The cat is on holiday. Note left behind: “Come back with tuna.”')}</p>` : ''}
      <div class="demo-strip"><span>${t('אב טיפוס · נתונים מדומים · ללא תרגום אמיתי, קבצים, מפתחות או עלות', 'Prototype · simulated data · no real translation, files, keys or cost')}</span><button type="button" class="link-btn" data-act="demo">${t('לוח הדגמה', 'Demo console')}</button><a class="link-btn" href="index.html">${t('לאבות הטיפוס הקודמים', 'Earlier prototypes')}</a></div>
    </footer>`;
  }
  function render(opts = {}) {
    const focus = captureFocus();
    document.documentElement.lang = S.lang;
    document.documentElement.dir = S.lang === 'en' ? 'ltr' : 'rtl';
    document.title = t('הספרייה · תרגום, קריאה ולמידה', 'The Library · translate, read, learn');
    document.body.dataset.route = S.route;
    document.body.classList.toggle('no-art', !S.prefs.art);
    $('app').innerHTML = `<a class="skip" href="#main">${t('דילוג לתוכן', 'Skip to content')}</a>${header()}${updateNotice()}<main id="main" tabindex="-1">${page()}</main>${footer()}`;
    if (S.route === 'library') layoutShelf();
    if (opts.focusMain) { $('main').focus({ preventScroll: true }); }
    else restoreFocus(focus);
    window.libraryCat?.refresh();
  }
  function captureFocus() {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    if (el.dataset?.k) return `[data-k="${CSS.escape(el.dataset.k)}"]`;
    if (el.id) return `#${CSS.escape(el.id)}`;
    if (el.name && el.type === 'radio') return `input[name="${CSS.escape(el.name)}"][value="${CSS.escape(el.value)}"]`;
    if (el.dataset?.act) return `[data-act="${CSS.escape(el.dataset.act)}"]`;
    if (el.dataset?.go) return `[data-go="${CSS.escape(el.dataset.go)}"]`;
    return null;
  }
  function restoreFocus(selector) {
    if (!selector) return;
    const el = document.querySelector(selector);
    if (el && !el.disabled) el.focus({ preventScroll: true });
  }
  const page = () => ({ library: libraryPage, new: newPage, job: jobPage, result: resultPage, learning: learningPage }[S.route] || libraryPage)();

  // ---------- Library ----------
  function progressBooks() {
    const list = [...books.progress];
    if (S.job && S.job.status !== 'completed' && !list.some(b => b.id === S.job.id)) list.unshift(jobAsBook());
    return list;
  }
  function jobAsBook() {
    const j = S.job;
    return { id: j.id, file: j.filename, kind: j.kind, date: today(), status: j.status, chapter: j.chapter, chapters: j.chapters, done: j.done, total: j.total, spent: j.own ? j.spent : null, budget: j.budget,
      formats: j.done > 0 ? [j.kind, 'html'] : [], color: j.color, h: 146, w: 42, blocker: j.blocker, error: j.error, live: true };
  }
  function visibleBooks() {
    const q = S.search.trim().toLocaleLowerCase();
    const list = S.libTab === 'done' ? [...books.done, ...(S.account !== 'signedOut' ? books.drive : [])] : progressBooks();
    const dateKey = d => d.split('.').reverse().join('');
    const sorted = list.filter(b => b.file.toLocaleLowerCase().includes(q));
    if (S.libSort === 'name') sorted.sort((x, y) => x.file.localeCompare(y.file, S.lang));
    else if (S.libSort === 'size') sorted.sort((x, y) => (y.units || y.total || 0) - (x.units || x.total || 0));
    else sorted.sort((x, y) => dateKey(y.date).localeCompare(dateKey(x.date)));
    return sorted;
  }
  function libraryPage() {
    const progress = progressBooks(), blocked = progress.filter(b => b.blocker).length;
    const doneCount = books.done.length + (S.account !== 'signedOut' ? books.drive.length : 0);
    return `<section class="hero" data-perch="hero" aria-labelledby="hero-title">
        <div class="hero-copy"><span class="eyebrow">${t('ספרייה פרטית · אין קנסות על איחור', 'Private library · no late fees')}</span>
          <h1 id="hero-title">${t('ספרים ישנים.<br><em>מילים חדשות.</em>', 'Old books.<br><em>New words.</em>')}</h1>
          <p>${t('מתרגמים PDF ו־EPUB, קוראים ולומדים שפה מתוך הסיפור. החתול אחראי על ההפסקות.', 'Translate PDFs and EPUBs, read them, and learn a language from the story. The cat is in charge of breaks.')}</p>
          <div class="row hero-actions"><button type="button" class="btn gold" data-go="new">+ ${t('ספר חדש לתרגום', 'New book to translate')}</button><button type="button" class="btn ghost-light" data-act="sample">${t('נסו עם PDF דוגמה, ללא עלות', 'Try a sample PDF, free')}</button></div>
          <div class="hero-stats"><button type="button" data-tab="done">${doneCount} ${t('מוכנים', 'ready')}</button><button type="button" data-tab="progress">${progress.length} ${t('בעבודה', 'in progress')}</button>${blocked ? `<button type="button" class="stat-warn" data-tab="progress">${blocked} ${t('מחכה להחלטה', 'awaiting a decision')}</button>` : ''}</div>
        </div><div class="hero-art">${heroScene()}<i class="art-floor" data-perch="hero-floor"></i></div></section>
      <section class="shelf-section" data-perch="shelf-top" aria-labelledby="shelf-title">
        <div class="shelf-head"><div><h2 id="shelf-title">${t('התרגומים שלכם', 'Your translations')}</h2><p class="muted">${S.libTab === 'done' ? t('כל מה שתורגם ונשמר במחשב שלכם. בחרו ספר מהמדף כדי להוריד, לפתוח או ללמוד.', 'Everything translated and saved on your computer. Pick a book to download, open or learn from.') : t('עבודות שעוד לא הסתיימו. אפשר להמשיך, להחליט או להוריד חלקית.', 'Work that is not finished yet. Continue, decide, or download partially.')}</p></div>
          <div class="shelf-tools"><div class="tabs" role="tablist" aria-label="${t('סוג המסמכים בספרייה', 'Library document type')}">
            <button type="button" role="tab" id="tab-done" data-tab="done" aria-selected="${S.libTab === 'done'}" tabindex="${S.libTab === 'done' ? 0 : -1}">${t('מוכנים', 'Ready')} <span class="count">${doneCount}</span></button>
            <button type="button" role="tab" id="tab-progress" data-tab="progress" aria-selected="${S.libTab === 'progress'}" tabindex="${S.libTab === 'progress' ? 0 : -1}">${t('בתהליך עבודה', 'In progress')} <span class="count">${progress.length}</span>${blocked ? '<i class="tab-flag" aria-hidden="true">!</i>' : ''}</button></div>
            <div class="view-toggle" role="group" aria-label="${t('תצוגת הספרייה', 'Library view')}"><button type="button" data-view="shelf" aria-pressed="${S.libView === 'shelf'}">${t('מדף', 'Shelf')}</button><button type="button" data-view="list" aria-pressed="${S.libView === 'list'}">${t('רשימה', 'List')}</button></div>
            <label class="sort"><span class="sr-only">${t('מיון', 'Sort')}</span><select id="lib-sort">${[['recent', t('האחרונים קודם', 'Most recent')], ['name', t('לפי שם', 'By name')], ['size', t('הגדולים קודם', 'Largest first')]].map(([v, l]) => `<option value="${v}" ${S.libSort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
            <label class="search"><span class="sr-only">${t('חיפוש בספרייה', 'Search the library')}</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="m15 15 5 5" stroke="currentColor" stroke-width="2"/></svg><input id="search" type="search" placeholder="${t('חיפוש לפי שם קובץ', 'Search by file name')}" value="${esc(S.search)}" autocomplete="off"></label></div></div>
        ${S.account === 'error' ? `<p class="notice warn" role="alert">${t('הסנכרון עם Google Drive נכשל. הספרים במחשב זמינים כרגיל; ננסה שוב בעוד דקה.', 'Google Drive sync failed. Books on this computer work as usual; we will retry in a minute.')}</p>` : ''}
        <div id="bookcase" class="bookcase${S.libView === 'list' ? ' as-list' : ''}" data-perch="bookcase" role="tabpanel" aria-labelledby="tab-${S.libTab}"></div>
        <p id="shelf-status" class="sr-only" role="status"></p>
        <div id="book-detail">${bookDetail()}</div>
      </section>`;
  }
  function layoutShelf() {
    const host = $('bookcase');
    if (!host) return;
    const list = visibleBooks(), focused = document.activeElement?.dataset?.book;
    $('shelf-status').textContent = t(`${list.length} ספרים על המדף`, `${list.length} books on the shelf`);
    if (!list.length) {
      const empty = !S.search && (S.libTab === 'done' ? !books.done.length : !progressBooks().length);
      host.innerHTML = `<div class="shelf-empty"><div class="shelf-row"><div class="shelf-books"><span class="bookend" aria-hidden="true"></span></div><div class="plank" data-perch="plank-0"></div></div>
        <div class="empty-copy"><h3>${empty ? (S.libTab === 'done' ? t('המדף ריק. החתול כבר בדק פעמיים.', 'The shelf is empty. The cat checked twice.') : t('אין עבודות פתוחות. כולם בהפסקה.', 'No open work. Everyone is on a break.')) : t('לא מצאנו ספר כזה. גם לא מתחת לכרית.', 'No such book. Not even under the cushion.')}</h3>
        <p class="muted">${empty ? t('ספר שתרגומו יושלם יופיע כאן.', 'A book appears here once its translation finishes.') : t('נסו שם אחר או נקו את החיפוש.', 'Try another name or clear the search.')}</p>
        ${empty ? `<button type="button" class="btn" data-go="new">+ ${t('ספר חדש לתרגום', 'New book to translate')}</button>` : `<button type="button" class="btn secondary" data-act="clear-search">${t('ניקוי החיפוש', 'Clear search')}</button>`}</div></div>`;
      if (S.search) cat('search-empty');
      return;
    }
    if (S.libView === 'list') {
      host.innerHTML = `<ul class="book-list">${list.map(listRow).join('')}</ul>`;
      if (focused) host.querySelector(`[data-book="${CSS.escape(focused)}"]`)?.focus({ preventScroll: true });
      return;
    }
    const width = host.clientWidth - 36, rows = [[]];
    let used = 0;
    for (const b of list) {
      const w = b.w + 6;
      if (used + w > width && rows.at(-1).length) { rows.push([]); used = 0; }
      rows.at(-1).push(b); used += w;
    }
    host.dataset.rows = rows.length;
    // Large libraries open a few shelves at a time; search, sort and the list view do the rest.
    const shown = rows.slice(0, S.shelfLimit), shownCount = shown.flat().length;
    host.innerHTML = shown.map((row, i) => `<div class="shelf-row"><div class="shelf-books">${row.map(spine).join('')}${i === rows.length - 1 ? SHELF_DECO : ''}</div><div class="plank" data-perch="plank-${i}"></div></div>`).join('')
      + (rows.length > shown.length ? `<div class="shelf-more"><span>${t(`מוצגים ${shownCount} מתוך ${list.length} ספרים`, `Showing ${shownCount} of ${list.length} books`)}</span><button type="button" class="btn small gold" data-act="more-shelves">${t('עוד מדפים', 'More shelves')}</button><button type="button" class="link-btn light" data-view="list">${t('לתצוגת רשימה', 'Switch to list')}</button></div>` : '');
    if (focused) host.querySelector(`[data-book="${CSS.escape(focused)}"]`)?.focus({ preventScroll: true });
  }
  const SHELF_DECO = '<span class="shelf-deco" aria-hidden="true"><i class="deco-stack"><b></b><b></b><b></b></i><i class="deco-globe"></i><i class="deco-candle"></i><span class="cat-basket" data-perch="basket"><i></i></span><i class="deco-plant"></i></span>';
  function spine(b) {
    const pct = b.total ? Math.round(100 * b.done / b.total) : 0;
    const status = b.status ? statusName(b.status) : t('מוכן', 'Ready');
    const drive = S.account !== 'signedOut' && b.drive;
    const title = b.file.replace(/\.[^.]+$/, '');
    const label = `${b.file} · ${b.kind.toUpperCase()} · ${status}${b.status ? ` · ${pct}%` : ''}${b.blocker ? ' · ' + t('נדרשת החלטה', 'Decision required') : ''}${drive === 'cloud' ? ' · ' + t('ב־Drive בלבד', 'Drive only') : ''}`;
    const cover = Math.round(Math.min(132, b.h * .74));
    const meta = b.status ? `${statusName(b.status)} · ${pct}%` : `${b.units} ${t('מקטעים', 'segments')}`;
    // Hover or keyboard focus slides the book out and turns it to show the cover.
    return `<button type="button" class="spine${S.selected === b.id ? ' is-selected' : ''}${drive === 'cloud' ? ' is-cloud' : ''}" data-book="${esc(b.id)}" aria-expanded="${S.selected === b.id}" aria-controls="book-detail" aria-label="${esc(label)}" style="--c:${b.color};--h:${b.h}px;--w:${b.w}px;--cw:${cover}px">
      <span class="book3d" aria-hidden="true">
        <span class="face-spine"><span class="spine-band"></span><span class="spine-title" dir="auto">${esc(title)}</span><span class="spine-kind">${b.kind.toUpperCase()}</span>
          ${drive === 'synced' ? '<span class="spine-cloud"></span>' : ''}${b.status ? `<span class="spine-ribbon"></span>` : ''}${b.blocker || b.error ? `<span class="spine-flag">!</span>` : ''}</span>
        <span class="face-cover"><span class="cover-frame"><span class="cover-kind">${b.kind.toUpperCase()}</span><span class="cover-name" dir="auto">${esc(title)}</span>
          <span class="cover-meta">${esc(meta)}</span><span class="cover-date">${esc(b.date)}${drive === 'synced' ? ' · ☁' : drive === 'cloud' ? ' · ' + t('ב־Drive', 'in Drive') : ''}</span>
          ${b.status ? `<span class="cover-progress"><i style="width:${pct}%"></i></span>` : ''}${b.blocker ? `<span class="cover-flag">${t('נדרשת החלטה', 'Decision needed')}</span>` : ''}</span></span>
        <span class="face-top"></span>
      </span></button>`;
  }
  function listRow(b) {
    const pct = b.total ? Math.round(100 * b.done / b.total) : 0;
    const drive = S.account !== 'signedOut' && b.drive;
    return `<li><button type="button" class="list-book${S.selected === b.id ? ' is-selected' : ''}" data-book="${esc(b.id)}" aria-expanded="${S.selected === b.id}" aria-controls="book-detail" style="--c:${b.color}">
      <span class="list-swatch" aria-hidden="true"></span><span class="list-name" dir="auto">${esc(b.file)}</span>
      <span class="list-meta"><bdi>${b.kind.toUpperCase()}</bdi> · <bdi>${esc(b.date)}</bdi> · <bdi>${b.status ? `${statusName(b.status)} ${pct}%` : `${b.units} ${t('מקטעים', 'segments')}`}</bdi>${drive === 'synced' ? ' · ☁' : drive === 'cloud' ? ' · ' + t('ב־Drive בלבד', 'Drive only') : ''}${b.blocker ? ` · <b class="bad">${t('נדרשת החלטה', 'Decision required')}</b>` : ''}</span></button></li>`;
  }
  const statusName = s => ({ failed: t('נעצר', 'Stopped'), paused: t('מושהה', 'Paused'), interrupted: t('הופסק', 'Interrupted'), queued: t('ממתין', 'Queued'), reading: t('קורא', 'Reading'), translating: t('מתרגם כעת', 'Translating'), reviewing: t('בבדיקה', 'Reviewing'), rebuilding: t('בונה את הקובץ', 'Building the file'), completed: t('הושלם', 'Completed') }[s] || s);
  function findBook(id) { return [...books.done, ...books.drive, ...progressBooks()].find(b => b.id === id); }
  function bookDetail() {
    const b = S.selected && findBook(S.selected);
    if (!b) return `<p class="detail-hint">${t('בחרו ספר מהמדף. רמז: הספרים שהחתול ישב עליהם חמים יותר.', 'Pick a book from the shelf. Hint: the ones the cat sat on are warmer.')}</p>`;
    const inProgress = !!b.status, cloud = b.drive === 'cloud';
    const drive = S.account === 'signedOut' ? '' : b.drive === 'synced' ? t('מגובה ב־Google Drive', 'Backed up to Google Drive') : cloud ? t('שמור ב־Google Drive בלבד', 'Stored in Google Drive only') : t('במחשב בלבד', 'On this computer only');
    const fontField = b.kind === 'pdf' && !cloud && (!inProgress || b.formats.length) ? `<div class="field inline-field"><label for="detail-font">${t('גופן להורדה', 'Download font')}</label><select id="detail-font">${FONTS.map(([id, name]) => `<option value="${id}">${name}</option>`).join('')}</select></div>` : '';
    let meta, actions, notice = '';
    if (cloud) {
      meta = `${b.date} · ${b.units} ${t('מקטעים', 'segments')}`;
      actions = `<button type="button" class="btn" data-act="restore" data-id="${esc(b.id)}">${t('הורדה מ־Drive לספרייה', 'Restore from Drive')} ↓</button>`;
    } else if (!inProgress) {
      meta = `${t('הושלם', 'Completed')} ${b.date} · ${b.units} ${t('מקטעים', 'segments')}`;
      actions = `<button type="button" class="btn" data-act="download" data-id="${esc(b.id)}" data-format="${b.kind}">${t(`הורדת ${b.kind.toUpperCase()}`, `Download ${b.kind.toUpperCase()}`)} ↓</button>
        <button type="button" class="btn secondary" data-act="download" data-id="${esc(b.id)}" data-format="html">${t('הורדת HTML', 'Download HTML')} ↓</button>
        <button type="button" class="btn ghost" data-act="open-book" data-id="${esc(b.id)}">${t('פתיחה', 'Open')} ${arrow()}</button>
        <button type="button" class="btn ghost" data-act="to-learning" data-id="${esc(b.id)}">${t('העברה ללמידת שפה', 'Send to language learning')} ${arrow()}</button>`;
    } else {
      const pct = Math.round(100 * b.done / b.total);
      meta = `${statusName(b.status)} · ${t('פרק', 'Chapter')} ${b.chapter} ${t('מתוך', 'of')} ${b.chapters} · ${b.done} ${t('מתוך', 'of')} ${b.total} ${t('מקטעים', 'segments')} (${pct}%)`;
      if (b.blocker) notice = `<p class="notice warn"><b>${t('נדרשת החלטה:', 'Decision required:')}</b> ${t(...b.blocker)}</p>`;
      if (b.error) notice = `<p class="notice danger">${t(...b.error)}</p>`;
      actions = `<button type="button" class="btn" data-act="open-progress" data-id="${esc(b.id)}">${b.blocker ? t('פתיחה והחלטה', 'Open and decide') : t('פתיחה והמשך', 'Open and continue')} ${arrow()}</button>
        ${b.formats.length ? `<button type="button" class="btn secondary" data-act="download" data-id="${esc(b.id)}" data-format="${b.kind}" data-partial="1">${t(`הורדה חלקית ${b.kind.toUpperCase()}`, `Partial ${b.kind.toUpperCase()}`)} ↓</button><button type="button" class="btn secondary" data-act="download" data-id="${esc(b.id)}" data-format="html" data-partial="1">${t('HTML חלקי', 'Partial HTML')} ↓</button>` : ''}`;
    }
    const budget = inProgress && b.spent != null ? `<div class="meter" aria-label="${t('תקציב', 'Budget')}"><div class="meter-head"><span>${t('נוצלו', 'Spent')} <bdi>${money(b.spent, 2)}</bdi> ${t('מתוך', 'of')} <bdi>${money(b.budget)}</bdi></span><span class="muted small">${t('עצירה קשיחה בתקרה', 'Hard stop at the cap')}</span></div><div class="meter-bar"><i style="width:${Math.min(100, 100 * b.spent / b.budget)}%"></i></div></div>` : '';
    return `<article class="book-card" data-perch="detail" aria-labelledby="detail-title" style="--c:${b.color}">
      <div class="book-card-cover" aria-hidden="true">${badge(b.kind)}<span class="cover-title" dir="auto">${esc(b.file.replace(/\.[^.]+$/, ''))}</span></div>
      <div class="book-card-body"><div class="row between"><span class="eyebrow">${b.kind.toUpperCase()}${drive ? ` · ${drive}` : ''}</span><button type="button" class="icon-btn" data-act="close-detail" aria-label="${t('סגירת פרטי הספר', 'Close book details')}">✕</button></div>
        <h3 id="detail-title" dir="auto">${esc(b.file)}</h3><p class="muted">${meta}</p>${notice}${budget}${fontField}
        <div class="actions">${actions}</div>
        ${inProgress && b.formats.length ? `<p class="hint">${t('בהורדה חלקית, מה שעדיין לא תורגם נשאר בשפת המקור.', 'In a partial download, whatever is not translated yet stays in the source language.')}</p>` : ''}
        ${b.live ? '' : `<div class="danger-zone"><button type="button" class="link-btn danger" data-act="delete" data-id="${esc(b.id)}">${t('מחיקה לצמיתות', 'Delete permanently')}</button></div>`}
      </div></article>`;
  }

  // ---------- New translation ----------
  function newPage() {
    const f = S.form, est = estimate(), ready = readiness(), canStart = ready.every(i => i.ok);
    const toEn = f.target === 'en';
    return `<div class="page-head"><span class="eyebrow">PDF / EPUB · ${toEn ? t('לאנגלית', 'to English') : t('לעברית', 'to Hebrew')}</span><h1>${toEn ? t('המסמך שלכם, <em>באנגלית.</em>', 'Your document, <em>in English.</em>') : t('המסמך שלכם, <em>בעברית.</em>', 'Your document, <em>in Hebrew.</em>')}</h1>
      <p>${t('מעלים PDF או EPUB, בוחרים איך לתרגם, ומורידים אותו מתורגם באותו פורמט. אפשר לעבור עליו ולערוך — אם רוצים.', 'Upload a PDF or EPUB, choose how to translate, and download it translated in the same format. Review and edit it — if you like.')}</p></div>
      <div class="new-grid"><form id="translation-form" class="desk" data-perch="desk" novalidate>
        <input id="file-input" class="sr-only" type="file" accept=".pdf,.epub,application/pdf,application/epub+zip" tabindex="-1" aria-hidden="true">
        <div id="drop-zone" class="dropzone${f.file ? ' has-file' : ''}${f.fileError ? ' has-error' : ''}" data-perch="dropzone" role="button" tabindex="0" aria-describedby="drop-note" aria-label="${f.file ? t('החלפת הקובץ שנבחר', 'Replace the chosen file') : t('בחירת קובץ PDF או EPUB, או גרירתו לכאן', 'Choose a PDF or EPUB file, or drag it here')}">
          ${f.file ? `<div class="file-chosen">${badge(f.file.kind)}<div><strong dir="auto">${esc(f.file.name)}</strong><span class="muted small">${f.file.sample ? t('PDF דוגמה · ללא עלות', 'Sample PDF · free') : (f.file.size / 1048576).toFixed(2) + ' MB'} · ${t('השם והגודל בלבד; התוכן לא נקרא בהדגמה', 'name and size only; contents are not read in the demo')}</span></div><span class="change">${t('החלפה', 'Replace')}</span></div>`
          : `${DROP_ART}<h2>${t('בחרו קובץ או גררו אותו לכאן', 'Choose a file or drag it here')}</h2><span class="choose">${t('בחירת קובץ', 'Choose file')} ${arrow()}</span>`}
          <p id="drop-note" class="drop-note">${t('PDF עם טקסט מוטמע, PDF סרוק, או EPUB · עד <bdi style="white-space:nowrap">25 MB</bdi>', 'PDF with embedded text, scanned PDF, or EPUB · up to 25 MB')}</p></div>
        ${f.fileError ? `<p class="notice danger" role="alert">${f.fileError}</p>` : ''}
        <div class="below-drop">${f.file ? '' : `<button type="button" class="link-btn" data-act="sample">${t('נסו עם PDF דוגמה, ללא עלות', 'Try a sample PDF, free')}</button>`}${resumeLink()}</div>
        <details id="options" class="options" ${f.optionsOpen ? 'open' : ''}><summary data-k="options-summary"><span class="chips">${optionChips()}</span><span class="options-label">${t('אפשרויות', 'Options')}</span></summary>
          <div class="options-body">${optionsBody(est)}</div></details>
        ${canStart ? '' : `<div id="readiness" class="readiness"><p>${t('מה חסר כדי להתחיל:', 'Still needed before starting:')}</p><ul>${ready.map(i => `<li class="${i.ok ? 'ok' : ''}">${i.ok ? '✓' : '·'} ${i.ok ? i.text : i.act ? `<button type="button" class="link-btn" data-act="${i.act}">${i.text}</button>` : `<button type="button" class="link-btn" data-focus="${i.focus}">${i.text}</button>`}</li>`).join('')}</ul></div>`}
        <button id="translate-button" type="submit" class="btn big" ${canStart ? '' : 'disabled aria-describedby="readiness"'}>${toEn ? t('תרגום לאנגלית', 'Translate to English') : t('תרגום לעברית', 'Translate to Hebrew')} ${arrow()}</button>
        <p class="send-note">${own() ? t('מודל משלי: לחיצה על תרגום תבקש אישור לשליחה לספק המודל, עם האומדן והתקציב.', 'Your own model: pressing translate asks you to confirm sending to the model provider, with the estimate and budget.') : t('Auto: ללא עלות וללא תרגום אמיתי — תצוגת ניסיון לעברית.', 'Auto: no cost and no real translation — a Hebrew preview.')}</p>
      </form>${catalogCard(est)}</div>
      <p class="format-note">${t('מתרגמים את מבנה המסמך (פסקאות, כותרות). PDF נבנה מחדש ואינו משחזר עימוד מקורי; EPUB שומר את מבנה הפרקים והעיצוב שלו.', 'We translate the document structure (paragraphs, headings). A PDF is rebuilt and does not keep the original pagination; an EPUB keeps its chapters and styling.')}</p>`;
  }
  function resumeLink() {
    const j = S.job;
    if (!j || j.status === 'completed') return '';
    return `<button type="button" class="link-btn" data-go="job">${t('להמשיך את', 'Continue')} <bdi>${esc(j.filename)}</bdi> ${arrow()}</button>`;
  }
  function optionChips() {
    const f = S.form;
    const chips = [f.profile === 'scholarly' ? t('אקדמי', 'Scholarly') : t('ספרותי', 'Literary'), { fast: t('מהיר', 'Fast'), checked: t('נבדק', 'Checked'), thorough: t('מעמיק', 'Thorough') }[f.quality],
      own() ? model(f.roles.translator).name : 'Auto', f.target === 'he' ? t('עברית', 'Hebrew') : t('אנגלית', 'English')];
    if (own() && budgetValue() !== null) chips.push(money(budgetValue()));
    return chips.map(c => `<span class="chip"><bdi>${esc(c)}</bdi></span>`).join('');
  }
  function optionsBody(est) {
    const f = S.form, auto = !own(), terms = parseTerms(S.terms[f.target]);
    const group = (title, body, cls = '') => `<section class="opt-group ${cls}"><h3 class="opt-title">${title}</h3><div class="opt-grid">${body}</div></section>`;
    const how = seg('profile', t('פרופיל תרגום', 'Translation profile'), [
        { value: 'scholarly', label: t('אקדמי', 'Scholarly'), caption: t('מדויק; הערות ומינוח נשמרים', 'Precise; notes and terminology kept') },
        { value: 'literary', label: t('ספרותי', 'Literary'), caption: t('זורם, נאמן לסגנון', 'Flowing, faithful to style') }], f.profile)
      + seg('target', t('שפת היעד', 'Target language'), [
        { value: 'he', label: t('עברית', 'Hebrew') }, { value: 'en', label: 'English', disabled: auto }], f.target,
        { hint: auto ? t('תרגום לאנגלית זמין עם מודל משלכם. במצב Auto התצוגה היא לעברית.', 'Translating to English needs your own model. Auto previews in Hebrew.') : '' })
      + `<div class="field"><label for="source">${t('שפת המקור', 'Source language')}</label><select id="source">${[['auto', t('זיהוי אוטומטי', 'Detect automatically')], ['en', t('אנגלית', 'English')], ['fr', t('צרפתית', 'French')], ['ja', t('יפנית', 'Japanese')]].map(([v, l]) => `<option value="${v}" ${f.source === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`;
    let cost = `<div class="wide">${seg('model', t('מודל', 'Model'), [
        { value: 'auto', label: 'Auto', caption: t('תצוגת ניסיון (מדומה), ללא עלות וללא תרגום אמיתי', 'Preview (simulated), no cost, no real translation') },
        { value: 'configured', label: t('מודל משלי', 'My own model'), caption: t('מפתח API · תרגום אמיתי בתשלום לספק', 'API key · real translation, paid to the provider') }], f.model)}
      ${own() ? `<div class="sub-panel">${rolesBlock('form')}<p class="hint">${t('המפתחות נשמרים בזיכרון השרת המקומי לאורך ההרצה; ״לזכור במחשב הזה״ שומר אותם מוצפנים במנהל האישורים של Windows. לא בקובצי הפרויקט ולא בדפדפן.', 'Keys stay in the local server memory for this run; “remember on this computer” stores them encrypted in Windows Credential Manager. Never in project files or the browser.')} <button type="button" class="link-btn" data-act="keys-guide">${t('איך משיגים מפתח?', 'How do I get a key?')} ↗</button></p></div>` : ''}</div>`
      + `<div class="wide">${seg('quality', t('רמת בדיקה', 'Review level'), [
        { value: 'fast', label: t('מהיר', 'Fast'), caption: t('ללא בדיקה נוספת', 'No extra review') },
        { value: 'checked', label: t('נבדק', 'Checked'), caption: t('מקטעים בסיכון + פרקים', 'Risky segments + chapters'), disabled: auto },
        { value: 'thorough', label: t('מעמיק', 'Thorough'), caption: t('כל מקטע + פרקים', 'Every segment + chapters'), disabled: auto }], f.quality,
        { hint: auto ? t('נבדק ומעמיק דורשים מודל משלכם. Auto אינו שולח קריאות בדיקה.', 'Checked and Thorough need your own model. Auto sends no review calls.') : t('מהיר אינו שולח קריאות בדיקה נוספות. הבדיקות אינן אישור איכות; הטיוטה נשארת טיוטה.', 'Fast sends no extra review calls. Reviews are not a quality approval; the draft stays a draft.') })}</div>`;
    if (own()) {
      const b = budgetValue(), over = est && b !== null && est.high > b;
      cost += `<div class="field budget-field wide"><label for="budget">${t('תקציב מרבי למסמך ($)', 'Maximum budget per document ($)')}</label>
        <div class="budget-row"><div class="money-input"><span aria-hidden="true">$</span><input id="budget" type="number" required min="0.01" step="0.01" inputmode="decimal" dir="ltr" placeholder="${t('לדוגמה 5', 'e.g. 5')}" value="${esc(f.budget)}" aria-describedby="budget-help"></div><div class="quick" role="group" aria-label="${t('תקציב מהיר', 'Quick budget')}">${[2, 5, 10, 25].map(v => `<button type="button" class="chip-btn" data-budget="${v}" aria-pressed="${b === v}">$${v}</button>`).join('')}</div></div>
        <p id="budget-help" class="hint">${t('חובה במודל משלי: אין תקרה מובנית; המגבלה שלכם נאכפת כעצירה קשיחה.', 'Required for your own model: there is no built-in cap; your limit is enforced as a hard stop.')}</p></div>
        <div id="estimate" class="estimate wide${over ? ' over' : ''}">${estimateHtml(est, b)}</div>`;
    } else {
      cost += `<p class="free-line wide">${t('Auto: ללא עלות. אין צורך בתקציב או במפתח.', 'Auto: free. No budget or key needed.')}</p>`;
    }
    const epub = f.file?.kind === 'epub';
    const scan = `<div class="wide">${seg('ocr', t('ספרים סרוקים (OCR)', 'Scanned books (OCR)'), [
        { value: 'vision', label: t('זיהוי מקומי + בדיקת המודל', 'Local OCR + model check'), caption: t('מול תמונת העמוד', 'against the page image'), disabled: auto },
        { value: 'off', label: t('זיהוי מקומי בלבד', 'Local OCR only'), caption: t('ללא עלות', 'free') }], auto ? 'off' : f.ocr,
        { hint: t('עמודים בלי טקסט מוטמע מזוהים ב־Tesseract במחשב שלכם. בדיקת המודל משווה כל עמוד לתמונה שלו ומתקנת טעויות ונוסחאות.', 'Pages without embedded text are recognized with Tesseract on your computer. The model check compares each page to its image and fixes errors and formulas.') })}</div>`
      + `<div class="field"><label for="font-before">${t('גופן PDF (לפני תרגום)', 'PDF font (before translating)')}</label><select id="font-before" ${epub ? 'disabled aria-describedby="font-note"' : ''}>${FONTS.map(([id, name]) => `<option value="${id}" ${f.fontBefore === id ? 'selected' : ''}>${name}</option>`).join('')}</select><p id="font-note" class="hint">${epub ? t('קובץ EPUB שומר את העיצוב המקורי שלו; הגופן רלוונטי ל־PDF בלבד.', 'An EPUB keeps its own styling; the font applies to PDFs only.') : t('רלוונטי לקובצי PDF בלבד.', 'Applies to PDF files only.')}</p></div>`;
    const termsField = `<div class="field wide"><label for="terms">${t('מחייבים בכל תרגום', 'Binding in every translation')} · <span class="muted">${f.target === 'he' ? t('לעברית', 'to Hebrew') : t('לאנגלית', 'to English')}</span></label>
      <textarea id="terms" rows="4" dir="auto" spellcheck="false" placeholder="無尽蔵性 | inexhaustibility = אי-מיצוי" aria-describedby="terms-help terms-check">${esc(S.terms[f.target])}</textarea>
      <p id="terms-help" class="hint">${t('מונח בכל שורה: מקור = תרגום. צורות נוספות במקור מפרידים ב־|, והערה אחרי #. הרשימה נפרדת לכל שפת יעד, גוברת על בחירות המודל ונבדקת בתרגום.', 'One term per line: source = translation. Separate source variants with |, add a note after #. Kept per target language, overrides the model and is checked in the translation.')}</p>
      <div class="terms-row"><span id="terms-check" class="terms-check" role="status">${termsStatus(terms)}</span><button type="button" class="btn small secondary" data-act="save-terms">${t('שמירת המונחים', 'Save terms')}</button></div></div>`;
    return group(t('איך לתרגם', 'How to translate'), how)
      + group(t('מודל ועלות', 'Model and cost'), cost)
      + group(t('סריקה וגופן', 'Scans and font'), scan)
      + group(t('המונחים שלי', 'My terms'), termsField);
  }
  function termsStatus(terms) {
    const saved = S.termsSaved[S.form.target] ? t(' · נשמר', ' · saved') : t(' · לא נשמר', ' · not saved');
    return `<span class="${terms.errors.length ? 'bad' : 'good'}">${t(`${terms.ok} מונחים תקינים`, `${terms.ok} valid terms`)}${saved}</span>${terms.errors.length ? `<span class="bad">${terms.errors.slice(0, 2).join(' · ')}</span>` : ''}`;
  }
  function estimateHtml(est, budget) {
    if (!est) return `<span class="muted">${t('אומדן עלות יופיע אחרי בחירת קובץ.', 'A cost estimate appears after you choose a file.')}</span>`;
    const over = budget !== null && est.high > budget;
    return `<div class="estimate-head"><b>${t('אומדן עלות (לפני שליחה בפועל)', 'Cost estimate (before anything is sent)')}</b><span class="muted small">${t('מחירון מדומה בהדגמה', 'simulated price list in the demo')}</span></div>
      <p><bdi>${money(est.low)}–${money(est.high)}</bdi> · ${est.units} ${t('מקטעים', 'segments')} · ${est.chapters} ${t('פרקים', 'chapters')}</p>
      ${budget === null ? '' : over ? `<p class="bad">${t(`האומדן העליון חורג מהתקציב (${money(budget)}). אם התקציב ייגמר, העבודה תיעצר ותבקש החלטה.`, `The upper estimate exceeds the budget (${money(budget)}). If it runs out, the job stops and asks for a decision.`)}</p>` : `<p class="good">${t('בתוך התקציב.', 'Within budget.')} ${t(`בערך ${Math.max(1, Math.floor(est.mid / 1.5))} קופסאות טונה, לפי חשבון החתול.`, `About ${Math.max(1, Math.floor(est.mid / 1.5))} cans of tuna, by the cat’s reckoning.`)}</p>`}`;
  }
  function catalogCard(est) {
    const f = S.form, b = budgetValue();
    const line = (k, v) => `<div class="card-line"><span>${k}</span><strong dir="auto">${v}</strong></div>`;
    const roles = own() ? ['translator', 'semantic_reviewer', 'chapter_qa'].filter(r => r === 'translator' || f.quality !== 'fast')
      .map(r => line(t(...ROLE_NAMES[r]), esc(model(resolveRole(f.roles, r)).name))).join('') : line(t('מודל', 'Model'), t('Auto · תצוגת ניסיון', 'Auto · preview'));
    return `<aside id="catalog-card" class="catalog-card" data-perch="card" aria-label="${t('סיכום הבחירות', 'Summary of choices')}">
      <div class="card-holes" aria-hidden="true"><i></i><i></i></div><span class="eyebrow">${t('כרטיס קטלוג', 'Catalog card')}</span>
      <h2 dir="auto">${esc(f.file?.name || t('הספר הבא שלכם', 'Your next book'))}</h2>
      ${line(t('פרופיל', 'Profile'), f.profile === 'scholarly' ? t('אקדמי', 'Scholarly') : t('ספרותי', 'Literary'))}
      ${line(t('בדיקה', 'Review'), { fast: t('מהיר', 'Fast'), checked: t('נבדק', 'Checked'), thorough: t('מעמיק', 'Thorough') }[f.quality])}
      ${roles}
      ${line(t('תרגום אל', 'Into'), f.target === 'he' ? t('עברית', 'Hebrew') : t('אנגלית', 'English'))}
      ${own() ? line(t('תקציב', 'Budget'), b === null ? '—' : `<bdi>${money(b)}</bdi>`) + line(t('אומדן', 'Estimate'), est ? `<bdi>${money(est.low)}–${money(est.high)}</bdi>` : '—') : line(t('עלות', 'Cost'), t('ללא', 'None'))}
      <p class="card-foot">${t('נחתם בכף רגל.', 'Signed with a paw.')} <span aria-hidden="true">🐾</span></p></aside>`;
  }

  // ---------- Job ----------
  const STAGES = [['reading', t('קריאת המסמך', 'Reading')], ['translating', t('תרגום', 'Translating')], ['reviewing', t('בדיקה', 'Review')], ['rebuilding', t('בניית הקובץ', 'Building the file')]];
  function jobTitle(j) {
    if (j.status === 'paused') return j.blocker ? t('נדרשת החלטה שלכם.', 'Your decision is needed.') : t('מושהה. המילים יחכו.', 'Paused. The words will wait.');
    if (j.status === 'interrupted') return t('העבודה נעצרה.', 'The job stopped.');
    return { queued: t('בתור…', 'Queued…'), reading: t('קוראים את המסמך…', 'Reading the document…'), translating: t(`מתרגמים · פרק ${j.chapter} מתוך ${j.chapters}`, `Translating · chapter ${j.chapter} of ${j.chapters}`),
      reviewing: t('בודקים את הפרקים…', 'Reviewing chapters…'), rebuilding: t('בונים את הקובץ…', 'Building the file…'), completed: t('התרגום מוכן.', 'The translation is ready.') }[j.status];
  }
  const shownPct = j => (j.status === 'completed' ? 100 : Math.min(95, Math.floor(j.pct)));
  // The bindery: a book on a desk under a lamp. A leaf turns over the spine — source on its
  // front, translation on its back — so each turn reads as "a page goes through, comes out translated".
  function bindery(j) {
    const running = !['paused', 'interrupted', 'completed'].includes(j.status);
    const step = j.status === 'paused' || j.status === 'interrupted' ? j.lastStage : j.status;
    const lines = (n, cls) => `<div class="lines ${cls}">${Array.from({ length: n }, (_, i) => `<i style="--w:${[92, 84, 96, 70, 88, 94, 62, 90, 80][i % 9]}%"></i>`).join('')}</div>`;
    const stamp = `<span class="page-stamp">${t('טיוטה', 'DRAFT')}</span>`;
    // Letters rise out of the pages and change script mid-flight: mostly English into Hebrew, some back.
    const pairs = [['A', 'א'], ['B', 'ב'], ['G', 'ג'], ['D', 'ד'], ['H', 'ה'], ['L', 'ל'], ['M', 'מ'], ['N', 'נ'], ['S', 'ס'], ['T', 'ת'], ['R', 'ר'], ['K', 'כ']];
    const letters = Array.from({ length: 11 }, (_, i) => {
      const [en, he] = pairs[(i * 5) % pairs.length], toHe = i % 3 !== 2;
      const x = toHe ? 36 + (i * 37) % 130 : -(36 + (i * 53) % 130);
      const dx = toHe ? -(24 + (i * 17) % 80) : 24 + (i * 23) % 80;
      return `<span class="fl" style="--x:${x}px;--y:${(i * 29) % 60}px;--dx:${dx}px;--rise:${120 + (i * 13) % 70}px;--d:${-(i * .53).toFixed(2)}s;--dur:${(3.8 + (i % 4) * .45).toFixed(2)}s"><b class="from">${toHe ? en : he}</b><b class="to">${toHe ? he : en}</b></span>`;
    }).join('');
    const leaf = d => `<div class="leaf" style="--delay:${d}"><div class="face front">${lines(8, 'src')}</div><div class="face back">${lines(8, 'tgt')}${stamp}</div></div>`;
    // Props stand beside the book, never in the leaf's path; stage marks are printed on the pages.
    return `<div class="bindery" data-step="${step}" data-running="${running}" aria-hidden="true">
      <div class="bd-glow"></div><div class="bd-window"><i class="bd-moon"></i><i class="bd-star"></i><i class="bd-star two"></i><i class="bd-star three"></i></div>
      <div class="bd-lamp"><i class="bd-cord"></i><i class="bd-shade"></i><i class="bd-bulb"></i></div>
      <div class="bd-desk"></div><i class="bd-perch" data-perch="bindery"></i>
      <div class="bd-stage"><div class="tome">
        <div class="tome-cover"></div>
        <div class="tome-page left">${lines(8, 'tgt')}${stamp}<span class="folio">${j.chapter || 1}</span></div>
        <div class="tome-page right">${lines(8, 'src')}</div>
        ${leaf('0s')}${leaf('calc(var(--turn) / -2)')}
        <div class="tome-gutter"></div>
      </div></div>
      <div class="bd-letters">${letters}</div>
      <div class="bd-props"><div class="bd-glass"></div><div class="bd-stamper"><i></i></div><div class="bd-ink"></div>
        <div class="bd-quill"><svg viewBox="0 0 34 84"><path d="M30 2C14 14 6 36 9 62l3 8c2-22 9-44 18-68z" fill="#fffaf0" stroke="#cdbb92" stroke-width="1"/><path d="M30 2C20 22 14 44 11 70" fill="none" stroke="#9c7c4a" stroke-width="1.4"/><path d="M14 30l-5 2M16 22l-6 3M13 40l-5 1M12 50l-4 1" stroke="#e4d6b8" stroke-width="1"/><path d="M10 68l1 14 3-13z" fill="#2b1c10"/></svg></div>
        <div class="bd-candle"><i></i></div></div>
    </div>`;
  }
  function jobPage() {
    const j = S.job;
    if (!j) return `<div class="page-head"><h1>${t('אין עבודה פעילה.', 'No active job.')}</h1><p><button type="button" class="btn" data-go="new">${t('תרגום חדש', 'New translation')}</button></p></div>`;
    const stageIndex = STAGES.findIndex(([s]) => s === (j.lastStage || j.status));
    return `<section class="job" aria-labelledby="job-title">${bindery(j)}
      <div class="job-status"><span class="eyebrow">${j.target === 'en' ? t('המסמך בדרך לאנגלית', 'On its way to English') : t('המסמך בדרך לעברית', 'On its way to Hebrew')}${j.own ? '' : ' · Auto'}</span>
        <h1 id="job-title" tabindex="-1">${jobTitle(j)}</h1><p dir="auto" class="muted">${esc(j.filename)}</p><p id="job-pct" class="job-pct">${shownPct(j)}%</p></div>
      <progress id="job-progress" max="100" value="${shownPct(j)}" aria-label="${t('התקדמות התרגום', 'Translation progress')}"></progress>
      <ol class="stages">${STAGES.filter(([s]) => s !== 'reviewing' || j.quality !== 'fast').map(([s, label], i) => {
        const idx = STAGES.findIndex(([x]) => x === s);
        return `<li class="${idx < stageIndex || j.status === 'completed' ? 'done' : idx === stageIndex ? 'current' : ''}" data-stage="${s}">${label}</li>`; }).join('')}</ol>
      <p class="job-detail">${j.status === 'paused' && !j.blocker ? t('ההתקדמות נשמרה. ״המשך״ ממשיך בדיוק מאותה נקודה.', 'Progress is saved. “Continue” resumes from exactly this point.') : t('אפשר להשאיר את החלון פתוח או לחזור אליו בהמשך מהספרייה.', 'You can leave this window open or come back later from the library.')}</p>
      ${j.own ? `<div class="meter job-meter"><div class="meter-head"><span>${t('נוצלו', 'Spent')} <bdi id="job-spent">${money(j.spent, 4)}</bdi> ${t('מתוך', 'of')} <bdi>${money(j.budget)}</bdi></span><span class="muted small">${t('עצירה קשיחה בתקרה', 'Hard stop at the cap')}</span></div><div class="meter-bar"><i id="job-meter" style="width:${Math.min(100, 100 * j.spent / j.budget)}%"></i></div>
        <details class="mini-details"><summary>${t('שימוש לפי תפקיד', 'Usage by role')}</summary><p class="small muted" id="job-usage">${usageLine(j)}</p></details></div>` : `<p class="notice">${t('Auto: תצוגת ניסיון ללא עלות. הקובץ שייווצר מכיל טקסט דוגמה, לא תרגום אמיתי.', 'Auto: a free preview. The resulting file contains sample text, not a real translation.')}</p>`}
      ${j.blocker ? decisionBox(j) : ''}
      ${j.error ? `<div class="decision" role="region" aria-labelledby="err-title"><h2 id="err-title">${t('משהו נעצר בדרך', 'Something stopped on the way')}</h2><p>${t(...j.error)}</p><p class="hint">${t('ההתקדמות נשמרה. אפשר להמשיך, או להוריד בינתיים טיוטה חלקית מהספרייה.', 'Progress is saved. Continue, or meanwhile download a partial draft from the library.')}</p></div>` : ''}
      <div class="job-actions">${j.status === 'paused' && !j.blocker || j.status === 'interrupted' ? `<button type="button" class="btn" data-act="resume" id="resume-button">${t('המשך', 'Continue')}</button>` : !j.blocker ? `<button type="button" class="btn secondary" data-act="pause" id="pause-button">${t('השהיה', 'Pause')}</button>` : ''}
        <button type="button" class="btn ghost" data-go="library">${t('לספרייה', 'To the library')}</button>
        ${!j.own && !j.blocker ? `<button type="button" class="btn ghost" data-act="finish-now">${t('דילוג לתוצאה (הדגמה)', 'Skip to the result (demo)')}</button>` : ''}</div></section>`;
  }
  function usageLine(j) {
    const tokens = Math.round(j.total * 430 * j.pct / 100);
    return t(`מתרגם (${model(j.roles.translator).name}): ${tokens.toLocaleString('en-US')} טוקנים`, `Translator (${model(j.roles.translator).name}): ${tokens.toLocaleString('en-US')} tokens`) +
      (j.quality === 'fast' ? '' : t(` · בדיקה: ${Math.round(tokens * .4).toLocaleString('en-US')} טוקנים`, ` · Review: ${Math.round(tokens * .4).toLocaleString('en-US')} tokens`));
  }
  function decisionBox(j) {
    const raise = Math.ceil(j.budget + 2);
    return `<div class="decision" role="region" aria-labelledby="decision-title"><h2 id="decision-title">${t('נדרשת החלטה שלכם כדי להמשיך', 'Your decision is needed to continue')}</h2><p>${t(...j.blocker)}</p>
      <fieldset class="decision-options"><legend class="sr-only">${t('אפשרויות', 'Options')}</legend>
        <label class="decision-opt"><input type="radio" name="decision" value="raise" checked><span><b>${t(`להגדיל את התקציב ל־${money(raise)}`, `Raise the budget to ${money(raise)}`)}</b><small>${t('העבודה ממשיכה כרגיל', 'The job continues as planned')}</small></span></label>
        ${j.quality === 'fast' ? '' : `<label class="decision-opt"><input type="radio" name="decision" value="skip"><span><b>${t('להמשיך בלי בדיקת הפרקים', 'Continue without the chapter review')}</b><small>${t('זול יותר; הבדיקה הרוחבית תישאר זמינה בהמשך', 'Cheaper; cross-review stays available later')}</small></span></label>`}
        <label class="decision-opt"><input type="radio" name="decision" value="stop"><span><b>${t('לעצור ולשמור טיוטה חלקית', 'Stop and keep a partial draft')}</b><small>${t('אפשר להוריד חלקית מהספרייה ולהמשיך מתי שתרצו', 'Download partially from the library and continue whenever you like')}</small></span></label></fieldset>
      <button type="button" class="btn" data-act="decide">${t('אישור ההחלטה', 'Confirm decision')}</button>
      <p class="hint">${t('ההחלטה נרשמת ביומן העלויות. שום קריאה לספק לא נשלחת עד שהעבודה ממשיכה. (החתול נמנע מלהצביע.)', 'The decision is logged in the cost ledger. No provider call is sent until the job continues. (The cat abstains.)')}</p></div>`;
  }

  // ---------- Result ----------
  function resultPage() {
    const r = S.result;
    if (!r) return `<div class="page-head"><h1>${t('אין תוצאה פתוחה.', 'No result open.')}</h1></div>`;
    const stem = r.file.replace(/\.[^.]+$/, ''), outName = `${stem}.${r.target}.${r.kind}`;
    return `<section class="result" aria-labelledby="result-title">
      <div class="result-top"><div class="result-art">${resultBook(r.color)}<i class="sparkle a"></i><i class="sparkle b"></i><i class="sparkle c"></i></div>
        <div><span class="eyebrow">${t('התרגום שלכם', 'Your translation')}</span><h1 id="result-title" tabindex="-1"><span class="seal" aria-hidden="true">✓</span> ${t('התרגום מוכן.', 'The translation is ready.')}</h1><p dir="auto" class="muted">${esc(r.file)}</p></div></div>
      <div class="result-card" data-perch="result">
        <div class="result-file"><span class="file-glyph" aria-hidden="true">↓</span><div><strong dir="auto">${esc(outName)}</strong><span class="muted small">${r.kind.toUpperCase()} · ${r.units} ${t('מקטעים', 'segments')} · ${r.target === 'he' ? t('עברית', 'Hebrew') : t('אנגלית', 'English')}</span></div><span class="draft-badge">${t('טיוטה', 'Draft')}</span></div>
        ${r.auto ? `<p class="notice">${t('Auto: זו תצוגת ניסיון. הקובץ מכיל טקסט דוגמה ואינו תרגום של המסמך שלכם.', 'Auto: this is a preview. The file contains sample text and is not a translation of your document.')}</p>` : `<p class="notice warn">${t('2 טבלאות נשארו בשפת המקור (מבנה שלא נתמך). פרטים בהמשך.', '2 tables stayed in the source language (unsupported structure). Details below.')}</p>`}
        ${r.kind === 'pdf' ? `<div class="field inline-field"><label for="font-after">${t('גופן PDF (לאחר תרגום)', 'PDF font (after translating)')}</label><select id="font-after">${FONTS.map(([id, name]) => `<option value="${id}" ${S.fontAfter === id ? 'selected' : ''}>${name}</option>`).join('')}</select><p class="hint">${t('החלפת גופן בונה מחדש את ה־PDF בלבד; אינה שולחת קריאה למודל.', 'Changing the font only rebuilds the PDF; no model call is sent.')}</p></div>` : ''}
        <div class="result-actions"><button type="button" class="btn big" data-act="download" data-id="${esc(r.id)}" data-format="${r.kind}">${t('הורדת הקובץ המתורגם', 'Download the translated file')} ↓</button>
          <button type="button" class="btn secondary" data-act="review" aria-expanded="${S.review.open}" aria-controls="review-panel">${t('בדיקה ועריכה (לבחירתכם)', 'Review and edit (optional)')} ${arrow()}</button>
          ${r.cost ? `<span class="muted small">${t('עלות', 'Cost')}: <bdi>${money(r.cost, 4)}</bdi> ${t('מתוך', 'of')} <bdi>${money(r.budget)}</bdi></span>` : ''}</div>
        <details class="mini-details"><summary>${t('פרטים על הבדיקה והקובץ', 'Details about the review and the file')}</summary>
          <ul class="detail-list"><li>${t('מגבלה: PDF נבנה מחדש; העימוד המקורי לא נשמר.', 'Limitation: the PDF is rebuilt; original pagination is not kept.')}</li>
          <li>${t('ממצאים: 2 הערות עקביות מונחים, 0 שגיאות חסימה.', 'Findings: 2 terminology consistency notes, 0 blocking errors.')}</li>
          <li>${r.auto ? t('שימוש: אין — Auto.', 'Usage: none — Auto.') : t('שימוש: 92,140 טוקנים בתרגום, 31,880 בבדיקה.', 'Usage: 92,140 tokens translating, 31,880 reviewing.')}</li></ul></details>
      </div>
      ${S.review.open ? reviewPanel() : ''}
      ${r.auto ? '' : deepChecks()}
      <details class="notebook" ${S.result.notebookOpen ? 'open' : ''} data-k="notebook"><summary>${t('מחברת הספר (אופציונלי)', 'Book notebook (optional)')}</summary>
        <p class="hint">${t('המודל מתעד שמות, מונחים ובחירות תרגום לשמירה על עקביות. אין צורך לעשות דבר; אפשר להוריד לעיון.', 'The model records names, terms and translation choices to stay consistent. Nothing to do; download it if you are curious.')}</p>
        <button type="button" class="link-btn" data-act="download-notebook">${t('הורדת המחברת (Markdown)', 'Download the notebook (Markdown)')} ↓</button>
        <ul class="terms-list">${NOTEBOOK.map((n, i) => `<li><span dir="ltr">${esc(n.src)}</span> <span aria-hidden="true">=</span> <b dir="auto">${esc(n.tgt)}</b>${n.note ? ` <span class="muted small"># ${esc(n.note)}</span>` : ''}<button type="button" class="link-btn" data-act="fix-term" data-i="${i}">${t('תיקון', 'Fix')}</button></li>`).join('')}</ul></details>
      <div class="result-bottom"><button type="button" class="link-btn" data-act="another">${t('תרגום מסמך נוסף', 'Translate another document')}</button><p class="muted small">${t('טיוטה אוטומטית; אפשר להוריד מיד, ואפשר לבדוק קודם.', 'An automatic draft; download right away, or review first.')}</p></div></section>`;
  }
  function reviewPanel() {
    const i = S.review.unit, s = SEGMENTS[i], key = `${S.result.id}:${i}`;
    const value = S.review.drafts[key] ?? S.review.saved[key] ?? (S.result.target === 'en' ? s.src : s.tgt);
    const dirty = S.review.drafts[key] !== undefined && S.review.drafts[key] !== (S.review.saved[key] ?? s.tgt);
    return `<section id="review-panel" class="review" data-perch="review" aria-labelledby="review-title">
      <div class="review-bar"><div><h2 id="review-title" tabindex="-1">${t('מקור לצד תרגום', 'Source beside translation')}</h2><p class="muted small">${t(`פרק ${s.loc[0]} · מקטע ${s.loc[1]}`, `Chapter ${s.loc[0]} · segment ${s.loc[1]}`)}</p></div>
        <div class="row"><button type="button" class="btn small secondary" data-act="unit" data-d="-1" ${i === 0 ? 'disabled' : ''}>${t('הקודם', 'Previous')}</button>
          <select id="unit-select" aria-label="${t('בחירת מקטע לבדיקה', 'Choose a segment to review')}">${SEGMENTS.map((x, n) => `<option value="${n}" ${n === i ? 'selected' : ''}>${t(`פרק ${x.loc[0]} · מקטע ${x.loc[1]}`, `Ch. ${x.loc[0]} · seg. ${x.loc[1]}`)}${x.finding ? ' •' : ''}</option>`).join('')}</select>
          <button type="button" class="btn small secondary" data-act="unit" data-d="1" ${i === SEGMENTS.length - 1 ? 'disabled' : ''}>${t('הבא', 'Next')}</button>
          <button type="button" class="icon-btn" data-act="close-review" aria-label="${t('סגירת הבדיקה', 'Close review')}">✕</button></div></div>
      <div class="review-cols"><section><h3>${t('מקור', 'Source')}</h3><div class="source-copy" lang="en" dir="ltr" data-cat-avoid>${esc(s.src)}</div></section>
        <section><h3><label for="review-target">${t('תרגום · אפשר לערוך', 'Translation · editable')}</label></h3><textarea id="review-target" dir="${S.result.target === 'en' ? 'ltr' : 'rtl'}">${esc(value)}</textarea></section></div>
      ${s.finding ? `<p class="finding"><b>${t('ממצא בדיקה:', 'Review finding:')}</b> ${t(...s.finding)}</p>` : ''}
      <div class="review-actions"><button type="button" class="btn" data-act="save-edit">${t('שמירת שינויים', 'Save changes')}</button><span id="review-msg" role="status" class="small ${dirty ? 'bad' : 'muted'}">${dirty ? t('יש שינויים שלא נשמרו.', 'Unsaved changes.') : S.review.saved[key] !== undefined ? t('נשמר. הקובץ להורדה עודכן.', 'Saved. The download file is updated.') : t('השמירה מעדכנת את הקובץ להורדה.', 'Saving updates the download file.')}</span></div></section>`;
  }
  function deepChecks() {
    const card = (kind, title, text, note) => {
      const state = S.deep[kind];
      return `<div class="decision deep" role="region" aria-labelledby="${kind}-title"><h2 id="${kind}-title">${title}</h2><p>${text}</p>
        ${state === 'ready' ? `<p class="good" role="status">${t('הוכן. לחצו ״המשך״ כדי להריץ — רק אז נשלחות קריאות בתשלום.', 'Prepared. Press “Continue” to run it — only then are paid calls sent.')}</p><button type="button" class="btn" data-act="deep-run" data-kind="${kind}">${t('המשך', 'Continue')}</button>`
          : state === 'done' ? `<p class="good" role="status">${t('הושלם (הדגמה). הנוסח הקודם נשמר.', 'Done (demo). The previous wording is kept.')}</p>`
          : `<button type="button" class="btn secondary" data-act="deep-prepare" data-kind="${kind}">${kind === 'cross' ? t('להכין בדיקה רוחבית', 'Prepare a cross-review') : t('להכין את החלת התיקונים', 'Prepare the suggested fixes')}</button>`}
        <p class="hint">${note}</p></div>`;
    };
    return `<div class="deep-grid">${card('cross', t('בדיקה רוחבית של הספר', 'Cross-review of the book'), t('קודם נבנית טבלת שמות ומונחים מהמקור, ואז המקור והתרגום מושווים בחלונות של 8 פרקים עם פרק חופף. שמות, מונחים והפניות לא עקביים מתוקנים ונבדקים שוב.', 'First a table of names and terms is built from the source; then source and translation are compared in 8-chapter windows with one overlapping chapter. Inconsistent names, terms and references are fixed and re-checked.'), t('הרצה חוזרת שולחת מחדש רק טקסט שהשתנה.', 'A rerun only resends changed text.'))}
      ${card('suggestions', t('הצעות התיקון של הבדיקה', 'The review’s suggested fixes'), t('נמצאו 6 הצעות תיקון במקטעים שלא ערכתם.', '6 suggested fixes in segments you have not edited.'), t('הנוסח הקודם נשמר, ומקטעים שערכתם בעצמכם אינם משתנים.', 'The previous wording is kept, and segments you edited are never changed.'))}</div>`;
  }

  // ---------- Learning ----------
  function learningPage() {
    const L = S.learn, lang = LEARN_LANGS[L.lang], n = [2, 4, 6][L.effort];
    const book = books.done.find(b => b.id === L.book) || books.done[0];
    const word = i => i < n ? `<button type="button" class="gloss-word" data-gloss="${i}" lang="${L.lang}" dir="auto" aria-expanded="${L.gloss === i}">${esc(lang.words[i])}</button>` : HE_WORDS[i];
    const pre = (p, i) => (i < n ? `${p}־` : p);
    const read = L.read.has(`${L.lang}:${L.chapter}`);
    const keyOk = Object.values(S.keys).some(v => v !== 'missing');
    return `<div class="page-head"><span class="eyebrow">${t('למידת שפה · באפליקציה נפתח בחלון נפרד', 'Language learning · opens in its own window in the app')}</span><h1>${t('ללמוד מתוך <em>הסיפור.</em>', 'Learn from <em>the story.</em>')}</h1><p>${t('חלק קטן מהטקסט מוחלף בחומר חדש בשפה הנלמדת. לומדים מההקשר, ומבקשים פירוש בלחיצה.', 'A small part of the text is replaced with new material in the language you learn. Learn from context, ask for a gloss with a click.')}</p></div>
      <div class="learn-grid"><aside class="learn-side" data-perch="learn-side" aria-label="${t('בחירות למידה', 'Learning choices')}">
        <fieldset class="field"><legend>${t('השפה שלומדים', 'Language you are learning')}</legend><div class="lang-grid">${Object.entries(LEARN_LANGS).map(([code, l]) => `<label class="lang-opt"><input type="radio" name="learn-lang" value="${code}" ${L.lang === code ? 'checked' : ''}><span><b>${S.lang === 'en' ? l.native : l.he}</b><small lang="${code}" dir="auto">${l.native}</small></span></label>`).join('')}</div></fieldset>
        ${seg('effort', t('רמת מאמץ', 'Effort'), EFFORTS.map(([h, e, p], i) => ({ value: String(i), label: t(h, e), caption: t(`עד ${p}% חומר חדש`, `up to ${p}% new`) })), String(L.effort), { hint: t('האחוזים מגבילים חומר חדש; מילים שכבר פגשתם ממשיכות להצטבר.', 'The percentage limits new material; words you already met keep accumulating.') })}
        <fieldset class="field"><legend>${t('הספרים שלי', 'My books')}</legend>${books.done.length ? `<div class="book-picks">${books.done.slice(0, 4).map(b => `<label class="book-pick" style="--c:${b.color}"><input type="radio" name="learn-book" value="${b.id}" ${book?.id === b.id ? 'checked' : ''}><span dir="auto">${esc(b.file.replace(/\.[^.]+$/, ''))}</span></label>`).join('')}</div>` : `<p class="hint">${t('עדיין אין ספרים. העבירו תרגום מהספרייה או העלו EPUB בעברית.', 'No books yet. Send a translation from the library or upload a Hebrew EPUB.')}</p>`}
          <button type="button" class="link-btn" data-act="learn-upload">${t('+ העלאת EPUB בעברית', '+ Upload a Hebrew EPUB')}</button></fieldset>
        <p class="notice ${keyOk ? '' : 'warn'}">${keyOk ? t('שיעורים חדשים נוצרים בעזרת המודל ונשמרים להמשך.', 'New lessons are created with the model and kept for later.') : t('כדי להכין פרקים חדשים צריך מפתח (OpenAI או Anthropic). פרקים שכבר הוכנו זמינים גם בלי.', 'Preparing new chapters needs a key (OpenAI or Anthropic). Prepared chapters work without one.')} ${keyOk ? '' : `<button type="button" class="link-btn" data-act="keys">${t('מפתחות', 'Keys')}</button>`}</p>
      </aside>
      <div class="learn-main"><article class="reader" data-perch="reader" aria-labelledby="reader-title">
        <div class="reader-top"><div><span class="eyebrow">${t('פרק', 'Chapter')} ${L.chapter} · ${S.lang === 'en' ? lang.native : lang.he} · ${t(EFFORTS[L.effort][0], EFFORTS[L.effort][1])}</span><h2 id="reader-title" dir="auto">${esc(book ? book.file.replace(/\.[^.]+$/, '') : t('ספר לדוגמה', 'Sample book'))}</h2></div>
          <div class="row"><button type="button" class="btn small secondary" data-act="chapter" data-d="-1" ${L.chapter <= 1 ? 'disabled' : ''}>${t('הפרק הקודם', 'Previous chapter')}</button><button type="button" class="btn small secondary" data-act="chapter" data-d="1" ${L.chapter >= 12 ? 'disabled' : ''}>${t('הפרק הבא', 'Next chapter')}</button></div></div>
        <div class="reader-copy" data-cat-avoid><p>${pre('ב', 0)}${word(0)} חזרנו אל ${pre('ה', 1)}${word(1)} הישן. ${word(2)} דק עבר בין התריסים ונח על ${pre('ה', 3)}${word(3)} שהיה פתוח על השולחן. מאחורי ${pre('ה', 4)}${word(4)} השתרע ${word(5)} קטן, ובו עץ שטרם הכרנו.</p>
          <p>״אולי נישאר עוד רגע״, אמרה. לא היה לאן למהר. העברנו דף, והמילים נשמעו מוכרות מעט יותר. מבחוץ הגיעה רוח קלה, כמו התחלה של סיפור אחר.</p></div>
        ${L.gloss !== null && L.gloss < n ? `<div class="gloss" role="status"><bdi lang="${L.lang}">${esc(lang.words[L.gloss])}</bdi> — ${HE_WORDS[L.gloss]}<span class="muted small"> · ${t('פירוש בלחיצה', 'click gloss')}</span><button type="button" class="icon-btn" data-act="close-gloss" aria-label="${t('סגירת הפירוש', 'Close gloss')}">✕</button></div>` : ''}
        <details class="mini-details"><summary>${t('סיכום פרק', 'Chapter summary')}</summary><p class="hint">${t('המספרים חוזרים לבית ישן ומגלים גן שלא הכירו. (סיכום לדוגמה.)', 'The narrators return to an old house and find a garden they did not know. (Sample summary.)')}</p></details>
        <div class="reader-bottom"><button type="button" class="btn" data-act="read-chapter" ${read ? 'disabled' : ''}>${read ? t('✓ הפרק סומן כנקרא', '✓ Chapter marked as read') : t('קראתי', 'I read it')}</button><span class="muted small">${t('רק סימון זה שומר את הלמידה לספר הבא.', 'Only this mark carries the learning into the next book.')}</span></div></article>
        <section class="learn-progress" aria-labelledby="progress-title"><div class="row between"><h2 id="progress-title" tabindex="-1">${t('התקדמות ומילים', 'Progress and words')}</h2><span class="pill">${L.met + [...L.read].filter(k => k.startsWith(L.lang + ':')).length * n} ${t('מילים פגשתם', 'words met')}</span></div>
          <label class="search"><span class="sr-only">${t('חיפוש באוצר המילים', 'Search vocabulary')}</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="m15 15 5 5" stroke="currentColor" stroke-width="2"/></svg><input id="vocab-search" type="search" placeholder="${t('חיפוש באוצר המילים (זר או עברית)', 'Search vocabulary (foreign or Hebrew)')}" autocomplete="off"></label>
          <ul id="vocab" class="vocab">${vocabItems('')}</ul>
          <p class="hint">${t('השיעורים והפירושים נכתבו בעזרת המודל ולא עברו ביקורת לשונית נפרדת.', 'Lessons and glosses were written with the model and have not had a separate linguistic review.')}</p></section></div></div>`;
  }
  function vocabItems(q) {
    const lang = LEARN_LANGS[S.learn.lang];
    const items = lang.words.map((w, i) => [w, HE_WORDS[i]]).filter(([w, h]) => !q || w.toLowerCase().includes(q.toLowerCase()) || h.includes(q));
    return items.length ? items.map(([w, h]) => `<li><bdi lang="${S.learn.lang}">${esc(w)}</bdi><small>${h}</small></li>`).join('') : `<li class="muted">${t('לא נמצאה מילה כזאת.', 'No such word.')}</li>`;
  }

  // ---------- Dialogs and toasts ----------
  let returnFocus = null;
  function modal(title, bodyHtml, actionsHtml = '', cls = '') {
    returnFocus = document.activeElement;
    const dialog = $('modal');
    dialog.className = cls;
    dialog.innerHTML = `<div class="dialog-head"><h2 id="modal-title">${title}</h2><button type="button" class="icon-btn" data-act="close-modal" aria-label="${t('סגירה', 'Close')}">✕</button></div><div class="dialog-body">${bodyHtml}</div>${actionsHtml ? `<div class="dialog-actions">${actionsHtml}</div>` : ''}`;
    if (!dialog.open) dialog.showModal();
    (dialog.querySelector('[autofocus]') || dialog.querySelector('.dialog-body input, .dialog-body button, .dialog-actions button'))?.focus();
  }
  function closeModal() {
    const dialog = $('modal');
    if (dialog.open) dialog.close();
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  }
  function toast(text, action) {
    const box = document.createElement('div');
    box.className = 'toast';
    box.setAttribute('role', 'status');
    box.innerHTML = `<span>${text}</span>${action ? `<button type="button" class="link-btn light">${action.label}</button>` : ''}`;
    if (action) box.querySelector('button').onclick = () => { box.remove(); action.run(); };
    $('toasts').append(box);
    setTimeout(() => box.remove(), action ? 8000 : 4600);
  }
  function announce(text) { const n = $('announcer'); n.textContent = ''; requestAnimationFrame(() => { n.textContent = text; }); }
  function keyDialog(entering = false) {
    const rows = Object.entries(S.keys).map(([p, v]) => `<li data-state="${v}"><span class="key-dot" aria-hidden="true"></span><b>${PROVIDERS[p]}</b> <span>${keyLabel(v)}</span></li>`).join('');
    const anySaved = Object.values(S.keys).includes('saved');
    const form = entering ? `<div class="sub-panel key-sim"><p class="notice">${t('הדגמה: אין כאן שדה מפתח אמיתי. באפליקציה מזינים מפתח, והוא נשמר בזיכרון השרת המקומי.', 'Demo: there is no real key field here. In the app you paste a key and it stays in the local server memory.')}</p>
      <div class="field"><label for="sim-provider">${t('ספק', 'Provider')}</label><select id="sim-provider"><option value="openai">OpenAI (Luna, Sol)</option><option value="anthropic">Anthropic (Haiku, Sonnet, Opus)</option></select></div>
      <label class="check"><input type="checkbox" id="sim-remember"> ${t('לזכור במחשב הזה (מנהל האישורים של Windows)', 'Remember on this computer (Windows Credential Manager)')}</label>
      <button type="button" class="btn" data-act="sim-key">${t('לדמות שמירת מפתח', 'Simulate saving a key')}</button></div>` : '';
    modal(t('מפתח API', 'API key'), `<p>${Object.values(S.keys).every(v => v === 'missing') ? t('אין מפתח API. Auto עובד בלי מפתח; מודל משלכם צריך מפתח של הספק שלו.', 'No API key. Auto works without one; your own model needs its provider’s key.') : t('מפתח שמור אינו אישור שהחיבור תקין; החיבור נבדק בשליחה הראשונה.', 'A saved key is not proof the connection works; that is checked on the first send.')}</p>
      <ul class="key-list">${rows}</ul><p class="hint">${t('״זמין להרצה״ — בזיכרון עד סגירת התוכנית. ״שמור במחשב״ — מוצפן במנהל האישורים של Windows.', '“Available” — in memory until the app closes. “Saved” — encrypted in Windows Credential Manager.')}</p>
      <p><button type="button" class="link-btn" data-act="keys-guide">${t('איך משיגים מפתח?', 'How do I get a key?')} ↗</button></p>${form}`,
      `${entering ? '' : `<button type="button" class="btn" data-act="enter-key">${t('הזנה או החלפה של מפתח', 'Enter or replace a key')}</button>`}${anySaved ? `<button type="button" class="btn secondary" data-act="forget-keys">${t('מחיקת המפתחות השמורים מהמחשב', 'Delete saved keys from this computer')}</button>` : ''}`);
  }
  function modelDialog() {
    modal(t('מודל תרגום', 'Translation model'), `${seg('model-dlg', t('איך לתרגם?', 'How to translate?'), [
      { value: 'auto', label: 'Auto', caption: t('תצוגת ניסיון בלבד, ללא עלות וללא תרגום אמיתי', 'Preview only, no cost, no real translation') },
      { value: 'configured', label: t('מודל משלי', 'My own model'), caption: t('תרגום אמיתי, בתשלום לספק לפי השימוש', 'Real translation, paid to the provider by usage') }], S.form.model)}
      <div id="model-dlg-roles">${own() ? rolesBlock('dlg') : `<p class="hint">${t('Auto לא שולח דבר לשום ספק. זה המקום הבטוח להתנסות — גם לחתול.', 'Auto sends nothing to any provider. The safe place to experiment — for the cat too.')}</p>`}</div>`,
      `<button type="button" class="btn" data-act="close-modal">${t('סגירה', 'Close')}</button>`);
  }
  function refreshModelDialog() {
    const host = $('model-dlg-roles');
    if (host) host.innerHTML = own() ? rolesBlock('dlg') : `<p class="hint">${t('Auto לא שולח דבר לשום ספק.', 'Auto sends nothing to any provider.')}</p>`;
  }
  function prefsDialog() {
    modal(t('העדפות', 'Preferences'), `${seg('cat-mode', t('חתול הספרייה', 'The library cat'), [
      { value: 'roam', label: t('מסתובב', 'Roaming'), caption: t('קופץ בין המדפים, חושב מחשבות', 'Hops between shelves, thinks thoughts') },
      { value: 'nap', label: t('ישן בפינה', 'Napping'), caption: t('נשאר בתחתית הדף ונוחר בשקט', 'Stays at the bottom and snores quietly') },
      { value: 'away', label: t('בחופשה', 'On holiday'), caption: t('בלי חתול. הוא יתגעגע.', 'No cat. He will miss you.') }], S.prefs.cat)}
      <label class="check"><input type="checkbox" id="pref-sound" ${S.prefs.sound ? 'checked' : ''}> ${t('צלילי חתול (גרגור קטן), נוצרים כאן במחשב', 'Cat sounds (a small purr), synthesized on this computer')}</label>
      ${S.prefs.soundError ? `<p class="notice warn">${t('הצלילים אינם זמינים בדפדפן הזה. החתול ימשיך בשקט.', 'Sounds are unavailable in this browser. The cat carries on silently.')}</p>` : ''}
      <label class="check"><input type="checkbox" id="pref-art" ${S.prefs.art ? 'checked' : ''}> ${t('איורי פיקסל והנפשות של הספרייה', 'Pixel illustrations and library animations')}</label>
      <p class="hint">${t('אפשר גם ללטף את החתול (לחיצה או Enter) ולהרים אותו בגרירה. הוא לא נכנס אף פעם מעל כפתורים או טקסט לקריאה.', 'You can also pet the cat (click or Enter) and pick him up by dragging. He never sits on buttons or reading text.')}</p>`,
      `<button type="button" class="btn" data-act="close-modal">${t('סגירה', 'Close')}</button>`);
  }
  function demoDialog() {
    const group = (name, legend, options, value) => seg(name, legend, options.map(([v, l]) => ({ value: v, label: l })), value);
    modal(t('לוח הדגמה', 'Demo console'), `<p class="hint">${t('רק באב הטיפוס: מדמה מצבים של האפליקציה האמיתית. שום דבר לא נשמר או נשלח.', 'Prototype only: simulates states of the real app. Nothing is saved or sent.')}</p>
      ${group('demo-openai', 'OpenAI', [['missing', t('אין מפתח', 'No key')], ['available', t('זמין', 'Available')], ['saved', t('שמור', 'Saved')]], S.keys.openai)}
      ${group('demo-anthropic', 'Anthropic', [['missing', t('אין מפתח', 'No key')], ['available', t('זמין', 'Available')], ['saved', t('שמור', 'Saved')]], S.keys.anthropic)}
      ${group('demo-account', 'Google', [['signedOut', t('מנותק', 'Signed out')], ['signedIn', t('מחובר', 'Signed in')], ['syncing', t('מסנכרן', 'Syncing')], ['error', t('שגיאת סנכרון', 'Sync error')]], S.account)}
      ${group('demo-update', t('עדכון', 'Update'), [['none', t('אין', 'None')], ['available', t('זמין', 'Available')], ['ready', t('מוכן', 'Ready')]], S.update)}
      ${group('demo-next', t('העבודה הבאה', 'Next job'), [['smooth', t('חלקה', 'Smooth')], ['decision', t('תדרוש החלטה', 'Needs a decision')], ['error', t('תיעצר בשגיאה', 'Stops with an error')]], S.demo.next)}
      ${group('demo-library', t('הספרייה', 'Library'), [['sample', t('ספרים לדוגמה', 'Sample books')], ['big', t('גדולה (120 ספרים)', 'Large (120 books)')], ['empty', t('ריקה', 'Empty')]], S.demo.library)}
      ${group('demo-speed', t('מהירות', 'Speed'), [['1', t('רגילה', 'Normal')], ['4', '×4']], String(S.demo.speed))}`,
      `<button type="button" class="btn" data-act="close-modal">${t('סגירה', 'Close')}</button>`, 'wide');
  }
  function helpDialog() {
    modal(t('ברוכים הבאים לספרייה', 'Welcome to the library'), `<ol class="help-steps"><li>${t('<b>תרגום חדש:</b> בוחרים PDF או EPUB (עד 25 MB). בלי לגעת באפשרויות מקבלים תצוגת Auto חינמית.', '<b>New translation:</b> choose a PDF or EPUB (up to 25 MB). Without touching options you get a free Auto preview.')}</li>
      <li>${t('<b>מודל משלי:</b> בוחרים מודל לכל תפקיד, מזינים מפתח ותקציב. לפני שליחה מוצג אומדן ונדרש אישור.', '<b>Your own model:</b> choose a model per role, add a key and a budget. An estimate and a confirmation come before anything is sent.')}</li>
      <li>${t('<b>במהלך העבודה:</b> אפשר להשהות, לחזור מהספרייה, ולהחליט כשהתקציב לא מספיק.', '<b>While it runs:</b> pause, come back from the library, and decide when the budget is not enough.')}</li>
      <li>${t('<b>התוצאה:</b> טיוטה להורדה מיד, עם בדיקה ועריכה לבחירתכם.', '<b>The result:</b> a draft you can download right away, with optional review and editing.')}</li></ol>
      <p class="hint">${t('מקלדת: Tab לניווט, חצים בין אפשרויות, Escape לסגירת חלונות, ״/״ לחיפוש בספרייה.', 'Keyboard: Tab to move, arrows between options, Escape closes dialogs, “/” searches the library.')}</p>
      <p class="notice">${t('על החתול: לחיצה מלטפת, גרירה מרימה, ובהעדפות אפשר לשלוח אותו לישון. הוא לא נוגע בקבצים. רק בלב.', 'About the cat: click to pet, drag to lift, and send him to nap in Preferences. He never touches your files. Only your heart.')}</p>`,
      `<button type="button" class="btn" data-act="close-modal">${t('הבנתי', 'Got it')}</button>`);
  }
  function keysGuideDialog() {
    modal(t('איך משיגים מפתח?', 'How do I get a key?'), `<ol class="help-steps"><li>${t('נכנסים לחשבון אצל הספק (OpenAI או Anthropic) ויוצרים מפתח API.', 'Sign in at the provider (OpenAI or Anthropic) and create an API key.')}</li><li>${t('מגדירים מגבלת הוצאה בחשבון הספק — התקציב כאן הוא אומדן מקומי, לא מגבלת חיוב.', 'Set a spending limit at the provider — the budget here is a local estimate, not a billing limit.')}</li><li>${t('מדביקים את המפתח בחלון ״מפתח API״ באפליקציה.', 'Paste the key in the app’s “API key” window.')}</li></ol><p class="notice">${t('באפליקציה זה עמוד מדריך מלא שנפתח בלשונית חדשה.', 'In the app this is a full guide that opens in a new tab.')}</p>`,
      `<button type="button" class="btn" data-act="close-modal">${t('סגירה', 'Close')}</button>`);
  }
  function confirmDelete(b) {
    const spent = b.spent ? t(` העבודה שכבר שולמה (${money(b.spent, 4)}) תאבד.`, ` The work already paid for (${money(b.spent, 4)}) will be lost.`) : '';
    modal(t('מחיקה לצמיתות', 'Delete permanently'), `<p class="delete-title" dir="auto">${esc(b.file)}</p><p>${t('יימחקו התרגום, ההעתק של קובץ המקור, מחברת הספר ויומן העלויות שלו.', 'The translation, the copy of the source file, the book notebook and its cost log will be deleted.')}${spent}</p><p class="notice danger">${t('אי אפשר לבטל את המחיקה.', 'This cannot be undone.')}</p>`,
      `<button type="button" class="btn secondary" data-act="close-modal" autofocus>${t('להשאיר בספרייה', 'Keep it')}</button><button type="button" class="btn danger" data-act="confirm-delete" data-id="${esc(b.id)}">${t('מחיקה לצמיתות', 'Delete permanently')}</button>`);
  }
  function consentDialog() {
    const f = S.form, est = estimate(), b = budgetValue();
    const roles = ['translator', ...(f.quality === 'fast' ? [] : ['semantic_reviewer', 'chapter_qa'])]
      .map(r => { const m = model(resolveRole(f.roles, r)); return `<li>${t(...ROLE_NAMES[r])}: <b>${m.name}</b> <span class="muted">(${PROVIDERS[m.provider]})</span></li>`; }).join('');
    modal(t('אישור שליחה לספקים', 'Confirm sending to providers'), `<p dir="auto"><b>${esc(f.file.name)}</b></p><ul class="consent-list">${roles}</ul>
      <div class="consent-sum"><span>${t('תקציב למסמך', 'Budget per document')}: <bdi>${money(b)}</bdi></span><span>${t('אומדן', 'Estimate')}: <bdi>${money(est.low)}–${money(est.high)}</bdi></span></div>
      <p>${t('התרגום והבדיקות משתמשים באותו תקציב למסמך. זו מגבלת אומדן מקומית לפי המחירון, ולא מגבלת חיוב בחשבון הספק.', 'Translation and reviews share one budget per document. It is a local estimate limit from the price list, not a billing limit at the provider.')}</p>
      <p class="notice">${t('בהדגמה לא נשלח דבר. החתול מאשר שהוא לא קרא את הקובץ.', 'Nothing is sent in the demo. The cat confirms he did not read the file.')}</p>`,
      `<button type="button" class="btn" data-act="start-job">${t('אישור והתחלת תרגום', 'Confirm and start')}</button><button type="button" class="btn secondary" data-act="close-modal">${t('ביטול', 'Cancel')}</button>`);
  }

  // ---------- Actions ----------
  function go(route) {
    if (S.route === route) return;
    S.route = route;
    S.accountMenu = false;
    render({ focusMain: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
    cat('route');
  }
  function chooseFile(file) {
    const f = S.form;
    if (!file) return;
    const kind = /\.epub$/i.test(file.name) ? 'epub' : /\.pdf$/i.test(file.name) ? 'pdf' : null;
    if (!kind || file.size === 0 || file.size > 25 * 1048576) {
      f.fileError = !kind ? t('אפשר לבחור רק קובץ PDF או EPUB.', 'Only PDF or EPUB files can be chosen.') : file.size === 0 ? t('הקובץ ריק.', 'The file is empty.') : t('הקובץ גדול מ־25 MB.', 'The file is larger than 25 MB.');
      render(); announce(f.fileError); cat('file-error'); return;
    }
    f.file = { name: file.name, size: file.size, kind, sample: !!file.sample };
    f.fileError = '';
    render();
    $('translate-button')?.disabled ? $('drop-zone')?.focus() : $('translate-button')?.focus();
    announce(t(`נבחר ${file.name}. תוכן הקובץ אינו נקרא בהדגמה.`, `${file.name} chosen. Its contents are not read in the demo.`));
    cat(file.sample ? 'sample' : 'file-selected', { perch: 'dropzone' });
  }
  function useSample() {
    if (S.route !== 'new') { S.route = 'new'; window.scrollTo({ top: 0, behavior: 'instant' }); }
    chooseFile({ name: 'On Time and Memory — sample.pdf', size: 812345, sample: true });
  }
  function submit() {
    if (!readiness().every(i => i.ok)) return;
    if (own()) consentDialog(); else startJob();
  }
  function startJob() {
    closeModal();
    const f = S.form, est = estimate();
    clearInterval(timer);
    S.job = { id: 'job-' + Date.now(), filename: f.file.name, kind: f.file.kind, own: own(), budget: own() ? budgetValue() : null, spent: 0, est: est?.mid || 0,
      quality: f.quality, target: f.target, roles: { ...f.roles }, status: 'queued', lastStage: 'reading', pct: 0, total: unitsFor(f.file),
      chapters: Math.max(1, Math.round(unitsFor(f.file) / 28)), chapter: 0, done: 0, scenario: S.demo.next, blocker: null, error: null, color: COLORS[Math.floor(Math.random() * COLORS.length)] };
    S.route = 'job';
    render({ focusMain: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
    cat('job-start', { perch: 'bindery' });
    runTimer();
  }
  let timer = 0;
  function runTimer() { clearInterval(timer); timer = setInterval(tick, 260); }
  function tick() {
    const j = S.job;
    if (!j || ['paused', 'interrupted', 'completed'].includes(j.status)) return;
    j.pct = Math.min(100, j.pct + (j.status === 'queued' ? 1.4 : .55) * S.demo.speed);
    const prev = j.status;
    j.status = j.pct < 3 ? 'queued' : j.pct < 12 ? 'reading' : j.pct < (j.quality === 'fast' ? 88 : 70) ? 'translating' : j.pct < 88 ? 'reviewing' : j.pct < 100 ? 'rebuilding' : 'completed';
    if (j.status !== 'queued' && j.status !== 'completed') j.lastStage = j.status;
    j.done = Math.round(j.total * Math.min(1, j.pct / 85));
    j.chapter = Math.max(1, Math.min(j.chapters, Math.ceil(j.chapters * Math.min(1, j.pct / 85))));
    if (j.own) j.spent = Math.min(j.budget, j.est * j.pct / 100);
    if (j.scenario === 'decision' && j.pct >= 74 && !j.decided) {
      j.status = 'paused'; j.decided = true;
      const left = Math.max(.05, j.budget - j.spent), need = money(left * 1.4 + .3);
      j.blocker = j.quality === 'fast'
        ? [`התקציב שנותר (${money(left)}) לא יספיק להשלמת התרגום (אומדן ${need}).`, `The remaining budget (${money(left)}) will not finish the translation (estimate ${need}).`]
        : [`התקציב שנותר (${money(left)}) לא יספיק לבדיקת הפרקים (אומדן ${need}).`, `The remaining budget (${money(left)}) will not cover the chapter review (estimate ${need}).`];
      afterStatusChange(); cat('job-decision', { perch: 'bindery' }); return;
    }
    if (j.scenario === 'error' && j.pct >= 36 && !j.errored) {
      j.status = 'interrupted'; j.errored = true;
      j.error = ['החיבור לספק נקטע. אפשר להמשיך מאותה נקודה; שום מקטע שהושלם לא יישלח שוב.', 'The provider connection dropped. You can continue from the same point; no finished segment is sent again.'];
      afterStatusChange(); cat('job-error', { perch: 'bindery' }); return;
    }
    if (j.status === 'completed') return finishJob();
    if (prev !== j.status) afterStatusChange(); else updateJobView();
  }
  function afterStatusChange() { if (S.route === 'job') render(); }
  function updateJobView() {
    const j = S.job;
    if (S.route !== 'job' || !$('job-progress')) return;
    $('job-progress').value = shownPct(j);
    $('job-pct').textContent = shownPct(j) + '%';
    $('job-title').textContent = jobTitle(j);
    if ($('job-spent')) { $('job-spent').textContent = money(j.spent, 4); $('job-meter').style.width = Math.min(100, 100 * j.spent / j.budget) + '%'; $('job-usage').textContent = usageLine(j); }
  }
  function finishJob() {
    const j = S.job;
    clearInterval(timer);
    j.status = 'completed'; j.pct = 100;
    const book = { id: j.id, file: j.filename, kind: j.kind, date: today(), units: j.total, drive: S.account === 'signedOut' ? 'local' : 'synced', color: j.color, h: 140 + Math.round(Math.random() * 24), w: 34 + Math.round(Math.random() * 16) };
    books.done.unshift(book);
    books.progress = books.progress.filter(b => b.id !== j.id);
    S.result = { ...book, target: j.target, auto: !j.own, cost: j.own ? j.spent : null, budget: j.budget };
    S.review = { open: false, unit: 0, drafts: {}, saved: {} };
    S.deep = { cross: 'idle', suggestions: 'idle' };
    if (S.route === 'job') {
      S.route = 'result';
      render({ focusMain: true });
      $('result-title')?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
      cat('job-done', { perch: 'result' });
    } else {
      if (S.route === 'library') render();
      toast(t(`התרגום של ״${esc(j.filename)}״ מוכן.`, `“${esc(j.filename)}” is translated.`), { label: t('לפתוח', 'Open'), run: () => { S.route = 'result'; render({ focusMain: true }); } });
    }
  }
  function openProgress(id) {
    if (S.job?.id === id) { go('job'); return; }
    const b = books.progress.find(x => x.id === id);
    if (!b) return;
    clearInterval(timer);
    const pct = Math.round(85 * b.done / b.total);
    S.job = { id: b.id, filename: b.file, kind: b.kind, own: true, budget: b.budget, spent: b.spent, est: b.spent / Math.max(.05, pct / 100), quality: 'checked', target: 'he',
      roles: { ...S.form.roles }, status: b.status, lastStage: pct < 70 ? 'translating' : 'reviewing', pct, total: b.total, chapters: b.chapters, chapter: b.chapter, done: b.done,
      scenario: 'smooth', decided: true, errored: true, blocker: b.blocker || null, error: b.error || null, color: b.color };
    books.progress = books.progress.filter(x => x.id !== id);
    S.route = 'job';
    render({ focusMain: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
    runTimer();
  }
  function openDone(id) {
    const b = books.done.find(x => x.id === id);
    if (!b) return;
    S.result = { ...b, target: 'he', auto: false, cost: null };
    S.review = { open: false, unit: 0, drafts: {}, saved: {} };
    go('result');
  }
  function download(id, format, partial) {
    const b = findBook(id) || S.result;
    const stem = b.file.replace(/\.[^.]+$/, '');
    const name = `${stem}${partial ? '.partial' : ''}.${S.result?.id === id ? S.result.target : 'he'}.${format === 'html' ? 'html' : 'txt'}`;
    const edits = SEGMENTS.map((s, i) => S.review.saved[`${id}:${i}`] ?? s.tgt);
    const note = 'דוגמת ממשק בלבד — טקסט מקורי לדוגמה, לא תרגום של קובץ משתמש. טיוטה לא מאושרת. / Interface sample only — not a translation of a user file. Unapproved draft.';
    const content = format === 'html' ? `<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><title>${esc(stem)}</title><body style="font:18px/1.9 Georgia,serif;max-width:760px;margin:40px auto;padding:0 20px"><h1>${esc(stem)}</h1><p><small>${note}</small></p>${edits.map(e => `<p>${esc(e)}</p>`).join('')}</body></html>`
      : `${note}\n\n${edits.join('\n\n')}`;
    const url = URL.createObjectURL(new Blob([content], { type: format === 'html' ? 'text/html;charset=utf-8' : 'text/plain;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    toast(t(`ההורדה התחילה: ${esc(name)} (קובץ דוגמה)`, `Download started: ${esc(name)} (sample file)`));
    cat('download');
  }

  // ---------- Events ----------
  document.addEventListener('click', event => {
    const target = event.target.closest('[data-go],[data-act],[data-tab],[data-view],[data-book],[data-budget],[data-gloss],[data-focus]');
    if (S.accountMenu && !event.target.closest('.account')) { S.accountMenu = false; document.querySelector('#account-menu')?.setAttribute('hidden', ''); document.querySelector('[data-act="account"]')?.setAttribute('aria-expanded', 'false'); }
    if (!target || target.disabled) return;
    if (target.dataset.go) { event.preventDefault(); go(target.dataset.go); return; }
    if (target.dataset.tab) { S.libTab = target.dataset.tab; S.selected = null; S.shelfLimit = 3; render(); $(`tab-${S.libTab}`)?.focus(); return; }
    if (target.dataset.view) { S.libView = target.dataset.view; S.shelfLimit = 3; render(); document.querySelector(`[data-view="${S.libView}"]`)?.focus(); return; }
    if (target.dataset.book) {
      S.selected = S.selected === target.dataset.book ? null : target.dataset.book;
      $('book-detail').innerHTML = bookDetail();
      document.querySelectorAll('[data-book]').forEach(s => { const on = s.dataset.book === S.selected; s.classList.toggle('is-selected', on); s.setAttribute('aria-expanded', on); });
      if (S.selected) document.getElementById('book-detail').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      window.libraryCat?.refresh();
      return;
    }
    if (target.dataset.budget) { S.form.budget = target.dataset.budget; render(); cat('budget', { amount: Number(target.dataset.budget) }); return; }
    if (target.dataset.gloss !== undefined) { const i = Number(target.dataset.gloss); S.learn.gloss = S.learn.gloss === i ? null : i; render(); return; }
    if (target.dataset.focus) { S.form.optionsOpen = S.form.optionsOpen || target.dataset.focus === 'budget'; render(); $(target.dataset.focus)?.focus(); return; }
    const id = target.dataset.id;
    switch (target.dataset.act) {
      case 'close-modal': closeModal(); break;
      case 'start-job': startJob(); break;
      case 'keys': keyDialog(); break;
      case 'enter-key': keyDialog(true); break;
      case 'keys-guide': keysGuideDialog(); break;
      case 'sim-key': {
        const p = $('sim-provider').value;
        S.keys[p] = $('sim-remember').checked ? 'saved' : 'available';
        render(); keyDialog(); announce(t(`${PROVIDERS[p]}: ${keyLabel(S.keys[p])}. הדגמה בלבד.`, `${PROVIDERS[p]}: ${keyLabel(S.keys[p])}. Demo only.`)); break;
      }
      case 'forget-keys': Object.keys(S.keys).forEach(p => { if (S.keys[p] === 'saved') S.keys[p] = 'missing'; }); render(); keyDialog(); break;
      case 'models': modelDialog(); break;
      case 'prefs': prefsDialog(); break;
      case 'demo': demoDialog(); break;
      case 'help': helpDialog(); break;
      case 'lang': S.lang = S.lang === 'en' ? 'he' : 'en'; render(); cat(S.lang === 'en' ? 'lang-en' : 'lang-he'); break;
      case 'sign-in': S.account = 'syncing'; render(); setTimeout(() => { if (S.account === 'syncing') { S.account = 'signedIn'; render(); toast(t('מחובר ל־Google. הספרייה גובתה ל־Drive.', 'Signed in to Google. The library is backed up to Drive.')); } }, 1400); break;
      case 'account': S.accountMenu = !S.accountMenu; render(); break;
      case 'sync-now': S.account = 'syncing'; render(); setTimeout(() => { S.account = 'signedIn'; render(); }, 1200); break;
      case 'sign-out': S.account = 'signedOut'; S.accountMenu = false; render(); break;
      case 'close-update': S.update = 'none'; render(); break;
      case 'sample': useSample(); break;
      case 'more-shelves': {
        S.shelfLimit += 3; const before = document.querySelectorAll('.spine').length; layoutShelf();
        document.querySelectorAll('.spine')[before]?.focus({ preventScroll: true }); window.libraryCat?.refresh(); break;
      }
      case 'clear-search': S.search = ''; render(); $('search')?.focus(); break;
      case 'close-detail': { const sel = S.selected; S.selected = null; $('book-detail').innerHTML = bookDetail(); document.querySelector(`[data-book="${CSS.escape(sel)}"]`)?.focus(); document.querySelectorAll('.spine').forEach(s => { s.classList.remove('is-selected'); s.setAttribute('aria-expanded', 'false'); }); break; }
      case 'download': download(id, target.dataset.format, !!target.dataset.partial); break;
      case 'open-book': openDone(id); break;
      case 'open-progress': openProgress(id); break;
      case 'to-learning': S.learn.book = id; go('learning'); break;
      case 'restore': { const b = books.drive.find(x => x.id === id); books.drive = books.drive.filter(x => x.id !== id); books.done.unshift({ ...b, drive: 'synced' }); render(); toast(t('הספר הורד מ־Drive לספרייה.', 'The book was restored from Drive.')); break; }
      case 'delete': confirmDelete(findBook(id)); break;
      case 'confirm-delete': {
        const b = findBook(id);
        books.done = books.done.filter(x => x.id !== id); books.progress = books.progress.filter(x => x.id !== id); books.drive = books.drive.filter(x => x.id !== id);
        closeModal(); S.selected = null; render();
        document.querySelector('.spine')?.focus();
        toast(t(`״${esc(b.file)}״ נמחק לצמיתות.`, `“${esc(b.file)}” was deleted permanently.`)); cat('delete'); break;
      }
      case 'pause': S.job.status = 'paused'; render(); $('resume-button')?.focus(); announce(t('העבודה הושהתה.', 'The job is paused.')); cat('job-paused', { perch: 'bindery' }); break;
      case 'resume': S.job.status = S.job.lastStage; S.job.error = null; render(); $('pause-button')?.focus(); runTimer(); announce(t('העבודה ממשיכה.', 'The job continues.')); break;
      case 'finish-now': S.job.pct = 99.9; tick(); break;
      case 'decide': {
        const choice = document.querySelector('input[name="decision"]:checked')?.value, j = S.job;
        j.blocker = null;
        if (choice === 'raise') { j.budget = Math.ceil(j.budget + 2); j.status = j.lastStage; render(); runTimer(); toast(t(`התקציב הוגדל ל־${money(j.budget)}. ממשיכים.`, `Budget raised to ${money(j.budget)}. Continuing.`)); }
        else if (choice === 'skip') { j.quality = 'fast'; j.status = 'rebuilding'; j.pct = Math.max(j.pct, 88); render(); runTimer(); }
        else { j.status = 'paused'; books.progress.unshift({ ...jobAsBook(), live: false, status: 'paused', formats: [j.kind, 'html'] }); S.job = null; clearInterval(timer); S.libTab = 'progress'; go('library'); toast(t('נעצר. הטיוטה החלקית ממתינה בספרייה.', 'Stopped. The partial draft waits in the library.')); }
        break;
      }
      case 'review': S.review.open = !S.review.open; render(); if (S.review.open) { $('review-title')?.focus(); $('review-panel')?.scrollIntoView({ block: 'start', behavior: 'smooth' }); } break;
      case 'close-review': S.review.open = false; render(); document.querySelector('[data-act="review"]')?.focus(); break;
      case 'unit': S.review.unit = Math.max(0, Math.min(SEGMENTS.length - 1, S.review.unit + Number(target.dataset.d))); render(); break;
      case 'save-edit': {
        const key = `${S.result.id}:${S.review.unit}`;
        S.review.saved[key] = $('review-target').value; delete S.review.drafts[key];
        render(); $('review-target')?.focus(); toast(t('נשמר. הקובץ להורדה עודכן. הטיוטה עדיין טיוטה.', 'Saved. The download is updated. It is still a draft.')); break;
      }
      case 'deep-prepare': S.deep[target.dataset.kind] = 'ready'; render(); break;
      case 'deep-run': S.deep[target.dataset.kind] = 'done'; render(); break;
      case 'download-notebook': download(S.result.id, 'txt'); break;
      case 'fix-term': {
        const n = NOTEBOOK[Number(target.dataset.i)];
        S.terms[S.result.target] = (S.terms[S.result.target].trim() + `\n${n.src} = ${n.tgt}`).trim();
        toast(t(`״${esc(n.src)}״ נוסף לרשימת המונחים שלי. אפשר לערוך אותו בתרגום הבא.`, `“${esc(n.src)}” was added to my terms. Edit it in the next translation.`)); break;
      }
      case 'another': S.form.file = null; go('new'); break;
      case 'save-terms': S.termsSaved[S.form.target] = true; $('terms-check').innerHTML = termsStatus(parseTerms(S.terms[S.form.target])); toast(t('המונחים נשמרו (בהדגמה: בזיכרון החלון).', 'Terms saved (in the demo: window memory only).')); break;
      case 'chapter': S.learn.chapter = Math.max(1, Math.min(12, S.learn.chapter + Number(target.dataset.d))); S.learn.gloss = null; render(); break;
      case 'close-gloss': S.learn.gloss = null; render(); document.querySelector('.gloss-word')?.focus(); break;
      case 'read-chapter': S.learn.read.add(`${S.learn.lang}:${S.learn.chapter}`); render(); $('progress-title')?.focus(); toast(t('עוד פרק מאחוריכם. החתול מרשה לעצמו להתגאות.', 'Another chapter done. The cat allows himself some pride.')); break;
      case 'learn-upload': toast(t('בהדגמה אין העלאה. באפליקציה בוחרים EPUB בעברית, ושמו יהיה שם הקובץ.', 'No upload in the demo. In the app you pick a Hebrew EPUB; its name becomes the title.')); break;
    }
  });
  document.addEventListener('keydown', event => {
    const zone = event.target.closest?.('#drop-zone');
    if (zone && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); $('file-input').click(); }
    if (event.key === '/' && S.route === 'library' && !event.target.closest('input,textarea,select,[contenteditable]')) { event.preventDefault(); $('search')?.focus(); }
    if (event.key === 'Escape' && S.accountMenu) { S.accountMenu = false; render(); document.querySelector('[data-act="account"]')?.focus(); }
    const tab = event.target.closest?.('[role="tab"]');
    if (tab && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      S.libTab = S.libTab === 'done' ? 'progress' : 'done';
      if (event.key === 'Home') S.libTab = 'done';
      if (event.key === 'End') S.libTab = 'progress';
      S.selected = null; render(); $(`tab-${S.libTab}`)?.focus();
    }
  });
  document.addEventListener('click', event => { if (event.target.closest('#drop-zone')) $('file-input').click(); });
  document.addEventListener('submit', event => { event.preventDefault(); submit(); });
  document.addEventListener('input', event => {
    const el = event.target;
    if (el.id === 'search') { S.search = el.value; S.selected = null; S.shelfLimit = 3; layoutShelf(); $('book-detail').innerHTML = bookDetail(); window.libraryCat?.refresh(); }
    if (el.id === 'budget') {
      S.form.budget = el.value;
      const est = estimate(), b = budgetValue();
      $('estimate').innerHTML = estimateHtml(est, b); $('estimate').classList.toggle('over', !!(est && b !== null && est.high > b));
      document.querySelectorAll('[data-budget]').forEach(x => x.setAttribute('aria-pressed', String(Number(x.dataset.budget) === b)));
      refreshReadiness();
      if (b >= 20) cat('budget', { amount: b });
    }
    if (el.id === 'terms') {
      S.terms[S.form.target] = el.value; S.termsSaved[S.form.target] = false;
      $('terms-check').innerHTML = termsStatus(parseTerms(el.value));
      if (Math.random() < .08) cat('typing');
    }
    if (el.id === 'review-target') {
      const key = `${S.result.id}:${S.review.unit}`;
      S.review.drafts[key] = el.value;
      const msg = $('review-msg'); msg.textContent = t('יש שינויים שלא נשמרו.', 'Unsaved changes.'); msg.className = 'small bad';
    }
    if (el.id === 'vocab-search') $('vocab').innerHTML = vocabItems(el.value.trim());
  });
  function refreshReadiness() {
    // Re-render only the parts that depend on budget/keys, keeping the input focused.
    const ready = readiness(), ok = ready.every(i => i.ok), btn = $('translate-button');
    if (btn) { btn.disabled = !ok; ok ? btn.removeAttribute('aria-describedby') : btn.setAttribute('aria-describedby', 'readiness'); }
    const box = $('readiness');
    if (box) box.hidden = ok;
    if (box && !ok) box.querySelector('ul').innerHTML = ready.map(i => `<li class="${i.ok ? 'ok' : ''}">${i.ok ? '✓' : '·'} ${i.text}</li>`).join('');
    const card = $('catalog-card');
    if (card) card.outerHTML = catalogCard(estimate());
    const summary = document.querySelector('#options .chips');
    if (summary) summary.innerHTML = optionChips();
  }
  document.addEventListener('change', async event => {
    const el = event.target, f = S.form;
    if (el.id === 'file-input') { chooseFile(el.files[0]); el.value = ''; return; }
    if (el.name === 'profile') { f.profile = el.value; render(); }
    if (el.name === 'model' || el.name === 'model-dlg') {
      f.model = el.value;
      if (f.model === 'auto') { f.quality = 'fast'; if (f.target === 'en') { f.target = 'he'; toast(t('Auto מציג תרגום לעברית בלבד; שפת היעד חזרה לעברית.', 'Auto previews Hebrew only; the target language is back to Hebrew.')); } }
      render(); if (el.name === 'model-dlg') refreshModelDialog();
      cat('model', { id: f.model === 'auto' ? 'auto' : f.roles.translator });
      if (f.model === 'configured' && missingKeys().length) setTimeout(() => cat('key-missing'), 4800);
    }
    if (el.dataset.role) {
      f.roles[el.dataset.role] = el.value;
      render(); if (el.id.startsWith('dlg-')) { refreshModelDialog(); $(el.id)?.focus(); }
      if (el.value !== 'follow') cat('model', { id: el.value });
    }
    if (el.name === 'quality') { f.quality = el.value; render(); }
    if (el.name === 'target') { f.target = el.value; render(); }
    if (el.id === 'source') f.source = el.value;
    if (el.id === 'lib-sort') { S.libSort = el.value; S.shelfLimit = 3; layoutShelf(); window.libraryCat?.refresh(); }
    if (el.name === 'ocr') f.ocr = el.value;
    if (el.id === 'font-before') f.fontBefore = el.value;
    if (el.id === 'font-after') { S.fontAfter = el.value; toast(t('ה־PDF נבנה מחדש עם הגופן החדש. לא נשלחה קריאה למודל.', 'The PDF was rebuilt with the new font. No model call was sent.')); }
    if (el.id === 'unit-select') { S.review.unit = Number(el.value); render(); $('unit-select')?.focus(); }
    if (el.id === 'auto-update') S.autoUpdate = el.checked;
    if (el.name === 'learn-lang') { S.learn.lang = el.value; S.learn.gloss = null; render(); }
    if (el.name === 'effort') { S.learn.effort = Number(el.value); S.learn.gloss = null; render(); }
    if (el.name === 'learn-book') { S.learn.book = el.value; render(); }
    if (el.name === 'cat-mode') { S.prefs.cat = el.value; window.libraryCat?.setMode(el.value); render(); }
    if (el.id === 'pref-sound') {
      S.prefs.sound = el.checked;
      const ok = await window.libraryCat?.setSound(el.checked);
      S.prefs.soundError = el.checked && !ok;
      if (S.prefs.soundError) { S.prefs.sound = false; prefsDialog(); }
    }
    if (el.id === 'pref-art') { S.prefs.art = el.checked; render(); }
    if (el.name?.startsWith('demo-')) {
      const v = el.value, k = el.name.slice(5);
      if (k === 'openai' || k === 'anthropic') S.keys[k] = v;
      if (k === 'account') S.account = v;
      if (k === 'update') { S.update = v; if (v === 'available') cat('update'); }
      if (k === 'next') S.demo.next = v;
      if (k === 'library') { S.demo.library = v; resetBooks(); S.selected = null; S.shelfLimit = 3; }
      if (k === 'speed') S.demo.speed = Number(v);
      render();
    }
  });
  document.addEventListener('toggle', event => {
    if (event.target.id === 'options') S.form.optionsOpen = event.target.open;
    if (event.target.dataset?.k === 'chapter-details') S.form.chapterOpen = event.target.open;
    if (event.target.dataset?.k === 'notebook' && S.result) S.result.notebookOpen = event.target.open;
    window.libraryCat?.refresh();
  }, true);
  ['dragover', 'dragleave', 'drop'].forEach(type => document.addEventListener(type, event => {
    const zone = event.target.closest?.('#drop-zone');
    if (!zone) return;
    event.preventDefault();
    zone.classList.toggle('dragging', type === 'dragover');
    if (type === 'drop') chooseFile(event.dataTransfer.files[0]);
  }));
  $('modal').addEventListener('close', () => { if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true }); });
  let resizeTimer = 0;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (S.route === 'library') layoutShelf(); }, 120); });
  addEventListener('hashchange', () => { const r = location.hash.slice(1); if (['library', 'new', 'learning'].includes(r)) go(r); });

  // ---------- Start ----------
  const initial = location.hash.slice(1);
  if (['library', 'new', 'learning'].includes(initial)) S.route = initial;
  render();
  window.libraryCat?.mount();
  window.libraryApp = { state: S, books, render }; // read by the local verification script
})();
