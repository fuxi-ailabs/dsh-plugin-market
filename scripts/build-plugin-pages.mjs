import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { renderPage } from '../templates/plugin-page/render.mjs';
import { validateContent } from '../templates/plugin-page/validate.mjs';
import { heroPlaceholder, comparisonPlaceholder, previewContent } from '../templates/plugin-page/preview.mjs';

const check = process.argv.includes('--check');

const [styles, runtime] = await Promise.all([
  readFile('templates/plugin-page/styles.css','utf8'),
  readFile('templates/plugin-page/page.js','utf8'),
]);
async function emitPage(content, output, {preview = false, extraFiles = []} = {}) {
  const files = new Map([
    ['index.html', renderPage(content, {preview})],
    ['styles.css', styles],
    ['page.js', runtime],
    ['demo-data.js', `// Illustrative data for this page, not a live plugin connection.\nwindow.PLUGIN_DEMO = ${JSON.stringify(content.example, null, 2).replace(/</g, '\\u003c')};\n`],
    ...extraFiles,
  ]);
  if (!check) await mkdir(output, {recursive:true});
  for (const [name, expected] of files) {
    if (check) {
      const actual = await readFile(`${output}/${name}`, 'utf8');
      if (actual.replace(/\r\n/g,'\n') !== expected.replace(/\r\n/g,'\n')) throw new Error(`Generated page is stale: ${output}/${name}. Run npm run build:pages.`);
    } else {
      await mkdir(dirname(`${output}/${name}`), {recursive:true});
      await writeFile(`${output}/${name}`, expected);
    }
  }
  console.log(`${check ? 'Checked' : 'Built'} page: ${output}`);
}

for (const filename of (await readdir('content/plugins')).filter(f=>f.endsWith('.json')).sort()) {
  const content = JSON.parse(await readFile(`content/plugins/${filename}`, 'utf8'));
  validateContent(content);
  if (filename !== `${content.slug}.json`) throw new Error('Content filename must match slug');
  await emitPage(content, `public/plugins/${content.slug}`);
}

// A review surface rendered from the same starter and renderer, outside the installable catalog.
const [starter, reviewStyles] = await Promise.all([
  readFile('templates/plugin-page/content.example.json','utf8'),
  readFile('templates/plugin-page/review.css','utf8'),
]);
const skeleton = JSON.parse(starter);
validateContent(skeleton);
await emitPage(previewContent(skeleton), 'public/templates/plugin-page', {preview:true, extraFiles:[
  ['content.example.json',starter], ['review.css',reviewStyles],
  ['assets/overview.svg',heroPlaceholder()],
  ['assets/demo.svg',heroPlaceholder().replace('插件截图 / 概览图 / 代表图', '功能演示图')],
  ['assets/before.svg',comparisonPlaceholder(false)], ['assets/after.svg',comparisonPlaceholder(true)],
]});
