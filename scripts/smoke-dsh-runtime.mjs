import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, readdir, symlink, realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const { values } = parseArgs({ options: {
  anchor: { type: 'string' }, home: { type: 'string' },
  packages: { type: 'string' }, output: { type: 'string' },
} });
if (!values.anchor || !values.home) {
  throw new Error('Usage: npm run smoke:runtime -- --anchor <dsh/package.json> --home <isolated-directory> [--packages <node_modules>] [--output <result.json>]');
}
const home = resolve(values.home);
const marker = join(home, '.dsh-market-smoke');
try {
  const files = await readdir(home);
  if (files.length && !files.includes('.dsh-market-smoke')) throw new Error('Refusing to use a non-empty home that this smoke check did not create');
} catch (e) { if (e.code !== 'ENOENT') throw e; }
await mkdir(home, { recursive: true });
await writeFile(marker, 'Isolated DSH market compatibility smoke check\n');
process.env.DSH_HOME = home;
process.env.HOME = home;
process.env.DSH_TELEMETRY = '0';

const anchor = resolve(values.anchor);
const runtimeRequire = createRequire(anchor);
const load = async id => import(pathToFileURL(runtimeRequire.resolve(id)).href);
const catalog = JSON.parse(await readFile(new URL('../public/index.json', import.meta.url), 'utf8'));
const profileDir = join(home, 'profiles', 'compat');
await mkdir(join(profileDir, 'node_modules'), { recursive: true });
if (values.packages) {
  const source = join(resolve(values.packages), '@fuxi-ailabs');
  const target = join(profileDir, 'node_modules', '@fuxi-ailabs');
  try { await symlink(source, target, process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (e) { if (e.code !== 'EEXIST' || await realpath(source) !== await realpath(target)) throw e; }
}
const bundles = ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', '@fuxi-ailabs/dsh-runtime-bundle', ...catalog.plugins.map(p => p.name)];
await writeFile(join(profileDir, 'package.json'), JSON.stringify({ name: 'dsh-market-smoke', private: true, dsh: { profile: { bundles } } }, null, 2));
// Keep external-service setup out of this host/API check.
await writeFile(join(profileDir, 'cordis.patch.yml'), [
  '- id: dsh-insight\n  config:\n    autoInstall: false\n    autoStart: false\n    requireInsightUp: false',
  '- id: dsh-audit\n  config:\n    autoInstall: false',
  '- id: dsh-static-check\n  config:\n    siftRuntime:\n      autoInstall: false',
  '- id: dsh-eval-suite\n  config:\n    autoInstall: false',
].join('\n') + '\n');

const expected = {
  'dsh-agentlineage': { tools: ['lineage_query', 'lineage_import', 'lineage_status'] },
  'crowdmemory-dsh-adapter': { tools: ['memory_search', 'memory_read', 'memory_note'] },
  'workflow-rsi-dsh-console': { tools: ['wrsi_state', 'wrsi_report'], commands: ['wrsi'] },
  'dsh-ecat': { commands: ['ecat-setup', 'ecat-refine'], skills: ['ecat-setup', 'ecat-refine'] },
  'dsh-dt-verify': { tools: ['dtv_subagent'], skills: ['dt-verify'] },
  'dsh-insight-bundle': { commands: ['insight', 'score'] },
  'dsh-audit-bundle': { tools: ['sift_audit'], commands: ['sift'] },
  'dsh-static-check-bundle': { tools: ['skill_static_check'], commands: ['skill-check'] },
  'dsh-eval-bundle': { tools: ['eval_suite'], commands: ['eval-suite'] },
  'dsh-skillopt': { tools: ['skillopt_status', 'skillopt_assets', 'skillopt_open'], commands: ['skillopt'] },
};
const result = { runtime: JSON.parse(await readFile(anchor, 'utf8')).version, status: 'failed', plugins: [], calls: [] };
let boot;
let handle;
try {
  const { runProfile } = await load('@deepseek-ai/dsh/profile-boot');
  const { createLaunchEnvironmentSnapshot } = await load('@deepseek-ai/dsh-launch-environment');
  boot = await runProfile({ profile: 'compat', patchFiles: [], args: ['--no-open', '--port', '0'],
    environment: createLaunchEnvironmentSnapshot([{ source: 'process', values: process.env }]) });
  const ctx = boot.ctx;
  const project = join(home, 'project');
  await mkdir(project, { recursive: true });
  handle = await ctx.agents.create({ sessionId: `compat-${randomUUID()}`, meta: { cwd: project }, agentOptions: { provider: 'compat-offline', model: 'offline' } });
  const { scopeOf } = await load('@deepseek-ai/dsh-scope');
  const scope = scopeOf(handle.agent.ctx);
  const capabilities = {
    tools: ctx.tools.schemas(scope).map(t => t.name),
    commands: ctx.commands.list(handle.agent).map(c => c.name),
    skills: (await ctx.skills.snapshot({ cwd: project, scope })).skills.map(s => s.name),
  };
  for (const plugin of catalog.plugins) {
    const contract = expected[plugin.name.split('/').at(-1)];
    if (!contract) throw new Error(`Missing smoke contract: ${plugin.name}`);
    const missing = Object.entries(contract).flatMap(([kind, names]) => names.filter(n => !capabilities[kind].includes(n)).map(n => `${kind}:${n}`));
    result.plugins.push({ name: plugin.name, missing });
    if (missing.length) throw new Error(`${plugin.name}: missing ${missing.join(', ')}`);
  }
  for (const [name, args] of [['skillopt_status', {}], ['memory_search', { query: 'compatibility smoke' }], ['lineage_status', {}]]) {
    const signal = AbortSignal.timeout(15000);
    const modern = typeof ctx.tools.definitions === 'function';
    const input = modern
      ? { calls: [{ type: 'tool-call', id: `compat-${name}`, name, arguments: JSON.stringify(args) }], agent: handle.agent, signal }
      : { callId: `compat-${name}`, name, arguments: args, agent: handle.agent, signal };
    const value = await ctx.tools.execute(input);
    const outcome = modern ? value.results[0]?.result : value;
    result.calls.push({ name, isError: outcome?.isError, contentBlocks: outcome?.content?.length, value: outcome?.value });
    if (outcome?.isError !== false || !outcome.content?.length) throw new Error(`${name}: native execution failed or returned no model-visible content`);
  }
  result.status = 'passed';
} catch (e) { result.error = e.stack ?? String(e); }
finally {
  try { await handle?.dispose(); await boot?.shutdown.shutdown(0); }
  catch (e) { result.status = 'failed'; result.shutdownError = e.stack ?? String(e); }
  const output = resolve(values.output ?? join(home, 'result.json'));
  await writeFile(output, JSON.stringify(result, null, 2) + '\n');
  console.log(`${result.status}: DSH ${result.runtime}; ${result.plugins.length} plugins; ${result.calls.length} native calls; ${output}`);
  if (result.error) console.error(result.error);
  process.exit(result.status === 'passed' ? 0 : 1);
}
