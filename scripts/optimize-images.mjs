import { readdir, readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicDir = path.join(root, 'public');
async function walk(directory) {
  const result = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) result.push(...await walk(file));
    else if (/\.(jpe?g|png|webp)$/i.test(item.name)) result.push(file);
  }
  return result;
}

// Runs from Astro config, including direct `astro build` calls in GitHub Actions.
// Originals remain available for full-size gallery viewing.
export async function optimizeImages() {
  const directory = path.join(publicDir, 'images/optimized');
  await mkdir(directory, { recursive: true });
  const files = [
    ...await walk(path.join(publicDir, 'images/volunteers')),
    path.join(publicDir, 'images/brand/logo-horizontal.webp'),
    path.join(publicDir, 'images/brand/logo-horizontal-white.png'),
    path.join(publicDir, 'images/icons/first_aid_hvit.png'),
    path.join(publicDir, 'images/icons/donere_hvit.png'),
  ];
  const manifest = {};
  for (const file of files) {
    const input = await readFile(file);
    const metadata = await sharp(input).rotate().metadata();
    const swapped = [5, 6, 7, 8].includes(metadata.orientation);
    const width = swapped ? metadata.height : metadata.width;
    const height = swapped ? metadata.width : metadata.height;
    const hash = createHash('sha256').update(input).update('webp-q85-v1').digest('hex').slice(0, 16);
    const candidates = file.includes('/icons/') ? [96, 192] : [320, 640, 960];
    const widths = [...new Set(candidates.map(value => Math.min(value, width)))];
    const variants = [];
    for (const size of widths) {
      const name = `${hash}-${size}.webp`;
      const output = path.join(directory, name);
      try { await access(output); }
      catch { await sharp(input).rotate().resize({ width: size, withoutEnlargement: true }).webp({ quality: 85 }).toFile(output); }
      variants.push({ width: size, src: `/images/optimized/${name}` });
    }
    manifest['/' + path.relative(publicDir, file).split(path.sep).join('/')] = { width, height, variants };
  }
  await writeFile(path.join(root, 'src/data/generated-images.json'), JSON.stringify(manifest));
}
