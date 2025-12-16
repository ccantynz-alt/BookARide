import React from 'react';
import { Helmet } from 'react-helmet-async';

// LocalBusiness Schema for BookaRide
export const LocalBusinessSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://bookaride.co.nz/#organization",
    "name": "BookaRide NZ",
    "alternateName": "Book A Ride New Zealand",
    "description": "Premium private airport shuttle service in Auckland and Hamilton, New Zealand. Door-to-door transfers, flight tracking, 24/7 availability.",
    "url": "https://bookaride.co.nz",
    "email": "info@bookaride.co.nz",
    "logo": "https://bookaride.co.nz/bookaride-logo.png",
    "image": "https://bookaride.co.nz/bookaride-logo.png",
    "priceRange": "$$",
    "currenciesAccepted": "NZD",
    "paymentAccepted": "Credit Card, Debit Card, Online Payment",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Auckland",
      "addressLocality": "Auckland",
      "addressRegion": "Auckland",
      "postalCode": "0632",
      "addressCountry": "NZ"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "-36.8485",
      "longitude": "174.7633"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "00:00",
        "closes": "23:59"
      }
    ],
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
            "name": "Auckland Airport Shuttle"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Hamilton Airport Transfers"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Cruise Terminal Transfers"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Hobbiton Transfers"
          }
        }
      ]
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "287",
      "bestRating": "5",
      "worstRating": "1"
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

// Service Schema Component
export const ServiceSchema = ({ service }) => {
  const defaultService = {
    name: "Airport Shuttle Service",
    description: "Private door-to-door airport transfer service in Auckland",
    priceFrom: 55,
    areaServed: "Auckland",
    serviceType: "Airport Transfer"
  };

  const s = { ...defaultService, ...service };

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": s.name,
    "description": s.description,
    "provider": {
      "@type": "LocalBusiness",
      "name": "BookaRide NZ"
    },
    "serviceType": s.serviceType,
    "areaServed": {
      "@type": "City",
      "name": s.areaServed
    },
    "offers": {
      "@type": "Offer",
      "priceSpecification": {
        "@type": "PriceSpecification",
        "price": s.priceFrom,
        "priceCurrency": "NZD",
        "minPrice": s.priceFrom
      },
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

// FAQ Schema Component
export const FAQSchema = ({ faqs }) => {
  if (!faqs || faqs.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question || faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer || faq.a
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

// Breadcrumb Schema Component
export const BreadcrumbSchema = ({ items }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `https://bookaride.co.nz${item.path}`
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

// Transportation Service Schema (for routes)
export const TransportationSchema = ({ route }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TaxiService",
    "name": `BookaRide - ${route.from} to ${route.to} Transfer`,
    "description": route.description || `Private shuttle service from ${route.from} to ${route.to}`,
    "provider": {
      "@type": "LocalBusiness",
      "name": "BookaRide NZ",
      "url": "https://bookaride.co.nz"
    },
    "areaServed": [
      {
        "@type": "City",
        "name": route.from
      },
      {
        "@type": "City",
        "name": route.to
      }
    ],
    "offers": {
      "@type": "Offer",
      "price": route.price,
      "priceCurrency": "NZD",
      "availability": "https://schema.org/InStock"
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

// Review Schema Component
export const ReviewSchema = ({ reviews }) => {
  if (!reviews || reviews.length === 0) return null;

  const schema = reviews.map(review => ({
    "@context": "https://schema.org",
    "@type": "Review",
    "author": {
      "@type": "Person",
      "name": review.author
    },
    "datePublished": review.date,
    "reviewBody": review.text,
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.rating,
      "bestRating": "5",
      "worstRating": "1"
    },
    "itemReviewed": {
      "@type": "LocalBusiness",
      "name": "BookaRide NZ"
    }
  }));

  return (
    <Helmet>
      {schema.map((s, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
};

// WebSite Schema for search box
export const WebSiteSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "BookaRide NZ",
    "url": "https://bookaride.co.nz",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://bookaride.co.nz/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
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

// Combined Schema Component for Home Page
export const HomePageSchema = () => {
  return (
    <>
      <LocalBusinessSchema />
      <WebSiteSchema />
      <ServiceSchema 
        service={{
          name: "Auckland Airport Private Shuttle",
          description: "Premium door-to-door airport transfer service. Private vehicle, no sharing with strangers. Flight tracking, child seats available, 24/7 service.",
          priceFrom: 55,
          areaServed: "Auckland Region",
          serviceType: "Airport Transfer Service"
        }}
      />
      <FAQSchema 
        faqs={[
          {
            question: "How much is a shuttle from Auckland Airport?",
            answer: "Auckland Airport shuttle prices start from $55 for Auckland CBD, $65 for North Shore suburbs, and $85 for Hibiscus Coast areas. Prices are fixed and include flight tracking."
          },
          {
            question: "Do you offer door-to-door airport transfers?",
            answer: "Yes! BookaRide provides private door-to-door transfers. Unlike shared shuttles, you won't stop at other addresses - we take you directly to your destination."
          },
          {
            question: "Can I book an airport shuttle for early morning flights?",
            answer: "Absolutely! We operate 24/7 and specialize in early morning pickups (3am onwards). We track your flight so there's no stress about delays."
          },
          {
            question: "Do you provide child seats for airport transfers?",
            answer: "Yes, child seats and baby capsules are available on request at no extra charge. Just mention it when booking."
          }
        ]}
      />
    </>
  );
};

export default {
  LocalBusinessSchema,
  ServiceSchema,
  FAQSchema,
  BreadcrumbSchema,
  TransportationSchema,
  ReviewSchema,
  WebSiteSchema,
  HomePageSchema
};
