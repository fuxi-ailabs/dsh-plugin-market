import { createHash } from 'node:crypto';
import semver from 'semver';

export const COMPATIBILITY_CASES = new Set(['installation', 'bundle-registration', 'skill-load', 'preset-composition', 'tool-schema', 'unload']);
export const digest = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
export function failureFingerprint(result) {
  const message = [result.code || '', result.error || 'failure'].join(': ').replace(/[A-Z]:\\[^\s]+|\/[^\s]+/gi, '<path>').replace(/\b\d{4,}\b/g, '<number>');
  return digest({ id: result.id, message });
}
export function supports(range, version) {
  return !!semver.validRange(range) && semver.satisfies(version, range, { includePrerelease: true });
}
export function validateContract(c) {
  if (c?.schemaVersion !== 1 || c.kind !== 'dt-verify' || c.id !== 'dt-verify' || c.plugin !== '@fuxi-ailabs/dsh-dt-verify') throw Error('Unsupported compatibility contract');
  if (!semver.valid(c.version) || !semver.validRange(c.range)) throw Error('Invalid contract version/range');
  if (!/^[\w.-]+\/[\w.-]+$/.test(c.repository)) throw Error('Invalid issue repository');
  for (const key of ['tools', 'skills', 'presets']) if (!Array.isArray(c[key]) || !c[key].length || c[key].some(v => typeof v !== 'string' || !v)) throw Error('Missing contract ' + key);
  return c;
}
export function classifyCase(id, baseline, candidate) {
  if (!COMPATIBILITY_CASES.has(id)) return { id, status: 'NOT_TESTED', reason: 'Outside version compatibility scope' };
  if (!baseline.length || !candidate.length) return { id, status: 'INCONCLUSIVE', reason: 'Missing observations' };
  if ([...baseline, ...candidate].some(r => r.status === 'BLOCKED' || r.status === 'NOT_TESTED')) return { id, status: 'BLOCKED', reason: 'A required observation is blocked or absent' };
  if (baseline.every(r => r.status === 'PASS') && candidate.every(r => r.status === 'PASS')) return { id, status: 'PASS' };
  if (baseline.length >= 2 && baseline.every(r => r.status === 'PASS') && candidate.length >= 2 && candidate.every(r => r.status === 'FAIL')) {
    const fingerprints = new Set(candidate.map(failureFingerprint));
    if (fingerprints.size === 1) return { id, status: 'CONFIRMED_REGRESSION', fingerprint: [...fingerprints][0], reason: candidate[0].error || candidate[0].code };
  }
  if (baseline.every(r => r.status === 'FAIL') && candidate.every(r => r.status === 'FAIL')) return { id, status: 'BASELINE_FAILURE', reason: 'Failure also exists on the baseline' };
  return { id, status: 'INCONCLUSIVE', reason: 'Flaky, changed, or insufficient observations' };
}
export function classifyComparison(input) {
  const { contract, baseline, candidate, identity, controls, baselineRuns, candidateRuns } = input;
  const common = { schemaVersion: 1, scope: 'version-compatibility', contractId: contract.id, plugin: contract.plugin, pluginVersion: contract.version, repository: contract.repository, baseline, candidate, identity, controls, baselineRuns, candidateRuns, deferred: contract.deferred || [] };
  if (!supports(contract.range, candidate) || !supports(contract.range, baseline)) return { ...common, status: 'NOT_DECLARED', cases: [] };
  if (!controls?.baseline?.ok || !controls?.candidate?.ok) return { ...common, status: 'HOST_OR_HARNESS_BLOCKED', cases: [] };
  if (!identity?.artifact || !identity?.contract || !identity?.probe || !identity?.dependencies || !identity?.platform || !identity?.node || !identity?.packageManager) return { ...common, status: 'INCONCLUSIVE', cases: [], reason: 'Missing experiment identity' };
  const allRuns = [...baselineRuns, ...candidateRuns];
  if (allRuns.some(r => ['dependencies','artifact','contract','probe','platform','node','packageManager'].some(key=>r.identity?.[key]!==identity[key]))) return { ...common, status: 'INCONCLUSIVE', cases: [], reason: 'Artifact, dependency, probe or environment drift' };
  const ids = [...COMPATIBILITY_CASES];
  const cases = ids.map(id => classifyCase(id, baselineRuns.map(r => r.cases?.find(c => c.id === id) || { status: 'NOT_TESTED' }), candidateRuns.map(r => r.cases?.find(c => c.id === id) || { status: 'NOT_TESTED' })));
  const status = cases.some(c => c.status === 'CONFIRMED_REGRESSION') ? 'CONFIRMED_REGRESSION'
    : cases.every(c => c.status === 'PASS') ? 'PASS_TESTED_SCOPE'
    : cases.some(c => c.status === 'BLOCKED') ? 'BLOCKED'
    : cases.some(c => c.status === 'BASELINE_FAILURE') ? 'BASELINE_FAILURE' : 'INCONCLUSIVE';
  return { ...common, cases, status };
}
export function issuePlans(report, contract) {
  if (report.scope !== 'version-compatibility' || report.status !== 'CONFIRMED_REGRESSION' || report.baseline === report.candidate) return [];
  if (report.plugin !== contract.plugin || report.pluginVersion !== contract.version || report.repository !== contract.repository || report.identity?.contract !== digest(contract) || !report.controls?.baseline?.ok || !report.controls?.candidate?.ok) return [];
  const recomputed = classifyComparison({ ...report, contract });
  if (recomputed.status !== 'CONFIRMED_REGRESSION') return [];
  return recomputed.cases.filter(c => c.status === 'CONFIRMED_REGRESSION').map(c => {
    const marker = `<!-- dsh-compat:${digest([contract.plugin, report.identity.platform, c.id, c.fingerprint])} -->`;
    return { repository: contract.repository, marker, occurrence: `<!-- dsh-compat-observation:${digest([marker, report.baseline, report.candidate, report.identity.contract, report.identity.dependencies])} -->`, title: `[DSH compatibility] ${contract.plugin}: ${c.id} on ${report.candidate}`,
      body: `${marker}\n\nVersion compatibility regression; no business-function or model-quality verdict.\n\n- Plugin: ${contract.plugin}@${contract.version}\n- DSH: ${report.baseline} PASS → ${report.candidate} FAIL in ${report.candidateRuns.length} fresh attempts\n- Platform: ${report.identity.platform}; Node ${report.identity.node}\n- Check: ${c.id}\n- Artifact SHA-512: ${report.identity.artifact}\n- Contract SHA-256: ${report.identity.contract}\n- Dependency lock SHA-256: ${report.identity.dependencies}\n- Error: ${String(c.reason).slice(0, 2000)}\n\nBusiness results, model behavior, SDK/device execution and visual acceptance are outside this monitor.\n` };
  });
}
export function discoverVersions(packument, state, revision, floor, max = 4) {
  if (!packument || typeof packument.versions !== 'object') throw Error('Invalid npm packument');
  const known = Object.keys(packument.versions).filter(v => semver.valid(v));
  const heads = [...new Set(Object.values(packument['dist-tags'] || {}).filter(v => semver.valid(v) && semver.gte(v, floor)))];
  const initialized = state?.schemaVersion === 1 && Array.isArray(state.knownVersions);
  const unseen = initialized ? known.filter(v => !state.knownVersions.includes(v) && semver.gte(v, floor)) : heads;
  const pending = [...new Set([...(state?.pending || []), ...unseen, ...(state?.revision !== revision ? heads : [])])].filter(v => known.includes(v) && semver.gte(v, floor)).sort(semver.compare);
  return { schemaVersion: 1, revision, knownVersions: known, pending, versions: pending.slice(0, max), heads };
}
export function advanceState(previous, plan, reports, runUrl) {
  const completed = new Set(reports.map(r => r.candidate));
  return { schemaVersion: 1, revision: plan.revision, knownVersions: plan.knownVersions, pending: plan.pending.filter(v => !completed.has(v)), updatedAt: new Date().toISOString(),
    observations: { ...(previous?.observations || {}), ...Object.fromEntries(reports.map(r => [r.candidate, { status: r.status, identity: r.identity, runUrl }])) } };
}
