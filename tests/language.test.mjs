import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
test('Cached language script does not redirect or access browser storage', async () => {
  vm.runInNewContext(await readFile('public/scripts/site-language.js', 'utf8'), {});
  const layout = await readFile('src/layouts/Layout.astro', 'utf8');
  assert.doesNotMatch(layout, /src="\/scripts\/site-language.js"/);
  assert.match(layout, /href=\{alternates.en/);
  assert.match(layout, /href=\{alternates.nb/);
});
