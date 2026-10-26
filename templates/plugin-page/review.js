(() => {
  'use strict';
  const button = document.getElementById('toggle-notes');
  const status = document.getElementById('review-status');
  button.addEventListener('click', () => {
    const show = button.getAttribute('aria-pressed') !== 'true';
    document.documentElement.dataset.templateNotes = show ? 'shown' : 'hidden';
    button.setAttribute('aria-pressed', String(show));
    button.textContent = show ? '隐藏填写提示' : '显示填写提示';
    status.textContent = show ? '填写提示已显示；可关闭提示，查看实际页面布局。' : '填写提示已隐藏；当前展示实际页面布局。';
  });
})();
