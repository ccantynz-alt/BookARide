import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '../../components/ui/button';
import { Calendar, Clock, User, ArrowLeft } from 'lucide-react';
import { blogPosts } from '../../data/blogPosts';

const BlogPost = () => {
  const { postSlug } = useParams();
  const post = blogPosts.find((p) => p.slug === postSlug);

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

    </div>
  );
};

export default BlogPost;
