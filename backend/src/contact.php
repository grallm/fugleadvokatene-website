<?php
declare(strict_types=1);
function send_contact(array $config, array $data): array
{
    global $storage;
    rate_limit('contact', 5, 3600);
    if (!empty($data['website'])) {
        return ['ok' => true];
    }
    $name = text_value($data, 'name', 100, 1);
    $email = text_value($data, 'email', 254, 3);
    $message = text_value($data, 'message', 5000, 10);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $email)) {
        fail(422, 'Ugyldig e-postadresse.');
    }
    if (($data['consent'] ?? '') !== 'on' && ($data['consent'] ?? false) !== true) {
        fail(422, 'Bekreft at du har lest personvernerklæringen.');
    }
    $kind = ($data['kind'] ?? '') === 'volunteer' ? 'volunteer' : 'contact';
    $city = $kind === 'volunteer' ? text_value($data, 'city', 100, 1) : '';
    $subject = $kind === 'volunteer' ? 'Ny frivillighenvendelse' : 'Ny henvendelse fra nettsiden';
    $content = "Navn: $name\nE-post: $email\nSted: $city\n\n$message\n";
    if (($config['mail_transport'] ?? 'mail') === 'log') {
        if (
            ($config['secure_cookies'] ?? true) ||
            !in_array(parse_url($config['origin'], PHP_URL_HOST), ['localhost', '127.0.0.1'], true)
        ) {
            fail(503, 'Loggtransport er kun for lokal utvikling.');
        }
        if (
            file_put_contents(
                $storage . '/mail-' . bin2hex(random_bytes(8)) . '.txt',
                $content,
                LOCK_EX,
            ) === false
        ) {
            throw new RuntimeException('Mail log failed');
        }
    } else {
        foreach (['mail_to', 'mail_from'] as $key) {
            if (
                !filter_var($config[$key] ?? '', FILTER_VALIDATE_EMAIL) ||
                preg_match('/[\r\n]/', $config[$key])
            ) {
                fail(503, 'E-posttjenesten er ikke konfigurert.');
            }
        }
        $headers = [
            'From' => $config['mail_from'],
            'Reply-To' => $email,
            'Content-Type' => 'text/plain; charset=UTF-8',
            'MIME-Version' => '1.0',
        ];
        if (
            !mail(
                $config['mail_to'],
                '=?UTF-8?B?' . base64_encode($subject) . '?=',
                $content,
                $headers,
            )
        ) {
            fail(503, 'Meldingen kunne ikke sendes. Prøv igjen senere eller send oss en e-post.');
        }
    }
    return ['ok' => true];
}
