# Verification record

Checked in the creation environment on 2026-09-30.

| Check | Result |
| --- | --- |
| Dependency installation and lockfile | Passed with Node 24.19 and npm 11.9 |
| `npm run check` | Passed; zero Astro/TypeScript errors |
| `npm run build` | Passed; static routes, public assets and private PHP source packaged |
| `npm test` | Passed; seed content/draft policy and packaging checks |
| PHP syntax | All PHP files passed lint in the PHP WebAssembly CLI runtime |
| PHP unit/security checks | 19 passed: path/collection constraints, frontmatter safety, real calendar dates, checkout URL/price validation, CSRF/origin validation, auth gate and rate limiting |
| API integration | Passed 8 response assertions via a PHP WebAssembly request handler: session, anonymous denial, login, authenticated session, local contact logging, bad CSRF/origin rejection, logout/session state |
| Production-mode build | Passed: sample post/profile routes omitted; indexing enabled only when preview is false |
| Workflow YAML | Both workflow files parsed successfully |
| Internal page-link scan | All built internal page links resolve |
| Figma asset check | Expected failure: all 11 production assets still require export |
| Browser interaction/visual QA | Not completed: browser download failed and the alternate Chromium runtime failed to initialise graphics in this environment |
| Native PHP on Domene.no | Pending account access and host configuration |
| GitHub commit/deploy round trip | Pending repository/token/FTPS configuration |
| Real mail delivery, Meta feed and payment checkout | Not exercised; no production messages sent or transactions created |

The PHP integration test found an incorrect directory depth in the API bootstrap; it was corrected to load `fugle-private` as a sibling of the document root. The corrected path was verified through the request handler.

PHP WebAssembly is a useful local check, not a substitute for testing the host's exact PHP extensions, filesystem permissions, session behaviour, cURL/TLS and mail delivery. CI uses native PHP 8.3 and includes `npm run test:http` for an isolated local HTTP server with test-only log transport. That native-server runner was added for reproducibility but could not run as a native PHP server in this environment.

The public bundle is small apart from the admin-only TOAST UI editor chunk. A build warning for that editor's chunk size remains; it is not loaded by public visitor pages.

This is a buildable source implementation with explicit launch dependencies. It is not described as deployed, visually accepted, fully migrated or production-ready.

Demo update: user-authorized temporary SVG illustrations now fill all 11 image/branding slots. Original Figma exports remain outstanding.
