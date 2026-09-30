# GitHub and Domene.no setup

## 1. Review the project

Export the assets in `docs/FIGMA.md`. Replace sample content and approve the privacy/terms drafts. Confirm the current contact, donation and Facebook group links in `src/data/site.ts`. The CSS follows the supplied design; a visual comparison is still required once images are available.

Run the checks in README. Keep preview mode enabled for staging. For local production-output inspection use `PUBLIC_PREVIEW=false npm run build`; the CI asset gate must also pass before launch.

## 2. Create the GitHub repository

Create a private repository unless the organisation wants the source public. From the extracted folder:

```sh
git init -b main
git add .
git commit -m "Create FugleAdvokatene Astro and PHP website"
git remote add origin git@github.com:YOUR-ORG/YOUR-REPO.git
git push -u origin main
```

No repository was created automatically. The archive includes `.github/`, `.gitignore`, `.htaccess` and `package-lock.json`; do not omit hidden files when copying it.

Create a fine-grained GitHub personal access token for this repository only, with **Contents: read and write**. Keep it on the PHP host, never in Astro/public environment variables. A PAT-created commit triggers the normal push workflow; the workflow's `GITHUB_TOKEN` should not be reused as the CMS credential. Set an expiry reminder outside this project and rotate it when needed. If branch protection requires pull requests, direct CMS publishing will be blocked; either configure a dedicated publisher allowance or change the publishing model to a content branch/PR flow. This implementation does not silently bypass branch protection.

## 3. Prepare the host

Confirm PHP 8.3+ and extensions `curl`, `mbstring`, `gd`, `fileinfo`, sessions and outbound HTTPS. Confirm `mail()` delivery or ask the host how it is configured. The PHP backend requires a writable directory **outside** the document root. Confirm `open_basedir` allows it.

Expected layout, relative to the hosting account root:

```text
public_html/             static website and api/index.php
fugle-private/
  config.php             private, created manually
  src/                   application code, deployed by Actions
  storage/               rate limits and social cache, created by PHP
```

If your public document root has another name, use that name; `fugle-private` must remain its sibling. The API resolves its private path from the document root's parent. The FTP account must have permission to access both siblings. A public-root-only FTP account cannot deploy the private backend with this workflow. Do not move config or storage into public_html to work around that; use an appropriately scoped account or manually deploy the private source.

Copy `backend/config.example.php` to `fugle-private/config.php`, fill it in, and restrict file permissions (typically 600; adapt to the host's PHP user). Set directory permissions so only the hosting account/PHP process can read and write private data. Do not upload the entire repository to public_html.

Required private settings:

| Key | Value |
| --- | --- |
| `origin` | Exact HTTPS origin, no trailing slash, matching the served site |
| `secure_cookies` | `true` in production |
| `admin_username` | Chosen admin login |
| `admin_password_hash` | Output from `php backend/hash-password.php`; not a plaintext password |
| `github_repository` | `owner/repository` |
| `github_branch` | `main` |
| `github_token` | Repository-scoped token described above |
| `mail_to` | Intended recipient mailbox |
| `mail_from` | A valid sender mailbox on your domain |
| `mail_transport` | `mail`; never `log` on production |

`mail()` success means accepted by the host, not proven inbox delivery. Submit a real test from staging and inspect the intended mailbox/spam folder. Configure SPF/DKIM with the host. Do not include sensitive case details in test messages.

Enforce HTTPS and one canonical hostname in the hosting control panel before enabling login. Match the PHP `origin` to that hostname. Use the supplied `.htaccess` only on compatible Apache/LiteSpeed hosting; confirm `Options`, `Headers` and `Require` directives are accepted. Validate HTTP access to private files is impossible and hidden files return 403/404.

## 4. Configure Actions

Create a GitHub environment named `production`. Required reviewers are optional and would require approval for every CMS-triggered deployment; choose that intentionally.

Set these **repository variables** (the check job must see them):

| Variable | Example / meaning |
| --- | --- |
| `SITE_URL` | `https://www.fugleadvokatene.no` or a staging origin |
| `SITE_READY` | Keep `false` for noindex previews. Set `true` only after assets/content review |
| `DEPLOY_ENABLED` | Default absent/false. Set `true` when the deployment target is ready |
| `FTP_PUBLIC_DIR` | `public_html` relative to FTP login root, or confirmed absolute path |
| `FTP_PRIVATE_DIR` | `fugle-private`, sibling of public root |
| `FTP_PORT` | Usually `21` for explicit FTPS; confirm with host |
| `SOCIAL_FEED_ENABLED` | Keep false until Meta is configured |

Set **production-environment secrets** `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`. The workflow uses explicit FTPS with certificate verification, never plaintext FTP. If the account only supports SFTP or has a different protocol, adapt the transport before activating the job; no insecure fallback is included.

The build artifact contains only public output and private PHP source, not secrets. It is retained for 14 days. Public assets upload before HTML. Files upload via a temporary name and rename. Previously deployed HTML routes absent from the next build are removed, so changing a post to draft takes it offline. Other files are preserved. Whole-site deployment is **not atomic**: use staging and backups; very short mixed-version windows are possible.

## 5. Optional social feed

Create/configure a Meta app and obtain authorised access to the organisation's Facebook Page. Set a currently supported Graph API version, Page ID and Page access token in private PHP config. The Page posts call needs the Page permissions granted to your app/account. For Instagram, connect the professional Instagram account to that Page and configure its account ID and required Instagram permissions. This implementation uses the Facebook Login/Page-token integration, not a separate Instagram Login token flow.

Configure `meta_version`, `meta_page_id`, `meta_page_token`, and optionally `meta_instagram_id`. Generate `cron_token` with `php -r 'echo bin2hex(random_bytes(32)), PHP_EOL;'`. Put the same value in a **repository secret** `CRON_TOKEN` (the scheduled job does not use the production environment). Enable repository variable `SOCIAL_FEED_ENABLED=true` and run Refresh social feed manually once. Subsequent runs are scheduled every six hours; GitHub scheduled jobs may be delayed.

The public feed has no credentials. Images are downloaded only from allowlisted Meta CDN hosts and converted to JPEG. One source failure keeps the prior feed. A missing/expired token fails the scheduled job; it does not silently clear live posts. Monitor Action failures and rotate tokens. Without a connected account, the page simply links to Facebook and Instagram.

Verify permissions against the current official Meta documentation for the app/version. API access was not tested against a real account here.

## 6. Test on staging, then launch

- Match the Figma desktop and mobile frames after restoring assets.
- Check the menu, carousel, all internal links and form validation on mobile/desktop.
- Verify login, logout, inactivity expiry, wrong-password throttling and an expired session.
- Save a draft, publish a post, then unpublish it. Check the commit, Actions run and old URL after each step.
- Upload an image and confirm it becomes available only after the build/deploy completes.
- Confirm receipt of contact and volunteer messages.
- Complete a provider test-mode checkout, verify the order in its dashboard and test refund handling.
- Verify production excludes drafts and includes approved legal text. Back up the old website before changing its hosting/DNS.

The previous public website appears to be Wix-hosted. Pointing a domain at the PHP webhotel or replacing its public files is a separate cutover action. Domene.no domain registration alone does not prove that the active website is served by that webhotel. Confirm the real hosting/DNS arrangement first. No DNS changes are made by these workflows.

## Rollback

Disable `DEPLOY_ENABLED` to stop new deployments. Revert the problematic commit in GitHub, then re-enable and run the workflow on main; content and code revert together. For a host failure restore the host backup of public_html and private PHP source. Preserve `fugle-private/config.php` and storage unless deliberately restoring them. The deploy manifest should accompany a full host restore. Resetting Git history is unnecessary.

Before first launch, retain a full export/backup of the existing website and its URL list. `/about` and `/article` redirects are supplied; other legacy URLs and anchor links need a migration inventory before cutover. Old hash links such as `/#support` cannot be handled by server redirects; add matching anchors or adjust inbound links if required.
