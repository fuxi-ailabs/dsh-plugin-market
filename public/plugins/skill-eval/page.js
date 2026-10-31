(() => {
  const names = ['overview', 'quick-start', 'usage', 'help'];
  const buttons = new Map(names.map((name) => [name, document.getElementById(`tab-${name}`)]));
  const panels = new Map(names.map((name) => [name, document.getElementById(`panel-${name}`)]));
  const tocs = new Map(names.map((name) => [name, document.querySelector(`[data-toc="${name}"]`)]));
  const tabbar = document.querySelector('.tabbar');
  const siteHeader = document.querySelector('.site-header');
  const syncHeaderHeight = () => {
    const height = siteHeader?.getBoundingClientRect().height;
    if (height) document.documentElement.style.setProperty('--site-header-height', `${Math.ceil(height)}px`);
  };

  function activate(name, focus = false) {
    if (!panels.has(name)) return;
    for (const [key, button] of buttons) {
      const active = key === name;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      panels.get(key).hidden = !active;
      tocs.get(key).hidden = !active;
      if (active && focus) button.focus();
    }
  }

  function resolveHash() {
    const raw = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (names.includes(raw)) return { name: raw, target: null };
    const target = raw ? document.getElementById(raw) : null;
    const panel = target?.closest('[data-panel]');
    return { name: panel?.dataset.panel || 'overview', target: target || null };
  }

  function scrollToTop() {
    const headerHeight = siteHeader?.getBoundingClientRect().height ?? 0;
    const top = tabbar.getBoundingClientRect().top + window.scrollY - headerHeight - 8;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  function applyHash({ scroll = true } = {}) {
    const { name, target } = resolveHash();
    activate(name);
    if (!scroll) return;
    window.requestAnimationFrame(() => {
      if (target) target.scrollIntoView({ block: 'start', behavior: 'smooth' });
      else scrollToTop();
    });
  }

  function selectTab(name) {
    if (location.hash === `#${name}`) applyHash();
    else location.hash = name;
  }

  for (const [name, button] of buttons) {
    button.addEventListener('click', () => selectTab(name));
    button.addEventListener('keydown', (event) => {
      const current = names.indexOf(name);
      let next = null;
      if (event.key === 'ArrowRight') next = (current + 1) % names.length;
      if (event.key === 'ArrowLeft') next = (current - 1 + names.length) % names.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = names.length - 1;
      if (next === null) return;
      event.preventDefault();
      const nextName = names[next];
      activate(nextName, true);
      location.hash = nextName;
    });
  }

  function manualCopy(text, opener) {
    const dialog = document.createElement('dialog');
    dialog.className = 'copy-fallback';
    dialog.setAttribute('aria-label', '手动复制内容');
    const message = document.createElement('p');
    message.textContent = '无法自动复制，请手动复制下面的内容。';
    const input = document.createElement('textarea');
    input.value = text;
    input.readOnly = true;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'button secondary';
    close.textContent = '关闭';
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      dialog.remove();
      opener.focus();
    });
    dialog.append(message, input, close);
    document.body.append(dialog);
    dialog.showModal();
    input.select();
  }

  document.querySelectorAll('[data-copy]').forEach(button => {
    let reset;
    const original = button.innerHTML;
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        clearTimeout(reset);
        button.classList.add('is-copied');
        button.textContent = '已复制 ✓';
        const status = document.getElementById('copy-status');
        if (status) status.textContent = '内容已复制。';
        reset = setTimeout(() => {
          button.innerHTML = original;
          button.classList.remove('is-copied');
        }, 1800);
      } catch {
        manualCopy(button.dataset.copy, button);
      }
    });
  });

  const dialog = document.getElementById('screenshot-dialog');
  document.querySelectorAll('[data-screenshot]').forEach(button => {
    button.addEventListener('click', () => {
      document.getElementById('screenshot-title').textContent = button.dataset.title;
      document.getElementById('screenshot-full').src = button.dataset.screenshot;
      document.getElementById('screenshot-full').alt = button.querySelector('img').alt;
      dialog.showModal();
    });
  });
  document.getElementById('close-screenshot').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });

  syncHeaderHeight();
  if (siteHeader && typeof ResizeObserver !== 'undefined') new ResizeObserver(syncHeaderHeight).observe(siteHeader);
  window.addEventListener('resize', syncHeaderHeight);
  window.addEventListener('hashchange', () => applyHash());
  window.addEventListener('popstate', () => applyHash());
  const initial = resolveHash();
  activate(initial.name);
  if (location.hash) applyHash({ scroll: false });
})();
