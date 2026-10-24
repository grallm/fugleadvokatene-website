# Technical SEO rollout

This PR changes metadata and crawl/indexing behavior, without adding pages or visible marketing content. The existing privacy language-storage sentence is corrected because language links no longer store a preference. Calendar work is separate.

## Hosting steps

1. Confirm both `fugleadvokatene.no` and `www.fugleadvokatene.no` resolve to the hosting server and have valid SSL certificates. Keep mail records and other subdomains unchanged.
2. Merge the PR and confirm the production GitHub Actions deployment succeeds. It now deploys `public/.htaccess` into the jailed production FTP root (`/public_html/prod`). The same file protects `preview` with a hostname-specific HTTP noindex header, without blocking production. Back up any manually customized `/prod/.htaccess` first; that file is now managed by Git.
3. Back up `/public_html/.htaccess`. If it still contains only the previously supplied production rewrite and PHP handler, replace it with [hosting/main-domain.htaccess](hosting/main-domain.htaccess). Preserve any additional hosting configuration if it has since changed. This parent file is intentionally NOT uploaded by the workflow. It selects HTTPS/www and changes the internal rewrite from END to L so that the child file's legacy redirects can run. Do not place the parent configuration inside prod.
4. Verify HTTP and bare-domain URLs redirect to `https://www.fugleadvokatene.no/`, without exposing `/prod`. Check a nested page such as `/kontakt/` too. Confirm dev, preview and kalendar remain independent.
5. Check `curl -I https://preview.fugleadvokatene.no/` includes `X-Robots-Tag: noindex, follow` while the production homepage does not. Apache must support mod_headers and mod_rewrite; these HTTP rules cannot be verified by an Astro build. Check the response headers after deployment.
6. Check `/about` → `/om-oss/`, `/article` → `/veiledning/`, `/blog` and `/copy-of-article` → `/en/bird-help/` with permanent 301 responses. The last two Wix pages were respectively an English bird-help directory and emergency guide, inspected on 24 October 2026.

## Search Console

- Add/verify the Domain property `fugleadvokatene.no` using Google's DNS TXT record in Wix. Keep the TXT record after verification.
- Submit `https://www.fugleadvokatene.no/sitemap.xml`.
- Inspect `/`, `/en/`, `/veiledning/` and `/en/bird-help/`; request indexing after the production deployment and DNS switch.
- Monitor indexing, 404s and search performance after launch. Google may take time to recrawl preview/dev and remove existing results.

No Change of Address request is needed: this is a hosting migration on the same domain. Pages with no published products/posts automatically become indexable when published content is added. Norwegian and English URLs remain accessible regardless of browser language. Old language preferences may remain in existing browsers but are no longer read or written.

## Validation

Run `npm run check`, `npm test`, then each build with its corresponding `npm run test:site`:

- `PUBLIC_PREVIEW=false npx astro build`
- `PUBLIC_PREVIEW=true SITE_URL=https://dev.fugleadvokatene.no npx astro build`

Pass the same environment variables to `npm run test:site`. Tests cover metadata, indexability, structured data, reciprocal hreflang, internal links and deployment manifest safety. Runtime Apache redirects and headers require the hosting checks above. Volunteer image optimization is a separate follow-up.
