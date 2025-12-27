import React from 'react';
import SuburbAirportPage from './SuburbAirportTemplate';

const EpsomAirportPage = () => {
  return (
    <SuburbAirportPage
      suburb="Epsom"
      suburbSlug="epsom"
      region="Central Auckland"
      distanceToAirport="16-19"
      driveTime="20-30"
      nearbySuburbs={[
        { name: "Mount Eden", slug: "mount-eden" },
        { name: "Newmarket", slug: "newmarket" },
        { name: "Remuera", slug: "remuera" },
        { name: "Greenlane", slug: "greenlane" },
        { name: "One Tree Hill", slug: "one-tree-hill" }
      ]}
      highlights={[
        "Premium suburb airport service",
        "Direct Southern Motorway access",
        "Flight tracking included",
        "Executive vehicles available",
        "Professional presentation"
      ]}
    />
  );
};

export default EpsomAirportPage;