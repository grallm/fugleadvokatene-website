import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import markdoc from "@astrojs/markdoc";
import keystatic from "@keystatic/astro";
import react from "@astrojs/react";
import { loadEnv } from "vite";

const { KEYSTATIC } = loadEnv(process.env.NODE_ENV, process.cwd(), "");

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },

  site: "https://grallm.github.io",
  base: !!KEYSTATIC ? "" : "/fugleadvokatene-website",

  i18n: {
    defaultLocale: "no",
    locales: ["no", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Gabarito",
      cssVariable: "--font-gabarito",
    },
  ],

  integrations: [react(), markdoc(), keystatic()],
});
