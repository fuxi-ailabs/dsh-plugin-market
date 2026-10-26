import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// The override lets a local DSH installation provide the same pinned validator without reinstalling it.
const moduleId = process.env.DSH_MARKET_VALIDATOR
  ? pathToFileURL(resolve(process.env.DSH_MARKET_VALIDATOR)).href
  : '@deepseek-ai/dsh-plugin-market-index';
const { parseMarketIndex, marketInstallTarget } = await import(moduleId);
const indexUrl = 'https://fuxi-ailabs.github.io/dsh-plugin-market/index.json';
const raw = JSON.parse(await readFile('public/index.json', 'utf8'));
const index = parseMarketIndex(raw, indexUrl);

// Pages deploys only this allowlisted catalog directory. No plugin archives or source trees belong here.
const allowedTopLevel = new Set(['.nojekyll', 'index.html', 'index.json', 'icons', 'plugins']);
for (const entry of await readdir('public', { withFileTypes: true })) {
  if (!allowedTopLevel.has(entry.name) || (entry.isDirectory() && !['icons', 'plugins'].includes(entry.name))) {
    throw new Error(`Unapproved publication path: public/${entry.name}`);
  }
}
// Each page is reviewed independently. Add its exact resource list here before publishing.
const publicPages = new Map([['agentlineage', new Set([
  'index.html', 'styles.css', 'page.js', 'demo-data.js',
  'assets/before-dsh.jpg', 'assets/after-viewer.jpg',
])]]);
// Exact documentation URLs are reviewed alongside each page, never inferred from its content.
const publicLinks = new Map([['agentlineage', new Set([
  'https://github.com/fuxi-ailabs/AgentLineage/blob/bf28b828710f1c146895bdfb63108934edbd1fe5/integrations/dsh/README.md',
  'https://github.com/fuxi-ailabs/AgentLineage/tree/bf28b828710f1c146895bdfb63108934edbd1fe5/integrations/dsh',
])]]);
for (const directory of await readdir('public/plugins', { withFileTypes: true })) {
  if (!directory.isDirectory() || !publicPages.has(directory.name)) {
    throw new Error(`Unapproved plugin page: ${directory.name}`);
  }
  const allowed = publicPages.get(directory.name);
  const found = new Set();
  const walk = async (prefix = '') => {
    for (const entry of await readdir(`public/plugins/${directory.name}/${prefix}`, { withFileTypes: true })) {
      const path = prefix + entry.name;
      if (entry.isDirectory() && [...allowed].some(file => file.startsWith(path + '/'))) {
        await walk(path + '/');
      } else if (entry.isFile() && allowed.has(path)) {
        const data = await readFile(`public/plugins/${directory.name}/${path}`);
        if (path.endsWith('.jpg')) {
          if (data[0] !== 0xff || data[1] !== 0xd8 || data.at(-2) !== 0xff || data.at(-1) !== 0xd9) {
            throw new Error(`Invalid JPEG: ${path}`);
          }
        } else if (path.endsWith('.mp4')) {
          if (data.toString('ascii',4,8) !== 'ftyp') throw new Error(`Invalid MP4: ${path}`);
        } else if (path.endsWith('.webm')) {
          if (data.subarray(0,4).toString('hex') !== '1a45dfa3') throw new Error(`Invalid WebM: ${path}`);
        } else if (path.endsWith('.vtt') && !data.toString('utf8').startsWith('WEBVTT')) {
          throw new Error(`Invalid captions: ${path}`);
        } else if (/Bearer |core-token|api_key|(?:^|[\s"'<>=(])[A-Za-z]:[\\/]|Administrator/m.test(data.toString('utf8'))) {
          throw new Error(`Review private data in page asset: ${path}`);
        }
        found.add(path);
      } else {
        throw new Error(`Unapproved page asset: ${directory.name}/${path}`);
      }
    }
  };
  await walk();
  if (found.size !== allowed.size) throw new Error(`Missing page resources: ${directory.name}`);
  const html = await readFile(`public/plugins/${directory.name}/index.html`, 'utf8');
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  for (const [, url] of html.matchAll(/\b(?:src|href|poster)="([^"]+)"/g)) {
    if (url.startsWith('#') ? !ids.has(url.slice(1)) : !allowed.has(url) && !publicLinks.get(directory.name)?.has(url)) {
      throw new Error(`Unreviewed page link: ${url}`);
    }
  }
}
for (const slug of publicPages.keys()) await readFile(`public/plugins/${slug}/index.html`);
for (const entry of await readdir('public/icons', { withFileTypes: true })) {
  if (!entry.isFile() || !/^[a-z0-9-]+\.(svg|png|jpg|jpeg|webp)$/.test(entry.name)) {
    throw new Error(`Unapproved icon: ${entry.name}`);
  }
}
for (const plugin of index.plugins) {
  if (!plugin.homepage) throw new Error(`Plugin needs an introduction page: ${plugin.name}`);
  const homepage = new URL(plugin.homepage);
  const pagePrefix = new URL('plugins/', indexUrl);
  if (homepage.origin !== pagePrefix.origin || !homepage.pathname.startsWith(pagePrefix.pathname) || homepage.search || homepage.hash) {
    throw new Error(`Plugin homepage must be a reviewed market page: ${plugin.name}`);
  }
  const slug = homepage.pathname.slice(pagePrefix.pathname.length).replace(/\/$/, '');
  if (!publicPages.has(slug)) throw new Error(`Missing reviewed plugin page: ${slug}`);
  if (plugin.icon?.startsWith(new URL('icons/', indexUrl).href)) {
    await readFile(new URL(plugin.icon).pathname.replace('/dsh-plugin-market/', 'public/'));
  }
  for (const version of plugin.versions) {
    console.log(`${plugin.name}@${version.version}: ${marketInstallTarget(plugin.name, version).spec}`);
  }
}
console.log(`Valid DSH format ${raw.format}: ${index.plugins.length} plugin(s). Publication directory: public/ only.`);
