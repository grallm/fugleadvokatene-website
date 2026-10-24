import {Client} from 'basic-ftp';
import {readdir,readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';import os from 'node:os';
const required=['FTP_HOST','FTP_USER','FTP_PASSWORD','FTP_PUBLIC_DIR','FTP_PRIVATE_DIR'];
for(const name of required)if(!process.env[name])throw Error(`Missing ${name}`);
if(process.env.DEPLOY_CONFIRM!=='true')throw Error('Set DEPLOY_CONFIRM=true only after checking the target directories.');
const publicDir=process.env.FTP_PUBLIC_DIR,privateDir=process.env.FTP_PRIVATE_DIR;
for(const dir of [publicDir,privateDir])if(!/^\/?[a-zA-Z0-9_./-]+$/.test(dir)||dir.split('/').includes('..')||['/','.',''].includes(dir))throw Error('Unsafe deployment directory');
if(path.posix.normalize(publicDir)===path.posix.normalize(privateDir)||path.posix.basename(privateDir)!=='fugle-private'||path.posix.dirname(publicDir)!==path.posix.dirname(privateDir))throw Error('Private directory must be a distinct sibling fugle-private directory beside the public document root.');
const safeFile=name=>typeof name==='string'&&name.length<500&&!name.startsWith('/')&&!name.split('/').some(s=>!s||s==='.'||s==='..')&&/^[a-zA-Z0-9_./@-]+$/.test(name);
async function files(dir,prefix=''){const result=[];for(const item of await readdir(path.join(dir,prefix),{withFileTypes:true})){const relative=path.posix.join(prefix,item.name);if(item.isDirectory())result.push(...await files(dir,relative));else if(item.isFile()){if(!safeFile(relative))throw Error(`Unsafe filename ${relative}`);result.push(relative);}}return result;}
const publicFiles=await files('build/public'),privateFiles=await files('build/fugle-private');
if(!publicFiles.includes('index.html')||!publicFiles.includes('api/index.php'))throw Error('Build incomplete');
if(privateFiles.some(f=>!f.startsWith('src/')))throw Error('Private bundle may only contain source; config/storage must not be deployed.');
const client=new Client(30000);const temp=await mkdtemp(path.join(os.tmpdir(),'fugle-deploy-'));
const base=await (async()=>{await client.access({host:process.env.FTP_HOST,user:process.env.FTP_USER,password:process.env.FTP_PASSWORD,port:Number(process.env.FTP_PORT||21),secure:true});return client.pwd();})();
async function cdRoot(root){await client.cd(base);await client.ensureDir(root);}
async function upload(root,local,relative){await cdRoot(root);const dirname=path.posix.dirname(relative);if(dirname!=='.')await client.ensureDir(dirname);const name=path.posix.basename(relative);const temporary=name+'.uploading';await client.uploadFrom(path.join(local,relative),temporary);await client.rename(temporary,name);}
try{
  await cdRoot(publicDir);
  let previous=[];
  try{await client.downloadTo(path.join(temp,'old.json'),'.fugle-deploy.json');previous=JSON.parse(await readFile(path.join(temp,'old.json'),'utf8'));if(!Array.isArray(previous)||previous.some(f=>!safeFile(f)))throw Error('Invalid deployment manifest');}
  catch(e){if(e.code!==550)throw e;}
  for(const f of privateFiles)await upload(privateDir,'build/fugle-private',f);
  // Publish assets before HTML; keep old hashed assets to avoid breaking open pages.
  publicFiles.sort((a,b)=>Number(a.endsWith('.html'))-Number(b.endsWith('.html')));
  for(const f of publicFiles)await upload(publicDir,'build/public',f);
  // Remove only previously deployed HTML pages (e.g. a post changed to draft).
  // Never mirror-delete host files, config, storage, uploads or WordPress content.
  const stale=previous.filter(f=>f.endsWith('.html')&&!publicFiles.includes(f));
  for(const f of stale){await cdRoot(publicDir);await client.remove(f,true);}
  await writeFile(path.join(temp,'manifest.json'),JSON.stringify(publicFiles));
  await cdRoot(publicDir);await client.uploadFrom(path.join(temp,'manifest.json'),'.fugle-deploy.json.uploading');await client.rename('.fugle-deploy.json.uploading','.fugle-deploy.json');
  console.log(`Published ${publicFiles.length} public files and ${privateFiles.length} private PHP files; removed ${stale.length} stale HTML pages.`);
}finally{client.close();await rm(temp,{recursive:true,force:true});}
