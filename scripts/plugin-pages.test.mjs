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

test('a standalone video is separate from the example and its reproduction prompt', () => {
  const page = structuredClone(starter);
  page.example.video = { ...agent.example.video, standalone: true };
  page.example.prompt = 'Reproduce only the written example';
  validateContent(page);
  const html = renderPage(page);
  const example = html.slice(html.indexOf('<section id="example"'), html.indexOf('<section id="comparison"'));
  const exampleEnd = example.indexOf('</section>');
  assert(example.indexOf('Reproduce only the written example') < exampleEnd);
  assert(example.indexOf('id="recording"') > exampleEnd);
  assert(example.includes('aria-labelledby="recording-section-title"'));
  page.example.video.standalone = 'yes';
  assert.throws(() => validateContent(page), /video.standalone/);
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

test('Session Audit keeps existing evidence, silent operation video and install contract', async () => {
  const html = await readFile(new URL('../public/plugins/audit/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../public/plugins/audit/styles.css', import.meta.url), 'utf8');
  const plugin = catalog.plugins.find(item => item.name === '@fuxi-ailabs/dsh-audit-bundle');
  const version = plugin.versions[0].version;
  assert(html.includes('class="market-brand"'));
  assert(html.includes('class="market-current"'));
  assert(html.includes('assets/audit-workbench.jpg'));
  assert(html.includes('assets/audit-flyout.jpg'));
  assert(html.includes('id="recording"'));
  assert(html.includes('assets/audit-demo.mp4'));
  assert(html.includes('assets/audit-demo-zh.vtt'));
  assert(html.includes('下面视频展示会话选择'));
  assert(html.includes('<video controls muted playsinline'));
  assert(html.includes('<h2>3. Demo</h2>'));
  assert(html.includes('<h2>4. 从工作台开始</h2>'));
  assert(html.indexOf('id="recording"') < html.indexOf('id="usage-steps"'));
  assert(!html.includes('录屏已移除语音'));
  assert(html.includes('<h2>3. Demo</h2>'));
  assert(html.includes('<h2>4. 从工作台开始</h2>'));
  assert(html.indexOf('id="recording"') < html.indexOf('id="usage-steps"'));
  assert(!html.includes('录屏已移除语音'));
  assert(!html.includes('add @fuxi-ailabs/dsh-runtime-bundle'));
  assert(html.includes('remove @fuxi-ailabs/dsh-audit-bundle</code>'));
  assert(html.includes('从 1.0.x / 1.1.x 升级'));
  assert(html.includes('无论通过市场还是下方 <code>add</code> 命令升级，都请先移除旧 Bundle'));
  assert(html.includes('若旧安装曾经使用共享 Runtime Bundle'));
  assert(html.includes('1.0.x、1.2.0 或从未安装该 Runtime 的 profile 不需要执行'));
  assert(!html.includes('查看 Runtime Bundle npm 页面'));
  assert(html.includes('class="profile-note"'));
  assert(html.includes('class="npm-callout"'));
  assert(html.indexOf('dsh plugin --profile web') < html.indexOf('https://fuxi-ailabs.github.io/dsh-plugin-market/index.json'));
  assert(html.includes(`@fuxi-ailabs/dsh-audit-bundle@${version}`));
  assert(html.includes('~/.dsh-audit/&lt;session-id&gt;/&lt;run-id&gt;/'));
  assert(html.includes(`data-copy="dsh plugin --profile web add @fuxi-ailabs/dsh-audit-bundle@${version}"`));
  assert(html.includes('id="scenarios"'));
  assert(html.includes('适合 / SKILL 维护者'));
  assert(plugin.versions.some(item => item.version === '1.0.1'));
  assert(html.includes('turn 引用可反向定位到 Trajectory'));
  assert(!/\.market-current[^{]*\{[^}]*display:\s*none/.test(css));
});

test('Static Check keeps both banner links visible at narrow widths', async () => {
  const pages = [
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

test('market docs match the currently installable Static Check version', async () => {
  const staticCheck = await readFile(new URL('../public/plugins/static-check/index.html', import.meta.url), 'utf8');
  const staticCheckCss = await readFile(new URL('../public/plugins/static-check/styles.css', import.meta.url), 'utf8');
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  const plugin = catalog.plugins.find(item => item.name === '@fuxi-ailabs/dsh-static-check-bundle');
  const version = plugin.versions[0].version;
  assert(!staticCheck.includes('add @fuxi-ailabs/dsh-runtime-bundle'));
  assert(staticCheck.includes('remove @fuxi-ailabs/dsh-static-check-bundle</code>'));
  assert(staticCheck.includes('从 1.0.x / 1.1.x 升级'));
  assert(staticCheck.includes('无论通过市场还是下方 <code>add</code> 命令升级，都请先移除旧 Bundle'));
  assert(staticCheck.includes('若旧安装曾经使用共享 Runtime Bundle'));
  assert(staticCheck.includes('1.0.x、1.2.0、1.2.1 或从未安装该 Runtime 的 profile 不需要执行'));
  assert(!staticCheck.includes('查看 Runtime Bundle npm 页面'));
  assert(staticCheck.includes(`dsh-static-check-bundle@${version}`));
  assert(staticCheck.includes('<tr><td><strong>Static Check Bundle</strong><small>安装入口</small></td><td><code class="version-short">1.2.2</code></td>'));
  assert(staticCheck.includes('从 1.2.0 / 1.2.1 升级'));
  assert(staticCheck.includes('dsh-env-health'));
  assert(staticCheck.includes('class="profile-note"'));
  assert(staticCheck.includes('class="npm-callout"'));
  const staticCheckPageJs = await readFile(new URL('../public/plugins/static-check/page.js', import.meta.url), 'utf8');
  assert(staticCheck.includes(`data-copy="dsh plugin --profile web add @fuxi-ailabs/dsh-static-check-bundle@${version}"`));
  assert(staticCheckPageJs.includes('navigator.clipboard.writeText(button.dataset.copy)'));
  assert(staticCheckCss.includes('.install-command'));
  assert(staticCheck.includes('1193fa77e27ed01d657de7df1db881b61114d569'));
  assert(staticCheck.includes('2.6.0-dev.1193fa7'));
  assert(staticCheck.includes('~/.dsh-sift/runtime/2.6.0-dev.1193fa7/'));
  assert.equal(version, '1.2.2');
  assert(readme.includes('| Static Check · Skill 静态检查 | `1.2.2` |'));
});

test('market index does not restore removed source or preview metadata', () => {
  assert.equal(catalog.metadata.labels?.preview, undefined);
  for (const plugin of catalog.plugins) {
    assert.equal(plugin.repository, undefined, `${plugin.name} must not restore a source entry in discovery`);
    assert(!(plugin.metadata?.labels ?? []).includes('preview'), `${plugin.name} must not be marked as preview`);
  }
});

test('Observe and Score are independent market pages and legacy Insight is removed', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  const observe = await readFile(new URL('../public/plugins/observe/index.html', import.meta.url), 'utf8');
  const score = await readFile(new URL('../public/plugins/score/index.html', import.meta.url), 'utf8');
  const observeCss = await readFile(new URL('../public/plugins/observe/styles.css', import.meta.url), 'utf8');
  const scoreCss = await readFile(new URL('../public/plugins/score/styles.css', import.meta.url), 'utf8');
  const scoreCaptions = await readFile(new URL('../public/plugins/score/assets/score-demo-zh.vtt', import.meta.url), 'utf8');
  const validator = await readFile(new URL('../scripts/validate.mjs', import.meta.url), 'utf8');

  assert.equal(catalog.plugins.find(item => item.name === '@fuxi-ailabs/dsh-observe-bundle').versions[0].version, '1.2.1');
  assert.equal(catalog.plugins.find(item => item.name === '@fuxi-ailabs/dsh-score-bundle').versions[0].version, '1.2.1');
  assert(!catalog.plugins.some(item => item.name === '@fuxi-ailabs/dsh-insight-bundle'), 'legacy Insight must be removed from the catalog');

  for (const [html, name, bundle] of [[observe, 'Observe', 'dsh-observe-bundle'], [score, 'Score', 'dsh-score-bundle']]) {
    assert(html.includes('class="market-brand"'));
    assert(html.includes('class="market-current"'));
    assert(html.includes(`<h1>${name}</h1>`));
    assert(html.includes(`DSH BUNDLE · ${bundle} · v1.2.1`));
    for (const id of ['relationship', 'features', 'scenarios', 'requirements', 'install', 'faq']) {
      assert(html.includes(`id="${id}"`), `${name} must include #${id}`);
    }
    assert(html.includes(`data-copy="dsh plugin --profile web add @fuxi-ailabs/${bundle}@1.2.1"`));
    assert(html.includes('dsh-insight-bundle'), `${name} FAQ must explain the legacy Insight migration`);
    assert(html.includes('以下命令在 DSH 的会话输入框中发送，不是在系统终端执行。'), `${name} must identify slash commands as DSH session input`);
    assert(html.includes('先在 DSH「插件」页移除旧包'), `${name} FAQ must include the removal prerequisite`);
    assert(html.includes('若同时装有 1.1.x 的 Session Audit、Skill Eval 或 Static Check'), `${name} FAQ must coordinate other legacy Runtime consumers`);
    assert(html.includes('确认没有其他旧消费者后'), `${name} FAQ must gate Runtime removal on legacy cleanup`);
    assert(!html.includes('add @fuxi-ailabs/dsh-runtime-bundle'), `${name} must not install the legacy Runtime Bundle`);
    assert(html.includes('remove @fuxi-ailabs/dsh-runtime-bundle'), `${name} FAQ must remove the legacy Runtime Bundle`);
    assert(html.includes('data-carousel-toggle'));
  }

  assert(observe.includes('assets/observe-runtime.jpg'));
  assert(observe.includes('当前 Observe 演示中首次点击'));
  assert(observe.includes('assets/observe-environment.jpg'));
  assert(observe.includes('旧版 Insight 环境检查界面（示意）'));
  assert(observe.includes('不包含 Provider Auth 检查'));
  assert(observe.includes('assets/observe-session.png'));
  assert(observe.includes('assets/observe-actions.png'));
  assert(observe.includes('assets/observe-demo.webm'));
  assert(observe.includes('assets/observe-demo-zh.vtt'));
  assert(observe.includes('<video controls muted playsinline'));
  assert(observe.includes('id="comparison"'));
  assert(observe.includes('/observe'));
  assert(!observe.includes('dsh-provider-auth'));
  assert(!observe.includes('autoInstall'));
  assert(!observe.includes('github.com/guixu-labs/dsh-plugin'));
  assert(observeCss.includes('--accent: #17634d'));

  assert(score.includes('assets/score-page.jpg'));
  assert(!score.includes('assets/score-environment.jpg'));
  assert(score.includes('assets/score-detail.png'));
  assert(!score.includes('assets/score-dial-hover.png'));
  assert(score.includes('assets/score-demo.webm'));
  assert(score.includes('assets/score-demo-zh.vtt'));
  assert(score.includes('<video controls muted playsinline'));
  assert(!score.includes('鲸鱼'));
  assert(!scoreCaptions.includes('鲸鱼'));
  assert(!catalog.plugins.find(item => item.name === '@fuxi-ailabs/dsh-score-bundle').description.en.toLowerCase().includes('whale'));
  assert(!score.includes('autoInstall'));
  assert(!score.includes('github.com/guixu-labs/dsh-plugin'));
  assert(score.includes('id="comparison"'));
  assert(score.includes('示例会话为 5.7 分、覆盖 59%'));
  assert(score.includes('展开 D4 完成效率'));
  assert(score.includes('是对会话打分的插件'));
  assert(score.includes('只有用户主动使用才会请求大模型'));
  assert(score.includes('@fuxi-ailabs/dsh-score-bundle@1.2.1'));
  assert(score.includes('不调用大模型'));
  assert(score.includes('/score --recalc'));
  assert(score.includes('/score --semantic'));
  assert(scoreCss.includes('--accent: #17634d'));

  assert(!validator.includes('https://github.com/guixu-labs/dsh-plugin'));
  assert(readme.includes('| Observe · DSH 会话观测 | `1.2.1` |'));
  assert(readme.includes('| Score · DSH 会话评分 | `1.2.1` |'));
});

test('Skill Eval keeps its workbench, silent operation video and self-contained install contract', async () => {
  const html = await readFile(new URL('../public/plugins/skill-eval/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../public/plugins/skill-eval/styles.css', import.meta.url), 'utf8');
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  const plugin = catalog.plugins.find(item => item.name === '@fuxi-ailabs/dsh-eval-bundle');
  const version = plugin.versions[0].version;
  assert.equal(version, '1.2.1');
  assert(html.includes('class="market-brand"'));
  assert(html.includes('class="market-current"'));
  assert(html.includes('assets/skill-eval-workbench.jpg'));
  assert(html.includes('id="recording"'));
  assert(html.includes('assets/skill-eval-demo.mp4'));
  assert(html.includes('assets/skill-eval-demo-zh.vtt'));
  assert(html.includes('下面视频展示 Skill 选择'));
  assert(html.includes('<video controls muted playsinline'));
  assert(!html.includes('add @fuxi-ailabs/dsh-runtime-bundle'));
  assert(html.includes('remove @fuxi-ailabs/dsh-eval-bundle</code>'));
  assert(html.includes('从 1.0.x / 1.1.x 升级'));
  assert(html.includes('无论通过市场还是下方 <code>add</code> 命令升级，都请先移除旧 Bundle'));
  assert(html.includes('若旧安装曾经使用共享 Runtime Bundle'));
  assert(html.includes('1.0.x、1.2.0 或从未安装该 Runtime 的 profile 不需要执行'));
  assert(!html.includes('查看 Runtime Bundle npm 页面'));
  assert(html.includes('class="profile-note"'));
  assert(html.includes('class="npm-callout"'));
  assert(html.indexOf('dsh plugin --profile web') < html.indexOf('https://fuxi-ailabs.github.io/dsh-plugin-market/index.json'));
  assert(html.includes(`data-copy="dsh plugin --profile web add @fuxi-ailabs/dsh-eval-bundle@${version}"`));
  assert(html.includes('<tr><th>Python</th><td><code>&gt;=3.10</code>，用于准备 SIFT 运行时。</td></tr>'));
  assert(html.includes('id="scenarios"'));
  assert(html.includes('适合 / SKILL 维护者'));
  assert(html.includes(`@fuxi-ailabs/dsh-eval-bundle@${version}`));
  assert(readme.includes('| Skill Eval · Skill 评测 | `1.2.1` |'));
  assert(!/\.market-current[^{]*\{[^}]*display:\s*none/.test(css));
});

test('requirements share the compact installation section and results start collapsed', () => {
  const html = renderPage(agent);
  assert(!html.includes('<section id="details"'));
  assert(html.indexOf('id="quickstart"') < html.indexOf('id="details"'));
  assert.equal((html.match(/class="install-command"/g) || []).length, agent.quickstart.steps.length);
  assert(html.includes('<details class="install-checks">'));
});

test('Redundancy Check publishes coverage anchors, real-run examples and self-contained install contract', async () => {
  const html = await readFile(new URL('../public/plugins/redundancy-check/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../public/plugins/redundancy-check/styles.css', import.meta.url), 'utf8');
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  const plugin = catalog.plugins.find(item => item.name === '@fuxi-ailabs/dsh-redundancy-check-bundle');
  const version = plugin.versions[0].version;

  assert.equal(version, '1.2.1');
  assert(html.includes('class="market-brand"'));
  assert(html.includes('class="market-current"'));
  assert(html.includes('<h1>Redundancy Check</h1>'));
  assert(html.includes('DSH BUNDLE · dsh-redundancy-check-bundle · v1.2.1'));
  for (const id of ['relationship', 'features', 'scenarios', 'comparison', 'requirements', 'install', 'first-check', 'demo', 'workflow', 'states', 'faq']) {
    assert(html.includes(`id="${id}"`), `Redundancy Check must include #${id}`);
  }
  assert(html.includes('data-copy="dsh plugin --profile web add @fuxi-ailabs/dsh-redundancy-check-bundle@1.2.1"'));
  assert(html.includes('assets/redundancy-overview.png'));
  assert(html.includes('assets/redundancy-annotations.png'));
  assert(html.includes('assets/redundancy-evidence.png'));
  assert(html.includes('assets/before-coverage.png'));
  assert(html.includes('data-carousel-toggle'));
  assert(html.includes('已覆盖、未覆盖、未知可以任意组合'));
  assert(html.includes('PASS 或 FAIL 都表示该 instruction 被触发过'));
  assert(html.includes('~/.dsh-redundancy-check/audit/'));
  assert(html.includes('https://www.npmjs.com/package/@fuxi-ailabs/dsh-redundancy-check-bundle'));
  assert(html.includes('本地绝对路径已隐藏'));
  assert(!html.includes('/Users/haotianchen'));
  assert(!html.includes('add @fuxi-ailabs/dsh-runtime-bundle'));
  assert(css.includes('--accent: #17634d'));
  assert(css.includes('.state-badge.pass'));
  assert(readme.includes('| Redundancy Check · Skill 声明覆盖 | `1.2.1` |'));
});
