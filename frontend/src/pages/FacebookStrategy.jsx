import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Facebook, Instagram, Calendar, Copy, Check, 
  Lightbulb, Target, Users, TrendingUp, Clock,
  MessageSquare, Image, Video, Star, ChevronDown, ChevronUp
} from 'lucide-react';
import { facebookPosts, weeklyCalendar, adTemplates } from '../data/facebookContent';

const FacebookStrategy = () => {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [expandedSection, setExpandedSection] = useState('calendar');

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Facebook Marketing Strategy | BookaRide Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Facebook className="w-12 h-12" />
            <Instagram className="w-12 h-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Social Media Content Strategy
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Ready-to-use templates, weekly calendar, and ad copy for BookaRide's social media domination.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card className="text-center p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="text-3xl font-bold">15+</div>
            <div className="text-sm text-blue-100">Post Templates</div>
          </Card>
          <Card className="text-center p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="text-3xl font-bold">7</div>
            <div className="text-sm text-purple-100">Days Planned</div>
          </Card>
          <Card className="text-center p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="text-3xl font-bold">4</div>
            <div className="text-sm text-green-100">Ad Templates</div>
          </Card>
          <Card className="text-center p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="text-3xl font-bold">∞</div>
            <div className="text-sm text-orange-100">Combinations</div>
          </Card>
        </div>

        {/* Weekly Content Calendar */}
        <section className="mb-12">
          <button 
            onClick={() => toggleSection('calendar')}
            className="w-full flex items-center justify-between bg-white p-6 rounded-lg shadow-sm mb-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-gold" />
              <div className="text-left">
                <h2 className="text-2xl font-bold">Weekly Content Calendar</h2>
                <p className="text-gray-600">What to post each day of the week</p>
              </div>
            </div>
            {expandedSection === 'calendar' ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </button>
          
          {expandedSection === 'calendar' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(weeklyCalendar).map(([day, info]) => (
                <Card key={day} className={`${info.type === 'rest' ? 'bg-gray-100' : 'bg-white'}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg capitalize flex items-center gap-2">
                      {day === 'monday' && '📚'}
                      {day === 'tuesday' && '⭐'}
                      {day === 'wednesday' && '📍'}
                      {day === 'thursday' && '🎉'}
                      {day === 'friday' && '🎬'}
                      {day === 'saturday' && '🎪'}
                      {day === 'sunday' && '😴'}
                      {day}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold text-gold mb-1">{info.theme}</p>
                    <p className="text-sm text-gray-600">{info.example}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Post Templates */}
        <section className="mb-12">
          <button 
            onClick={() => toggleSection('templates')}
            className="w-full flex items-center justify-between bg-white p-6 rounded-lg shadow-sm mb-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-500" />
              <div className="text-left">
                <h2 className="text-2xl font-bold">Post Templates</h2>
                <p className="text-gray-600">Copy-paste ready social media posts</p>
              </div>
            </div>
            {expandedSection === 'templates' ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </button>

          {expandedSection === 'templates' && (
            <div className="space-y-8">
              {/* Testimonial Posts */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Testimonial Posts
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {facebookPosts.testimonials.map((post, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded mb-3 font-sans">
                          {post.template}
                        </pre>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 italic">💡 {post.tips}</p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => copyToClipboard(post.template, `test-${idx}`)}
                          >
                            {copiedIndex === `test-${idx}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Promotional Posts */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Promotional Posts
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {facebookPosts.promotional.map((post, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded mb-3 font-sans">
                          {post.template}
                        </pre>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 italic">💡 {post.tips}</p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => copyToClipboard(post.template, `promo-${idx}`)}
                          >
                            {copiedIndex === `promo-${idx}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Educational Posts */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Educational Posts
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {facebookPosts.educational.map((post, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded mb-3 font-sans">
                          {post.template}
                        </pre>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 italic">💡 {post.tips}</p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => copyToClipboard(post.template, `edu-${idx}`)}
                          >
                            {copiedIndex === `edu-${idx}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Local Posts */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Local & Community Posts
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {facebookPosts.local.map((post, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded mb-3 font-sans">
                          {post.template}
                        </pre>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 italic">💡 {post.tips}</p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => copyToClipboard(post.template, `local-${idx}`)}
                          >
                            {copiedIndex === `local-${idx}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Seasonal Posts */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-500" />
                  Seasonal Posts
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {facebookPosts.seasonal.map((post, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded mb-3 font-sans">
                          {post.template}
                        </pre>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 italic">💡 {post.tips}</p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => copyToClipboard(post.template, `season-${idx}`)}
                          >
                            {copiedIndex === `season-${idx}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Facebook Ad Templates */}
        <section className="mb-12">
          <button 
            onClick={() => toggleSection('ads')}
            className="w-full flex items-center justify-between bg-white p-6 rounded-lg shadow-sm mb-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-red-500" />
              <div className="text-left">
                <h2 className="text-2xl font-bold">Facebook Ad Templates</h2>
                <p className="text-gray-600">Paid advertising copy ready to use</p>
              </div>
            </div>
            {expandedSection === 'ads' ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </button>

          {expandedSection === 'ads' && (
            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(adTemplates).map(([key, ad], idx) => (
                <Card key={key} className="overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
                    <h3 className="font-bold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()} Ad</h3>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-gray-500 uppercase font-semibold">Headline</label>
                        <p className="font-bold text-lg">{ad.headline}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 uppercase font-semibold">Primary Text</label>
                        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded mt-1 font-sans">
                          {ad.primaryText}
                        </pre>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <label className="text-xs text-gray-500 uppercase font-semibold">CTA</label>
                          <p className="font-medium">{ad.callToAction}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 uppercase font-semibold">Target Audience</label>
                        <p className="text-sm text-gray-600">{ad.targetAudience}</p>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4" 
                      variant="outline"
                      onClick={() => copyToClipboard(`Headline: ${ad.headline}\n\nPrimary Text:\n${ad.primaryText}\n\nCTA: ${ad.callToAction}\n\nTarget: ${ad.targetAudience}`, `ad-${idx}`)}
                    >
                      {copiedIndex === `ad-${idx}` ? <><Check className="w-4 h-4 mr-2" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> Copy All</>}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Best Practices */}
        <section>
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-gold" />
                Best Practices
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-gold mb-2">📸 Visual Content</h3>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• Use high-quality photos of your vehicles</li>
                    <li>• Share customer photos (with permission)</li>
                    <li>• Create short video testimonials</li>
                    <li>• Post NZ scenery with your branding</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-gold mb-2">⏰ Timing</h3>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• Best times: 7-9am, 12-2pm, 7-9pm</li>
                    <li>• Post consistently (3-5 times/week)</li>
                    <li>• Schedule posts in advance</li>
                    <li>• Respond to comments within 2 hours</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-gold mb-2">🎯 Engagement</h3>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• Ask questions in your posts</li>
                    <li>• Run polls and contests</li>
                    <li>• Share user-generated content</li>
                    <li>• Reply to ALL comments and messages</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-gold mb-2">💰 Ads Budget</h3>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• Start with $10-20/day</li>
                    <li>• Test different audiences</li>
                    <li>• Use retargeting for website visitors</li>
                    <li>• Track conversions with Meta Pixel</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default FacebookStrategy;
