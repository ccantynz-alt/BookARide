import React from 'react';
import { Helmet } from '@vuer-ai/react-helmet-async';
import siteConfig from '../config/siteConfig';

const SuburbSchema = ({ suburb }) => {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Airport Shuttle Service",
    "provider": {
      "@type": "LocalBusiness",
      "name": siteConfig.siteName,
      "image": `${siteConfig.siteUrl}/logo.png`,
      "telephone": siteConfig.phone,
      "email": siteConfig.email,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Auckland",
        "addressRegion": "Auckland",
        "addressCountry": "NZ"
      }
    },
    "areaServed": {
      "@type": "City",
      "name": suburb.name,
      "containedInPlace": {
        "@type": "AdministrativeArea",
        "name": suburb.city || suburb.region || "Auckland"
      }
    },
    "description": `Professional airport shuttle service from ${suburb.name} to Auckland International Airport. Fixed pricing, 24/7 availability, professional drivers.`,
    "offers": {
      "@type": "Offer",
      "price": suburb.price,
      "priceCurrency": "NZD",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": "2025-12-31"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteConfig.siteUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Suburbs",
        "item": `${siteConfig.siteUrl}/suburbs`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": suburb.name,
        "item": `${siteConfig.siteUrl}/suburbs/${suburb.slug}`
      }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `How much does an airport shuttle from ${suburb.name} to Auckland Airport cost?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Airport shuttle pricing from ${suburb.name} to Auckland Airport is calculated based on the ${suburb.distance}km journey distance. Get an instant quote online - your exact price depends on your specific pickup location with transparent per-kilometer pricing.`
        }
      },
      {
        "@type": "Question",
        "name": `How far is ${suburb.name} from Auckland Airport?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${suburb.name} is approximately ${suburb.distance} kilometers from Auckland International Airport. The journey typically takes 30-50 minutes depending on traffic conditions.`
        }
      },
      {
        "@type": "Question",
        "name": `Do you provide 24/7 airport shuttle service from ${suburb.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Yes! We provide 24/7 airport shuttle service from ${suburb.name} to Auckland Airport. Whether you have an early morning flight or late night arrival, we're available around the clock.`
        }
      }
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(serviceSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>
    </Helmet>
  );
};

export default SuburbSchema;
