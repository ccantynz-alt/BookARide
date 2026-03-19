import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { OrgProvider } from '@/context/OrgContext';

// Lazy-loaded pages
const Landing = lazy(() => import('@/pages/Landing'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const DashboardLayout = lazy(() => import('@/pages/dashboard/DashboardLayout'));
const DashboardHome = lazy(() => import('@/pages/dashboard/DashboardHome'));
const Transactions = lazy(() => import('@/pages/dashboard/Transactions'));
const Invoices = lazy(() => import('@/pages/dashboard/Invoices'));
const InvoiceNew = lazy(() => import('@/pages/dashboard/InvoiceNew'));
const Contacts = lazy(() => import('@/pages/dashboard/Contacts'));
const Reports = lazy(() => import('@/pages/dashboard/Reports'));
const ReportDetail = lazy(() => import('@/pages/dashboard/ReportDetail'));
const TaxCenter = lazy(() => import('@/pages/dashboard/TaxCenter'));
const TreatyAnalysis = lazy(() => import('@/pages/dashboard/TreatyAnalysis'));
const Reconciliation = lazy(() => import('@/pages/dashboard/Reconciliation'));
const AIAssistant = lazy(() => import('@/pages/dashboard/AIAssistant'));
const Settings = lazy(() => import('@/pages/dashboard/Settings'));
const Documents = lazy(() => import('@/pages/dashboard/Documents'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-warmgray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-navy-200 border-t-teal-500 rounded-full animate-spin" />
        <p className="text-sm text-warmgray-500 font-medium">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected dashboard routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/new" element={<InvoiceNew />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/:type" element={<ReportDetail />} />
          <Route path="tax" element={<TaxCenter />} />
          <Route path="tax/treaties" element={<TreatyAnalysis />} />
          <Route path="reconciliation" element={<Reconciliation />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="settings" element={<Settings />} />
          <Route path="documents" element={<Documents />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <OrgProvider>
        <AppRoutes />
      </OrgProvider>
    </AuthProvider>
  );
}

export default App;
