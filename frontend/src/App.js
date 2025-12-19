import React from 'react';
import './App.css';
import './i18n/config';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
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
    // Market-Specific Landing Pages (Old)
    { path: "visitors/australia", element: <AustraliaLanding /> },
    { path: "visitors/china", element: <ChinaLanding /> },
    { path: "visitors/japan", element: <JapanLanding /> },
    { path: "visitors/korea", element: <KoreaLanding /> },
    { path: "visitors/singapore", element: <SingaporeLanding /> },
    { path: "visitors/usa", element: <USALanding /> },
    { path: "visitors/uk", element: <UKLanding /> },
    { path: "visitors/germany", element: <GermanyLanding /> },
    { path: "visitors/france", element: <FranceLanding /> },
    // NEW: Global SEO Pages
    { path: "visitors", element: <VisitorsHub /> },
    { path: "visitors/:countrySlug", element: <GlobalLanding /> },
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
    { path: "hobbiton-transfers", element: <HobbitonTransfers /> },
    { path: "cruise-transfers", element: <CruiseTransfers /> },
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
          <Toaster />
        </LanguageRedirect>
      </BrowserRouter>
    </div>
  );
}

export default App;
