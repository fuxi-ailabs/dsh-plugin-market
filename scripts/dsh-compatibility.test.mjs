import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { supportedDshVersions, unsupportedDshVersions } from './dsh-compatibility.mjs';

test('the catalog keeps the existing runtime and includes the latest target', async () => {
  const target = (await readFile(new URL('../.dsh-version', import.meta.url), 'utf8')).trim();
  const { versions } = JSON.parse(await readFile(new URL('../.dsh-compatibility.json', import.meta.url), 'utf8'));
  assert.ok(supportedDshVersions(target, versions).includes('0.2.1-rc.2'));
});

test('a range that drops the existing runtime fails even when the latest target matches', () => {
  assert.deepEqual(unsupportedDshVersions('>=0.2.2-alpha.3 <0.3.0', ['0.2.1-rc.2', '0.2.2-alpha.3']), ['0.2.1-rc.2']);
});

test('existing ranges admit newer 0.2 prereleases but stop at the next minor', () => {
  assert.deepEqual(unsupportedDshVersions('^0.2.1-rc.2', ['0.2.1-rc.5', '0.2.2-alpha.3', '0.3.0-alpha.1']), ['0.3.0-alpha.1']);
});

test('invalid, empty, duplicate, and target-less runtime matrices fail', () => {
  for (const versions of [[], ['latest'], ['0.2.1-rc.2', '0.2.1-rc.2'], ['0.2.1-rc.5'], null, [null]]) {
    assert.throws(() => supportedDshVersions('0.2.1-rc.2', versions));
  }
  assert.throws(() => supportedDshVersions('latest', ['0.2.1-rc.2']));
});
