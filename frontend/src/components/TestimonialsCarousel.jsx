import React from 'react';
import Slider from 'react-slick';
import { Card, CardContent } from './ui/card';
import { Star, Quote } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';
import '../styles/slick.css';
import '../styles/slick-theme.css';

export const TestimonialsCarousel = () => {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Business Traveler',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
      rating: 5,
      text: 'Excellent service! The driver was punctual, professional, and the vehicle was spotless. Will definitely use again for my business trips.'
    },
    {
      name: 'Michael Chen',
      role: 'Tourist',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
      rating: 5,
      text: 'Best airport shuttle in Auckland! Great value for money and the booking process was so easy. Highly recommend to anyone visiting.'
    },
    {
      name: 'Emma Williams',
      role: 'Family Vacation',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80',
      rating: 5,
      text: 'Perfect for our family trip! The driver was so friendly with our kids and helped with all our luggage. Five stars!'
    },
    {
      name: 'David Brown',
      role: 'Corporate Client',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
      rating: 5,
      text: 'We use BookaRide for all our corporate transfers. Reliable, professional, and always on time. Couldn\'t ask for better service.'
    },
    {
      name: 'Lisa Taylor',
      role: 'Regular Customer',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80',
      rating: 5,
      text: 'I\'ve been using this service for over a year now. Never disappointed! The drivers are wonderful and the prices are unbeatable.'
    }
  ];

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true,
    adaptiveHeight: true,
    responsive: [
      {
        breakpoint: 1280, // Large tablets & small laptops
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 1024, // iPad Pro landscape
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 820, // iPad Air, iPad Pro portrait
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
        }
      },
      {
        breakpoint: 768, // iPad Mini
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
        }
      },
      {
        breakpoint: 640, // Mobile
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
        }
      }
    ]
  };

  return (
    <section className="py-24 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.3),transparent_50%)]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" data-aos="fade-up">
            What Our Customers Say
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="100">
            Don't just take our word for it - hear from our satisfied customers
          </p>
        </AnimatedSection>

        <div className="max-w-6xl mx-auto px-4 md:px-0">
          <Slider {...settings}>
            {testimonials.map((testimonial, index) => (
              <div key={index} className="px-2 md:px-4 py-4">
                <Card className="bg-white/10 backdrop-blur-md border border-gold/20 hover:border-gold/40 transition-all duration-300 hover:shadow-xl hover:shadow-gold/20 h-full min-h-[300px] flex flex-col">
                  <CardContent className="p-6 md:p-8 flex flex-col h-full">
                    <Quote className="w-8 h-8 md:w-10 md:h-10 text-gold mb-4 opacity-50 flex-shrink-0" />
                    <div className="flex mb-4 flex-shrink-0">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-gold fill-gold" />
                      ))}
                    </div>
                    <p className="text-white/90 mb-6 leading-relaxed italic text-sm md:text-base flex-grow">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center mt-auto flex-shrink-0">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full mr-4 border-2 border-gold/30 object-cover"
                        loading="lazy"
                      />
                      <div>
                        <p className="font-semibold text-white text-sm md:text-base">{testimonial.name}</p>
                        <p className="text-xs md:text-sm text-white/60">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
};