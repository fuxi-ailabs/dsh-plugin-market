(() => {
  'use strict';
  document.querySelectorAll('.media-toolbar').forEach(toolbar => {
    const video = toolbar.closest('figure').querySelector('video');
    const button = toolbar.querySelector('[data-video-play]');
    const quality = toolbar.querySelector('[data-video-quality]');
    const status = toolbar.querySelector('[data-video-status]');
    let pendingTime;
    let switching = false;
    let resume = false;
    let failed = false;
    const showError = () => { failed = true; status.textContent = '视频加载失败，请重试或选择 1080p。'; button.textContent = '重试播放'; };
    const play = () => video.play().catch(error => {
      if (error.name === 'AbortError') return;
      if (failed || video.error) showError();
      else status.textContent = '请点击播放继续。';
    });
    toolbar.hidden = false;
    button.addEventListener('click', () => {
      if (failed || video.error) {
        failed = false;
        video.src = quality.value;
        video.load();
        status.textContent = '正在加载视频…';
        play();
        return;
      }
      if (video.paused) {
        status.textContent = '正在加载视频…';
        play();
      } else video.pause();
    });
    video.addEventListener('waiting', () => { status.textContent = '正在缓冲，可选择 1080p 减少等待。'; });
    video.addEventListener('playing', () => { failed = false; status.textContent = ''; button.textContent = '暂停'; });
    video.addEventListener('pause', () => { if (!switching && !failed) button.textContent = '继续播放'; });
    video.addEventListener('ended', () => { status.textContent = ''; button.textContent = '重新播放'; });
    video.addEventListener('error', showError);
    video.querySelector('source')?.addEventListener('error', showError);
    quality.addEventListener('change', () => {
      if (!switching) { pendingTime = video.currentTime; resume = !video.paused; }
      switching = true;
      failed = false;
      status.textContent = '正在切换清晰度…';
      video.src = quality.value;
      video.load();
    });
    video.addEventListener('loadedmetadata', () => {
      if (!switching) return;
      video.currentTime = Math.min(pendingTime || 0, Math.max(0, video.duration - .1));
      switching = false;
      if (resume) play();
      else { status.textContent = ''; button.textContent = video.currentTime ? '继续播放' : '播放演示'; }
    });
  });
})();
