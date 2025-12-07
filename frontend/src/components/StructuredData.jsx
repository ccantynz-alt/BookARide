import React from 'react';
import { Helmet } from 'react-helmet-async';
import siteConfig from '../config/siteConfig';

const StructuredData = () => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": siteConfig.siteName,
    "image": `${siteConfig.siteUrl}/logo.png`,
    "url": siteConfig.siteUrl,
    "telephone": siteConfig.phone,
    "email": siteConfig.email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Auckland",
      "addressLocality": "Auckland",
      "addressRegion": "Auckland",
      "addressCountry": "NZ"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -36.8485,
      "longitude": 174.7633
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    },
    "priceRange": "$$",
    "description": siteConfig.description,
    "areaServed": [
      {
        "@type": "City",
        "name": "Auckland"
      },
      {
        "@type": "City",
        "name": "Hamilton"
      },
      {
        "@type": "City",
        "name": "Whangarei"
      }
    ],
    "serviceType": ["Airport Shuttle", "Airport Transfer", "Private Shuttle", "Cruise Transfer", "Hobbiton Transfer"]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
    </Helmet>
  );
};

export default StructuredData;
