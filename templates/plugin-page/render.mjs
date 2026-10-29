import { renderFileHistory } from './file-history.mjs';

// Content is plain text. Keep escaping here so a new plugin cannot inject markup.
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const e = escape;
const copy = (text, label = '复制') => `<button type="button" class="copy-button" data-copy="${e(text)}" aria-label="${e(label)}">${e(label)} <span aria-hidden="true">⧉</span></button>`;
const code = (text, label) => `<div class="code-block"><div class="code-bar"><span>${e(label)}</span>${copy(text)}</div><pre><code>${e(text)}</code></pre></div>`;
const sectionHead = (title, description) => `<div class="section-heading"><h2>${e(title)}</h2>${description ? `<p class="section-description">${e(description)}</p>` : ''}</div>`;

function renderDemoBlock(block) {
  const heading = block.title ? `<h3>${e(block.title)}</h3>` : '';
  switch (block.type) {
    case 'text': return `<div class="demo-content-block">${heading}<p>${e(block.text)}</p></div>`;
    case 'list': return `<div class="demo-content-block">${heading}<ul>${block.items.map(item => `<li>${e(item)}</li>`).join('')}</ul></div>`;
    case 'code': return `<div class="demo-content-block">${heading}${code(block.code, block.codeLabel || '代码')}</div>`;
    case 'image': return `<figure class="demo-content-block demo-image">${heading}<button type="button" class="screenshot-button" data-screenshot="${e(block.src)}" data-title="${e(block.title || block.alt)}" aria-label="放大查看：${e(block.title || block.alt)}"><img src="${e(block.src)}" alt="${e(block.alt)}" loading="lazy"><span>点击放大 <span aria-hidden="true">⤢</span></span></button>${block.caption ? `<figcaption>${e(block.caption)}</figcaption>` : ''}</figure>`;
    default: throw new Error(`Unknown demo block: ${block.type}`);
  }
}

export function renderPage(p, {preview = false} = {}) {
  const x = p.example;
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="${e(p.description)}">
  <meta name="color-scheme" content="light">
  <meta name="theme-color" content="#f7f9fb">
  <title>${preview ? '插件介绍页模板 · 预览与评审' : e(p.name) + ' · Fuxi DSH 插件市场'}</title>
  <link rel="stylesheet" href="styles.css">${preview ? '\n  <link rel="stylesheet" href="review.css">' : ''}
  <script src="demo-data.js" defer></script>
  <script src="page.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#overview">跳到主要内容</a>${preview ? `
  <aside class="template-banner" aria-label="模板预览与评审"><div class="wrap">
    <div class="review-topline"><h2>插件介绍页模板</h2><div class="review-actions"><a href="content.example.json" download="plugin-page-content.example.json">下载内容模板 ↓</a><a href="https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/agentlineage/">AgentLineage ↗</a></div></div>
  </div></aside>` : ''}
  <header class="site-header"><div class="wrap header-inner">
    <a class="brand" href="#overview"><span class="brand-mark" aria-hidden="true">f<span>_</span></span> FUXI <span class="brand-sub">/ DSH 插件</span></a>
    <nav aria-label="页面导航"><a href="#use-cases">适合谁用</a><a href="#example">看例子</a><a class="nav-docs" href="${e(p.links[0].url)}">使用文档 ↗</a><a class="nav-cta" href="#quickstart">安装使用</a></nav>
  </div></header>
  <main>
    <section id="overview" class="wrap hero" aria-labelledby="page-title">
      <div class="hero-copy">
        <div class="plugin-name">${e(p.name)} <span class="version">v${e(p.version)}</span></div>
        <h1 id="page-title">${p.headline.map((line, i) => `<span${i ? ' class="accent"' : ''}>${e(line)}</span>`).join('')}</h1>
        <p class="lede">${e(p.description)}</p>
        <div class="hero-install" aria-label="安装命令">${code(p.install.code, p.install.codeLabel)}<p>${e(p.install.note)} <a href="#quickstart">安装步骤 ↓</a></p></div>
        <div class="actions"><a class="button primary" href="#example">功能演示</a><a class="button secondary" href="#quickstart">安装使用</a></div>
        <p class="compatibility">${e(p.compatibility)}</p>
        <p class="requirements-link">${e(p.requirements.summary)} <a href="#details">使用条件 ↓</a></p>
      </div>
      <figure class="hero-visual">
        <button type="button" class="screenshot-button hero-image-button" data-screenshot="${e(p.heroMedia.image)}" data-title="${e(p.heroMedia.title)}" aria-label="放大查看：${e(p.heroMedia.title)}"><img src="${e(p.heroMedia.image)}" width="1280" height="720" alt="${e(p.heroMedia.alt)}"><span>点击放大 <span aria-hidden="true">⤢</span></span></button>
        <figcaption><strong>${e(p.heroMedia.title)}</strong>${p.heroMedia.description ? `<p>${e(p.heroMedia.description)}</p>` : ''}</figcaption>
      </figure>
    </section>

    <section id="use-cases" class="wrap section" aria-labelledby="cases-title">
      ${sectionHead('使用场景与适合人群').replace('<h2>', '<h2 id="cases-title">')}
      <div class="case-grid">${p.useCases.map(c=>`<article class="case-card"><p class="case-audience"><span>适合</span>${e(c.audience)}</p><h3>${e(c.title)}</h3><blockquote>${e(c.question)}</blockquote>${c.description ? `<p>${e(c.description)}</p>` : ''}${copy(c.prompt, '复制提问')}</article>`).join('')}</div>
    </section>

    <section id="example" class="wrap section" aria-labelledby="example-title">
      ${sectionHead(x.title, x.description).replace('<h2>', '<h2 id="example-title">')}
      ${x.interactive ? renderFileHistory(x.interactive, e) : ''}
      ${x.blocks?.length ? `<div class="demo-content">${x.blocks.map(renderDemoBlock).join('')}</div>` : ''}
      ${x.note ? `<p class="media-note">${e(x.note)}</p>` : ''}
      ${x.video ? `<figure id="recording" class="video-demo"><figcaption><strong>${e(x.video.title)}</strong>${x.video.description ? `<p>${e(x.video.description)}</p>` : ''}</figcaption><video controls playsinline preload="none" poster="${e(x.video.poster)}" aria-label="${e(x.video.title)}"><source src="${e(x.video.src)}" type="${x.video.src.endsWith('.webm')?'video/webm':'video/mp4'}"><track kind="captions" src="${e(x.video.captions)}" srclang="zh" label="中文字幕" default>浏览器不支持视频播放。</video></figure>` : preview ? `<figure id="recording" class="video-demo"><figcaption><strong>操作录像</strong></figcaption><div class="video-placeholder"><span>视频占位</span></div></figure>` : ''}
      ${x.prompt ? `<details class="reproduce"><summary><span><span class="accent" aria-hidden="true">⌘</span> 在 DSH 中复现</span><span aria-hidden="true">＋</span></summary><div>${code(x.prompt, '发送给 DSH')}</div></details>` : ''}
      ${x.interactive ? '<noscript><p class="noscript-note">启用 JavaScript 后可切换演示步骤。</p></noscript>' : ''}
    </section>

    <section id="comparison" class="wrap section" aria-labelledby="comparison-title">
      ${sectionHead(p.comparison.title, p.comparison.description).replace('<h2>', '<h2 id="comparison-title">')}
      <div class="comparison-grid">${['before','after'].map(key=>{const c=p.comparison[key];return `<article class="comparison-card ${key}"><div class="comparison-copy"><h3>${e(c.title)}</h3><p>${e(c.description)}</p></div><button type="button" class="screenshot-button" data-screenshot="${e(c.image)}" data-title="${e(c.title)}" aria-label="放大查看：${e(c.title)}"><img src="${e(c.image)}" width="1280" height="720" alt="${e(c.alt)}" loading="lazy"><span>${preview ? '截图占位' : '运行截图 · 点击放大'} <span aria-hidden="true">⤢</span></span></button></article>`;}).join('')}</div>
      <div class="takeaways">${p.comparison.takeaways.map(t=>`<p><span aria-hidden="true">↳</span> ${e(t)}</p>`).join('')}</div>
    </section>

    <section id="quickstart" class="wrap section" aria-labelledby="start-title">
      ${sectionHead(p.quickstart.title, p.quickstart.description).replace('<h2>', '<h2 id="start-title">')}
      <div id="details" class="install-requirements">
        <div class="requirements-row"><strong>使用条件</strong><dl>${p.requirements.items.map(r=>`<div><dt>${e(r.label)}</dt><dd>${e(r.value)}</dd></div>`).join('')}</dl></div>
        ${p.requirements.description ? `<p>${e(p.requirements.description)}</p>` : ''}
        <details class="install-boundaries"><summary>适用范围和限制 <span aria-hidden="true">＋</span></summary><div>${p.boundaries.map(b=>`<div><strong>${e(b.title)}</strong><p>${e(b.description)}</p></div>`).join('')}</div></details>
      </div>
      <ol class="steps">${p.quickstart.steps.map((s,i)=>`<li id="step-${i+1}"><span class="step-index" aria-hidden="true">${i+1}</span><div><p class="step-description"><strong>${e(s.title)}</strong> ${e(s.description)}${s.note ? ` ${e(s.note)}` : ''} <span class="command-context">${e(s.codeLabel)}</span></p><div class="install-command" aria-label="${e(s.codeLabel)}"><pre><code>${e(s.code)}</code></pre>${copy(s.code, '复制')}</div></div></li>`).join('')}</ol>
      <details class="install-checks"><summary>检查结果 <span aria-hidden="true">＋</span></summary><ol>${p.quickstart.steps.map(s=>`<li><strong>${e(s.title)}</strong><p>${e(s.expected)}</p></li>`).join('')}</ol></details>
      <p class="help-link"><a href="${e(p.links[0].url)}">${preview ? '模板文档' : '安装与使用文档'} ↗</a></p>
    </section>
  </main>
  <footer class="wrap footer"><span>Fuxi AI Labs</span><div>${p.links.map(l=>`<a href="${e(l.url)}">${e(l.label)}</a>`).join('')}<a href="#overview">回到顶部 ↑</a></div></footer>
  <p id="copy-status" class="sr-only" role="status" aria-live="polite"></p>
  <dialog id="screenshot-dialog" class="screenshot-dialog" aria-labelledby="screenshot-title"><div class="dialog-bar"><h2 id="screenshot-title">运行截图</h2><button id="close-screenshot" type="button">关闭 ×</button></div><img id="screenshot-full" alt=""></dialog>
</body>
</html>
`.replace(/^[ \t]+$/gm, '');
}
