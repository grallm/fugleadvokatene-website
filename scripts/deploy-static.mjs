import { readdir, access } from 'node:fs/promises';
import path from 'node:path';

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
  // The FTP account MUST be jailed to public_html/dev; "/" is its virtual root.
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
    for (const file of files) {
      await client.cd('/');
      const directory = path.posix.dirname(file);
      if (directory !== '.') await client.ensureDir(directory);
      const name = path.posix.basename(file);
      await client.uploadFrom(path.join(localRoot, file), name + '.uploading');
      await client.rename(name + '.uploading', name);
    }
    console.log('Published ' + files.length + ' static files. Existing remote files were not deleted.');
  } finally {
    client.close();
  }
}
