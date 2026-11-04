import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { advanceState, issuePlans, validateContract, digest } from './core.mjs';
import { github, readState, putFile } from './github.mjs';
import { publishIssue } from './notify.mjs';
const {values}=parseArgs({options:{plan:{type:'string',default:'compatibility-plan.json'},reports:{type:'string',default:'compatibility-reports'},'dry-run':{type:'boolean',default:false}}});
const config=JSON.parse(await readFile('compatibility/monitor.json','utf8'));
const contracts=await Promise.all(config.contracts.map(async f=>validateContract(JSON.parse(await readFile(f,'utf8')))));
const plan=JSON.parse(await readFile(values.plan,'utf8'));
const reports=[];
const trustedProbe=digest(await readFile('scripts/compatibility/probe.mjs'));
for(const file of await readdir(values.reports).catch(e=>{if(e.code==='ENOENT')return[];throw e;})){
  if(!file.endsWith('.json'))continue;
  const r=JSON.parse(await readFile(join(values.reports,file),'utf8'));
  if(r.schemaVersion!==1||r.scope!=='version-compatibility'||!plan.versions.includes(r.candidate))throw Error('Unexpected report identity');
  const c=contracts.find(c=>c.id===r.contractId&&c.plugin===r.plugin&&c.version===r.pluginVersion);
  if(!c)throw Error('Report is not for a configured contract');
  if(r.baseline!==config.baseline || r.identity?.contract!==digest(c) || r.identity?.probe!==trustedProbe)throw Error('Report baseline or probe differs from trusted configuration');
  reports.push(r);
}
const runUrl=process.env.GITHUB_RUN_ID?`https://github.com/${config.reportRepository}/actions/runs/${process.env.GITHUB_RUN_ID}`:'local pilot';
const plans=reports.flatMap(r=>issuePlans(r,contracts.find(c=>c.id===r.contractId)));
const missing=plan.versions.filter(v=>!reports.some(r=>r.candidate===v));
const summary=['Version compatibility only; business functionality is not assessed.','', '| Plugin | Baseline → candidate | Result |', '|---|---|---|',...reports.map(r=>`| ${r.plugin}@${r.pluginVersion} | ${r.baseline} → ${r.candidate} | ${r.status} |`),'',...missing.map(v=>`No report for ${v}; retained as pending, with no compatibility verdict.`),...plans.map(p=>`Issue draft: ${p.title}\n\n${p.body}`)].join('\n');
await writeFile('compatibility-summary.md',summary+'\n');
if(process.env.GITHUB_STEP_SUMMARY)await writeFile(process.env.GITHUB_STEP_SUMMARY,summary+'\n',{flag:'a'});
if(values['dry-run']){console.log(JSON.stringify({reports:reports.length,issueDrafts:plans.length,published:false}));process.exit(0);}
const token=process.env.GH_TOKEN;
if(!token)throw Error('Report publisher token is missing');
const state=advanceState(await readState(config,token),plan,reports,runUrl);
const repo=config.reportRepository;
const ref=await github(`/repos/${repo}/git/ref/heads/${config.stateBranch}`,{token,missing:true});
if(!ref){const main=await github(`/repos/${repo}/git/ref/heads/main`,{token});await github(`/repos/${repo}/git/refs`,{token,method:'POST',body:{ref:'refs/heads/'+config.stateBranch,sha:main.object.sha}});}
let published=0;
for(const p of plans){
  const action=await publishIssue(p,{config,token,upstreamToken:process.env.COMPAT_ISSUE_TOKEN,runUrl,request:github});
  if(action==='draft')console.log('Retained issue draft for '+p.repository);
  else published++;
}
await putFile(repo,config.stateBranch,'latest.json',{scope:'version-compatibility',runUrl,reports:reports.map(({baselineRuns,candidateRuns,issueDrafts,workDirectory,...r})=>r),drafts:plans},token);
await putFile(repo,config.stateBranch,'state.json',state,token);
console.log(JSON.stringify({reports:reports.length,issuesProcessed:published,stateBranch:config.stateBranch,pending:state.pending.length}));
