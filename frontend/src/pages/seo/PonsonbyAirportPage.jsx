import React from 'react';
import SuburbAirportPage from './SuburbAirportTemplate';

const PonsonbyAirportPage = () => {
  return (
    <SuburbAirportPage
      suburb="Ponsonby"
      suburbSlug="ponsonby"
      region="Auckland"
      distanceToAirport="19-22"
      driveTime="25-35"
      nearbySuburbs={[
        { name: "Grey Lynn", slug: "grey-lynn" },
        { name: "Freemans Bay", slug: "freemans-bay" },
        { name: "Herne Bay", slug: "herne-bay" },
        { name: "Auckland CBD", slug: "auckland-cbd" },
        { name: "Westmere", slug: "westmere" }
      ]}
      highlights={[
        "Trendy inner suburb service",
        "Close to CBD and ferries",
        "Professional presentation",
        "All flights monitored",
        "Great rates guaranteed"
      ]}
    />
  );
};

export default PonsonbyAirportPage;