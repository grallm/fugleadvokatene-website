(() => {
  const preferenceKey = 'fugle-site-language';
  const validLanguage = value => value === 'nb' || value === 'en';
  function remember(language) {
    try {
      localStorage.setItem(preferenceKey, language);
      return true;
    } catch {
      return false;
    }
  }
  function browserLanguage() {
    const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const language of preferred) {
      const base = language?.toLowerCase().split('-')[0];
      if (base === 'en') return 'en';
      if (['nb', 'nn', 'no'].includes(base)) return 'nb';
    }
    return 'nb';
  }
  const url = new URL(location.href);
  const requested = url.searchParams.get('lang');
  let saved;
  try {
    saved = localStorage.getItem(preferenceKey);
  } catch {
    // Language selection also works when browser storage is unavailable.
  }
  if (validLanguage(requested)) remember(requested);
  const language = validLanguage(requested) ? requested : validLanguage(saved) ? saved : browserLanguage();
  // Only the default homepage negotiates language. A direct page URL stays in its chosen language.
  if (['/', '/index.html'].includes(url.pathname) && language === 'en') {
    url.pathname = '/en/';
    location.replace(url.href);
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[data-site-language]').forEach(link => {
      link.addEventListener('click', () => {
        const selected = link.dataset.siteLanguage;
        if (!validLanguage(selected)) return;
        if (!remember(selected)) {
          // Keep a manual choice effective even if storage is blocked.
          const target = new URL(link.href);
          target.searchParams.set('lang', selected);
          link.href = target.href;
        }
      });
    });
  });
})();
