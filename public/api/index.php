<?php
declare(strict_types=1);
header('X-Content-Type-Options: nosniff');header('Cache-Control: no-store');header('X-Frame-Options: DENY');
$private = dirname(__DIR__,2).'/fugle-private';
if(!is_file($private.'/config.php')){http_response_code(503);header('Content-Type: application/json');echo '{"error":"Tjenesten er ikke konfigurert ennå."}';exit;}
require $private.'/src/core.php';
set_exception_handler(static function(Throwable $e): never {
    if($e instanceof ApiError)respond(['error'=>$e->getMessage()],$e->status);
    error_log('Fugle API failure: '.get_class($e)); // Never log form content, tokens or upstream bodies.
    respond(['error'=>'En intern feil oppstod. Prøv igjen senere.'],500);
});
$config=require $private.'/config.php';
$storage=$private.'/storage';ensure_storage($storage);
require $private.'/src/github.php';require $private.'/src/contact.php';require $private.'/src/feed.php';
$action=$_GET['action']??'';$method=$_SERVER['REQUEST_METHOD']??'GET';
if(!is_string($action))fail(400,'Ugyldig handling.');
if($action==='feed'&&$method==='GET'){
    header('Cache-Control: public, max-age=300');
    if(!is_file($storage.'/feed.json'))respond(['updatedAt'=>null,'posts'=>[]]);
    respond(json_decode(file_get_contents($storage.'/feed.json'),true,64,JSON_THROW_ON_ERROR));
}
if($action==='media'&&$method==='GET'){
    $id=$_GET['id']??'';if(!is_string($id)||!preg_match('/^[a-f0-9]{40}$/D',$id)||!is_file($storage.'/media/'.$id.'.jpg'))fail(404,'Bildet finnes ikke.');
    header('Content-Type: image/jpeg');header('Cache-Control: public, max-age=86400');readfile($storage.'/media/'.$id.'.jpg');exit;
}
if($action==='refresh-feed'){
    if($method!=='POST')fail(405,'Bruk POST.');
    $token=$config['cron_token']??'';
    if(strlen($token)<32||!hash_equals('Bearer '.$token,$_SERVER['HTTP_AUTHORIZATION']??''))fail(401,'Ugyldig tilgang.');
    rate_limit('cron',6,3600);respond(update_feed($config));
}
start_session($config);
if($action==='session'&&$method==='GET')respond(['csrf'=>$_SESSION['csrf'],'authenticated'=>!empty($_SESSION['admin'])]);
if($method==='POST')csrf_check($config);
if($action==='login'&&$method==='POST'){
    rate_limit('login',8,900);$data=body();$username=text_value($data,'username',100,1);$password=text_value($data,'password',1024,1);
    if(empty($config['admin_password_hash']))fail(503,'Admin er ikke konfigurert.');
    $valid=password_verify($password,$config['admin_password_hash']);
    if(!hash_equals($config['admin_username'],$username)||!$valid)fail(401,'Feil brukernavn eller passord.');
    session_regenerate_id(true);$_SESSION['admin']=true;$_SESSION['last_seen']=time();$_SESSION['csrf']=bin2hex(random_bytes(32));respond(['csrf'=>$_SESSION['csrf'],'authenticated'=>true]);
}
if($action==='logout'&&$method==='POST'){
    $_SESSION=[];session_destroy();setcookie(session_name(),'', ['expires'=>time()-3600,'path'=>'/','secure'=>$config['secure_cookies']??true,'httponly'=>true,'samesite'=>'Strict']);respond(['ok'=>true]);
}
if($action==='contact'&&$method==='POST')respond(send_contact($config,body()));
require_admin();
if($action==='list'&&$method==='GET'){
    $collection=$_GET['collection']??'';if(!is_string($collection))fail(422,'Ugyldig samling.');content_path($collection,'validation');
    $entries=github($config,'GET','src/content/'.$collection);
    respond(['entries'=>array_values(array_map(static fn($f)=>['slug'=>basename($f['name'],'.md'),'sha'=>$f['sha']],array_filter($entries,static fn($f)=>$f['type']==='file'&&str_ends_with($f['name'],'.md'))))]);
}
if($action==='read'&&$method==='GET'){
    $collection=$_GET['collection']??'';$slug=$_GET['slug']??'';
    if(!is_string($collection)||!is_string($slug))fail(422,'Ugyldig fil.');
    $file=github($config,'GET',content_path($collection,$slug));$content=base64_decode($file['content'],true);
    if($content===false)fail(502,'Ugyldig fil fra GitHub.');
    respond(['sha'=>$file['sha'],'slug'=>$slug,'collection'=>$collection,...parse_content($content)]);
}
if($action==='save'&&$method==='POST'){rate_limit('publish',40,3600);respond(save_content($config,body()));}
if($action==='upload'&&$method==='POST'){rate_limit('upload',20,3600);respond(upload_image($config));}
fail(405,'Ukjent handling eller HTTP-metode.');
