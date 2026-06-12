import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '../../components/ui/card';
import { Calendar, Clock, ArrowRight, Tag } from 'lucide-react';
import { blogPosts } from '../../data/blogPosts';

const BlogIndex = () => {
  const featuredPosts = blogPosts.filter(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Auckland Airport Travel Blog | Tips & Guides | BookaRide</title>
        <meta name="description" content="Auckland Airport travel tips, guides, and information. Learn about airport transfers, terminals, and travel advice for visitors to Auckland." />
        <link rel="canonical" href="https://bookaride.co.nz/blog" />
      </Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-br from-black via-gray-900 to-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Auckland Airport <span className="text-gold">Travel Blog</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Tips, guides, and information to make your Auckland Airport journey smooth and stress-free.
          </p>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Featured Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredPosts.map((post) => (
              <Link key={post.slug} to={`/blog/${post.slug}`}>
                <Card className="hover:shadow-lg transition-all cursor-pointer h-full overflow-hidden">
                  <div className="h-48 bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
                    <span className="text-6xl">✈️</span>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-sm text-gold mb-2">
                      <Tag className="w-4 h-4" />
                      {post.category}
                    </div>
                    <h3 className="text-xl font-bold mb-2 hover:text-gold transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {post.date}</span>
                      <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {post.readTime}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* All Posts */}
      {regularPosts.length > 0 && (
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">All Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
              <Link key={post.slug} to={`/blog/${post.slug}`}>
                <Card className="hover:shadow-lg hover:border-gold transition-all cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-sm text-gold mb-2">
                      <Tag className="w-4 h-4" />
                      {post.category}
                    </div>
                    <h3 className="font-bold mb-2 hover:text-gold transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{post.date}</span>
                      <span>{post.readTime}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Newsletter CTA */}
      <section className="py-16 bg-gold">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">
            Need an Auckland Airport Transfer?
          </h2>
          <p className="text-black/80 mb-8">
            Book your door-to-door shuttle service now. Fixed pricing, 24/7 availability.
          </p>
          <Link to="/book-now">
            <button className="bg-black hover:bg-gray-900 text-white font-bold px-8 py-3 rounded-lg">
              Book Now <ArrowRight className="w-5 h-5 inline ml-2" />
            </button>
          </Link>
        </div>
      </section>

    </div>
  );
};

export default BlogIndex;
