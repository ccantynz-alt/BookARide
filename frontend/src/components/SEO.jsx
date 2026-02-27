import React from 'react';
import { Helmet } from '@vuer-ai/react-helmet-async';
import { useLocation } from 'react-router-dom';
import { getSiteConfig } from '../config/siteConfig';

// Supported languages for hreflang tags
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', hreflang: 'en-NZ' },
  { code: 'zh', name: '中文', hreflang: 'zh' },
  { code: 'ja', name: '日本語', hreflang: 'ja' },
  { code: 'ko', name: '한국어', hreflang: 'ko' },
  { code: 'fr', name: 'Français', hreflang: 'fr' },
  { code: 'hi', name: 'हिन्दी', hreflang: 'hi' }
];

// Helper: Remove language prefix from path (e.g., /zh/services -> /services)
const getPathWithoutLang = (pathname) => {
  const langCodes = SUPPORTED_LANGUAGES.map(l => l.code);
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length > 0 && langCodes.includes(parts[0])) {
    return '/' + parts.slice(1).join('/') || '/';
  }
  return pathname;
};

// Helper: Add language prefix to path (e.g., /services -> /zh/services)
const getLocalizedPath = (path, langCode) => {
  if (langCode === 'en') return path; // English is the default, no prefix
  const cleanPath = path === '/' ? '' : path;
  return `/${langCode}${cleanPath}`;
};

const siteConfig = getSiteConfig();

export const SEO = ({ 
  title, 
  description, 
  keywords,
  canonical,
  ogImage,
  ogType = 'website',
  currentLang = 'en'
}) => {
  const location = useLocation();
  const siteName = siteConfig.siteName;
  const defaultDescription = siteConfig.description;
  const defaultKeywords = siteConfig.keywords;
  const siteUrl = siteConfig.siteUrl;
  const defaultImage = `${siteUrl}/logo.png`;

  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const metaDescription = description || defaultDescription;
  const metaKeywords = keywords || defaultKeywords;
  
  // Get the clean path without language prefix for canonical and hreflang
  const cleanPath = canonical || getPathWithoutLang(location.pathname);
  const canonicalUrl = `${siteUrl}${cleanPath === '/' ? '' : cleanPath}`;
  const imageUrl = ogImage || defaultImage;

  // Generate hreflang URLs for all supported languages
  const generateHreflangUrls = () => {
    return SUPPORTED_LANGUAGES.map(lang => ({
      lang: lang.hreflang,
      url: `${siteUrl}${getLocalizedPath(cleanPath, lang.code)}`
    }));
  };

  const hreflangUrls = generateHreflangUrls();

  // Get language name for meta tag
  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === currentLang);
  const languageName = currentLanguage ? currentLanguage.name : 'English';

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <html lang={currentLang} />
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Hreflang Tags for International SEO */}
      {hreflangUrls.map(({ lang, url }) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}
      {/* x-default for language selector page */}
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={currentLang === 'en' ? 'en_NZ' : `${currentLang}_${currentLang.toUpperCase()}`} />
      
      {/* Alternate locales for Open Graph */}
      {SUPPORTED_LANGUAGES.filter(l => l.code !== currentLang).map(lang => (
        <meta key={lang.code} property="og:locale:alternate" content={lang.code === 'en' ? 'en_NZ' : `${lang.code}_${lang.code.toUpperCase()}`} />
      ))}

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={metaDescription} />
      <meta property="twitter:image" content={imageUrl} />

      {/* Additional SEO Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content={languageName} />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="Book A Ride NZ" />
      
      {/* Geo Tags for Local SEO */}
      <meta name="geo.region" content="NZ" />
      <meta name="geo.placename" content="Auckland" />
      <meta name="geo.position" content="-36.8485;174.7633" />
      <meta name="ICBM" content="-36.8485, 174.7633" />

      {/* Content Language */}
      <meta httpEquiv="content-language" content={currentLang} />
    </Helmet>
  );
};

export default SEO;
