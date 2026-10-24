import { readdir, access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { Readable, Writable } from 'node:stream';
import { parseManifest, planDeployment } from './static-deploy-plan.mjs';

const localRoot = path.resolve('dist');
const allowed = /\.(?:html|css|js|mjs|json|xml|txt|svg|png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|pdf|map|webmanifest)$/i;
async function collect(relative = '') {
  const result = [];
  for (const entry of await readdir(path.join(localRoot, relative), { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['api', 'admin', 'uploads'].includes(entry.name)) continue;
    const file = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) result.push(...await collect(file));
    else if (entry.isFile() && allowed.test(entry.name)) result.push(file);
    else throw new Error('Unexpected static build entry: ' + file);
  }
  return result;
}
await access(path.join(localRoot, 'index.html'));
const files = await collect();
// Publish assets first, then HTML. Retain old assets for visitors with open pages.
files.sort((a, b) => Number(a.endsWith('.html')) - Number(b.endsWith('.html')));
if (process.argv.includes('--dry-run')) {
  console.log('Validated ' + files.length + ' static files; no FTP connection made.');
} else {
  for (const name of ['FTP_HOST', 'FTP_USER', 'FTP_PASSWORD']) {
    if (!process.env[name]) throw new Error('Missing ' + name);
  }
  // The FTP account MUST be jailed to the target site directory; "/" is its virtual root.
  if (process.env.FTP_PUBLIC_DIR !== '/') throw new Error('Expected jailed FTP root /');
  const { Client } = await import('basic-ftp');
  const client = new Client(30000);
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: Number(process.env.FTP_PORT || 21),
      secure: true,
      secureOptions: { rejectUnauthorized: true },
    });
    const started = Date.now();
    const manifestPath = '/.static-deploy-manifest.json';
    let previous = null;
    const chunks = [];
    try {
      await client.downloadTo(new Writable({ write(chunk, _encoding, callback) { chunks.push(chunk); callback(); } }), manifestPath);
      previous = parseManifest(Buffer.concat(chunks).toString('utf8'));
    } catch (error) {
      if (error.code !== 550) throw error;
      console.log('No previous manifest; uploading the complete site.');
    }
    const hashes = Object.fromEntries(await Promise.all(files.map(async file => [file, createHash('sha256').update(await readFile(path.join(localRoot, file))).digest('hex')])));
    const { changed, removed } = planDeployment(hashes, previous, process.env.FTP_FORCE_FULL === 'true');
    // One-time migration: these pages were deployed before manifests existed.
    for (const file of ['vilkar/index.html', 'en/terms/index.html']) {
      if (!(file in hashes) && !removed.includes(file)) removed.push(file);
    }
    async function writeManifest(data) {
      await client.uploadFrom(Readable.from([JSON.stringify(data)]), manifestPath + '.uploading');
      await client.rename(manifestPath + '.uploading', manifestPath);
    }
    // Invalidate the old hashes before changes. After an interrupted upload, even
    // a rollback must reupload files rather than trust the last successful state.
    await writeManifest({ version: 1, complete: false, files: { ...previous?.files, ...hashes } });
    const directories = new Set(['/']);
    for (const file of changed) {
      const directory = '/' + path.posix.dirname(file);
      if (directory !== '/.' && !directories.has(directory)) {
        await client.ensureDir(directory);
        directories.add(directory);
      }
      const remote = '/' + file;
      await client.uploadFrom(path.join(localRoot, file), remote + '.uploading');
      await client.rename(remote + '.uploading', remote);
    }
    for (const file of removed) await client.remove('/' + file, true);
    await writeManifest({ version: 1, complete: true, files: hashes });
    console.log(`Published ${changed.length} files; skipped ${files.length - changed.length} unchanged files; retired ${removed.length} page paths in ${((Date.now() - started) / 1000).toFixed(1)}s. Old assets retained.`);

  } finally {
    client.close();
  }
}
