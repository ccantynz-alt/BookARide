import React from 'react';
import SuburbAirportPage from './SuburbAirportTemplate';

const ParnellAirportPage = () => {
  return (
    <SuburbAirportPage
      suburb="Parnell"
      suburbSlug="parnell"
      region="Auckland"
      distanceToAirport="19-21"
      driveTime="25-35"
      nearbySuburbs={[
        { name: "Newmarket", slug: "newmarket" },
        { name: "Auckland CBD", slug: "auckland-cbd" },
        { name: "Remuera", slug: "remuera" },
        { name: "Grafton", slug: "grafton" },
        { name: "Mission Bay", slug: "mission-bay" }
      ]}
      highlights={[
        "Auckland's oldest suburb",
        "Close to CBD and waterfront",
        "Professional drivers",
        "All flights monitored",
        "Door-to-door service"
      ]}
    />
  );
};

export default ParnellAirportPage;