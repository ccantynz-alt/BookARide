import React from 'react';
import SuburbAirportPage from './SuburbAirportTemplate';

const MountAlbertAirportPage = () => {
  return (
    <SuburbAirportPage
      suburb="Mount Albert"
      suburbSlug="mount-albert"
      region="Central Auckland"
      distanceToAirport="15-18"
      driveTime="20-30"
      nearbySuburbs={[
        { name: "Mount Roskill", slug: "mount-roskill" },
        { name: "Sandringham", slug: "sandringham" },
        { name: "Point Chevalier", slug: "point-chevalier" },
        { name: "Waterview", slug: "waterview" },
        { name: "Owairaka", slug: "owairaka" }
      ]}
      highlights={[
        "Central location, easy airport access",
        "Professional reliable drivers",
        "All flight times monitored",
        "Family-friendly service",
        "Great rates for airport drop-offs"
      ]}
    />
  );
};

export default MountAlbertAirportPage;