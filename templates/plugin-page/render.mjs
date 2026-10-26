// Content is plain text. Keep escaping here so a new plugin cannot inject markup.
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const e = escape;
const copy = (text, label = '复制') => `<button type="button" class="copy-button" data-copy="${e(text)}" aria-label="${e(label)}">${e(label)} <span aria-hidden="true">⧉</span></button>`;
const code = (text, label) => `<div class="code-block"><div class="code-bar"><span>${e(label)}</span>${copy(text)}</div><pre><code>${e(text)}</code></pre></div>`;
const sectionHead = (number, eyebrow, title, description) => `<div class="section-heading"><p class="eyebrow"><span>${number}</span> ${eyebrow}</p><h2>${e(title)}</h2><p class="section-description">${e(description)}</p></div>`;

export function renderPage(p) {
  const x = p.example;
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="${e(p.description)}">
  <meta name="color-scheme" content="dark">
  <meta name="theme-color" content="#090c10">
  <title>${e(p.name)} · Fuxi DSH 插件市场</title>
  <link rel="stylesheet" href="styles.css">
  <script src="demo-data.js" defer></script>
  <script src="page.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#overview">跳到主要内容</a>
  <header class="site-header"><div class="wrap header-inner">
    <a class="brand" href="#overview"><span class="brand-mark" aria-hidden="true">f<span>_</span></span> FUXI <span class="brand-divider">/</span> <span class="brand-sub">DSH PLUGINS</span></a>
    <nav aria-label="页面导航"><a href="#example">动手试试</a><a href="#comparison">前后对比</a><a href="#use-cases">使用场景</a><a class="nav-cta" href="#quickstart">开始使用 <span aria-hidden="true">↗</span></a></nav>
  </div></header>
  <main>
    <section id="overview" class="wrap hero" aria-labelledby="page-title">
      <div class="hero-copy"><p class="eyebrow"><span class="live-dot" aria-hidden="true"></span> ${e(p.category)}</p>
        <div class="plugin-name">${e(p.name)} <span class="version">v${e(p.version)}</span></div>
        <h1 id="page-title">${p.headline.map((line, i) => `<span${i ? ' class="accent"' : ''}>${e(line)}</span>`).join('')}</h1>
        <p class="lede">${e(p.description)}</p>
        <div class="actions"><a class="button primary" href="#example">试试最小例子 <span aria-hidden="true">↓</span></a><a class="button secondary" href="#quickstart">安装与使用 <span aria-hidden="true">↗</span></a></div>
        <p class="compatibility"><span aria-hidden="true">◈</span> ${e(p.compatibility)}</p>
      </div>
      <div class="hero-visual" aria-label="${e(p.promise)}">
        <div class="window-bar"><div class="window-dots" aria-hidden="true"><i></i><i></i><i></i></div><span>${e(p.preview.terminal)}</span><span class="micro-label">流程示意</span></div>
        <div class="trace-question"><span class="prompt-sign">›</span> ${e(p.heroQuestion)}</div>
        <div class="trace-map"><div class="trace-file"><span aria-hidden="true">▤</span><strong>${e(p.heroFile)}</strong><span class="micro-label">${e(p.preview.objectLabel)}</span></div><div class="trace-connector" aria-hidden="true"></div><div class="trace-nodes">${p.heroNodes.map((n,i) => `<div><span class="node-dot" aria-hidden="true"></span><span>${e(n)}</span><small>0${i+1}</small></div>`).join('')}</div><div class="trace-session"><span aria-hidden="true">⌁</span> ${e(p.preview.contextLabel)} <span>${e(p.preview.contextMeta)}</span></div></div>
        <div class="trace-answer"><span class="accent" aria-hidden="true">↳</span><p>${e(p.heroAnswer)}</p></div>
      </div>
      <div class="hero-bottom"><span class="mono">${e(p.promise)}</span><div>${p.facts.map(f=>`<span><i aria-hidden="true">✓</i> ${e(f)}</span>`).join('')}</div><a href="#example" aria-label="向下查看最小例子">SCROLL TO EXPLORE ↓</a></div>
    </section>

    <section id="example" class="wrap section" aria-labelledby="example-title">
      ${sectionHead('01', 'THE SMALLEST EXAMPLE', x.title, x.description).replace('<h2>', '<h2 id="example-title">')}
      <div class="demo-shell"><div class="demo-toolbar"><span><span class="live-dot" aria-hidden="true"></span> ${e(x.file)}</span><span class="demo-badge">${e(x.label)}</span></div>
        <div class="demo-question"><span class="mono">YOU ASK</span><p>${e(x.question)}</p><button id="play-demo" type="button" class="play-button"><span aria-hidden="true">▶</span> 自动演示</button></div>
        <div class="demo-workspace"><aside class="demo-timeline" aria-label="选择一次演示操作"><div class="timeline-label"><span>${e(x.ui.events)}</span><span>${x.operations.length} EVENTS</span></div>
          ${x.operations.map((op,i)=>`<button type="button" class="event-button${i===x.operations.length-1?' is-active':''}" data-operation="${i}" aria-pressed="${i===x.operations.length-1}"><span class="event-index">0${i+1}</span><span><strong>${e(op.title)}</strong><small>${e(op.tool)} <span aria-hidden="true">·</span> ${e(x.ui.status)}</small></span><span class="event-arrow" aria-hidden="true">↗</span></button>`).join('')}
          <div class="timeline-session"><span class="mono">${e(x.ui.context)}</span><code>${e(x.session)}</code><span>${e(x.ui.contextNote)}</span></div></aside>
          <div class="demo-detail"><div class="detail-top"><p class="mono" id="operation-label">${e(x.operations.at(-1).tool.toUpperCase())} / ${String(x.operations.length).padStart(2,'0')}</p><span class="success-badge">✓ ${e(x.ui.status)}</span></div><h3 id="operation-title">${e(x.operations.at(-1).title)}</h3><p id="operation-description">${e(x.operations.at(-1).description)}</p>
            <div class="demo-tabs" role="tablist" aria-label="查看演示结果"><button id="tab-diff" type="button" role="tab" aria-selected="true" aria-controls="panel-diff" tabindex="0">${e(x.ui.changeTab)}</button><button id="tab-evidence" type="button" role="tab" aria-selected="false" aria-controls="panel-evidence" tabindex="-1">${e(x.ui.evidenceTab)}</button></div>
            <div id="panel-diff" role="tabpanel" aria-labelledby="tab-diff"><div class="diff-file mono">${e(x.file)}</div><pre class="diff-lines" id="diff-lines"></pre></div>
            <div id="panel-evidence" role="tabpanel" aria-labelledby="tab-evidence" hidden><dl class="evidence-list"><div><dt>${e(x.ui.action)}</dt><dd id="evidence-tool"></dd></div><div><dt>${e(x.ui.contextField)}</dt><dd>${e(x.session)}</dd></div><div><dt>${e(x.ui.request)}</dt><dd id="request-ref"></dd></div><div><dt>${e(x.ui.result)}</dt><dd id="result-ref"></dd></div><div><dt>${e(x.ui.resultText)}</dt><dd id="evidence-result"></dd></div></dl></div>
          </div></div>
        <div class="demo-answer"><span class="answer-icon" aria-hidden="true">↳</span><p><strong>得到的答案</strong>${e(x.answer)}</p></div>
      </div>
      <p class="media-note">${e(x.note)}</p>
      ${x.video ? `<figure id="recording" class="video-demo"><figcaption><span class="mono accent">${e(x.video.label ?? 'VIDEO DEMO')}</span><strong>${e(x.video.title)}</strong>${x.video.description ? `<p>${e(x.video.description)}</p>` : ''}</figcaption><video controls playsinline preload="none" poster="${e(x.video.poster)}" aria-label="${e(x.video.title)}"><source src="${e(x.video.src)}" type="${x.video.src.endsWith('.webm')?'video/webm':'video/mp4'}"><track kind="captions" src="${e(x.video.captions)}" srclang="zh" label="中文字幕" default>浏览器不支持视频播放。</video></figure>` : ''}
      <details class="reproduce"><summary><span><span class="accent" aria-hidden="true">⌘</span> 在自己的 DSH 里复现这个例子</span><span aria-hidden="true">＋</span></summary><div>${code(x.prompt, '发送给 DSH · 先完成下方安装步骤')}</div></details>
      <noscript><p class="noscript-note">启用 JavaScript 可切换操作和证据。当前示例的结论与复现提示词已显示在页面中。</p></noscript>
    </section>

    <section id="comparison" class="wrap section" aria-labelledby="comparison-title">
      ${sectionHead('02', 'BEFORE / AFTER', p.comparison.title, p.comparison.description).replace('<h2>', '<h2 id="comparison-title">')}
      <div class="comparison-grid">${['before','after'].map(key=>{const c=p.comparison[key];return `<article class="comparison-card ${key}"><div class="comparison-copy"><span class="mono">${key==='before'?'− BEFORE':'+ AFTER / '+e(p.name)}</span><h3>${e(c.title)}</h3><p>${e(c.description)}</p></div><button type="button" class="screenshot-button" data-screenshot="${e(c.image)}" data-title="${e(c.title)}" aria-label="放大查看：${e(c.title)}"><img src="${e(c.image)}" width="1280" height="720" alt="${e(c.alt)}" loading="lazy"><span>现有运行截图 <span aria-hidden="true">⤢</span></span></button></article>`;}).join('')}</div>
      <div class="takeaways">${p.comparison.takeaways.map(t=>`<p><span aria-hidden="true">↳</span> ${e(t)}</p>`).join('')}</div>
    </section>

    <section id="use-cases" class="wrap section" aria-labelledby="cases-title">
      ${sectionHead('03', 'WHEN TO USE IT', '带着你的问题来。', '这些时候，可以让插件帮你找到下一步要看的材料。').replace('<h2>', '<h2 id="cases-title">')}
      <div class="case-grid">${p.useCases.map(c=>`<article class="case-card"><p class="mono case-tag">${e(c.tag)}</p><h3>${e(c.title)}</h3><blockquote>${e(c.question)}</blockquote><p>${e(c.description)}</p>${copy(c.prompt, '复制提问')}</article>`).join('')}</div>
    </section>

    <section id="quickstart" class="wrap section" aria-labelledby="start-title">
      ${sectionHead('04', 'GET STARTED', p.quickstart.title, p.quickstart.description).replace('<h2>', '<h2 id="start-title">')}
      <div class="quickstart-layout"><aside class="setup-summary"><span class="terminal-icon" aria-hidden="true">&gt;_</span><h3>${e(p.quickstart.summaryTitle)}</h3><p>${e(p.compatibility)}</p><a class="text-link" href="${e(p.links[0].url)}">完整安装文档 ↗</a><p class="setup-note">先做最小实验，再分析真实任务。每一步都有可核对的结果。</p></aside>
        <ol class="steps">${p.quickstart.steps.map((s,i)=>`<li><span class="step-index" aria-hidden="true">0${i+1}</span><div><h3>${e(s.title)}</h3><p>${e(s.description)}</p>${code(s.code, s.codeLabel)}${s.note?`<p class="step-note">${e(s.note)}</p>`:''}</div></li>`).join('')}</ol>
      </div>
    </section>

    <section id="details" class="wrap section details-section" aria-labelledby="details-title"><div><p class="eyebrow"><span>05</span> GOOD TO KNOW</p><h2 id="details-title">使用前，了解这几点。</h2><p class="section-description">知道记录覆盖到哪里，才能更准确地理解结果。</p></div><div class="boundary-list">${p.boundaries.map(b=>`<details><summary>${e(b.title)}<span aria-hidden="true">＋</span></summary><p>${e(b.description)}</p></details>`).join('')}</div></section>
    <div class="wrap final-cta"><div><span class="mono accent">${e(p.closing.eyebrow)}</span><p>${e(p.closing.title)}</p></div><a class="button primary" href="#quickstart">开始使用 ${e(p.name)} <span aria-hidden="true">↗</span></a></div>
  </main>
  <footer class="wrap footer"><a class="brand" href="#overview"><span class="brand-mark" aria-hidden="true">f<span>_</span></span> FUXI AI LABS</a><span>${e(p.name)} / DSH PLUGIN</span><div>${p.links.map(l=>`<a href="${e(l.url)}">${e(l.label)}</a>`).join('')}<a href="#overview">回到顶部 ↑</a></div></footer>
  <p id="copy-status" class="sr-only" role="status" aria-live="polite"></p>
  <dialog id="screenshot-dialog" class="screenshot-dialog" aria-labelledby="screenshot-title"><div class="dialog-bar"><h2 id="screenshot-title">运行截图</h2><button id="close-screenshot" type="button">关闭 ×</button></div><img id="screenshot-full" alt=""></dialog>
</body>
</html>
`.replace(/^[ \t]+$/gm, '');
}
