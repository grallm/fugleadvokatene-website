# Automatic Astro-only deployment to the dev site

Workflow: `.github/workflows/dev-site.yml`.
Branch: `codex/replace-with-downloaded-project`.
Target: https://dev.fugleadvokatene.no/

## 1. Create a restricted hosting account
In cPanel > FTP Accounts, create a dedicated account (for example github-dev).
Set its directory to the EXACT existing document root for dev.fugleadvokatene.no:
`public_html/dev` (cPanel may display an absolute account path).
Verify that logging in with this account shows the dev site's files at FTP `/`,
and cannot access the parent directory or the production site.
Do not use your main cPanel login.

Use explicit FTP over TLS (FTPS), port 21. Use the FTP hostname from cPanel's
"Configure FTP Client", whose TLS certificate must match the hostname.
The hostname is not necessarily dev.fugleadvokatene.no.
Test this account with FileZilla using "Require explicit FTP over TLS".
The workflow validates certificates and never falls back to unencrypted FTP.

## 2. Add GitHub secrets
Repository > Settings > Secrets and variables > Actions > Secrets:
- DEV_FTP_HOST: hostname only, no protocol or path.
- DEV_FTP_USER: full FTP username shown by cPanel (often includes @domain).
- DEV_FTP_PASSWORD: dedicated FTP account password.

Repository secrets work with this workflow's development environment.
Do not put credentials in code, commit them, or paste them in chat.

## 3. Enable deployment
In the same Actions settings, open Variables > New repository variable:
- Name: DEV_DEPLOY_ENABLED
- Value: true

This switch must be a REPOSITORY variable, not an environment variable,
because the deploy job is gated before its environment is loaded.
No FTP path variable is needed: uploads target the restricted account's /.

## 4. Trigger and check
Push a commit to codex/replace-with-downloaded-project after enabling the switch.
In Actions, open "Deploy Astro dev site" and verify both build and deploy are green.
If this workflow's initial run was skipped before setup, re-run all jobs after setup.
Builds run even when deployment is disabled, and retain static artifacts for 14 days.

The Run workflow button requires the workflow file to exist on the default branch.
Until then, use a push or re-run a previous run. Once available, select the dev branch
in the Run workflow dropdown; deployment is guarded to that branch.

## Behavior and limits
- Runs Astro type checks, existing Node tests, and a static Astro build.
- Uses SITE_URL=https://dev.fugleadvokatene.no and PUBLIC_PREVIEW=true.
- Publishes static files only; excludes api/, admin/, uploads/, hidden files and PHP.
- Does not upload private backend source or replace .htaccess, .user.ini, php.ini,
  .well-known/, uploads, or existing PHP/admin files.
- Does not delete remote files. Removed pages can remain accessible until manually
  removed. Old hashed assets are retained to avoid breaking open browser tabs.
- Uploads assets before HTML using temporary files and per-file rename. This is
  not a whole-site atomic deployment; a failed upload may leave a partial release.
  Re-run the job to finish it.
- Contact/volunteer forms and the CMS still need the separate PHP deployment.
- The original site.yml production workflow remains unchanged.

## Disable / rollback
Set DEV_DEPLOY_ENABLED=false to stop future uploads.
For a rollback, revert the unwanted commit(s) on the dev branch and push:
this rebuilds and redeploys the earlier source. Files introduced by the reverted
version are retained remotely and must be removed manually if necessary.
Artifacts can also be downloaded from a successful run and their contents uploaded
with the restricted FTP account. Keep server configuration files.
