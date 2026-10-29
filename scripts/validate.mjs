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
const pageRoots = new Set(['plugins', 'templates']);
const allowedTopLevel = new Set(['.nojekyll', 'index.html', 'index.json', 'icons', ...pageRoots]);
for (const entry of await readdir('public', { withFileTypes: true })) {
  if (!allowedTopLevel.has(entry.name) || (entry.isDirectory() && entry.name !== 'icons' && !pageRoots.has(entry.name))) {
    throw new Error(`Unapproved publication path: public/${entry.name}`);
  }
}
// Each page is reviewed independently. Add its exact resource list here before publishing.
const publicPages = new Map([['plugins/agentlineage', new Set([
  'index.html', 'styles.css', 'page.js', 'demo-data.js',
  'assets/before-dsh.jpg', 'assets/after-viewer.jpg',
  'assets/dsh-release-note-demo.mp4', 'assets/dsh-release-note-poster.jpg', 'assets/dsh-release-note-zh.vtt',
])], ['templates/plugin-page', new Set([
  'index.html', 'styles.css', 'page.js', 'demo-data.js', 'content.example.json',
  'review.css', 'assets/overview.svg', 'assets/demo.svg', 'assets/before.svg', 'assets/after.svg',
])], ['plugins/crowdmemory', new Set([
  'changelog.html', 'configuration.html', 'docs.css', 'docs.js',
  'errors.html', 'evaluation.html', 'faq.html', 'index.html',
  'limits.html', 'push.html', 'runtime.html', 'security.html',
  'stats.html', 'team.html', 'tools.html', 'versions.html',
  'workflow.html',
])], ['plugins/workflow-rsi', new Set([
  'index.html', 'tools.html', 'errors.html', 'versions.html', 'docs.css', 'docs.js',
])], ['plugins/ecat', new Set(['index.html'])], ['plugins/dt-verify', new Set([
  'index.html', 'docs.css', 'docs.js',
  'assets/dsh-install-demo.mp4', 'assets/dsh-install-demo-poster.jpg', 'assets/dsh-install-demo-zh.vtt',
])], ['plugins/insight', new Set([
  'index.html', 'styles.css', 'assets/icon.svg',
  'assets/plugin-config.jpg', 'assets/session-button.jpg', 'assets/score-card.jpg', 'assets/insight-score.jpg',
])], ['plugins/audit', new Set([
  'index.html', 'styles.css', 'assets/icon.svg', 'assets/audit-workbench.jpg', 'assets/audit-flyout.jpg',
])], ['plugins/static-check', new Set([
  'index.html', 'styles.css', 'assets/icon.svg', 'assets/static-check-workbench.jpg',
])], ['plugins/skill-eval', new Set([
  'index.html', 'styles.css', 'assets/icon.svg', 'assets/skill-eval-workbench.jpg',
])]]);
// Exact documentation URLs are reviewed alongside each page, never inferred from its content.
const publicLinks = new Map([['plugins/agentlineage', new Set([
  'https://fuxi-ailabs.github.io/dsh-plugin-market/',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/agentlineage/',
  'https://github.com/fuxi-ailabs/AgentLineage/blob/211057da3b42eabbf92a7f723ce8c3fa46ce05ef/integrations/dsh/README.md',
  'https://github.com/fuxi-ailabs/AgentLineage/tree/211057da3b42eabbf92a7f723ce8c3fa46ce05ef/integrations/dsh',
])], ['plugins/insight', new Set([
  'https://www.npmjs.com/package/@fuxi-ailabs/dsh-insight-bundle',
  'https://github.com/guixu-labs/dsh-plugin',
])], ['plugins/audit', new Set([
  'https://www.npmjs.com/package/@fuxi-ailabs/dsh-audit-bundle',
  'https://github.com/guixu-labs/dsh-plugin',
])], ['plugins/static-check', new Set([
  'https://www.npmjs.com/package/@fuxi-ailabs/dsh-static-check-bundle',
  'https://github.com/guixu-labs/dsh-plugin',
])], ['plugins/skill-eval', new Set([
  'https://www.npmjs.com/package/@fuxi-ailabs/dsh-eval-bundle',
  'https://github.com/guixu-labs/dsh-plugin',
])], ['plugins/dt-verify', new Set([
  'https://www.npmjs.com/package/@fuxi-ailabs/dsh-dt-verify',
])], ['templates/plugin-page', new Set([
  'https://fuxi-ailabs.github.io/dsh-plugin-market/',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/templates/plugin-page/',
  'https://github.com/fuxi-ailabs/dsh-plugin-market/blob/main/docs/plugin-page-template.md',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/agentlineage/',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/agentlineage/#recording',
])]]);
for (const root of pageRoots) {
  for (const entry of await readdir(`public/${root}`, { withFileTypes:true })) {
    if (!entry.isDirectory() || !publicPages.has(`${root}/${entry.name}`)) {
      throw new Error(`Unapproved page: ${root}/${entry.name}`);
    }
  }
}
for (const [page, allowed] of publicPages) {
  const found = new Set();
  const walk = async (prefix = '') => {
    for (const entry of await readdir(`public/${page}/${prefix}`, { withFileTypes: true })) {
      const path = prefix + entry.name;
      if (entry.isDirectory() && [...allowed].some(file => file.startsWith(path + '/'))) {
        await walk(path + '/');
      } else if (entry.isFile() && allowed.has(path)) {
        const data = await readFile(`public/${page}/${path}`);
        if (path.endsWith('.svg') && (!data.toString('utf8').startsWith('<svg ') || /<script\b|<foreignObject\b|\bon\w+\s*=|\b(?:href|src)\s*=/i.test(data.toString('utf8')))) {
          throw new Error(`Review unsafe SVG content: ${page}/${path}`);
        }
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
        throw new Error(`Unapproved page asset: ${page}/${path}`);
      }
    }
  };
  await walk();
  if (found.size !== allowed.size) throw new Error(`Missing page resources: ${page}`);
  const html = await readFile(`public/${page}/index.html`, 'utf8');
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  for (const [, url] of html.matchAll(/\b(?:src|href|poster)="([^"]+)"/g)) {
    if (url.startsWith('#') ? !ids.has(url.slice(1)) : !allowed.has(url) && !publicLinks.get(page)?.has(url)) {
      throw new Error(`Unreviewed page link: ${url}`);
    }
  }
}
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
  if (!publicPages.has(`plugins/${slug}`)) throw new Error(`Missing reviewed plugin page: ${slug}`);
  if (plugin.icon?.startsWith(new URL('icons/', indexUrl).href)) {
    await readFile(new URL(plugin.icon).pathname.replace('/dsh-plugin-market/', 'public/'));
  }
  for (const version of plugin.versions) {
    console.log(`${plugin.name}@${version.version}: ${marketInstallTarget(plugin.name, version).spec}`);
  }
}
console.log(`Valid DSH format ${raw.format}: ${index.plugins.length} plugin(s). Publication directory: public/ only.`);
