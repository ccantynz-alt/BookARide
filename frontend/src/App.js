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

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Driver Routes (No Header/Footer) */}
          <Route path="/driver/login" element={<DriverLogin />} />
          <Route path="/driver/portal" element={<DriverPortal />} />
          
          {/* Public Routes (With Header/Footer) */}
          <Route path="*" element={
            <>
              <InternationalBanner />
              <Header />
              <main>
                <Routes>
                  <Route path="/" element={siteConfig.isInternational ? <InternationalHomePage /> : <Home />} />
                  
                  {/* International Pages */}
                  <Route path="/international/auckland-airport" element={<AucklandAirportInternational />} />
                  <Route path="/international/hamilton-airport" element={<HamiltonAirportInternational />} />
                  <Route path="/international/corporate-transfers" element={<CorporateTransfers />} />
                  <Route path="/international/group-bookings" element={<GroupBookings />} />
                  
                  {/* Standard Pages */}
                  <Route path="/services" element={<Services />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/book-now" element={<BookNow />} />
                  <Route path="/hobbiton-transfers" element={<HobbitonTransfers />} />
                  <Route path="/cruise-transfers" element={<CruiseTransfers />} />
                  <Route path="/suburbs" element={<SuburbsDirectory />} />
                  <Route path="/suburbs/:slug" element={<SuburbPage />} />
                  <Route path="/hibiscus-coast" element={<HibiscusCoastPage />} />
                  <Route path="/hotels" element={<HotelsDirectory />} />
                  <Route path="/hotels/:slug" element={<HotelPage />} />
                  <Route path="/payment-success" element={<PaymentSuccess />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/seo" element={<SEODashboard />} />
                  
                  {/* Legal Pages */}
                  <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                  <Route path="/website-usage-policy" element={<WebsiteUsagePolicy />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                </Routes>
              </main>
              <Footer />
              <BackToTop />
            </>
          } />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;
