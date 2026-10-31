'use strict';

const REPOSITORY = 'fuxi-ailabs/dsh-plugin-market';
const CODEX = 'chatgpt-codex-connector[bot]';
const CI_PATHS = ['.github/workflows/pages.yml', '.github/workflows/codex-subscription-review.yml'];

function nativeReview(comments, sha) {
  for (const comment of [...comments].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))) {
    if (comment.user?.login !== CODEX || !comment.body?.startsWith('<!-- codex-pull-request-review-summary -->')) continue;
    const match = comment.body.match(/<!-- codex-review-state:v1 ([\s\S]*?) -->/);
    try {
      const state = JSON.parse(match?.[1]).code_review;
      if (state?.commit_sha === sha) return state;
    } catch {}
  }
  return null;
}

function changesRequested(reviews) {
  const latest = new Map();
  for (const review of [...reviews].sort((a, b) => a.id - b.id)) {
    if (['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(review.state)) latest.set(review.user.login, review.state);
  }
  return [...latest.values()].includes('CHANGES_REQUESTED');
}

function latestRuns(runs) {
  const latest = new Map();
  for (const run of runs) {
    const key = `${run.workflow_id}:${run.event}`;
    if (!latest.has(key) || latest.get(key).id < run.id) latest.set(key, run);
  }
  return [...latest.values()];
}

async function unresolvedThreads(github, owner, repo, number) {
  let cursor = null;
  for (;;) {
    const data = await github.graphql(`query($owner:String!,$repo:String!,$number:Int!,$cursor:String) {
      repository(owner:$owner,name:$repo) { pullRequest(number:$number) {
        reviewThreads(first:100,after:$cursor) { nodes { isResolved } pageInfo { hasNextPage endCursor } }
      } }
    }`, {owner, repo, number, cursor});
    const threads = data.repository?.pullRequest?.reviewThreads;
    if (!threads) throw new Error('Cannot read PR review threads.');
    if (threads.nodes.some(thread => thread.isResolved !== true)) return true;
    if (!threads.pageInfo.hasNextPage) return false;
    if (!threads.pageInfo.endCursor || threads.pageInfo.endCursor === cursor) throw new Error('Invalid review thread pagination.');
    cursor = threads.pageInfo.endCursor;
  }
}

async function publication(github, owner, repo, sleep) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      await github.rest.actions.createWorkflowDispatch({owner, repo, workflow_id: 'pages.yml', ref: 'main'});
      return;
    } catch (error) {
      if (attempt === 3) throw new Error(`Pages dispatch failed after merge (HTTP ${error.status || 'unknown'}). Rerun with publish_only and the merged PR number.`);
      await sleep(attempt * 1000);
    }
  }
}

async function run({github, context, core, enabled = false, dryRun = false, publishOnly = false, sleep = ms => new Promise(resolve => setTimeout(resolve, ms))}) {
  const {owner, repo} = context.repo;
  if (`${owner}/${repo}`.toLowerCase() !== REPOSITORY) return 'disabled';
  if (!enabled) {
    core.notice('Market auto-merge pilot is disabled.');
    return 'disabled';
  }
  const input = context.payload.inputs?.pull_request_number;
  const number = input ? Number(input) : null;
  if (input && (!Number.isSafeInteger(number) || number < 1)) throw new Error('Invalid pull request number.');
  if (publishOnly) {
    if (context.eventName !== 'workflow_dispatch' || !number || dryRun) throw new Error('Publication recovery requires a merged PR number and workflow_dispatch.');
    const {data: pr} = await github.rest.pulls.get({owner, repo, pull_number: number});
    if (!pr.merged || pr.merged_by?.login !== 'github-actions[bot]' || pr.base.ref !== 'main' || pr.base.repo.full_name.toLowerCase() !== REPOSITORY) throw new Error('Publication recovery only accepts a PR merged by this pilot into market main.');
    await publication(github, owner, repo, sleep);
    core.notice(`Requested Pages publication again for merged PR #${number}.`);
    return 'publication-requested';
  }
  const pulls = number ? [{number}] : await github.paginate(github.rest.pulls.list, {owner, repo, state: 'open', base: 'main', per_page: 100});
  const outcomes = [];
  for (const candidate of pulls) {
    const n = candidate.number;
    const getPull = async () => (await github.rest.pulls.get({owner, repo, pull_number: n})).data;
    const pr = await getPull();
    const hold = reason => {core.notice(`#${n}: ${reason}`); outcomes.push([String(n), reason]);};
    if (pr.state !== 'open' || pr.merged || pr.draft) {hold('closed or draft'); continue;}
    if (pr.base.ref !== 'main' || pr.base.repo.full_name.toLowerCase() !== REPOSITORY) {hold('outside pilot target'); continue;}
    const sha = pr.head.sha;
    if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Invalid PR head.');
    const comments = await github.paginate(github.rest.issues.listComments, {owner, repo, issue_number: n, per_page: 100});
    const review = nativeReview(comments, sha);
    if (review?.status !== 'completed' || review.has_unresolved_findings !== false || typeof review.has_any_findings !== 'boolean') {hold('latest head has no completed, clear native Codex review'); continue;}
    const reviews = await github.paginate(github.rest.pulls.listReviews, {owner, repo, pull_number: n, per_page: 100});
    if (changesRequested(reviews)) {hold('a reviewer still requests changes'); continue;}
    if (await unresolvedThreads(github, owner, repo, n)) {hold('unresolved review discussion'); continue;}
    const runs = latestRuns((await github.paginate(github.rest.actions.listWorkflowRunsForRepo, {owner, repo, head_sha: sha, per_page: 100})).filter(run => run.head_sha === sha));
    if (CI_PATHS.some(path => !runs.some(run => run.path?.split('@')[0] === path && run.event === 'pull_request' && run.status === 'completed' && run.conclusion === 'success'))) {hold('required PR validation or bridge tests have not succeeded'); continue;}
    if (runs.some(run => run.status !== 'completed' || !['success', 'skipped'].includes(run.conclusion))) {hold('a current-head workflow is pending or unsuccessful'); continue;}
    const checks = await github.paginate(github.rest.checks.listForRef, {owner, repo, ref: sha, filter: 'latest', per_page: 100});
    if (checks.some(check => check.status !== 'completed' || !['success', 'skipped'].includes(check.conclusion))) {hold('a check is pending or unsuccessful'); continue;}
    const statuses = await github.paginate(github.rest.repos.listCommitStatusesForRef, {owner, repo, ref: sha, per_page: 100});
    const latestStatuses = new Map();
    for (const status of statuses) if (!latestStatuses.has(status.context)) latestStatuses.set(status.context, status);
    if ([...latestStatuses.values()].some(status => status.state !== 'success')) {hold('a commit status has not passed'); continue;}
    const current = await getPull();
    if (current.state !== 'open' || current.draft || current.head.sha !== sha || current.base.sha !== pr.base.sha || current.updated_at !== pr.updated_at) {hold('PR changed during verification'); continue;}
    if (current.mergeable !== true || current.mergeable_state !== 'clean') {hold('branch protection, conflicts or an outdated base prevent merging'); continue;}
    if (dryRun) {hold(`eligible (dry run), reviewed ${sha}`); continue;}
    let result;
    try {
      result = (await github.rest.pulls.merge({owner, repo, pull_number: n, sha, merge_method: 'squash', commit_title: `${pr.title} (#${n})`, commit_message: `Automatically merged after native Codex review and CI.\n\nReviewed head: ${sha}\n\n<!-- codex-market-auto-merge -->`})).data;
    } catch (error) {
      if ([405, 409].includes(error.status)) {hold('GitHub rejected a changed or no-longer-mergeable PR'); continue;}
      throw new Error(`Merge request failed for #${n} (HTTP ${error.status || 'unknown'}).`);
    }
    if (result.merged !== true) throw new Error(`GitHub did not confirm merge for #${n}.`);
    core.notice(`Merged #${n}: reviewed ${sha}, merge ${result.sha}.`);
    await publication(github, owner, repo, sleep);
    outcomes.push([String(n), `merged ${result.sha}; Pages requested`]);
  }
  await core.summary.addHeading('Market Codex auto-merge pilot').addTable([['PR', 'Result'], ...outcomes]).write();
  return outcomes;
}

module.exports = {run, nativeReview, changesRequested};
