import React from 'react';
import { Shield, Users, Clock, Award, Target, Heart } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';

export const About = () => {
  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-amber-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About BookaRide
            </h1>
            <p className="text-lg text-gray-600">
              Your trusted transportation partner, committed to providing safe, reliable, and comfortable rides across New Zealand.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">Our Story</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-6">
                Founded in 2015, BookaRide emerged from a simple vision: to revolutionize transportation in New Zealand by providing a service that combines reliability, comfort, and professionalism. What started as a small fleet of vehicles has grown into one of the most trusted transportation services in the country.
              </p>
              <p className="text-gray-600 mb-6">
                Over the years, we've served thousands of satisfied customers, from business travelers and tourists to locals needing daily commutes. Our commitment to excellence has remained unchanged - we treat every ride as if it's the most important journey of the day.
              </p>
              <p className="text-gray-600">
                Today, BookaRide operates 24/7 with a fleet of modern vehicles and a team of professional drivers who share our passion for exceptional service. We continue to innovate and improve, ensuring that every ride with us is not just a journey, but an experience you can trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Shield,
                title: 'Safety First',
                description: 'Your safety is our top priority. All our drivers are vetted, trained, and our vehicles are regularly maintained to the highest standards.'
              },
              {
                icon: Clock,
                title: 'Punctuality',
                description: 'We value your time. Our commitment to being on time, every time, ensures you never miss an important appointment or flight.'
              },
              {
                icon: Users,
                title: 'Customer Focus',
                description: 'Every customer is unique. We listen to your needs and tailor our service to provide the best possible experience.'
              },
              {
                icon: Award,
                title: 'Excellence',
                description: 'We strive for excellence in everything we do, from the cleanliness of our vehicles to the professionalism of our service.'
              },
              {
                icon: Target,
                title: 'Reliability',
                description: 'Count on us to be there when you need us. Our 24/7 availability and consistent service make us your reliable transportation partner.'
              },
              {
                icon: Heart,
                title: 'Integrity',
                description: 'Honest, transparent, and fair in all our dealings. We build lasting relationships based on trust and respect.'
              }
            ].map((value, index) => (
              <Card key={index} className="border-2 hover:border-amber-500 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                    <value.icon className="w-7 h-7 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* By the Numbers */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">BookaRide by the Numbers</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our commitment to excellence, reflected in numbers
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { value: '10,000+', label: 'Happy Customers' },
              { value: '50+', label: 'Professional Drivers' },
              { value: '100+', label: 'Vehicles' },
              { value: '4.9/5', label: 'Customer Rating' },
              { value: '24/7', label: 'Service Availability' },
              { value: '8+', label: 'Years of Experience' },
              { value: '99%', label: 'On-Time Rate' },
              { value: '100%', label: 'Customer Satisfaction Focus' }
            ].map((stat, index) => (
              <div key={index} className="text-center p-6 bg-amber-50 rounded-xl hover:shadow-md transition-shadow duration-200">
                <div className="text-4xl font-bold text-amber-600 mb-2">{stat.value}</div>
                <div className="text-sm text-gray-700 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-amber-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-2">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                <p className="text-gray-600">
                  To provide safe, reliable, and comfortable transportation services that exceed customer expectations, while fostering a culture of professionalism, integrity, and continuous improvement.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
                <p className="text-gray-600">
                  To be New Zealand's most trusted and preferred transportation service, recognized for our unwavering commitment to customer satisfaction, innovation, and excellence in every journey.
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
