import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './components/pages/Home'
import NotFound from './components/pages/NotFound'

// Lazy-loaded pages (code splitting)
const Services = lazy(() => import('./components/pages/Services'))
const BookNow = lazy(() => import('./components/pages/BookNow'))
const About = lazy(() => import('./components/pages/About'))
const Contact = lazy(() => import('./components/pages/Contact'))
const PaymentSuccess = lazy(() => import('./components/pages/PaymentSuccess'))
const Terms = lazy(() => import('./components/pages/Terms'))
const Privacy = lazy(() => import('./components/pages/Privacy'))
const WebsiteUsage = lazy(() => import('./components/pages/WebsiteUsage'))

// Admin (lazy)
const AdminLogin = lazy(() => import('./components/admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes with header/footer */}
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          <Route path="book-now" element={<BookNow />} />
          <Route path="about" element={<About />} />
          <Route path="payment/success" element={<PaymentSuccess />} />
          <Route path="contact" element={<Contact />} />
          <Route path="terms-and-conditions" element={<Terms />} />
          <Route path="privacy-policy" element={<Privacy />} />
          <Route path="website-usage-policy" element={<WebsiteUsage />} />

          {/* Service page aliases */}
          <Route path="shared-shuttle" element={<Services />} />
          <Route path="cruise-transfers" element={<Services />} />
          <Route path="hobbiton-transfers" element={<Services />} />

          {/* Catch-all (inside layout) */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin routes (no header/footer) */}
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin" element={<AdminDashboard />} />
      </Routes>
    </Suspense>
  )
}
