import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { detectBrowserLanguage, getLanguageFromPath, getLocalizedPath, DEFAULT_LANGUAGE } from '../config/languages';

const LANGUAGE_PREFERENCE_KEY = 'preferred_language';

export const LanguageRedirect = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Skip redirect for admin, driver, and API routes
    if (location.pathname.startsWith('/admin') || 
        location.pathname.startsWith('/driver') ||
        location.pathname.startsWith('/api')) {
      return;
    }

    // Check if user has already set a language preference
    const savedLanguage = localStorage.getItem(LANGUAGE_PREFERENCE_KEY);
    const currentPathLang = getLanguageFromPath(location.pathname);

    // If there's a language in the URL, save it as preference
    if (currentPathLang !== DEFAULT_LANGUAGE) {
      localStorage.setItem(LANGUAGE_PREFERENCE_KEY, currentPathLang);
      return;
    }

    // If user has a saved preference and isn't on that language path, redirect
    if (savedLanguage && savedLanguage !== DEFAULT_LANGUAGE && currentPathLang === DEFAULT_LANGUAGE) {
      const newPath = getLocalizedPath(location.pathname, savedLanguage);
      navigate(newPath, { replace: true });
      return;
    }

    // First visit: detect browser language and redirect if not English
    if (!savedLanguage) {
      const browserLang = detectBrowserLanguage();
      localStorage.setItem(LANGUAGE_PREFERENCE_KEY, browserLang);
      
      if (browserLang !== DEFAULT_LANGUAGE) {
        const newPath = getLocalizedPath(location.pathname, browserLang);
        navigate(newPath, { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  return children;
};

export default LanguageRedirect;
