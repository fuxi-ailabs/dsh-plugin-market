export async function publishIssue(plan, { config, token, upstreamToken, runUrl, request }) {
  if (!config.notifications.allowedRepositories.includes(plan.repository)) throw Error('Issue repository is not allowlisted');
  const mode = config.notifications.mode;
  if (!['draft', 'market', 'upstream'].includes(mode)) throw Error('Unknown notification mode');
  if (mode === 'draft') return 'draft';
  const target = mode === 'upstream' ? plan.repository : config.reportRepository;
  const credential = mode === 'upstream' ? upstreamToken : token;
  if (!credential) return 'draft';
  const matches = [];
  for (let page = 1; ; page++) {
    const issues = await request(`/repos/${target}/issues?state=all&per_page=100&page=${page}`, { token: credential });
    matches.push(...issues.filter(i => !i.pull_request && i.body?.includes(plan.marker)));
    if (issues.length < 100) break;
    if (page >= 20) throw Error('Issue deduplication exceeded scan budget; refusing to create duplicates');
  }
  const body = `${plan.body}\n${plan.occurrence}\nIntended plugin repository: https://github.com/${plan.repository}\nEvidence: ${runUrl}\n`;
  const existing = matches.find(i => i.state === 'open') || matches[0];
  if (!existing) {
    await request(`/repos/${target}/issues`, { token: credential, method: 'POST', body: { title: plan.title, body } });
    return 'created';
  }
  if (existing.body.includes(plan.occurrence)) return 'unchanged';
  await request(`/repos/${target}/issues/${existing.number}`, {
    token: credential, method: 'PATCH',
    body: { state: 'open', body: existing.body + '\n\n---\n\n' + body }
  });
  return 'updated';
}
