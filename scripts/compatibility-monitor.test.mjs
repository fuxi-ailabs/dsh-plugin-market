import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COMPATIBILITY_CASES, digest, classifyComparison, issuePlans, discoverVersions, advanceState, validateContract } from './compatibility/core.mjs';
import { publishIssue } from './compatibility/notify.mjs';
const contract=JSON.parse(await readFile(new URL('../compatibility/contracts/dt-verify.json',import.meta.url),'utf8'));
function input(){
  const identity={artifact:'sha512-fixture',contract:digest(contract),probe:'probe-fixture',dependencies:'lock-fixture',platform:'linux-x64',node:'v24.19.0',packageManager:'pnpm@11.7.0'};
  const observation=()=>({identity:{...identity},cases:[...COMPATIBILITY_CASES].map(id=>({id,status:'PASS'}))});
  return {contract,baseline:'0.2.1-rc.2',candidate:'0.2.2-alpha.3',identity,controls:{baseline:{ok:true},candidate:{ok:true}},baselineRuns:[observation(),observation()],candidateRuns:[observation(),observation()]};
}
function fail(runs,id,error='ctx.api is not a function'){
  for(const r of runs)Object.assign(r.cases.find(c=>c.id===id),{status:'FAIL',code:'TypeError',error});
}
test('version monitor passes only its tested scope, without business claims',()=>{
  const report=classifyComparison(input());
  assert.equal(report.status,'PASS_TESTED_SCOPE');assert.equal(report.scope,'version-compatibility');
  assert.ok(report.deferred.some(d=>d.id==='device-ut-ui'));assert.deepEqual(issuePlans(report,contract),[]);
});
test('repeatable host API regression is eligible for a version-only issue',()=>{
  const x=input();fail(x.candidateRuns,'preset-composition');
  const r=classifyComparison(x);assert.equal(r.status,'CONFIRMED_REGRESSION');
  const plans=issuePlans(r,contract);assert.equal(plans.length,1);assert.match(plans[0].body,/no business-function/);
});
test('business failure cannot trigger an automatic compatibility issue',()=>{
  const x=input();for(const r of x.candidateRuns)r.cases.push({id:'business-result',status:'FAIL',error:'wrong answer'});
  const report=classifyComparison(x);assert.equal(report.status,'PASS_TESTED_SCOPE');
  report.status='CONFIRMED_REGRESSION';report.issueDrafts=[{title:'forged business alert'}];
  assert.deepEqual(issuePlans(report,contract),[]);
});
test('bare host/harness failure suppresses all plugin issues',()=>{
  const x=input();x.controls.candidate.ok=false;fail(x.candidateRuns,'bundle-registration');
  const r=classifyComparison(x);assert.equal(r.status,'HOST_OR_HARNESS_BLOCKED');assert.deepEqual(issuePlans(r,contract),[]);
});
test('a preexisting failure is not called a new DSH regression',()=>{
  const x=input();fail(x.baselineRuns,'installation');fail(x.candidateRuns,'installation');
  const r=classifyComparison(x);assert.equal(r.status,'BASELINE_FAILURE');assert.deepEqual(issuePlans(r,contract),[]);
});
test('a flaky result or a single attempt is insufficient',()=>{
  const x=input();fail([x.candidateRuns[0]],'skill-load');assert.equal(classifyComparison(x).status,'INCONCLUSIVE');
  x.candidateRuns=x.candidateRuns.slice(0,1);assert.equal(classifyComparison(x).status,'INCONCLUSIVE');
  const y=input();y.baselineRuns=y.baselineRuns.slice(0,1);fail(y.candidateRuns,'skill-load');
  assert.equal(classifyComparison(y).status,'INCONCLUSIVE');
});
test('different errors on two attempts are not a confirmed regression',()=>{
  const x=input();fail([x.candidateRuns[0]],'installation','missing dependency');fail([x.candidateRuns[1]],'installation','unexpected manifest');
  assert.equal(classifyComparison(x).status,'INCONCLUSIVE');
});
test('dependency, artifact, probe and runtime drift suppress issues',()=>{
  for(const field of ['dependencies','artifact','probe','node','platform','contract','packageManager']){
    const x=input();fail(x.candidateRuns,'bundle-registration');x.candidateRuns[0].identity[field]='changed';
    const r=classifyComparison(x);assert.equal(r.status,'INCONCLUSIVE',field);assert.deepEqual(issuePlans(r,contract),[]);
  }
});
test('missing observations and blocked prerequisites cannot be green',()=>{
  const x=input();x.candidateRuns[0].cases=[];assert.equal(classifyComparison(x).status,'BLOCKED');
  x.candidateRuns=[];assert.equal(classifyComparison(x).status,'INCONCLUSIVE');
});
test('a version outside the package declaration is not a regression',()=>{
  const x=input();x.candidate='0.3.0-alpha.1';fail(x.candidateRuns,'installation');
  const r=classifyComparison(x);assert.equal(r.status,'NOT_DECLARED');assert.deepEqual(issuePlans(r,contract),[]);
});
test('issue target and contract identity are checked again by the publisher',()=>{
  const x=input();fail(x.candidateRuns,'tool-schema');const r=classifyComparison(x);
  assert.deepEqual(issuePlans({...r,repository:'unrelated/project'},contract),[]);
  assert.deepEqual(issuePlans({...r,identity:{...r.identity,contract:'not-trusted'}},contract),[]);
});
test('the same failure on a later DSH release uses the same deduplication marker',()=>{
  const x=input();fail(x.candidateRuns,'tool-schema');const first=issuePlans(classifyComparison(x),contract)[0];
  x.candidate='0.2.2-alpha.4';const second=issuePlans(classifyComparison(x),contract)[0];assert.equal(first.marker,second.marker);
});
test('initial discovery checks channel heads, rather than replaying all history',()=>{
  const p={versions:{'0.2.1-rc.2':{},'0.2.1-rc.5':{},'0.2.2-alpha.2':{},'0.2.2-alpha.3':{}},'dist-tags':{latest:'0.2.1-rc.5',next:'0.2.1-rc.5',alpha:'0.2.2-alpha.3'}};
  assert.deepEqual(discoverVersions(p,undefined,'r','0.2.1-rc.5').versions,['0.2.1-rc.5','0.2.2-alpha.3']);
});
test('new backports are discovered even when their SemVer is below the alpha head',()=>{
  const state={schemaVersion:1,revision:'r',knownVersions:['0.2.1-rc.5','0.2.2-alpha.3'],pending:[]};
  const p={versions:{'0.2.1-rc.5':{},'0.2.1-rc.6':{},'0.2.2-alpha.3':{}},'dist-tags':{latest:'0.2.1-rc.6',alpha:'0.2.2-alpha.3'}};
  assert.deepEqual(discoverVersions(p,state,'r','0.2.1-rc.5').versions,['0.2.1-rc.6']);
});
test('pending releases survive a failed or partial matrix run',()=>{
  const plan={revision:'r',knownVersions:['0.2.1-rc.5','0.2.2-alpha.3'],pending:['0.2.1-rc.5','0.2.2-alpha.3']};
  const state=advanceState({},plan,[{candidate:'0.2.1-rc.5',status:'HOST_OR_HARNESS_BLOCKED',identity:{}}],'run');
  assert.deepEqual(state.pending,['0.2.2-alpha.3']);assert.equal(state.observations['0.2.1-rc.5'].status,'HOST_OR_HARNESS_BLOCKED');
});
test('unknown executable contract kinds are refused',()=>{
  assert.equal(validateContract(contract),contract);assert.throws(()=>validateContract({...contract,kind:'arbitrary-shell'}));
});
test('publisher creates one issue, updates it for later releases, and does not repeat an observation',async()=>{
  const x=input();fail(x.candidateRuns,'tool-schema');
  const first=issuePlans(classifyComparison(x),contract)[0];
  const config={reportRepository:'fuxi-ailabs/dsh-plugin-market',notifications:{mode:'market',allowedRepositories:[contract.repository]}};
  const issues=[],mutations=[];
  const request=async(path,args)=>{
    if(!args.method)return structuredClone(issues);
    mutations.push({path,...args});
    if(args.method==='POST')issues.push({number:1,state:'open',...args.body});
    else Object.assign(issues[0],args.body);
  };
  const options={config,token:'fixture',runUrl:'fixture-run',request};
  assert.equal(await publishIssue(first,options),'created');
  assert.equal(await publishIssue(first,options),'unchanged');
  x.candidate='0.2.2-alpha.4';const second=issuePlans(classifyComparison(x),contract)[0];
  issues[0].state='closed';
  assert.equal(await publishIssue(second,options),'updated');
  assert.equal(await publishIssue(second,options),'unchanged');
  assert.equal(issues.length,1);assert.equal(issues[0].state,'open');assert.equal(mutations.length,2);
  assert.ok(mutations.every(m=>m.path.startsWith('/repos/fuxi-ailabs/dsh-plugin-market/issues')));
});
test('draft mode and missing upstream credentials cannot write an issue',async()=>{
  const x=input();fail(x.candidateRuns,'tool-schema');const plan=issuePlans(classifyComparison(x),contract)[0];
  const request=()=>assert.fail('No request should be made');
  for(const mode of ['draft','upstream']){
    const config={reportRepository:'fuxi-ailabs/dsh-plugin-market',notifications:{mode,allowedRepositories:[contract.repository]}};
    assert.equal(await publishIssue(plan,{config,token:'fixture',request}),'draft');
  }
  await assert.rejects(publishIssue(plan,{config:{notifications:{mode:'market',allowedRepositories:[]}},request}),/allowlisted/);
});
