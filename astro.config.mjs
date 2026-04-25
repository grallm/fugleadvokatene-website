import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  site: "https://grallm.github.io",
  base: "/fugleadvokatene-website",
  i18n: {
    defaultLocale: "no",
    locales: ["no", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
