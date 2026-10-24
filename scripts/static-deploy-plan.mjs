// Only paths owned by the static deployment may be removed.
export function safePath(file) {
  return typeof file === 'string' && !file.includes('\\') && !file.startsWith('/') &&
    file.split('/').every(part => part && part !== '..' && !part.startsWith('.') && !['api', 'admin', 'uploads'].includes(part));
}
export function parseManifest(text) {
  const data = JSON.parse(text);
  if (data.version !== 1 || !data.files || typeof data.files !== 'object' || Array.isArray(data.files) ||
      typeof data.complete !== 'boolean' || Object.entries(data.files).some(([file, hash]) => !safePath(file) || !/^[a-f0-9]{64}$/.test(hash))) {
    throw new Error('Invalid deployment manifest; refusing to modify remote files.');
  }
  return data;
}
export function planDeployment(files, previous, force = false) {
  const changed = Object.keys(files).filter(file => force || !previous?.complete || previous.files[file] !== files[file]);
  changed.sort((a, b) => Number(a.endsWith('.html')) - Number(b.endsWith('.html')) || a.localeCompare(b));
  // Keep old assets for open browser tabs; remove only obsolete HTML pages.
  const removed = Object.keys(previous?.files ?? {}).filter(file => safePath(file) && file.endsWith('.html') && !(file in files));
  return { changed, removed };
}
