import type { APIRoute } from 'astro';
import { getSiteRoutes } from '../i18n/content';
export const GET: APIRoute = async ({ site }) => {
  const routes = (await getSiteRoutes()).filter(route => route.indexable);
  const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  const urls = routes.map(route => {
    const alternates = routes.filter(other => other.key === route.key);
    const links = alternates.map(other => `<xhtml:link rel="alternate" hreflang="${other.language}" href="${escape(new URL(other.path, site).href)}"/>`).join('');
    return `<url><loc>${escape(new URL(route.path, site).href)}</loc>${links}</url>`;
  }).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
