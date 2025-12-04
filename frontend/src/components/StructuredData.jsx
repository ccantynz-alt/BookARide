import React from 'react';
import { Helmet } from 'react-helmet-async';

const StructuredData = () => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Book A Ride NZ",
    "image": "https://bookaride.co.nz/logo.png",
    "url": "https://bookaride.co.nz",
    "telephone": "+64-21-123-4567",
    "email": "info@bookaride.co.nz",
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
    "description": "Professional airport shuttle service in New Zealand. Reliable airport transfers for Auckland, Hamilton, and Whangarei airports.",
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
