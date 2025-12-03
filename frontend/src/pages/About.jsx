import React from 'react';
import { Shield, Users, Clock, Award, Target, Heart } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';

export const About = () => {
  return (
    <div className="min-h-screen pt-20 bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.1),transparent_50%)]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-gold font-light tracking-[0.3em] uppercase text-sm border border-gold/30 px-6 py-2 rounded-full inline-block mb-6">
              Our Story
            </span>
            <h1 className="text-5xl md:text-6xl font-light text-white mb-6 tracking-tight">
              About Book A Ride NZ
            </h1>
            <p className="text-xl text-white/70 font-light leading-relaxed">
              Your distinguished transportation partner, committed to delivering exceptional service, unwavering reliability, and unparalleled comfort across New Zealand.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-gold font-light tracking-[0.3em] uppercase text-sm">Heritage</span>
              <h2 className="text-4xl md:text-5xl font-light text-gray-900 mt-4 mb-8">Our Journey</h2>
            </div>
            <div className="prose prose-lg max-w-none space-y-6">
              <p className="text-gray-600 font-light leading-relaxed text-lg">
                Established in 2015, Book A Ride NZ was born from an unwavering vision: to redefine luxury transportation in New Zealand by delivering a service that seamlessly blends elegance, reliability, and professionalism. What began as a modest fleet has evolved into one of the nation's most distinguished transportation services.
              </p>
              <p className="text-gray-600 font-light leading-relaxed text-lg">
                Over the years, we have had the privilege of serving thousands of discerning clients, from distinguished business executives and international visitors to local residents seeking exceptional daily transportation. Our dedication to excellence remains steadfast - we approach every journey as if it were the most significant voyage of the day.
              </p>
              <p className="text-gray-600 font-light leading-relaxed text-lg">
                Today, Book A Ride NZ operates around the clock with a curated fleet of premium vehicles and a team of highly professional chauffeurs who embody our commitment to exceptional service. We continuously innovate and refine our offerings, ensuring that every ride transcends mere transportation to become a memorable experience you can trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-gold font-light tracking-[0.3em] uppercase text-sm">Philosophy</span>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mt-4 mb-6">Core Values</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
              The principles that guide every decision and interaction
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {[
              {
                icon: Shield,
                title: 'Safety First',
                description: 'Your wellbeing is paramount. Every driver undergoes rigorous vetting and continuous training, while our vehicles are maintained to exemplary standards.'
              },
              {
                icon: Clock,
                title: 'Punctuality',
                description: 'We honor your schedule. Our commitment to timeliness ensures you never miss a crucial appointment or flight.'
              },
              {
                icon: Users,
                title: 'Client Focus',
                description: 'Every client is unique. We attentively listen to your needs and customize our service to deliver exceptional experiences.'
              },
              {
                icon: Award,
                title: 'Excellence',
                description: 'We pursue excellence in every aspect, from the pristine condition of our vehicles to the impeccable professionalism of our service.'
              },
              {
                icon: Target,
                title: 'Reliability',
                description: 'Depend on us without hesitation. Our 24/7 availability and consistent service make us your trusted transportation partner.'
              },
              {
                icon: Heart,
                title: 'Integrity',
                description: 'Honest, transparent, and equitable in all interactions. We cultivate enduring relationships founded on trust and mutual respect.'
              }
            ].map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="border-2 border-gray-200 hover:border-gold hover:shadow-xl transition-all duration-500 group">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-black group-hover:bg-gold rounded-xl flex items-center justify-center mb-6 transition-colors duration-300">
                      <Icon className="w-8 h-8 text-gold group-hover:text-black transition-colors duration-300" />
                    </div>
                    <h3 className="text-xl font-light text-gray-900 mb-4">{value.title}</h3>
                    <p className="text-gray-600 text-sm font-light leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* By the Numbers */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-gold font-light tracking-[0.3em] uppercase text-sm">Achievements</span>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mt-4 mb-6">Excellence in Numbers</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
              Our commitment to distinction, reflected in milestones
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { value: '10,000+', label: 'Distinguished Clients' },
              { value: '50+', label: 'Professional Chauffeurs' },
              { value: '100+', label: 'Premium Vehicles' },
              { value: '4.9/5', label: 'Client Rating' },
              { value: '24/7', label: 'Service Availability' },
              { value: '8+', label: 'Years of Excellence' },
              { value: '99%', label: 'Punctuality Rate' },
              { value: '100%', label: 'Satisfaction Focus' }
            ].map((stat, index) => (
              <div key={index} className="text-center p-8 bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200 hover:border-gold hover:shadow-lg transition-all duration-300">
                <div className="text-4xl font-light text-gold mb-2">{stat.value}</div>
                <div className="text-sm text-gray-700 font-light">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.2),transparent_70%)]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
            <Card className="border-2 border-gold/30 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors duration-300">
              <CardContent className="p-10">
                <h3 className="text-3xl font-light text-gold mb-6">Our Mission</h3>
                <p className="text-white/80 font-light leading-relaxed text-lg">
                  To deliver exceptional, reliable, and luxurious transportation services that surpass client expectations, while cultivating a culture of professionalism, integrity, and continuous refinement.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-gold/30 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors duration-300">
              <CardContent className="p-10">
                <h3 className="text-3xl font-light text-gold mb-6">Our Vision</h3>
                <p className="text-white/80 font-light leading-relaxed text-lg">
                  To become New Zealand's most esteemed and preferred luxury transportation service, renowned for our steadfast dedication to client satisfaction, innovation, and excellence in every journey.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
