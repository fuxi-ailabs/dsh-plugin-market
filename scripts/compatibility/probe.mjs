import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const input = JSON.parse(await readFile(process.argv[2], 'utf8'));
process.env.DSH_HOME = input.home;
process.env.HOME = input.home;
process.env.DSH_TELEMETRY = '0';
const result = { schemaVersion: 1, ok: false, node: process.version, platform: process.platform + '-' + process.arch, cases: [], deferred: input.contract?.deferred || [] };
let boot;
const handles = [];
const check = async (id, fn) => {
  try { const evidence = await fn(); result.cases.push({ id, status: 'PASS', evidence }); }
  catch (error) { result.cases.push({ id, status: 'FAIL', code: error.code || error.name, error: String(error.message).slice(0, 3000) }); }
};
const assert = (condition, message) => { if (!condition) throw Error(message); };
try {
  const req = createRequire(input.anchor);
  const load = id => import(pathToFileURL(req.resolve(id)).href);
  const { runProfile } = await load('@deepseek-ai/dsh/profile-boot');
  const { createLaunchEnvironmentSnapshot } = await load('@deepseek-ai/dsh-launch-environment');
  boot = await runProfile({ profile: 'observed', patchFiles: [], args: ['--no-open', '--port', '0'], environment: createLaunchEnvironmentSnapshot([{ source: 'process', values: process.env }]) });
  const ctx = boot.ctx;
  const { scopeOf } = await load('@deepseek-ai/dsh-scope');
  const h = await ctx.agents.create({ sessionId: 'compat-' + Date.now(), meta: { cwd: input.project }, agentOptions: { provider: 'compat-offline', model: 'offline' }, setup: async agent => { await ctx.agentPresets.mount(agent, 'standard'); } });
  handles.push(h);
  const scope = scopeOf(h.agent.ctx);
  const schemas = ctx.tools.schemas(scope);
  assert(Array.isArray(schemas) && ctx.commands.list(h.agent).length && (await ctx.skills.snapshot({ cwd: input.project, scope })), 'Host control services unavailable');
  result.ok = true;
  if (input.contract) {
    const c = input.contract;
    const skills = (await ctx.skills.snapshot({ cwd: input.project, scope })).skills;
    const presets = await ctx.agentPresets.list();
    await check('bundle-registration', async () => {
      for (const tool of c.tools) assert(schemas.some(t => t.name === tool), 'Missing tool ' + tool);
      for (const skill of c.skills) assert(skills.some(s => s.name === skill), 'Missing skill ' + skill);
      for (const preset of c.presets) assert(presets.some(p => p.id === preset && !p.broken), 'Missing or broken preset ' + preset);
      return { tools: c.tools, skills: c.skills, presets: c.presets };
    });
    await check('tool-schema', async () => {
      const tool = schemas.find(t => t.name === 'dtv_subagent');
      assert(tool, 'dtv_subagent missing');
      const serialized = JSON.stringify(tool);
      assert(serialized.includes('agent_preset'), 'Delegation schema lost agent_preset');
      for (const preset of c.presets) assert(serialized.includes(preset), 'Delegation schema lost role ' + preset);
      return { name: tool.name, roles: c.presets.length };
    });
    await check('skill-load', async () => {
      const modern = typeof ctx.tools.definitions === 'function';
      const args = { name: 'dt-verify' };
      const raw = await ctx.tools.execute(modern
        ? { calls: [{ type: 'tool-call', id: 'compat-skill', name: 'skill', arguments: JSON.stringify(args) }], agent: h.agent, signal: AbortSignal.timeout(15000) }
        : { callId: 'compat-skill', name: 'skill', arguments: args, agent: h.agent, signal: AbortSignal.timeout(15000) });
      const outcome = modern ? raw.results?.[0]?.result : raw;
      assert(outcome?.isError === false, 'Host skill tool failed to load dt-verify');
      const text = outcome.content?.filter(b => b.type === 'text').map(b => b.text).join('\n') || '';
      assert(text.includes('dt-verify') && text.includes('dt-verify.mjs'), 'Host returned no bundled Skill instructions');
      return { contentBlocks: outcome.content.length, characters: text.length };
    });
    await check('preset-composition', async () => {
      const evidence = [];
      for (const id of c.presets) {
        const child = await ctx.agents.create({ sessionId: 'compat-role-' + id + '-' + Date.now(), meta: { cwd: input.project }, agentOptions: { provider: 'compat-offline', model: 'offline' }, setup: async agent => { const mounted = await ctx.agentPresets.mount(agent, id); assert(mounted?.id === id && !mounted.broken, 'Preset binding did not resolve ' + id); } });
        handles.push(child);
        assert(ctx.agentPresets.composedPreset(child.agent.ctx) === id, 'Agent was not bound to ' + id);
        const names = ctx.tools.schemas(scopeOf(child.agent.ctx)).map(t => t.name);
        assert(names.includes('read') && names.includes('write'), id + ': file tools were not composed');
        evidence.push({ id, tools: names });
      }
      return evidence;
    });
  }
} catch (error) {
  result.error = String(error.stack || error).slice(0, 6000);
  if (input.contract) result.cases.push({ id: 'bundle-registration', status: 'FAIL', code: 'PROFILE_BOOT_FAILED', error: result.error });
} finally {
  let cleanupError;
  try { for (const h of handles.reverse()) await h.dispose(); await boot?.shutdown.shutdown(0); }
  catch (error) { cleanupError = String(error.message); }
  if (input.contract) result.cases.push({ id: 'unload', status: !boot ? 'NOT_TESTED' : cleanupError ? 'FAIL' : 'PASS', ...(cleanupError ? { code: 'UNLOAD_FAILED', error: cleanupError } : {}) });
  if (!input.contract && cleanupError) { result.ok = false; result.error = cleanupError; }
  await writeFile(input.output, JSON.stringify(result, null, 2) + '\n');
  process.exit(0);
}
