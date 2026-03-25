import React from 'react';
import { Star, ExternalLink } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';

export const TestimonialsCarousel = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.3),transparent_50%)]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <AnimatedSection className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            What Our Customers Say
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
            We take pride in delivering a premium experience for every ride.
            See what real customers have to say about us.
          </p>
        </AnimatedSection>

        <div className="max-w-md mx-auto text-center">
          <div className="bg-white/10 backdrop-blur-md border border-gold/20 rounded-2xl p-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google"
                className="w-8 h-8"
                loading="lazy"
              />
              <span className="text-xl font-bold text-white">Google Reviews</span>
            </div>
            <div className="flex justify-center mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-6 h-6 text-gold fill-gold" />
              ))}
            </div>
            <p className="text-white/80 mb-6">
              Read verified reviews from our customers on Google.
            </p>
            <a
              href="https://www.google.com/search?q=book+a+ride+nz+auckland+reviews"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-3 rounded-lg transition-all duration-200 shadow-lg"
            >
              See Our Reviews on Google
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
