'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {run} = require('./codex-auto-merge.cjs');
const SHA = 'a'.repeat(40);
const BASE = 'b'.repeat(40);
const MERGE = 'c'.repeat(40);

function fixture() {
  const f = {enabled: true, dryRun: false, sleep: async () => {}, merges: [], publications: [], reads: 0};
  f.context = {repo: {owner: 'fuxi-ailabs', repo: 'dsh-plugin-market'}, payload: {}, eventName: 'workflow_run'};
  f.pr = {number: 1, title: 'Update docs', state: 'open', draft: false, merged: false, head: {sha: SHA}, base: {sha: BASE, ref: 'main', repo: {full_name: 'fuxi-ailabs/dsh-plugin-market'}}, mergeable: true, mergeable_state: 'clean', updated_at: '2026-10-31T03:00:00Z'};
  f.state = {commit_sha: SHA, status: 'completed', has_any_findings: false, has_unresolved_findings: false};
  f.comments = () => [{user: {login: 'chatgpt-codex-connector[bot]'}, updated_at: '2026-10-31T03:00:00Z', body: `<!-- codex-pull-request-review-summary -->\n<!-- codex-review-state:v1 ${JSON.stringify({code_review: f.state})} -->`}];
  f.reviews = [];
  f.threads = [];
  f.runs = ['pages.yml', 'codex-subscription-review.yml'].map((file, i) => ({id: i + 1, workflow_id: i + 1, head_sha: SHA, event: 'pull_request', path: `.github/workflows/${file}`, status: 'completed', conclusion: 'success'}));
  f.checks = [{status: 'completed', conclusion: 'success'}];
  f.statuses = [];
  const endpoints = {pulls: {list: 'pulls', listReviews: 'reviews'}, issues: {listComments: 'comments'}, actions: {listWorkflowRunsForRepo: 'runs'}, checks: {listForRef: 'checks'}, repos: {listCommitStatusesForRef: 'statuses'}};
  f.github = {
    rest: {
      ...endpoints,
      pulls: {...endpoints.pulls, get: async () => {f.reads += 1; return {data: structuredClone(f.pr)};}, merge: async request => {f.merges.push(request); return {data: {merged: true, sha: MERGE}};}},
      actions: {...endpoints.actions, createWorkflowDispatch: async request => {f.publications.push(request);}},
    },
    paginate: async endpoint => {
      if (endpoint === 'pulls') return [{number: 1}];
      if (endpoint === 'comments') return f.comments();
      return f[endpoint];
    },
    graphql: async () => ({repository: {pullRequest: {reviewThreads: {nodes: f.threads, pageInfo: {hasNextPage: false}}}}}),
  };
  const summary = {addHeading: () => summary, addTable: () => summary, write: async () => {}};
  f.core = {notice() {}, summary};
  return f;
}

test('clear current-head review and CI merge with expected SHA and request Pages', async () => {
  const f = fixture();
  await run(f);
  assert.equal(f.merges.length, 1);
  assert.equal(f.merges[0].sha, SHA);
  assert.equal(f.merges[0].merge_method, 'squash');
  assert.equal(f.publications[0].workflow_id, 'pages.yml');
  assert.equal(f.publications[0].ref, 'main');
});

test('HMBot and every other repository are outside the pilot before any API call', async () => {
  for (const repo of ['HMBot', 'other']) {
    const f = fixture(); f.context.repo.repo = repo;
    f.github.paginate = async () => {throw new Error('must not access');};
    assert.equal(await run(f), 'disabled');
  }
});

test('kill switch disables merging before reading PRs', async () => {
  const f = fixture(); f.enabled = false;
  f.github.paginate = async () => {throw new Error('must not access');};
  assert.equal(await run(f), 'disabled');
});

test('draft, closed, and non-main PRs cannot merge', async () => {
  for (const change of [{draft: true}, {state: 'closed'}, {base: {ref: 'release', repo: {full_name: 'fuxi-ailabs/dsh-plugin-market'}}}]) {
    const f = fixture(); Object.assign(f.pr, change); await run(f); assert.equal(f.merges.length, 0);
  }
});

test('old SHA, incomplete review, findings and unknown review fields fail closed', async () => {
  for (const change of [{commit_sha: BASE}, {status: 'running'}, {status: 'failed'}, {has_unresolved_findings: true}, {has_unresolved_findings: null}, {has_any_findings: undefined}]) {
    const f = fixture(); Object.assign(f.state, change); await run(f); assert.equal(f.merges.length, 0);
  }
});

test('a PR author cannot forge a native review summary', async () => {
  const f = fixture(); const original = f.comments;
  f.comments = () => original().map(c => ({...c, user: {login: 'contributor'}}));
  await run(f); assert.equal(f.merges.length, 0);
});

test('a generic bot reply quoting the marker is not a service summary', async () => {
  const f = fixture(); const original = f.comments;
  f.comments = () => original().map(c => ({...c, body: `Quoted example:\n${c.body}`}));
  await run(f); assert.equal(f.merges.length, 0);
});

test('unresolved discussion blocks even if native summary says clear', async () => {
  const f = fixture(); f.threads = [{isResolved: false}];
  await run(f); assert.equal(f.merges.length, 0);
});

test('review thread pagination cannot hide unresolved discussions', async () => {
  const f = fixture(); let pages = 0;
  f.github.graphql = async (_, args) => {
    pages += 1;
    if (pages === 1) return {repository: {pullRequest: {reviewThreads: {nodes: [{isResolved: true}], pageInfo: {hasNextPage: true, endCursor: 'next'}}}}};
    assert.equal(args.cursor, 'next');
    return {repository: {pullRequest: {reviewThreads: {nodes: [{isResolved: false}], pageInfo: {hasNextPage: false}}}}};
  };
  await run(f); assert.equal(pages, 2); assert.equal(f.merges.length, 0);
});

test('human change requests persist through comments and clear after approval', async () => {
  const f = fixture();
  f.reviews = [{id: 1, user: {login: 'owner'}, state: 'CHANGES_REQUESTED'}, {id: 2, user: {login: 'owner'}, state: 'COMMENTED'}];
  await run(f); assert.equal(f.merges.length, 0);
  f.reviews.push({id: 3, user: {login: 'owner'}, state: 'APPROVED'});
  await run(f); assert.equal(f.merges.length, 1);
});

test('resolved historical findings may merge only with clear native unresolved state', async () => {
  const f = fixture(); f.state.has_any_findings = true; f.threads = [{isResolved: true}];
  await run(f); assert.equal(f.merges.length, 1);
});

test('missing required PR workflow cannot be replaced by a similarly named check', async () => {
  const f = fixture(); f.runs = [];
  f.checks = [{name: 'validate', status: 'completed', conclusion: 'success'}];
  await run(f); assert.equal(f.merges.length, 0);
});

test('failure, pending workflow, pending check and failed status prevent merging', async () => {
  for (const mutate of [f => {f.runs[0].conclusion = 'failure';}, f => {f.runs[0].status = 'in_progress';}, f => {f.checks[0].status = 'in_progress';}, f => {f.statuses = [{context: 'external', state: 'failure'}];}]) {
    const f = fixture(); mutate(f); await run(f); assert.equal(f.merges.length, 0);
  }
});

test('a successful rerun supersedes a cancelled old run and old commit status', async () => {
  const f = fixture();
  f.runs.push({...f.runs[0], id: 0, conclusion: 'cancelled'});
  f.statuses = [{context: 'external', state: 'success'}, {context: 'external', state: 'failure'}];
  await run(f); assert.equal(f.merges.length, 1);
});

test('updated head, base, draft or PR metadata during checks prevents merging', async () => {
  for (const change of [p => {p.head.sha = BASE;}, p => {p.base.sha = MERGE;}, p => {p.draft = true;}, p => {p.updated_at = 'later';}]) {
    const f = fixture();
    f.github.rest.pulls.get = async () => {f.reads += 1; const p = structuredClone(f.pr); if (f.reads === 2) change(p); return {data: p};};
    await run(f); assert.equal(f.merges.length, 0);
  }
});

test('branch protection and an outdated base are not bypassed', async () => {
  for (const state of ['behind', 'blocked', 'dirty', 'unknown']) {
    const f = fixture(); f.pr.mergeable_state = state; await run(f); assert.equal(f.merges.length, 0);
  }
});

test('dry run reports eligibility but cannot merge or dispatch', async () => {
  const f = fixture(); f.dryRun = true;
  const result = await run(f); assert.match(result[0][1], /eligible/); assert.equal(f.merges.length, 0); assert.equal(f.publications.length, 0);
});

test('GitHub head race rejection does not dispatch Pages', async () => {
  const f = fixture(); f.github.rest.pulls.merge = async () => {throw {status: 409};};
  await run(f); assert.equal(f.publications.length, 0);
});

test('Pages dispatch is retried and persistent failure is visible after merging', async () => {
  const f = fixture(); let attempts = 0;
  f.github.rest.actions.createWorkflowDispatch = async () => {attempts += 1; throw {status: 503};};
  await assert.rejects(run(f), /Pages dispatch failed after merge/);
  assert.equal(f.merges.length, 1); assert.equal(attempts, 3);
});

test('publication recovery only accepts this repositorys bot-merged main PR', async () => {
  const f = fixture(); f.publishOnly = true; f.context.eventName = 'workflow_dispatch'; f.context.payload.inputs = {pull_request_number: '1'};
  await assert.rejects(run(f), /only accepts/);
  f.pr.merged = true; f.pr.merged_by = {login: 'github-actions[bot]'};
  assert.equal(await run(f), 'publication-requested'); assert.equal(f.merges.length, 0); assert.equal(f.publications.length, 1);
});
