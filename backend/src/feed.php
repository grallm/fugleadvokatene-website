<?php
declare(strict_types=1);
function meta_get(array $config, string $id, string $fields): array {
    $version = $config['meta_version'] ?? '';
    if (!preg_match('/^v[0-9]+\.0$/D',$version) || !preg_match('/^[0-9]+$/D',$id)) fail(503,'Meta er ikke konfigurert.');
    $ch = curl_init('https://graph.facebook.com/'.$version.'/'.$id.'?'.http_build_query(['fields'=>$fields]));
    curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>30,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,CURLOPT_HTTPHEADER=>['Authorization: Bearer '.$config['meta_page_token']]]);
    $raw=curl_exec($ch);$status=curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);
    if (!$raw || $status !== 200) fail(502,'Meta-oppdatering feilet. Sist lagrede feed er beholdt. Kontroller token og tillatelser.');
    return json_decode($raw,true,64,JSON_THROW_ON_ERROR);
}
function cache_social_image(string $url): ?string {
    global $storage;
    $host = strtolower((string)parse_url($url,PHP_URL_HOST));
    if (parse_url($url,PHP_URL_SCHEME)!=='https' || !preg_match('/(^|\.)(fbcdn\.net|cdninstagram\.com)$/D',$host) || parse_url($url,PHP_URL_PORT)!==null || parse_url($url,PHP_URL_USER)!==null) return null;
    $id=sha1($url);$dest=$storage.'/media/'.$id.'.jpg';ensure_storage($storage.'/media');
    if (!is_file($dest)) {
        $bytes='';$ch=curl_init($url);
        curl_setopt_array($ch,[CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>15,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,CURLOPT_WRITEFUNCTION=>static function($ch,$chunk)use(&$bytes){if(strlen($bytes)+strlen($chunk)>5*1024*1024)return 0;$bytes.=$chunk;return strlen($chunk);}]);
        $ok=curl_exec($ch);$status=curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);
        $size=@getimagesizefromstring($bytes);
        if (!$ok || $status!==200 || !$size || $size[0]*$size[1]>20000000) return null;
        $im=@imagecreatefromstring($bytes);if(!$im)return null;
        $tmp=$dest.'.tmp-'.bin2hex(random_bytes(4));$written=imagejpeg($im,$tmp,85);imagedestroy($im);
        if(!$written || !rename($tmp,$dest))throw new RuntimeException('Media write failed');
    }
    return '/api/index.php?action=media&id='.$id;
}
function update_feed(array $config): array {
    global $storage;
    if (empty($config['meta_page_id']) || empty($config['meta_page_token'])) fail(503,'Meta er ikke konfigurert.');
    $lock=fopen($storage.'/feed.lock','c');
    if(!$lock || !flock($lock,LOCK_EX|LOCK_NB))fail(409,'En oppdatering kjører allerede.');
    try {
        $page=meta_get($config,$config['meta_page_id'],'posts.limit(8){message,created_time,permalink_url,full_picture}');
        $posts=[];
        foreach($page['posts']['data']??[] as $p) $posts[]=['text'=>$p['message']??'','date'=>$p['created_time'],'url'=>$p['permalink_url']??'','remoteImage'=>$p['full_picture']??''];
        if(!empty($config['meta_instagram_id'])) {
            $ig=meta_get($config,$config['meta_instagram_id'],'media.limit(8){caption,timestamp,permalink,media_url,media_type,thumbnail_url}');
            foreach($ig['media']['data']??[] as $p)$posts[]=['text'=>$p['caption']??'','date'=>$p['timestamp'],'url'=>$p['permalink'],'remoteImage'=>$p['media_type']==='VIDEO'?($p['thumbnail_url']??''):($p['media_url']??'')];
        }
        usort($posts,static fn($a,$b)=>strtotime($b['date'])<=>strtotime($a['date']));$posts=array_slice($posts,0,12);
        foreach($posts as &$p){$p['text']=mb_substr($p['text'],0,2000);$p['image']=cache_social_image($p['remoteImage']);unset($p['remoteImage']);}unset($p);
        $result=['updatedAt'=>gmdate(DATE_ATOM),'posts'=>$posts];
        $tmp=$storage.'/feed-'.bin2hex(random_bytes(8)).'.tmp';
        if(file_put_contents($tmp,json_encode($result,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),LOCK_EX)===false||!rename($tmp,$storage.'/feed.json'))throw new RuntimeException('Feed write failed');
        $used=array_filter(array_column($posts,'image'));
        foreach(glob($storage.'/media/*.jpg')?:[] as $file)if(filemtime($file)<time()-7*86400&&!in_array('/api/index.php?action=media&id='.basename($file,'.jpg'),$used,true))unlink($file);
        foreach(glob($storage.'/rate-*.json')?:[] as $file)if(filemtime($file)<time()-2*86400)unlink($file);
        return ['ok'=>true,'count'=>count($posts),'updatedAt'=>$result['updatedAt']];
    } finally {flock($lock,LOCK_UN);fclose($lock);}
}
