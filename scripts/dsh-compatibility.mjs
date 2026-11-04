import semver from 'semver';

export function supportedDshVersions(target, versions) {
  if (!semver.valid(target)) throw new Error(`Invalid .dsh-version: ${JSON.stringify(target)}`);
  if (!Array.isArray(versions) || versions.length === 0 || versions.some(v => typeof v !== 'string' || !semver.valid(v))) {
    throw new Error('.dsh-compatibility.json versions must be a non-empty array of valid SemVer versions');
  }
  if (new Set(versions).size !== versions.length) throw new Error('Duplicate DSH compatibility version');
  if (!versions.includes(target)) throw new Error(`DSH compatibility matrix must include .dsh-version ${target}`);
  return versions;
}

export function unsupportedDshVersions(range, versions) {
  return versions.filter(version => !semver.satisfies(version, range, { includePrerelease: true }));
}

export function uncoveredDshVersions(pluginVersions, runtimes) {
  return runtimes.filter(runtime => !pluginVersions.some(version =>
    typeof version.engines?.dsh === 'string' && semver.validRange(version.engines.dsh) &&
    semver.satisfies(runtime, version.engines.dsh, { includePrerelease: true })));
}
