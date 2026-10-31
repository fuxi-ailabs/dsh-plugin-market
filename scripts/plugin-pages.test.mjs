import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { marketInstallTarget } from '@deepseek-ai/dsh-plugin-market-index';
import { renderPage } from '../templates/plugin-page/render.mjs';
import { validateContent } from '../templates/plugin-page/validate.mjs';

const starter = JSON.parse(await readFile(new URL('../templates/plugin-page/content.example.json', import.meta.url), 'utf8'));
const agent = JSON.parse(await readFile(new URL('../content/plugins/agentlineage.json', import.meta.url), 'utf8'));
const verifier = JSON.parse(await readFile(new URL('../content/plugins/dt-verify.json', import.meta.url), 'utf8'));
const catalog = JSON.parse(await readFile(new URL('../public/index.json', import.meta.url), 'utf8'));

test('a generic plugin needs no file-history fields or controls', () => {
  validateContent(starter);
  const html = renderPage(starter);
  assert(!html.includes('id="play-demo"'));
  assert(!html.includes('class="demo-timeline"'));
  assert(html.includes('id="faq"'));
});

test('demo content can combine text, lists, code and an image', () => {
  const page = structuredClone(starter);
  page.example.blocks = [
    { type: 'text', text: '输入资料' },
    { type: 'list', items: ['操作', '结果'] },
    { type: 'code', code: 'example --help' },
    { type: 'image', src: 'assets/demo.jpg', alt: '演示截图' },
  ];
  validateContent(page);
  const html = renderPage(page);
  assert(html.includes('example --help'));
  assert(html.includes('演示截图'));
  assert(html.indexOf('输入资料') < html.indexOf('example --help'));
});

test('a video can be the only demo content', () => {
  const page = structuredClone(starter);
  page.example = { title: '视频演示', video: agent.example.video };
  validateContent(page);
  const html = renderPage(page);
  assert(html.includes('<video controls'));
  assert(!html.includes('id="play-demo"'));
});

test('a video loops muted only when the page opts in', () => {
  const page = structuredClone(starter);
  page.example = { title: '视频演示', video: agent.example.video };
  assert(renderPage(page).includes('<video controls playsinline preload="none"'));
  page.example.video = { ...agent.example.video, loop: true };
  validateContent(page);
  assert(renderPage(page).includes('<video controls autoplay muted loop playsinline preload="auto"'));
  page.example.video.loop = 'yes';
  assert.throws(() => validateContent(page), /video.loop/);
});

test('empty demos and unsupported content are rejected', () => {
  const page = structuredClone(starter);
  page.example = { title: '演示' };
  assert.throws(() => validateContent(page), /Add demo content/);
  page.example.blocks = [{ type: 'html', text: '<script></script>' }];
  assert.throws(() => validateContent(page), /Unknown demo block/);
  page.example.blocks = [{ type: 'image', src: '../private.jpg', alt: '图片' }];
  assert.throws(() => validateContent(page), /local reviewed JPEG/);
});

test('FAQ and demo text are escaped instead of becoming markup', () => {
  const page = structuredClone(starter);
  page.faq = [{ question: '<img src=x onerror=alert(1)>', answer: '<script>alert(1)</script>' }];
  page.example.blocks = [{ type: 'text', text: '<iframe src=x></iframe>' }];
  validateContent(page);
  const html = renderPage(page);
  assert(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert(!html.includes('<iframe src=x>'));
});

test('FAQ entries require a question and answer', () => {
  const page = structuredClone(starter);
  page.faq = [];
  assert.throws(() => validateContent(page), /faq/);
  page.faq = [{ question: '问题', answer: '' }];
  assert.throws(() => validateContent(page), /faq.answer/);
});

test('AgentLineage keeps its interactive demo and current installation contract', () => {
  validateContent(agent);
  const html = renderPage(agent);
  assert(html.includes('id="play-demo"'));
  assert(html.includes('id="tab-evidence"'));
  assert.equal(agent.install.code, agent.quickstart.steps[0].code);
  const plugin = catalog.plugins.find(item => item.name === '@fuxi-ailabs/dsh-agentlineage');
  const version = plugin.versions.find(item => item.version === agent.version);
  assert(version, 'the introduction must describe a catalog version');
  assert(agent.install.code.includes(marketInstallTarget(plugin.name, version).spec));
  assert(agent.requirements.summary.includes('无需另装 Python 或 Core'));
  assert(!html.includes('AGENTLINEAGE_PYTHON'));
  assert(agent.quickstart.steps.at(-1).note.includes('复用 DSH 登录'));
});

test('HarmonyOS Code Verifier installs the catalog version under the market banner', () => {
  validateContent(verifier);
  const plugin = catalog.plugins.find(item => item.name === '@fuxi-ailabs/dsh-dt-verify');
  const version = plugin.versions.find(item => item.version === verifier.version);
  assert(version, 'the introduction must describe a catalog version');
  assert(verifier.install.code.includes(marketInstallTarget(plugin.name, version).spec));
  assert(verifier.quickstart.steps.some(step => step.code === verifier.install.code));
  const html = renderPage(verifier);
  assert(html.includes('class="market-brand"'));
  assert(html.includes('aria-current="page">鸿蒙代码验证器</a>'));
  assert(html.includes('<video controls'));
  assert(html.includes('id="faq"'));
});

test('HarmonyOS Code Verifier guide keeps the market link in its banner at every width', async () => {
  const html = await readFile(new URL('../public/plugins/dt-verify/guide.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../public/plugins/dt-verify/docs.css', import.meta.url), 'utf8');
  assert(html.includes('<a class="crumb-market" href="https://fuxi-ailabs.github.io/dsh-plugin-market/">Fuxi通用DSH组件市场</a>'));
  assert(!/\.crumb-market[^{]*\{[^}]*display:\s*none/.test(css), 'the market link must stay visible on narrow screens');
});

test('Session Audit keeps existing evidence, video space and install contract', async () => {
  const html = await readFile(new URL('../public/plugins/audit/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../public/plugins/audit/styles.css', import.meta.url), 'utf8');
  const plugin = catalog.plugins.find(item => item.name === '@fuxi-ailabs/dsh-audit-bundle');
  const version = plugin.versions[0].version;
  assert(html.includes('class="market-brand"'));
  assert(html.includes('class="market-current"'));
  assert(html.includes('assets/audit-workbench.jpg'));
  assert(html.includes('assets/audit-flyout.jpg'));
  assert(html.includes('id="recording"'));
  assert(html.includes('操作录像待补充'));
  assert(html.includes('@fuxi-ailabs/dsh-runtime-bundle@1.1.3'));
  assert(html.includes(`@fuxi-ailabs/dsh-audit-bundle@${version}`));
  assert(html.includes('~/.dsh-audit/&lt;session-id&gt;/&lt;run-id&gt;/'));
  assert(html.includes('data-copy="dsh plugin --profile &lt;profile&gt; add @fuxi-ailabs/dsh-runtime-bundle@1.1.3 @fuxi-ailabs/dsh-audit-bundle@1.1.1"'));
  assert(html.includes('id="scenarios"'));
  assert(html.includes('适合 / SKILL 维护者'));
  assert(plugin.versions.some(item => item.version === '1.0.1'));
  assert(html.includes('turn 引用可反向定位到 Trajectory'));
  assert(!/\.market-current[^{]*\{[^}]*display:\s*none/.test(css));
});

test('Insight and Static Check keep both banner links visible at narrow widths', async () => {
  const pages = [
    ['insight', 'Insight'],
    ['static-check', 'Static Check'],
  ];
  for (const [slug, name] of pages) {
    const html = await readFile(new URL(`../public/plugins/${slug}/index.html`, import.meta.url), 'utf8');
    const css = await readFile(new URL(`../public/plugins/${slug}/styles.css`, import.meta.url), 'utf8');
    assert(html.includes('class="market-brand"'));
    assert(html.includes(`class="market-current" href="#top" aria-current="page">${name}</a>`));
    const pageJs = await readFile(new URL(`../public/plugins/${slug}/page.js`, import.meta.url), 'utf8');
    assert(!/\.market-current[^{]*\{[^}]*display:\s*none/.test(css), `${name} must keep the component link visible on narrow screens`);
    assert(!/\.market-separator[^{]*\{[^}]*display:\s*none/.test(css), `${name} must keep the breadcrumb separator visible on narrow screens`);
    assert(!/\.site-header\s*\{[^}]*position:\s*relative/.test(css), `${name} must keep the banner sticky on narrow screens`);
    assert(css.includes('--site-header-height'), `${name} must offset sticky tabs by banner height`);
    assert(pageJs.includes('ResizeObserver'), `${name} must track the actual banner height`);
  }
});

test('market docs match the currently installable Insight and Static Check versions', async () => {
  const insight = await readFile(new URL('../public/plugins/insight/index.html', import.meta.url), 'utf8');
  const insightCss = await readFile(new URL('../public/plugins/insight/styles.css', import.meta.url), 'utf8');
  const staticCheck = await readFile(new URL('../public/plugins/static-check/index.html', import.meta.url), 'utf8');
  const staticCheckCss = await readFile(new URL('../public/plugins/static-check/styles.css', import.meta.url), 'utf8');
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  assert(insight.includes('<dt>Runtime Bundle</dt>'));
  assert(insight.includes('dsh-runtime-bundle@1.1.3'));
  assert(insight.includes('dsh-insight-bundle@1.1.1'));
  assert(insight.includes('DSH BUNDLE · dsh-insight-bundle · v1.1.1'));
  const installPosition = insight.indexOf('<section id="install">');
  const requirementsPosition = insight.indexOf('<section id="requirements">');
  assert(requirementsPosition > -1 && requirementsPosition < installPosition);
  const quickStart = insight.slice(installPosition, insight.indexOf('<section id="first-session">'));
  assert(quickStart.indexOf('dsh plugin --profile') < quickStart.indexOf('https://fuxi-ailabs.github.io/dsh-plugin-market/index.json'));
  assert(insight.includes('<code>--out &lt;dir&gt;</code>'));
  assert(insight.includes('可用逗号或空格分隔'));
  assert(insight.includes('服务可用时仍正常导入'));
  assert(insight.includes('~/.dsh-insight/dsh-score/&lt;sid&gt;.json'));
  assert.equal((insight.match(/data-carousel-slide/g) || []).length, 5);
  assert(!insight.includes('carousel-ui'));
  const insightPageJs = await readFile(new URL('../public/plugins/insight/page.js', import.meta.url), 'utf8');
  assert(insightPageJs.includes('setInterval') && insightPageJs.includes('data-carousel-track'));
  assert(insightPageJs.includes("track.style.transform = 'none'"));
  assert(insightPageJs.includes("removeAttribute('aria-hidden')"));
  assert(insight.includes('data-carousel-toggle'));
  assert(insightPageJs.includes("carousel.querySelector('[data-carousel-toggle]')"));
  assert(insightPageJs.includes("toggle.textContent = paused ? '继续轮播' : '暂停轮播'"));
  assert(insightPageJs.includes("carousel.addEventListener('focusin', stop)"));
  assert(insightCss.includes('.hero-carousel .carousel-track { display: block;'));
  assert(insightCss.includes('.carousel-toggle'));
  assert(insight.includes('data-copy="dsh plugin --profile &lt;profile&gt; add @fuxi-ailabs/dsh-runtime-bundle@1.1.3 @fuxi-ailabs/dsh-insight-bundle@1.1.1"'));
  assert(insightPageJs.includes('navigator.clipboard.writeText(button.dataset.copy)'));
  assert(insightCss.includes('.install-command'));
  assert(insight.includes('context-insight@0.2.41'));
  assert(insight.includes('~/.dsh-insight/runtime/0.2.41/'));
  assert(insight.includes('autoInstall: true') && insight.includes('autoStart: true'));
  assert(staticCheck.includes('dsh-runtime-bundle@1.1.3'));
  assert(staticCheck.includes('dsh-static-check-bundle@1.1.2'));
  const staticCheckPageJs = await readFile(new URL('../public/plugins/static-check/page.js', import.meta.url), 'utf8');
  assert(staticCheck.includes('data-copy="dsh plugin --profile &lt;profile&gt; add @fuxi-ailabs/dsh-runtime-bundle@1.1.3 @fuxi-ailabs/dsh-static-check-bundle@1.1.2"'));
  assert(staticCheckPageJs.includes('navigator.clipboard.writeText(button.dataset.copy)'));
  assert(staticCheckCss.includes('.install-command'));
  assert(staticCheck.includes('1193fa77e27ed01d657de7df1db881b61114d569'));
  assert(staticCheck.includes('2.6.0-dev.1193fa7'));
  assert(staticCheck.includes('~/.dsh-sift/runtime/2.6.0-dev.1193fa7/'));
  assert.equal(catalog.plugins.find(item => item.name === '@fuxi-ailabs/dsh-insight-bundle').versions[0].version, '1.1.1');
  assert.equal(catalog.plugins.find(item => item.name === '@fuxi-ailabs/dsh-static-check-bundle').versions[0].version, '1.1.2');
  assert(readme.includes('| Insight · 会话导入与评分 | `1.1.1` |'));
  assert(readme.includes('| Static Check · Skill 静态检查 | `1.1.2` |'));
});

test('Skill Eval keeps its workbench, video space and shared-runtime install contract', async () => {
  const html = await readFile(new URL('../public/plugins/skill-eval/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../public/plugins/skill-eval/styles.css', import.meta.url), 'utf8');
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  const plugin = catalog.plugins.find(item => item.name === '@fuxi-ailabs/dsh-eval-bundle');
  const version = plugin.versions[0].version;
  assert.equal(version, '1.1.3');
  assert(html.includes('class="market-brand"'));
  assert(html.includes('class="market-current"'));
  assert(html.includes('assets/skill-eval-workbench.jpg'));
  assert(html.includes('id="recording"'));
  assert(html.includes('操作录像待补充'));
  assert(html.includes('@fuxi-ailabs/dsh-runtime-bundle@1.1.3'));
  assert(html.includes('data-copy="dsh plugin --profile &lt;profile&gt; add @fuxi-ailabs/dsh-runtime-bundle@1.1.3 @fuxi-ailabs/dsh-eval-bundle@1.1.3"'));
  assert(html.includes('<tr><th>Python</th><td><code>&gt;=3.10</code>，用于准备 SIFT 运行时。</td></tr>'));
  assert(html.includes('id="scenarios"'));
  assert(html.includes('适合 / SKILL 维护者'));
  assert(html.includes(`@fuxi-ailabs/dsh-eval-bundle@${version}`));
  assert(readme.includes('| Skill Eval · Skill 评测 | `1.1.3` |'));
  assert(!/\.market-current[^{]*\{[^}]*display:\s*none/.test(css));
});

test('requirements share the compact installation section and results start collapsed', () => {
  const html = renderPage(agent);
  assert(!html.includes('<section id="details"'));
  assert(html.indexOf('id="quickstart"') < html.indexOf('id="details"'));
  assert.equal((html.match(/class="install-command"/g) || []).length, agent.quickstart.steps.length);
  assert(html.includes('<details class="install-checks">'));
});
