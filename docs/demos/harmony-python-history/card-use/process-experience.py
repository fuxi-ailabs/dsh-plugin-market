"""Run Center candidate formation and validation on the Runtime's sealed note evidence."""
import json
from pathlib import Path
import sys
from crowdmemory_runtime.local_store import LocalStore
from crowdmemory_runtime.draft_upload import build_draft, validate_draft
from guizang.contracts import ContractLoader
from guizang.template_ingest import TemplateBatch, load_template, template_digest, form_candidates, DraftEvidenceReplay
from guizang.validation import validate_candidate

runtime = Path(sys.argv[1]).resolve()
workspace = Path(__file__).resolve().parent
output = workspace / 'pipeline'
output.mkdir(exist_ok=True)
store = LocalStore.open(runtime)
refs = [row['record_ref'] for row in store.query('SELECT record_ref FROM records WHERE topic_key=?', ('harmony/native-loader-launch',))]
if len(refs) != 1:
    raise SystemExit('Expected exactly one launcher memory')
profile = load_template('session-default', '3')
pin = {'id':profile['id'], 'revision':str(profile['revision']), 'digest':template_digest(profile)}
draft = build_draft(store, refs[0], host_id='card-use-demo', profile_pin=pin, dimensions=[])
store.close()
if draft is None:
    raise SystemExit('Note-producing task must be sealed before Center processing')
validate_draft(draft)
envelopes = {}
raw_output = output / 'raw'
raw_output.mkdir(exist_ok=True)
for path in (runtime/'outbox/pending').glob('*.json'):
    value = json.loads(path.read_text())
    if value.get('schema') == 'crowdmemory-experience-envelope/v1':
        envelopes[value['event_id']] = value
        if value['event_id'] in draft['raw_refs']:
            (raw_output / path.name).write_bytes(path.read_bytes())
batch = TemplateBatch(envelopes=envelopes, drafts=[draft])
candidates, report = form_candidates(profile, batch)
if len(candidates) != 1:
    raise SystemExit(json.dumps(report))
formed = candidates[0]
validation = validate_candidate(formed.candidate, formed.episodes, ContractLoader(),
                                DraftEvidenceReplay(formed.episodes), suite_revision='launcher-card-demo/v1')
for name, value in [('draft',draft),('candidate',formed.candidate),('validation',validation),('aggregation',report)]:
    (output/(name+'.json')).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
reporting = {'raw_envelopes':len(formed.episodes), 'draft_revision':draft['revision'], 'groups':report['groups'],
             'candidate_id':formed.candidate['candidate_id'], 'record_ref':refs[0],
             'checks':{item['name']:item['status'] for item in validation['checks']},
             'support_tier':formed.candidate['support']['tier'], 'recommendation':validation['recommendation']}
(output/'summary.json').write_text(json.dumps(reporting,ensure_ascii=False,indent=2)+'\n')
checks=' / '.join(f"{name}={state}" for name,state in reporting['checks'].items())
(workspace/'experience-pipeline.md').write_text(f'''# 经验处理链路

| 步骤 | 输入与产物 |
|---|---|
| 采集 | DSH 工具失败、脚本修改、测试输出、Agent 笔记 |
| 封存 | {len(formed.episodes)} 份 Raw，draft r{draft['revision']} |
| 聚合 | 按 project + topic_key 聚合为 {report['groups']} 组 |
| 提炼 | {formed.candidate['candidate_id']} |
| 核验 | {checks} |
| 本地卡片 | {refs[0]} · local_auto |
| 中心候选 | {reporting['support_tier']} · {validation['recommendation']} |

中心候选保留独立来源与审阅门槛，本地卡片可进入后续 Agent 的上下文。
''')
print(json.dumps(reporting,ensure_ascii=False,indent=2))
