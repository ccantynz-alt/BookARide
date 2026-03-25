import React from 'react';
import { Helmet } from 'react-helmet-async';

// LocalBusiness schema has been consolidated into StructuredData.jsx
// Use <StructuredData /> from '../components/StructuredData' for LocalBusiness JSON-LD.

// Service Schema Component
export const ServiceSchema = ({ service }) => {
  const defaultService = {
    name: "Airport Shuttle Service",
    description: "Private door-to-door airport transfer service in Auckland",
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
      "availability": "https://schema.org/InStock",
      "priceSpecification": {
        "@type": "PriceSpecification",
        "priceCurrency": "NZD"
      }
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

// ReviewSchema removed — only add review schema when connected to real, verified review data.

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
// Note: LocalBusiness schema is handled by StructuredData.jsx (rendered separately)
export const HomePageSchema = () => {
  return (
    <>
      <WebSiteSchema />
      <ServiceSchema 
        service={{
          name: "Auckland Airport Private Shuttle",
          description: "Premium door-to-door airport transfer service. Private vehicle, no sharing with strangers. Flight tracking, child seats available, 24/7 service.",
          areaServed: "Auckland Region",
          serviceType: "Airport Transfer Service"
        }}
      />
      <FAQSchema 
        faqs={[
          {
            question: "How much is a shuttle from Auckland Airport?",
            answer: "BookaRide offers fixed-price airport transfers with no surge pricing. Get an instant quote online - prices vary by distance and are locked in at booking. Flight tracking included."
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
  ServiceSchema,
  FAQSchema,
  BreadcrumbSchema,
  TransportationSchema,
  WebSiteSchema,
  HomePageSchema
};
