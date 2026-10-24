import { routes, type RouteKey } from '../i18n/routes';
type Metadata = { title: string; description: string };
const entries: Partial<Record<RouteKey, { nb: Metadata; en: Metadata }>> = {
  home: {
    nb: { title: 'Hjelp til skadde fugler i Oslo og Bergen', description: 'Fugleadvokatene redder og rehabiliterer skadde byfugler. Finn hjelp til en fugl i nød, bli frivillig eller støtt arbeidet vårt.' },
    en: { title: 'Help for injured birds in Oslo and Bergen', description: 'Fugleadvokatene rescues and rehabilitates injured urban birds. Find help for a bird in need, volunteer or support our work.' },
  },
  help: {
    nb: { title: 'Funnet en skadet fugl? Få hjelp', description: 'Se hva du kan gjøre når du finner en skadet fugl. Finn første steg, hjelpegruppen vår og veterinærkontakter i Oslo og Bergen.' },
    en: { title: 'Found an injured bird? Get help', description: 'Find out what to do when you find an injured bird, with first steps, our help group and veterinary contacts in Oslo and Bergen.' },
  },
  volunteer: {
    nb: { title: 'Bli frivillig for byfugler', description: 'Vil du hjelpe byfugler? Les om frivillig arbeid hos Fugleadvokatene og ta kontakt for å bidra med tid, kunnskap eller praktisk hjelp.' },
    en: { title: 'Volunteer to help urban birds', description: 'Help urban birds with Fugleadvokatene. Learn about volunteering and contact us to contribute your time, knowledge or practical help.' },
  },
  volunteers: {
    nb: { title: 'Møt våre frivillige', description: 'Møt menneskene bak Fugleadvokatene. Les historiene til frivillige som hjelper skadde fugler og bidrar til arbeidet vårt.' },
    en: { title: 'Meet our volunteers', description: 'Meet the people behind Fugleadvokatene. Read about the volunteers who help injured birds and contribute to our work.' },
  },
  contact: {
    nb: { title: 'Kontakt Fugleadvokatene', description: 'Kontakt Fugleadvokatene på e-post eller sosiale medier. Trenger en fugl rask hjelp? Finn lenken til hjelpegruppen vår.' },
    en: { title: 'Contact Fugleadvokatene', description: 'Contact Fugleadvokatene by email or social media. If a bird needs urgent help, find the link to our bird-help group.' },
  },
  support: {
    nb: { title: 'Støtt arbeidet for skadde fugler', description: 'Hjelp Fugleadvokatene å redde byfugler. Se hvordan du kan bidra med en gave eller bli fastgiver via Vipps.' },
    en: { title: 'Support our work for injured birds', description: 'Help Fugleadvokatene rescue urban birds. Find ways to donate or become a regular supporter through Vipps.' },
  },
};
export const metadata: Record<string, Metadata> = Object.fromEntries(
  Object.entries(entries).flatMap(([key, translations]) =>
    (['nb', 'en'] as const).map(language => [routes[key as RouteKey][language], translations[language]])),
);
