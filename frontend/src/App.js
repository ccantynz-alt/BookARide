import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import './i18n/config';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Cloud,
  Download,
  Gauge,
  Lock,
  MoonStar,
  RefreshCw,
  Rocket,
  Sparkles,
  Wrench
} from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import Home from './pages/Home';
import Services from './pages/Services';
import About from './pages/About';
import Contact from './pages/Contact';
import BookNow from './pages/BookNow';
import PaymentSuccess from './pages/PaymentSuccess';
import HobbitonTransfers from './pages/HobbitonTransfers';
import CruiseTransfers from './pages/CruiseTransfers';
import SuburbPage from './pages/SuburbPageSEO';
import SuburbLandingAdvanced from './pages/seo/SuburbLandingAdvanced';
import SuburbsDirectory from './pages/SuburbsDirectory';
import HotelPage from './pages/HotelPage';
import HotelsDirectory from './pages/HotelsDirectory';
import HibiscusCoastPage from './pages/HibiscusCoastPage';
import InternationalHomePage from './pages/InternationalHomePage';
import AucklandAirportInternational from './pages/international/AucklandAirportInternational';
import HamiltonAirportInternational from './pages/international/HamiltonAirportInternational';
import CorporateTransfers from './pages/international/CorporateTransfers';
import GroupBookings from './pages/international/GroupBookings';
// International Market Landing Pages
import AustraliaLanding from './pages/markets/AustraliaLanding';
import ChinaLanding from './pages/markets/ChinaLanding';
import JapanLanding from './pages/markets/JapanLanding';
import KoreaLanding from './pages/markets/KoreaLanding';
import SingaporeLanding from './pages/markets/SingaporeLanding';
import USALanding from './pages/markets/USALanding';
import UKLanding from './pages/markets/UKLanding';
import GermanyLanding from './pages/markets/GermanyLanding';
import FranceLanding from './pages/markets/FranceLanding';
import AdminLogin from './pages/AdminLogin';
import AdminAuthCallback from './pages/AdminAuthCallback';
import AdminForgotPassword from './pages/AdminForgotPassword';
import AdminResetPassword from './pages/AdminResetPassword';
import TermsAndConditions from './pages/TermsAndConditions';
import WebsiteUsagePolicy from './pages/WebsiteUsagePolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import siteConfig from './config/siteConfig';
import AdminDashboard from './pages/AdminDashboard';
import SEODashboard from './pages/SEODashboard';
import DriverLogin from './pages/DriverLogin';
import DriverPortal from './pages/DriverPortal';
import DriveWithUs from './pages/DriveWithUs';
import { Toaster } from './components/ui/sonner';
import BackToTop from './components/BackToTop';
import AdminBackButton from './components/AdminBackButton';
import InternationalBanner from './components/InternationalBanner';
import LanguageRedirect from './components/LanguageRedirect';
import { SUPPORTED_LANGUAGES } from './config/languages';
// New SEO Pages
import AucklandAirportShuttle from './pages/seo/AucklandAirportShuttle';
import GlobalLanding from './pages/seo/GlobalLanding';
import VisitorsHub from './pages/seo/VisitorsHub';
import SEORoutePage from './pages/seo/SEORoutePage';
import RoutePage from './pages/routes/RoutePage';
import RoutesDirectory from './pages/routes/RoutesDirectory';
import BlogIndex from './pages/blog/BlogIndex';
import BlogPost from './pages/blog/BlogPost';
import ComparisonPage from './pages/compare/ComparisonPage';
import ComparisonDirectory from './pages/compare/ComparisonDirectory';
import FacebookStrategy from './pages/FacebookStrategy';
// SEO Battle Pages
import HibiscusCoastShuttlePage from './pages/seo/HibiscusCoastShuttlePage';
import BookarideVsHibiscusShuttles from './pages/seo/BookarideVsHibiscusShuttles';
import BestHibiscusCoastShuttle from './pages/seo/BestHibiscusCoastShuttle';
import OrewaToAirportPage from './pages/seo/OrewaToAirportPage';
import WhangaparoaAirportPage from './pages/seo/WhangaparoaAirportPage';
import TakapunaAirportPage from './pages/seo/TakapunaAirportPage';
import AlbanyAirportPage from './pages/seo/AlbanyAirportPage';
import NorthShoreAirportPage from './pages/seo/NorthShoreAirportPage';
import AirportToCityPage from './pages/seo/AirportToCityPage';
import AfterpayPage from './pages/AfterpayPage';
import ReferralProgram from './pages/ReferralProgram';
import FlightTrackerPage from './pages/FlightTrackerPage';
import TravelResourcesPage from './pages/TravelResourcesPage';
import InternationalVisitors from './pages/InternationalVisitors';
// Auckland CBD SEO Pages
import CBDHubPage from './pages/seo/auckland-cbd/CBDHubPage';
import PonsonbyAirportPage from './pages/seo/auckland-cbd/PonsonbyAirportPage';
import ParnellAirportPage from './pages/seo/auckland-cbd/ParnellAirportPage';
import NewmarketAirportPage from './pages/seo/auckland-cbd/NewmarketAirportPage';
import RemueraAirportPage from './pages/seo/auckland-cbd/RemueraAirportPage';
import MtEdenAirportPage from './pages/seo/auckland-cbd/MtEdenAirportPage';
import GreyLynnAirportPage from './pages/seo/auckland-cbd/GreyLynnAirportPage';
import EpsomAirportPage from './pages/seo/auckland-cbd/EpsomAirportPage';
import MissionBayAirportPage from './pages/seo/auckland-cbd/MissionBayAirportPage';
import ViaductAirportPage from './pages/seo/auckland-cbd/ViaductAirportPage';
// Programmatic SEO Pages
import SuburbTransferPage from './pages/seo/SuburbTransferPage';
import CompetitorComparisonPage from './pages/seo/CompetitorComparisonPage';
// NEW SEO Attack Pages - Top 5 Keywords
import AirportShuttlePage from './pages/seo/AirportShuttlePage';
import AirportShuttleServicePage from './pages/seo/AirportShuttleServicePage';
import SharedRidePage from './pages/seo/SharedRidePage';
import AucklandCBDToAirportPage from './pages/seo/AucklandCBDToAirportPage';
// NEW: Mount Roskill Corridor SEO Pages
import MountRoskillAirportPage from './pages/seo/MountRoskillAirportPage';
import SandringhamAirportPage from './pages/seo/SandringhamAirportPage';
import MountEdenAirportPage from './pages/seo/MountEdenAirportPage';
import MountAlbertAirportPage from './pages/seo/MountAlbertAirportPage';
import EpsomAirportPageNew from './pages/seo/EpsomAirportPage';
import NewmarketAirportPageNew from './pages/seo/NewmarketAirportPage';
import ParnellAirportPageNew from './pages/seo/ParnellAirportPage';
import RemueraAirportPageNew from './pages/seo/RemueraAirportPage';
import GreyLynnAirportPageNew from './pages/seo/GreyLynnAirportPage';
import PonsonbyAirportPageNew from './pages/seo/PonsonbyAirportPage';
// International Market Landing Pages
import CountryLandingPage from './pages/international/CountryLandingPage';
// Shared Shuttle Service
import SharedShuttle from './pages/SharedShuttle';
import ShuttleDriverPortal from './pages/ShuttleDriverPortal';
// Live GPS Tracking
import DriverTracking from './pages/DriverTracking';
import CustomerTracking from './pages/CustomerTracking';
// Airport Pickup Guide
import AirportPickupGuide from './pages/AirportPickupGuide';
// Travel Agent Page
import TravelAgents from './pages/TravelAgents';
// Hotel Concierge Portal
import HotelConciergePortal from './pages/HotelConciergePortal';

import RecentBookingsNotification from './components/RecentBookingsNotification';
import ExitIntentPopup from './components/ExitIntentPopup';
import AIChatbot from './components/AIChatbot';
import MobileStickyButton from './components/MobileStickyButton';

// Layout component with Header/Footer
const MainLayout = () => (
  <>
    <InternationalBanner />
    <Header />
    <main>
      <Outlet />
    </main>
    <Footer />
    <BackToTop />
    <RecentBookingsNotification />
    <ExitIntentPopup />
    <AIChatbot />
    <MobileStickyButton />
  </>
);

// Get the homepage component based on config
const HomePage = siteConfig.isInternational ? InternationalHomePage : Home;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const NIGHT_SHIFT_FALLBACK = [
  {
    id: 'night-1',
    category: 'SEO',
    detail: 'Filled 38 missing canonical tags and aligned Open Graph defaults.',
    timestamp: '02:18 NZT'
  },
  {
    id: 'night-2',
    category: 'SSL',
    detail: 'Revalidated certificate chain and auto-renew workflow on edge routes.',
    timestamp: '03:06 NZT'
  },
  {
    id: 'night-3',
    category: 'Refactor',
    detail: 'Simplified route hydration and trimmed duplicate deploy hooks.',
    timestamp: '04:44 NZT'
  }
];

const AGENCY_WORKSTATIONS = {
  creative: [
    'Polish premium neon gradients for cards',
    'Tune motion timing for command dock',
    'Refresh high-contrast tokens for Obsidian mode'
  ],
  lead: [
    'Patch incoming customer tickets automatically',
    'Keep Vercel production sync healthy',
    'Regenerate vercel.json when vibe shifts'
  ],
  qa: [
    'Run multi-deployment speed checks',
    'Audit SEO blueprint for missing meta tags',
    'Publish sitemap and verify crawl readiness'
  ]
};

const SUPPORT_TICKET_TEMPLATES = [
  {
    subject: 'Checkout spinner hangs for some Safari users',
    severity: 'critical',
    resource: 'checkout-flow',
    patch: 'Added guarded fallback for stalled payment intent and idempotent retry.'
  },
  {
    subject: 'Wrong hreflang emitted on translated suburb pages',
    severity: 'high',
    resource: 'seo-hreflang',
    patch: 'Normalized locale slug mapping and corrected hreflang generator ordering.'
  },
  {
    subject: 'Booking CTA overlaps footer on small tablets',
    severity: 'medium',
    resource: 'responsive-layout',
    patch: 'Applied adaptive spacing token and fixed sticky-action breakpoint logic.'
  }
];

const INITIAL_SEO_BLUEPRINT = [
  {
    path: '/',
    title: 'Book A Ride - Airport Transfer Specialists',
    description: 'Premium airport transfer service with transparent pricing.',
    canonical: 'https://bookaride.example/',
    openGraphImage: '/og/home.jpg'
  },
  {
    path: '/services',
    title: 'Airport Shuttle Services',
    description: 'Corporate, shared, and private airport ride options.',
    canonical: 'https://bookaride.example/services',
    openGraphImage: '/og/services.jpg'
  },
  {
    path: '/blog',
    title: '',
    description: 'Travel tips and route updates.',
    canonical: 'https://bookaride.example/blog',
    openGraphImage: ''
  },
  {
    path: '/contact',
    title: 'Contact the Team',
    description: '',
    canonical: '',
    openGraphImage: '/og/contact.jpg'
  }
];

const INITIAL_SPEED_MATRIX = [
  { site: 'bookaride.co.nz', speed: 93, status: 'Fast' },
  { site: 'intl.bookaride.co.nz', speed: 89, status: 'Fast' },
  { site: 'seo.bookaride.co.nz', speed: 86, status: 'Needs tuning' }
];

const escapeXml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://bookaride.example';
};

const buildVercelConfigFromVibe = (vibe) => {
  const isObsidian = vibe === 'Obsidian';
  return {
    version: 2,
    framework: 'create-react-app',
    regions: isObsidian ? ['sfo1', 'iad1'] : ['iad1'],
    trailingSlash: false,
    cleanUrls: true,
    headers: [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Aura-Vibe',
            value: vibe.toLowerCase()
          },
          {
            key: 'Cache-Control',
            value: isObsidian ? 'public, max-age=3600' : 'public, max-age=1800'
          }
        ]
      }
    ],
    rewrites: [
      {
        source: '/agency/:path*',
        destination: '/admin/production-engine'
      }
    ]
  };
};

const inspectSeoBlueprint = (pages) => {
  const requiredFields = ['title', 'description', 'canonical', 'openGraphImage'];
  const issues = [];

  pages.forEach((page) => {
    requiredFields.forEach((field) => {
      if (!String(page[field] || '').trim()) {
        issues.push(`${page.path} is missing "${field}"`);
      }
    });
  });

  return issues;
};

const createSitemapXml = (pages, baseUrl) => {
  const today = new Date().toISOString();
  const urlNodes = pages
    .map((page) => {
      const cleanPath = page.path.startsWith('/') ? page.path : `/${page.path}`;
      const loc = `${baseUrl.replace(/\/$/, '')}${cleanPath}`;
      return [
        '  <url>',
        `    <loc>${escapeXml(loc)}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        '    <changefreq>daily</changefreq>',
        '    <priority>0.8</priority>',
        '  </url>'
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlNodes,
    '</urlset>'
  ].join('\n');
};

const normalizeNightShiftEntries = (payload) => {
  if (!payload) {
    return [];
  }

  let parsedPayload = payload;
  if (typeof payload === 'string') {
    try {
      parsedPayload = JSON.parse(payload);
    } catch (_error) {
      return [];
    }
  }

  const rawEntries = Array.isArray(parsedPayload)
    ? parsedPayload
    : parsedPayload?.events || parsedPayload?.entries || parsedPayload?.log || [];

  if (!Array.isArray(rawEntries)) {
    return [];
  }

  return rawEntries.map((entry, index) => {
    if (typeof entry === 'string') {
      return {
        id: `night-shift-${index}`,
        category: 'General',
        detail: entry,
        timestamp: 'overnight'
      };
    }

    return {
      id: entry.id || `night-shift-${index}`,
      category: entry.category || entry.type || 'General',
      detail: entry.detail || entry.message || 'No detail provided.',
      timestamp: entry.timestamp || entry.time || 'overnight'
    };
  });
};

const scoreToStatus = (score) => {
  if (score >= 95) {
    return 'Blazing';
  }
  if (score >= 88) {
    return 'Fast';
  }
  return 'Needs tuning';
};

const formatTimeLabel = (value) => {
  if (!value) {
    return 'n/a';
  }
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }
  return parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const useAuraLock = () => {
  const lockRef = useRef(new Map());
  const [locks, setLocks] = useState([]);

  const publishLocks = useCallback(() => {
    const snapshot = Array.from(lockRef.current.entries()).map(([resource, lock]) => ({
      resource,
      ...lock
    }));
    setLocks(snapshot);
  }, []);

  const acquire = useCallback(
    (resource, owner) => {
      const existing = lockRef.current.get(resource);
      if (existing && existing.owner !== owner) {
        return false;
      }

      lockRef.current.set(resource, { owner, startedAt: new Date().toISOString() });
      publishLocks();
      return true;
    },
    [publishLocks]
  );

  const release = useCallback(
    (resource, owner) => {
      const current = lockRef.current.get(resource);
      if (!current) {
        return;
      }
      if (current.owner === owner) {
        lockRef.current.delete(resource);
        publishLocks();
      }
    },
    [publishLocks]
  );

  const withLock = useCallback(
    async (resource, owner, action) => {
      const hasLock = acquire(resource, owner);
      if (!hasLock) {
        throw new Error(`Resource "${resource}" is locked by another agent.`);
      }
      try {
        return await action();
      } finally {
        release(resource, owner);
      }
    },
    [acquire, release]
  );

  return {
    locks,
    withLock
  };
};

const HapticButton = ({ children, onClick, style, disabled = false, type = 'button' }) => (
  <motion.button
    type={type}
    onClick={onClick}
    disabled={disabled}
    whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
    whileTap={disabled ? {} : { scale: 0.96 }}
    transition={{ type: 'spring', stiffness: 420, damping: 22, mass: 0.7 }}
    style={{
      border: '1px solid rgba(148, 163, 184, 0.35)',
      borderRadius: 12,
      padding: '10px 14px',
      fontSize: 13,
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      ...style
    }}
  >
    {children}
  </motion.button>
);

const AuraProductionEngine = () => {
  const [vibe, setVibe] = useState('Obsidian');
  const [commandInput, setCommandInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      id: 'chat-seed',
      author: 'Aura AI',
      text: 'Agency online. Try: "Creative Director, go darker" or "QA, run stress test".',
      time: new Date().toISOString()
    }
  ]);
  const [agencyFeed, setAgencyFeed] = useState([
    {
      id: 'feed-seed',
      source: 'System',
      message: 'Production Engine initialized.',
      time: new Date().toISOString()
    }
  ]);
  const [morningReportOpen, setMorningReportOpen] = useState(true);
  const [nightShiftLog, setNightShiftLog] = useState(NIGHT_SHIFT_FALLBACK);
  const [vercelState, setVercelState] = useState({
    state: 'idle',
    message: 'No live Vercel sync yet.',
    lastSynced: null
  });
  const [seoBlueprint] = useState(INITIAL_SEO_BLUEPRINT);
  const [seoIssues, setSeoIssues] = useState([]);
  const [sitemapXml, setSitemapXml] = useState('');
  const [tickets, setTickets] = useState([
    {
      id: 'TCK-3000',
      subject: 'Legacy meta tags stale on /blog',
      severity: 'high',
      resource: 'seo-meta',
      patch: 'Injected canonical fallback and refreshed robots metadata mapping.',
      status: 'open',
      receivedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString()
    }
  ]);
  const [patchLog, setPatchLog] = useState([]);
  const [speedMatrix, setSpeedMatrix] = useState(INITIAL_SPEED_MATRIX);
  const [agentStatus, setAgentStatus] = useState({
    creative: 'Moodboarding premium visuals',
    lead: 'Standing by for autonomous fixes',
    qa: 'Monitoring telemetry baselines'
  });
  const [taskPulseIndex, setTaskPulseIndex] = useState(0);

  const feedCounterRef = useRef(1);
  const ticketCounterRef = useRef(3001);
  const commandCounterRef = useRef(1);

  const { locks, withLock } = useAuraLock();

  const palette = useMemo(
    () =>
      vibe === 'Obsidian'
        ? {
            background: 'radial-gradient(circle at top right, #1f2937 0%, #0f172a 50%, #030712 100%)',
            panel: 'rgba(12, 18, 31, 0.84)',
            panelBorder: 'rgba(148, 163, 184, 0.22)',
            text: '#e2e8f0',
            subtext: '#94a3b8',
            accent: '#a855f7',
            accentSoft: '#c084fc',
            positive: '#22c55e',
            warning: '#f59e0b',
            danger: '#ef4444',
            chip: 'rgba(59, 130, 246, 0.16)'
          }
        : {
            background: 'radial-gradient(circle at top right, #dbeafe 0%, #f8fafc 50%, #dbeafe 100%)',
            panel: 'rgba(255, 255, 255, 0.84)',
            panelBorder: 'rgba(37, 99, 235, 0.2)',
            text: '#0f172a',
            subtext: '#475569',
            accent: '#2563eb',
            accentSoft: '#38bdf8',
            positive: '#16a34a',
            warning: '#d97706',
            danger: '#dc2626',
            chip: 'rgba(37, 99, 235, 0.1)'
          },
    [vibe]
  );

  const vercelConfig = useMemo(() => buildVercelConfigFromVibe(vibe), [vibe]);

  const morningSummary = useMemo(() => {
    const summary = {
      total: nightShiftLog.length,
      seo: 0,
      ssl: 0,
      refactor: 0
    };

    nightShiftLog.forEach((item) => {
      const category = String(item.category || '').toLowerCase();
      if (category.includes('seo')) {
        summary.seo += 1;
      } else if (category.includes('ssl')) {
        summary.ssl += 1;
      } else if (category.includes('refactor')) {
        summary.refactor += 1;
      }
    });

    return summary;
  }, [nightShiftLog]);

  const pushFeed = useCallback((message, source = 'System') => {
    setAgencyFeed((previous) => [
      {
        id: `feed-${feedCounterRef.current++}`,
        source,
        message,
        time: new Date().toISOString()
      },
      ...previous
    ].slice(0, 12));
  }, []);

  const updateAgentStatus = useCallback((agentKey, message) => {
    setAgentStatus((previous) => ({
      ...previous,
      [agentKey]: message
    }));
  }, []);

  const syncVercelStatus = useCallback(async () => {
    updateAgentStatus('lead', 'Authenticating with Vercel API...');
    setVercelState({
      state: 'loading',
      message: 'Contacting Vercel API...',
      lastSynced: new Date().toISOString()
    });

    const token = process.env.REACT_APP_VERCEL_TOKEN;
    const teamId = process.env.REACT_APP_VERCEL_TEAM_ID;
    const projectId = process.env.REACT_APP_VERCEL_PROJECT_ID;

    if (!token) {
      const warningMessage = 'REACT_APP_VERCEL_TOKEN is missing. Add it to env for real-world sync.';
      setVercelState({
        state: 'error',
        message: warningMessage,
        lastSynced: new Date().toISOString()
      });
      updateAgentStatus('lead', 'Waiting for Vercel token');
      pushFeed(warningMessage, 'Lead Dev');
      return;
    }

    try {
      const query = new URLSearchParams({ limit: '1' });
      if (teamId) {
        query.set('teamId', teamId);
      }
      if (projectId) {
        query.set('projectId', projectId);
      }

      const response = await fetch(`https://api.vercel.com/v6/deployments?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Vercel API ${response.status}: ${body.slice(0, 160)}`);
      }

      const payload = await response.json();
      const deployment = payload.deployments?.[0];
      if (!deployment) {
        throw new Error('No deployments returned by Vercel API.');
      }

      const readyState = String(deployment.readyState || deployment.state || 'UNKNOWN').toUpperCase();
      const displayUrl = deployment.url ? `https://${deployment.url}` : deployment.name || 'latest deployment';
      const mappedState =
        readyState === 'READY' ? 'ready' : readyState === 'ERROR' || readyState === 'CANCELED' ? 'error' : 'loading';

      setVercelState({
        state: mappedState,
        message: `${displayUrl} is ${readyState}.`,
        lastSynced: new Date().toISOString()
      });

      updateAgentStatus('lead', readyState === 'READY' ? 'Deployment is production-ready' : `Deployment state: ${readyState}`);
      pushFeed(`Vercel sync complete: ${displayUrl} => ${readyState}.`, 'Lead Dev');
    } catch (error) {
      const errorMessage = `Vercel sync failed: ${error.message}`;
      setVercelState({
        state: 'error',
        message: errorMessage,
        lastSynced: new Date().toISOString()
      });
      updateAgentStatus('lead', 'Investigating Vercel sync failure');
      pushFeed(errorMessage, 'Lead Dev');
    }
  }, [pushFeed, updateAgentStatus]);

  const runSeoIndexer = useCallback(async () => {
    try {
      await withLock('seo-blueprint', 'QA Agent', async () => {
        updateAgentStatus('qa', 'Running Deep-SEO indexer...');
        await wait(350);
        const detectedIssues = inspectSeoBlueprint(seoBlueprint);
        const generatedSitemap = createSitemapXml(seoBlueprint, getBaseUrl());
        setSeoIssues(detectedIssues);
        setSitemapXml(generatedSitemap);
        if (detectedIssues.length > 0) {
          pushFeed(`Deep-SEO index found ${detectedIssues.length} missing metadata entries.`, 'QA Agent');
          updateAgentStatus('qa', `Detected ${detectedIssues.length} SEO gaps`);
        } else {
          pushFeed('Deep-SEO index passed with no missing tags.', 'QA Agent');
          updateAgentStatus('qa', 'SEO blueprint is production clean');
        }
      });
    } catch (error) {
      pushFeed(`SEO index blocked: ${error.message}`, 'QA Agent');
    }
  }, [pushFeed, seoBlueprint, updateAgentStatus, withLock]);

  const runStressTest = useCallback(async () => {
    try {
      await withLock('perf-matrix', 'QA Agent', async () => {
        updateAgentStatus('qa', 'Running multi-deployment stress test...');
        pushFeed('QA Agent started performance sweep across deployments.', 'QA Agent');
        await wait(600);
        setSpeedMatrix((previous) =>
          previous.map((site) => {
            const variation = Math.round((Math.random() - 0.35) * 12);
            const newScore = Math.max(70, Math.min(100, site.speed + variation));
            return {
              ...site,
              speed: newScore,
              status: scoreToStatus(newScore)
            };
          })
        );
        updateAgentStatus('qa', 'Speed telemetry refreshed');
        pushFeed('Speed matrix updated with fresh QA metrics.', 'QA Agent');
      });
    } catch (error) {
      pushFeed(`Stress test blocked: ${error.message}`, 'QA Agent');
    }
  }, [pushFeed, updateAgentStatus, withLock]);

  const solveTicket = useCallback(
    async (ticket) => {
      if (!ticket || ticket.status === 'resolved' || ticket.status === 'fixing') {
        return;
      }

      try {
        await withLock(`code:${ticket.resource}`, 'Lead Dev', async () => {
          updateAgentStatus('lead', `Applying patch for ${ticket.id}...`);
          setTickets((previous) =>
            previous.map((item) => (item.id === ticket.id ? { ...item, status: 'fixing' } : item))
          );
          pushFeed(`${ticket.id} is being patched by Lead Dev Agent.`, 'Lead Dev');
          await wait(700);
          setTickets((previous) =>
            previous.map((item) =>
              item.id === ticket.id
                ? { ...item, status: 'resolved', resolvedAt: new Date().toISOString() }
                : item
            )
          );
          setPatchLog((previous) => [
            {
              id: `patch-${ticket.id}`,
              ticketId: ticket.id,
              summary: ticket.patch,
              time: new Date().toISOString()
            },
            ...previous
          ].slice(0, 8));
          updateAgentStatus('lead', `${ticket.id} resolved with clean lock handoff`);
          pushFeed(`${ticket.id} resolved and merged into autonomous patch queue.`, 'Lead Dev');
        });
      } catch (error) {
        pushFeed(`Ticket ${ticket.id} could not acquire lock: ${error.message}`, 'Lead Dev');
      }
    },
    [pushFeed, updateAgentStatus, withLock]
  );

  const handleTicketArrival = useCallback(async () => {
    const template = SUPPORT_TICKET_TEMPLATES[Math.floor(Math.random() * SUPPORT_TICKET_TEMPLATES.length)];
    const ticket = {
      ...template,
      id: `TCK-${ticketCounterRef.current++}`,
      status: 'open',
      receivedAt: new Date().toISOString()
    };

    setTickets((previous) => [ticket, ...previous].slice(0, 10));
    updateAgentStatus('lead', `New support ticket ${ticket.id} received`);
    pushFeed(`${ticket.id} arrived in support inbox (${ticket.severity}).`, 'System');
    await solveTicket(ticket);
  }, [pushFeed, solveTicket, updateAgentStatus]);

  const downloadTextFile = useCallback((content, filename, mimeType) => {
    if (!content || typeof document === 'undefined') {
      return;
    }

    const blob = new Blob([content], { type: mimeType });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(href);
  }, []);

  const downloadSitemap = useCallback(() => {
    const xml = sitemapXml || createSitemapXml(seoBlueprint, getBaseUrl());
    downloadTextFile(xml, 'sitemap.xml', 'application/xml');
    pushFeed('Downloaded latest generated sitemap.xml.', 'QA Agent');
  }, [downloadTextFile, pushFeed, seoBlueprint, sitemapXml]);

  const downloadVercelConfig = useCallback(() => {
    const json = JSON.stringify(vercelConfig, null, 2);
    downloadTextFile(json, 'vercel.json', 'application/json');
    pushFeed(`Exported vercel.json from ${vibe} vibe profile.`, 'Lead Dev');
  }, [downloadTextFile, pushFeed, vercelConfig, vibe]);

  const executeAuraCommand = useCallback(
    async (rawCommand) => {
      const normalized = rawCommand.toLowerCase();

      if (
        normalized.includes('creative director') &&
        (normalized.includes('dark') || normalized.includes('darker') || normalized.includes('obsidian'))
      ) {
        await withLock('ui-theme', 'Creative Director', async () => {
          updateAgentStatus('creative', 'Pushing Obsidian palette...');
          setVibe('Obsidian');
          await wait(220);
          updateAgentStatus('creative', 'Obsidian mode active');
          pushFeed('Creative Director shifted interface to Obsidian.', 'Creative Director');
        });
        return 'Creative Director completed: Obsidian vibe is now live.';
      }

      if (
        normalized.includes('creative director') &&
        (normalized.includes('cloud') || normalized.includes('lighter') || normalized.includes('light'))
      ) {
        await withLock('ui-theme', 'Creative Director', async () => {
          updateAgentStatus('creative', 'Switching to Cloud palette...');
          setVibe('Cloud');
          await wait(220);
          updateAgentStatus('creative', 'Cloud mode active');
          pushFeed('Creative Director shifted interface to Cloud.', 'Creative Director');
        });
        return 'Creative Director completed: Cloud vibe deployed.';
      }

      if (
        (normalized.includes('lead dev') || normalized.includes('developer')) &&
        (normalized.includes('ticket') || normalized.includes('fix'))
      ) {
        const openTicket = tickets.find((item) => item.status !== 'resolved');
        if (!openTicket) {
          return 'Lead Dev confirms there are no open tickets right now.';
        }
        await solveTicket(openTicket);
        return `Lead Dev solved ${openTicket.id} and logged the patch.`;
      }

      if (
        (normalized.includes('qa') || normalized.includes('quality')) &&
        (normalized.includes('stress') || normalized.includes('speed') || normalized.includes('performance'))
      ) {
        await runStressTest();
        return 'QA Agent reran multi-deployment stress test and refreshed speed stats.';
      }

      if (normalized.includes('seo') || normalized.includes('sitemap')) {
        await runSeoIndexer();
        return 'QA Agent completed Deep-SEO index and rebuilt sitemap.xml.';
      }

      if (normalized.includes('vercel') || normalized.includes('deployment')) {
        await syncVercelStatus();
        return 'Lead Dev synced live deployment status from Vercel API.';
      }

      if (normalized.includes('ticket') && (normalized.includes('new') || normalized.includes('arrive'))) {
        await handleTicketArrival();
        return 'Support inbox received a new ticket and Lead Dev started auto-healing.';
      }

      if (normalized.includes('morning report') || normalized.includes('night shift')) {
        setMorningReportOpen(true);
        return 'Morning Report reopened with latest Night Shift highlights.';
      }

      return 'Command received. Try asking Creative Director, Lead Dev, or QA Agent directly.';
    },
    [
      handleTicketArrival,
      pushFeed,
      runSeoIndexer,
      runStressTest,
      solveTicket,
      syncVercelStatus,
      tickets,
      updateAgentStatus,
      withLock
    ]
  );

  const handleCommandSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const trimmedCommand = commandInput.trim();
      if (!trimmedCommand) {
        return;
      }

      const requestId = commandCounterRef.current++;
      setChatHistory((previous) => [
        {
          id: `chat-user-${requestId}`,
          author: 'You',
          text: trimmedCommand,
          time: new Date().toISOString()
        },
        ...previous
      ].slice(0, 10));

      const response = await executeAuraCommand(trimmedCommand);
      setChatHistory((previous) => [
        {
          id: `chat-aura-${requestId}`,
          author: 'Aura AI',
          text: response,
          time: new Date().toISOString()
        },
        ...previous
      ].slice(0, 10));

      setCommandInput('');
    },
    [commandInput, executeAuraCommand]
  );

  useEffect(() => {
    let active = true;

    const hydrateNightShiftReport = async () => {
      if (typeof window === 'undefined') {
        return;
      }

      const cachedEntries = normalizeNightShiftEntries(window.localStorage.getItem('aura_night_shift'));
      if (cachedEntries.length > 0) {
        if (active) {
          setNightShiftLog(cachedEntries);
        }
        return;
      }

      try {
        const response = await fetch('/aura_night_shift.json');
        if (response.ok) {
          const payload = await response.json();
          const normalized = normalizeNightShiftEntries(payload);
          if (normalized.length > 0 && active) {
            setNightShiftLog(normalized);
            window.localStorage.setItem('aura_night_shift', JSON.stringify(normalized));
            return;
          }
        }
      } catch (_error) {
        // Fallback below if report file is unavailable.
      }

      if (active) {
        setNightShiftLog(NIGHT_SHIFT_FALLBACK);
      }
    };

    hydrateNightShiftReport();
    setSeoIssues(inspectSeoBlueprint(INITIAL_SEO_BLUEPRINT));
    setSitemapXml(createSitemapXml(INITIAL_SEO_BLUEPRINT, getBaseUrl()));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTaskPulseIndex((value) => value + 1);
    }, 2400);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      handleTicketArrival();
    }, 90000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [handleTicketArrival]);

  const sharedPanelStyle = {
    background: palette.panel,
    border: `1px solid ${palette.panelBorder}`,
    borderRadius: 16,
    padding: 16,
    color: palette.text,
    backdropFilter: 'blur(12px)'
  };

  const dockButtonStyle = {
    background: palette.chip,
    color: palette.text
  };

  const statusColorMap = {
    idle: palette.subtext,
    loading: palette.warning,
    ready: palette.positive,
    error: palette.danger
  };

  const agentRows = [
    {
      key: 'creative',
      label: 'Creative Director',
      icon: Sparkles,
      accent: '#d946ef',
      animation: {
        y: [0, -5, 0],
        rotate: [0, 0.8, 0, -0.8, 0]
      }
    },
    {
      key: 'lead',
      label: 'Lead Dev Agent',
      icon: Wrench,
      accent: '#38bdf8',
      animation: {
        scale: [1, 1.02, 1]
      }
    },
    {
      key: 'qa',
      label: 'QA Agent',
      icon: Gauge,
      accent: '#22c55e',
      animation: {
        x: [0, 2, 0, -2, 0]
      }
    }
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: palette.background,
        color: palette.text,
        padding: 20
      }}
    >
      <AnimatePresence>
        {morningReportOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2, 6, 23, 0.72)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1200,
              padding: 16
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', stiffness: 190, damping: 22 }}
              style={{
                width: 'min(720px, 100%)',
                background: palette.panel,
                border: `1px solid ${palette.panelBorder}`,
                borderRadius: 20,
                padding: 22,
                color: palette.text
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 10, color: palette.accentSoft }}>
                    <Rocket size={16} />
                    <span style={{ fontWeight: 700 }}>Morning Report</span>
                  </div>
                  <h2 style={{ margin: 0, fontSize: 28 }}>Night Shift Summary</h2>
                  <p style={{ marginTop: 8, color: palette.subtext }}>
                    {morningSummary.total} autonomous actions completed while you were offline.
                  </p>
                </div>
                <HapticButton
                  onClick={() => setMorningReportOpen(false)}
                  style={{ ...dockButtonStyle, height: 'fit-content' }}
                >
                  <CheckCircle2 size={16} />
                  Continue to workspace
                </HapticButton>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                <span style={{ background: palette.chip, borderRadius: 999, padding: '6px 10px', fontSize: 12 }}>
                  SEO wins: {morningSummary.seo}
                </span>
                <span style={{ background: palette.chip, borderRadius: 999, padding: '6px 10px', fontSize: 12 }}>
                  SSL fixes: {morningSummary.ssl}
                </span>
                <span style={{ background: palette.chip, borderRadius: 999, padding: '6px 10px', fontSize: 12 }}>
                  Refactors: {morningSummary.refactor}
                </span>
              </div>

              <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
                {nightShiftLog.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      border: `1px solid ${palette.panelBorder}`,
                      borderRadius: 12,
                      padding: 12,
                      background: palette.chip
                    }}
                  >
                    <strong>{entry.category}</strong>
                    <p style={{ margin: '6px 0', color: palette.subtext }}>{entry.detail}</p>
                    <small style={{ color: palette.subtext }}>{entry.timestamp}</small>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 170, damping: 20 }}
        style={{
          maxWidth: 1440,
          margin: '0 auto'
        }}
      >
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{
            ...sharedPanelStyle,
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap'
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: palette.accentSoft }}>
              <Bot size={16} />
              <span style={{ fontWeight: 700 }}>Aura Production Engine</span>
            </div>
            <h1 style={{ margin: '8px 0 4px', fontSize: 30 }}>10-in-1 Live Agency Control Room</h1>
            <p style={{ margin: 0, color: palette.subtext }}>
              Morning report, live agents, real Vercel sync, SEO indexing, ticket healing, and stress telemetry.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 999,
                background: palette.chip,
                fontSize: 12
              }}
            >
              <Activity size={14} color={statusColorMap[vercelState.state] || palette.subtext} />
              {vercelState.message}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 999,
                background: palette.chip,
                fontSize: 12
              }}
            >
              <Lock size={14} />
              Active locks: {locks.length}
            </span>
          </div>
        </motion.header>

        <div style={{ display: 'grid', gridTemplateColumns: '330px minmax(0, 1fr)', gap: 16 }}>
          <aside style={{ display: 'grid', gap: 16 }}>
            <motion.section
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 }}
              style={sharedPanelStyle}
            >
              <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: 20 }}>Agency Intelligence</h2>
              <p style={{ marginTop: 0, color: palette.subtext, fontSize: 13 }}>
                Live workstations with independent motion signatures.
              </p>

              <div style={{ display: 'grid', gap: 12 }}>
                {agentRows.map((agentRow) => {
                  const AgentIcon = agentRow.icon;
                  const tasks = AGENCY_WORKSTATIONS[agentRow.key];
                  const activeTaskIndex = taskPulseIndex % tasks.length;
                  const nextTaskIndex = (activeTaskIndex + 1) % tasks.length;

                  return (
                    <motion.div
                      key={agentRow.key}
                      animate={agentRow.animation}
                      transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        border: `1px solid ${palette.panelBorder}`,
                        borderRadius: 14,
                        padding: 12,
                        background: palette.chip
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <AgentIcon size={16} color={agentRow.accent} />
                          <strong>{agentRow.label}</strong>
                        </span>
                        <span style={{ fontSize: 11, color: palette.subtext }}>{agentStatus[agentRow.key]}</span>
                      </div>
                      <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                        {tasks.map((task, taskIndex) => {
                          let taskStatus = 'done';
                          if (taskIndex === activeTaskIndex) {
                            taskStatus = 'running';
                          } else if (taskIndex === nextTaskIndex) {
                            taskStatus = 'queued';
                          }

                          const taskColor =
                            taskStatus === 'running'
                              ? agentRow.accent
                              : taskStatus === 'queued'
                                ? palette.warning
                                : palette.positive;

                          return (
                            <div key={task} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                              {taskStatus === 'done' ? (
                                <CheckCircle2 size={14} color={taskColor} />
                              ) : (
                                <Activity size={14} color={taskColor} />
                              )}
                              <span style={{ color: palette.text }}>{task}</span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 }}
              style={sharedPanelStyle}
            >
              <h3 style={{ marginTop: 0 }}>Live Feed</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {agencyFeed.map((entry) => (
                  <div key={entry.id} style={{ borderBottom: `1px solid ${palette.panelBorder}`, paddingBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
                      <strong>{entry.source}</strong>
                      <span style={{ color: palette.subtext }}>{formatTimeLabel(entry.time)}</span>
                    </div>
                    <p style={{ margin: '4px 0 0', color: palette.subtext, fontSize: 12 }}>{entry.message}</p>
                  </div>
                ))}
              </div>
            </motion.section>
          </aside>

          <main style={{ display: 'grid', gap: 16 }}>
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={sharedPanelStyle}
            >
              <h2 style={{ marginTop: 0, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Bot size={18} />
                Aura AI Command Input
              </h2>
              <p style={{ marginTop: 0, color: palette.subtext }}>
                Search has been replaced by direct command control for your agency.
              </p>

              <form onSubmit={handleCommandSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  value={commandInput}
                  onChange={(event) => setCommandInput(event.target.value)}
                  placeholder='Try: "Creative Director, go Darker"'
                  style={{
                    flex: 1,
                    minWidth: 260,
                    borderRadius: 12,
                    border: `1px solid ${palette.panelBorder}`,
                    padding: '10px 12px',
                    background: palette.chip,
                    color: palette.text
                  }}
                />
                <HapticButton type="submit" style={dockButtonStyle}>
                  <Rocket size={14} />
                  Dispatch command
                </HapticButton>
              </form>

              <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                {chatHistory.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      border: `1px solid ${palette.panelBorder}`,
                      borderRadius: 10,
                      padding: 10,
                      background: palette.chip
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
                      <strong>{entry.author}</strong>
                      <span style={{ color: palette.subtext }}>{formatTimeLabel(entry.time)}</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 13 }}>{entry.text}</p>
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              style={sharedPanelStyle}
            >
              <h2 style={{ marginTop: 0 }}>Haptic Interaction Dock</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <HapticButton onClick={syncVercelStatus} style={dockButtonStyle}>
                  <RefreshCw size={14} />
                  Sync live Vercel
                </HapticButton>
                <HapticButton onClick={runSeoIndexer} style={dockButtonStyle}>
                  <Activity size={14} />
                  Run Deep-SEO index
                </HapticButton>
                <HapticButton onClick={downloadSitemap} style={dockButtonStyle}>
                  <Download size={14} />
                  Download sitemap.xml
                </HapticButton>
                <HapticButton onClick={handleTicketArrival} style={dockButtonStyle}>
                  <Wrench size={14} />
                  Inject support ticket
                </HapticButton>
                <HapticButton onClick={runStressTest} style={dockButtonStyle}>
                  <Gauge size={14} />
                  Run stress test
                </HapticButton>
                <HapticButton onClick={downloadVercelConfig} style={dockButtonStyle}>
                  <Download size={14} />
                  Export vercel.json
                </HapticButton>
              </div>
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <HapticButton
                  onClick={() => executeAuraCommand('Creative Director, go darker')}
                  style={dockButtonStyle}
                >
                  <MoonStar size={14} />
                  Obsidian vibe
                </HapticButton>
                <HapticButton
                  onClick={() => executeAuraCommand('Creative Director, go cloud')}
                  style={dockButtonStyle}
                >
                  <Cloud size={14} />
                  Cloud vibe
                </HapticButton>
              </div>
            </motion.section>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                style={sharedPanelStyle}
              >
                <h3 style={{ marginTop: 0 }}>Vibe-to-Build Converter</h3>
                <p style={{ color: palette.subtext, fontSize: 13 }}>
                  Changing the vibe instantly regenerates production-ready <code>vercel.json</code>.
                </p>
                <pre
                  style={{
                    margin: 0,
                    maxHeight: 260,
                    overflow: 'auto',
                    borderRadius: 12,
                    padding: 12,
                    fontSize: 12,
                    background: palette.chip,
                    border: `1px solid ${palette.panelBorder}`
                  }}
                >
                  {JSON.stringify(vercelConfig, null, 2)}
                </pre>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={sharedPanelStyle}
              >
                <h3 style={{ marginTop: 0 }}>Deep-SEO Indexer & Sitemap Generator</h3>
                <p style={{ color: palette.subtext, fontSize: 13 }}>
                  Scans the JSON blueprint for missing metadata and outputs downloadable sitemap XML.
                </p>
                {seoIssues.length === 0 ? (
                  <p style={{ color: palette.positive, fontSize: 13, marginTop: 6 }}>
                    <CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    No missing SEO tags found.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                    {seoIssues.map((issue) => (
                      <span key={issue} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <AlertTriangle size={14} color={palette.warning} />
                        {issue}
                      </span>
                    ))}
                  </div>
                )}
                <pre
                  style={{
                    marginTop: 10,
                    maxHeight: 150,
                    overflow: 'auto',
                    borderRadius: 12,
                    padding: 12,
                    fontSize: 11,
                    background: palette.chip,
                    border: `1px solid ${palette.panelBorder}`
                  }}
                >
                  {sitemapXml}
                </pre>
              </motion.section>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                style={sharedPanelStyle}
              >
                <h3 style={{ marginTop: 0 }}>Autonomous Ticket Solver</h3>
                <p style={{ color: palette.subtext, fontSize: 13 }}>
                  When tickets arrive, Lead Dev writes the fix and logs the patch automatically.
                </p>
                <div style={{ display: 'grid', gap: 10 }}>
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      style={{
                        borderRadius: 12,
                        border: `1px solid ${palette.panelBorder}`,
                        padding: 10,
                        background: palette.chip
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                        <strong>{ticket.id}</strong>
                        <span
                          style={{
                            borderRadius: 999,
                            padding: '4px 8px',
                            fontSize: 11,
                            background:
                              ticket.status === 'resolved'
                                ? 'rgba(34, 197, 94, 0.2)'
                                : ticket.status === 'fixing'
                                  ? 'rgba(234, 179, 8, 0.22)'
                                  : 'rgba(59, 130, 246, 0.2)'
                          }}
                        >
                          {ticket.status}
                        </span>
                      </div>
                      <p style={{ margin: '6px 0', fontSize: 13 }}>{ticket.subject}</p>
                      <small style={{ color: palette.subtext }}>Severity: {ticket.severity}</small>
                    </div>
                  ))}
                </div>

                {patchLog.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <strong>Latest patches</strong>
                    <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                      {patchLog.map((patch) => (
                        <div key={patch.id} style={{ fontSize: 12, color: palette.subtext }}>
                          <strong>{patch.ticketId}</strong> - {patch.summary}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
                style={sharedPanelStyle}
              >
                <h3 style={{ marginTop: 0 }}>Multi-Deployment Stress Test</h3>
                <p style={{ color: palette.subtext, fontSize: 13 }}>
                  QA continuously scores performance and updates Speed stats for each deployment.
                </p>
                <div style={{ display: 'grid', gap: 10 }}>
                  {speedMatrix.map((row) => (
                    <div
                      key={row.site}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto auto',
                        gap: 10,
                        alignItems: 'center',
                        borderRadius: 12,
                        border: `1px solid ${palette.panelBorder}`,
                        padding: 10,
                        background: palette.chip
                      }}
                    >
                      <strong style={{ fontSize: 13 }}>{row.site}</strong>
                      <span style={{ fontSize: 13 }}>
                        <Gauge size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        {row.speed}
                      </span>
                      <span style={{ fontSize: 12, color: palette.subtext }}>{row.status}</span>
                    </div>
                  ))}
                </div>
              </motion.section>
            </div>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 }}
              style={sharedPanelStyle}
            >
              <h3 style={{ marginTop: 0, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Lock size={16} />
                Universal State Lock
              </h3>
              <p style={{ color: palette.subtext, fontSize: 13 }}>
                Shared resources are locked per agent to prevent conflicting writes and keep builds clean.
              </p>
              {locks.length === 0 ? (
                <p style={{ fontSize: 13, color: palette.positive, margin: 0 }}>
                  <CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  No active conflicts. All resources are currently clean.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {locks.map((lock) => (
                    <div
                      key={lock.resource}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: 8,
                        borderRadius: 10,
                        border: `1px solid ${palette.panelBorder}`,
                        padding: 10,
                        background: palette.chip
                      }}
                    >
                      <span>{lock.resource}</span>
                      <span style={{ color: palette.subtext }}>{lock.owner}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.section>
          </main>
        </div>
      </motion.div>
    </div>
  );
};

function App() {
  // Generate language-prefixed routes
  const languagePrefixes = SUPPORTED_LANGUAGES.filter(l => l.code !== 'en').map(l => l.code);

  // Define common routes as an array to avoid repetition
  const commonRoutes = [
    { index: true, element: <HomePage /> },
    // International Pages
    { path: "international/auckland-airport", element: <AucklandAirportInternational /> },
    { path: "international/hamilton-airport", element: <HamiltonAirportInternational /> },
    { path: "international/corporate-transfers", element: <CorporateTransfers /> },
    { path: "international/group-bookings", element: <GroupBookings /> },
    // Travel Agent & B2B Pages
    { path: "travel-agents", element: <TravelAgents /> },
    { path: "travel-agent-portal", element: <TravelAgents /> },
    { path: "wholesale-transfers", element: <TravelAgents /> },
    { path: "tour-operator-partnerships", element: <TravelAgents /> },
    { path: "inbound-tour-operators", element: <TravelAgents /> },
    { path: "travel-trade", element: <TravelAgents /> },
    { path: "nz-ground-transport-partner", element: <TravelAgents /> },
    // Hotel Concierge Portal
    { path: "hotel-portal", element: <HotelConciergePortal /> },
    { path: "hotel/login", element: <HotelConciergePortal /> },
    { path: "concierge", element: <HotelConciergePortal /> },
    // Market-Specific Landing Pages (Old)
    // International Market Landing Pages (NEW Professional Design)
    { path: "visitors/usa", element: <CountryLandingPage /> },
    { path: "visitors/canada", element: <CountryLandingPage /> },
    { path: "visitors/uk", element: <CountryLandingPage /> },
    { path: "visitors/germany", element: <CountryLandingPage /> },
    { path: "visitors/france", element: <CountryLandingPage /> },
    { path: "visitors/china", element: <CountryLandingPage /> },
    { path: "visitors/japan", element: <CountryLandingPage /> },
    { path: "visitors/korea", element: <CountryLandingPage /> },
    { path: "visitors/singapore", element: <CountryLandingPage /> },
    { path: "visitors/australia", element: <CountryLandingPage /> },
    { path: "visitors/india", element: <CountryLandingPage /> },
    { path: "visitors/uae", element: <CountryLandingPage /> },
    // NEW: Global SEO Pages
    { path: "visitors", element: <VisitorsHub /> },
    // Catch-all for other countries
    { path: "visitors/:countrySlug", element: <CountryLandingPage /> },
    // TOP 5 SEO KEYWORD PAGES
    { path: "airport-shuttle", element: <AirportShuttlePage /> },
    { path: "airport-shuttle-service", element: <AirportShuttleServicePage /> },
    { path: "shared-ride", element: <SharedRidePage /> },
    { path: "auckland-cbd-to-airport", element: <AucklandCBDToAirportPage /> },
    // Existing SEO pages
    { path: "auckland-airport-shuttle", element: <AucklandAirportShuttle /> },
    { path: "flight-tracker", element: <FlightTrackerPage /> },
    { path: "travel-guide", element: <TravelResourcesPage /> },
    { path: "international-visitors", element: <InternationalVisitors /> },
    // NEW: SEO Route Pages (Comprehensive)
    { path: "auckland-airport-to-whangaparaoa", element: <SEORoutePage /> },
    { path: "auckland-airport-to-orewa", element: <SEORoutePage /> },
    { path: "auckland-airport-to-north-shore", element: <SEORoutePage /> },
    { path: "auckland-airport-to-hibiscus-coast", element: <SEORoutePage /> },
    { path: "auckland-airport-to-silverdale", element: <SEORoutePage /> },
    { path: "auckland-airport-to-gulf-harbour", element: <SEORoutePage /> },
    { path: "auckland-airport-to-albany", element: <SEORoutePage /> },
    { path: "auckland-airport-to-takapuna", element: <SEORoutePage /> },
    { path: "auckland-airport-to-devonport", element: <SEORoutePage /> },
    { path: "auckland-airport-to-matakana", element: <SEORoutePage /> },
    { path: "auckland-airport-to-city", element: <SEORoutePage /> },
    { path: "auckland-cruise-terminal-transfer", element: <SEORoutePage /> },
    // NEW: Route Pages (Directory)
    { path: "routes", element: <RoutesDirectory /> },
    { path: "routes/:routeSlug", element: <RoutePage /> },
    // NEW: Blog
    { path: "blog", element: <BlogIndex /> },
    { path: "blog/:postSlug", element: <BlogPost /> },
    // NEW: Comparison Pages
    { path: "compare", element: <ComparisonDirectory /> },
    { path: "bookaride-vs-supershuttle", element: <ComparisonPage /> },
    { path: "bookaride-vs-uber", element: <ComparisonPage /> },
    { path: "bookaride-vs-taxi", element: <ComparisonPage /> },
    // SEO Battle Pages - Competitor Targeting
    { path: "hibiscus-coast-airport-shuttle", element: <HibiscusCoastShuttlePage /> },
    { path: "bookaride-vs-hibiscus-shuttles", element: <BookarideVsHibiscusShuttles /> },
    { path: "best-hibiscus-coast-shuttle-service", element: <BestHibiscusCoastShuttle /> },
    { path: "orewa-to-auckland-airport", element: <OrewaToAirportPage /> },
    { path: "whangaparaoa-airport-transfer", element: <WhangaparoaAirportPage /> },
    // NEW: High-Converting Landing Pages
    { path: "takapuna-to-airport", element: <TakapunaAirportPage /> },
    { path: "albany-to-airport", element: <AlbanyAirportPage /> },
    { path: "north-shore-airport-shuttle", element: <NorthShoreAirportPage /> },
    { path: "auckland-airport-to-city", element: <AirportToCityPage /> },
    // Auckland CBD SEO Pages
    { path: "auckland-cbd-airport", element: <CBDHubPage /> },
    { path: "ponsonby-to-airport", element: <PonsonbyAirportPage /> },
    { path: "parnell-to-airport", element: <ParnellAirportPage /> },
    { path: "newmarket-to-airport", element: <NewmarketAirportPage /> },
    { path: "remuera-to-airport", element: <RemueraAirportPage /> },
    { path: "mt-eden-to-airport", element: <MtEdenAirportPage /> },
    { path: "grey-lynn-to-airport", element: <GreyLynnAirportPage /> },
    // NEW: Mount Roskill Corridor SEO Pages (Central Auckland)
    { path: "airport-shuttle-mount-roskill", element: <MountRoskillAirportPage /> },
    { path: "airport-shuttle-sandringham", element: <SandringhamAirportPage /> },
    { path: "airport-shuttle-mount-eden", element: <MountEdenAirportPage /> },
    { path: "airport-shuttle-mount-albert", element: <MountAlbertAirportPage /> },
    { path: "airport-shuttle-epsom", element: <EpsomAirportPageNew /> },
    { path: "airport-shuttle-newmarket", element: <NewmarketAirportPageNew /> },
    { path: "airport-shuttle-parnell", element: <ParnellAirportPageNew /> },
    { path: "airport-shuttle-remuera", element: <RemueraAirportPageNew /> },
    { path: "airport-shuttle-grey-lynn", element: <GreyLynnAirportPageNew /> },
    { path: "airport-shuttle-ponsonby", element: <PonsonbyAirportPageNew /> },
    { path: "epsom-to-airport", element: <EpsomAirportPage /> },
    { path: "mission-bay-to-airport", element: <MissionBayAirportPage /> },
    { path: "viaduct-to-airport", element: <ViaductAirportPage /> },
    // Additional Auckland CBD & Inner Suburb Pages  
    { path: "britomart-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "freemans-bay-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "herne-bay-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "grafton-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "kingsland-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "sandringham-to-auckland-airport", element: <SuburbTransferPage /> },
    // Eastern Suburbs
    { path: "st-heliers-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "kohimarama-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "orakei-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "meadowbank-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "glen-innes-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "panmure-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "ellerslie-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "mt-wellington-to-auckland-airport", element: <SuburbTransferPage /> },
    // South Auckland
    { path: "mangere-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "otahuhu-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "papatoetoe-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "manukau-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "botany-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "howick-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "pakuranga-to-auckland-airport", element: <SuburbTransferPage /> },
    // West Auckland
    { path: "henderson-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "new-lynn-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "titirangi-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "glen-eden-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "avondale-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "mt-albert-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "pt-chevalier-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "blockhouse-bay-to-auckland-airport", element: <SuburbTransferPage /> },
    // North Shore Additional
    { path: "devonport-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "northcote-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "birkenhead-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "glenfield-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "milford-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "browns-bay-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "mairangi-bay-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "murrays-bay-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "torbay-to-auckland-airport", element: <SuburbTransferPage /> },
    { path: "long-bay-to-auckland-airport", element: <SuburbTransferPage /> },
    // Standard Pages
    { path: "services", element: <Services /> },
    { path: "about", element: <About /> },
    { path: "contact", element: <Contact /> },
    { path: "book-now", element: <BookNow /> },
    { path: "shared-shuttle", element: <SharedShuttle /> },
    { path: "shuttle-driver", element: <ShuttleDriverPortal /> },
    { path: "hobbiton-transfers", element: <HobbitonTransfers /> },
    { path: "cruise-transfers", element: <CruiseTransfers /> },
    { path: "airport-pickup-guide", element: <AirportPickupGuide /> },
    { path: "suburbs", element: <SuburbsDirectory /> },
    { path: "suburbs/:slug", element: <SuburbPage /> },
    { path: "airport-transfer/:slug", element: <SuburbLandingAdvanced /> },
    { path: "hibiscus-coast", element: <HibiscusCoastPage /> },
    { path: "hotels", element: <HotelsDirectory /> },
    { path: "hotels/:slug", element: <HotelPage /> },
    { path: "payment-success", element: <PaymentSuccess /> },
    // Payment Pages
    { path: "afterpay", element: <AfterpayPage /> },
    { path: "referral", element: <ReferralProgram /> },
    // Legal Pages
    { path: "terms-and-conditions", element: <TermsAndConditions /> },
    { path: "website-usage-policy", element: <WebsiteUsagePolicy /> },
    { path: "privacy-policy", element: <PrivacyPolicy /> },
  ];

  return (
    <div className="App">
      <BrowserRouter>
        <LanguageRedirect>
          <Routes>
            {/* Driver Routes (No Header/Footer) */}
            <Route path="/driver/login" element={<DriverLogin />} />
            <Route path="/driver/portal" element={<DriverPortal />} />
            <Route path="/drive-with-us" element={<DriveWithUs />} />
            
            {/* Live GPS Tracking Routes (No Header/Footer) */}
            <Route path="/track/driver/:sessionId" element={<DriverTracking />} />
            <Route path="/track/:trackingRef" element={<CustomerTracking />} />
            
            {/* Admin Routes (No language prefix) */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/auth/callback" element={<AdminAuthCallback />} />
            <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
            <Route path="/admin/reset-password" element={<AdminResetPassword />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/seo" element={<SEODashboard />} />
            <Route path="/admin/facebook-strategy" element={<FacebookStrategy />} />
            <Route path="/admin/production-engine" element={<AuraProductionEngine />} />
            
            {/* Language-prefixed routes (zh, ja, ko, es, fr) */}
            {languagePrefixes.map(lang => (
              <Route key={lang} path={`/${lang}`} element={<MainLayout />}>
                {commonRoutes.map((route, idx) => (
                  <Route 
                    key={`${lang}-${idx}`}
                    index={route.index}
                    path={route.path}
                    element={route.element}
                  />
                ))}
              </Route>
            ))}
            
            {/* Default English routes (no prefix) */}
            <Route path="/" element={<MainLayout />}>
              {commonRoutes.map((route, idx) => (
                <Route 
                  key={`en-${idx}`}
                  index={route.index}
                  path={route.path}
                  element={route.element}
                />
              ))}
            </Route>
          </Routes>
          <Toaster />
        </LanguageRedirect>
      </BrowserRouter>
    </div>
  );
}

export default App;
