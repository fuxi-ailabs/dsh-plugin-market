"""Read live Runtime receipts in SQLite using a read-only connection."""
import json
from pathlib import Path
import sqlite3
import sys

runtime = Path(sys.argv[1]).resolve()
record_ref = sys.argv[2]
session_ref = Path(__file__).with_name('session-ref.txt').read_text().strip()
connection = sqlite3.connect((runtime/'crowdmemory/local-memory.sqlite3').as_uri()+'?mode=ro', uri=True)
connection.row_factory = sqlite3.Row
tasks = {row['task_id'] for row in connection.execute('SELECT task_id FROM sessions WHERE session_ref=?', (session_ref,))}
rows = [dict(row) for row in connection.execute('SELECT * FROM receipts WHERE record_ref=? ORDER BY created_at, receipt_id', (record_ref,)) if row['task_id'] in tasks]
connection.close()
applied = [row for row in rows if row['exposure_kind']=='applied']
task_id = applied[-1]['task_id'] if applied else None
rows = [row for row in rows if row['task_id']==task_id] if task_id else rows
paths = sorted({json.loads(row['payload_json'])['path'] for row in rows if row['exposure_kind']=='applied' and 'path' in json.loads(row['payload_json'])})
summary = {'record_ref':record_ref, 'session_ref':session_ref, 'task_id':task_id,
           'pushed':sum(row['exposure_kind']=='pushed' for row in rows),
           'applied':sum(row['exposure_kind']=='applied' for row in rows),
           'applied_paths':paths,
           'receipts':[{'receipt_id':row['receipt_id'],'kind':row['kind'],'exposure_kind':row['exposure_kind'],
                        'revision':row['revision'],'payload':json.loads(row['payload_json'])} for row in rows]}
Path('memory-usage.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({key:value for key,value in summary.items() if key!='receipts'},ensure_ascii=False,indent=2))
if not summary['pushed'] or not summary['applied']:
    raise SystemExit('Waiting for injection and applied receipts')
