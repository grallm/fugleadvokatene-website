# FugleAdvokatene

Astro static website + PHP admin/API + GitHub Actions + hosted checkout links. Designed for the existing Domene.no PHP webhotel, without a Node server or database in production.

**Status: buildable implementation on the development branch; editorial and account configuration review remain before publishing.** Supplied photos and official logos from `main` are integrated, with Font Awesome icons replacing the demo icons. See `docs/FIGMA.md`.

## Start locally

Requirements: Node 24 (22.12+ works), npm, and PHP 8.3+ with `curl`, `mbstring`, `gd`, `fileinfo`, sessions and outbound HTTPS.

```sh
npm ci
npm run dev
```

Astro serves at `http://localhost:4321`. Demo illustrations fill the image slots, including the hero, volunteer cards and temporary branding. For PHP functionality:

```sh
cp backend/config.example.php backend/config.php
php backend/hash-password.php
# Set config values; local origin http://localhost:4321, secure_cookies false,
# mail_transport log. Keep the GitHub token empty until intentional publishing.
npm run build
npm run serve:php
# In another terminal: npm run dev
```

Edit settings inside the existing `return [ ... ];` array in `backend/config.php`; keep its opening `<?php` tag and the complete array wrapper. Open the admin at `http://localhost:4321/admin/`. Paths under `/api/` serve API responses.

Astro proxies `/api` to PHP on port 8080. Or open the built site on `http://127.0.0.1:8080` and use that exact `origin` in PHP config. Always use the same hostname; `localhost` and `127.0.0.1` are different origins. `serve:php` copies your ignored local config into the private build directory. Rebuilding clears that copy; source config stays safe.

## Languages

Norwegian Bokmål is the default at `/`. English is available at `/en/`. The homepage opens English for browsers that prefer English, and defaults to Norwegian otherwise. It uses the first supported language in the browser’s preference list (English or Norwegian). An explicit choice in the language switcher is remembered in browser storage and takes priority on future homepage visits. Direct page links retain their language. Without JavaScript, the root homepage stays Norwegian.

The navigation language switcher opens the corresponding translated page, or that language’s homepage when no translation has been published.

Navigation, forms, accessibility labels, dates and prices follow the selected language. Facebook and Instagram posts remain in their original language. Each page has a language attribute, canonical URL and links to available translations; the sitemap contains both languages.

Editable English content lives in `src/content/{pages,posts,volunteers,products}/en/`. In `/admin/`, select **Norsk** or **English** before loading or saving content. Use the same slug for both translations to pair them. Each translation has its own draft status and must be published separately. English static UI text lives in `src/i18n/ui.ts`.

## Content editor

The admin uses TOAST UI Editor and opens in visual (WYSIWYG) mode. Its toolbar supports headings, emphasis, lists, quotes, links, images, tables and code. Switch between **WYSIWYG** and **Markdown** at the bottom of the editor; saving either mode writes Markdown to the existing content files.

Images inserted or pasted into the editor use the same PHP/GitHub upload endpoint as cover images: JPEG, PNG or WebP, up to 4 MB. Uploaded images become available after the next successful publication.

## Included

- Norwegian responsive homepage based on the supplied Figma, with a manual three-slide hero and mobile navigation.
- About, bird-help guidance, contact, volunteering, donations, news, volunteer profiles, store, privacy/terms drafts and 404 pages.
- Password-protected `/admin/` with a locally bundled TOAST UI Markdown editor. Edit pages, posts, volunteer profiles and products; upload JPEG/PNG/WebP; publish or unpublish by toggling draft.
- PHP session authentication, CSRF and origin checks, idle expiry, rate limits, server validation, safe image re-encoding and version-conflict handling.
- GitHub-backed content: saves use the Contents API with the file SHA; the server-held token never reaches the browser. Commits trigger Actions.
- PHP contact and volunteer forms; production uses the host's mail transport, local mode writes only local test logs.
- Optional Facebook + connected Instagram feed: server-side tokens, cached JSON and local image copies, last successful feed retained on failure.
- Product cards with external hosted checkout links. No payment credentials in the website, no custom checkout, cart or order database.
- CI and gated FTPS deployment; scheduled feed refresh; setup and rollback instructions.

## How content gets published

1. Editor signs in to `/admin/`.
2. PHP validates the edit and commits Markdown to `src/content/` in GitHub.
3. Actions checks PHP and Astro, builds static HTML, and publishes to the webhotel when deployment is enabled.
4. The editor gets a commit ID. "Saved" means committed, **not** deployed; check the Actions run before assuming the live site changed.

All Markdown uses JSON inside YAML frontmatter delimiters. JSON is a YAML subset and avoids quoting/injection problems. Manually authored YAML frontmatter is readable by Astro but must be converted to JSON for this small admin. Blog content HTML is sanitized during the build.

## Store choice

Use **Stripe Payment Links** as the default simplest checkout, or paste another trusted hosted HTTPS payment link. Create the real product, price, shipping/address requirements and payment link in the provider, then add its display details in the admin. Transactions and fulfilment are managed in that provider's dashboard. There is no extra commerce server; provider fees still apply.

Existing Vipps/PayPal donation links are kept separately. A Vipps donation number is not a product checkout integration. No products or live payment links have been invented. See `docs/STORE.md`.

## Main files

| Path | Purpose |
| --- | --- |
| `src/pages/`, `src/components/`, `src/styles/` | Astro website and admin UI |
| `src/content/{posts,pages,volunteers,products}/` | Editable Markdown content |
| `src/data/site.ts` | Contact, donation and navigation settings |
| `public/api/index.php` | Public API entry point |
| `backend/src/` | Private PHP services, outside document root |
| `backend/config.example.php` | Template for server-only credentials |
| `scripts/` | Packaging, FTPS publishing, Figma asset verification |
| `.github/workflows/` | Build/deployment and social-feed jobs |
| `docs/SETUP.md` | Complete launch instructions |
| `docs/PLAN.md` | Architecture, scope and remaining work |

## PHP formatting

PHP formatting uses Prettier and `@prettier/plugin-php`, installed by `npm ci`. The project configuration targets PHP 8.3, uses four-space indentation and wraps long expressions.

```sh
npm run format:php        # Format PHP source and tests
npm run format:php:check  # Check without changing files; also runs in CI
```

In VS Code, install the recommended **Prettier - Code formatter** extension. Workspace settings enable format on save for PHP. Generated output and private `backend/config.php` are excluded from the formatting commands. After formatting backend source, run `npm run build` to refresh the packaged copy used by the local PHP server.

## Checks

```sh
npm run format:php:check
npm run check
npm test
npm run test:php
npm run build
npm run test:site
npm run test:http
node scripts/check-assets.mjs
```

The final command verifies the supplied photos, official logos and approved icon component. Production CI requires it when `SITE_READY=true`. Preview builds remain possible and default to `noindex`. See `docs/VERIFICATION.md` for the checks actually run and their limits.

Content derived from the Figma mockup is marked draft. Privacy and sales terms are clearly marked review drafts. `PUBLIC_PREVIEW=false` excludes draft posts/profiles; products always require `draft=false` to appear. Publishing a new custom page creates its route, but does not automatically add it to the navigation.

## Optimized photographs

The four supplied photographs are integrated in both languages. `Photo.astro` serves AVIF with WebP fallback at 480, 960 and 1600 pixels, using responsive `srcset` and lazy loading (the first hero is prioritized). Files in `public/images/photos/` are already compressed; Astro copies them unchanged. No image service or PHP extension is needed on the host. See `docs/IMAGES.md` for the source mapping and compression settings. The official emblem and full logo are copied from `main`; UI and social icons use Font Awesome, rendered as inline SVG without client JavaScript.
