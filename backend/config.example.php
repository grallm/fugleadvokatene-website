<?php
declare(strict_types=1);
// Copy to backend/config.php locally, or ../fugle-private/config.php on your host.
// Never put secrets in public_html, Git, GitHub Actions build artifacts, or Astro env.
return [
    'origin' => 'https://www.fugleadvokatene.no',
    'secure_cookies' => true,
    'admin_username' => 'admin',
    'admin_password_hash' => '', // Generate with: php backend/hash-password.php
    'github_token' => '', // Fine-grained PAT: this repository only, Contents read/write.
    'github_repository' => '', // owner/repository
    'github_branch' => 'main',
    'mail_to' => 'kontakt@fugleadvokatene.no',
    'mail_from' => '', // A real mailbox on your domain; configure SPF/DKIM at host.
    'mail_transport' => 'mail', // 'log' is ONLY for local development.
    'cron_token' => '', // At least 32 random bytes, hexadecimal.
    'meta_version' => '', // Set a supported Graph API version for your Meta app.
    'meta_page_id' => '',
    'meta_page_token' => '',
    'meta_instagram_id' => '', // Instagram professional account linked to the Page.
];
