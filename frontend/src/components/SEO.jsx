import React from 'react';
import { Helmet } from 'react-helmet-async';

export const SEO = ({ 
  title, 
  description, 
  keywords,
  canonical,
  ogImage,
  ogType = 'website'
}) => {
  const siteName = "Book A Ride NZ";
  const defaultDescription = "Professional airport shuttle service in New Zealand. Reliable airport transfers for Auckland, Hamilton, and Whangarei airports. Book your private shuttle, cruise transfers, and Hobbiton tours today. 24/7 available, safe & insured.";
  const defaultKeywords = "airport, airport shuttle, airport shuttle service, shuttle service, Auckland shuttles, Auckland airport shuttle, Hamilton airport shuttle, Whangarei airport transfer, airport transfer, airport transportation, private shuttle, shuttle service Auckland, New Zealand shuttle, NZ airport shuttle, Hobbiton transfers, cruise transfers, cruise ship shuttle, bookaride, book a ride, airport pickup, airport drop off, reliable shuttle, professional shuttle service";
  const siteUrl = "https://bookaride.co.nz";
  const defaultImage = `${siteUrl}/logo.png`;

  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const metaDescription = description || defaultDescription;
  const metaKeywords = keywords || defaultKeywords;
  const canonicalUrl = canonical ? `${siteUrl}${canonical}` : siteUrl;
  const imageUrl = ogImage || defaultImage;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
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
    </Helmet>
  );
};

export default SEO;
