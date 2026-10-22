import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist");
const preview = (await readFile(path.join(root, "robots.txt"), "utf8")).includes("Disallow: /\n");
async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}
async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(file)));
    else if (entry.name.endsWith(".html")) files.push(file);
  }
  return files;
}
function outputFile(url) {
  const relative = decodeURIComponent(url.pathname).replace(/^\//, "");
  return path.join(
    root,
    relative,
    path.extname(relative) ? "" : "index.html",
  );
}
function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [
      key,
      value.replaceAll("&amp;", "&"),
    ]),
  );
}
test("English pages contain translated navigation, contact links and document metadata", async () => {
  const home = await readFile(path.join(root, "en/index.html"), "utf8");
  assert.match(home, /<html lang="en"/);
  assert.match(home, /Welcome to FugleAdvokatene/);
  assert.match(home, /href="\/en\/contact\/"/);
  assert.match(home, /href="\/en\/support\/"/);
  const contact = await readFile(
    path.join(root, "en/contact/index.html"),
    "utf8",
  );
  assert.match(contact, /Contact us/);
  assert.doesNotMatch(contact, /<form\b/);
  assert.match(contact, /mailto:kontakt@fugleadvokatene.no/);
  assert.match(contact, /https:\/\/www.facebook.com\/groups\/2050465221850483/);
  assert.match(contact, /https:\/\/www.instagram.com\/fugleadvokatene\//);
  assert.match(contact, /href="\/en\/privacy\/"/);
  const norwegian = await readFile(
    path.join(root, "kontakt/index.html"),
    "utf8",
  );
  assert.match(norwegian, /<html lang="nb"/);
  assert.match(norwegian, /Kontakt oss/);
});
test("Language alternatives point to equivalent, built pages in both directions", async () => {
  for (const file of await walk(root)) {
    const html = await readFile(file, "utf8");
    const links = [...html.matchAll(/<link\s[^>]*>/g)]
      .map(([tag]) => attributes(tag))
      .filter(
        (link) =>
          link.rel === "alternate" && ["nb", "en"].includes(link.hreflang),
      );
    const canonical = [...html.matchAll(/<link\s[^>]*>/g)]
      .map(([tag]) => attributes(tag))
      .find((link) => link.rel === "canonical")?.href;
    for (const link of links) {
      const target = outputFile(new URL(link.href));
      assert.ok(
        await exists(target),
        `${file}: missing alternative ${link.href}`,
      );
      const translated = await readFile(target, "utf8");
      assert.match(translated, new RegExp(`<html lang="${link.hreflang}"`));
      const alternatives = [...translated.matchAll(/<link\s[^>]*>/g)].map(
        ([tag]) => attributes(tag),
      );
      assert.ok(
        alternatives.some(
          (other) => other.rel === "alternate" && other.href === canonical,
        ),
        `${link.href}: missing reciprocal alternative`,
      );
    }
  }
  const english = await readFile(
    path.join(root, "en/contact/index.html"),
    "utf8",
  );
  assert.ok(
    [...english.matchAll(/<a\s[^>]*>/g)]
      .map(([tag]) => attributes(tag))
      .some((link) => link.hreflang === "nb" && link.href === "/kontakt/"),
  );
});
test("All built internal page links and section anchors resolve", async () => {
  for (const file of await walk(root)) {
    const html = await readFile(file, "utf8");
    const relative = path.relative(root, file).replaceAll(path.sep, "/");
    const pathname =
      relative === "index.html"
        ? "/"
        : relative.endsWith("/index.html")
          ? "/" + relative.slice(0, -10)
          : "/" + relative;
    for (const [, tag] of html.matchAll(/(<a\s[^>]*>)/g)) {
      const link = attributes(tag).href;
      if (!link) continue;
      const url = new URL(link, `https://www.fugleadvokatene.no${pathname}`);
      if (url.origin !== "https://www.fugleadvokatene.no") continue;
      const target = outputFile(url);
      assert.ok(await exists(target), `${relative}: missing page ${link}`);
      if (url.hash) {
        const targetHtml = await readFile(target, "utf8");
        const ids = [...targetHtml.matchAll(/\bid="([^"]+)"/g)].map(
          ([, id]) => id,
        );
        assert.ok(
          ids.includes(decodeURIComponent(url.hash.slice(1))),
          `${relative}: missing anchor ${link}`,
        );
      }
    }
  }
});
test("Drafts obey preview settings in both languages and stay out of the sitemap", async () => {
  for (const route of [
    "nyheter/velkommen",
    "en/news/velkommen",
  ]) {
    assert.equal(
      await exists(path.join(root, route, "index.html")),
      preview,
      route,
    );
  }
  const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
  assert.match(
    sitemap,
    /<loc>https:\/\/www\.fugleadvokatene\.no\/en\/contact\/<\/loc>/,
  );
  assert.match(sitemap, /hreflang="nb"/);
  assert.match(sitemap, /hreflang="en"/);
  assert.ok(!sitemap.includes("velkommen"));
  assert.ok(!sitemap.includes("agnes"));
});

test("All supplied volunteers have bilingual profiles, photos and directory links", async () => {
  for (const prefix of ["frivillige", "en/volunteers"]) {
    const directory = await readFile(path.join(root, prefix, "index.html"), "utf8");
    for (const slug of ["jenny", "mai", "madelen", "ida-mathilde", "mia"]) {
      assert.ok(directory.includes(`/${prefix}/${slug}/`));
      const profile = await readFile(path.join(root, prefix, slug, "index.html"), "utf8");
      assert.ok(profile.includes(`href="/${prefix}/"`));
      for (const [, image] of profile.matchAll(/src="(\/images\/volunteers\/[^\"]+)"/g)) {
        assert.ok(await exists(path.join(root, image)), `Missing photo ${image}`);
      }
      if (slug === "jenny") assert.doesNotMatch(profile, /styreleder|chairperson|chairwoman|chair of|leader of/i);
    }
    assert.ok(!directory.includes("frivillig-4"));
    assert.ok(!directory.includes("/agnes/"));
  }
});
