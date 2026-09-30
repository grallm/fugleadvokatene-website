// Usage: node scripts/download-assets.mjs /absolute/path/to/fresh-assets.json
// The input is a map of expected filename -> fresh Figma asset URL. Never commit it.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
if(!process.argv[2])throw Error('Supply a JSON map of filenames to fresh Figma asset URLs.');
const map=JSON.parse(await readFile(process.argv[2],'utf8'));
const assets=JSON.parse(await readFile(new URL('./assets.json',import.meta.url),'utf8'));
await mkdir('public/images/figma',{recursive:true});
for(const {file} of assets){const url=new URL(map[file]);if(url.protocol!=='https:'||!['www.figma.com','figma.com'].includes(url.hostname))throw Error('Expected a Figma HTTPS asset URL');const response=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error(`Download failed for ${file}: ${response.status}`);const data=Buffer.from(await response.arrayBuffer());if(response.headers.get('content-type')?.includes('text/html'))throw Error(`Figma returned HTML instead of ${file}. Nothing written.`);await writeFile(`public/images/figma/${file}`,data);console.log(file);}
await import('./check-assets.mjs');
