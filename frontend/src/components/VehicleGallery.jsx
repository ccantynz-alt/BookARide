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
      name: 'Toyota Hiace',
      image: 'https://customer-assets.emergentagent.com/job_bookmyride-nz/artifacts/6fpsudnh_IMG_0158%20%281%29.jpeg',
      capacity: '11 passengers',
      luggage: '12+ bags',
      description: 'Our premium fleet vehicle'
    },
    {
      name: 'Toyota Hiace',
      image: 'https://customer-assets.emergentagent.com/job_bookmyride-nz/artifacts/6fpsudnh_IMG_0158%20%281%29.jpeg',
      capacity: '11 passengers',
      luggage: '12+ bags',
      description: 'Spacious & comfortable'
    },
    {
      name: 'Toyota Hiace',
      image: 'https://customer-assets.emergentagent.com/job_bookmyride-nz/artifacts/6fpsudnh_IMG_0158%20%281%29.jpeg',
      capacity: '11 passengers',
      luggage: '12+ bags',
      description: 'Professional service'
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
          <p className="text-lg text-gray-600 max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="100">
            Modern, well-maintained vehicles for your comfort and safety
          </p>
        </AnimatedSection>

        <div className="max-w-6xl mx-auto">
          <Slider {...settings}>
            {vehicles.map((vehicle, index) => (
              <div key={index} className="px-4">
                <Card className="overflow-hidden hover-lift transition-all-smooth">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={vehicle.image}
                      alt={vehicle.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-2xl font-bold mb-1">{vehicle.name}</h3>
                      <p className="text-sm text-white/80">{vehicle.description}</p>
                    </div>
                  </div>
                  <div className="p-6 bg-white">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center text-gray-700">
                        <Users className="w-5 h-5 text-gold mr-2" />
                        <span className="text-sm">{vehicle.capacity}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Luggage className="w-5 h-5 text-gold mr-2" />
                        <span className="text-sm">{vehicle.luggage}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
};