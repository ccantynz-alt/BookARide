import React from 'react';
import SuburbAirportPage from './SuburbAirportTemplate';

const RemueraAirportPage = () => {
  return (
    <SuburbAirportPage
      suburb="Remuera"
      suburbSlug="remuera"
      region="Auckland"
      distanceToAirport="17-20"
      driveTime="22-32"
      nearbySuburbs={[
        { name: "Epsom", slug: "epsom" },
        { name: "Newmarket", slug: "newmarket" },
        { name: "Mission Bay", slug: "mission-bay" },
        { name: "Meadowbank", slug: "meadowbank" },
        { name: "Ellerslie", slug: "ellerslie" }
      ]}
      highlights={[
        "Premium Eastern suburbs service",
        "Executive vehicle options",
        "Flight tracking included",
        "Reliable professional drivers",
        "Great minimum rates"
      ]}
    />
  );
};

export default RemueraAirportPage;