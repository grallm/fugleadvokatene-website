<?php
declare(strict_types=1);
require __DIR__.'/../src/core.php';
$passed=0;
function check(bool $value,string $name): void {global $passed;if(!$value)throw new RuntimeException('FAIL: '.$name);$passed++;echo "PASS: $name\n";}
function rejects(callable $call,int $status,string $name): void {try{$call();}catch(ApiError $e){check($e->status===$status,$name);return;}throw new RuntimeException('FAIL: '.$name.' did not reject');}
$post=['title'=>"Title\n---\ndraft: false",'description'=>'Description','draft'=>true,'image'=>'/images/example.jpg','body'=>'**Markdown**','date'=>'2026-09-30'];
check(content_path('posts','a-new-bird')==='src/content/posts/a-new-bird.md','valid content path');
rejects(fn()=>content_path('posts','../../config'),422,'reject path traversal');
rejects(fn()=>content_path('workflows','attack'),422,'reject arbitrary collection');
rejects(fn()=>content_path('pages','admin'),422,'reject reserved route');
rejects(fn()=>image_path('/images/../../config.php'),422,'reject unsafe image path');
$serialized=serialize_content('posts',$post);$parsed=parse_content($serialized);
check($parsed['title']===$post['title']&&$parsed['draft']===true,'frontmatter injection remains text');
check($parsed['body']==='**Markdown**','Markdown round trip');
rejects(fn()=>serialize_content('posts',[...$post,'date'=>'2026-02-31']),422,'reject impossible date');
$product=[...$post,'price'=>100,'checkoutUrl'=>'javascript:alert(1)','available'=>true];
rejects(fn()=>serialize_content('products',$product),422,'reject non-HTTPS checkout');
rejects(fn()=>serialize_content('products',[...$product,'checkoutUrl'=>'https://user@example.com']),422,'reject credentials in checkout URL');
rejects(fn()=>serialize_content('products',[...$product,'checkoutUrl'=>'']),422,'reject available product without checkout');
rejects(fn()=>serialize_content('products',[...$product,'price'=>-1]),422,'reject negative price');
$valid=parse_content(serialize_content('products',[...$product,'checkoutUrl'=>'https://buy.stripe.com/test_example']));
check($valid['price']===100&&$valid['available']===true,'valid product');
$_SESSION=['csrf'=>'known'];$_SERVER['HTTP_ORIGIN']='https://evil.example';$_SERVER['HTTP_X_CSRF_TOKEN']='known';
rejects(fn()=>csrf_check(['origin'=>'https://www.fugleadvokatene.no']),403,'reject cross-origin request');
$_SERVER['HTTP_ORIGIN']='https://www.fugleadvokatene.no';$_SERVER['HTTP_X_CSRF_TOKEN']='wrong';
rejects(fn()=>csrf_check(['origin'=>'https://www.fugleadvokatene.no']),403,'reject bad CSRF token');
$_SERVER['HTTP_X_CSRF_TOKEN']='known';csrf_check(['origin'=>'https://www.fugleadvokatene.no']);check(true,'valid CSRF');
rejects(fn()=>require_admin(),401,'anonymous cannot edit');
$_SESSION['admin']=true;require_admin();check(true,'authenticated admin');
$storage=sys_get_temp_dir().'/fugle-tests-'.bin2hex(random_bytes(6));ensure_storage($storage);$_SERVER['REMOTE_ADDR']='127.0.0.1';
rate_limit('test',2,60);rate_limit('test',2,60);
// Suppress CLI header warning after test output; the HTTP header is checked in integration tests.
rejects(fn()=>@rate_limit('test',2,60),429,'rate limit rejects repeated attempts');
foreach(glob($storage.'/*')?:[] as $f)unlink($f);rmdir($storage);
echo "$passed checks passed.\n";
