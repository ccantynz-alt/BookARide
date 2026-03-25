import React from 'react';
import { Helmet } from 'react-helmet-async';

// LocalBusiness schema has been consolidated into StructuredData.jsx
// Use <StructuredData /> from '../components/StructuredData' for LocalBusiness JSON-LD.

export const ServiceSchema = ({ serviceName, description, areaServed, priceRange }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Airport Transfer",
    "name": serviceName,
    "description": description,
    "provider": {
      "@type": "LocalBusiness",
      "name": "BookaRide NZ",
      "url": "https://bookaride.co.nz"
    },
    "areaServed": {
      "@type": "Place",
      "name": areaServed
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "NZD",
      "availability": "https://schema.org/InStock"
    },
    "termsOfService": "https://bookaride.co.nz/terms-and-conditions"
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export const FAQSchema = ({ faqs }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// ReviewSchema removed — contained duplicate LocalBusiness with fake aggregateRating.
// The authoritative LocalBusiness schema lives in StructuredData.jsx.

export const BreadcrumbSchema = ({ items }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url ? `https://bookaride.co.nz${item.url}` : undefined
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export const TransportServiceSchema = ({ route, price, duration }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TaxiService",
    "name": `BookaRide ${route.from} to ${route.to} Transfer`,
    "description": `Private airport transfer from ${route.from} to ${route.to}. Fixed price, flight tracking included.`,
    "provider": {
      "@type": "LocalBusiness",
      "name": "BookaRide NZ"
    },
    "areaServed": [
      { "@type": "Place", "name": route.from },
      { "@type": "Place", "name": route.to }
    ],
    "offers": {
      "@type": "Offer",
      "priceCurrency": "NZD",
      "price": price,
      "availability": "https://schema.org/InStock",
      "validFrom": new Date().toISOString()
    },
    "estimatedTravelTime": duration
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// Default export — LocalBusinessSchema was consolidated into StructuredData.jsx.
// Export the remaining schemas for backward compatibility.
export default { ServiceSchema, FAQSchema, BreadcrumbSchema, TransportServiceSchema };
