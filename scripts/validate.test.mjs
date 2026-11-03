import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const validator = fileURLToPath(new URL('./validate.mjs', import.meta.url));
const publication = fileURLToPath(new URL('../public', import.meta.url));

test('approved documentation links pass, but invalid secondary-page links fail CI', async t => {
  const root = await mkdtemp(join(tmpdir(), 'market-links-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await cp(publication, join(root, 'public'), { recursive: true });
  const validate = () => run(process.execPath, [validator], { cwd: root });
  const guide = join(root, 'public/plugins/crowdmemory/adapters.html');
  await writeFile(guide, (await readFile(guide, 'utf8')).replace('</body>',
    '<a href="index.html#quickstart">installation</a></body>'));
  await validate();
  for (const [file, link] of [
    ['evaluation.html', '<a href="https://unapproved.invalid/results">results</a>'],
    ['adapters.html', "<a href='missing-guide.html'>guide</a>"],
    ['adapters.html', '<a href="index.html#missing-section">section</a>'],
    ['adapters.html', '<a href="#missing-local-section">section</a>'],
    ['adapters.html', '<a href="index.html#quickstart#missing">section</a>'],
  ]) {
    const path = join(root, 'public/plugins/crowdmemory', file);
    const original = await readFile(path, 'utf8');
    await writeFile(path, original.replace('</body>', `${link}</body>`));
    try {
      await assert.rejects(validate(), error => {
        assert(error.stderr.includes(`Unreviewed page link in plugins/crowdmemory/${file}`));
        return true;
      });
    } finally {
      await writeFile(path, original);
    }
  }
});
