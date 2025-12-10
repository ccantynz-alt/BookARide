import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, MapPin, Clock, Shield, Star, CreditCard, Users, Phone, MessageCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import SEO from '../../components/SEO';

const ChinaLanding = () => {
  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="新西兰机场接送服务 - 中国游客专属 | New Zealand Airport Transfers for Chinese Visitors"
        description="为中国游客提供优质新西兰机场接送服务。支持支付宝、微信支付，中文客服。奥克兰机场、哈密尔顿机场接送。Premium airport shuttle service for Chinese tourists visiting New Zealand."
        keywords="新西兰机场接送, 奥克兰机场中文服务, 新西兰旅游交通, 中国游客新西兰, Chinese visitors NZ airport transfer, Auckland airport Chinese service"
        canonical="/visitors/china"
        currentLang="zh"
      />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-red-900 via-red-800 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(212,175,55,0.2),transparent_50%)]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-gold/20 px-4 py-2 rounded-full mb-6">
              <span className="text-2xl">🇨🇳</span>
              <span className="text-gold font-medium">欢迎中国游客！</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              新西兰之旅 <span className="text-gold">从这里开始</span>
            </h1>
            <p className="text-xl text-white/80 mb-4">
              Your New Zealand Journey Starts Here
            </p>
            <p className="text-lg text-white/70 mb-8">
              专为中国游客提供的优质机场接送服务 · 支持微信/支付宝支付 · 中文客服
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/zh/book-now">
                <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-lg">
                  立即预订 Book Now
                </Button>
              </Link>
              <Link to="/zh/services">
                <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                  查看服务 Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">为什么选择我们</h2>
          <p className="text-center text-gray-600 mb-12">Why Chinese Visitors Choose Us</p>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-lg font-semibold mb-2">中文服务</h3>
              <p className="text-sm text-gray-600">Chinese Speaking Service</p>
              <p className="text-gray-600 mt-2">提供中文客服支持</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-lg font-semibold mb-2">微信/支付宝</h3>
              <p className="text-sm text-gray-600">WeChat & Alipay</p>
              <p className="text-gray-600 mt-2">支持您熟悉的支付方式</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-lg font-semibold mb-2">航班跟踪</h3>
              <p className="text-sm text-gray-600">Flight Tracking</p>
              <p className="text-gray-600 mt-2">实时跟踪您的航班</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-lg font-semibold mb-2">安全可靠</h3>
              <p className="text-sm text-gray-600">Safe & Reliable</p>
              <p className="text-gray-600 mt-2">专业司机，安全车辆</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">热门目的地</h2>
          <p className="text-center text-gray-600 mb-12">Popular Destinations for Chinese Visitors</p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: '霍比特村 Hobbiton', desc: '《指环王》外景地', price: '从 $320 NZD' },
              { name: '罗托鲁瓦 Rotorua', desc: '毛利文化与温泉', price: '从 $280 NZD' },
              { name: '奥克兰市中心 Auckland CBD', desc: '购物与美食天堂', price: '从 $65 NZD' },
              { name: '怀希岛 Waiheke Island', desc: '葡萄酒与海滩', price: '从 $95 NZD' },
              { name: '奥克兰机场 Auckland Airport', desc: '国际到达', price: '从 $65 NZD' },
              { name: '哈密尔顿 Hamilton', desc: '怀卡托地区', price: '从 $180 NZD' },
            ].map((dest, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-xl hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-2">{dest.name}</h3>
                <p className="text-gray-600 mb-4">{dest.desc}</p>
                <p className="text-gold font-bold">{dest.price}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/zh/book-now">
              <Button className="bg-gold hover:bg-gold/90 text-black font-semibold">
                获取报价 Get Quote
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* WeChat Contact */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">微信咨询</h2>
          <p className="text-white/90 mb-6">WeChat Contact Available</p>
          <p className="text-xl mb-8">扫码添加微信，获取中文服务</p>
          <div className="bg-white p-4 rounded-xl inline-block">
            <p className="text-gray-900 font-semibold">WeChat ID: BookARideNZ</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gold">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-2">准备好预订了吗？</h2>
          <p className="text-xl text-black/80 mb-8">Ready to Book Your Transfer?</p>
          <Link to="/zh/book-now">
            <Button className="bg-black hover:bg-gray-900 text-white font-semibold px-8 py-6 text-lg">
              立即预订 Book Now →
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ChinaLanding;
