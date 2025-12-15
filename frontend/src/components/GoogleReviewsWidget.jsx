import React from 'react';
import { Star, Quote, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const reviews = [
  {
    name: "Sarah M.",
    rating: 5,
    date: "2 weeks ago",
    text: "Fantastic service! Driver was on time, car was spotless, and the price was exactly as quoted. Will definitely use again for my next airport trip.",
    avatar: "S"
  },
  {
    name: "David T.",
    rating: 5,
    date: "1 month ago",
    text: "Used BookaRide for our family trip to the airport. The driver helped with all our luggage and the kids loved the ride. Much better than Uber!",
    avatar: "D"
  },
  {
    name: "Michelle K.",
    rating: 5,
    date: "3 weeks ago",
    text: "Best airport transfer in Auckland! Fixed pricing means no surprises. Driver tracked my flight and was waiting when I landed. Highly recommend!",
    avatar: "M"
  },
  {
    name: "James W.",
    rating: 5,
    date: "1 week ago",
    text: "Professional, punctual, and great value. The online booking was easy and I got my price instantly. No more guessing with taxi meters!",
    avatar: "J"
  },
  {
    name: "Emma L.",
    rating: 5,
    date: "2 months ago",
    text: "Absolutely brilliant service from Hibiscus Coast to the airport. Driver was friendly and the car was immaculate. Will be using again!",
    avatar: "E"
  }
];

const GoogleReviewsWidget = ({ compact = false }) => {
  const averageRating = 4.9;
  const totalReviews = 127;

  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
        <div className="flex items-center gap-1">
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          <span className="font-bold text-gray-900">{averageRating}</span>
          <div className="flex">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        </div>
        <span className="text-sm text-gray-500">({totalReviews} reviews)</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-8 h-8" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">{averageRating}</span>
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-500">{totalReviews} Google Reviews</p>
          </div>
        </div>
        <a 
          href="https://www.google.com/search?q=bookaride+auckland+reviews" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          View all <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Reviews Carousel */}
      <div className="space-y-4">
        {reviews.slice(0, 3).map((review, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-gray-50 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center text-black font-bold flex-shrink-0">
                {review.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900">{review.name}</span>
                  <span className="text-xs text-gray-400">{review.date}</span>
                </div>
                <div className="flex mb-2">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{review.text}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trust Badge */}
      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-500">
          ⭐ Rated excellent by {totalReviews}+ happy customers
        </p>
      </div>
    </div>
  );
};

export default GoogleReviewsWidget;
