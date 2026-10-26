import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve('public');
const port = Number(process.env.PORT || 4173);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.mp4':'video/mp4','.webm':'video/webm','.vtt':'text/vtt; charset=utf-8'};
createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    let path = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (path !== root && !path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    const data = await readFile(path);
    const headers = {'Content-Type':types[extname(path)] || 'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
    if (request.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
      const start = match?.[1] ? Number(match[1]) : Math.max(0, data.length - Number(match?.[2]));
      const end = match?.[1] && match[2] ? Math.min(Number(match[2]), data.length - 1) : data.length - 1;
      if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= data.length || end < start) {
        response.writeHead(416, {...headers,'Content-Range':`bytes */${data.length}`}).end(); return;
      }
      response.writeHead(206, {...headers,'Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1});
      response.end(request.method === 'HEAD' ? undefined : data.subarray(start,end+1)); return;
    }
    response.writeHead(200, {...headers,'Content-Length':data.length});
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch { response.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Plugin page preview: http://127.0.0.1:${port}/plugins/agentlineage/`));
