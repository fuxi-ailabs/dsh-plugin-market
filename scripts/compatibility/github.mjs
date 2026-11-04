export async function github(path, { token, method = 'GET', body, missing = false } = {}) {
  if (!path.startsWith('/repos/')) throw Error('Unexpected GitHub API path');
  const response = await fetch('https://api.github.com' + path, { method,
    headers: { accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', ...(token ? { authorization: 'Bearer ' + token } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30000) });
  if (response.status === 404 && missing) return undefined;
  if (!response.ok) throw Error(`GitHub ${method} ${path.split('?')[0]} returned ${response.status}`);
  return response.status === 204 ? undefined : response.json();
}
export async function readState(config, token) {
  const file = await github(`/repos/${config.reportRepository}/contents/state.json?ref=${encodeURIComponent(config.stateBranch)}`, { token, missing: true });
  if (!file) return { schemaVersion: 1, knownVersions: undefined, pending: [] };
  if (file.encoding !== 'base64' || typeof file.content !== 'string') throw Error('Unexpected state file');
  return JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
}
export async function putFile(repository, branch, path, value, token) {
  if (!['state.json', 'latest.json'].includes(path) || !/^[\w.-]+$/.test(branch) || !/^[\w.-]+\/[\w.-]+$/.test(repository)) throw Error('Unexpected report destination');
  const existing = await github(`/repos/${repository}/contents/${path}?ref=${encodeURIComponent(branch)}`, { token, missing: true });
  return github(`/repos/${repository}/contents/${path}`, { token, method: 'PUT', body: { branch, message: 'compatibility: update ' + path, content: Buffer.from(JSON.stringify(value, null, 2) + '\n').toString('base64'), ...(existing ? { sha: existing.sha } : {}) } });
}
