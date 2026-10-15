/* A-only presentation enhancement. Existing native controls remain the source of input. */
(() => {
  'use strict';
  const room = document.body;
  if (room.dataset.design !== 'a') return;
  document.documentElement.classList.add('reading-room');
  const find = id => document.getElementById(id);
  const trashIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" aria-hidden="true"><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg>';
  function stepButton(input, delta, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'room-step';
    button.dataset.roomStep = input.id;
    button.dataset.delta = delta;
    button.setAttribute('aria-label', label);
    button.textContent = delta > 0 ? '+' : '−';
    return button;
  }
  function updateRange(input) {
    const min = Number(input.min), max = Number(input.max), value = Number(input.value);
    input.style.setProperty('--range-progress', `${100 * (value - min) / (max - min)}%`);
    if (input.id === 'budget-slider') {
      input.setAttribute('aria-valuetext', `${value.toFixed(2)} דולר`);
    }
    document.querySelectorAll('[data-room-range]').forEach(button => {
      if (button.dataset.roomRange === input.id) {
        button.setAttribute('aria-pressed', Number(button.dataset.value) === value);
      }
    });
    document.querySelectorAll('[data-room-step]').forEach(button => {
      if (button.dataset.roomStep === input.id) {
        button.disabled = Number(button.dataset.delta) > 0 ? value >= max : value <= min;
      }
    });
  }
  function updateBudgetSteps() {
    const input = find('budget-number');
    if (!input) return;
    const value = Number(input.value);
    document.querySelectorAll('[data-room-step="budget-number"]').forEach(button => {
      button.disabled = input.value !== '' && Number.isFinite(value) &&
        (Number(button.dataset.delta) > 0 ? value >= Number(input.max) : value <= Number(input.min));
    });
  }
  function enhanceRange(input) {
    if (input.closest('.room-slider')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'room-slider';
    input.before(wrapper);
    wrapper.append(input);
    if (input.id === 'quality' || input.id === 'effort') {
      wrapper.classList.add('has-stations');
      if (input.id === 'quality') {
        wrapper.after(find('quality').closest('section').querySelector('.review-levels'));
      } else {
        const stations = document.createElement('div');
        stations.className = 'room-stations';
        stations.setAttribute('role', 'group');
        stations.setAttribute('aria-label', 'בחירה ישירה של רמת מאמץ');
        effortNames.forEach((label, value) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.dataset.roomRange = input.id;
          button.dataset.value = value;
          button.innerHTML = `<span>${label}</span><small>${[10, 20, 30][value]}% חדש</small>`;
          stations.append(button);
        });
        wrapper.after(stations);
      }
    }
    if (input.id === 'reader-size') {
      wrapper.classList.add('room-size');
      wrapper.prepend(stepButton(input, -1, 'הקטנת גודל הטקסט'));
      wrapper.append(stepButton(input, 1, 'הגדלת גודל הטקסט'));
    }
    if (input.id === 'budget-slider') {
      const scale = document.createElement('div');
      scale.className = 'room-scale';
      scale.setAttribute('aria-hidden', 'true');
      scale.innerHTML = '<span>$0.50</span><span>בחירה מהירה</span><span>$30</span>';
      wrapper.append(scale);
    }
    updateRange(input);
  }
  function enhanceBudget() {
    const input = find('budget-number');
    if (!input || input.closest('.room-number')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'room-number';
    wrapper.dir = 'ltr';
    input.before(wrapper);
    wrapper.append(stepButton(input, -1, 'הפחתת התקציב בדולר'), input,
      stepButton(input, 1, 'הגדלת התקציב בדולר'));
    updateBudgetSteps();
  }
  function enhanceNavigation() {
    document.querySelectorAll('[data-action="prev-segment"],[data-action="next-segment"]').forEach(button => {
      if (button.classList.contains('room-page-button')) return;
      const previous = button.dataset.action === 'prev-segment';
      button.textContent = previous ? 'הקודם' : 'הבא';
      button.classList.add('room-page-button');
      button.parentElement.classList.add('room-pagination');
    });
    // Navigation uses words. Arrow symbols also disappear from paired-language metadata.
    document.querySelectorAll('#app,#modal').forEach(root => {
      root.querySelectorAll('.room-chevron').forEach(node => node.remove());
      root.querySelectorAll('button,a,.book-meta,.result-heading>p').forEach(element => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          if (/[←→]/.test(node.textContent)) {
            const control = node.parentElement.closest('button,a');
            node.textContent = node.textContent.replace(/\s*[←→]\s*/g, control ? ' ' : ' · ').trim();
          }
        }
      });
    });
  }
  function enhanceLibrary() {
    const eyebrow = document.querySelector('.library-hero .eyebrow');
    if (eyebrow) eyebrow.textContent = 'ספרייה אישית';
    const intro = document.querySelector('.library-hero .hero-copy>p');
    if (intro) intro.textContent = 'תרגום מסמכים, קריאה ולמידת שפה.';
    const continuation = document.querySelector('.continue-card');
    if (continuation) continuation.hidden = state.removedBooks.has('garden');
    const count = document.querySelector('.section-title h2 .muted');
    const remaining = books.length - state.removedBooks.size;
    if (count) count.textContent = `/ ${String(remaining).padStart(2, '0')}`;
    document.querySelectorAll('.book-card').forEach(card => {
      if (card.querySelector('[data-room-delete]')) return;
      const id = card.querySelector('[data-book]').dataset.book;
      const book = books.find(book => book.id === id);
      const footer = document.createElement('div');
      footer.className = 'room-card-footer';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'room-delete';
      button.dataset.roomDelete = id;
      button.setAttribute('aria-label', `מחיקת ${book.title} מהספרייה`);
      button.innerHTML = `${trashIcon}<span>מחיקה</span>`;
      footer.append(button);
      card.querySelector('.book-body').append(footer);
    });
    document.querySelector('.room-undo')?.remove();
    const section = document.querySelector('.section-title');
    if (section && state.lastRemovedBook) {
      const book = books.find(book => book.id === state.lastRemovedBook);
      const notice = document.createElement('div');
      notice.className = 'room-undo';
      const message = document.createElement('span');
      message.textContent = `״${book.title}״ הוסר מהספרייה.`;
      const undo = document.createElement('button');
      undo.type = 'button';
      undo.className = 'btn secondary small';
      undo.dataset.roomUndo = 'true';
      undo.textContent = 'ביטול המחיקה';
      notice.append(message, undo);
      section.before(notice);
    }
    const empty = document.querySelector('#books .empty');
    if (remaining === 0 && empty) {
      empty.innerHTML = '<h3>הספרייה ריקה</h3><p>אפשר להוסיף ספר חדש או לבטל את המחיקה האחרונה.</p><button class="btn secondary" data-route="new">הוספת ספר</button>';
    }
  }
  let pendingDelete = null;
  function confirmDelete(id, trigger) {
    const book = books.find(book => book.id === id);
    if (!book || state.removedBooks.has(id)) return;
    const card = trigger.closest('.book-card');
    const neighbor = card.nextElementSibling || card.previousElementSibling;
    pendingDelete = { id, neighbor: neighbor?.querySelector('[data-book]')?.dataset.book };
    trigger.focus();
    modal('מחיקת ספר',
      `<p class="room-delete-title">${esc(book.title)}</p><p>הספר יוסר מספריית ההדגמה. קובץ המקור במחשב אינו נמחק.</p><p>אפשר לבטל את המחיקה במסך הספרייה. רענון הדף מחזיר את כל ספרי הדוגמה.</p>`,
      '<button class="btn secondary" data-action="close-modal" autofocus>להשאיר בספרייה</button><button class="btn room-danger" data-room-confirm-delete="true">מחיקת הספר</button>');
  }
  window.readingRoomPolish = () => {
    document.querySelectorAll('input[type="range"]').forEach(enhanceRange);
    enhanceBudget();
    enhanceNavigation();
    enhanceLibrary();
  };
  document.addEventListener('input', event => {
    if (event.target.matches('input[type="range"]')) updateRange(event.target);
    if (event.target.id === 'budget-number' || event.target.id === 'budget-slider') {
      if (find('budget-slider')) updateRange(find('budget-slider'));
      updateBudgetSteps();
    }
    if (event.target.id === 'effort') {
      const summary = document.querySelector('.learning-controls>summary .muted');
      if (summary) summary.textContent = `${languages[state.language].name} · ${effortNames[state.effort]} · פרק ${state.chapter}`;
    }
  });
  document.addEventListener('click', event => {
    const deletion = event.target.closest('[data-room-delete]');
    if (deletion) confirmDelete(deletion.dataset.roomDelete, deletion);
    if (event.target.closest('[data-room-confirm-delete]') && pendingDelete) {
      const { id, neighbor } = pendingDelete;
      pendingDelete = null;
      closeModal();
      if (state.removedBooks.has(id)) return;
      state.removedBooks.add(id);
      state.lastRemovedBook = id;
      if (state.readerBook === books.find(book => book.id === id).title) {
        state.readerBook = books.find(book => !state.removedBooks.has(book.id))?.title || 'ספר לדוגמה';
      }
      if (state.job?.book?.id === id) {
        clearInterval(progressTimer);
        state.job = null;
        state.paused = true;
      }
      render();
      const next = document.querySelector(`[data-room-delete="${neighbor}"]`) ||
        document.querySelector('#books button') || document.querySelector('[data-room-undo]');
      next?.focus();
      toast('הספר הוסר מספריית ההדגמה. אפשר לבטל את המחיקה.');
    }
    if (event.target.closest('[data-room-undo]') && state.lastRemovedBook) {
      const id = state.lastRemovedBook;
      state.removedBooks.delete(id);
      state.lastRemovedBook = null;
      render();
      document.querySelector(`[data-room-delete="${id}"]`)?.focus();
      toast('הספר חזר לספרייה.');
    }
    const station = event.target.closest('[data-room-range]');
    const step = event.target.closest('[data-room-step]');
    if (station) {
      const input = find(station.dataset.roomRange);
      input.value = station.dataset.value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (step && !step.disabled) {
      const input = find(step.dataset.roomStep);
      const current = input.value === '' ? 0 : Number(input.value);
      input.value = Math.min(Number(input.max), Math.max(Number(input.min),
        Math.round(((Number.isFinite(current) ? current : 0) + Number(step.dataset.delta)) * 100) / 100));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    // The shared direct-quality buttons update native value without firing input.
    if (event.target.closest('[data-quality]') && find('quality')) updateRange(find('quality'));
    if (event.target.closest('[data-action="help"],[data-action="export"],[data-action="connection"],[data-action="confirm-job"]')) {
      enhanceNavigation();
    }
  });
  window.readingRoomPolish();
})();
