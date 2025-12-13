import React, { useState } from 'react';
import { Globe, ExternalLink, Eye, TrendingUp, Users, Flag, Search, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { SEODashboardTab } from './SEODashboardTab';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Landing pages data
const landingPages = [
  {
    id: 'china',
    country: 'China',
    nativeName: '中国',
    flag: '🇨🇳',
    path: '/visitors/china',
    language: 'Chinese (Simplified)',
    primaryColor: 'red',
    features: ['WeChat Pay', 'Alipay', 'Chinese Support'],
    targetAudience: 'Chinese tourists visiting New Zealand'
  },
  {
    id: 'japan',
    country: 'Japan',
    nativeName: '日本',
    flag: '🇯🇵',
    path: '/visitors/japan',
    language: 'Japanese',
    primaryColor: 'red',
    features: ['Japanese Support', 'JCB Cards'],
    targetAudience: 'Japanese tourists visiting New Zealand'
  },
  {
    id: 'korea',
    country: 'South Korea',
    nativeName: '한국',
    flag: '🇰🇷',
    path: '/visitors/korea',
    language: 'Korean',
    primaryColor: 'blue',
    features: ['Korean Support', 'KakaoPay'],
    targetAudience: 'Korean tourists visiting New Zealand'
  },
  {
    id: 'australia',
    country: 'Australia',
    nativeName: 'Australia',
    flag: '🇦🇺',
    path: '/visitors/australia',
    language: 'English',
    primaryColor: 'green',
    features: ['AUD Pricing', 'Local Support'],
    targetAudience: 'Australian tourists visiting New Zealand'
  },
  {
    id: 'usa',
    country: 'United States',
    nativeName: 'USA',
    flag: '🇺🇸',
    path: '/visitors/usa',
    language: 'English',
    primaryColor: 'blue',
    features: ['USD Reference', 'US Card Support'],
    targetAudience: 'American tourists visiting New Zealand'
  },
  {
    id: 'uk',
    country: 'United Kingdom',
    nativeName: 'UK',
    flag: '🇬🇧',
    path: '/visitors/uk',
    language: 'English',
    primaryColor: 'blue',
    features: ['GBP Reference', 'UK Support'],
    targetAudience: 'British tourists visiting New Zealand'
  },
  {
    id: 'germany',
    country: 'Germany',
    nativeName: 'Deutschland',
    flag: '🇩🇪',
    path: '/visitors/germany',
    language: 'German',
    primaryColor: 'yellow',
    features: ['German Support', 'SEPA Payments'],
    targetAudience: 'German tourists visiting New Zealand'
  },
  {
    id: 'france',
    country: 'France',
    nativeName: 'France',
    flag: '🇫🇷',
    path: '/visitors/france',
    language: 'French',
    primaryColor: 'blue',
    features: ['French Support', 'Euro Pricing'],
    targetAudience: 'French tourists visiting New Zealand'
  },
  {
    id: 'singapore',
    country: 'Singapore',
    nativeName: 'Singapore',
    flag: '🇸🇬',
    path: '/visitors/singapore',
    language: 'English/Chinese',
    primaryColor: 'red',
    features: ['SGD Reference', 'Multi-language'],
    targetAudience: 'Singaporean tourists visiting New Zealand'
  }
];

// Landing Pages Content Component
const LandingPagesContent = () => {
  const openPage = (path) => {
    window.open(`${window.location.origin}${path}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">International Landing Pages</h2>
          <p className="text-gray-600">Manage country-specific landing pages for international visitors</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            {landingPages.length} Active Pages
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Pages</p>
                <p className="text-2xl font-bold">{landingPages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Flag className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Languages</p>
                <p className="text-2xl font-bold">7</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Asian Markets</p>
                <p className="text-2xl font-bold">4</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">European Markets</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Landing Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {landingPages.map((page) => (
          <Card key={page.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{page.flag}</span>
                  <div>
                    <CardTitle className="text-lg">{page.country}</CardTitle>
                    <p className="text-sm text-gray-500">{page.nativeName}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Language</p>
                <p className="font-medium">{page.language}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Features</p>
                <div className="flex flex-wrap gap-1">
                  {page.features.map((feature, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">URL Path</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{page.path}</code>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openPage(page.path)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}${page.path}`);
                    alert('URL copied to clipboard!');
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hub Page Link */}
      <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Visitors Hub Page</h3>
              <p className="text-gray-300">Central hub linking to all international landing pages</p>
              <code className="text-sm bg-white/10 px-2 py-1 rounded mt-2 inline-block">/visitors</code>
            </div>
            <Button
              variant="secondary"
              onClick={() => openPage('/visitors')}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Hub
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Facebook Strategy Link */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-lg">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Facebook Marketing Strategy</h3>
                <p className="text-blue-100">Content calendar and posting strategy for international markets</p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => window.location.href = '/admin/facebook-strategy'}
            >
              View Strategy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Export - Combined Marketing Tab with Sub-tabs
export const LandingPagesTab = () => {
  const [activeSubTab, setActiveSubTab] = useState('landing-pages');
            {landingPages.length} Active Pages
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Pages</p>
                <p className="text-2xl font-bold">{landingPages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Flag className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Languages</p>
                <p className="text-2xl font-bold">7</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Asian Markets</p>
                <p className="text-2xl font-bold">4</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">European Markets</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Landing Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {landingPages.map((page) => (
          <Card key={page.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{page.flag}</span>
                  <div>
                    <CardTitle className="text-lg">{page.country}</CardTitle>
                    <p className="text-sm text-gray-500">{page.nativeName}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Language</p>
                <p className="font-medium">{page.language}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Features</p>
                <div className="flex flex-wrap gap-1">
                  {page.features.map((feature, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">URL Path</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{page.path}</code>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openPage(page.path)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}${page.path}`);
                    alert('URL copied to clipboard!');
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hub Page Link */}
      <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Visitors Hub Page</h3>
              <p className="text-gray-300">Central hub linking to all international landing pages</p>
              <code className="text-sm bg-white/10 px-2 py-1 rounded mt-2 inline-block">/visitors</code>
            </div>
            <Button
              variant="secondary"
              onClick={() => openPage('/visitors')}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Hub
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Facebook Strategy Link */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-lg">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Facebook Marketing Strategy</h3>
                <p className="text-blue-100">Content calendar and posting strategy for international markets</p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => window.location.href = '/admin/facebook-strategy'}
            >
              View Strategy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LandingPagesTab;
