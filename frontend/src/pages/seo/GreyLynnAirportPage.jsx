import React from 'react';
import SuburbAirportPage from './SuburbAirportTemplate';

const GreyLynnAirportPage = () => {
  return (
    <SuburbAirportPage
      suburb="Grey Lynn"
      suburbSlug="grey-lynn"
      region="Auckland"
      distanceToAirport="18-21"
      driveTime="22-35"
      nearbySuburbs={[
        { name: "Ponsonby", slug: "ponsonby" },
        { name: "Westmere", slug: "westmere" },
        { name: "Mount Eden", slug: "mount-eden" },
        { name: "Kingsland", slug: "kingsland" },
        { name: "Auckland CBD", slug: "auckland-cbd" }
      ]}
      highlights={[
        "Inner city suburb service",
        "Quick Northwestern access",
        "Flight monitoring standard",
        "Professional drivers",
        "24/7 availability"
      ]}
    />
  );
};

export default GreyLynnAirportPage;