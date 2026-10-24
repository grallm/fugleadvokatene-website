import { defineConfig } from 'astro/config';
import rehypeSanitize from 'rehype-sanitize';
import { unified } from '@astrojs/markdown-remark';
import { optimizeImages } from './scripts/optimize-images.mjs';
await optimizeImages();
export default defineConfig({
  site: process.env.SITE_URL || 'https://www.fugleadvokatene.no',
  output: 'static', trailingSlash: 'always',
  markdown: { processor: unified({ rehypePlugins: [rehypeSanitize] }) },
  vite: { server: { proxy: { '/api': 'http://127.0.0.1:8080' } } },
});
