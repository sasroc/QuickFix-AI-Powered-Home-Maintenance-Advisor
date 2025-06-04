import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './FindPro.css';

const FindPro = ({ repairData }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  // Mock data - this would come from an API in production
  const professionals = [
    {
      id: 1,
      name: "John's Plumbing Services",
      category: "plumbing",
      rating: 4.8,
      reviews: 124,
      location: "2.5 miles away",
      isVerified: true,
      services: ["Pipe Repair", "Drain Cleaning", "Fixture Installation"],
      availability: "Available Today",
      priceRange: "$$",
      image: "https://example.com/pro1.jpg"
    },
    {
      id: 2,
      name: "Elite Home Solutions",
      category: "general",
      rating: 4.9,
      reviews: 89,
      location: "1.8 miles away",
      isVerified: true,
      services: ["General Repairs", "Home Maintenance", "Emergency Services"],
      availability: "Available Tomorrow",
      priceRange: "$$$",
      image: "https://example.com/pro2.jpg"
    },
    {
      id: 3,
      name: "Quick Fix Electric",
      category: "electrical",
      rating: 4.7,
      reviews: 156,
      location: "3.2 miles away",
      isVerified: true,
      services: ["Electrical Repairs", "Lighting Installation", "Safety Inspections"],
      availability: "Available Today",
      priceRange: "$$",
      image: "https://example.com/pro3.jpg"
    }
  ];

  const filteredProfessionals = professionals
    .filter(pro => selectedCategory === 'all' || pro.category === selectedCategory)
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'distance') return parseFloat(a.location) - parseFloat(b.location);
      return 0;
    });

  return (
    <div className="find-pro-container">
      <div className="find-pro-header">
        <h2>Find a Professional</h2>
        <p>Connect with verified professionals in your area</p>
      </div>

      <div className="filters-section">
        <div className="category-filter">
          <button
            className={selectedCategory === 'all' ? 'active' : ''}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
          <button
            className={selectedCategory === 'plumbing' ? 'active' : ''}
            onClick={() => setSelectedCategory('plumbing')}
          >
            Plumbing
          </button>
          <button
            className={selectedCategory === 'electrical' ? 'active' : ''}
            onClick={() => setSelectedCategory('electrical')}
          >
            Electrical
          </button>
          <button
            className={selectedCategory === 'general' ? 'active' : ''}
            onClick={() => setSelectedCategory('general')}
          >
            General
          </button>
        </div>

        <div className="sort-filter">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="rating">Rating</option>
            <option value="distance">Distance</option>
          </select>
        </div>
      </div>

      <div className="professionals-grid">
        {filteredProfessionals.map((pro) => (
          <motion.div
            key={pro.id}
            className="professional-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="pro-header">
              <img src={pro.image} alt={pro.name} className="pro-image" />
              {pro.isVerified && (
                <span className="verified-badge">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  Verified
                </span>
              )}
            </div>

            <div className="pro-content">
              <h3>{pro.name}</h3>
              <div className="pro-rating">
                <span className="stars">
                  {'★'.repeat(Math.floor(pro.rating))}
                  {'☆'.repeat(5 - Math.floor(pro.rating))}
                </span>
                <span className="rating-number">{pro.rating}</span>
                <span className="reviews">({pro.reviews} reviews)</span>
              </div>
              <p className="location">{pro.location}</p>
              <div className="services">
                {pro.services.map((service, index) => (
                  <span key={index} className="service-tag">{service}</span>
                ))}
              </div>
              <div className="pro-footer">
                <span className="availability">{pro.availability}</span>
                <span className="price-range">{pro.priceRange}</span>
              </div>
            </div>

            <button className="contact-button">Contact Professional</button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FindPro; 