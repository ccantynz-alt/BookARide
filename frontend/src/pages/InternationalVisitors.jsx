import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Plane, CreditCard, MessageCircle, Clock, Shield, Heart, Star, MapPin, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import SEO from '../components/SEO';

const InternationalVisitors = () => {
  const countries = [
    {
      code: 'cn',
      flag: '🇨🇳',
      name: 'China',
      nativeName: '中国',
      greeting: '欢迎',
      link: '/visitors/china',
      image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=600&q=80',
      features: ['支付宝 & 微信支付', '中文客服', '机场接送'],
      visitors: '180,000+ annually'
    },
    {
      code: 'jp',
      flag: '🇯🇵',
      name: 'Japan',
      nativeName: '日本',
      greeting: 'ようこそ',
      link: '/visitors/japan',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80',
      features: ['日本語対応', '安心・安全', '時間厳守'],
      visitors: '95,000+ annually'
    },
    {
      code: 'kr',
      flag: '🇰🇷',
      name: 'Korea',
      nativeName: '한국',
      greeting: '환영합니다',
      link: '/visitors/korea',
      image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=600&q=80',
      features: ['한국어 서비스', '카카오페이', '안전한 여행'],
      visitors: '75,000+ annually'
    },
    {
      code: 'au',
      flag: '🇦🇺',
      name: 'Australia',
      nativeName: 'Australia',
      greeting: "G'day",
      link: '/visitors/australia',
      image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=600&q=80',
      features: ['No currency exchange', 'Similar driving culture', 'Short flight'],
      visitors: '1.5M+ annually'
    },
    {
      code: 'us',
      flag: '🇺🇸',
      name: 'USA',
      nativeName: 'United States',
      greeting: 'Welcome',
      link: '/visitors/usa',
      image: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?auto=format&fit=crop&w=600&q=80',
      features: ['USD pricing available', 'Flight tracking', '24/7 support'],
      visitors: '350,000+ annually'
    },
    {
      code: 'gb',
      flag: '🇬🇧',
      name: 'United Kingdom',
      nativeName: 'UK',
      greeting: 'Welcome',
      link: '/visitors/uk',
      image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80',
      features: ['GBP pricing', 'Same language', 'Familiar service'],
      visitors: '220,000+ annually'
    },
    {
      code: 'de',
      flag: '🇩🇪',
      name: 'Germany',
      nativeName: 'Deutschland',
      greeting: 'Willkommen',
      link: '/visitors/germany',
      image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=600&q=80',
      features: ['Deutsche Seite', 'Pünktlichkeit', 'Qualitätsservice'],
      visitors: '85,000+ annually'
    },
    {
      code: 'fr',
      flag: '🇫🇷',
      name: 'France',
      nativeName: 'France',
      greeting: 'Bienvenue',
      link: '/visitors/france',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80',
      features: ['Page française', 'Service premium', 'Confort garanti'],
      visitors: '45,000+ annually'
    },
    {
      code: 'sg',
      flag: '🇸🇬',
      name: 'Singapore',
      nativeName: 'Singapore',
      greeting: 'Welcome',
      link: '/visitors/singapore',
      image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=600&q=80',
      features: ['SGD accepted', 'Direct flights', 'Familiar culture'],
      visitors: '55,000+ annually'
    }
  ];

  const whyNZ = [
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "World-Class Destinations",
      description: "From Hobbiton to Milford Sound, NZ offers breathtaking experiences"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Safe & Welcoming",
      description: "Consistently ranked as one of the world's safest countries"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Friendly Locals",
      description: "Kiwi hospitality is renowned worldwide"
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Unique Experiences",
      description: "Adventure, culture, and natural beauty in one destination"
    }
  ];

  const paymentMethods = [
    { name: 'Alipay', icon: '💳', countries: 'China' },
    { name: 'WeChat Pay', icon: '📱', countries: 'China' },
    { name: 'Visa/Mastercard', icon: '💳', countries: 'Worldwide' },
    { name: 'PayPal', icon: '🅿️', countries: 'Worldwide' },
    { name: 'Afterpay', icon: '🛒', countries: 'AU/NZ' },
    { name: 'Bank Transfer', icon: '🏦', countries: 'Worldwide' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="International Visitors - Airport Transfers New Zealand | 国际游客 | 海外観光客"
        description="Welcome international visitors to New Zealand! Premium airport shuttle service with multilingual support. Chinese (中文), Japanese (日本語), Korean (한국어), and more. Alipay, WeChat Pay accepted. Safe, reliable transfers from Auckland, Hamilton & Whangarei airports."
        keywords="international visitors New Zealand, NZ airport transfer tourists, Chinese tourists NZ, Japanese visitors New Zealand, Korean tourists Auckland, international airport shuttle, multilingual shuttle service, 新西兰机场接送, ニュージーランド空港送迎, 뉴질랜드 공항 픽업"
        canonical="/international-visitors"
      />

      {/* Epic Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* World Map Background with Multiple Country Images */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80" 
            alt="Connected world - globe at night" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/90 via-gray-900/80 to-gray-900" />
        </div>
        
        {/* Animated Globe Icon */}
        <div className="absolute top-40 right-10 opacity-10">
          <Globe className="w-96 h-96 text-gold animate-pulse" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Multilingual Welcome */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-sm border border-white/20">
                🇬🇧 Welcome
              </span>
              <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-sm border border-white/20">
                🇨🇳 欢迎
              </span>
              <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-sm border border-white/20">
                🇯🇵 ようこそ
              </span>
              <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-sm border border-white/20">
                🇰🇷 환영합니다
              </span>
              <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-sm border border-white/20">
                🇫🇷 Bienvenue
              </span>
              <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-sm border border-white/20">
                🇩🇪 Willkommen
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              International <span className="text-gold">Visitors</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 mb-4">
              Your New Zealand Adventure Starts With Us
            </p>
            
            <p className="text-lg text-white/60 mb-8 max-w-3xl mx-auto">
              We welcome over <span className="text-gold font-semibold">3 million international visitors</span> to New Zealand each year. 
              Our multilingual airport transfer service ensures your journey begins smoothly, no matter where you're from.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold text-gold">9+</div>
                <div className="text-white/70 text-sm">Languages Supported</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold text-gold">24/7</div>
                <div className="text-white/70 text-sm">Customer Support</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold text-gold">6+</div>
                <div className="text-white/70 text-sm">Payment Methods</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold text-gold">100%</div>
                <div className="text-white/70 text-sm">Satisfaction Rate</div>
              </div>
            </div>

            <Link to="/book-now">
              <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-10 py-6 text-lg">
                <Plane className="w-5 h-5 mr-2" />
                Book Your Airport Transfer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Country Selection Grid */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Country</h2>
            <p className="text-xl text-gray-600">Select your country for a personalized experience in your language</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {countries.map((country) => (
              <Link key={country.code} to={country.link}>
                <Card className="group overflow-hidden border-2 border-transparent hover:border-gold transition-all duration-300 hover:shadow-xl h-full">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={country.image} 
                      alt={country.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{country.flag}</span>
                        <div>
                          <h3 className="text-xl font-bold text-white">{country.name}</h3>
                          <p className="text-gold text-sm">{country.greeting}!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-gray-900">{country.nativeName}</span>
                      <span className="text-xs text-gray-500">{country.visitors}</span>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {country.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-gold mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center text-gold font-semibold group-hover:translate-x-2 transition-transform">
                      View Page <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Visit New Zealand */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1469521669194-babb45599def?auto=format&fit=crop&w=1920&q=80" 
            alt="New Zealand landscape" 
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Why Visit New Zealand?</h2>
            <p className="text-xl text-white/70">Discover what makes Aotearoa a world-class destination</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {whyNZ.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gold/20 rounded-full flex items-center justify-center text-gold">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-white/70">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services for International Visitors */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Tailored for International Travelers</h2>
            <p className="text-xl text-gray-600">We understand the unique needs of visitors from abroad</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-2 border-gold/30 hover:border-gold transition-colors">
              <CardContent className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-gold mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Multilingual Support</h3>
                <p className="text-gray-600">Customer service available in Chinese, Japanese, Korean, French, German, and more. Communicate comfortably in your language.</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gold/30 hover:border-gold transition-colors">
              <CardContent className="p-8 text-center">
                <Plane className="w-12 h-12 text-gold mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Flight Tracking</h3>
                <p className="text-gray-600">We monitor your incoming flight in real-time. Delayed? We'll adjust your pickup automatically - no stress, no extra calls.</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gold/30 hover:border-gold transition-colors">
              <CardContent className="p-8 text-center">
                <CreditCard className="w-12 h-12 text-gold mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Flexible Payments</h3>
                <p className="text-gray-600">Pay with Alipay, WeChat Pay, PayPal, credit cards, or bank transfer. We accept payments in multiple currencies.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Accepted Payment Methods</h2>
            <p className="text-gray-600">Pay the way that's most convenient for you</p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
            {paymentMethods.map((method, index) => (
              <div key={index} className="bg-white rounded-xl px-6 py-4 shadow-sm border border-gray-200 flex items-center gap-3">
                <span className="text-2xl">{method.icon}</span>
                <div>
                  <div className="font-semibold text-gray-900">{method.name}</div>
                  <div className="text-xs text-gray-500">{method.countries}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Travel Tips */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Essential Travel Tips</h2>
              <p className="text-xl text-gray-600">Helpful information for your New Zealand journey</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-6 h-6 text-gold mr-2" />
                  Time Zone
                </h3>
                <p className="text-gray-600 mb-2">New Zealand is UTC+12 (NZST) or UTC+13 (NZDT during daylight saving).</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• From China: +4/5 hours ahead</li>
                  <li>• From Japan/Korea: +3/4 hours ahead</li>
                  <li>• From UK: +12/13 hours ahead</li>
                  <li>• From USA (LA): +19/20 hours ahead</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Globe className="w-6 h-6 text-gold mr-2" />
                  Currency
                </h3>
                <p className="text-gray-600 mb-2">New Zealand Dollar (NZD). Current approximate rates:</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• 1 NZD ≈ 4.3 CNY (Chinese Yuan)</li>
                  <li>• 1 NZD ≈ 91 JPY (Japanese Yen)</li>
                  <li>• 1 NZD ≈ 800 KRW (Korean Won)</li>
                  <li>• 1 NZD ≈ 0.60 USD / 0.48 GBP</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Users className="w-6 h-6 text-gold mr-2" />
                  Driving in NZ
                </h3>
                <p className="text-gray-600 mb-2">We drive on the LEFT side of the road.</p>
                <p className="text-sm text-gray-500">If you're from a right-hand drive country, consider using our shuttle service for a stress-free, safe journey - especially after a long flight!</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Shield className="w-6 h-6 text-gold mr-2" />
                  Safety
                </h3>
                <p className="text-gray-600 mb-2">New Zealand is one of the world's safest countries.</p>
                <p className="text-sm text-gray-500">Our professional drivers are fully licensed, police-vetted, and trained in hospitality. Your safety is our top priority.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gold to-yellow-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-black mb-4">Ready to Start Your NZ Adventure?</h2>
          <p className="text-xl text-black/80 mb-8 max-w-2xl mx-auto">
            Book your airport transfer now and enjoy a seamless arrival in New Zealand
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book-now">
              <Button className="bg-black hover:bg-gray-900 text-white font-semibold px-10 py-6 text-lg">
                Book Now
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" className="border-black text-black hover:bg-black/10 px-10 py-6 text-lg">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InternationalVisitors;
