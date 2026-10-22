export type Language = "nb" | "en";
export const languages: Language[] = ["nb", "en"];
export const locale = { nb: "nb-NO", en: "en-GB" };
export const routes = {
  home: { nb: "/", en: "/en/" },
  contact: { nb: "/kontakt/", en: "/en/contact/" },
  volunteer: { nb: "/bli-frivillig/", en: "/en/volunteer/" },
  volunteers: { nb: "/frivillige/", en: "/en/volunteers/" },
  support: { nb: "/stott-oss/", en: "/en/support/" },
  help: { nb: "/veiledning/", en: "/en/bird-help/" },
  shop: { nb: "/nettbutikk/", en: "/en/shop/" },
  news: { nb: "/nyheter/", en: "/en/news/" },
  thanks: { nb: "/takk/", en: "/en/thank-you/" },
  notFound: { nb: "/404.html", en: "/en/404/" },
  about: { nb: "/om-oss/", en: "/en/about/" },
  privacy: { nb: "/personvern/", en: "/en/privacy/" },
  terms: { nb: "/vilkar/", en: "/en/terms/" },
} as const;
export type RouteKey = keyof typeof routes;
export function href(language: Language, key: RouteKey): string {
  return routes[key][language];
}
export function contentHref(
  language: Language,
  kind: "page" | "post" | "volunteer",
  id: string,
): string {
  if (kind === "page") {
    const known = {
      "om-oss": "about",
      personvern: "privacy",
      vilkar: "terms",
    } as const;
    const key = known[id as keyof typeof known];
    return key
      ? href(language, key)
      : `${language === "en" ? "/en/" : "/"}${id}/`;
  }
  const prefix =
    kind === "post"
      ? href(language, "news")
      : language === "en"
        ? "/en/volunteers/"
        : "/frivillige/";
  return `${prefix}${id}/`;
}
