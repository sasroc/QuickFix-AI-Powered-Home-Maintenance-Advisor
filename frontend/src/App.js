import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import Navbar from './components/navigation/Navbar';
import ScrollToTop from './components/navigation/ScrollToTop';
import LandingPage from './components/landing/LandingPage';
import RepairPage from './components/repair/RepairPage';
import RepairHistory from './components/repair/RepairHistory';
import HistoricalRepairView from './components/repair/HistoricalRepairView';
import Community from './components/community/Community';
import AuthPage from './components/auth/AuthPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import PaymentSuccess from './components/landing/PaymentSuccess';
import useCreateUserInFirestore from './contexts/useCreateUserInFirestore';
import AccountSettings from './components/auth/AccountSettings';
import PricingPage from './components/pricing/PricingPage';
import FAQ from './components/faq/FAQ';
import useAnalytics from './hooks/useAnalytics';

// Component to track page views
const PageViewTracker = () => {
  const location = useLocation();
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    const pageName = location.pathname.split('/').pop() || 'home';
    trackPageView(pageName);
  }, [location, trackPageView]);

  return null;
};

function App() {
  useCreateUserInFirestore();
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <PageViewTracker />
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route
                path="/repair"
                element={
                  <ProtectedRoute>
                    <RepairPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/repair/history"
                element={
                  <ProtectedRoute>
                    <RepairHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/repair/history/:id"
                element={
                  <ProtectedRoute>
                    <HistoricalRepairView />
                  </ProtectedRoute>
                }
              />
              <Route path="/community" element={<Community />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/settings" element={<AccountSettings />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
