import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, MapPin, Clock, Shield, Star, CreditCard, Users } from 'lucide-react';
import { Button } from '../../components/ui/button';
import SEO from '../../components/SEO';

const KoreaLanding = () => {
  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="뉴질랜드 공항 셔틀 서비스 - 한국 관광객 전용 | NZ Airport Transfers for Korean Visitors"
        description="한국 관광객을 위한 뉴질랜드 공항 셔틀 서비스. 오클랜드 공항에서 호비튼, 로토루아까지. 안전하고 편안한 이동. Premium airport shuttle for Korean tourists in New Zealand."
        keywords="뉴질랜드 공항 셔틀, 오클랜드 공항 한국어, NZ여행 교통, 호비튼 투어, Korean visitors NZ, Auckland airport Korean service"
        canonical="/visitors/korea"
        currentLang="ko"
      />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-900 via-blue-800 to-gray-900 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6">
              <span className="text-2xl">🇰🇷</span>
              <span className="text-white font-medium">한국 관광객 환영합니다!</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              뉴질랜드 여행 <span className="text-gold">시작하세요</span>
            </h1>
            <p className="text-xl text-white/80 mb-4">
              Your New Zealand Journey Starts Here
            </p>
            <p className="text-lg text-white/70 mb-8">
              안전하고 편안한 공항 셔틀 서비스
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/ko/book-now">
                <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-lg">
                  지금 예약 Book Now
                </Button>
              </Link>
              <Link to="/ko/services">
                <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                  서비스 보기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">선택하는 이유</h2>
          <p className="text-center text-gray-600 mb-12">Why Korean Visitors Choose Us</p>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-lg font-semibold mb-2">정시 도착</h3>
              <p className="text-sm text-gray-600">Punctual Service</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-lg font-semibold mb-2">안전 우선</h3>
              <p className="text-sm text-gray-600">Safety First</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-lg font-semibold mb-2">프리미엄 품질</h3>
              <p className="text-sm text-gray-600">Premium Quality</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-lg font-semibold mb-2">간편 결제</h3>
              <p className="text-sm text-gray-600">Easy Payment</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">인기 목적지</h2>
          <p className="text-center text-gray-600 mb-12">Popular Destinations</p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: '호비튼 Hobbiton', desc: '반지의 제왕 촬영지', price: '견적 문의' },
              { name: '로토루아 Rotorua', desc: '마오리 문화와 온천', price: '$280 NZD부터' },
              { name: '와이헤키 섬 Waiheke', desc: '와이너리와 해변', price: '$95 NZD부터' },
            ].map((dest, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-xl hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-2">{dest.name}</h3>
                <p className="text-gray-600 mb-4">{dest.desc}</p>
                <p className="text-gold font-bold">{dest.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gold">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-2">예약할 준비가 되셨나요?</h2>
          <p className="text-xl text-black/80 mb-8">Ready to Book?</p>
          <Link to="/ko/book-now">
            <Button className="bg-black hover:bg-gray-900 text-white font-semibold px-8 py-6 text-lg">
              지금 예약 →
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default KoreaLanding;
