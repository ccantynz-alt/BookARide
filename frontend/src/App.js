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
import SuburbPage from './pages/SuburbPage';
import SuburbsDirectory from './pages/SuburbsDirectory';
import HotelPage from './pages/HotelPage';
import HotelsDirectory from './pages/HotelsDirectory';
import HibiscusCoastPage from './pages/HibiscusCoastPage';
import AdminLogin from './pages/AdminLogin';
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
                  <Route path="/" element={<Home />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/book-now" element={<BookNow />} />
                  <Route path="/hobbiton-transfers" element={<HobbitonTransfers />} />
                  <Route path="/cruise-transfers" element={<CruiseTransfers />} />
                  <Route path="/suburbs" element={<SuburbsDirectory />} />
                  <Route path="/suburbs/:slug" element={<SuburbPage />} />
                  <Route path="/hotels" element={<HotelsDirectory />} />
                  <Route path="/hotels/:slug" element={<HotelPage />} />
                  <Route path="/payment-success" element={<PaymentSuccess />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/seo" element={<SEODashboard />} />
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
