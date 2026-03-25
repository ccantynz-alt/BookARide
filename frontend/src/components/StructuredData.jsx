import React from 'react';
import { Helmet } from 'react-helmet-async';
import siteConfig from '../config/siteConfig';

// Single authoritative LocalBusiness schema for the entire site.
// Do NOT add LocalBusiness JSON-LD in any other component.
const StructuredData = () => {
  // Only include sameAs if social links actually exist
  const sameAs = [siteConfig.facebook, siteConfig.instagram, siteConfig.twitter].filter(Boolean);

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://bookaride.co.nz/#organization",
    "name": "BookARide NZ",
    "alternateName": "Book A Ride NZ",
    "description": siteConfig.description,
    "url": siteConfig.siteUrl,
    "email": siteConfig.email,
    "image": `${siteConfig.siteUrl}/logo.png`,
    "logo": `${siteConfig.siteUrl}/logo.png`,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Auckland CBD",
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
    "currenciesAccepted": "NZD",
    "paymentAccepted": "Credit Card, Debit Card, Online Payment",
    "areaServed": [
      { "@type": "City", "name": "Auckland" },
      { "@type": "City", "name": "Hamilton" },
      { "@type": "City", "name": "Whangarei" },
      { "@type": "Place", "name": "Auckland Airport" },
      { "@type": "Place", "name": "North Shore" },
      { "@type": "Place", "name": "Hibiscus Coast" }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Airport Transfer Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Private Airport Transfer",
            "description": "Door-to-door private transfer to Auckland Airport"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Cruise Terminal Transfers",
            "description": "Transfer from Auckland Cruise Terminal"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Hobbiton Transfers",
            "description": "Private transfer to Hobbiton Movie Set in Matamata"
          }
        }
      ]
    },
    ...(sameAs.length > 0 ? { sameAs } : {})
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
