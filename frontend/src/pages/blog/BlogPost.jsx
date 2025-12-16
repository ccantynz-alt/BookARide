import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '../../components/ui/button';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Calendar, Clock, User, ArrowLeft, Share2 } from 'lucide-react';

// Blog post content
const blogContent = {
  'auckland-airport-to-cbd-guide': {
    title: 'How to Get from Auckland Airport to CBD: Complete 2024 Guide',
    category: 'Travel Guide',
    author: 'BookaRide Team',
    date: '2024-12-01',
    readTime: '8 min read',
    content: `
      <h2>Overview</h2>
      <p>Auckland Airport (AKL) is located about 21 kilometers south of Auckland's city center. Getting from the airport to the CBD is straightforward, with several transport options available to suit different budgets and preferences.</p>
      
      <h2>Transport Options Compared</h2>
      
      <h3>1. Airport Shuttle (Recommended)</h3>
      <p><strong>Cost:</strong> Get instant quote online</p>
      <p><strong>Time:</strong> 25-35 minutes</p>
      <p><strong>Best for:</strong> Families, groups, travelers with luggage</p>
      <p>Airport shuttles like BookaRide offer door-to-door service at fixed prices. You're picked up from the airport and dropped directly at your accommodation. This is the most convenient option, especially if you have luggage or are traveling with family.</p>
      
      <h3>2. Taxi/Rideshare</h3>
      <p><strong>Cost:</strong> $70-$120 (variable)</p>
      <p><strong>Time:</strong> 25-40 minutes</p>
      <p><strong>Best for:</strong> Solo travelers, business trips</p>
      <p>Taxis are available outside both terminals. Uber and Ola also operate at Auckland Airport. Note that prices can surge during peak times.</p>
      
      <h3>3. SkyBus</h3>
      <p><strong>Cost:</strong> $18 (one-way)</p>
      <p><strong>Time:</strong> 45-60 minutes</p>
      <p><strong>Best for:</strong> Budget travelers, solo travelers</p>
      <p>The SkyBus runs every 10-15 minutes between the airport and the city center. It stops at key locations including Britomart and SkyCity.</p>
      
      <h3>4. Rental Car</h3>
      <p><strong>Cost:</strong> From $40/day</p>
      <p><strong>Best for:</strong> Extended stays, exploring beyond Auckland</p>
      <p>Multiple rental car companies operate at Auckland Airport. However, parking in the CBD can be expensive.</p>
      
      <h2>Tips for a Smooth Journey</h2>
      <ul>
        <li><strong>Book in advance:</strong> Pre-booking your transfer ensures availability and often better prices</li>
        <li><strong>Allow extra time:</strong> Traffic can be unpredictable, especially during morning and evening rush hours</li>
        <li><strong>Consider your luggage:</strong> Shuttles and taxis are better if you have multiple bags</li>
        <li><strong>Check for deals:</strong> Many shuttle services offer discounts for round-trip bookings</li>
      </ul>
      
      <h2>Why Choose a Shuttle?</h2>
      <p>For most travelers, an airport shuttle offers the best balance of convenience, comfort, and value. With fixed pricing, you know exactly what you'll pay - no surprises. Plus, door-to-door service means no dragging luggage through bus stations or train platforms.</p>
      
      <h2>Book Your Auckland Airport Transfer</h2>
      <p>Ready to book? BookaRide offers 24/7 airport transfers across Auckland with fixed pricing and professional drivers. Book online in minutes and have your ride confirmed before you land.</p>
    `
  },
  'auckland-airport-terminal-guide': {
    title: 'Auckland Airport Terminal Guide: Domestic vs International',
    category: 'Airport Info',
    author: 'BookaRide Team',
    date: '2024-11-28',
    readTime: '6 min read',
    content: `
      <h2>Auckland Airport Layout</h2>
      <p>Auckland Airport has two main terminals: the International Terminal and the Domestic Terminal. While they're connected, understanding the layout helps you navigate more efficiently.</p>
      
      <h2>International Terminal</h2>
      <p>The International Terminal handles all overseas flights. It features:</p>
      <ul>
        <li>Check-in counters for all international airlines</li>
        <li>Customs and biosecurity</li>
        <li>Duty-free shopping</li>
        <li>Currency exchange</li>
        <li>Multiple dining options</li>
        <li>Premium lounges</li>
      </ul>
      
      <h2>Domestic Terminal</h2>
      <p>The Domestic Terminal serves flights within New Zealand. Key features:</p>
      <ul>
        <li>Air New Zealand regional services</li>
        <li>Jetstar domestic flights</li>
        <li>Regional airlines</li>
        <li>Cafés and quick-service restaurants</li>
      </ul>
      
      <h2>Getting Between Terminals</h2>
      <p>The terminals are about a 10-minute walk apart. A free shuttle bus also runs between them every 5-10 minutes. If you have a connecting flight between domestic and international, allow at least 2 hours for the transfer.</p>
      
      <h2>Shuttle Pickup Points</h2>
      <p><strong>International Terminal:</strong> Door 8 on the ground floor (arrivals level)</p>
      <p><strong>Domestic Terminal:</strong> Outside the main entrance</p>
      <p>BookaRide drivers will meet you at these designated pickup points with a name sign.</p>
    `
  }
};

const BlogPost = () => {
  const { postSlug } = useParams();
  const post = blogContent[postSlug];

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Article not found</h1>
          <Link to="/blog" className="text-gold hover:underline">Back to Blog</Link>
        </div>
      </div>
    );
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': post.title,
    'author': {
      '@type': 'Organization',
      'name': post.author
    },
    'datePublished': post.date,
    'publisher': {
      '@type': 'Organization',
      'name': 'BookaRide NZ'
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{post.title} | BookaRide Blog</title>
        <meta name="description" content={post.title} />
        <link rel="canonical" href={`https://bookaride.co.nz/blog/${postSlug}`} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <Header />

      {/* Article Header */}
      <section className="bg-gradient-to-br from-black via-gray-900 to-black text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/blog" className="inline-flex items-center text-gold hover:underline mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
          </Link>
          <span className="bg-gold text-black text-sm font-bold px-3 py-1 rounded mb-4 inline-block">
            {post.category}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold mb-6">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-gray-400">
            <span className="flex items-center"><User className="w-4 h-4 mr-2" /> {post.author}</span>
            <span className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> {post.date}</span>
            <span className="flex items-center"><Clock className="w-4 h-4 mr-2" /> {post.readTime}</span>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <article className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div 
            className="prose prose-lg max-w-none
              prose-headings:font-bold prose-headings:text-gray-900
              prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
              prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
              prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
              prose-li:text-gray-700 prose-li:mb-2
              prose-strong:text-gray-900"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* CTA */}
          <div className="mt-12 p-8 bg-gold rounded-lg text-center">
            <h3 className="text-2xl font-bold text-black mb-4">
              Ready to Book Your Auckland Airport Transfer?
            </h3>
            <p className="text-black/80 mb-6">
              Fixed pricing, 24/7 service, door-to-door convenience.
            </p>
            <Link to="/book-now">
              <Button size="lg" className="bg-black hover:bg-gray-900 text-white font-bold">
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogPost;
