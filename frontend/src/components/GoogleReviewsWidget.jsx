import React, { useState, useEffect } from 'react';
import { Star, Quote, ExternalLink, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API } from '../config/api';

// No fallback reviews — only show real reviews from the API.
// If the API fails, the widget shows a link to Google Reviews instead.

const GoogleReviewsWidget = ({ compact = false }) => {
  const [reviewsData, setReviewsData] = useState({
    rating: null,
    totalReviews: null,
    reviews: [],
    isLoading: true,
    isFallback: false
  });

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(`${API}/google-reviews`);
        if (response.data && response.data.reviews && response.data.reviews.length > 0) {
          setReviewsData({
            rating: response.data.rating,
            totalReviews: response.data.totalReviews,
            reviews: response.data.reviews,
            isLoading: false,
            isFallback: response.data.isFallback || false
          });
        } else {
          setReviewsData(prev => ({
            ...prev,
            isLoading: false,
            isFallback: true
          }));
        }
      } catch (error) {
        console.error('Error fetching Google reviews:', error);
        setReviewsData(prev => ({
          ...prev,
          isLoading: false,
          isFallback: true
        }));
      }
    };

    fetchReviews();
  }, []);

  const { rating, totalReviews, reviews, isLoading } = reviewsData;

  // When no real review data is available, show a simple Google Reviews link
  if (!isLoading && (reviewsData.isFallback || reviews.length === 0)) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-8 h-8" />
          <span className="text-xl font-bold text-gray-900">Google Reviews</span>
        </div>
        <div className="flex justify-center mb-4">
          {[1,2,3,4,5].map(i => (
            <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <p className="text-gray-600 mb-4">Read verified reviews from our customers on Google.</p>
        <a
          href="https://www.google.com/search?q=book+a+ride+nz+auckland+reviews"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gold hover:bg-gold/90 text-black font-semibold px-6 py-2 rounded-lg transition-all duration-200"
        >
          See Our Reviews on Google <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
        <div className="flex items-center gap-1">
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          {rating && <span className="font-bold text-gray-900">{rating}</span>}
          <div className="flex">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className={`w-4 h-4 ${rating && i <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
            ))}
          </div>
        </div>
        {totalReviews && <span className="text-sm text-gray-500">({totalReviews} reviews)</span>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100" data-testid="google-reviews-widget">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-8 h-8" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">{rating}</span>
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={`w-5 h-5 ${i <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-500">{totalReviews} Google Reviews</p>
          </div>
        </div>
        <a 
          href="https://www.google.com/search?q=book+a+ride+nz+auckland+reviews" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          data-testid="view-all-reviews-link"
        >
          View all <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="ml-2 text-gray-500">Loading reviews...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.slice(0, 3).map((review, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-gray-50 rounded-xl p-4"
              data-testid={`review-${idx}`}
            >
              <div className="flex items-start gap-3">
                {review.profilePhoto ? (
                  <img 
                    src={review.profilePhoto} 
                    alt={review.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center text-black font-bold flex-shrink-0">
                    {review.avatar}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">{review.name}</span>
                    <span className="text-xs text-gray-400">{review.date}</span>
                  </div>
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">{review.text}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Trust Badge */}
      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-500">
          Reviews sourced from Google
        </p>
      </div>
    </div>
  );
};

export default GoogleReviewsWidget;
