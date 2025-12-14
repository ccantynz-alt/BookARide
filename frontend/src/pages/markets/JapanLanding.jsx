import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, MapPin, Clock, Shield, Star, CreditCard, Users } from 'lucide-react';
import { Button } from '../../components/ui/button';
import SEO from '../../components/SEO';

const JapanLanding = () => {
  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="ニュージーランド空港送迎サービス - 日本人観光客向け | NZ Airport Transfers for Japanese Visitors"
        description="日本人観光客のためのニュージーランド空港送迎サービス。オークランド空港からホビトン、ロトルアまで。安心・安全・快適な移動を。Premium airport shuttle for Japanese tourists in New Zealand."
        keywords="ニュージーランド 空港送迎, オークランド空港 日本語, NZ旅行 移動, ホビットン ツアー, Japanese visitors NZ, Auckland airport Japanese service"
        canonical="/visitors/japan"
        currentLang="ja"
      />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-red-700 via-red-600 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent_50%)]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6">
              <span className="text-2xl">🇯🇵</span>
              <span className="text-white font-medium">日本のお客様へ</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              NZの旅は <span className="text-gold">ここから</span>
            </h1>
            <p className="text-xl text-white/80 mb-4">
              Your New Zealand Journey Starts Here
            </p>
            <p className="text-lg text-white/70 mb-8">
              安心・安全・快適な空港送迎サービス
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/ja/book-now">
                <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-lg">
                  今すぐ予約 Book Now
                </Button>
              </Link>
              <Link to="/ja/services">
                <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                  サービス一覧
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">選ばれる理由</h2>
          <p className="text-center text-gray-600 mb-12">Why Japanese Visitors Choose Us</p>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-lg font-semibold mb-2">時間厳守</h3>
              <p className="text-sm text-gray-600">Punctual Service</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-lg font-semibold mb-2">安全第一</h3>
              <p className="text-sm text-gray-600">Safety First</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-lg font-semibold mb-2">高品質</h3>
              <p className="text-sm text-gray-600">Premium Quality</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-lg font-semibold mb-2">簡単決済</h3>
              <p className="text-sm text-gray-600">Easy Payment</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">人気の目的地</h2>
          <p className="text-center text-gray-600 mb-12">Popular Destinations</p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'ホビットン村 Hobbiton', desc: '『ロード・オブ・ザ・リング』の世界へ', price: '見積もりを取得' },
              { name: 'ロトルア Rotorua', desc: 'マオリ文化と温泉', price: '見積もりを取得' },
              { name: 'ワイヘキ島 Waiheke', desc: 'ワイナリーとビーチ', price: '$120 NZDから' },
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
          <h2 className="text-3xl font-bold text-black mb-2">ご予約はこちら</h2>
          <p className="text-xl text-black/80 mb-8">Ready to Book?</p>
          <Link to="/ja/book-now">
            <Button className="bg-black hover:bg-gray-900 text-white font-semibold px-8 py-6 text-lg">
              今すぐ予約 →
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default JapanLanding;
