import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/navigation/Navbar';
import LandingPage from './components/landing/LandingPage';
import RepairPage from './components/repair/RepairPage';
import Community from './components/community/Community';
import AuthPage from './components/auth/AuthPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
    <Router>
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
        <Route path="/community" element={<Community />} />
              <Route path="/pricing" element={<div>Pricing Page (Coming Soon)</div>} />
              <Route path="/faq" element={<div>FAQ Page (Coming Soon)</div>} />
      </Routes>
          </main>
        </div>
    </Router>
    </AuthProvider>
  );
}

export default App;
