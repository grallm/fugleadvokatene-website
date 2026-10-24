import { getCollection } from "astro:content";
import { isPreview } from "../data/site";
import { routes, languages, contentHref, type Language } from "./routes";
export interface SiteRoute {
  key: string;
  language: Language;
  path: string;
  indexable: boolean;
}
export function getSiteRoutes(): Promise<SiteRoute[]> {
  return buildRoutes();
}
async function buildRoutes(): Promise<SiteRoute[]> {
  const result: SiteRoute[] = [];
  for (const language of languages) {
    const publishedPosts = await getCollection(language === "en" ? "postsEn" : "posts", ({ data }) => !data.draft);
    const products = await getCollection(language === "en" ? "productsEn" : "products", ({ data }) => !data.draft);
    for (const key of [
      "home",
      "contact",
      "volunteer",
      "volunteers",
      "support",
      "help",
      "shop",
      "news",
      "thanks",
      "notFound",
    ] as const) {
      result.push({
        key,
        language,
        path: routes[key][language],
        indexable: key !== "thanks" && key !== "notFound" && (key !== "news" || publishedPosts.length > 0) && (key !== "shop" || products.length > 0),
      });
    }
    const pages = await getCollection(language === "en" ? "pagesEn" : "pages");
    const posts = await getCollection(language === "en" ? "postsEn" : "posts");
    const volunteers = await getCollection(
      language === "en" ? "volunteersEn" : "volunteers",
    );
    for (const entry of pages.filter(({ data }) => !data.draft)) {
      result.push({
        key: `page:${entry.id}`,
        language,
        path: contentHref(language, "page", entry.id),
        indexable: true,
      });
    }
    for (const [kind, entries] of [
      ["post", posts],
      ["volunteer", volunteers],
    ] as const) {
      for (const entry of entries.filter(
        ({ data }) => !data.draft || isPreview,
      )) {
        result.push({
          key: `${kind}:${entry.id}`,
          language,
          path: contentHref(language, kind, entry.id),
          indexable: !entry.data.draft,
        });
      }
    }
  }
  return result;
}
export async function languageLinks(
  path: string,
): Promise<Partial<Record<Language, string>>> {
  const all = await getSiteRoutes();
  const normalized = path === "/404" || path === "/404/" ? "/404.html" : path;
  const current = all.find((route) => route.path === normalized);
  if (!current) return {};
  return Object.fromEntries(
    all
      .filter((route) => route.key === current.key)
      .map((route) => [route.language, route.path]),
  );
}
