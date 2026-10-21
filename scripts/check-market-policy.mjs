import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import semver from 'semver';

const { satisfies, valid, validRange } = semver;

// The override lets a local DSH installation provide the same pinned validator without reinstalling it.
const moduleId = process.env.DSH_MARKET_VALIDATOR
  ? pathToFileURL(resolve(process.env.DSH_MARKET_VALIDATOR)).href
  : '@deepseek-ai/dsh-plugin-market-index';
const { parseMarketIndex } = await import(moduleId);

const indexUrl = 'https://fuxi-ailabs.github.io/dsh-plugin-market/index.json';
// `.dsh-version` is the single runtime version this catalog is gated against.
const declaredVersion = (await readFile('.dsh-version', 'utf8')).trim();
const dshVersion = valid(declaredVersion);
if (dshVersion === null) {
  throw new Error(`.dsh-version must contain exactly one valid SemVer version, got ${JSON.stringify(declaredVersion)}`);
}
const index = parseMarketIndex(JSON.parse(await readFile('public/index.json', 'utf8')), indexUrl);

const failures = [];
// publishTimestamp is Unix seconds; a millisecond value would land decades in the future.
const latestAllowedTimestamp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

for (const plugin of index.plugins) {
  for (const version of plugin.versions) {
    const label = `${plugin.name}@${version.version}`;
    const range = version.engines.dsh;
    if (range === undefined) {
      failures.push(`${label}: missing engines.dsh; declare the DSH range this version supports`);
    } else if (range.trim() === '') {
      failures.push(`${label}: engines.dsh must not be empty`);
    } else if (validRange(range) === null) {
      failures.push(`${label}: engines.dsh ${JSON.stringify(range)} is not a valid SemVer range`);
    } else if (!satisfies(dshVersion, range, { includePrerelease: true })) {
      // Mirrors the install-time check in dsh-app-boot, including its prerelease matching.
      failures.push(`${label}: engines.dsh ${range} does not cover .dsh-version ${dshVersion}`);
    }

    if (version.publishTimestamp > latestAllowedTimestamp) {
      failures.push(`${label}: publishTimestamp ${version.publishTimestamp} looks like milliseconds; use Unix seconds`);
    }

    const source = version.source;
    if (source.type === 'git') {
      if (!/^[0-9a-f]{40}$/.test(source.commit)) {
        failures.push(`${label}: git source must pin a full 40-character lowercase commit SHA, got ${JSON.stringify(source.commit)}`);
      }
      if (source.path !== undefined && (source.path.startsWith('/') || source.path.split('/').includes('..'))) {
        failures.push(`${label}: git source path must be a repository-relative directory, got ${JSON.stringify(source.path)}`);
      }
      let url;
      try {
        url = new URL(source.url);
      } catch {
        // Reported by the protocol check below.
      }
      if (url?.protocol !== 'https:') {
        failures.push(`${label}: git source url must be an https URL, got ${JSON.stringify(source.url)}`);
      }
    } else if (source.type === 'npm' && source.registry !== undefined) {
      let registry;
      try {
        registry = new URL(source.registry);
      } catch {
        // Reported by the protocol check below.
      }
      if (registry?.protocol !== 'https:') {
        failures.push(`${label}: npm registry must be an https URL, got ${JSON.stringify(source.registry)}`);
      }
    }
  }
}

if (failures.length > 0) {
  throw new Error(`Market policy failed for DSH ${dshVersion}:\n- ${failures.join('\n- ')}`);
}

const versionCount = index.plugins.reduce((count, plugin) => count + plugin.versions.length, 0);
console.log(`Market policy valid for DSH ${dshVersion}: ${index.plugins.length} plugin(s), ${versionCount} version(s).`);
