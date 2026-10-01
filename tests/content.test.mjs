import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
test("Seed content uses CMS-compatible JSON frontmatter and valid metadata", async () => {
  for (const collection of ["posts", "pages", "volunteers", "products"])
    for (const language of ["", "/en"])
      for (const name of (
        await readdir(`src/content/${collection}${language}`)
      ).filter((name) => name.endsWith(".md"))) {
        const text = await readFile(
          `src/content/${collection}${language}/${name}`,
          "utf8",
        );
        const match = text.match(/^---\n([\s\S]*?)\n---\n/);
        assert.ok(match, name);
        const data = JSON.parse(match[1]);
        assert.ok(data.title && data.description);
        assert.equal(typeof data.draft, "boolean");
        assert.match(data.image, /^\/images\//);
        if (["posts", "volunteers", "products"].includes(collection))
          assert.equal(
            data.draft,
            true,
            "Unapproved seed content must stay draft",
          );
      }
});
test("Secrets and runtime storage are excluded from deployment", async () => {
  const packaging = await readFile("scripts/package.mjs", "utf8");
  assert.ok(!packaging.includes("cp('backend/config.php'"));
  const deploy = await readFile("scripts/deploy.mjs", "utf8");
  assert.ok(deploy.includes("!f.startsWith('src/')"));
  assert.ok(deploy.includes("secure:true"));
  assert.ok(!deploy.includes("rejectUnauthorized:false"));
});
