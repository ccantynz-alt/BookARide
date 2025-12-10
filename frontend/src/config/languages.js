// Supported languages configuration for international SEO

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', hreflang: 'en' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', hreflang: 'zh' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', hreflang: 'ja' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', hreflang: 'ko' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', hreflang: 'es' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', hreflang: 'fr' }
];

export const DEFAULT_LANGUAGE = 'en';

// Target markets for international landing pages
export const TARGET_MARKETS = [
  // Asia-Pacific
  { code: 'au', name: 'Australia', language: 'en', flag: '🇦🇺', region: 'Asia-Pacific' },
  { code: 'cn', name: 'China', language: 'zh', flag: '🇨🇳', region: 'Asia-Pacific' },
  { code: 'jp', name: 'Japan', language: 'ja', flag: '🇯🇵', region: 'Asia-Pacific' },
  { code: 'kr', name: 'South Korea', language: 'ko', flag: '🇰🇷', region: 'Asia-Pacific' },
  { code: 'sg', name: 'Singapore', language: 'en', flag: '🇸🇬', region: 'Asia-Pacific' },
  // Western Markets
  { code: 'us', name: 'United States', language: 'en', flag: '🇺🇸', region: 'Americas' },
  { code: 'uk', name: 'United Kingdom', language: 'en', flag: '🇬🇧', region: 'Europe' },
  { code: 'de', name: 'Germany', language: 'de', flag: '🇩🇪', region: 'Europe' },
  { code: 'fr', name: 'France', language: 'fr', flag: '🇫🇷', region: 'Europe' }
];

// Get language from URL path
export const getLanguageFromPath = (pathname) => {
  const langMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
  if (langMatch) {
    const langCode = langMatch[1];
    const isSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === langCode);
    if (isSupported) return langCode;
  }
  return DEFAULT_LANGUAGE;
};

// Remove language prefix from path
export const getPathWithoutLang = (pathname) => {
  return pathname.replace(/^\/[a-z]{2}(\/|$)/, '/') || '/';
};

// Add language prefix to path
export const getLocalizedPath = (pathname, langCode) => {
  const cleanPath = getPathWithoutLang(pathname);
  if (langCode === DEFAULT_LANGUAGE) {
    return cleanPath;
  }
  return `/${langCode}${cleanPath === '/' ? '' : cleanPath}`;
};

// Detect browser language
export const detectBrowserLanguage = () => {
  const browserLang = navigator.language || navigator.userLanguage;
  const langCode = browserLang.split('-')[0].toLowerCase();
  const isSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === langCode);
  return isSupported ? langCode : DEFAULT_LANGUAGE;
};

export default SUPPORTED_LANGUAGES;
