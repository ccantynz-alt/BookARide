import React from 'react';
import SuburbAirportPage from './SuburbAirportTemplate';

const NewmarketAirportPage = () => {
  return (
    <SuburbAirportPage
      suburb="Newmarket"
      suburbSlug="newmarket"
      region="Auckland"
      distanceToAirport="18-20"
      driveTime="22-32"
      nearbySuburbs={[
        { name: "Epsom", slug: "epsom" },
        { name: "Remuera", slug: "remuera" },
        { name: "Parnell", slug: "parnell" },
        { name: "Grafton", slug: "grafton" },
        { name: "Auckland CBD", slug: "auckland-cbd" }
      ]}
      highlights={[
        "Central business district access",
        "Quick motorway connection",
        "Flight monitoring service",
        "Business traveler friendly",
        "Great rates for airport transfers"
      ]}
    />
  );
};

export default NewmarketAirportPage;