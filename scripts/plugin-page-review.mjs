import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const marker = '<!-- fuxi-plugin-page-auto-review -->';
export const isPagePath = path => /^(?:content\/plugins\/|public\/plugins\/|templates\/plugin-page\/)/.test(path)
  || ['public/index.html', 'public/index.json', 'AGENTS.md', 'docs/plugin-page-template.md',
    '.github/prompts/plugin-page-review.md', '.github/workflows/plugin-page-review.yml', 'scripts/plugin-page-review.mjs'].includes(path);
export const revisionOf = pr => createHash('sha256').update(JSON.stringify([pr.head.sha, pr.body || ''])).digest('hex');

export async function prepareReview({ github, context, core, root = '.' }) {
  const { owner, repo } = context.repo;
  const pull_number = context.payload.pull_request.number;
  const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number });
  if (pr.state !== 'open' || pr.draft || pr.head.repo?.full_name !== `${owner}/${repo}`) {
    core.setOutput('relevant', 'false');
    return;
  }
  const files = await github.paginate(github.rest.pulls.listFiles, { owner, repo, pull_number, per_page: 100 });
  if (!files.some(file => isPagePath(file.filename) || (file.previous_filename && isPagePath(file.previous_filename)))) {
    core.setOutput('relevant', 'false');
    return;
  }
  const input = {
    number: pull_number, url: pr.html_url, title: pr.title, body: pr.body || '',
    base: pr.base.sha, head: pr.head.sha,
    files: files.map(file => ({
      filename: file.filename, previous_filename: file.previous_filename, status: file.status,
      patch: file.patch?.slice(0, 12000) ?? null,
      patchTruncated: !file.patch || file.patch.length > 12000,
    })),
  };
  await mkdir(join(root, '.review-input'), { recursive: true });
  await writeFile(join(root, '.review-input/context.json'), JSON.stringify(input, null, 2));
  core.setOutput('relevant', 'true');
  core.setOutput('head_sha', pr.head.sha);
  core.setOutput('revision', revisionOf(pr));
}

export async function publishReview({ github, context, core, revision, report }) {
  const { owner, repo } = context.repo;
  const issue_number = context.payload.pull_request.number;
  const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number: issue_number });
  if (pr.state !== 'open' || pr.draft || revisionOf(pr) !== revision) {
    core.info('PR changed or closed during review; discard the stale report.');
    return false;
  }
  if (!report?.trim()) throw new Error('Codex returned no report; do not publish a passing review.');
  if (report.length > 20000) throw new Error('Review exceeds the publication limit.');
  const body = `${marker}\n组件介绍页自动审查 · head \`${pr.head.sha}\`\n\n${report.trim()}`;
  const comments = await github.paginate(github.rest.issues.listComments, { owner, repo, issue_number, per_page: 100 });
  const previous = comments.find(comment => comment.user?.login === 'github-actions[bot]' && comment.body?.startsWith(marker));
  if (previous) {
    await github.rest.issues.updateComment({ owner, repo, comment_id: previous.id, body });
  } else {
    await github.rest.issues.createComment({ owner, repo, issue_number, body });
  }
  return true;
}
