# Implementation plan and decisions

## Architecture

Astro generates static HTML in GitHub Actions. Domene.no serves it alongside PHP. The only writable runtime state is PHP sessions, rate-limit files and a social-feed cache. GitHub is the source of truth for editorial content. No MySQL, Node hosting, SaaS CMS or monthly store subscription is required by this implementation.

The earlier conversation chose an inexpensive PHP editor that commits Markdown to GitHub. The supplied Figma adds a turquoise/coral identity, Gabarito typography, a three-slide help/support/volunteer hero, volunteer profiles and social-feed cards. The implementation translates these into Astro components and responsive layouts.

## Phases

| Phase | State | Deliverable / remaining dependency |
| --- | --- | --- |
| Requirements | Done | Astro/PHP/Domene.no architecture recovered; current site and Figma inspected |
| Frontend | Implemented; visual acceptance pending | Pages, reusable layout, carousel, mobile menu; exact artwork must be exported |
| Content admin | Implemented | One admin account, Markdown editor, image upload, SHA-aware commits, drafts |
| Forms | Implemented | General enquiries and volunteer interest; actual host mail delivery must be checked |
| Shop | Implemented at hosted-link level | Organisation must create real products/payment links and fulfilment policy |
| Social | Implemented; account connection pending | Facebook Page token/permissions, API version, optional linked Instagram ID |
| Delivery | Implemented; not activated | GitHub repository, production environment, FTPS credentials and host PHP configuration |
| Launch | Pending | Exact assets, approved content, host/browser checks, test order, DNS/cutover decision |

## Deliberate simplifications

- One admin account; no multi-user roles, password reset service or database.
- Posts are drafts or published. A date is metadata, not a scheduling mechanism.
- No custom cart. Each buy button opens a hosted checkout. Stock and displayed prices must be kept in sync manually.
- No webhook/automated fulfilment; handle orders in the payment provider dashboard. The thank-you route never claims a payment succeeded.
- No live Meta widgets or third-party tracking JavaScript. The feed is fetched by PHP and public cards use local cached images.
- No automatic carousel rotation. All slides remain reachable by keyboard and explicit buttons.
- No invented veterinarian directory. The mockup's directory CTA leads to a guidance section until a reviewed list is supplied.
- The desktop mockup's oversized empty space and mobile footer offset are not copied into fixed-position production layouts. Content determines page height.

## Launch acceptance criteria

Exact Figma asset files pass validation; mobile and desktop comparison is reviewed; all sample biographies and stale social text are removed or approved; privacy/terms are final; production forms reach the intended mailbox; wrong-password/CSRF checks work on the host; an admin save triggers a successful deploy; unpublishing removes the old HTML; a payment-provider test purchase completes; backup and rollback are rehearsed on staging.

## Sources and assumptions

- Design: https://www.figma.com/design/4pXeiKn0Bv2GhlnWJiP1nV/Fugleadvokatene?node-id=312-462
- Current public contact/donation details: https://www.fugleadvokatene.no/ (checked 2026-09-30).
- Domene.no advertises PHP hosting and FTP access, but the exact account PHP version, extensions, private-directory access, TLS FTP support, mail configuration and deployment paths remain to be confirmed.
- Checkout: https://docs.stripe.com/payment-links
- Astro content collections: https://docs.astro.build/en/guides/content-collections/
- GitHub content API: https://docs.github.com/en/rest/repos/contents

No existing repository, FTP credentials, payment account or Meta credentials were supplied. This deliverable is a new source project, not a migration or deployment of the existing live site.
