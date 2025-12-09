import React from 'react';
import Slider from 'react-slick';
import { Card } from './ui/card';
import { AnimatedSection } from './AnimatedSection';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Car, Users, Luggage } from 'lucide-react';

export const VehicleGallery = () => {
  const vehicles = [
    {
      name: 'Toyota Hiace - Day Service',
      image: 'https://customer-assets.emergentagent.com/job_bookmyride-nz/artifacts/6fpsudnh_IMG_0158%20%281%29.jpeg',
      capacity: '11 passengers',
      luggage: '12+ bags',
      description: 'Premium daytime transfers',
      badge: 'MOST POPULAR'
    },
    {
      name: 'Toyota Hiace - Night Service',
      image: 'https://customer-assets.emergentagent.com/job_bookmyride-nz/artifacts/6fpsudnh_IMG_0158%20%281%29.jpeg',
      capacity: '11 passengers',
      luggage: '12+ bags',
      description: 'Late night & early morning pickups',
      badge: '24/7 AVAILABLE',
      isNight: true
    },
    {
      name: 'Toyota Hiace - Airport Express',
      image: 'https://customer-assets.emergentagent.com/job_bookmyride-nz/artifacts/6fpsudnh_IMG_0158%20%281%29.jpeg',
      capacity: '11 passengers',
      luggage: '12+ bags',
      description: 'Flight-tracked service',
      badge: 'AIRPORT SPECIAL'
    }
  ];

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
        }
      }
    ]
  };

  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4" data-aos="fade-up">
            Our Fleet
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6" data-aos="fade-up" data-aos-delay="100">
            Modern, well-maintained Toyota Hiace vehicles - 24/7 service available
          </p>
          
          {/* MULTIPLE VANS BANNER */}
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-gold to-yellow-500 rounded-full px-8 py-4 shadow-xl" data-aos="fade-up" data-aos-delay="200">
            <Users className="w-6 h-6 text-black" strokeWidth={2.5} />
            <span className="text-black font-black text-lg">BIG GROUP? Book Multiple Vans!</span>
            <span className="bg-black text-gold px-3 py-1 rounded-full text-sm font-bold">22+ PASSENGERS</span>
          </div>
        </AnimatedSection>

        <div className="max-w-6xl mx-auto mb-12">
          <Slider {...settings}>
            {vehicles.map((vehicle, index) => (
              <div key={index} className="px-4">
                <Card className="overflow-hidden hover-lift transition-all-smooth border-2 border-gray-200 hover:border-gold">
                  <div className="relative h-64 overflow-hidden">
                    {/* Nighttime sky background for night service */}
                    {vehicle.isNight && (
                      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-blue-900 to-black">
                        {/* Stars */}
                        <div className="absolute top-4 left-10 w-1 h-1 bg-white rounded-full animate-pulse" />
                        <div className="absolute top-8 left-32 w-1 h-1 bg-white rounded-full" />
                        <div className="absolute top-6 right-20 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                        <div className="absolute top-12 right-40 w-1 h-1 bg-white rounded-full" />
                        <div className="absolute top-16 left-1/3 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                      </div>
                    )}
                    
                    <img
                      src={vehicle.image}
                      alt={vehicle.name}
                      className={`w-full h-full object-cover transition-transform duration-500 hover:scale-110 ${vehicle.isNight ? 'relative z-10' : ''}`}
                      style={vehicle.isNight ? { 
                        filter: 'brightness(0.4) contrast(1.3)',
                        mixBlendMode: 'lighten'
                      } : {}}
                    />
                    
                    {!vehicle.isNight && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    )}
                    
                    {/* Badge */}
                    {vehicle.badge && (
                      <div className="absolute top-4 right-4 bg-gold px-4 py-2 rounded-full shadow-lg z-20">
                        <span className="text-black font-bold text-xs">{vehicle.badge}</span>
                      </div>
                    )}
                    
                    {/* Flashing blinker lights for night service */}
                    {vehicle.isNight && (
                      <>
                        {/* Front left blinker */}
                        <div className="absolute left-[15%] top-[45%] w-3 h-3 bg-orange-400 rounded-full animate-pulse shadow-2xl z-20" 
                             style={{ 
                               boxShadow: '0 0 20px 8px rgba(251, 146, 60, 0.8)',
                               animationDuration: '1s'
                             }} />
                        
                        {/* Front right blinker */}
                        <div className="absolute right-[15%] top-[45%] w-3 h-3 bg-orange-400 rounded-full animate-pulse shadow-2xl z-20" 
                             style={{ 
                               boxShadow: '0 0 20px 8px rgba(251, 146, 60, 0.8)',
                               animationDuration: '1s'
                             }} />
                        
                        {/* Headlights glow */}
                        <div className="absolute left-[12%] top-[48%] w-24 h-16 bg-yellow-200/20 rounded-full blur-2xl z-10" />
                        <div className="absolute right-[12%] top-[48%] w-24 h-16 bg-yellow-200/20 rounded-full blur-2xl z-10" />
                      </>
                    )}
                    
                    <div className="absolute bottom-4 left-4 text-white z-20">
                      <h3 className="text-2xl font-bold mb-1">{vehicle.name}</h3>
                      <p className="text-sm text-white/90 font-semibold">{vehicle.description}</p>
                    </div>
                  </div>
                  <div className="p-6 bg-white">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center text-gray-700">
                        <Users className="w-5 h-5 text-gold mr-2" />
                        <span className="text-sm font-semibold">{vehicle.capacity}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Luggage className="w-5 h-5 text-gold mr-2" />
                        <span className="text-sm font-semibold">{vehicle.luggage}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </Slider>
        </div>

        {/* LARGE GROUP INFO BOX */}
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 text-white shadow-2xl border-2 border-gold">
          <div className="text-center mb-6">
            <h3 className="text-3xl font-black mb-3">Need More Than 11 Passengers?</h3>
            <p className="text-xl text-white/90">We've Got You Covered!</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <div className="text-4xl font-black text-gold mb-2">22</div>
              <div className="text-sm text-white/80">2 Vans Available</div>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <div className="text-4xl font-black text-gold mb-2">33</div>
              <div className="text-sm text-white/80">3 Vans Available</div>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <div className="text-4xl font-black text-gold mb-2">44+</div>
              <div className="text-sm text-white/80">4+ Vans Available</div>
            </div>
          </div>
          <p className="text-center mt-6 text-white/80 text-sm">
            Perfect for corporate events, weddings, concerts, and large group outings
          </p>
        </div>
      </div>
    </section>
  );
};