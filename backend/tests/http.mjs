// Runs only against an isolated local copy, with local log-mode mail and no GitHub token.
import { cp, mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { execFileSync, spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import net from "node:net";
import assert from "node:assert/strict";
const php = process.env.PHP_BIN || "php";
const temporary = await mkdtemp(path.join(tmpdir(), "fugle-http-"));
await cp("build", temporary, { recursive: true });
const probe = net.createServer();
await new Promise((r) => probe.listen(0, "127.0.0.1", r));
const port = probe.address().port;
await new Promise((r) => probe.close(r));
const origin = `http://127.0.0.1:${port}`,
  password = randomBytes(24).toString("hex");
const hash = execFileSync(
  php,
  ["-r", `echo password_hash('${password}', PASSWORD_DEFAULT);`],
  { encoding: "utf8" },
).trim();
await writeFile(
  path.join(temporary, "fugle-private/config.php"),
  `<?php return ['origin'=>'${origin}','secure_cookies'=>false,'admin_username'=>'test','admin_password_hash'=>'${hash}','mail_transport'=>'log','github_token'=>'','github_repository'=>'','cron_token'=>''];`,
);
const server = spawn(
  php,
  ["-S", `127.0.0.1:${port}`, "-t", path.join(temporary, "public")],
  { stdio: "ignore" },
);
let cookie = "",
  csrf = "";
async function request(
  action,
  payload,
  token = csrf,
  requestOrigin = origin,
  language = "nb",
) {
  const response = await fetch(`${origin}/api/index.php?action=${action}`, {
    method: payload ? "POST" : "GET",
    headers: {
      Cookie: cookie,
      "X-Site-Language": language,
      ...(payload
        ? {
            "Content-Type": "application/json",
            "X-CSRF-Token": token,
            Origin: requestOrigin,
          }
        : {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const set = response.headers.getSetCookie();
  if (set.length) cookie = set.at(-1).split(";")[0];
  return { status: response.status, data: await response.json() };
}
try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(origin + "/api/index.php?action=feed");
      ready = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  assert.ok(ready, "PHP server starts");
  let r = await request("session");
  assert.equal(r.status, 200);
  csrf = r.data.csrf;
  r = await request("list&collection=posts");
  assert.equal(r.status, 401);
  r = await request("login", { username: "test", password });
  assert.equal(r.status, 200);
  csrf = r.data.csrf;
  r = await request("session");
  assert.equal(r.data.authenticated, true);
  r = await request("contact", {
    kind: "contact",
    name: "Local test",
    email: "test@example.org",
    message: "Integration test only.",
    consent: "on",
    website: "",
  });
  assert.equal(r.status, 200);
  r = await request("contact", { name: "Bad" }, "invalid");
  assert.equal(r.status, 403);
  r = await request("contact", { name: "Bad" }, csrf, "https://evil.example");
  assert.equal(r.status, 403);
  r = await request("contact", { name: "Bad" }, "invalid", origin, "en");
  assert.equal(r.status, 403);
  assert.equal(
    r.data.error,
    "Your session has expired. Reload the page and try again.",
  );
  r = await request("list&collection=posts&language=../en");
  assert.equal(
    r.status,
    422,
    "CMS rejects invalid language before contacting GitHub",
  );
  r = await request(
    "contact",
    {
      kind: "contact",
      name: "Local test",
      email: "invalid-email",
      message: "Integration test only.",
      consent: "on",
      website: "",
    },
    csrf,
    origin,
    "en",
  );
  assert.equal(r.status, 422);
  assert.equal(r.data.error, "Enter a valid email address.");
  r = await request("logout", {});
  assert.equal(r.status, 200);
  r = await request("session");
  assert.equal(r.data.authenticated, false);
  const configPath = path.join(temporary, "fugle-private/config.php");
  const validConfig = await readFile(configPath, "utf8");
  for (const broken of [
    validConfig.replace("'admin_username'=>'test',", ""),
    validConfig.replace("'admin_username'=>'test'", "'admin_username'=>[]"),
  ]) {
    await writeFile(configPath, broken);
    r = await request("session");
    csrf = r.data.csrf;
    r = await request("login", { username: "test", password });
    assert.equal(r.status, 503);
    assert.equal(r.data.error, "Admin er ikke konfigurert.");
  }
  await writeFile(configPath, validConfig);
  const sentinel = "fixture-only-config-secret";
  const invalidConfigs = [
    `'origin' => '${origin}', 'admin_password_hash' => '${sentinel}',`,
    `<?php echo '${sentinel}'; return [];`,
    `<?php return '${sentinel}';`,
    `<?php return ['admin_password_hash' => '${sentinel}';`,
  ];
  for (const config of invalidConfigs) {
    await writeFile(configPath, config);
    const response = await fetch(`${origin}/api/index.php?action=session`);
    const text = await response.text();
    assert.equal(response.status, 503, "Malformed config is rejected");
    assert.equal(
      text.includes(sentinel),
      false,
      "Config values never reach the response",
    );
    assert.deepEqual(JSON.parse(text), {
      error: "Tjenesten er ikke konfigurert riktig.",
    });
  }
  await writeFile(configPath, validConfig);
  r = await request("session");
  assert.equal(
    r.status,
    200,
    "Valid config works after malformed config is replaced",
  );
  console.log(
    "HTTP session, login, contact, CSRF, origin, logout and config-disclosure checks passed. No external messages sent.",
  );
} finally {
  server.kill();
  await new Promise((r) => server.once("exit", r));
  await rm(temporary, { recursive: true, force: true });
}
