'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {run} = require('./codex-review-bridge.cjs');
const SHA = 'a'.repeat(40);
const NEXT = 'b'.repeat(40);
const stateComment = (status, id = 1) => ({id, user: {login: 'chatgpt-codex-connector[bot]'}, body: `<!-- codex-review-state:v1 ${JSON.stringify({code_review: {commit_sha: SHA, status}})} -->`, updated_at: `2026-10-30T02:00:0${id}Z`});

function fixture({repository = 'fuxi-ailabs/dsh-plugin-market', initial = [], response = ['completed'], eventHead = SHA, currentHead = SHA, draft = false, dispatch = false} = {}) {
  let requests = [];
  let comments = [...initial];
  let readsAfterRequest = 0;
  const [owner, repo] = repository.split('/');
  const context = {repo: {owner, repo}, runId: 123, payload: dispatch ? {inputs: {pull_request_number: '23'}} : {pull_request: {number: 23, head: {sha: eventHead}}}};
  const github = {
    rest: {
      pulls: {get: async () => ({data: {state: 'open', draft, base: {repo: {full_name: repository}}, head: {sha: currentHead}}})},
      issues: {listComments: {}, createComment: async request => {requests.push(request); return {data: {html_url: 'https://github.com/request'}};}},
    },
    paginate: async () => {
      if (requests.length) {
        const status = response[Math.min(requests.length - 1, response.length - 1)];
        readsAfterRequest += 1;
        if (status) {
          const comment = stateComment(status, readsAfterRequest + 1);
          comment.body = comment.body.replace(SHA, currentHead);
          comments = [comment];
        }
      }
      return comments;
    },
  };
  const summary = {addHeading: () => summary, addRaw: () => summary, write: async () => {}};
  const core = {notice() {}, warning() {}, summary};
  return {requests, github, context, core, sleep: async () => {}, maxPolls: 2};
}

test('other repositories cannot request a review', async () => {
  const f = fixture({repository: 'fuxi-ailabs/other'});
  f.github.rest.pulls.get = async () => {throw new Error('must not access this repository');};
  assert.equal(await run(f), 'disabled');
  assert.equal(f.requests.length, 0);
});
test('a completed native review is not requested twice', async () => {
  const f = fixture({initial: [stateComment('completed')]});
  assert.equal(await run(f), 'completed');
  assert.equal(f.requests.length, 0);
});
test('an out-of-order synchronize event reviews the current API head', async () => {
  const f = fixture({currentHead: NEXT});
  assert.equal(await run(f), 'completed');
  assert.equal(f.requests.length, 1);
  assert(f.requests[0].body.includes(`head=${NEXT}`));
});
test('a native review arriving during the grace period is reused', async () => {
  const f = fixture();
  f.sleep = async () => {f.github.paginate = async () => [stateComment('completed')];};
  assert.equal(await run(f), 'completed');
  assert.equal(f.requests.length, 0);
});
test('a new head is requested and must reach native completed', async () => {
  const f = fixture({draft: true});
  assert.equal(await run(f), 'completed');
  assert.equal(f.requests.length, 1);
  assert(f.requests[0].body.startsWith('@codex review\n'));
  assert(f.requests[0].body.includes(`head=${SHA} attempt=1`));
});
test('a failed review is retried once without mistaking the old failure for a new response', async () => {
  const f = fixture({initial: [stateComment('failed')], response: ['failed', 'completed']});
  assert.equal(await run(f), 'completed');
  assert.equal(f.requests.length, 2);
  assert(f.requests[1].body.includes('attempt=2'));
});
test('an unchanged old failure cannot consume a second request', async () => {
  const old = stateComment('failed');
  const f = fixture({initial: [old]});
  let reads = 0;
  f.github.paginate = async () => !f.requests.length ? [old] : [++reads === 1 ? old : stateComment('completed', 3)];
  assert.equal(await run(f), 'completed');
  assert.equal(f.requests.length, 1);
});
test('repeated native failure stops after two requests', async () => {
  const f = fixture({response: ['failed']});
  await assert.rejects(run(f), /after 2 automatic requests/);
  assert.equal(f.requests.length, 2);
});
test('a silent native service times out instead of reporting success', async () => {
  const f = fixture({response: [null]});
  await assert.rejects(run(f), /after 2 automatic requests/);
  assert.equal(f.requests.length, 2);
});
test('a forged marker from a PR author cannot suppress an automatic review', async () => {
  const initial = [{user: {login: 'contributor'}, body: `@codex review\n<!-- fuxi-codex-review head=${SHA} attempt=2 -->`}];
  const f = fixture({initial, repository: 'fuxi-ailabs/HMBot', dispatch: true});
  assert.equal(await run(f), 'completed');
  assert.equal(f.requests.length, 1);
});
test('the request limit survives another workflow run for the same head', async () => {
  const initial = [stateComment('failed'), {user: {login: 'github-actions[bot]'}, created_at: '2026-10-30T02:00:00Z', body: `@codex review\n<!-- fuxi-codex-review head=${SHA} attempt=2 -->`}];
  const f = fixture({initial});
  await assert.rejects(run(f), /after 2 automatic requests/);
  assert.equal(f.requests.length, 0);
});
test('a resumed job waits for the unanswered second request instead of rejecting an old failure', async () => {
  const initial = [stateComment('failed'), {user: {login: 'github-actions[bot]'}, created_at: '2026-10-30T02:00:02Z', body: `@codex review\n<!-- fuxi-codex-review head=${SHA} attempt=2 -->`}];
  const f = fixture({initial});
  f.sleep = async () => {f.github.paginate = async () => [stateComment('completed', 3)];};
  assert.equal(await run(f), 'completed');
  assert.equal(f.requests.length, 0);
});
