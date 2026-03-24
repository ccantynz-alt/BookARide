import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Globe, FileText, AlertTriangle, CheckCircle,
  ExternalLink, RefreshCw, TrendingUp, Link2, Image,
  MapPin, Building, Route, Users, BarChart3, MousePointerClick,
  Eye, ArrowUp, ArrowDown, Minus, Clock, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
    // New suburbs added
    { path: '/suburbs/manukau', title: 'Manukau', priority: '0.8', hasSchema: true },
    { path: '/suburbs/papakura', title: 'Papakura', priority: '0.8', hasSchema: true },
    { path: '/suburbs/botany', title: 'Botany', priority: '0.8', hasSchema: true },
    { path: '/suburbs/howick', title: 'Howick', priority: '0.8', hasSchema: true },
    { path: '/suburbs/pakuranga', title: 'Pakuranga', priority: '0.8', hasSchema: true },
    { path: '/suburbs/henderson', title: 'Henderson', priority: '0.8', hasSchema: true },
    { path: '/suburbs/new-lynn', title: 'New Lynn', priority: '0.8', hasSchema: true },
    { path: '/suburbs/mt-eden', title: 'Mt Eden', priority: '0.8', hasSchema: true },
    { path: '/suburbs/ponsonby', title: 'Ponsonby', priority: '0.8', hasSchema: true },
    { path: '/suburbs/remuera', title: 'Remuera', priority: '0.8', hasSchema: true },
    // Expansion suburbs
    { path: '/suburbs/pukekohe', title: 'Pukekohe', priority: '0.8', hasSchema: true },
    { path: '/suburbs/drury', title: 'Drury', priority: '0.8', hasSchema: true },
    { path: '/suburbs/flat-bush', title: 'Flat Bush', priority: '0.8', hasSchema: true },
    { path: '/suburbs/te-atatu', title: 'Te Atatu', priority: '0.8', hasSchema: true },
    { path: '/suburbs/massey', title: 'Massey', priority: '0.8', hasSchema: true },
    { path: '/suburbs/papakura', title: 'Papakura', priority: '0.8', hasSchema: true },
    { path: '/suburbs/onehunga', title: 'Onehunga', priority: '0.8', hasSchema: true },
    { path: '/suburbs/mount-roskill', title: 'Mount Roskill', priority: '0.8', hasSchema: true },
    { path: '/suburbs/royal-oak', title: 'Royal Oak', priority: '0.8', hasSchema: true },
    { path: '/suburbs/beachlands', title: 'Beachlands', priority: '0.8', hasSchema: true },
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

// New suburb suggestions for expansion (future opportunities)
const suggestedSuburbs = [
  { name: 'Mangere Bridge', region: 'South Auckland', population: '8,000+' },
  { name: 'Takanini', region: 'South Auckland', population: '20,000+' },
  { name: 'Karaka', region: 'South Auckland', population: '5,000+' },
  { name: 'Kumeu', region: 'North-West Auckland', population: '12,000+' },
  { name: 'Huapai', region: 'North-West Auckland', population: '8,000+' },
  { name: 'Warkworth', region: 'Rodney', population: '10,000+' },
  { name: 'Helensville', region: 'Rodney', population: '5,000+' },
  { name: 'Clevedon', region: 'Eastern Auckland', population: '3,000+' },
  { name: 'Whitford', region: 'Eastern Auckland', population: '4,000+' },
  { name: 'Swanson', region: 'West Auckland', population: '8,000+' },
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

// Search Console Performance Panel
const SearchConsolePanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(28);
  const [tab, setTab] = useState('queries');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API}/seo/search-console/performance?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      console.error('Search Console fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <Card><CardContent className="p-8 text-center">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
        <p className="text-gray-500">Loading Search Console data...</p>
      </CardContent></Card>
    );
  }

  if (!data?.configured) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800">Search Console Not Connected</h3>
              <p className="text-sm text-amber-700 mt-1">
                Add your <code className="bg-amber-100 px-1 rounded">GOOGLE_SERVICE_ACCOUNT_JSON</code> env var in Render
                with Search Console access to see real ranking data.
              </p>
              <div className="mt-3 p-3 bg-white rounded-lg border border-amber-200">
                <p className="text-xs text-gray-600 font-medium mb-1">Setup steps:</p>
                <ol className="text-xs text-gray-600 list-decimal list-inside space-y-1">
                  <li>Go to Google Cloud Console &rarr; Service Accounts</li>
                  <li>Add Search Console access to your existing service account</li>
                  <li>In Search Console, add the service account email as a user</li>
                  <li>The GOOGLE_SERVICE_ACCOUNT_JSON env var (already set for Calendar) should work</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">API Error: {data.error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { totals = {}, queries = [], pages = [], daily = [] } = data;

  const PositionBadge = ({ position }) => {
    const color = position <= 3 ? 'bg-green-100 text-green-700' :
                  position <= 10 ? 'bg-blue-100 text-blue-700' :
                  position <= 20 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700';
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{position}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Period selector + totals */}
      <div className="flex items-center gap-2 mb-4">
        {[7, 28, 90].map(d => (
          <Button key={d} size="sm" variant={days === d ? 'default' : 'outline'}
            onClick={() => setDays(d)} className={days === d ? 'bg-blue-600 text-white' : ''}>
            {d}d
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3">
          <div className="flex items-center gap-2">
            <MousePointerClick className="w-4 h-4 text-blue-600" />
            <div><p className="text-xs text-gray-500">Clicks</p><p className="text-xl font-bold">{totals.clicks?.toLocaleString() || 0}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-600" />
            <div><p className="text-xs text-gray-500">Impressions</p><p className="text-xl font-bold">{totals.impressions?.toLocaleString() || 0}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-green-600" />
            <div><p className="text-xs text-gray-500">Avg CTR</p><p className="text-xl font-bold">{totals.ctr || 0}%</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <div><p className="text-xs text-gray-500">Avg Position</p><p className="text-xl font-bold">{totals.position || 0}</p></div>
          </div>
        </CardContent></Card>
      </div>

      {/* Daily chart (simple bar representation) */}
      {daily.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Daily Clicks (last {days} days)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-0.5 h-20">
              {daily.map((d, i) => {
                const maxClicks = Math.max(...daily.map(x => x.clicks), 1);
                const height = Math.max((d.clicks / maxClicks) * 100, 2);
                return (
                  <div key={i} className="flex-1 bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors"
                    style={{ height: `${height}%` }}
                    title={`${d.key}: ${d.clicks} clicks`}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queries / Pages toggle */}
      <div className="flex gap-2">
        <Button size="sm" variant={tab === 'queries' ? 'default' : 'outline'} onClick={() => setTab('queries')}>
          Top Queries ({queries.length})
        </Button>
        <Button size="sm" variant={tab === 'pages' ? 'default' : 'outline'} onClick={() => setTab('pages')}>
          Top Pages ({pages.length})
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">{tab === 'queries' ? 'Query' : 'Page'}</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Clicks</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Impressions</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">CTR</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Position</th>
                </tr>
              </thead>
              <tbody>
                {(tab === 'queries' ? queries : pages).map((row, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium truncate max-w-xs">
                      {tab === 'pages' ? row.key.replace('https://bookaride.co.nz', '') || '/' : row.key}
                    </td>
                    <td className="text-right px-4 py-2">{row.clicks.toLocaleString()}</td>
                    <td className="text-right px-4 py-2 text-gray-500">{row.impressions.toLocaleString()}</td>
                    <td className="text-right px-4 py-2">{row.ctr}%</td>
                    <td className="text-right px-4 py-2"><PositionBadge position={row.position} /></td>
                  </tr>
                ))}
                {(tab === 'queries' ? queries : pages).length === 0 && (
                  <tr><td colSpan="5" className="text-center py-8 text-gray-400">No data available for this period</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Content Freshness Controls
const FreshnessPanel = () => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const runFreshness = async () => {
    setRunning(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(`${API}/admin/run-freshness-update`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(res.data);
      toast.success(`Freshness update complete: ${res.data.pages_refreshed || 0} pages refreshed`);
    } catch (err) {
      toast.error('Freshness update failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Content Freshness Agent
        </CardTitle>
        <p className="text-sm text-gray-600">Automatically runs daily at 4 AM NZ. Updates SEO page timestamps and review counts.</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Button onClick={runFreshness} disabled={running} className="bg-amber-500 hover:bg-amber-600 text-white">
            {running ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Running...</> : <><Zap className="w-4 h-4 mr-2" /> Run Now</>}
          </Button>
          {result && (
            <span className="text-sm text-green-600">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              {result.pages_refreshed} pages refreshed
            </span>
          )}
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">What it does</p>
            <p className="text-sm">Refreshes SEO page timestamps for pages older than 7 days</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Review rotation</p>
            <p className="text-sm">Updates review count from real completed bookings</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Schedule</p>
            <p className="text-sm">Daily at 4:00 AM NZ time (automatic)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

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
        <TabsList className="grid w-full grid-cols-5 md:grid-cols-9">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="freshness">Freshness</TabsTrigger>
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

        <TabsContent value="rankings" className="space-y-4">
          <SearchConsolePanel />
        </TabsContent>

        <TabsContent value="freshness" className="space-y-4">
          <FreshnessPanel />
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
                <PageCard key={idx} page={page} onOpenPage={openPage} />
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
                <PageCard key={idx} page={page} onOpenPage={openPage} />
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
                <PageCard key={idx} page={page} onOpenPage={openPage} />
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
                <PageCard key={idx} page={page} onOpenPage={openPage} />
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
                <PageCard key={idx} page={page} onOpenPage={openPage} />
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
