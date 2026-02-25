import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLanguageFromPath, getLocalizedPath, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../config/languages';

const LANGUAGE_PREFERENCE_KEY = 'preferred_language';

export const useLanguage = () => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  // Get current language from URL
  const currentLang = getLanguageFromPath(location.pathname);

  // Sync i18n with URL language
  useEffect(() => {
    if (i18n.language !== currentLang) {
      i18n.changeLanguage(currentLang);
    }
  }, [currentLang, i18n]);

  // Function to change language
  const changeLanguage = (langCode) => {
    // Save preference
    localStorage.setItem(LANGUAGE_PREFERENCE_KEY, langCode);
    
    // Change i18n language
    i18n.changeLanguage(langCode);
    
    // Navigate to new language path
    const newPath = getLocalizedPath(location.pathname, langCode);
    navigate(newPath);
  };

  // Get localized path for a given route
  const getLocalizedRoute = (path) => {
    return getLocalizedPath(path, currentLang);
  };

  return {
    currentLang,
    changeLanguage,
    getLocalizedRoute,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isDefaultLang: currentLang === DEFAULT_LANGUAGE
  };
};

export default useLanguage;
