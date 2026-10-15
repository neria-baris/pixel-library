/* A-only interactive design study. Model names mirror the project catalog, not a live service. */
(() => {
  'use strict';
  if (document.body.dataset.design !== 'a') return;
  const catalog = [
    { id: 'auto', provider: 'demo', name: 'Auto', detail: 'טקסט לדוגמה · בלי מפתח' },
    { id: 'gpt-6-luna', provider: 'openai', name: 'GPT-6 Luna' },
    { id: 'gpt-6.1-sol', provider: 'openai', name: 'GPT-6.1 Sol' },
    { id: 'claude-haiku-4-5', provider: 'anthropic', name: 'Claude Haiku 4.5' },
    { id: 'claude-sonnet-5-5', provider: 'anthropic', name: 'Claude Sonnet 5.5' },
    { id: 'claude-opus-5-5', provider: 'anthropic', name: 'Claude Opus 5.5' }
  ];
  const providers = { demo: 'הדגמה', openai: 'OpenAI', anthropic: 'Anthropic' };
  const roles = { translator: 'מתרגם', reviewer: 'בדיקת מקטעים', chapter: 'בדיקת פרקים' };
  let selected = { translator: 'auto', reviewer: 'follow', chapter: 'follow' };
  const keyStates = { openai: 'missing', anthropic: 'missing' };
  const keyLabels = { missing: 'אין מפתח', available: 'זמין להרצה', saved: 'שמור במחשב' };
  let draft, role = 'translator', filter = 'all';
  const model = id => catalog.find(item => item.id === id);
  const resolved = (config, name) => model(config[name] === 'follow' ? config.translator : config[name]);
  const keyIcon = '<svg class="pixel-key" viewBox="0 0 40 24" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><path fill="currentColor" fill-rule="evenodd" d="M4 2h12v4h4v4h18v4h-4v6h-4v-6h-4v4h-4v-4h-2v4h-4v4H4v-4H0V6h4zm2 6v8h8V8z"/></svg>';
  function catArt() {
    return '<svg class="library-cat" viewBox="0 0 112 100" shape-rendering="crispEdges" aria-hidden="true"><path fill="#162b22" d="M8 86h92v8H8z"/><path fill="#a35e47" d="M12 78h80v8H12zM20 68h80v8H20z"/><path fill="#e6d4ab" d="M24 72h68v4H24zM16 82h68v4H16z"/><path fill="#b68d57" d="M24 20h8v8h8v-4h24v4h8V20h8v40h-8v8H32v-8h-8zM28 56h56v12H28zM80 52h12v-8h8v16h-8v8H76z"/><path fill="#d8ad6f" d="M32 36h40v24H32z"/><path fill="#203b2d" d="M36 40h8v4h-8zM60 40h8v4h-8zM48 48h8v4h-8zM44 56h16v4H44z"/><path fill="#e0c187" d="M8 48h12v16H8zM4 44h20v4H4zM20 48h8v12h-8v-4h4v-4h-4z"/><path fill="#a8bca0" d="M8 32h4v8H8zM16 28h4v8h-4z"/></svg>';
  }
  function headerStatus() {
    const current = model(selected.translator);
    const hasAny = Object.values(keyStates).some(value => value !== 'missing');
    const hasSaved = Object.values(keyStates).includes('saved');
    const status = hasSaved ? 'saved' : hasAny ? 'available' : 'missing';
    const details = Object.entries(keyStates).filter(([, value]) => value !== 'missing')
      .map(([provider, value]) => `${providers[provider]}: ${keyLabels[value]}`).join(' · ');
    document.querySelectorAll('[data-workbench-key]').forEach(button => {
      button.dataset.keyState = status;
      button.innerHTML = `${keyIcon}<span>${keyLabels[status]}</span><i aria-hidden="true"></i>`;
      button.setAttribute('aria-label', `מצב מפתחות: ${details || 'אין מפתח API'}. המחשת אב טיפוס`);
      button.title = `${details || 'אין מפתח API'} · הדגמה בלבד`;
    });
    document.querySelectorAll('[data-workbench-model]').forEach(button => {
      button.innerHTML = `<span class="model-heading">מודל</span><bdi>${esc(current.name)}</bdi><span class="model-edit">בחירה</span>`;
      const connection = current.provider === 'demo' ? 'הדגמה ללא מפתח' : `${providers[current.provider]}: ${keyLabels[keyStates[current.provider]]}`;
      button.setAttribute('aria-label', `בחירת מודל. מתרגם: ${current.name}. ${connection}`);
      button.title = connection;
    });
    document.querySelectorAll('[data-workbench-summary]').forEach(node => {
      node.innerHTML = `<span>מתרגם לדוגמה</span><strong dir="auto">${esc(current.name)}</strong>`;
    });
    const hint = document.querySelector('[data-workbench-key-hint]');
    if (hint) hint.textContent = current.provider === 'demo' ? 'Auto: הדמיה ללא מפתח וללא עלות.' :
      `${providers[current.provider]}: ${keyLabels[keyStates[current.provider]]} · בחירת דוגמה בלבד.`;
  }
  function modelChoices() {
    const visible = catalog.filter(item => filter === 'all' || item.provider === filter);
    const chosen = resolved(draft, role);
    return `<div class="model-dialog-intro"><span class="eyebrow">מי עובד על הספר?</span><p>בחרו תפקיד ואז מודל. הספרן כבר סידר את הכיסאות.</p></div>
      <div class="workbench-roles" role="group" aria-label="תפקיד המודל">${Object.entries(roles).map(([id, title]) => `<button class="role-choice" data-model-role="${id}" aria-pressed="${role === id}">${title}<small dir="auto">${esc(draft[id] === 'follow' ? 'כמו המתרגם' : model(draft[id]).name)}</small></button>`).join('')}</div>
      <p class="model-current">נבחר עבור ${roles[role]}: <strong dir="auto">${esc(draft[role] === 'follow' ? `כמו המתרגם · ${chosen.name}` : chosen.name)}</strong></p>
      <div class="workbench-filters" role="group" aria-label="סינון לפי ספק">${[['all','הכול'],...Object.entries(providers)].map(([id, title]) => `<button data-model-filter="${id}" aria-pressed="${filter === id}">${title}</button>`).join('')}</div>
      <fieldset class="model-choices"><legend class="sr-only">מודל עבור ${roles[role]}</legend>${role !== 'translator' ? `<label class="model-choice"><input type="radio" name="workbench-model" value="follow" ${draft[role] === 'follow' ? 'checked' : ''}><span><strong>כמו המתרגם</strong><small>יתעדכן יחד עם המתרגם</small></span></label>` : ''}${visible.map(item => `<label class="model-choice"><input type="radio" name="workbench-model" value="${item.id}" ${draft[role] === item.id ? 'checked' : ''}><span><strong dir="auto">${esc(item.name)}</strong><small>${item.detail || `${providers[item.provider]} · ${keyLabels[keyStates[item.provider]]}`}</small></span></label>`).join('')}</fieldset>
      <p class="workbench-demo-note">קטלוג דוגמה מתוך הפרויקט. הבחירה כאן אינה מחברת ספק או מפעילה תרגום. אין אומדן מחיר חי.</p>
      <div class="dialog-actions"><button class="btn" data-model-apply>שמירת הבחירה</button><button class="btn secondary" data-action="close-modal">ביטול</button></div>`;
  }
  function refreshModelDialog(focusSelector) {
    const content = document.querySelector('#workbench-model-content');
    content.innerHTML = modelChoices();
    content.querySelector(focusSelector)?.focus({ preventScroll: true });
  }
  function openModels() {
    draft = { ...selected };
    role = 'translator'; filter = 'all';
    modal('בחירת מודלים', `<div id="workbench-model-content">${modelChoices()}</div>`, '');
    document.querySelector('[data-model-role=translator]').focus();
  }
  function keyContent() {
    return `<p>המפתח בכותרת מראה אם יש מפתח זמין, ואם הוא שמור במחשב. מפתח שמור אינו אישור שהחיבור תקין.</p><div class="key-provider-list">${Object.entries(keyStates).map(([id, status]) => `<section><h3>${providers[id]} <span class="pill">${keyLabels[status]}</span></h3><div class="key-simulation" role="group" aria-label="המחשת מצב מפתח ${providers[id]}">${Object.entries(keyLabels).map(([value, label]) => `<button data-key-provider="${id}" data-key-value="${value}" aria-pressed="${status === value}">${label}</button>`).join('')}</div></section>`).join('')}</div><p class="workbench-demo-note">הכפתורים מדמים חיווי בלבד. אין כאן מפתח אמיתי או גישה למפתחות השמורים שלכם.</p>`;
  }
  function openKeys() {
    modal('צרור המפתחות', `<div id="workbench-key-content">${keyContent()}</div>`, '<button class="btn" data-action="close-modal">חזרה לספרייה</button>');
  }
  window.libraryWorkbenchPolish = () => {
    const tools = document.querySelector('.top-tools');
    if (tools && !tools.querySelector('.workbench-header')) {
      const header = document.createElement('div'); header.className = 'workbench-header';
      header.innerHTML = '<button class="workbench-key" data-workbench-key></button><button class="workbench-model" data-workbench-model></button>';
      tools.prepend(header);
    }
    document.querySelectorAll('.book-card').forEach(card => {
      if (card.classList.contains('tome-card')) return;
      const book = books.find(item => item.id === card.querySelector('[data-book]').dataset.book);
      card.classList.add('tome-card');
      card.style.setProperty('--tome-cover', book.cover);
      card.querySelector('.book-art')?.remove();
      const label = document.createElement('div'); label.className = 'tome-edition';
      label.innerHTML = `<span>מהדורת הספרייה</span><span dir="ltr">VOL. ${String(books.indexOf(book) + 1).padStart(2,'0')}</span>`;
      card.querySelector('.book-body').prepend(label);
      const joke = document.createElement('p'); joke.className = 'tome-aside';
      joke.textContent = ['הזמן עובר. הסימנייה נשארת.', 'זהירות: עלול להצמיח מחשבות.', 'העלילה נחה רגע. מותר לה.'][books.indexOf(book)];
      card.querySelector('.room-card-footer').before(joke);
    });
    const hero = document.querySelector('.library-hero');
    if (hero && !hero.querySelector('.cat-corner')) {
      hero.querySelector('.eyebrow').textContent = 'ספרייה פרטית. בלי מבטי ״ששש״.';
      hero.querySelector('h1').innerHTML = 'ספרים ישנים.<br><em>רעיונות בלי אבק.</em>';
      hero.querySelector('.hero-copy>p').textContent = 'מתרגמים, קוראים ולומדים. החתול אחראי על ההפסקות.';
      const cat = document.createElement('div'); cat.className = 'cat-corner';
      cat.innerHTML = `${catArt()}<span>הספרן במשמרת.<br><b>נא לא להפריע לתנומה.</b></span>`;
      hero.querySelector('.hero-art').append(cat);
      const note = document.querySelector('.section-title>.muted');
      if (note) note.textContent = 'אין קנסות על קריאה איטית.';
    }
    if (hero) { // Reading-room enhancement may run again on search; keep this copy stable.
      hero.querySelector('.eyebrow').textContent = 'ספרייה פרטית. בלי מבטי ״ששש״.';
      hero.querySelector('.hero-copy>p').textContent = 'מתרגמים, קוראים ולומדים. החתול אחראי על ההפסקות.';
    }
    const summary = document.querySelector('.summary-lines');
    if (summary && !summary.querySelector('[data-workbench-summary]')) {
      const line = document.createElement('div'); line.className = 'summary-line'; line.dataset.workbenchSummary = '';
      summary.prepend(line);
      const link = document.createElement('button'); link.className = 'btn secondary small summary-model-button';
      link.dataset.workbenchModel = ''; summary.after(link);
    }
    const settings = document.querySelector('.settings-grid');
    const connection = settings?.querySelector('[data-action=connection]')?.closest('section');
    if (connection && !connection.dataset.workbenchConnection) {
      connection.dataset.workbenchConnection = '';
      connection.innerHTML = '<span class="eyebrow">ארגז הכלים</span><h2>המפתח והמודל, בהישג יד.</h2><p>אותם פקדים זמינים תמיד בכותרת האתר. בלי מסע בין תפריטים.</p><div class="settings-workbench row"><button class="workbench-key" data-workbench-key></button><button class="workbench-model" data-workbench-model></button></div><p data-workbench-key-hint></p><button class="btn ghost small" data-action="connection">איך ייראה החיבור?</button>';
    }
    headerStatus();
    window.libraryMotionPolish?.();
  };
  document.addEventListener('click', event => {
    const keyTrigger = event.target.closest('[data-workbench-key]');
    const modelTrigger = event.target.closest('[data-workbench-model]');
    if (keyTrigger) { keyTrigger.focus(); openKeys(); }
    if (modelTrigger) { modelTrigger.focus(); openModels(); }
    const roleButton = event.target.closest('[data-model-role]');
    if (roleButton) { role = roleButton.dataset.modelRole; filter = 'all'; refreshModelDialog(`[data-model-role="${role}"]`); }
    const filterButton = event.target.closest('[data-model-filter]');
    if (filterButton) { filter = filterButton.dataset.modelFilter; refreshModelDialog(`[data-model-filter="${filter}"]`); }
    if (event.target.closest('[data-model-apply]')) {
      selected = { ...draft }; closeModal(); headerStatus(); say('בחירת המודלים עודכנה בהדגמה.');
    }
    const keyButton = event.target.closest('[data-key-provider]');
    if (keyButton) {
      const { keyProvider, keyValue } = keyButton.dataset;
      keyStates[keyProvider] = keyValue;
      document.querySelector('#workbench-key-content').innerHTML = keyContent();
      document.querySelector(`[data-key-provider="${keyProvider}"][data-key-value="${keyValue}"]`).focus();
      headerStatus(); say(`${providers[keyProvider]}: ${keyLabels[keyValue]}. המחשה בלבד.`);
    }
    if (event.target.closest('[data-action=confirm-job]')) {
      const summary = document.querySelector('#modal .dialog-summary');
      if (summary) {
        const line = document.createElement('p');
        line.className = 'workbench-confirm-model';
        line.textContent = Object.entries(roles).map(([id, label]) => `${label}: ${resolved(selected, id).name}`).join(' · ');
        summary.append(line);
      }
    }
  });
  document.addEventListener('change', event => {
    if (event.target.name === 'workbench-model') {
      draft[role] = event.target.value;
      // Preserve native radio focus and arrow-key behavior; update only the role summary.
      const chosen = resolved(draft, role);
      document.querySelector('.model-current strong').textContent = draft[role] === 'follow' ? `כמו המתרגם · ${chosen.name}` : chosen.name;
      document.querySelector(`[data-model-role="${role}"] small`).textContent = draft[role] === 'follow' ? 'כמו המתרגם' : chosen.name;
    }
  });
  window.libraryWorkbenchPolish();
})();
