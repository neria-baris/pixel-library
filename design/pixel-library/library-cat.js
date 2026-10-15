/* The library cat. Original pixel sprite composited in code; roams the page.
   Local only: no network, storage, voices or files. Never covers controls or reading text. */
(() => {
  'use strict';

  // ---------- Sprite ----------
  const PAL = { K: '#9a7b63', O: '#2a1d15', B: '#d68b45', D: '#a85f2a', L: '#f7e0b5', P: '#e8948c', E: '#3d6e34', W: '#fffbea' };
  const GW = 32, GH = 22;
  const HEAD = ['.O.......O.', 'OBO.....OBO', 'OPBOOOOOBPO', 'OBBDBDBDBBO', '', '', 'OBLLLPLLLBO', '.OLLOLOLLO.', '..OOOOOOO..'];
  const EYES = {
    open: ['OBWEBBBWEBO', 'OBEEBBBEEBO'],
    side: ['OBBWEBBBWEO', 'OBBEEBBBEEO'],
    closed: ['OBBBBBBBBBO', 'OBOOBBBOOBO'],
    happy: ['OBBOBBBOBBO', 'OBOBOBOBOBO'],
    wide: ['OBWWBBBWWBO', 'OBEEBBBEEBO']
  };
  const YAWN = ['OBLLOPOLLBO', '.OLOPPPOLO.'];
  const head = (eyes = 'open', yawn = false) => {
    const h = HEAD.slice();
    [h[4], h[5]] = EYES[eyes];
    if (yawn) [h[6], h[7]] = YAWN;
    if (eyes === 'happy') h[6] = 'OPLLLPLLLPO';
    return h;
  };
  const BODY = ['..OOOOOOOOOOOOOO..', '.OBBDBBBDBBBDBBBO.', 'OBBBDBBBDBBBDBBBBO', 'OBBBBBBBBBBBBBBBBO',
    'OBBBBBBBBBBBBBBLLO', '.OLLLLLLLLLLLLLLO.', '..OOOOOOOOOOOOOO..'];
  const SIT = ['..OOOOOOOOO..', '.OBBBLLLBBBO.', '.OBDBLLLBDBO.', 'OBBDBLLLBDBBO', 'OBBBBLLLBBBBO',
    'OBDBBLLLBBDBO', 'OBBBBLLLBBBBO', 'OBBBOLLLOBBBO', 'OBBOLLOLLOBBO', '.OOOOOOOOOOO.'];
  const LEG = ['OBO', 'OLO', 'OLO', 'OOO'], LEG_UP = ['OLO', 'OLO', 'OOO'];
  const TAIL_A = ['..OOO..', '.OLLO..', '.ODO...', 'OBO....', 'ODO....', 'OBO....', '.ODO...', '.OBBO..', '..OBBO.'];
  const TAIL_B = ['...OOO.', '..OLLO.', '..ODO..', '.OBO...', 'ODO....', 'OBO....', '.ODO...', '.OBBO..', '..OBBO.'];
  const TAIL_FLAT = ['.OOOO', 'OLDBD', '.OOOO'];
  const TAIL_DOWN = ['OBO', 'ODO', 'OBO', 'ODO', 'OLO', '.O.'];
  const SIT_TAIL_A = ['....OO', '...OLO', '...ODO', 'OOOOBO', 'BBDBDO', 'OOOOO.'];
  const SIT_TAIL_B = ['......', '....OO', '...OLO', 'OOOODO', 'BBDBBO', 'OOOOO.'];
  const WHISKERS = [['KK...........KK', '..K.........K..'], 9, 10];
  const PAW = ['OLO', 'OBO', 'OBO'];

  function compose(parts) {
    const grid = Array.from({ length: GH }, () => Array(GW).fill(null));
    for (const [rows, x, y] of parts) rows.forEach((row, r) => [...row].forEach((c, i) => {
      const gx = x + i, gy = y + r;
      if (c !== '.' && gx >= 0 && gx < GW && gy >= 0 && gy < GH) grid[gy][gx] = c;
    }));
    const paths = {};
    grid.forEach((row, y) => {
      let x = 0;
      while (x < GW) {
        const c = row[x];
        if (!c) { x++; continue; }
        let w = 1;
        while (row[x + w] === c) w++;
        (paths[c] ||= []).push(`M${x} ${y}h${w}v1h-${w}z`);
        x += w;
      }
    });
    return Object.entries(paths).map(([c, d]) => `<path fill="${PAL[c]}" d="${d.join('')}"/>`).join('');
  }
  const legs = (xs, lifted = []) => xs.map(x => [lifted.includes(x) ? LEG_UP : LEG, x, 18]);
  const GROUND = [6, 10, 14, 18], STEP = [7, 9, 15, 17];
  const walker = (tail, legParts, eyes = 'side') => [[tail, 0, 3], [BODY, 4, 11], ...legParts, [head(eyes), 20, 5]];
  const sitter = (tail, eyes = 'open', extra = [], yawn = false) => [[tail, 21, 16], [SIT, 10, 12], WHISKERS, [head(eyes, yawn), 11, 4], ...extra];
  const FRAMES = {
    walk0: walker(TAIL_A, legs(GROUND)),
    walk1: walker(TAIL_A, legs(STEP, [9, 17])),
    walk2: walker(TAIL_B, legs(GROUND)),
    walk3: walker(TAIL_B, legs(STEP, [7, 15])),
    sitA: sitter(SIT_TAIL_A), sitB: sitter(SIT_TAIL_B),
    blink: sitter(SIT_TAIL_A, 'closed'), look: sitter(SIT_TAIL_B, 'side'),
    happy: sitter(SIT_TAIL_A, 'happy'), yawn: sitter(SIT_TAIL_B, 'closed', [], true),
    groomA: sitter(SIT_TAIL_A, 'closed', [[PAW, 17, 10]]), groomB: sitter(SIT_TAIL_A, 'closed', [[PAW, 17, 11]]),
    loafA: [[TAIL_FLAT, 0, 18], [BODY, 4, 15], [head('closed'), 19, 12]],
    loafB: [[TAIL_FLAT, 0, 18], [BODY, 4, 15], [head('closed'), 19, 13]],
    jump: [[TAIL_FLAT, 0, 11], [BODY, 4, 10],
      [['OBO'], 18, 17], [['OBO'], 19, 18], [['OLO'], 20, 19], [['OOO'], 20, 20],
      [['OBO'], 15, 17], [['OBO'], 16, 18], [['OLO'], 17, 19], [['OOO'], 17, 20],
      [['OBO'], 6, 17], [['OBO'], 5, 18], [['OLO'], 4, 19], [['OOO'], 4, 20],
      [['OBO'], 9, 17], [['OBO'], 8, 18], [['OLO'], 7, 19], [['OOO'], 7, 20], [head('wide'), 20, 4]],
    held: [[TAIL_DOWN, 2, 12], [BODY, 4, 10], ...GROUND.map(x => [LEG, x, 17]), [head('wide'), 20, 3]]
  };
  const POSES = {
    walk: [['walk0', 130], ['walk1', 130], ['walk2', 130], ['walk3', 130]],
    sit: [['sitA', 650], ['sitB', 650]], look: [['look', 1000]], happy: [['happy', 1000]],
    yawn: [['yawn', 1000]], groom: [['groomA', 240], ['groomB', 240]],
    loaf: [['loafA', 1100], ['loafB', 1100]], jump: [['jump', 1000]], held: [['held', 1000]]
  };

  // ---------- Words ----------
  const he = () => document.documentElement.lang !== 'en';
  const L = pair => pair[he() ? 0 : 1];
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const LINES = {
    hello: [['שוב אתם? יופי. הבאתם חטיף?', 'You again? Great. Did you bring snacks?'],
      ['הספרייה פתוחה. אני הספרן. בערך.', 'The library is open. I am the librarian. Roughly.']],
    idle: [['המדף הזה נבדק. נמצא מתאים לישיבה.', 'This shelf has been inspected. Approved for sitting.'],
      ['קראתי את כל הספרים כאן. בעיקר את הפינות.', 'I have read every book here. Mostly the corners.'],
      ['אם משהו נופל מהמדף, זה לא אני. אלא אם כן זה אני.', 'If something falls off the shelf, it wasn’t me. Unless it was.'],
      ['הערת שוליים: אני.', 'Footnote: me.'],
      ['אין מילה ל״דדליין״ בשפת חתולים.', 'There is no word for “deadline” in Cat.'],
      ['אני לא ישן. אני עושה הגהה בעיניים עצומות.', 'I’m not sleeping. I’m proofreading with my eyes closed.'],
      ['עברית, אנגלית, יפנית… ואני עדיין עונה רק ל״טונה״.', 'Hebrew, English, Japanese… and I still only answer to “tuna”.'],
      ['ריח של נייר ישן… ושל עכבר?', 'Smells like old paper… and mouse?']],
    library: [['כל ספר כאן הוא כרית בפוטנציה.', 'Every book here is a potential pillow.'],
      ['סידרתי את המדף לפי חום. העליון הכי חם.', 'I sorted the shelf by warmth. Top one’s warmest.'],
      ['ה־EPUB הזה מגרגר כשפותחים אותו. או שזה אני.', 'This EPUB purrs when you open it. Or that’s me.'],
      ['אין קנסות על איחור. רק על הזזת חתול.', 'No late fees. Only cat-relocation fees.']],
    new: [['שימו את הקובץ כאן. אשב עליו כדי שיישאר חם.', 'Put the file here. I’ll sit on it to keep it warm.'],
      ['תקציב? אני מודד הכול בקופסאות טונה.', 'Budget? I measure everything in tuna cans.'],
      ['המונחים שלי: מיאו = שלום, מיאו! = אוכל, מיאו!!! = עכשיו.', 'My terms: meow = hello, meow! = food, meow!!! = now.']],
    job: [['אני מפקח על התרגום. כלומר, יושב לידו.', 'I’m supervising the translation. That is, sitting next to it.'],
      ['האותיות האלה עפות. מותר לתפוס אחת?', 'Those letters are flying. May I catch one?'],
      ['העלילה מסתבכת. כמו חוט צמר.', 'The plot thickens. Like yarn.']],
    result: [['טיוטה. כלומר עוד מותר לשבת עליה.', 'A draft. Like the one under the door.'],
      ['אבקש קרדיט בעמוד השער: ״בסיוע החתול״.', 'I’d like credit on the title page: “with help from the cat”.']],
    learning: [['Le chat. זה אני. בצרפתית אני נשמע יקר יותר.', 'Le chat. That’s me. I sound pricier in French.'],
      ['אוצר המילים שלי: מיאו, מיאו, ותן.', 'My vocabulary: meow, meow, and gimme.']],
    pet: [['פררר…', 'Prrrr…'], ['עוד. מאחורי האוזן.', 'More. Behind the ear.'],
      ['ההנאה הזאת תירשם ביומן העלויות.', 'This pleasure will be logged in the cost ledger.'],
      ['מותר. אבל רק כי זה יום רביעי.', 'Allowed. But only because it’s Wednesday.']],
    enough: [['מספיק. אני חתול מקצועי.', 'Enough. I am a professional.']],
    held: [['הי! אני לא קובץ לגרירה!', 'Hey! I am not a draggable file!']],
    dropped: [['נחתתי על הרגליים. כרגיל.', 'Landed on my feet. As usual.']],
    wake: [['התעוררתי. מה פספסתי?', 'I’m up. What did I miss?']],
    'file-selected': [['הרחתי. ריח של PDF טרי.', 'Sniffed it. Fresh PDF.']],
    'file-error': [['גם אני לא מצליח לפתוח את זה. ואני פותח כל ארון.', 'I can’t open it either. And I open every cupboard.']],
    sample: [['ספר לדוגמה. גם אני חתול לדוגמה.', 'A sample book. I’m a sample cat.']],
    'job-start': [['מתחילים! אני אחראי על ההפסקות.', 'Starting! I’m in charge of breaks.']],
    'job-paused': [['השהיה? מושלם. זמן תנומה.', 'Paused? Perfect. Nap time.']],
    'job-decision': [['צריך להחליט. אני חתול, אני רק מפיל דברים.', 'A decision is needed. I’m a cat. I just knock things over.']],
    'job-error': [['משהו נתקע. לא אני הפעם, נשבע.', 'Something got stuck. Not me this time, I swear.']],
    'job-done': [['גמרנו! מותר ללטף עכשיו.', 'Done! Petting may now commence.']],
    delete: [['לתוך הריק. כמו הצעצועים שלי מתחת לספה.', 'Into the void. Like my toys under the sofa.']],
    download: [['לא יודע מה זה PDF, אבל אני גאה בך.', 'I don’t know what a PDF is, but I’m proud of you.']],
    'search-empty': [['חיפשתי גם מתחת לספה. כלום.', 'Checked under the sofa too. Nothing.']],
    'key-missing': [['אין מפתח? גם לי אין, ובכל זאת אני נכנס לכל חדר.', 'No key? Me neither, and I get into every room.']],
    typing: [['המקלדת חמה. שוקל לשבת עליה.', 'That keyboard looks warm. Considering it.']],
    update: [['עדכון! אולי הוסיפו כפתור טונה.', 'An update! Maybe they added a tuna button.']],
    'lang-en': [['Meow. I mean: hello.', 'Meow. I mean: hello.']],
    'lang-he': [['מיאו. כלומר: שלום.', 'מיאו. כלומר: שלום.']],
    model: {
      'gpt-6-luna': [['לונה. כמו הירח. אני מיילל אליו בלילות.', 'Luna. Like the moon. I yowl at it nightly.']],
      'gpt-6.1-sol': [['סול. שמש. אשכב בה, אם אפשר.', 'Sol. Sun. I’ll lie in it, if I may.']],
      'claude-haiku-4-5': [['חתול על מדף / שמש חמה על הכריכה / אין לי שאלות.', 'cat upon the shelf / warm sun on the cover / no further questions']],
      'claude-sonnet-5-5': [['סונטה? רק אם יש בה ארבע־עשרה שורות על טונה.', 'A sonnet? Only if it’s fourteen lines about tuna.']],
      'claude-opus-5-5': [['אופוס? אני מעדיף תמנון.', 'Opus? I prefer octopus.']],
      auto: [['Auto. כמוני: עושה רושם של עבודה.', 'Auto. Like me: gives the impression of work.']]
    }
  };
  function budgetLine(amount) {
    const cans = Math.max(1, Math.floor(amount / 1.5));
    return he() ? `$${amount}? זה ${cans} קופסאות טונה. רק אומר.` : `$${amount}? That’s ${cans} cans of tuna. Just saying.`;
  }

  // ---------- Sound (opt-in, synthesized locally) ----------
  let audio = null, soundOn = false;
  function ensureAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audio ||= new Ctx();
    return audio;
  }
  function tone(kind) {
    if (!soundOn || !audio || audio.state !== 'running') return;
    const now = audio.currentTime, gain = audio.createGain(), osc = audio.createOscillator();
    gain.connect(audio.destination);
    if (kind === 'purr') {
      const lfo = audio.createOscillator(), depth = audio.createGain(), filter = audio.createBiquadFilter();
      osc.type = 'sawtooth'; osc.frequency.value = 52;
      filter.type = 'lowpass'; filter.frequency.value = 180;
      lfo.frequency.value = 24; depth.gain.value = .05;
      lfo.connect(depth); depth.connect(gain.gain);
      osc.connect(filter); filter.connect(gain);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.linearRampToValueAtTime(.06, now + .2);
      gain.gain.linearRampToValueAtTime(.0001, now + 1.6);
      lfo.start(now); lfo.stop(now + 1.65);
      osc.start(now); osc.stop(now + 1.65);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(760, now + .12);
      osc.frequency.exponentialRampToValueAtTime(520, now + .22);
      osc.connect(gain);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.linearRampToValueAtTime(.05, now + .03);
      gain.gain.exponentialRampToValueAtTime(.0001, now + .26);
      osc.start(now); osc.stop(now + .28);
    }
  }

  // ---------- DOM ----------
  const root = document.createElement('div');
  root.className = 'roam-cat';
  root.hidden = true;
  root.innerHTML = `<div class="roam-thought" aria-hidden="true" hidden><p></p></div>
    <button type="button" class="roam-body"><svg viewBox="0 0 ${GW} ${GH}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${
      Object.entries(FRAMES).map(([name, parts]) => `<g data-f="${name}" style="display:none">${compose(parts)}</g>`).join('')}</svg></button>
    <span class="roam-fx" aria-hidden="true"></span>`;
  const body = root.querySelector('.roam-body'), svg = root.querySelector('svg');
  const bubble = root.querySelector('.roam-thought'), bubbleText = bubble.querySelector('p'), fx = root.querySelector('.roam-fx');
  const frameNodes = Object.fromEntries([...svg.querySelectorAll('g[data-f]')].map(g => [g.dataset.f, g]));

  // ---------- Geometry ----------
  // Controls and readable text. The cat may sit beside words, never on them.
  const AVOID = 'button,a[href],input,select,textarea,summary,label,[tabindex]:not([tabindex="-1"]),h1,h2,h3,p,li,.eyebrow,.update-notice,.chip,[data-cat-avoid],.toast';
  const scale = () => (innerWidth < 640 ? 2 : innerWidth < 1100 ? 3 : 4);
  const W = () => GW * scale(), H = () => GH * scale();
  const headerBottom = () => Math.max(0, document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0);
  const docRect = el => { const r = el.getBoundingClientRect(); return { l: r.left + scrollX, r: r.right + scrollX, t: r.top + scrollY, b: r.bottom + scrollY, w: r.width, h: r.height }; };
  function subtract(intervals, [a, b]) {
    const out = [];
    for (const [x, y] of intervals) {
      if (b <= x || a >= y) { out.push([x, y]); continue; }
      if (a > x) out.push([x, a]);
      if (b < y) out.push([b, y]);
    }
    return out;
  }
  function obstacles() {
    return [...document.querySelectorAll(AVOID)]
      .filter(el => !root.contains(el) && el.getClientRects().length && !el.closest('dialog:not([open]),[hidden]'))
      .map(docRect).filter(r => r.w > 0 && r.h > 0);
  }
  function segments({ visibleOnly = true, onlyEl = null } = {}) {
    const obs = obstacles(), h = H(), w = W();
    const top = scrollY + headerBottom() + 6, bottom = scrollY + innerHeight - 6;
    const out = [];
    for (const el of onlyEl ? [onlyEl] : document.querySelectorAll('[data-perch]')) {
      if (!el.isConnected || !el.getClientRects().length) continue;
      const r = docRect(el);
      if (r.w < w) continue;
      if (visibleOnly && (r.t - h < top || r.t > bottom)) continue;
      let free = [[Math.max(r.l + 4, scrollX + 4), Math.min(r.r - 4, scrollX + innerWidth - 4)]];
      for (const o of obs) {
        if (o.b <= r.t - h + 4 || o.t >= r.t - 1) continue;
        free = subtract(free, [o.l - 6, o.r + 6]);
      }
      for (const [a, b] of free) if (b - a >= w + 4) out.push({ el, key: el.dataset.perch, y: r.t, a, b, left: r.l });
    }
    return out;
  }
  function placeFree(x, y) {
    // Is the cat's box at (x, y) clear of controls and visible?
    const h = H(), w = W(), top = scrollY + headerBottom(), bottom = scrollY + innerHeight;
    if (y - h < top - 2 || y > bottom + 2) return false;
    return !obstacles().some(o => o.l < x + w - 6 && o.r > x + 6 && o.t < y - 4 && o.b > y - h + 4);
  }

  // ---------- State ----------
  const cat = { x: -200, y: -200, face: 1, pose: 'sit', anchor: null, motion: null, airborne: false };
  let mode = 'roam', paused = false, running = false, raf = 0, last = 0, poseStart = 0, shownFrame = '';
  let nextBlink = 0, blinkUntil = 0, lastActivity = performance.now(), napping = false;
  let token = null, pets = [], lostSince = 0, checkAt = 0, dragging = null, suppressClick = false;

  class Token {
    constructor() { this.cancelled = false; this.waiters = new Set(); }
    // A cancelled behaviour never resumes: its pending waits stay pending, so stale code cannot overwrite the new pose.
    cancel() { this.cancelled = true; this.waiters.forEach(fn => fn()); this.waiters.clear(); }
    wait(ms) {
      return new Promise(resolve => {
        if (this.cancelled) return;
        const stop = () => clearTimeout(id);
        const id = setTimeout(() => { this.waiters.delete(stop); resolve(); }, ms);
        this.waiters.add(stop);
      });
    }
  }
  const rand = (a, b) => a + Math.random() * (b - a);
  function setPose(pose) { if (cat.pose !== pose) { cat.pose = pose; poseStart = performance.now(); } }
  function anchorTo(seg) { cat.anchor = { el: seg.el, key: seg.key, left: docRect(seg.el).l }; cat.y = seg.y; }

  function render(now) {
    const s = scale();
    root.style.setProperty('--cat-scale', s);
    root.style.transform = `translate3d(${Math.round(cat.x)}px,${Math.round(cat.y - H())}px,0)`;
    root.classList.toggle('face-left', cat.face < 0);
    let name;
    if (cat.pose === 'sit' && now < blinkUntil) name = 'blink';
    else {
      const seq = POSES[cat.pose], total = seq.reduce((sum, [, d]) => sum + d, 0);
      let t = (now - poseStart) % total;
      name = seq.find(([, d]) => (t -= d) < 0)?.[0] || seq[0][0];
    }
    if (name !== shownFrame) {
      if (frameNodes[shownFrame]) frameNodes[shownFrame].style.display = 'none';
      frameNodes[name].style.display = '';
      shownFrame = name;
    }
    if (!bubble.hidden) placeBubble();
  }
  function placeBubble() {
    const w = bubble.offsetWidth, h = bubble.offsetHeight, left = cat.x - scrollX, catCenter = left + W() / 2;
    // No room above (sticky header)? Think sideways, toward the roomier side.
    const side = cat.y - H() - scrollY - h - 26 < headerBottom();
    bubble.classList.toggle('side', side);
    if (side) {
      const right = innerWidth - (left + W()) > left;
      const x = right ? Math.min(W() + 14, innerWidth - left - w - 8) : Math.max(-w - 14, 8 - left);
      bubble.style.left = `${Math.round(x)}px`;
      bubble.style.setProperty('--tail', right ? '-6px' : `${w + 2}px`);
      return;
    }
    const clamped = Math.min(Math.max(catCenter - w / 2, 8), innerWidth - w - 8);
    bubble.style.left = `${Math.round(clamped - left)}px`;
    bubble.style.setProperty('--tail', `${Math.round(catCenter - clamped)}px`);
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(64, now - last); last = now;
    if (paused) return;
    if (cat.motion) cat.motion(now, dt);
    else if (cat.anchor && !dragging) follow(now);
    if (cat.pose === 'sit' && now > nextBlink) { blinkUntil = now + 160; nextBlink = now + rand(2500, 6000); }
    render(now);
  }
  function follow(now) {
    const a = cat.anchor;
    if (!a.el.isConnected) {
      const again = a.key && document.querySelector(`[data-perch="${CSS.escape(a.key)}"]`);
      if (again) { a.el = again; a.left = docRect(again).l; } else { cat.anchor = null; relocate('lost'); return; }
    }
    const r = docRect(a.el);
    cat.x += r.l - a.left; a.left = r.l;
    cat.y = r.t;
    if (now > checkAt) {
      checkAt = now + 900;
      if (placeFree(cat.x, cat.y)) lostSince = 0;
      else if (!lostSince) lostSince = now;
      else if (now - lostSince > 1100) { lostSince = 0; relocate('blocked'); }
    }
  }

  // ---------- Movement ----------
  // One movement at a time. `step` returns true when finished; cancellation lands the cat safely.
  function animate(tk, step, onCancel) {
    return new Promise(resolve => {
      if (tk.cancelled) return;
      const cancel = () => { cat.motion = null; onCancel(); };
      tk.waiters.add(cancel);
      cat.motion = (now, dt) => { if (step(now, dt)) { tk.waiters.delete(cancel); cat.motion = null; resolve(); } };
    });
  }
  function walkTo(tk, x) {
    cat.face = x > cat.x ? 1 : -1;
    setPose('walk');
    const speed = 0.066 * scale() / 3; // px per ms
    return animate(tk, (now, dt) => {
      if (cat.anchor?.el.isConnected) { const r = docRect(cat.anchor.el); cat.x += r.l - cat.anchor.left; cat.anchor.left = r.l; cat.y = r.t; }
      const step = speed * dt, d = x - cat.x;
      if (Math.abs(d) > step) { cat.x += Math.sign(d) * step; return false; }
      cat.x = x; setPose('sit'); return true;
    }, () => setPose('sit'));
  }
  async function arcTo(tk, seg, x, { drop = false } = {}) {
    if (!drop) { root.classList.add('crouch'); await tk.wait(170); root.classList.remove('crouch'); }
    if (tk.cancelled) return;
    const x0 = cat.x, y0 = cat.y, x1 = x, y1 = seg.y, dist = Math.hypot(x1 - x0, y1 - y0);
    const duration = drop ? Math.max(260, Math.sqrt(Math.abs(y1 - y0)) * 26) : Math.min(1000, Math.max(450, 380 + dist * .45));
    const lift = drop ? 0 : Math.max(36, Math.min(160, Math.abs(y1 - y0) * .25 + 50));
    const start = performance.now();
    cat.face = x1 >= x0 ? 1 : -1;
    cat.anchor = null; cat.airborne = true;
    setPose(drop ? 'held' : 'jump');
    const land = () => { cat.airborne = false; cat.x = x1; anchorTo(seg); setPose('sit'); };
    await animate(tk, now => {
      const t = Math.min(1, (now - start) / duration), e = drop ? t * t : t;
      cat.x = x0 + (x1 - x0) * t;
      cat.y = y0 + (y1 - y0) * e - (drop ? 0 : 4 * lift * t * (1 - t));
      if (t < 1) return false;
      land();
      root.classList.add('land'); setTimeout(() => root.classList.remove('land'), 160);
      if (dist > 220) tone('mrrp');
      return true;
    }, land);
  }
  function xIn(seg, prefer) {
    const lo = seg.a, hi = seg.b - W();
    return Math.min(hi, Math.max(lo, prefer ?? rand(lo, hi)));
  }
  async function goTo(tk, seg, prefer) {
    const x = xIn(seg, prefer);
    const here = cat.anchor && cat.anchor.el === seg.el && !cat.airborne && cat.x >= seg.a - 2 && cat.x + W() <= seg.b + 2;
    if (here) return walkTo(tk, x);
    const visibleNow = cat.y - H() > scrollY && cat.y < scrollY + innerHeight && cat.x > scrollX - W() && cat.x < scrollX + innerWidth;
    const far = Math.abs(seg.y - cat.y) > innerHeight * .8 || Math.abs(x - cat.x) > innerWidth * .85;
    if (!visibleNow || far || cat.x < -100) return dropIn(tk, seg, x);
    return arcTo(tk, seg, x);
  }
  async function dropIn(tk, seg, x) {
    cat.x = x; cat.y = Math.max(scrollY + headerBottom() + H() * .2, seg.y - innerHeight * .5);
    cat.anchor = null;
    root.classList.add('arriving');
    setTimeout(() => root.classList.remove('arriving'), 260);
    await arcTo(tk, seg, x, { drop: true });
  }

  // ---------- Thoughts and effects ----------
  async function think(tk, text, ms = 4200) {
    if (tk.cancelled || !text) return;
    bubbleText.textContent = text;
    bubble.hidden = false;
    placeBubble();
    await tk.wait(ms + text.length * 25);
    bubble.hidden = true;
  }
  function burst(kind, n = 3) {
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.className = `roam-${kind}`;
      p.style.setProperty('--dx', `${Math.round(rand(-22, 22))}px`);
      p.style.animationDelay = `${i * 180}ms`;
      if (kind === 'zzz') p.textContent = 'z';
      fx.append(p);
      setTimeout(() => p.remove(), 1700 + i * 180);
    }
  }

  // ---------- Behaviour ----------
  function routeLines() {
    const route = document.body.dataset.route || 'library';
    return [...(LINES[route] || []), ...LINES.idle];
  }
  async function nap(tk) {
    napping = true;
    setPose('yawn'); await tk.wait(900);
    setPose('loaf');
    const zzz = setInterval(() => !paused && burst('zzz', 1), 1500);
    tk.waiters.add(() => { clearInterval(zzz); napping = false; });
    while (!tk.cancelled && (mode === 'nap' || performance.now() - lastActivity > 20000)) await tk.wait(800);
    clearInterval(zzz);
    napping = false;
    if (tk.cancelled) return;
    setPose('yawn'); await tk.wait(700); setPose('sit');
    if (mode === 'roam' && Math.random() < .5) await think(tk, L(pick(LINES.wake)), 2500);
  }
  async function life(tk) {
    while (!tk.cancelled) {
      if (mode === 'nap') {
        const all = segments({ visibleOnly: false });
        const floor = segments().find(s => s.key === 'basket') || all.find(s => s.key === 'footer') || all[0];
        if (floor && (!cat.anchor || cat.anchor.el !== floor.el)) { cat.x = xIn(floor, floor.b - W()); anchorTo(floor); }
        await nap(tk);
        continue;
      }
      if (!cat.anchor && !cat.motion) {
        const segs = segments();
        if (!segs.length) { root.classList.add('away'); await tk.wait(1500); continue; }
        root.classList.remove('away');
        await dropIn(tk, pick(segs));
        continue;
      }
      if (performance.now() - lastActivity > 45000) { await nap(tk); continue; }
      const r = Math.random();
      if (r < .3) {
        const seg = segments({ onlyEl: cat.anchor?.el })[0];
        if (seg) await walkTo(tk, xIn(seg));
        setPose('sit'); await tk.wait(rand(1500, 3500));
      } else if (r < .52) {
        const segs = segments().filter(s => s.el !== cat.anchor?.el);
        if (segs.length) {
          const near = segs.sort((a, b) => Math.abs(a.y - cat.y) - Math.abs(b.y - cat.y)).slice(0, 3);
          await goTo(tk, pick(near));
        }
        await tk.wait(rand(1200, 3000));
      } else if (r < .64) {
        setPose('groom'); await tk.wait(rand(2200, 3600)); setPose('sit');
      } else if (r < .72) {
        setPose('yawn'); await tk.wait(900); setPose('sit'); await tk.wait(1200);
      } else if (r < .86) {
        setPose('sit'); await think(tk, L(pick(routeLines())));
        await tk.wait(rand(1500, 3000));
      } else {
        setPose('look'); await tk.wait(rand(1400, 2600)); setPose('sit'); await tk.wait(rand(2000, 5000));
      }
    }
  }
  function run(script) {
    token?.cancel();
    bubble.hidden = true;
    root.classList.remove('crouch');
    const tk = token = new Token();
    (async () => {
      try { if (script) await script(tk); if (!tk.cancelled) await life(tk); }
      catch (error) { console.error(error); }
    })();
  }
  function relocate(reason) {
    if (dragging || mode !== 'roam') return;
    run(async tk => {
      const segs = segments();
      if (!segs.length) { cat.anchor = null; return; }
      const near = segs.sort((a, b) => Math.abs(a.y - cat.y) + Math.abs(a.a - cat.x) * .3 - (Math.abs(b.y - cat.y) + Math.abs(b.a - cat.x) * .3));
      await goTo(tk, near[0], cat.x);
      if (reason === 'lost' && Math.random() < .5) await think(tk, L(pick(routeLines())));
    });
  }

  // ---------- Interaction ----------
  function pet() {
    lastActivity = performance.now();
    const now = performance.now();
    pets = pets.filter(t => now - t < 9000).concat(now);
    run(async tk => {
      if (napping || cat.pose === 'loaf') { setPose('yawn'); await tk.wait(500); }
      if (pets.length >= 6) {
        pets = [];
        setPose('look');
        await think(tk, L(pick(LINES.enough)), 1800);
        const away = segments().filter(s => s.el !== cat.anchor?.el);
        if (away.length) await goTo(tk, pick(away));
        return;
      }
      setPose('happy'); burst('heart', 3); tone('purr');
      announce(L(pick(LINES.pet)));
      await think(tk, bubbleTextFor('pet'), 2400);
      setPose('sit');
      if (mode === 'nap') await nap(tk);
    });
  }
  let lastPetLine = -1;
  function bubbleTextFor(kind) {
    const list = LINES[kind];
    lastPetLine = (lastPetLine + 1) % list.length;
    return L(list[lastPetLine]);
  }
  function announce(text) {
    const node = document.getElementById('announcer');
    if (!node) return;
    node.textContent = '';
    requestAnimationFrame(() => { node.textContent = text; });
  }
  body.addEventListener('click', event => {
    if (suppressClick) { suppressClick = false; event.preventDefault(); return; }
    pet();
  });
  body.addEventListener('pointerdown', event => {
    if (event.button !== 0 || mode === 'away') return;
    dragging = { id: event.pointerId, sx: event.pageX, sy: event.pageY, held: false };
    body.setPointerCapture(event.pointerId);
  });
  body.addEventListener('pointermove', event => {
    if (!dragging || dragging.id !== event.pointerId) return;
    if (!dragging.held && Math.hypot(event.pageX - dragging.sx, event.pageY - dragging.sy) > 7) {
      dragging.held = true;
      token?.cancel();
      cat.motion = null; cat.anchor = null;
      setPose('held'); root.classList.add('held');
      bubbleText.textContent = L(pick(LINES.held)); bubble.hidden = false;
    }
    if (dragging.held) {
      const minY = scrollY + headerBottom() + H() * .8;
      cat.x = Math.min(scrollX + innerWidth - W() - 2, Math.max(scrollX + 2, event.pageX - W() * .62));
      cat.y = Math.max(minY, event.pageY + H() * .8);
    }
  });
  function endDrag(event) {
    if (!dragging || dragging.id !== event.pointerId) return;
    const held = dragging.held;
    dragging = null;
    if (!held) return;
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 50);
    root.classList.remove('held');
    lastActivity = performance.now();
    run(async tk => {
      const cx = cat.x + W() / 2, all = segments();
      const below = all.filter(s => s.a <= cx && cx <= s.b && s.y >= cat.y - 8).sort((a, b) => a.y - b.y)[0];
      const target = below || all.sort((a, b) => Math.hypot(a.a - cat.x, a.y - cat.y) - Math.hypot(b.a - cat.x, b.y - cat.y))[0];
      if (!target) { bubble.hidden = true; return; }
      if (below) await arcTo(tk, target, xIn(target, cat.x), { drop: true });
      else await arcTo(tk, target, xIn(target, cat.x));
      await think(tk, L(pick(LINES.dropped)), 2200);
    });
  }
  body.addEventListener('pointerup', endDrag);
  body.addEventListener('pointercancel', endDrag);

  // ---------- Lifecycle ----------
  function setPaused(next) {
    if (next === paused) return;
    paused = next;
    root.classList.toggle('paused', paused);
    if (paused) { token?.cancel(); cat.motion = null; bubble.hidden = true; }
    else if (running) run();
  }
  function reconcile() {
    const dialogOpen = !!document.querySelector('dialog[open]');
    setPaused(document.hidden || dialogOpen);
  }
  function start() {
    if (running || mode === 'away') return;
    running = true;
    root.hidden = false;
    last = performance.now();
    raf = requestAnimationFrame(loop);
    reconcile();
    if (!paused) run(async tk => {
      await tk.wait(500);
      const segs = segments();
      if (segs.length) {
        const seg = segs.find(s => s.key === 'hero') || pick(segs);
        await dropIn(tk, seg, xIn(seg));
        if (mode === 'roam') await think(tk, L(pick(LINES.hello)), 3800);
      }
    });
  }
  function stop() {
    running = false;
    token?.cancel();
    cancelAnimationFrame(raf);
    root.hidden = true;
    cat.anchor = null; cat.motion = null; cat.x = -200;
  }
  ['pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(type =>
    addEventListener(type, () => { lastActivity = performance.now(); }, { passive: true }));
  document.addEventListener('visibilitychange', reconcile);
  addEventListener('resize', () => { if (running && !paused) { cat.x = Math.min(cat.x, scrollX + innerWidth - W() - 4); } });
  addEventListener('pagehide', () => { token?.cancel(); audio?.close().catch(() => {}); audio = null; });

  // ---------- Public API used by the app ----------
  window.libraryCat = {
    mount() {
      if (!root.isConnected) document.body.append(root);
      new MutationObserver(reconcile).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
      body.setAttribute('aria-label', he() ? 'חתול הספרייה. לחיצה מלטפת, גרירה מרימה אותו' : 'The library cat. Click to pet, drag to pick up');
      if (mode !== 'away') start();
    },
    refresh() {
      body.setAttribute('aria-label', he() ? 'חתול הספרייה. לחיצה מלטפת, גרירה מרימה אותו' : 'The library cat. Click to pet, drag to pick up');
      reconcile();
    },
    setMode(next) {
      mode = next;
      if (mode === 'away') { stop(); return; }
      if (!running) start(); else run();
    },
    async setSound(on) {
      if (!on) { soundOn = false; return true; }
      try {
        const ctx = ensureAudio();
        if (!ctx) return false;
        await ctx.resume();
        soundOn = ctx.state === 'running';
        if (soundOn) tone('mrrp');
        return soundOn;
      } catch { soundOn = false; return false; }
    },
    react(type, detail = {}) {
      if (!running || mode !== 'roam' || dragging) return;
      let text = '';
      if (type === 'budget') text = budgetLine(detail.amount);
      else if (type === 'model') text = L(pick(LINES.model[detail.id] || LINES.model.auto));
      else if (LINES[type]) text = L(pick(LINES[type]));
      if (type === 'route') text = Math.random() < .55 ? L(pick(routeLines())) : '';
      if (paused) return;
      run(async tk => {
        await tk.wait(type === 'route' ? 450 : 60);
        const target = detail.perch && document.querySelector(`[data-perch="${CSS.escape(detail.perch)}"]`);
        if (target) {
          const seg = segments({ onlyEl: target })[0];
          if (seg) await goTo(tk, seg);
        } else if (!cat.anchor || !placeFree(cat.x, cat.y)) {
          const segs = segments();
          if (segs.length) await goTo(tk, segs.sort((a, b) => Math.abs(a.y - cat.y) - Math.abs(b.y - cat.y))[0]);
        }
        if (type === 'job-done') {
          const seg = segments({ onlyEl: cat.anchor?.el })[0];
          if (seg) await arcTo(tk, seg, xIn(seg, cat.x + 30));
          setPose('happy'); burst('heart', 4);
        }
        if (type === 'job-paused') { setPose('loaf'); await tk.wait(400); }
        if (text) await think(tk, text);
        if (type === 'job-paused') { await tk.wait(1500); }
      });
    },
    // Test hooks (verification script only reads them).
    debug: () => ({ x: cat.x, y: cat.y, w: W(), h: H(), pose: cat.pose, anchor: cat.anchor?.key || null, paused, running, mode, thought: bubble.hidden ? '' : bubbleText.textContent, free: placeFree(cat.x, cat.y), segments: segments().length })
  };
})();
