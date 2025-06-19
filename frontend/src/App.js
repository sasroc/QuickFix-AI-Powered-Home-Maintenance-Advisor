import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/navigation/Navbar';
import Footer from './components/navigation/Footer';
import ScrollToTop from './components/navigation/ScrollToTop';
import LandingPage from './components/landing/LandingPage';
import RepairPage from './components/repair/RepairPage';
import RepairHistory from './components/repair/RepairHistory';
import HistoricalRepairView from './components/repair/HistoricalRepairView';
import Community from './components/community/Community';
import AuthPage from './components/auth/AuthPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PaymentSuccess from './components/landing/PaymentSuccess';
import useCreateUserInFirestore from './contexts/useCreateUserInFirestore';
import AccountSettings from './components/auth/AccountSettings';
import PricingPage from './components/pricing/PricingPage';
import FAQ from './components/faq/FAQ';
import useAnalytics from './hooks/useAnalytics';
import TermsOfService from './components/legal/TermsOfService';
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import HelpButton from './components/common/HelpButton';

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
      <ThemeProvider>
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
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
            <HelpButton />
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
