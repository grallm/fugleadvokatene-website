import {readFile} from 'node:fs/promises';
const assets=JSON.parse(await readFile(new URL('./assets.json',import.meta.url),'utf8'));
const missing=[];
for(const asset of assets){try{const bytes=await readFile(`public/images/figma/${asset.file}`);const valid=asset.file.endsWith('.svg')?bytes.toString().includes('<svg'):(bytes[0]===0x89&&bytes.subarray(1,4).toString()==='PNG')||(bytes[0]===0xff&&bytes[1]===0xd8);if(!valid)throw Error('Invalid file');}catch{missing.push(`${asset.file} (Figma ${asset.node}: ${asset.purpose})`);}}
if(missing.length){console.error('Missing Figma assets. Export these exact layers; do not substitute:\n'+missing.join('\n'));process.exitCode=1;}else console.log(`All ${assets.length} Figma assets are present.`);
