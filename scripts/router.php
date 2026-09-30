<?php
declare(strict_types=1);
// Development only. Run from the repository root: npm run serve:php
$path=rawurldecode(parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH));
if(str_contains($path,'..')||preg_match('~(^|/)\.~',$path)){http_response_code(404);exit;}
if(str_starts_with($path,'/api/')){
    if(is_file(__DIR__.'/../backend/config.php'))copy(__DIR__.'/../backend/config.php',__DIR__.'/../build/fugle-private/config.php');
    require __DIR__.'/../build/public/api/index.php';return true;
}
$root=realpath(__DIR__.'/../build/public');$file=realpath($root.$path);
if($file && str_starts_with($file,$root.'/') && is_dir($file) && is_file($file.'/index.html')){header('Content-Type: text/html; charset=UTF-8');readfile($file.'/index.html');return true;}
if($path==='/'){header('Content-Type: text/html; charset=UTF-8');readfile($root.'/index.html');return true;}
if($file&&is_file($file))return false;
http_response_code(404);header('Content-Type: text/html; charset=UTF-8');readfile($root.'/404.html');return true;
