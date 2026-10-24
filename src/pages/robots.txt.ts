import type { APIRoute } from 'astro';
import { isPreview } from '../data/site';
export const GET: APIRoute = ({ site }) => new Response(
  `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n${isPreview ? '' : `Sitemap: ${new URL('sitemap.xml', site)}\n`}`,
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
);
