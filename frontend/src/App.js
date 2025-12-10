import React from 'react';
import './App.css';
import './i18n/config';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  // Generate language-prefixed routes
  const languagePrefixes = SUPPORTED_LANGUAGES.filter(l => l.code !== 'en').map(l => l.code);

  // Common page routes that need language prefixes
  const PageRoutes = () => (
    <>
      <Route index element={siteConfig.isInternational ? <InternationalHomePage /> : <Home />} />
      
      {/* International Pages */}
      <Route path="international/auckland-airport" element={<AucklandAirportInternational />} />
      <Route path="international/hamilton-airport" element={<HamiltonAirportInternational />} />
      <Route path="international/corporate-transfers" element={<CorporateTransfers />} />
      <Route path="international/group-bookings" element={<GroupBookings />} />
      
      {/* Market-Specific Landing Pages */}
      <Route path="visitors/australia" element={<AustraliaLanding />} />
      <Route path="visitors/china" element={<ChinaLanding />} />
      <Route path="visitors/japan" element={<JapanLanding />} />
      <Route path="visitors/korea" element={<KoreaLanding />} />
      <Route path="visitors/singapore" element={<SingaporeLanding />} />
      <Route path="visitors/usa" element={<USALanding />} />
      <Route path="visitors/uk" element={<UKLanding />} />
      <Route path="visitors/germany" element={<GermanyLanding />} />
      <Route path="visitors/france" element={<FranceLanding />} />
      
      {/* Standard Pages */}
      <Route path="services" element={<Services />} />
      <Route path="about" element={<About />} />
      <Route path="contact" element={<Contact />} />
      <Route path="book-now" element={<BookNow />} />
      <Route path="hobbiton-transfers" element={<HobbitonTransfers />} />
      <Route path="cruise-transfers" element={<CruiseTransfers />} />
      <Route path="suburbs" element={<SuburbsDirectory />} />
      <Route path="suburbs/:slug" element={<SuburbPage />} />
      <Route path="hibiscus-coast" element={<HibiscusCoastPage />} />
      <Route path="hotels" element={<HotelsDirectory />} />
      <Route path="hotels/:slug" element={<HotelPage />} />
      <Route path="payment-success" element={<PaymentSuccess />} />
      
      {/* Legal Pages */}
      <Route path="terms-and-conditions" element={<TermsAndConditions />} />
      <Route path="website-usage-policy" element={<WebsiteUsagePolicy />} />
      <Route path="privacy-policy" element={<PrivacyPolicy />} />
    </>
  );

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
              <Route key={lang} path={`/${lang}/*`} element={
                <>
                  <InternationalBanner />
                  <Header />
                  <main>
                    <Routes>
                      <PageRoutes />
                    </Routes>
                  </main>
                  <Footer />
                  <BackToTop />
                </>
              } />
            ))}
            
            {/* Default English routes (no prefix) */}
            <Route path="/*" element={
              <>
                <InternationalBanner />
                <Header />
                <main>
                  <Routes>
                    <PageRoutes />
                  </Routes>
                </main>
                <Footer />
                <BackToTop />
              </>
            } />
          </Routes>
          <Toaster />
        </LanguageRedirect>
      </BrowserRouter>
    </div>
  );
}

export default App;
