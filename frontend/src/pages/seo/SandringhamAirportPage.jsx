import React from 'react';
import SuburbAirportPage from './SuburbAirportTemplate';

const SandringhamAirportPage = () => {
  return (
    <SuburbAirportPage
      suburb="Sandringham"
      suburbSlug="sandringham"
      region="Central Auckland"
      distanceToAirport="14-17"
      driveTime="18-28"
      nearbySuburbs={[
        { name: "Mount Roskill", slug: "mount-roskill" },
        { name: "Mount Eden", slug: "mount-eden" },
        { name: "Kingsland", slug: "kingsland" },
        { name: "Mount Albert", slug: "mount-albert" },
        { name: "Balmoral", slug: "balmoral" }
      ]}
      highlights={[
        "Convenient Central Auckland location",
        "Direct routes to airport",
        "Flight monitoring included",
        "Professional, friendly drivers",
        "Early morning and late night service"
      ]}
    />
  );
};

export default SandringhamAirportPage;