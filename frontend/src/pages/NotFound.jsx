import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const NotFound = () => {
  return (
    <>
      <Helmet>
        <title>Page Not Found | BookARide NZ</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-lg">
          <h1 className="text-7xl font-bold text-[#C8A962] mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
          <p className="text-gray-600 text-lg mb-8">
            Sorry, the page you are looking for does not exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-block px-8 py-3 bg-[#C8A962] text-white font-semibold rounded-lg hover:bg-[#b89952] transition-colors"
            >
              Go Home
            </Link>
            <Link
              to="/book-now"
              className="inline-block px-8 py-3 border-2 border-[#C8A962] text-[#C8A962] font-semibold rounded-lg hover:bg-[#C8A962] hover:text-white transition-colors"
            >
              Book a Ride
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
