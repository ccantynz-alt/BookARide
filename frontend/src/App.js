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
import TermsAndConditions from './pages/TermsAndConditions';
import WebsiteUsagePolicy from './pages/WebsiteUsagePolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import siteConfig from './config/siteConfig';
import AdminDashboard from './pages/AdminDashboard';
import SEODashboard from './pages/SEODashboard';
import DriverLogin from './pages/DriverLogin';
import DriverPortal from './pages/DriverPortal';
import { Toaster } from './components/ui/sonner';
import BackToTop from './components/BackToTop';
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
    // Standard Pages
    { path: "services", element: <Services /> },
    { path: "about", element: <About /> },
    { path: "contact", element: <Contact /> },
    { path: "book-now", element: <BookNow /> },
    { path: "hobbiton-transfers", element: <HobbitonTransfers /> },
    { path: "cruise-transfers", element: <CruiseTransfers /> },
    { path: "suburbs", element: <SuburbsDirectory /> },
    { path: "suburbs/:slug", element: <SuburbPage /> },
    { path: "hibiscus-coast", element: <HibiscusCoastPage /> },
    { path: "hotels", element: <HotelsDirectory /> },
    { path: "hotels/:slug", element: <HotelPage /> },
    { path: "payment-success", element: <PaymentSuccess /> },
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
            
            {/* Admin Routes (No language prefix) */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/seo" element={<SEODashboard />} />
            
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
