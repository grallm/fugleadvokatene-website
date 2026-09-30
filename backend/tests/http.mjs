// Runs only against an isolated local copy, with local log-mode mail and no GitHub token.
import {cp,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {execFileSync,spawn} from 'node:child_process';import {tmpdir} from 'node:os';import path from 'node:path';import {randomBytes} from 'node:crypto';import net from 'node:net';import assert from 'node:assert/strict';
const php=process.env.PHP_BIN||'php';const temporary=await mkdtemp(path.join(tmpdir(),'fugle-http-'));
await cp('build',temporary,{recursive:true});
const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
const origin=`http://127.0.0.1:${port}`,password=randomBytes(24).toString('hex');
const hash=execFileSync(php,['-r',`echo password_hash('${password}', PASSWORD_DEFAULT);`],{encoding:'utf8'}).trim();
await writeFile(path.join(temporary,'fugle-private/config.php'),`<?php return ['origin'=>'${origin}','secure_cookies'=>false,'admin_username'=>'test','admin_password_hash'=>'${hash}','mail_transport'=>'log','github_token'=>'','github_repository'=>'','cron_token'=>''];`);
const server=spawn(php,['-S',`127.0.0.1:${port}`,'-t',path.join(temporary,'public')],{stdio:'ignore'});let cookie='',csrf='';
async function request(action,payload,token=csrf,requestOrigin=origin){const response=await fetch(`${origin}/api/index.php?action=${action}`,{method:payload?'POST':'GET',headers:{Cookie:cookie,...(payload?{'Content-Type':'application/json','X-CSRF-Token':token,Origin:requestOrigin}:{})},body:payload?JSON.stringify(payload):undefined});const set=response.headers.getSetCookie();if(set.length)cookie=set.at(-1).split(';')[0];return {status:response.status,data:await response.json()};}
try{
  let ready=false;for(let i=0;i<50;i++){try{await fetch(origin+'/api/index.php?action=feed');ready=true;break;}catch{await new Promise(r=>setTimeout(r,100));}}assert.ok(ready,'PHP server starts');
  let r=await request('session');assert.equal(r.status,200);csrf=r.data.csrf;
  r=await request('list&collection=posts');assert.equal(r.status,401);
  r=await request('login',{username:'test',password});assert.equal(r.status,200);csrf=r.data.csrf;
  r=await request('session');assert.equal(r.data.authenticated,true);
  r=await request('contact',{kind:'contact',name:'Local test',email:'test@example.org',message:'Integration test only.',consent:'on',website:''});assert.equal(r.status,200);
  r=await request('contact',{name:'Bad'},'invalid');assert.equal(r.status,403);
  r=await request('contact',{name:'Bad'},csrf,'https://evil.example');assert.equal(r.status,403);
  r=await request('logout',{});assert.equal(r.status,200);
  r=await request('session');assert.equal(r.data.authenticated,false);
  console.log('HTTP session, login, contact, CSRF, origin and logout checks passed. No external messages sent.');
}finally{server.kill();await new Promise(r=>server.once('exit',r));await rm(temporary,{recursive:true,force:true});}
