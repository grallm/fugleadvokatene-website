<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit();
}
fwrite(STDERR, 'Enter a long unique admin password (input is visible): ');
$password = trim((string) fgets(STDIN));
if (strlen($password) < 14) {
    fwrite(STDERR, "Use at least 14 characters.\n");
    exit(1);
}
echo password_hash($password, PASSWORD_DEFAULT), "\n";
