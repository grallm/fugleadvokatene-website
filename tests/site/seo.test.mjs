import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const page = route => readFile(`dist/${route}index.html`, 'utf8');
test('Production pages remain indexable, preview pages are noindex and robots permits crawling', async () => {
  const home = await page('');
  const preview = process.env.PUBLIC_PREVIEW !== 'false';
  assert.equal(home.includes('content="noindex, follow"'), preview);
  const robots = await readFile('dist/robots.txt', 'utf8');
  assert.doesNotMatch(robots, /Disallow: \/\n/);
  assert.match(robots, /Allow: \//);
  assert.equal(robots.includes('Sitemap:'), !preview);
});
test('Empty collections stay out of the sitemap and noindex only their landing pages', async () => {
  const sitemap = await readFile('dist/sitemap.xml', 'utf8');
  for (const route of ['nettbutikk/', 'en/shop/', 'nyheter/', 'en/news/']) {
    assert.match(await page(route), /content="noindex, follow"/);
    assert.ok(!sitemap.includes(`${route}</loc>`));
  }
});
test('Core pages have distinct metadata, self canonicals and valid organization data', async () => {
  const descriptions = new Set();
  for (const route of ['', 'en/', 'kontakt/', 'en/contact/', 'veiledning/', 'en/bird-help/', 'bli-frivillig/', 'en/volunteer/', 'stott-oss/', 'en/support/']) {
    const html = await page(route);
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert.ok(description);
    assert.ok(!descriptions.has(description), `Duplicate description: ${route}`);
    descriptions.add(description);
    const origin = process.env.SITE_URL || 'https://www.fugleadvokatene.no';
    assert.ok(html.includes(`rel="canonical" href="${new URL('/' + route, origin)}"`));
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert.equal(schema['@type'], 'Organization');
    assert.equal(schema.url, 'https://www.fugleadvokatene.no/');
    assert.equal(schema.sameAs.length, 2);
    assert.doesNotMatch(html, /src="\/scripts\/site-language.js"/);
  }
});
