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

test('requirements share the compact installation section and results start collapsed', () => {
  const html = renderPage(agent);
  assert(!html.includes('<section id="details"'));
  assert(html.indexOf('id="quickstart"') < html.indexOf('id="details"'));
  assert.equal((html.match(/class="install-command"/g) || []).length, agent.quickstart.steps.length);
  assert(html.includes('<details class="install-checks">'));
});
