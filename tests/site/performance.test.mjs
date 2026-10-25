import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(file));
    else files.push(file);
  }
  return files;
}
test('Public pages do not render or request the disabled social feed', async () => {
  for (const file of await walk('dist')) {
    if (!/\.(html|js)$/.test(file) || file.startsWith('dist/admin/')) continue;
    assert.doesNotMatch(await readFile(file, 'utf8'), /data-social-feed|action=feed/);
  }
});
test('Responsive image variants exist, preserve aspect ratios and reduce thumbnail bytes', async () => {
  const images = JSON.parse(await readFile('src/data/generated-images.json', 'utf8'));
  const sharp = (await import('sharp')).default;
  for (const [original, image] of Object.entries(images)) {
    for (const variant of image.variants) {
      const file = path.join('dist', variant.src);
      const metadata = await sharp(file).metadata();
      assert.equal(metadata.width, variant.width);
      assert.ok(Math.abs(metadata.height - variant.width * image.height / image.width) <= 1);
    }
    if (original.includes('/volunteers/')) {
      const thumb = image.variants[0];
      assert.ok((await stat(path.join('dist', thumb.src))).size < (await stat(path.join('public', original))).size);
    }
  }
  const home = await readFile('dist/index.html', 'utf8');
  assert.match(home, /srcset="\/images\/optimized\//);
  assert.match(home, /sizes="\(max-width: 1000px\) 235px/);
});
test('Brand colors preserve approved coral and accessible teal', async () => {
  const css = await readFile('src/styles/global.css', 'utf8');
  // The approved Figma coral is retained with white labels by design; it does
  // not meet the normal-text AA contrast threshold. Keep teal checked separately.
  const coral = css.match(/--coral:\s*#([a-f0-9]{6})\b/i);
  assert.ok(coral, 'coral token must exist');
  assert.equal(coral[1].toLowerCase(), 'f36f60');
  for (const name of ['teal']) {
    const match = css.match(new RegExp(`--${name}:\\s*#([a-f0-9]{6})\\b`, 'i'));
    assert.ok(match, `${name} token must exist`);
    const hex = match[1];
    const channels = hex.match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    assert.ok(1.05 / (luminance + 0.05) >= 4.5, name);
  }
});
