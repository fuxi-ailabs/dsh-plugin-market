'use strict';

const REPOSITORIES = new Set(['fuxi-ailabs/dsh-plugin-market', 'fuxi-ailabs/hmbot']);
const CODEX = 'chatgpt-codex-connector[bot]';
const ACTIONS = 'github-actions[bot]';
const MAX_ATTEMPTS = 2;

function reviewState(comments, sha) {
  for (const comment of [...comments].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))) {
    if (comment.user?.login !== CODEX) continue;
    const match = comment.body?.match(/<!-- codex-review-state:v1 ([\s\S]*?) -->/);
    if (!match) continue;
    try {
      const state = JSON.parse(match[1]).code_review;
      if (state?.commit_sha === sha) return {status: state.status, signature: `${comment.id}:${comment.body}`};
    } catch {}
  }
  return null;
}

async function run({github, context, core, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), maxPolls = 32, pollMs = 15000}) {
  const {owner, repo} = context.repo;
  const repository = `${owner}/${repo}`;
  if (!REPOSITORIES.has(repository.toLowerCase())) {
    core.notice(`Automatic review is disabled for ${repository}.`);
    return 'disabled';
  }
  const number = Number(context.payload.pull_request?.number ?? context.payload.inputs?.pull_request_number);
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('A valid pull request number is required.');
  const getPull = async () => (await github.rest.pulls.get({owner, repo, pull_number: number})).data;
  const listComments = () => github.paginate(github.rest.issues.listComments, {owner, repo, issue_number: number, per_page: 100});
  const pr = await getPull();
  if (pr.base.repo.full_name.toLowerCase() !== repository.toLowerCase()) throw new Error('Pull request repository mismatch.');
  if (pr.state !== 'open') return 'closed';
  const sha = pr.head.sha;
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Invalid pull request head.');
  const eventHead = context.payload.pull_request?.head?.sha;
  if (eventHead && eventHead !== sha) {
    core.notice('A newer push superseded this event.');
    return 'superseded';
  }
  let comments = await listComments();
  let state = reviewState(comments, sha);
  const marker = new RegExp(`<!-- fuxi-codex-review head=${sha} attempt=(\\d+) -->`);
  const requests = comments.filter(comment => comment.user?.login === ACTIONS && comment.body?.startsWith('@codex review\n') && marker.test(comment.body));
  let attempts = Math.max(0, ...requests.map(comment => Number(comment.body.match(marker)[1])));
  let waiting = ['running', 'queued'].includes(state?.status) || (requests.length > 0 && !state);
  let previousSignature = null;
  const runUrl = `${context.serverUrl || 'https://github.com'}/${repository}/actions/runs/${context.runId}`;
  const finish = async () => {
    core.notice(`Codex completed ${repository}#${number} at ${sha}.`);
    await core.summary.addHeading('Codex review completed').addRaw(`PR: #${number}\n\nHead: ${sha}\n\nThe native Codex review reported completed; no approval or merge was performed.\n`).write();
    return 'completed';
  };
  if (state?.status === 'completed') return finish();

  for (;;) {
    if (!waiting) {
      if (attempts >= MAX_ATTEMPTS) throw new Error(`Codex did not complete head ${sha} after ${MAX_ATTEMPTS} automatic requests. See the PR review summary.`);
      previousSignature = state?.signature ?? null;
      attempts += 1;
      const body = `@codex review\n\n请按本仓库的 AGENTS.md 审查当前 PR 的最新提交 ${sha}。此请求由 PR 更新事件自动发起；只做审查，不修改代码、不批准或合并 PR。\n\n[触发记录](${runUrl})\n\n<!-- fuxi-codex-review head=${sha} attempt=${attempts} -->`;
      const {data: request} = await github.rest.issues.createComment({owner, repo, issue_number: number, body});
      core.notice(`Requested Codex review: ${request.html_url}`);
    }
    waiting = false;
    for (let poll = 0; poll < maxPolls; poll += 1) {
      await sleep(pollMs);
      const current = await getPull();
      if (current.state !== 'open') return 'closed';
      if (current.head.sha !== sha) {
        core.notice('A newer push superseded this review; its own event will request the current head.');
        return 'superseded';
      }
      comments = await listComments();
      state = reviewState(comments, sha);
      if (!state || state.signature === previousSignature) continue;
      if (state.status === 'completed') return finish();
      if (state.status === 'failed') {
        core.warning(`Codex failed at ${sha}; retrying within the two-request limit.`);
        break;
      }
    }
  }
}

module.exports = {run};
