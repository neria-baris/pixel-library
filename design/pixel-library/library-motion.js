/* Local SVG theatre and Web Audio only. No voices, files, storage or network. */
(() => {
  'use strict';
  if (document.body.dataset.design !== 'a') return;
  const quotes = ['הספר הזה חם. שלי.', 'אם זה מרשרש, זה צעצוע.', 'נמנום קטן. שלוש שעות, גג.', 'למה הספר פתוח אם אפשר לשבת עליו?', 'ריח של נייר ישן… ועכבר?', 'המדף הגבוה. משם רואים את כולם.'];
  let scene, observer, timer, active = false, visible = false, sound = false, pendingVisit = false;
  let press, pressObserver, pressVisible = false;
  let quoteIndex = 0, lastTyped = -Infinity, audio, master, soundRequested = false, lastQuiet = document.body.classList.contains('no-art');
  const voices = new Set();
  const dialog = document.getElementById('modal');
  const cat = `<svg class="library-cat visiting-cat" viewBox="0 0 112 96" shape-rendering="crispEdges" aria-hidden="true" focusable="false">
    <g class="cat-tail"><path fill="#b68d57" d="M76 62h12V48h8V36h8v24h-8v12H76z"/><path fill="#80603e" d="M96 40h8v8h-8zM88 56h8v8h-8z"/></g>
    <g class="cat-body"><path fill="#b68d57" d="M24 44h48v8h8v24H20V56h4z"/><path fill="#dfbc80" d="M32 56h28v20H32z"/><path fill="#81613e" d="M24 52h8v8h-8zM64 52h12v4H64zM64 64h12v4H64z"/><path fill="#f0dab2" d="M16 76h24v8H16zM56 76h24v8H56z"/></g>
    <g class="cat-head"><path fill="#b68d57" d="M20 12h8v8h8v-4h28v4h8V12h8v40h-8v8H28v-8h-8z"/><path fill="#d8ad6f" d="M28 28h44v24H28z"/><path fill="#80603e" d="M40 16h4v12h-4zM52 16h4v12h-4z"/>
      <g class="cat-eyes"><path fill="#203b2d" d="M32 32h8v8h-8zM60 32h8v8h-8z"/><path fill="#f7e7c5" d="M32 32h4v4h-4zM60 32h4v4h-4z"/></g>
      <path fill="#754936" d="M46 42h8v4h-8z"/><path class="cat-mouth-closed" fill="#513c2c" d="M42 50h16v4H42z"/>
      <path fill="#e5cf9e" d="M12 40h16v4H12zM72 40h16v4H72zM16 48h12v4H16zM72 48h12v4H72z"/>
    </g></svg>`;
  function controls(summon = true) {
    return (summon ? '<button data-library-summon>פסס… חתול!</button>' : '') + '<button data-library-sound></button>';
  }
  function markup() {
    return `<div class="cat-stage"><span class="theatre-label">ספרן הבית · לפעמים עובד</span><div class="cat-shadow" aria-hidden="true"></div><div class="cat-actor">${cat}</div><div class="cat-tower" aria-hidden="true"><i></i><i></i><i></i></div><div class="cat-bubble" aria-label="מחשבות חתול הספרייה" hidden><p></p><button data-library-dismiss aria-label="סגירת מחשבות החתול">×</button></div><span class="cat-sound-word" aria-hidden="true">חרררק…</span></div><div class="atmosphere-controls" aria-label="אווירת הספרייה">${controls()}</div><p class="motion-note" hidden></p>`;
  }
  function updateControls() {
    document.querySelectorAll('[data-library-sound]').forEach(button => {
      button.textContent = sound ? 'צלילים פעילים' : 'צלילים כבויים';
      button.setAttribute('aria-pressed', String(sound));
    });
    document.querySelectorAll('.motion-note').forEach(note => {
      note.textContent = '';
      note.hidden = true;
    });
  }
  function stopAudio() {
    for (const voice of voices) { try { voice.stop(); } catch {} voice.disconnect(); }
    voices.clear();
  }
  function playSound(purr = false) {
    if (!sound || !audio || audio.state !== 'running' || !active) return;
    const now = audio.currentTime, duration = purr ? .5 : .28;
    const oscillator = audio.createOscillator(), envelope = audio.createGain();
    oscillator.type = purr ? 'sine' : 'triangle';
    oscillator.frequency.setValueAtTime(purr ? 68 : 183, now);
    oscillator.frequency.exponentialRampToValueAtTime(purr ? 46 : 93, now + duration);
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(purr ? .18 : .12, now + .035);
    envelope.gain.exponentialRampToValueAtTime(.001, now + duration);
    oscillator.connect(envelope); envelope.connect(master);
    voices.add(oscillator);
    oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); };
    oscillator.start(now); oscillator.stop(now + duration + .02);
  }
  function later(delay, callback) { clearTimeout(timer); timer = setTimeout(callback, delay); }
  function phase(name) {
    if (!scene) return;
    scene.dataset.phase = name;
    const bubble = scene.querySelector('.cat-bubble');
    bubble.hidden = name !== 'thinking' && name !== 'static';
  }
  function rest() { phase('waiting'); }
  function visit(manual = false) {
    clearTimeout(timer);
    if (!scene || document.body.classList.contains('no-art')) return;
    if (manual && !visible) {
      pendingVisit = true;
      scene.scrollIntoView({ block:'center', behavior:'instant' });
      return;
    }
    const text = quotes[quoteIndex++ % quotes.length];
    scene.querySelector('.cat-bubble p').textContent = text;
    if (manual) say(`חתול הספרייה חושב: ${text}`);
    if (!active) { phase('static'); return; }
    phase('peeking');
    later(750, () => {
      phase('jumping'); playSound();
      later(1250, () => {
        phase('thinking'); playSound(true);
        later(6500, () => {
          // Never hide a control while someone is using it with the keyboard.
          if (scene.querySelector('.cat-bubble').contains(document.activeElement)) { phase('static'); return; }
          phase('leaving'); playSound();
          later(1100, () => { phase('waiting'); schedule(); });
        });
      });
    });
  }
  function schedule(first = false) {
    if (!active) return;
    later(first ? 2800 : 30000 + Math.floor(Math.random() * 15000), () => {
      const cooldown = 12000 - (performance.now() - lastTyped);
      if (cooldown > 0) { later(cooldown, () => visit()); return; }
      visit();
    });
  }
  function syncTranslation() {
    if (!press) return;
    press.dataset.step = state.progress < 25 ? 'opening' : state.progress < 60 ? 'translating' : state.progress < 85 ? 'reviewing' : 'binding';
    press.dataset.paused = String(state.paused);
    press.classList.toggle('translation-running', pressVisible && state.route === 'processing' && !state.paused &&
      !document.hidden && !document.body.classList.contains('no-art') && !dialog.open);
  }
  function mountTranslation() {
    const host = document.querySelector('.job-scene');
    if (host === press) return;
    pressObserver?.disconnect(); pressVisible = false;
    press = host;
    if (!press) return;
    press.classList.add('translation-press');
    press.setAttribute('aria-hidden','true');
    press.innerHTML = '<div class="press-lamp"><i></i></div><div class="press-letters"><span>A</span><span>文</span><span>א</span></div><div class="press-book"><div class="press-page press-source"><i></i><i></i><i></i><i></i></div><div class="press-page press-target"><i></i><i></i><i></i><i></i></div><div class="press-turn"></div><div class="press-binding"></div></div><div class="press-stamp"><i></i></div><div class="press-desk"></div>';
    pressObserver = new IntersectionObserver(entries => { pressVisible = entries[0].isIntersecting; syncTranslation(); }, { threshold:.1 });
    pressObserver.observe(press);
    syncTranslation();
  }
  window.libraryTranslationMotion = syncTranslation;
  function reconcile() {
    syncTranslation();
    const next = !!(scene && visible && !document.hidden &&
      !document.body.classList.contains('no-art') && !dialog.open);
    if (next === active) return;
    active = next;
    document.body.classList.toggle('library-awake', active);
    clearTimeout(timer); stopAudio(); rest();
    if (active) {
      if (pendingVisit) { pendingVisit = false; visit(true); }
      else schedule(true);
    }
  }
  window.libraryMotionPolish = () => {
    const corner = document.querySelector('.cat-corner');
    let host = corner;
    if (!host) {
      const footer = document.querySelector('.app-footer');
      if (footer && !footer.querySelector('.footer-theatre')) {
        const fallback = document.createElement('div'); fallback.className = 'footer-theatre'; footer.prepend(fallback);
      }
      host = document.querySelector('.footer-theatre');
    }
    if (host && scene !== host) {
      clearTimeout(timer); stopAudio(); observer?.disconnect();
      active = false; visible = false; pendingVisit = false; document.body.classList.remove('library-awake');
      scene = host; scene.classList.add('library-theatre'); scene.setAttribute('aria-label', 'פינת חתול הספרייה');
      scene.innerHTML = markup(); rest();
      observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; reconcile(); }, { threshold: .15 });
      observer.observe(scene);
    }
    const hero = document.querySelector('.library-hero');
    if (hero && !hero.querySelector('.library-dust')) {
      const dust = document.createElement('div'); dust.className = 'library-dust'; dust.setAttribute('aria-hidden','true');
      dust.innerHTML = '<i></i><i></i><i></i><i></i><i></i>'; hero.append(dust);
    }
    const settings = document.querySelector('.settings-grid');
    if (settings && !settings.querySelector('.atmosphere-settings')) {
      const panel = document.createElement('section'); panel.className = 'panel wide atmosphere-settings';
      panel.innerHTML = '<h2>ספרייה חיה</h2><p>חתול אורח, מחשבות על נמנום, אבק באור וספרים שחורקים קצת. הצלילים נוצרים כאן במחשב ומתחילים רק אם תדליקו אותם.</p><div class="atmosphere-controls">'+controls(false)+'</div><p class="motion-note" hidden></p>';
      settings.append(panel);
    }
    mountTranslation(); updateControls(); reconcile();
  };
  document.addEventListener('click', async event => {
    if (event.target.closest('[data-library-summon]')) visit(true);
    const dismiss = event.target.closest('[data-library-dismiss]');
    if (dismiss) {
      if (dismiss === document.activeElement) scene.querySelector('[data-library-summon]').focus();
      clearTimeout(timer); rest(); schedule();
    }
    if (event.target.closest('[data-library-sound]')) {
      if (sound || soundRequested) { sound = false; soundRequested = false; stopAudio(); updateControls(); return; }
      soundRequested = true;
      try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) throw new Error('unavailable');
        if (!audio) { audio = new Audio(); master = audio.createGain(); master.gain.value = .045; master.connect(audio.destination); }
        await audio.resume();
        if (!soundRequested) return;
        sound = true; updateControls(); playSound();
      } catch {
        sound = false; soundRequested = false; updateControls();
        document.querySelectorAll('.motion-note').forEach(note => { note.hidden = false; note.textContent = 'הצלילים אינם זמינים בדפדפן הזה. הספרייה ממשיכה בשקט.'; });
      }
    }
  });
  document.addEventListener('input', event => {
    if (event.target.matches('input,textarea')) {
      lastTyped = performance.now();
      if (active) { clearTimeout(timer); rest(); schedule(); }
    }
  });
  document.addEventListener('visibilitychange', reconcile);
  new MutationObserver(reconcile).observe(dialog, { attributes:true, attributeFilter:['open'] });
  new MutationObserver(() => {
    const quiet = document.body.classList.contains('no-art');
    if (quiet !== lastQuiet) { lastQuiet = quiet; reconcile(); }
  }).observe(document.body, { attributes:true, attributeFilter:['class'] });
  addEventListener('pagehide', () => { clearTimeout(timer); stopAudio(); observer?.disconnect(); pressObserver?.disconnect(); press?.classList.remove('translation-running'); audio?.close().catch(() => {}); });
  addEventListener('pageshow', event => {
    if (!event.persisted) return;
    audio = undefined; master = undefined; sound = false; soundRequested = false;
    scene = undefined; press = undefined; active = false; visible = false;
    window.libraryMotionPolish();
  });
  window.libraryMotionPolish();
})();
