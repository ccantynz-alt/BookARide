import React from 'react';
import './App.css';
import './i18n/config';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import Home from './pages/Home';
const Services = React.lazy(() => import('./pages/Services'));
const About = React.lazy(() => import('./pages/About'));
const Contact = React.lazy(() => import('./pages/Contact'));
const BookNow = React.lazy(() => import('./pages/BookNow'));
const PaymentSuccess = React.lazy(() => import('./pages/PaymentSuccess'));
const HobbitonTransfers = React.lazy(() => import('./pages/HobbitonTransfers'));
const CruiseTransfers = React.lazy(() => import('./pages/CruiseTransfers'));
const SuburbPage = React.lazy(() => import('./pages/SuburbPageSEO'));
const SuburbLandingAdvanced = React.lazy(() => import('./pages/seo/SuburbLandingAdvanced'));
const SuburbsDirectory = React.lazy(() => import('./pages/SuburbsDirectory'));
const HotelPage = React.lazy(() => import('./pages/HotelPage'));
const HotelsDirectory = React.lazy(() => import('./pages/HotelsDirectory'));
const HibiscusCoastPage = React.lazy(() => import('./pages/HibiscusCoastPage'));
import InternationalHomePage from './pages/InternationalHomePage';
const AucklandAirportInternational = React.lazy(() => import('./pages/international/AucklandAirportInternational'));
const HamiltonAirportInternational = React.lazy(() => import('./pages/international/HamiltonAirportInternational'));
const CorporateTransfers = React.lazy(() => import('./pages/international/CorporateTransfers'));
const GroupBookings = React.lazy(() => import('./pages/international/GroupBookings'));
// International Market Landing Pages
const AustraliaLanding = React.lazy(() => import('./pages/markets/AustraliaLanding'));
const ChinaLanding = React.lazy(() => import('./pages/markets/ChinaLanding'));
const JapanLanding = React.lazy(() => import('./pages/markets/JapanLanding'));
const KoreaLanding = React.lazy(() => import('./pages/markets/KoreaLanding'));
const SingaporeLanding = React.lazy(() => import('./pages/markets/SingaporeLanding'));
const USALanding = React.lazy(() => import('./pages/markets/USALanding'));
const UKLanding = React.lazy(() => import('./pages/markets/UKLanding'));
const GermanyLanding = React.lazy(() => import('./pages/markets/GermanyLanding'));
const FranceLanding = React.lazy(() => import('./pages/markets/FranceLanding'));
const AdminLogin = React.lazy(() => import('./pages/AdminLogin'));
const AdminAuthCallback = React.lazy(() => import('./pages/AdminAuthCallback'));
const AdminForgotPassword = React.lazy(() => import('./pages/AdminForgotPassword'));
const AdminResetPassword = React.lazy(() => import('./pages/AdminResetPassword'));
const TermsAndConditions = React.lazy(() => import('./pages/TermsAndConditions'));
const WebsiteUsagePolicy = React.lazy(() => import('./pages/WebsiteUsagePolicy'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
import siteConfig from './config/siteConfig';
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const SEODashboard = React.lazy(() => import('./pages/SEODashboard'));
const DriverLogin = React.lazy(() => import('./pages/DriverLogin'));
const DriverPortal = React.lazy(() => import('./pages/DriverPortal'));
const DriveWithUs = React.lazy(() => import('./pages/DriveWithUs'));
import { Toaster } from './components/ui/sonner';
import BackToTop from './components/BackToTop';
import AdminBackButton from './components/AdminBackButton';
import InternationalBanner from './components/InternationalBanner';
import LanguageRedirect from './components/LanguageRedirect';
import { SUPPORTED_LANGUAGES } from './config/languages';
// New SEO Pages
const AucklandAirportShuttle = React.lazy(() => import('./pages/seo/AucklandAirportShuttle'));
const GlobalLanding = React.lazy(() => import('./pages/seo/GlobalLanding'));
const VisitorsHub = React.lazy(() => import('./pages/seo/VisitorsHub'));
const SEORoutePage = React.lazy(() => import('./pages/seo/SEORoutePage'));
const RoutePage = React.lazy(() => import('./pages/routes/RoutePage'));
const RoutesDirectory = React.lazy(() => import('./pages/routes/RoutesDirectory'));
const BlogIndex = React.lazy(() => import('./pages/blog/BlogIndex'));
const BlogPost = React.lazy(() => import('./pages/blog/BlogPost'));
const ComparisonPage = React.lazy(() => import('./pages/compare/ComparisonPage'));
const ComparisonDirectory = React.lazy(() => import('./pages/compare/ComparisonDirectory'));
const FacebookStrategy = React.lazy(() => import('./pages/FacebookStrategy'));
// SEO Battle Pages
const HibiscusCoastShuttlePage = React.lazy(() => import('./pages/seo/HibiscusCoastShuttlePage'));
const BookarideVsHibiscusShuttles = React.lazy(() => import('./pages/seo/BookarideVsHibiscusShuttles'));
const BestHibiscusCoastShuttle = React.lazy(() => import('./pages/seo/BestHibiscusCoastShuttle'));
const OrewaToAirportPage = React.lazy(() => import('./pages/seo/OrewaToAirportPage'));
const WhangaparoaAirportPage = React.lazy(() => import('./pages/seo/WhangaparoaAirportPage'));
const TakapunaAirportPage = React.lazy(() => import('./pages/seo/TakapunaAirportPage'));
const AlbanyAirportPage = React.lazy(() => import('./pages/seo/AlbanyAirportPage'));
const NorthShoreAirportPage = React.lazy(() => import('./pages/seo/NorthShoreAirportPage'));
const AirportToCityPage = React.lazy(() => import('./pages/seo/AirportToCityPage'));
const AfterpayPage = React.lazy(() => import('./pages/AfterpayPage'));
const ReferralProgram = React.lazy(() => import('./pages/ReferralProgram'));
const FlightTrackerPage = React.lazy(() => import('./pages/FlightTrackerPage'));
const TravelResourcesPage = React.lazy(() => import('./pages/TravelResourcesPage'));
const InternationalVisitors = React.lazy(() => import('./pages/InternationalVisitors'));
// Auckland CBD SEO Pages
const CBDHubPage = React.lazy(() => import('./pages/seo/auckland-cbd/CBDHubPage'));
const PonsonbyAirportPage = React.lazy(() => import('./pages/seo/auckland-cbd/PonsonbyAirportPage'));
const ParnellAirportPage = React.lazy(() => import('./pages/seo/auckland-cbd/ParnellAirportPage'));
const NewmarketAirportPage = React.lazy(() => import('./pages/seo/auckland-cbd/NewmarketAirportPage'));
const RemueraAirportPage = React.lazy(() => import('./pages/seo/auckland-cbd/RemueraAirportPage'));
const MtEdenAirportPage = React.lazy(() => import('./pages/seo/auckland-cbd/MtEdenAirportPage'));
const GreyLynnAirportPage = React.lazy(() => import('./pages/seo/auckland-cbd/GreyLynnAirportPage'));
const EpsomAirportPage = React.lazy(() => import('./pages/seo/auckland-cbd/EpsomAirportPage'));
const MissionBayAirportPage = React.lazy(() => import('./pages/seo/auckland-cbd/MissionBayAirportPage'));
const ViaductAirportPage = React.lazy(() => import('./pages/seo/auckland-cbd/ViaductAirportPage'));
// Programmatic SEO Pages
const SuburbTransferPage = React.lazy(() => import('./pages/seo/SuburbTransferPage'));
const CompetitorComparisonPage = React.lazy(() => import('./pages/seo/CompetitorComparisonPage'));
// NEW SEO Attack Pages - Top 5 Keywords
const AirportShuttlePage = React.lazy(() => import('./pages/seo/AirportShuttlePage'));
const AirportShuttleServicePage = React.lazy(() => import('./pages/seo/AirportShuttleServicePage'));
const SharedRidePage = React.lazy(() => import('./pages/seo/SharedRidePage'));
const AucklandCBDToAirportPage = React.lazy(() => import('./pages/seo/AucklandCBDToAirportPage'));
// NEW: Mount Roskill Corridor SEO Pages
const MountRoskillAirportPage = React.lazy(() => import('./pages/seo/MountRoskillAirportPage'));
const SandringhamAirportPage = React.lazy(() => import('./pages/seo/SandringhamAirportPage'));
const MountEdenAirportPage = React.lazy(() => import('./pages/seo/MountEdenAirportPage'));
const MountAlbertAirportPage = React.lazy(() => import('./pages/seo/MountAlbertAirportPage'));
const EpsomAirportPageNew = React.lazy(() => import('./pages/seo/EpsomAirportPage'));
const NewmarketAirportPageNew = React.lazy(() => import('./pages/seo/NewmarketAirportPage'));
const ParnellAirportPageNew = React.lazy(() => import('./pages/seo/ParnellAirportPage'));
const RemueraAirportPageNew = React.lazy(() => import('./pages/seo/RemueraAirportPage'));
const GreyLynnAirportPageNew = React.lazy(() => import('./pages/seo/GreyLynnAirportPage'));
const PonsonbyAirportPageNew = React.lazy(() => import('./pages/seo/PonsonbyAirportPage'));
// International Market Landing Pages
const CountryLandingPage = React.lazy(() => import('./pages/international/CountryLandingPage'));
// Shared Shuttle Service
const SharedShuttle = React.lazy(() => import('./pages/SharedShuttle'));
const ShuttleDriverPortal = React.lazy(() => import('./pages/ShuttleDriverPortal'));
// Live GPS Tracking
const DriverTracking = React.lazy(() => import('./pages/DriverTracking'));
const CustomerTracking = React.lazy(() => import('./pages/CustomerTracking'));
// Airport Pickup Guide
const AirportPickupGuide = React.lazy(() => import('./pages/AirportPickupGuide'));
// Travel Agent Page
const TravelAgents = React.lazy(() => import('./pages/TravelAgents'));
// Hotel Concierge Portal
const HotelConciergePortal = React.lazy(() => import('./pages/HotelConciergePortal'));

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
// Lightweight fallback while lazy routes load
const RouteLoadingFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center text-sm text-gray-600">
    Loading page...
  </div>
);


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
          <React.Suspense fallback={<RouteLoadingFallback />}>
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
          </React.Suspense>
          <Toaster />
        </LanguageRedirect>
      </BrowserRouter>
    </div>
  );
}

export default App;
