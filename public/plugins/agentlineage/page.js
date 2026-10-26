(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const demo = window.PLUGIN_DEMO;
  let active = demo.operations.length - 1;
  let timer;
  const playButton = byId('play-demo');
  const operationButtons = [...document.querySelectorAll('[data-operation]')];
  function renderOperation(index) {
    active = index;
    const op = demo.operations[index];
    operationButtons.forEach((button, i) => {
      button.classList.toggle('is-active', i === index);
      button.setAttribute('aria-pressed', String(i === index));
    });
    byId('operation-label').textContent = `${op.tool.toUpperCase()} / ${String(index + 1).padStart(2, '0')}`;
    byId('operation-title').textContent = op.title;
    byId('operation-description').textContent = op.description;
    byId('evidence-tool').textContent = op.tool;
    byId('request-ref').textContent = op.requestRef;
    byId('result-ref').textContent = op.resultRef;
    byId('evidence-result').textContent = op.result;
    byId('diff-lines').replaceChildren(...[
      ...op.removed.map(line => ({line, kind:'removed', prefix:'−'})),
      ...op.added.map(line => ({line, kind:'added', prefix:'+'})),
    ].map(({line, kind, prefix}) => {
      const span = document.createElement('span');
      span.className = `diff-${kind}`;
      span.textContent = `${prefix} ${line}`;
      return span;
    }));
  }
  function stopPlayback() {
    clearInterval(timer);
    timer = undefined;
    playButton.replaceChildren();
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden','true'); icon.textContent = '▶';
    playButton.append(icon, ' 自动演示');
    playButton.setAttribute('aria-pressed', 'false');
  }
  operationButtons.forEach((button, index) => button.addEventListener('click', () => {
    stopPlayback(); renderOperation(index);
  }));
  playButton.setAttribute('aria-pressed', 'false');
  playButton.addEventListener('click', () => {
    if (timer) { stopPlayback(); return; }
    renderOperation(0);
    playButton.textContent = '■ 停止演示';
    playButton.setAttribute('aria-pressed', 'true');
    timer = setInterval(() => {
      if (active === demo.operations.length - 1) { stopPlayback(); return; }
      renderOperation(active + 1);
    }, 2200);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopPlayback(); });

  const tabs = [...document.querySelectorAll('.demo-tabs [role=tab]')];
  function activateTab(tab) {
    for (const item of tabs) {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      byId(item.getAttribute('aria-controls')).hidden = !selected;
    }
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); activateTab(tabs[next]); tabs[next].focus(); }
    });
  });

  function manualCopy(text, opener) {
    const dialog = document.createElement('dialog'); dialog.className = 'copy-fallback';
    dialog.setAttribute('aria-label', '手动复制内容');
    const message = document.createElement('p'); message.textContent = '自动复制不可用，请选择下方内容并复制。';
    const input = document.createElement('textarea'); input.value = text; input.readOnly = true;
    input.setAttribute('aria-label', '要复制的内容');
    const close = document.createElement('button'); close.type = 'button'; close.className = 'button secondary'; close.textContent = '关闭';
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { dialog.remove(); opener.focus(); });
    dialog.append(message, input, close); document.body.append(dialog); dialog.showModal(); input.select();
  }
  document.querySelectorAll('[data-copy]').forEach(button => {
    let reset;
    const original = button.innerHTML;
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        clearTimeout(reset); button.classList.add('is-copied'); button.textContent = '已复制 ✓';
        byId('copy-status').textContent = '已复制，可粘贴到 DSH 或终端。';
        reset = setTimeout(() => { button.innerHTML = original; button.classList.remove('is-copied'); }, 1800);
      } catch { manualCopy(button.dataset.copy, button); }
    });
  });

  const dialog = byId('screenshot-dialog');
  document.querySelectorAll('[data-screenshot]').forEach(button => {
    button.addEventListener('click', () => {
      byId('screenshot-title').textContent = button.dataset.title;
      byId('screenshot-full').src = button.dataset.screenshot;
      byId('screenshot-full').alt = button.querySelector('img').alt;
      dialog.showModal();
    });
  });
  byId('close-screenshot').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  renderOperation(active);
})();
