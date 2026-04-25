export const defaultLang = "no" as const;

export const ui = {
  no: {
    "site.title": "FugleAdvokatene",
    "nav.contact": "Kontakt",
    "nav.store": "Butikk",
    "nav.blog": "Blogg",
    "nav.guides": "Guider",
    "nav.about": "Hvem vi er",

    "welcome.title": "Velkommen til FugleAdvokatene.",
    "welcome.body":
      "Vi er en frivillig organisasjon som redder og rehabiliterer byfuglene i Oslo og Bergen.",

    "welcome.card1.title": "Hvem kan hjelpe i nærheten?",
    "welcome.card1.body": "En liste over tilgjengelige rehabiliteringssteder",
    "welcome.card2.title": "Vil du støtte oss?",
    "welcome.card2.body": "Slik kan du donere.",

    "found.title": "Har du funnet en fugl?",
    "found.body":
      "Her er noen smarte guider for å hjelpe deg å håndtere situasjonen",

    "guide.injured.title": "Er den skadet?",
    "guide.injured.body": "Slik håndterer du det",
    "guide.handling.title": "Håndtering av ville fugler",
    "guide.handling.body": "For deres sikkerhet – og din",
    "guide.hygiene.title": "Tenk alltid på hygiene",
    "guide.hygiene.body": "For både din og fuglenes skyld",
    "guide.species.title": "Hva slags fugl er det?",
    "guide.species.body": "En oversikt over kjente byfuglarter",

    "blog.title": "Blogg",
    "blog.post1.title": "Kjente fuglearter i byen",
    "blog.post1.caption": "Se her for å finne ut hvilken fugl du har funnet",
    "blog.post2.title": "Lover og regler rundt hjelp til fugler",
    "blog.post2.caption": "Hva du må huske på",

    "regulars.title": "Møt våre faste",
    "regulars.caption":
      "Disse fuglene trenger ikke vår hjelp, men det er fint om du holder et øye med dem.",
    "regulars.areas.title": "Kjente reirplasser og andre sårbare områder",
    "regulars.areas.caption": "Vær litt mer oppmerksom rundt disse områdene",

    "store.title": "Nettbutikk",
    "store.popular": "Populære produkter",
    "product.pin.name": "Pin",
    "product.card.name": "Kort",
    "product.bag.name": "Bærenett",
    "product.price": "Pris",
    "product.description": "Produktbeskrivelse",

    "footer.mail": "mail:",
    "footer.phone": "tlf:",
    "footer.social": "Sosiale medier",
  },
  en: {
    "site.title": "FugleAdvokatene",
    "nav.contact": "Contact",
    "nav.store": "Store",
    "nav.blog": "Blog",
    "nav.guides": "Guides",
    "nav.about": "Who we are",

    "welcome.title": "Welcome to FugleAdvokatene.",
    "welcome.body":
      "We are a voluntary organisation who rescue and rehabilitate the citybirds of Oslo and Bergen.",

    "welcome.card1.title": "Who can help near me?",
    "welcome.card1.body": "A list of available recovery homes",
    "welcome.card2.title": "Do you want to support us?",
    "welcome.card2.body": "This is how you can donate.",

    "found.title": "Did you find a bird?",
    "found.body":
      "Here are some smart guides to best help you take care of the situation",

    "guide.injured.title": "Is it injured?",
    "guide.injured.body": "This is how you handle it",
    "guide.handling.title": "Handling of wild birds",
    "guide.handling.body": "For their safety – and yours",
    "guide.hygiene.title": "Always think about hygiene",
    "guide.hygiene.body": "For both your sake and the birds",
    "guide.species.title": "What kind of bird is it?",
    "guide.species.body": "An overview of known city bird species",

    "blog.title": "Blog",
    "blog.post1.title": "Known bird species in the city",
    "blog.post1.caption": "Look here to know what bird you have found",
    "blog.post2.title": "Laws and rules around helping birds",
    "blog.post2.caption": "What you have to keep in mind",

    "regulars.title": "Meet our regulars",
    "regulars.caption":
      "These birds don't need our help, but it is nice of you to keep an eye out.",
    "regulars.areas.title": "Known nesting places and other vulnerable areas",
    "regulars.areas.caption": "Please be a bit more aware around these areas",

    "store.title": "Online store",
    "store.popular": "Popular products",
    "product.pin.name": "Pin",
    "product.card.name": "Card",
    "product.bag.name": "Tote bag",
    "product.price": "Price",
    "product.description": "Product description",

    "footer.mail": "mail:",
    "footer.phone": "tel:",
    "footer.social": "Social media",
  },
} as const;

export type Lang = keyof typeof ui;
export type UIKey = keyof (typeof ui)[typeof defaultLang];

export function useTranslations(lang: Lang | string | undefined) {
  const safe: Lang = lang === "en" ? "en" : "no";
  return function t(key: UIKey): string {
    return ui[safe][key];
  };
}
