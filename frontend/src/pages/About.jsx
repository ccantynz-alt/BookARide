import React from 'react';
import { Shield, Users, Clock, Award, Target, Heart } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import SEO from '../components/SEO';

export const About = () => {
  return (
    <div className="min-h-screen pt-20 bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
        {/* Background Vehicle Image */}
        <div className="absolute inset-0 opacity-15">
          <img 
            src="/shuttle-van.jpg" 
            alt="" 
            className="w-full h-full object-cover object-center"
            style={{ filter: 'brightness(0.4) blur(1px)' }}
          />
        </div>
        
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.15),transparent_50%)]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              About Us
            </h1>
            <p className="text-xl text-white/80">
              Your trusted transportation partner, committed to providing safe, reliable, and comfortable rides across New Zealand.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 text-center">Our Story</h2>
            <div className="space-y-6">
              <p className="text-gray-600 text-lg leading-relaxed">
                Book A Ride NZ specializes in airport shuttle services connecting Auckland, Hamilton, and Whangarei airports, as well as private shuttle transfers throughout Auckland. We've built our reputation on reliable, safe, and comfortable transportation for travelers and locals alike.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                Over the years, we've had the privilege of serving thousands of customers - from business travelers catching early flights to families heading on vacation, and locals needing reliable transportation around Auckland. Our commitment to excellent service has remained unchanged - we treat every ride with the utmost care and professionalism.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                Today, we operate 24/7 with a fleet of well-maintained shuttle vehicles and a team of experienced, professional drivers who know these routes inside out. Whether you're heading to the airport or need private transport around Auckland, we're here to help.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {[
              {
                icon: Shield,
                title: 'Safety First',
                description: 'Your safety is our top priority. All our drivers are vetted, trained, and our vehicles are regularly maintained to high standards.'
              },
              {
                icon: Clock,
                title: 'Punctuality',
                description: 'We value your time. Our commitment to being on time ensures you never miss an important appointment or flight.'
              },
              {
                icon: Users,
                title: 'Customer Focus',
                description: 'Every customer matters to us. We listen to your needs and provide personalized service.'
              },
              {
                icon: Award,
                title: 'Quality Service',
                description: 'We strive for excellence in everything we do, from vehicle cleanliness to driver professionalism.'
              },
              {
                icon: Target,
                title: 'Reliability',
                description: 'Count on us to be there when you need us. Our 24/7 availability means we\'re always ready to help.'
              },
              {
                icon: Heart,
                title: 'Integrity',
                description: 'Honest, transparent, and fair in all our dealings. We build relationships based on trust.'
              }
            ].map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="border-2 border-gray-200 hover:border-gold hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-gray-900 group-hover:bg-gold rounded-xl flex items-center justify-center mb-6 transition-colors duration-300">
                      <Icon className="w-8 h-8 text-gold group-hover:text-black transition-colors duration-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{value.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
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
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Track Record</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Numbers that reflect our commitment to great service
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { value: '10,000+', label: 'Happy Customers' },
              { value: '50+', label: 'Professional Drivers' },
              { value: '100+', label: 'Vehicles' },
              { value: '4.9/5', label: 'Customer Rating' },
              { value: '24/7', label: 'Service Available' },
              { value: '8+', label: 'Years Experience' },
              { value: '99%', label: 'On-Time Rate' },
              { value: '100%', label: 'Satisfaction Goal' }
            ].map((stat, index) => (
              <div key={index} className="text-center p-8 bg-gray-50 rounded-xl border border-gray-200 hover:border-gold hover:shadow-md transition-all duration-200">
                <div className="text-4xl font-bold text-gold mb-2">{stat.value}</div>
                <div className="text-sm text-gray-700 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.2),transparent_70%)]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
            <Card className="border-2 border-gold/30 bg-white/5 backdrop-blur-sm">
              <CardContent className="p-10">
                <h3 className="text-3xl font-bold text-gold mb-6">Our Mission</h3>
                <p className="text-white/80 leading-relaxed">
                  To provide safe, reliable, and comfortable transportation services that exceed customer expectations, while maintaining high standards of professionalism and continuous improvement.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-gold/30 bg-white/5 backdrop-blur-sm">
              <CardContent className="p-10">
                <h3 className="text-3xl font-bold text-gold mb-6">Our Vision</h3>
                <p className="text-white/80 leading-relaxed">
                  To be New Zealand's most trusted and reliable transportation service, known for our commitment to customer satisfaction, safety, and quality service in every journey.
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
