import React from 'react';
import { Helmet } from 'react-helmet-async';

// Advanced Schema Markup for SEO dominance
export const LocalBusinessSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://bookaride.co.nz/#organization",
    "name": "BookaRide NZ - Auckland Airport Transfers",
    "alternateName": ["Book A Ride NZ", "BookaRide Auckland", "Auckland Airport Shuttle"],
    "description": "Auckland's premium airport transfer service. Private door-to-door shuttles from all Auckland suburbs to Auckland Airport. Fixed prices, flight tracking, professional drivers.",
    "url": "https://bookaride.co.nz",
    "telephone": "+64-9-XXX-XXXX",
    "email": "bookings@bookerride.co.nz",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Auckland",
      "addressLocality": "Auckland",
      "addressRegion": "Auckland",
      "postalCode": "0600",
      "addressCountry": "NZ"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -36.8485,
      "longitude": 174.7633
    },
    "areaServed": [
      { "@type": "City", "name": "Auckland" },
      { "@type": "Place", "name": "Auckland Airport" },
      { "@type": "Place", "name": "North Shore" },
      { "@type": "Place", "name": "Hibiscus Coast" },
      { "@type": "Place", "name": "Auckland CBD" }
    ],
    "priceRange": "$$",
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "00:00",
      "closes": "23:59"
    },
    "sameAs": [
      "https://www.facebook.com/bookaridenz",
      "https://www.instagram.com/bookaridenz"
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
            "name": "Cruise Ship Transfer",
            "description": "Transfer from Auckland Cruise Terminal"
          }
        }
      ]
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

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

export const ReviewSchema = ({ reviews, aggregateRating }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "BookaRide NZ",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": aggregateRating?.value || "4.9",
      "reviewCount": aggregateRating?.count || "500",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": reviews?.slice(0, 5).map(review => ({
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating,
        "bestRating": "5"
      },
      "author": {
        "@type": "Person",
        "name": review.author
      },
      "reviewBody": review.text
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

export default LocalBusinessSchema;
