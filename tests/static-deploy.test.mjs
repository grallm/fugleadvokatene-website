import test from 'node:test';
import assert from 'node:assert/strict';
import { parseManifest, planDeployment } from '../scripts/static-deploy-plan.mjs';
const a = 'a'.repeat(64), b = 'b'.repeat(64);
test('uploads changed assets before pages, skips unchanged files and retires only tracked HTML', () => {
  const previous = { complete: true, files: { 'index.html': a, 'old.html': a, 'old.js': a, 'photo.jpg': a } };
  assert.deepEqual(planDeployment({ 'index.html': b, 'new.js': b, 'photo.jpg': a }, previous), { changed: ['new.js', 'index.html'], removed: ['old.html'] });
});
test('first deployment, interrupted deployment and forced repair upload all files', () => {
  const files = { 'index.html': a };
  for (const [previous, force] of [[null, false], [{ complete: false, files }, false], [{ complete: true, files }, true]]) {
    assert.deepEqual(planDeployment(files, previous, force).changed, ['index.html']);
  }
});
test('rejects malformed or unsafe manifests before remote modifications', () => {
  for (const file of ['../index.html', '/index.html', 'api/index.html', '.htaccess', 'a/../../x.html', 'a\\x.html']) {
    assert.throws(() => parseManifest(JSON.stringify({ version: 1, complete: true, files: { [file]: a } })));
  }
  assert.throws(() => parseManifest('{}'));
  assert.equal(parseManifest(JSON.stringify({ version: 1, complete: true, files: { 'index.html': a } })).complete, true);
});
