import React, { useState, useEffect } from 'react';
import { 
  Search, Globe, FileText, AlertTriangle, CheckCircle, 
  ExternalLink, RefreshCw, TrendingUp, Link2, Image,
  MapPin, Building, Route, Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

// All SEO pages data
const seoPages = {
  main: [
    { path: '/', title: 'Home', priority: '1.0', hasSchema: true },
    { path: '/book-now', title: 'Book Now', priority: '1.0', hasSchema: true },
    { path: '/services', title: 'Services', priority: '0.9', hasSchema: true },
    { path: '/about', title: 'About Us', priority: '0.8', hasSchema: true },
    { path: '/contact', title: 'Contact', priority: '0.9', hasSchema: true },
    { path: '/hobbiton-transfers', title: 'Hobbiton Transfers', priority: '0.8', hasSchema: true },
    { path: '/cruise-transfers', title: 'Cruise Transfers', priority: '0.8', hasSchema: true },
  ],
  routes: [
    { path: '/auckland-airport-shuttle', title: 'Auckland Airport Shuttle', priority: '0.9', hasSchema: true },
    { path: '/auckland-airport-to-whangaparaoa', title: 'Airport to Whangaparaoa', priority: '0.8', hasSchema: true },
    { path: '/auckland-airport-to-orewa', title: 'Airport to Orewa', priority: '0.8', hasSchema: true },
    { path: '/auckland-airport-to-north-shore', title: 'Airport to North Shore', priority: '0.8', hasSchema: true },
    { path: '/auckland-airport-to-hibiscus-coast', title: 'Airport to Hibiscus Coast', priority: '0.8', hasSchema: true },
    { path: '/auckland-airport-to-silverdale', title: 'Airport to Silverdale', priority: '0.8', hasSchema: true },
    { path: '/auckland-airport-to-gulf-harbour', title: 'Airport to Gulf Harbour', priority: '0.8', hasSchema: true },
    { path: '/auckland-airport-to-albany', title: 'Airport to Albany', priority: '0.8', hasSchema: true },
    { path: '/auckland-airport-to-takapuna', title: 'Airport to Takapuna', priority: '0.8', hasSchema: true },
    { path: '/auckland-airport-to-devonport', title: 'Airport to Devonport', priority: '0.8', hasSchema: true },
    { path: '/auckland-airport-to-matakana', title: 'Airport to Matakana', priority: '0.8', hasSchema: true },
    { path: '/auckland-airport-to-city', title: 'Airport to City', priority: '0.9', hasSchema: true },
    { path: '/auckland-cruise-terminal-transfer', title: 'Cruise Terminal Transfer', priority: '0.8', hasSchema: true },
  ],
  suburbs: [
    { path: '/suburbs', title: 'Suburbs Directory', priority: '0.9', hasSchema: true },
    { path: '/suburbs/auckland-cbd', title: 'Auckland CBD', priority: '0.9', hasSchema: true },
    { path: '/suburbs/newmarket', title: 'Newmarket', priority: '0.8', hasSchema: true },
    { path: '/suburbs/parnell', title: 'Parnell', priority: '0.8', hasSchema: true },
    { path: '/suburbs/takapuna', title: 'Takapuna', priority: '0.8', hasSchema: true },
    { path: '/suburbs/albany', title: 'Albany', priority: '0.8', hasSchema: true },
    { path: '/suburbs/devonport', title: 'Devonport', priority: '0.8', hasSchema: true },
    { path: '/suburbs/orewa', title: 'Orewa', priority: '0.9', hasSchema: true },
    { path: '/suburbs/whangaparaoa', title: 'Whangaparaoa', priority: '0.9', hasSchema: true },
    { path: '/suburbs/silverdale', title: 'Silverdale', priority: '0.8', hasSchema: true },
    { path: '/suburbs/gulf-harbour', title: 'Gulf Harbour', priority: '0.8', hasSchema: true },
    { path: '/suburbs/red-beach', title: 'Red Beach', priority: '0.8', hasSchema: true },
  ],
  international: [
    { path: '/visitors', title: 'Visitors Hub', priority: '0.9', hasSchema: true, lang: 'en' },
    { path: '/visitors/china', title: 'Chinese Visitors', priority: '0.8', hasSchema: true, lang: 'zh' },
    { path: '/visitors/japan', title: 'Japanese Visitors', priority: '0.8', hasSchema: true, lang: 'ja' },
    { path: '/visitors/korea', title: 'Korean Visitors', priority: '0.8', hasSchema: true, lang: 'ko' },
    { path: '/visitors/australia', title: 'Australian Visitors', priority: '0.8', hasSchema: true, lang: 'en' },
    { path: '/visitors/usa', title: 'US Visitors', priority: '0.9', hasSchema: true, lang: 'en' },
    { path: '/visitors/uk', title: 'UK Visitors', priority: '0.8', hasSchema: true, lang: 'en' },
    { path: '/visitors/germany', title: 'German Visitors', priority: '0.8', hasSchema: true, lang: 'de' },
    { path: '/visitors/france', title: 'French Visitors', priority: '0.8', hasSchema: true, lang: 'fr' },
    { path: '/visitors/singapore', title: 'Singapore Visitors', priority: '0.8', hasSchema: true, lang: 'en' },
  ],
  blog: [
    { path: '/blog', title: 'Blog', priority: '0.9', hasSchema: true },
    { path: '/blog/auckland-airport-to-cbd-guide', title: 'Airport to CBD Guide', priority: '0.8', hasSchema: true },
    { path: '/blog/auckland-airport-terminal-guide', title: 'Terminal Guide', priority: '0.8', hasSchema: true },
    { path: '/blog/best-time-book-airport-shuttle', title: 'Best Time to Book', priority: '0.7', hasSchema: true },
    { path: '/blog/traveling-with-kids-auckland-airport', title: 'Traveling with Kids', priority: '0.7', hasSchema: true },
    { path: '/blog/north-shore-to-airport-guide', title: 'North Shore Guide', priority: '0.7', hasSchema: true },
    { path: '/blog/auckland-airport-shuttle-vs-taxi', title: 'Shuttle vs Taxi', priority: '0.7', hasSchema: true },
  ],
  hotels: [
    { path: '/hotels', title: 'Hotels Directory', priority: '0.9', hasSchema: true },
    { path: '/hotels/skycity-grand-hotel', title: 'SkyCity Grand Hotel', priority: '0.8', hasSchema: true },
    { path: '/hotels/sofitel-auckland-viaduct', title: 'Sofitel Viaduct', priority: '0.8', hasSchema: true },
    { path: '/hotels/hilton-auckland', title: 'Hilton Auckland', priority: '0.8', hasSchema: true },
    { path: '/hotels/park-hyatt-auckland', title: 'Park Hyatt Auckland', priority: '0.8', hasSchema: true },
  ],
  compare: [
    { path: '/compare', title: 'Compare Services', priority: '0.9', hasSchema: true },
    { path: '/bookaride-vs-supershuttle', title: 'vs SuperShuttle', priority: '0.8', hasSchema: true },
    { path: '/bookaride-vs-uber', title: 'vs Uber', priority: '0.8', hasSchema: true },
    { path: '/bookaride-vs-taxi', title: 'vs Taxi', priority: '0.8', hasSchema: true },
  ]
};

// New suburb suggestions for expansion
const suggestedSuburbs = [
  { name: 'Manukau', region: 'South Auckland', population: '85,000+' },
  { name: 'Papakura', region: 'South Auckland', population: '50,000+' },
  { name: 'Botany', region: 'East Auckland', population: '60,000+' },
  { name: 'Henderson', region: 'West Auckland', population: '70,000+' },
  { name: 'New Lynn', region: 'West Auckland', population: '30,000+' },
  { name: 'Mt Eden', region: 'Central Auckland', population: '15,000+' },
  { name: 'Ponsonby', region: 'Central Auckland', population: '10,000+' },
  { name: 'Remuera', region: 'Central Auckland', population: '20,000+' },
  { name: 'Howick', region: 'East Auckland', population: '40,000+' },
  { name: 'Pakuranga', region: 'East Auckland', population: '25,000+' },
];

// PageCard Component - moved outside to prevent re-render issues
const PageCard = ({ page, onOpenPage }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${page.hasSchema ? 'bg-green-500' : 'bg-yellow-500'}`} />
      <div>
        <p className="font-medium text-sm">{page.title}</p>
        <p className="text-xs text-gray-500">{page.path}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-xs">P: {page.priority}</Badge>
      {page.lang && <Badge variant="secondary" className="text-xs">{page.lang}</Badge>}
      <Button variant="ghost" size="sm" onClick={() => onOpenPage(page.path)}>
        <ExternalLink className="w-3 h-3" />
      </Button>
    </div>
  </div>
);

export const SEODashboardTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('overview');

  const totalPages = Object.values(seoPages).flat().length;
  const pagesWithSchema = Object.values(seoPages).flat().filter(p => p.hasSchema).length;

  const filterPages = (pages) => {
    if (!searchTerm) return pages;
    return pages.filter(p => 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.path.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const openPage = (path) => {
    window.open(`https://bookaride.co.nz${path}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SEO Dashboard</h2>
          <p className="text-gray-600">Monitor and manage your site&apos;s SEO performance</p>
        </div>
        <Button variant="outline" onClick={() => window.open('https://bookaride.co.nz/sitemap.xml', '_blank')}>
          <FileText className="w-4 h-4 mr-2" />
          View Sitemap
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Pages</p>
                <p className="text-2xl font-bold">{totalPages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">With Schema</p>
                <p className="text-2xl font-bold">{pagesWithSchema}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Route className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Route Pages</p>
                <p className="text-2xl font-bold">{seoPages.routes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <MapPin className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Suburbs</p>
                <p className="text-2xl font-bold">{seoPages.suburbs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Users className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">International</p>
                <p className="text-2xl font-bold">{seoPages.international.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search pages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="overview" value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="suburbs">Suburbs</TabsTrigger>
          <TabsTrigger value="international">International</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
          <TabsTrigger value="hotels">Hotels</TabsTrigger>
          <TabsTrigger value="expand">Expand</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Main Pages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {filterPages(seoPages.main).map((page, idx) => (
                  <PageCard key={idx} page={page} onOpenPage={openPage} />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparison Pages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {filterPages(seoPages.compare).map((page, idx) => (
                  <PageCard key={idx} page={page} onOpenPage={openPage} />
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Route className="w-5 h-5" />
                Airport Route Pages ({seoPages.routes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filterPages(seoPages.routes).map((page, idx) => (
                <PageCard key={idx} page={page} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suburbs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Suburb Pages ({seoPages.suburbs.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filterPages(seoPages.suburbs).map((page, idx) => (
                <PageCard key={idx} page={page} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="international" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5" />
                International Landing Pages ({seoPages.international.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filterPages(seoPages.international).map((page, idx) => (
                <PageCard key={idx} page={page} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blog" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Blog Posts ({seoPages.blog.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filterPages(seoPages.blog).map((page, idx) => (
                <PageCard key={idx} page={page} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hotels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="w-5 h-5" />
                Hotel Pages ({seoPages.hotels.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filterPages(seoPages.hotels).map((page, idx) => (
                <PageCard key={idx} page={page} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expand" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Suggested Expansion - New Suburbs
              </CardTitle>
              <p className="text-sm text-gray-600">High-potential suburbs not yet covered</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedSuburbs.map((suburb, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div>
                      <p className="font-medium">{suburb.name}</p>
                      <p className="text-xs text-gray-600">{suburb.region} • Pop: {suburb.population}</p>
                    </div>
                    <Badge variant="outline" className="text-amber-600 border-amber-400">
                      Not Created
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>SEO Tip:</strong> Creating location-specific pages for these suburbs can improve local search rankings and capture more organic traffic from potential customers in these areas.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold mb-1">Quick SEO Actions</h3>
              <p className="text-gray-300 text-sm">Tools to help improve your search presence</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => window.open('https://search.google.com/search-console', '_blank')}>
                Google Search Console
              </Button>
              <Button variant="secondary" size="sm" onClick={() => window.open('https://www.google.com/webmasters/tools/submit-url', '_blank')}>
                Submit to Google
              </Button>
              <Button variant="secondary" size="sm" onClick={() => window.open('https://bookaride.co.nz/robots.txt', '_blank')}>
                View robots.txt
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SEODashboardTab;
