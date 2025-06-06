import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import LandingPage from './components/landing/LandingPage';
import RepairPage from './components/repair/RepairPage';
import Community from './components/community/Community';
import StoreFinder from './components/store/StoreFinder';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/repair" element={<RepairPage />} />
        <Route path="/community" element={<Community />} />
        <Route path="/stores" element={<StoreFinder />} />
      </Routes>
    </Router>
  );
}

export default App;
