import React from 'react';
import SuburbAirportPage from './SuburbAirportTemplate';

const MountEdenAirportPage = () => {
  return (
    <SuburbAirportPage
      suburb="Mount Eden"
      suburbSlug="mount-eden"
      region="Central Auckland"
      distanceToAirport="16-18"
      driveTime="20-30"
      nearbySuburbs={[
        { name: "Epsom", slug: "epsom" },
        { name: "Sandringham", slug: "sandringham" },
        { name: "Kingsland", slug: "kingsland" },
        { name: "Newmarket", slug: "newmarket" },
        { name: "Grey Lynn", slug: "grey-lynn" }
      ]}
      highlights={[
        "Premium suburb service",
        "Direct motorway access to airport",
        "Flight monitoring standard",
        "Executive vehicles available",
        "Child seats on request"
      ]}
    />
  );
};

export default MountEdenAirportPage;