import React from 'react';
import { Shield, Award, Clock, ThumbsUp, Lock, BadgeCheck } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';

export const TrustBadges = () => {
  const badges = [
    {
      icon: Shield,
      title: 'Fully Insured',
      description: 'Comprehensive insurance coverage'
    },
    {
      icon: Award,
      title: 'Licensed Drivers',
      description: 'Professional & certified'
    },
    {
      icon: Clock,
      title: '24/7 Available',
      description: 'Service round the clock'
    },
    {
      icon: ThumbsUp,
      title: '1000+ Happy Customers',
      description: 'Trusted by thousands'
    },
    {
      icon: Lock,
      title: 'Secure Payments',
      description: 'Safe & encrypted transactions'
    },
    {
      icon: BadgeCheck,
      title: 'Quality Guaranteed',
      description: 'Best value promise'
    }
  ];

  return (
    <section className="py-16 bg-white border-y border-gray-200">
      <div className="container mx-auto px-4">
        <AnimatedSection>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {badges.map((badge, index) => {
              const Icon = badge.icon;
              return (
                <div
                  key={index}
                  className="text-center group"
                  data-aos="fade-up"
                  data-aos-delay={index * 50}
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gold to-yellow-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Icon className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">{badge.title}</h3>
                  <p className="text-xs text-gray-600">{badge.description}</p>
                </div>
              );
            })}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};