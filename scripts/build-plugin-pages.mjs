import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { renderPage } from '../templates/plugin-page/render.mjs';

const check = process.argv.includes('--check');
const requireText = (value, name) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing page content: ${name}`);
};
const requireList = (value, name, min) => {
  if (!Array.isArray(value) || value.length < min) throw new Error(`Expected ${min}+ items: ${name}`);
};
export function validateContent(p) {
  if (!/^[a-z0-9-]+$/.test(p.slug)) throw new Error('Invalid plugin slug');
  for (const key of ['name','category','version','compatibility','description','promise','heroQuestion','heroAnswer','heroFile']) requireText(p[key], key);
  for (const key of ['headline','heroNodes','facts']) {
    requireList(p[key], key, 2); p[key].forEach(v => requireText(v, key));
  }
  for (const key of ['terminal','objectLabel','contextLabel','contextMeta']) requireText(p.preview?.[key], `preview.${key}`);
  const x = p.example;
  for (const key of ['title','description','label','file','question','answer','session','prompt','note']) requireText(x?.[key], `example.${key}`);
  for (const key of ['events','context','contextNote','changeTab','evidenceTab','action','contextField','request','result','resultText','status']) requireText(x.ui?.[key], `example.ui.${key}`);
  if (x.video) {
    requireText(x.video.title, 'video.title');
    if (!/^assets\/[a-z0-9-]+\.(mp4|webm)$/.test(x.video.src) || !/^assets\/[a-z0-9-]+\.jpg$/.test(x.video.poster) || !/^assets\/[a-z0-9-]+\.vtt$/.test(x.video.captions)) throw new Error('Video, poster and captions must be reviewed local assets');
  }
  requireList(x.operations, 'example.operations', 2);
  for (const op of x.operations) {
    for (const key of ['tool','title','description','result','requestRef','resultRef']) requireText(op[key], `operation.${key}`);
    for (const key of ['removed','added']) { requireList(op[key], key, 0); op[key].forEach(v=>requireText(v,key)); }
  }
  for (const key of ['title','description']) requireText(p.comparison?.[key], `comparison.${key}`);
  for (const kind of ['before','after']) {
    for (const key of ['title','description','image','alt']) requireText(p.comparison[kind]?.[key], `comparison.${kind}.${key}`);
    if (!/^assets\/[a-z0-9-]+\.jpg$/.test(p.comparison[kind].image)) throw new Error('Screenshot must be a local reviewed JPEG');
  }
  requireList(p.comparison.takeaways, 'comparison.takeaways', 1);
  p.comparison.takeaways.forEach(v=>requireText(v,'takeaway'));
  requireList(p.useCases, 'useCases', 2);
  for (const c of p.useCases) for (const key of ['tag','title','question','description','prompt']) requireText(c[key], `useCase.${key}`);
  for (const key of ['title','description','summaryTitle']) requireText(p.quickstart?.[key], `quickstart.${key}`);
  if (p.quickstart.steps?.length !== 5) throw new Error('Quickstart must have exactly five steps');
  for (const s of p.quickstart.steps) for (const key of ['title','description','code','codeLabel']) requireText(s[key], `step.${key}`);
  requireList(p.boundaries, 'boundaries', 1);
  for (const b of p.boundaries) for (const key of ['title','description']) requireText(b[key], `boundary.${key}`);
  for (const key of ['eyebrow','title']) requireText(p.closing?.[key], `closing.${key}`);
  requireList(p.links, 'links', 1);
  for (const l of p.links) {
    requireText(l.label, 'link.label');
    const url = new URL(l.url);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Documentation links must be HTTPS');
  }
}

for (const filename of (await readdir('content/plugins')).filter(f=>f.endsWith('.json')).sort()) {
  const content = JSON.parse(await readFile(`content/plugins/${filename}`, 'utf8'));
  validateContent(content);
  if (filename !== `${content.slug}.json`) throw new Error('Content filename must match slug');
  const output = `public/plugins/${content.slug}`;
  const files = new Map([
    ['index.html', renderPage(content)],
    ['styles.css', await readFile('templates/plugin-page/styles.css','utf8')],
    ['page.js', await readFile('templates/plugin-page/page.js','utf8')],
    ['demo-data.js', `// Illustrative data for this page, not a live plugin connection.\nwindow.PLUGIN_DEMO = ${JSON.stringify(content.example, null, 2).replace(/</g, '\\u003c')};\n`],
  ]);
  if (!check) await mkdir(output, {recursive:true});
  for (const [name, expected] of files) {
    if (check) {
      const actual = await readFile(`${output}/${name}`, 'utf8');
      if (actual.replace(/\r\n/g,'\n') !== expected.replace(/\r\n/g,'\n')) throw new Error(`Generated page is stale: ${output}/${name}. Run npm run build:pages.`);
    } else { await writeFile(`${output}/${name}`, expected); }
  }
  console.log(`${check ? 'Checked' : 'Built'} plugin page: ${content.slug}`);
}
