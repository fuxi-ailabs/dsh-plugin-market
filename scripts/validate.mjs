import { readFile, readdir } from 'node:fs/promises';
import { resolve, posix } from 'node:path';
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
const publicPages = new Map([['plugins/skillopt', new Set(['index.html', 'styles.css', 'page.js', 'demo-data.js', 'assets/manual-suite.jpg', 'assets/automatic-suite.jpg'])], ['plugins/agentlineage', new Set([
  'index.html', 'styles.css', 'page.js', 'demo-data.js',
  'assets/before-dsh.jpg', 'assets/after-viewer.jpg',
  'assets/dsh-release-note-demo.mp4', 'assets/dsh-release-note-poster.jpg', 'assets/dsh-release-note-zh.vtt',
])], ['templates/plugin-page', new Set([
  'index.html', 'styles.css', 'page.js', 'demo-data.js', 'content.example.json',
  'review.css', 'assets/overview.svg', 'assets/demo.svg', 'assets/before.svg', 'assets/after.svg',
])], ['plugins/crowdmemory', new Set([
  'adapters.html', 'changelog.html', 'configuration.html', 'docs.css', 'docs.js',
  'errors.html', 'evaluation.html', 'faq.html', 'index.html',
  'limits.html', 'push.html', 'runtime.html', 'security.html',
  'stats.html', 'team.html', 'tools.html', 'versions.html',
  'workflow.html',
  'styles.css', 'page.js', 'demo-data.js', 'assets/before-memory.jpg', 'assets/after-memory.jpg',
  'assets/crowdmemory-demo.mp4', 'assets/crowdmemory-demo-poster.jpg',
  'assets/crowdmemory-demo-zh.vtt', 'assets/demo-evidence.json',
  'assets/coding-memory.jpg', 'assets/coding-agent-demo.mp4',
  'assets/coding-agent-poster.jpg', 'assets/coding-agent-zh.vtt', 'assets/coding-evidence.json',
  'assets/libpng-before.jpg', 'assets/libpng-after.jpg',
  'media-controls.js', 'media-controls.css', 'assets/coding-agent-demo-1080p.mp4', 'assets/coding-agent-preview.jpg',
  'assets/harmony-python-demo-1080p-redacted.mp4',
  'assets/harmony-python-preview-redacted.jpg', 'assets/harmony-python-zh.vtt', 'assets/harmony-python-evidence.json',
])], ['plugins/workflow-rsi', new Set([
  'index.html', 'styles.css', 'page.js', 'demo-data.js',
  'guide.html', 'tools.html', 'errors.html', 'versions.html', 'docs.css', 'docs.js',
  'assets/rsi-loop.jpg', 'assets/before-run-stop.jpg', 'assets/after-loop-pr.jpg',
  'assets/console-plugins.jpg', 'assets/console-agent.jpg', 'assets/console-commands.jpg',
  'assets/console-demo.mp4', 'assets/console-demo-poster.jpg', 'assets/console-demo-zh.vtt',
])], ['plugins/ecat', new Set([
  'index.html', 'styles.css', 'page.js', 'demo-data.js',
  'assets/before-without-plugin.jpg', 'assets/after-with-plugin.jpg', 'assets/hero-loop.jpg',
  'media-controls.js', 'media-controls.css', 'assets/ecat-demo-1080p.mp4', 'assets/ecat-demo-720p.mp4', 'assets/ecat-demo-poster.jpg', 'assets/ecat-demo-zh.vtt',
])], ['plugins/dog', new Set([
  'index.html', 'styles.css', 'page.js', 'demo-data.js',
  'assets/before-chat.jpg', 'assets/after-debugger.jpg', 'assets/hero-debugger.jpg',
])], ['plugins/dt-verify', new Set([
  'index.html', 'styles.css', 'page.js', 'demo-data.js', 'guide.html', 'docs.css', 'docs.js',
  'assets/verify-flow.jpg', 'assets/fix-before.jpg', 'assets/fix-after.jpg',
  'assets/dsh-install-demo.mp4', 'assets/dsh-install-demo-poster.jpg', 'assets/dsh-install-demo-zh.vtt',
])], ['plugins/observe', new Set([
  'index.html', 'styles.css', 'page.js', 'assets/icon.svg',
  'assets/observe-session.png', 'assets/observe-actions.png',
  'assets/observe-environment.jpg', 'assets/observe-runtime.jpg',
  'assets/observe-demo.webm', 'assets/observe-demo-poster.png', 'assets/observe-demo-zh.vtt',
])], ['plugins/score', new Set([
  'index.html', 'styles.css', 'page.js', 'assets/icon.svg',
  'assets/score-detail.png', 'assets/score-dial-hover.png', 'assets/score-actions.png',
  'assets/score-page.jpg',
  'assets/score-demo.webm', 'assets/score-demo-poster.png', 'assets/score-demo-zh.vtt',
])], ['plugins/audit', new Set([
  'index.html', 'styles.css', 'page.js', 'assets/icon.svg', 'assets/audit-workbench.jpg', 'assets/audit-flyout.jpg',
  'assets/audit-demo.mp4', 'assets/audit-demo-zh.vtt',
])], ['plugins/static-check', new Set([
  'index.html', 'styles.css', 'page.js', 'assets/icon.svg',
  'assets/static-check-hero.jpg', 'assets/static-check-workbench.jpg', 'assets/static-check-environment.jpg',
  'assets/static-check-vet.jpg', 'assets/static-check-critique.jpg',
])], ['plugins/skill-eval', new Set([
  'index.html', 'styles.css', 'page.js', 'assets/icon.svg', 'assets/skill-eval-workbench.jpg',
  'assets/skill-eval-demo.mp4', 'assets/skill-eval-demo-zh.vtt',
])], ['plugins/redundancy-check', new Set([
  'index.html', 'styles.css', 'page.js', 'assets/icon.svg',
  'assets/redundancy-overview.png', 'assets/redundancy-annotations.png', 'assets/redundancy-evidence.png',
  'assets/before-coverage.png',
])]]);
// Exact documentation URLs are reviewed alongside each page, never inferred from its content.
const publicLinks = new Map([['plugins/skillopt', new Set(['https://fuxi-ailabs.github.io/dsh-plugin-market/', 'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/skillopt/', "https://github.com/fuxi-ailabs/dsh-skillopt-dist/blob/7f901e565f0b34976b87fc7c85f538b441b69aaf/README.md", 'https://github.com/fuxi-ailabs/dsh-skillopt-dist'])], ['plugins/workflow-rsi', new Set([
  'https://fuxi-ailabs.github.io/dsh-plugin-market/',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/workflow-rsi/',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/workflow-rsi/guide.html',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/workflow-rsi/tools.html',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/workflow-rsi/errors.html',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/workflow-rsi/versions.html',
  'https://registry.npmjs.org/@fuxi-ailabs/workflow-rsi/-/workflow-rsi-0.1.0-alpha.1.tgz',
  'https://registry.npmjs.org/@fuxi-ailabs/workflow-rsi-dsh-console/-/workflow-rsi-dsh-console-0.1.0-alpha.1.tgz',
])], ['plugins/crowdmemory', new Set([
  'https://fuxi-ailabs.github.io/dsh-plugin-market/',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/crowdmemory/',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/crowdmemory/configuration.html',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/crowdmemory/changelog.html',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/crowdmemory/adapters.html',
  'https://www.npmjs.com/package/@fuxi-ailabs/crowdmemory-dsh-adapter',
  'https://www.npmjs.com/package/@fuxi-ailabs/crowdmemory-openclaude-plugin',
  'https://www.npmjs.com/package/@fuxi-ailabs/crowdmemory-opencode-adapter',
  'https://www.npmjs.com/package/@fuxi-ailabs/crowdmemory-codex-plugin',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/crowdmemory/evaluation.html',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/crowdmemory/tools.html',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/crowdmemory/assets/coding-evidence.json',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/crowdmemory/assets/harmony-python-evidence.json',
  'https://gitcode.com/third-party-library-for-harmony/CrowdMemory/pull/7',
  'https://gitcode.com/third-party-library-for-harmony/CrowdMemory/tree/archive-eval-20261110/results/crowdmemory-pr7-development-20261101',
  'https://gitcode.com/third-party-library-for-harmony/CrowdMemory/tree/archive-eval-20261110/results/pr4-candidate-utility',
])], ['plugins/agentlineage', new Set([
  'https://fuxi-ailabs.github.io/dsh-plugin-market/',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/agentlineage/',
  'https://github.com/fuxi-ailabs/AgentLineage/blob/211057da3b42eabbf92a7f723ce8c3fa46ce05ef/integrations/dsh/README.md',
])], ['plugins/ecat', new Set([
  'https://github.com/fuxi-ailabs/ECAT',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/ecat/',
])], ['plugins/dog', new Set([
  'https://fuxi-ailabs.github.io/dsh-plugin-market/',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/dog/',
  'https://github.com/Fun10165/dsh-dog',
  'https://www.npmjs.com/package/@fuxi-ailabs/dsh-dog',
])], ['plugins/observe', new Set([
  'https://fuxi-ailabs.github.io/dsh-plugin-market/',
  'https://www.npmjs.com/package/context-insight',
  'https://www.npmjs.com/package/@fuxi-ailabs/dsh-observe-bundle',
])], ['plugins/score', new Set([
  'https://fuxi-ailabs.github.io/dsh-plugin-market/',
  'https://www.npmjs.com/package/context-insight',
  'https://www.npmjs.com/package/@fuxi-ailabs/dsh-score-bundle',
])], ['plugins/audit', new Set([
  'https://fuxi-ailabs.github.io/dsh-plugin-market/',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/audit/',
  'https://www.npmjs.com/package/@fuxi-ailabs/dsh-audit-bundle',
])], ['plugins/static-check', new Set([
  'https://fuxi-ailabs.github.io/dsh-plugin-market/',
  'https://www.npmjs.com/package/@fuxi-ailabs/dsh-static-check-bundle',
])], ['plugins/skill-eval', new Set([
  'https://fuxi-ailabs.github.io/dsh-plugin-market/',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/skill-eval/',
  'https://www.npmjs.com/package/@fuxi-ailabs/dsh-eval-bundle',
])], ['plugins/redundancy-check', new Set([
  'https://fuxi-ailabs.github.io/dsh-plugin-market/',
  'https://www.npmjs.com/package/@fuxi-ailabs/dsh-redundancy-check-bundle',
])], ['plugins/dt-verify', new Set([
  'https://fuxi-ailabs.github.io/dsh-plugin-market/',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/dt-verify/',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/dt-verify/guide.html',
  'https://www.npmjs.com/package/@fuxi-ailabs/dsh-dt-verify',
])], ['templates/plugin-page', new Set([
  'https://fuxi-ailabs.github.io/dsh-plugin-market/',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/templates/plugin-page/',
  'https://github.com/fuxi-ailabs/dsh-plugin-market/blob/main/docs/plugin-page-template.md',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/agentlineage/',
  'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/agentlineage/#recording',
])]]);
// HMBot reviewed resources begin
publicPages.set("plugins/hmbot", new Set(["index.html","styles.css","page.js","demo-data.js","assets/workflow.jpg","assets/conversation.jpg","assets/knowledge.jpg","assets/device.jpg"]));
publicLinks.set("plugins/hmbot", new Set(["https://fuxi-ailabs.github.io/dsh-plugin-market/","https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/hmbot/","https://www.npmjs.com/package/@fuxi-ailabs/hmbot","https://github.com/deepseek-ai/deepseek-harness"]));
// HMBot reviewed resources end
for (const root of pageRoots) {
  for (const entry of await readdir(`public/${root}`, { withFileTypes:true })) {
    if (!entry.isDirectory() || !publicPages.has(`${root}/${entry.name}`)) {
      throw new Error(`Unapproved page: ${root}/${entry.name}`);
    }
  }
}
for (const [page, allowed] of publicPages) {
  const found = new Set();
  const htmlFiles = new Map();
  const walk = async (prefix = '') => {
    for (const entry of await readdir(`public/${page}/${prefix}`, { withFileTypes: true })) {
      const path = prefix + entry.name;
      if (entry.isDirectory() && [...allowed].some(file => file.startsWith(path + '/'))) {
        await walk(path + '/');
      } else if (entry.isFile() && allowed.has(path)) {
        const data = await readFile(`public/${page}/${path}`);
        if (path.endsWith('.html')) htmlFiles.set(path, data.toString('utf8'));
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
  const idsByFile = new Map([...htmlFiles].map(([file, html]) => [file,
    new Set([...html.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)].map(match => match[2]))]));
  for (const [file, html] of htmlFiles) {
    for (const [, , rawUrl] of html.matchAll(/\b(?:src|href|poster)\s*=\s*(["'])(.*?)\1/gi)) {
      // Existing documentation uses numeric HTML entities in registry links.
      const url = rawUrl.replace(/&#(x[\da-f]+|\d+);|&amp;/gi, (entity, number) =>
        number ? String.fromCodePoint(Number(number[0].toLowerCase() === 'x' ? '0' + number : number)) : '&');
      if (url === 'data:,' || publicLinks.get(page)?.has(url)) continue;
      const hash = url.indexOf('#');
      const target = hash === -1 ? url : url.slice(0, hash);
      const fragment = hash === -1 ? undefined : url.slice(hash + 1);
      const path = target ? posix.normalize(posix.join(posix.dirname(file), target)) : file;
      if (/^(?:[a-z][a-z\d+.-]*:|\/)/i.test(url) || !allowed.has(path) ||
          (fragment !== undefined && !idsByFile.get(path)?.has(fragment))) {
        throw new Error(`Unreviewed page link in ${page}/${file}: ${rawUrl}`);
      }
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
