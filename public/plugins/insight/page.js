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
    return {
      name: panel?.dataset.panel || 'overview',
      target: target || null,
    };
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
    input.setAttribute('aria-label', '要复制的内容');
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

  const carousel = document.querySelector('[data-carousel]');
  if (carousel) {
    const track = carousel.querySelector('[data-carousel-track]');
    const slides = [...carousel.querySelectorAll('[data-carousel-slide]')];
    const toggle = carousel.querySelector('[data-carousel-toggle]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let index = 0;
    let timer;
    let paused = false;

    const showSlide = (next) => {
      index = (next + slides.length) % slides.length;
      if (reducedMotion.matches) {
        track.style.transform = 'none';
        slides.forEach(slide => slide.removeAttribute('aria-hidden'));
        return;
      }
      track.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((slide, slideIndex) => {
        slide.setAttribute('aria-hidden', String(slideIndex !== index));
      });
    };

    const stop = () => {
      window.clearInterval(timer);
      timer = undefined;
    };

    const start = () => {
      stop();
      if (paused || reducedMotion.matches || document.hidden) return;
      timer = window.setInterval(() => showSlide(index + 1), 5200);
    };

    const syncToggle = () => {
      if (!toggle) return;
      toggle.hidden = reducedMotion.matches;
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.textContent = paused ? '继续轮播' : '暂停轮播';
    };

    const setPaused = next => {
      paused = next;
      syncToggle();
      if (paused) stop();
      else start();
    };

    toggle?.addEventListener('click', () => setPaused(!paused));
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    carousel.addEventListener('focusin', stop);
    carousel.addEventListener('focusout', event => {
      if (!carousel.contains(event.relatedTarget)) start();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });
    reducedMotion.addEventListener?.('change', () => {
      syncToggle();
      showSlide(index);
      start();
    });
    slides.forEach(slide => {
      const image = slide.querySelector('img');
      if (!image) return;
      const preload = new Image();
      preload.src = image.getAttribute('src');
    });
    syncToggle();
    showSlide(0);
    start();
  }

  syncHeaderHeight();
  if (siteHeader && typeof ResizeObserver !== 'undefined') new ResizeObserver(syncHeaderHeight).observe(siteHeader);
  window.addEventListener('resize', syncHeaderHeight);
  window.addEventListener('hashchange', () => applyHash());
  window.addEventListener('popstate', () => applyHash());

  const initial = resolveHash();
  activate(initial.name);
  if (location.hash) applyHash({ scroll: false });
})();
