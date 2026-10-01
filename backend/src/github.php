<?php
declare(strict_types=1);
function github(array $config, string $method, string $path, ?array $payload = null): array
{
    if (
        !preg_match('~^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$~D', $config['github_repository'] ?? '') ||
        empty($config['github_token'])
    ) {
        fail(503, 'GitHub er ikke konfigurert.');
    }
    $url = 'https://api.github.com/repos/' . $config['github_repository'] . '/contents/' . $path;
    if ($method === 'GET') {
        $url .= '?ref=' . rawurlencode($config['github_branch']);
    }
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $config['github_token'],
            'Accept: application/vnd.github+json',
            'X-GitHub-Api-Version: 2022-11-28',
            'User-Agent: FugleAdvokatene-CMS',
            'Content-Type: application/json',
        ],
    ]);
    if ($payload !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_THROW_ON_ERROR));
    }
    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($status === 404) {
        fail(404, 'Filen eller repoet finnes ikke, eller tilgangen mangler.');
    }
    if ($status === 409 || $status === 422) {
        fail(409, 'Filen er endret siden du åpnet den. Last inn på nytt før du lagrer.');
    }
    if ($response === false || $status >= 400 || $status < 200) {
        fail(502, 'Kunne ikke kontakte GitHub. Prøv igjen senere.');
    }
    return json_decode($response, true, 64, JSON_THROW_ON_ERROR);
}
function save_content(array $config, array $data): array
{
    $collection = text_value($data, 'collection', 20, 1);
    $slug = text_value($data, 'slug', 80, 1);
    $path = content_path($collection, $slug);
    $content = serialize_content($collection, $data);
    $sha = text_value($data, 'sha', 40);
    if ($sha !== '' && !preg_match('/^[a-f0-9]{40}$/D', $sha)) {
        fail(422, 'Ugyldig versjon.');
    }
    $payload = [
        'message' => "content: update $collection/$slug",
        'content' => base64_encode($content),
        'branch' => $config['github_branch'],
    ];
    if ($sha !== '') {
        $payload['sha'] = $sha;
    }
    $result = github($config, 'PUT', $path, $payload);
    return [
        'sha' => $result['content']['sha'],
        'commit' => $result['commit']['sha'],
        'message' => 'Lagret i GitHub. Nettstedet oppdateres når bygg og publisering er ferdig.',
    ];
}
function upload_image(array $config): array
{
    $file = $_FILES['image'] ?? null;
    if (
        !$file ||
        $file['error'] !== UPLOAD_ERR_OK ||
        $file['size'] > 4 * 1024 * 1024 ||
        !is_uploaded_file($file['tmp_name'])
    ) {
        fail(422, 'Velg et JPEG-, PNG- eller WebP-bilde under 4 MB.');
    }
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $size = @getimagesize($file['tmp_name']);
    if (
        !isset($extensions[$mime]) ||
        !$size ||
        $size[0] * $size[1] > 20000000 ||
        $size[0] > 8000 ||
        $size[1] > 8000
    ) {
        fail(422, 'Ugyldig bilde eller for stor oppløsning.');
    }
    // Re-encode to strip metadata and reject active/polyglot content; SVG upload is forbidden.
    $image = @imagecreatefromstring(file_get_contents($file['tmp_name']));
    if (!$image) {
        fail(422, 'Bildet kunne ikke leses.');
    }
    ob_start();
    imagealphablending($image, false);
    imagesavealpha($image, true);
    if ($mime === 'image/jpeg') {
        imagejpeg($image, null, 90);
    } elseif ($mime === 'image/png') {
        imagepng($image);
    } else {
        imagewebp($image, null, 90);
    }
    $bytes = ob_get_clean();
    imagedestroy($image);
    if (!$bytes || strlen($bytes) > 4 * 1024 * 1024) {
        fail(422, 'Bildet ble for stort.');
    }
    $name = bin2hex(random_bytes(16)) . '.' . $extensions[$mime];
    github($config, 'PUT', 'public/images/uploads/' . $name, [
        'message' => 'content: upload image',
        'content' => base64_encode($bytes),
        'branch' => $config['github_branch'],
    ]);
    return [
        'path' => '/images/uploads/' . $name,
        'message' => 'Bildet blir tilgjengelig etter neste vellykkede publisering.',
    ];
}
