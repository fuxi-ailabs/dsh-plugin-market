import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isPagePath, marker, prepareReview, publishReview, revisionOf } from './plugin-page-review.mjs';

const pr = () => ({ state: 'open', draft: false, title: '页面更新', body: 'FAQ 不适用：具体原因', html_url: 'https://github.com/team/market/pull/7', head: { sha: 'a'.repeat(40), repo: { full_name: 'team/market' } }, base: { sha: 'b'.repeat(40) } });
function fixture(pull = pr(), files = [], comments = []) {
  const writes = [], outputs = {};
  const listFiles = () => {}, listComments = () => {};
  return {
    writes, outputs,
    context: { repo: { owner: 'team', repo: 'market' }, payload: { pull_request: { number: 7 } } },
    core: { setOutput: (key, value) => { outputs[key] = value; }, info: () => {} },
    github: {
      rest: {
        pulls: { get: async () => ({ data: pull }), listFiles },
        issues: { listComments, createComment: async data => writes.push(['create', data]), updateComment: async data => writes.push(['update', data]) },
      },
      paginate: async method => method === listFiles ? files : comments,
    },
  };
}

test('page paths include custom pages and shared templates, but not unrelated docs', () => {
  for (const path of ['public/plugins/custom/index.html', 'content/plugins/ecat.json', 'templates/plugin-page/render.mjs', 'public/index.json', 'AGENTS.md']) assert(isPagePath(path));
  assert(!isPagePath('docs/unrelated.md'));
});

test('preparation retains exception explanations, detects renames and reads no PR code', async () => {
  const root = await mkdtemp(join(tmpdir(), 'market-review-'));
  try {
    const f = fixture(pr(), [{ filename: 'archive/old.html', previous_filename: 'public/plugins/ecat/index.html', patch: 'x'.repeat(13000), status: 'renamed' }]);
    await prepareReview({ ...f, root });
    const input = JSON.parse(await readFile(join(root, '.review-input/context.json'), 'utf8'));
    assert.equal(input.body, pr().body);
    assert.equal(input.files[0].patch.length, 12000);
    assert(input.files[0].patchTruncated);
    assert.equal(f.outputs.relevant, 'true');
    assert.equal(f.outputs.revision, revisionOf(pr()));
    assert.deepEqual(f.writes, []);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('unrelated changes, forks and drafts do not start a paid review', async () => {
  const cases = [
    [pr(), 'docs/unrelated.md'],
    [{ ...pr(), draft: true }, 'content/plugins/ecat.json'],
    [{ ...pr(), head: { ...pr().head, repo: { full_name: 'fork/market' } } }, 'content/plugins/ecat.json'],
  ];
  for (const [pull, filename] of cases) {
    const f = fixture(pull, [{ filename }]);
    await prepareReview(f);
    assert.equal(f.outputs.relevant, 'false');
  }
});

test('new commits and edited exception explanations invalidate an old report', async () => {
  for (const pull of [{ ...pr(), head: { ...pr().head, sha: 'c'.repeat(40) } }, { ...pr(), body: '新增的例外原因' }, { ...pr(), state: 'closed' }, { ...pr(), draft: true }]) {
    const f = fixture(pull);
    assert.equal(await publishReview({ ...f, revision: revisionOf(pr()), report: '旧报告' }), false);
    assert.deepEqual(f.writes, []);
  }
});

test('one bot comment is updated without overwriting a human comment', async () => {
  const f = fixture(pr(), [], [{ id: 11, user: { login: 'owner' }, body: marker }, { id: 12, user: { login: 'github-actions[bot]' }, body: marker + '\n旧报告' }]);
  assert(await publishReview({ ...f, revision: revisionOf(pr()), report: '新报告' }));
  assert.equal(f.writes[0][0], 'update');
  assert.equal(f.writes[0][1].comment_id, 12);
  const fresh = fixture();
  await publishReview({ ...fresh, revision: revisionOf(pr()), report: '首次报告' });
  assert.equal(fresh.writes[0][0], 'create');
});

test('empty or oversized output is not published as a passing review', async () => {
  const f = fixture();
  for (const report of ['', 'x'.repeat(20001)]) await assert.rejects(publishReview({ ...f, revision: revisionOf(pr()), report }));
  assert.deepEqual(f.writes, []);
});
