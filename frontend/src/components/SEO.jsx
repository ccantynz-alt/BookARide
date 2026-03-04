import React from 'react';
import { Helmet } from '@vuer-ai/react-helmet-async';
import { useLocation } from 'react-router-dom';
import siteConfig from '../config/siteConfig';

export const SEO = ({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogType = 'website',
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

  const cleanPath = canonical || location.pathname;
  const canonicalUrl = `${siteUrl}${cleanPath === '/' ? '' : cleanPath}`;
  const imageUrl = ogImage || defaultImage;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <html lang="en" />
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_NZ" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={metaDescription} />
      <meta property="twitter:image" content={imageUrl} />

      {/* Additional SEO Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="Book A Ride NZ" />

      {/* Geo Tags for Local SEO */}
      <meta name="geo.region" content="NZ" />
      <meta name="geo.placename" content="Auckland" />
      <meta name="geo.position" content="-36.8485;174.7633" />
      <meta name="ICBM" content="-36.8485, 174.7633" />

      {/* Content Language */}
      <meta httpEquiv="content-language" content="en" />
    </Helmet>
  );
};

export default SEO;
