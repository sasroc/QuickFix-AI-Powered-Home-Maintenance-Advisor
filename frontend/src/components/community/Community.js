import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './Community.css';

function Community() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Mock data - this would come from an API in production
  const posts = [
    {
      id: 1,
      title: "Fixed my leaking sink!",
      category: "plumbing",
      author: "Sarah J.",
      date: "2024-03-15",
      likes: 42,
      comments: 8,
      beforeImage: "https://example.com/before1.jpg",
      afterImage: "https://example.com/after1.jpg",
      description: "Used QuickFix to fix my leaking sink. The step-by-step guide was super helpful!",
      tags: ["plumbing", "sink", "leak"]
    },
    {
      id: 2,
      title: "Successfully replaced my door handle",
      category: "general",
      author: "Mike R.",
      date: "2024-03-14",
      likes: 28,
      comments: 5,
      beforeImage: "https://example.com/before2.jpg",
      afterImage: "https://example.com/after2.jpg",
      description: "Never thought I could do this myself. Thanks QuickFix!",
      tags: ["door", "hardware", "replacement"]
    },
    {
      id: 3,
      title: "Fixed my flickering light fixture",
      category: "electrical",
      author: "Lisa M.",
      date: "2024-03-13",
      likes: 35,
      comments: 12,
      beforeImage: "https://example.com/before3.jpg",
      afterImage: "https://example.com/after3.jpg",
      description: "The electrical guide was clear and safe. Saved me $200!",
      tags: ["electrical", "lighting", "fixture"]
    }
  ];

  const filteredPosts = posts
    .filter(post => selectedCategory === 'all' || post.category === selectedCategory)
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'popular') return b.likes - a.likes;
      return 0;
    });

  const handleLike = (postId) => {
    // TODO: Implement like functionality with API
    console.log('Liked post:', postId);
  };

  const handleShare = (post) => {
    // TODO: Implement social sharing
    const shareText = `Check out my repair success story on QuickFix: ${post.title}`;
    console.log('Sharing:', shareText);
  };

  return (
    <div className="community-container">
      <div className="community-header">
        <h2>Community Success Stories</h2>
        <p>Share your repair victories and learn from others</p>
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
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      <div className="posts-grid">
        {filteredPosts.map((post) => (
          <motion.div
            key={post.id}
            className="post-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="post-images">
              <div className="image-container">
                <img src={post.beforeImage} alt="Before" className="before-image" />
                <span className="image-label">Before</span>
              </div>
              <div className="image-container">
                <img src={post.afterImage} alt="After" className="after-image" />
                <span className="image-label">After</span>
              </div>
            </div>

            <div className="post-content">
              <h3>{post.title}</h3>
              <div className="post-meta">
                <span className="author">By {post.author}</span>
                <span className="date">{new Date(post.date).toLocaleDateString()}</span>
              </div>
              <p className="description">{post.description}</p>
              <div className="tags">
                {post.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
              <div className="post-actions">
                <button 
                  className="like-button"
                  onClick={() => handleLike(post.id)}
                >
                  <span className="icon">❤️</span>
                  <span className="count">{post.likes}</span>
                </button>
                <button className="comment-button">
                  <span className="icon">💬</span>
                  <span className="count">{post.comments}</span>
                </button>
                <button 
                  className="share-button"
                  onClick={() => handleShare(post)}
                >
                  <span className="icon">📤</span>
                  Share
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default Community; 