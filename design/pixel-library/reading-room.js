/* A-only presentation enhancement. Existing native controls remain the source of input. */
(() => {
  'use strict';
  const room = document.body;
  if (room.dataset.design !== 'a') return;
  document.documentElement.classList.add('reading-room');
  const find = id => document.getElementById(id);
  const pixelChevron = direction => {
    const span = document.createElement('span');
    span.className = `room-chevron ${direction === 'right' ? 'is-right' : ''}`;
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" focusable="false"><path fill="currentColor" d="M10 1H7v3H4v3H1v2h3v3h3v3h3v-4H7V9H4V7h3V5h3z"/></svg>';
    return span;
  };
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
      button.prepend(pixelChevron(previous ? 'right' : 'left'));
      button.parentElement.classList.add('room-pagination');
    });
    document.querySelectorAll('button,a').forEach(control => {
      if (control.querySelector('.room-chevron')) return;
      const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
      let node, direction;
      while ((node = walker.nextNode())) {
        if (/[←→]/.test(node.textContent)) {
          direction = node.textContent.includes('→') ? 'right' : 'left';
          node.textContent = node.textContent.replace(/[←→]/g, '').trim();
        }
      }
      if (direction) control.append(pixelChevron(direction));
    });
  }
  window.readingRoomPolish = () => {
    document.querySelectorAll('input[type="range"]').forEach(enhanceRange);
    enhanceBudget();
    enhanceNavigation();
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
