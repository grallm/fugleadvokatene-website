<?php
declare(strict_types=1);

final class ApiError extends RuntimeException
{
    public function __construct(public int $status, string $message)
    {
        parent::__construct($message);
    }
}
function fail(int $status, string $message): never
{
    throw new ApiError($status, $message);
}
function respond(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit();
}
function text_value(array $data, string $key, int $max, int $min = 0): string
{
    if (!isset($data[$key]) || !is_string($data[$key])) {
        fail(422, "Ugyldig felt: $key");
    }
    $value = trim($data[$key]);
    if (mb_strlen($value) < $min || mb_strlen($value) > $max || str_contains($value, "\0")) {
        fail(422, "Ugyldig lengde: $key");
    }
    return $value;
}
function body(): array
{
    if (!str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) {
        fail(415, 'JSON er påkrevd.');
    }
    $raw = file_get_contents('php://input', false, null, 0, 131073);
    if ($raw === false || strlen($raw) > 131072) {
        fail(413, 'Forespørselen er for stor.');
    }
    try {
        $data = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        fail(400, 'Ugyldig JSON.');
    }
    if (!is_array($data) || array_is_list($data)) {
        fail(400, 'Forventet et JSON-objekt.');
    }
    return $data;
}
function ensure_storage(string $path): void
{
    if (!is_dir($path) && !mkdir($path, 0700, true) && !is_dir($path)) {
        throw new RuntimeException('Storage unavailable');
    }
}
function rate_limit(string $scope, int $limit, int $seconds): void
{
    global $storage;
    // Do not trust X-Forwarded-For from arbitrary callers on shared hosting.
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $path = $storage . '/rate-' . hash('sha256', $scope . ':' . $ip) . '.json';
    $handle = fopen($path, 'c+');
    if (!$handle || !flock($handle, LOCK_EX)) {
        throw new RuntimeException('Rate limiter unavailable');
    }
    try {
        $record = json_decode(stream_get_contents($handle) ?: '{}', true);
        $record =
            is_array($record) && ($record['until'] ?? 0) > time()
                ? $record
                : ['until' => time() + $seconds, 'count' => 0];
        if ($record['count'] >= $limit) {
            header('Retry-After: ' . max(1, $record['until'] - time()));
            fail(429, 'For mange forsøk. Prøv igjen senere.');
        }
        $record['count']++;
        rewind($handle);
        ftruncate($handle, 0);
        if (fwrite($handle, json_encode($record, JSON_THROW_ON_ERROR)) === false) {
            throw new RuntimeException('Rate write failed');
        }
        fflush($handle);
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}
function start_session(array $config): void
{
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_name('fugle_session');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $config['secure_cookies'] ?? true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
    if (!isset($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    if (isset($_SESSION['admin']) && time() - ($_SESSION['last_seen'] ?? 0) > 1800) {
        unset($_SESSION['admin']);
    }
    if (isset($_SESSION['admin'])) {
        $_SESSION['last_seen'] = time();
    }
}
function csrf_check(array $config): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== $config['origin']) {
        fail(403, 'Ugyldig opprinnelse.');
    }
    if (
        !hash_equals($_SESSION['csrf'] ?? '', $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '') ||
        empty($_SESSION['csrf'])
    ) {
        fail(403, 'Økten er utløpt. Last siden på nytt.');
    }
}
function require_admin(): void
{
    if (empty($_SESSION['admin'])) {
        fail(401, 'Logg inn først.');
    }
}
function content_path(string $collection, string $slug): string
{
    if (!in_array($collection, ['posts', 'pages', 'volunteers', 'products'], true)) {
        fail(422, 'Ukjent samling.');
    }
    if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $slug) || strlen($slug) > 80) {
        fail(422, 'Bruk en kort adresse med små bokstaver, tall og bindestrek.');
    }
    if (
        $collection === 'pages' &&
        in_array(
            $slug,
            [
                'index',
                'admin',
                'api',
                'kontakt',
                'bli-frivillig',
                'nettbutikk',
                'nyheter',
                'frivillige',
                'veiledning',
                'stott-oss',
                'takk',
                '404',
                'sitemap',
                'robots',
            ],
            true,
        )
    ) {
        fail(422, 'Denne adressen er reservert.');
    }
    return "src/content/$collection/$slug.md";
}
function image_path(string $value): string
{
    if (!preg_match('~^/images/[a-zA-Z0-9/_\-.]+$~D', $value) || str_contains($value, '..')) {
        fail(422, 'Ugyldig bildesti.');
    }
    return $value;
}
function serialize_content(string $collection, array $data): string
{
    $meta = [
        'title' => text_value($data, 'title', 150, 1),
        'description' => text_value($data, 'description', 400, 1),
        'draft' => ($data['draft'] ?? true) !== false,
        'image' => image_path(text_value($data, 'image', 240, 1)),
    ];
    if ($collection === 'posts') {
        $date = text_value($data, 'date', 10, 10);
        $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
        if (!$parsed || $parsed->format('Y-m-d') !== $date) {
            fail(422, 'Ugyldig dato.');
        }
        $meta['date'] = $date;
    }
    if ($collection === 'volunteers') {
        $meta['city'] = text_value($data, 'city', 100);
        $meta['role'] = text_value($data, 'role', 100);
        $meta['order'] = max(0, min(10000, (int) ($data['order'] ?? 0)));
    }
    if ($collection === 'products') {
        $price = $data['price'] ?? null;
        if (
            !is_numeric($price) ||
            !is_finite((float) $price) ||
            (float) $price < 0 ||
            (float) $price > 1000000
        ) {
            fail(422, 'Ugyldig pris.');
        }
        $meta['price'] = round((float) $price, 2);
        $meta['checkoutUrl'] = text_value($data, 'checkoutUrl', 2000);
        if (
            $meta['checkoutUrl'] !== '' &&
            (!filter_var($meta['checkoutUrl'], FILTER_VALIDATE_URL) ||
                parse_url($meta['checkoutUrl'], PHP_URL_SCHEME) !== 'https' ||
                parse_url($meta['checkoutUrl'], PHP_URL_USER) !== null)
        ) {
            fail(422, 'Bruk en HTTPS-betalingslenke.');
        }
        $meta['available'] = ($data['available'] ?? false) === true;
        if ($meta['available'] && $meta['checkoutUrl'] === '') {
            fail(422, 'Legg til betalingslenke før produktet aktiveres.');
        }
    }
    $body = text_value($data, 'body', 50000);
    // JSON is a YAML subset: no frontmatter injection from arbitrary text fields.
    return "---\n" .
        json_encode(
            $meta,
            JSON_PRETTY_PRINT |
                JSON_UNESCAPED_UNICODE |
                JSON_UNESCAPED_SLASHES |
                JSON_THROW_ON_ERROR,
        ) .
        "\n---\n\n" .
        $body .
        "\n";
}
function parse_content(string $content): array
{
    if (!preg_match('/\A---\r?\n(.*?)\r?\n---\r?\n(.*)\z/s', $content, $matches)) {
        fail(422, 'Ukjent filformat.');
    }
    try {
        $meta = json_decode($matches[1], true, 32, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        fail(
            422,
            'Admin støtter JSON-frontmatter. Konverter filens YAML-frontmatter til JSON først.',
        );
    }
    if (!is_array($meta) || array_is_list($meta)) {
        fail(422, 'Ugyldig metadata.');
    }
    return [...$meta, 'body' => trim($matches[2])];
}
