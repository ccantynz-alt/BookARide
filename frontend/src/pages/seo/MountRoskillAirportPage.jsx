import React from 'react';
import SuburbAirportPage from './SuburbAirportTemplate';

const MountRoskillAirportPage = () => {
  return (
    <SuburbAirportPage
      suburb="Mount Roskill"
      suburbSlug="mount-roskill"
      region="Central Auckland"
      distanceToAirport="12-15"
      driveTime="15-25"
      nearbySuburbs={[
        { name: "Three Kings", slug: "three-kings" },
        { name: "Sandringham", slug: "sandringham" },
        { name: "Mount Albert", slug: "mount-albert" },
        { name: "Hillsborough", slug: "hillsborough" },
        { name: "Lynfield", slug: "lynfield" }
      ]}
      highlights={[
        "Just 15-25 minutes to Auckland Airport",
        "Professional local drivers",
        "Flight monitoring - we track delays",
        "Child seats available on request",
        "24/7 service including early mornings"
      ]}
    />
  );
};

export default MountRoskillAirportPage;