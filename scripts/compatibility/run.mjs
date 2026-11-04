import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import semver from 'semver';
import { digest, supports, validateContract, classifyComparison, issuePlans } from './core.mjs';

const {values}=parseArgs({options:{candidate:{type:'string'},baseline:{type:'string'},'baseline-anchor':{type:'string'},'candidate-anchor':{type:'string'},contract:{type:'string',default:'compatibility/contracts/dt-verify.json'},work:{type:'string'},output:{type:'string'},attempts:{type:'string',default:'2'}}});
if(!semver.valid(values.candidate)||!values.work||!values.output)throw Error('Required: --candidate exact-version --work isolated-root --output report.json');
const repo=resolve(fileURLToPath(new URL('../..',import.meta.url)));
const config=JSON.parse(await readFile(join(repo,'compatibility/monitor.json'),'utf8'));
const contract=validateContract(JSON.parse(await readFile(resolve(values.contract),'utf8')));
const baseline=values.baseline||config.baseline;
if(!semver.valid(baseline))throw Error('Invalid baseline');
const attempts=Number(values.attempts);
if(!Number.isInteger(attempts)||attempts<2||attempts>3)throw Error('Use two or three fresh attempts');
const root=join(resolve(values.work),'run-'+Date.now());
await mkdir(root,{recursive:true});
const probe=join(repo,'scripts/compatibility/probe.mjs');
const base={contract,baseline,candidate:values.candidate,identity:{contract:digest(contract),probe:digest(await readFile(probe)),platform:process.platform+'-'+process.arch,node:process.version},controls:{},baselineRuns:[],candidateRuns:[]};
const scrub=s=>String(s||'').replace(/([?&]token=)[^\s&]+/g,'$1[redacted]').replace(/https:\/\/[^\s/@]+:[^\s/@]+@/g,'https://[redacted]@');
async function run(executable,args,env={},timeout=120000){
  return await new Promise(resolveResult=>{
    let stdout='',stderr='',timedOut=false;
    const child=spawn(executable,args,{env:{...process.env,...env},windowsHide:true,detached:process.platform!=='win32',stdio:['ignore','pipe','pipe']});
    child.stdout.on('data',b=>{stdout=(stdout+b).slice(-100000);});
    child.stderr.on('data',b=>{stderr=(stderr+b).slice(-100000);});
    const timer=setTimeout(()=>{timedOut=true;if(process.platform==='win32'){try{execFileSync('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});}catch{child.kill();}}else{try{process.kill(-child.pid,'SIGKILL');}catch{child.kill('SIGKILL');}}},timeout);
    child.once('error',error=>{clearTimeout(timer);resolveResult({exitCode:null,error:scrub(error.message),stdout:scrub(stdout),stderr:scrub(stderr),timedOut});});
    child.once('close',exitCode=>{clearTimeout(timer);resolveResult({exitCode,stdout:scrub(stdout),stderr:scrub(stderr),timedOut});});
  });
}
async function npm(args){
  if(process.env.npm_execpath||process.platform==='win32'){
    const cli=process.env.npm_execpath||join(dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
    await access(cli);return run(process.execPath,[cli,...args],{},600000);
  }
  return run('npm',args,{},600000);
}
async function host(version,anchor,label){
  if(!anchor){
    const prefix=join(root,label+'-host');await mkdir(prefix,{recursive:true});
    const install=await npm(['install','--prefix',prefix,'--save-exact','--no-audit','--no-fund',`@deepseek-ai/dsh@${version}`]);
    await writeFile(join(root,label+'-host-install.json'),JSON.stringify(install,null,2));
    if(install.exitCode!==0)throw Error('Host installation failed: '+(install.error||install.stderr||install.stdout).slice(-4000));
    anchor=join(prefix,'node_modules/@deepseek-ai/dsh/package.json');
  }
  anchor=resolve(anchor);
  const manifest=JSON.parse(await readFile(anchor,'utf8'));
  if(manifest.version!==version)throw Error(`Host identity mismatch: wanted ${version}, got ${manifest.version}`);
  if(manifest.engines?.node&&!semver.satisfies(process.version,manifest.engines.node))throw Error(`Host requires Node ${manifest.engines.node}; runner is ${process.version}`);
  return {anchor,cli:join(dirname(anchor),typeof manifest.bin==='string'?manifest.bin:manifest.bin.dsh),installMode:values[label+'-anchor']?'existing-host':'registry-install'};
}
async function profile(home,from){
  const dir=join(home,'profiles/observed');await mkdir(dir,{recursive:true});await mkdir(join(home,'project'),{recursive:true});
  await writeFile(join(dir,'cordis.yml'),'[]\n');
  if(from){for(const f of ['package.json','pnpm-workspace.yaml','pnpm-lock.yaml'])await copyFile(join(from,f),join(dir,f));}
  else{
    await writeFile(join(dir,'package.json'),JSON.stringify({name:'dsh-compatibility-observed',private:true,dsh:{profile:{bundles:['@deepseek-ai/dsh-base','@deepseek-ai/dsh-web-app']}}},null,2));
    await writeFile(join(dir,'pnpm-workspace.yaml'),'packages:\n  - .\nnodeLinker: hoisted\nautoInstallPeers: false\n');
  }
  return dir;
}
async function probeHost(runtime,label,home,c){
  const input=join(root,label+'.input.json'),output=join(root,label+'.probe.json');
  await writeFile(input,JSON.stringify({anchor:runtime.anchor,home,project:join(home,'project'),output,contract:c}));
  const execution=await run(process.execPath,[probe,input],{DSH_HOME:home,HOME:home},90000);
  await writeFile(join(root,label+'.log'),execution.stdout+'\n'+execution.stderr);
  try{return JSON.parse(await readFile(output,'utf8'));}catch{return {ok:false,node:process.version,platform:process.platform+'-'+process.arch,error:execution.error||(execution.stderr||execution.stdout).slice(-4000)||'Probe timed out or returned no report'};}
}
async function artifact(){
  const url=`${config.registry}/${encodeURIComponent(contract.plugin)}/${contract.version}`;
  const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('Plugin metadata HTTP '+response.status);
  const meta=await response.json();
  if(meta.name!==contract.plugin||meta.version!==contract.version||meta.engines?.dsh!==contract.range)throw Error('Contract/package identity or engines mismatch');
  const tarball=new URL(meta.dist.tarball);
  if(tarball.protocol!=='https:'||tarball.hostname!==new URL(config.registry).hostname)throw Error('Unexpected tarball origin');
  const fetched=await fetch(tarball,{signal:AbortSignal.timeout(60000)});
  if(!fetched.ok)throw Error('Plugin tarball HTTP '+fetched.status);
  const bytes=Buffer.from(await fetched.arrayBuffer());
  if(bytes.length>50*1024*1024)throw Error('Plugin tarball exceeds contract budget');
  const integrity='sha512-'+createHash('sha512').update(bytes).digest('base64');
  if(meta.dist.integrity!==integrity)throw Error('Plugin tarball integrity mismatch');
  const file=join(root,'plugin.tgz');await writeFile(file,bytes);
  return {file,integrity,source:tarball.href};
}
let report;
try{
  if(!supports(contract.range,values.candidate))report=classifyComparison(base);
  else{
    const pm=process.platform==='win32'?await run('cmd.exe',['/d','/s','/c','pnpm --version']):await run('pnpm',['--version']);
    if(pm.exitCode!==0||pm.stdout.trim()!==config.pnpmVersion)throw Error(`Prerequisite: pnpm ${config.pnpmVersion} required; ${pm.error||pm.stderr||pm.stdout||'not available'}`);
    base.identity.packageManager='pnpm@'+pm.stdout.trim();
    const runtimes={};
    for(const [label,version]of [['baseline',baseline],['candidate',values.candidate]]){
      try{runtimes[label]=await host(version,values[label+'-anchor'],label);const home=join(root,'control-'+label);await profile(home);base.controls[label]=await probeHost(runtimes[label],'control-'+label,home);base.controls[label].installMode=runtimes[label].installMode;}
      catch(e){base.controls[label]={ok:false,error:scrub(e.message)};}
    }
    if(!base.controls.baseline.ok||!base.controls.candidate.ok)report=classifyComparison(base);
    else{
      const pinned=await artifact();base.identity.artifact=pinned.integrity;base.identity.artifactSource=pinned.source;
      let seed;
      for(const label of ['baseline','candidate'])for(let i=0;i<attempts;i++){
        const home=join(root,label+'-'+i),dir=await profile(home,seed);
        const packageArgs=seed?['install','--frozen-lockfile']:['add','--save-exact',pinned.file];
        const installed=await run(process.execPath,[runtimes[label].cli,'plugin','--profile','observed',...packageArgs],{DSH_HOME:home,HOME:home},180000);
        await writeFile(join(root,`${label}-${i}-install.json`),JSON.stringify(installed,null,2));
        const observation={identity:{...base.identity},cases:[]};
        if(installed.exitCode!==0){
          const error=(installed.error||installed.stderr||installed.stdout).slice(-4000);
          const blocked=/ENOTFOUND|EAI_AGAIN|ECONNRESET|ETIMEDOUT|401|403|429|timed out/i.test(error)||installed.timedOut;
          observation.cases.push({id:'installation',status:blocked?'BLOCKED':'FAIL',code:'INSTALL_FAILED',error});
        }else{
          const lock=digest(await readFile(join(dir,'pnpm-lock.yaml')));
          if(!seed){seed=dir;base.identity.dependencies=lock;}
          observation.identity={...base.identity,dependencies:lock};
          observation.cases.push({id:'installation',status:'PASS'});
          const result=await probeHost(runtimes[label],`${label}-${i}`,home,contract);
          observation.identity.node=result.node;observation.identity.platform=result.platform;
          observation.cases.push(...(result.cases||[]));
          if(!result.cases?.length)observation.cases.push({id:'bundle-registration',status:'BLOCKED',code:'PROBE_FAILED',error:result.error});
        }
        base[label+'Runs'].push(observation);
      }
      report=classifyComparison(base);
    }
  }
}catch(error){report={...base,schemaVersion:1,scope:'version-compatibility',contractId:contract.id,plugin:contract.plugin,pluginVersion:contract.version,repository:contract.repository,status:'BLOCKED',cases:[],error:scrub(error.stack||error),deferred:contract.deferred};}
report.issueDrafts=issuePlans(report,contract);
report.workDirectory=root;
await mkdir(dirname(resolve(values.output)),{recursive:true});
await writeFile(resolve(values.output),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({plugin:contract.plugin,baseline,candidate:values.candidate,status:report.status,cases:report.cases?.map(c=>({id:c.id,status:c.status})),issueDrafts:report.issueDrafts.length,output:resolve(values.output)}));
