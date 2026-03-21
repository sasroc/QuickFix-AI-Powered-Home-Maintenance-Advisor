import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc, increment, getDoc } from 'firebase/firestore';
import './Community.css';

function Community() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [posts, setPosts] = useState([]);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    category: 'general',
    description: '',
    beforeImage: null,
    afterImage: null,
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();
  const db = getFirestore();

  useEffect(() => {
    const postsRef = collection(db, 'community_posts');
    const q = query(postsRef, orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
    }, (error) => {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts. Please try again later.');
    });

    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!currentUser) {
        setIsSubscribed(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsSubscribed(userData.subscriptionStatus === 'active');
        } else {
          setIsSubscribed(false);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setIsSubscribed(false);
      }
    };

    checkSubscription();
  }, [currentUser, db]);

  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Compress the image before converting to base64
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions while maintaining aspect ratio
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with reduced quality
          const base64String = canvas.toDataURL('image/jpeg', 0.7);
          resolve(base64String);
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!currentUser || !isSubscribed) {
      setError('You need an active subscription to create posts.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Convert images to base64
      const [beforeImageBase64, afterImageBase64] = await Promise.all([
        convertImageToBase64(newPost.beforeImage),
        convertImageToBase64(newPost.afterImage)
      ]);

      const postData = {
        title: newPost.title,
        category: newPost.category,
        description: newPost.description,
        beforeImage: beforeImageBase64,
        afterImage: afterImageBase64,
        tags: newPost.tags,
        author: currentUser.displayName || currentUser.email,
        authorId: currentUser.uid,
        likes: 0,
        likedBy: [],
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'community_posts'), postData);
      setIsCreatingPost(false);
      setNewPost({
        title: '',
        category: 'general',
        description: '',
        beforeImage: null,
        afterImage: null,
        tags: []
      });
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error.message || 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (postId, postTitle) => {
    setDeleteConfirmation({
      postId,
      postTitle
    });
  };

  const handleDeleteConfirm = async () => {
    if (!currentUser || !deleteConfirmation) return;
    
    try {
      await deleteDoc(doc(db, 'community_posts', deleteConfirmation.postId));
      setDeleteConfirmation(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Failed to delete post. Please try again.');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation(null);
  };

  const handleLike = async (postId, currentLikes, likedBy) => {
    if (!currentUser) return;
    
    try {
      const postRef = doc(db, 'community_posts', postId);
      const hasLiked = likedBy.includes(currentUser.uid);
      
      if (hasLiked) {
        // Unlike
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: likedBy.filter(id => id !== currentUser.uid)
        });
      } else {
        // Like
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: [...likedBy, currentUser.uid]
        });
      }
    } catch (error) {
      console.error('Error updating like:', error);
      setError('Failed to update like. Please try again.');
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !newPost.tags.includes(tagInput.trim())) {
      setNewPost(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setNewPost(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const filteredPosts = posts
    .filter(post => {
      if (selectedCategory === 'my-posts') {
        return currentUser && post.authorId === currentUser.uid;
      }
      return selectedCategory === 'all' || post.category === selectedCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') return b.timestamp?.toDate() - a.timestamp?.toDate();
      if (sortBy === 'popular') return b.likes - a.likes;
      return 0;
    });

  return (
    <div className={`community-container ${isDarkMode ? 'dark' : ''}`}>
      <Helmet>
        <title>Community | QuickFix AI — Real Home Repair Success Stories</title>
        <meta name="description" content="See how homeowners are fixing their homes with AI-powered guidance. Browse real repair success stories for plumbing, electrical, HVAC, and drywall projects." />
        <link rel="canonical" href="https://quickfixai.com/community" />
      </Helmet>
      <div className="community-header">
        <h2>Community Success Stories</h2>
        <p>Share your repair victories and learn from others</p>
        {currentUser ? (
          isSubscribed ? (
            <button 
              className="create-post-button"
              onClick={() => setIsCreatingPost(true)}
            >
              Share your story
            </button>
          ) : (
            <p className="subscription-prompt">
              Subscribe to share your success stories with the community
            </p>
          )
        ) : (
          <p className="sign-in-prompt">
            Sign in to create posts and interact with the community
          </p>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {isCreatingPost && currentUser && isSubscribed && (
        <div className="create-post-modal">
          <div className={`create-post-content ${isDarkMode ? 'dark' : ''}`}>
            <h3>Create New Post</h3>
            <form onSubmit={handleCreatePost}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost(prev => ({ ...prev, category: e.target.value }))}
                  disabled={isSubmitting}
                >
                  <option value="general">General</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newPost.description}
                  onChange={(e) => setNewPost(prev => ({ ...prev, description: e.target.value }))}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>Before Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewPost(prev => ({ ...prev, beforeImage: e.target.files[0] }))}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>After Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewPost(prev => ({ ...prev, afterImage: e.target.files[0] }))}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>Tags</label>
                <div className="tag-input">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    disabled={isSubmitting}
                  />
                  <button 
                    type="button" 
                    onClick={handleAddTag}
                    disabled={isSubmitting}
                  >
                    Add
                  </button>
                </div>
                <div className="tags">
                  {newPost.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag(tag)}
                        disabled={isSubmitting}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Post'}
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setIsCreatingPost(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmation && currentUser && (
        <div className="delete-confirmation-modal">
          <div className={`delete-confirmation-content ${isDarkMode ? 'dark' : ''}`}>
            <h3>Delete Post</h3>
            <p>Are you sure you want to delete "{deleteConfirmation.postTitle}"? This action cannot be undone.</p>
            <div className="delete-confirmation-actions">
              <button 
                className="delete-confirm-button"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
              <button 
                className="delete-cancel-button"
                onClick={handleDeleteCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="filters-section">
        <div className="category-filter">
          <button
            className={selectedCategory === 'all' ? 'active' : ''}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
          {currentUser && (
            <button
              className={selectedCategory === 'my-posts' ? 'active' : ''}
              onClick={() => setSelectedCategory('my-posts')}
            >
              My Posts
            </button>
          )}
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
        {filteredPosts.length === 0 ? (
          <div className="no-posts-message">
            {selectedCategory === 'my-posts' ? (
              <>
                You haven't shared any stories yet.
                {isSubscribed && (
                  <button 
                    className="create-post-button"
                    onClick={() => setIsCreatingPost(true)}
                  >
                    Share your first story!
                  </button>
                )}
              </>
            ) : (
              <>
                No posts found in the {selectedCategory === 'all' ? 'community' : selectedCategory} category.
                {currentUser && isSubscribed && (
                  <button 
                    className="create-post-button"
                    onClick={() => setIsCreatingPost(true)}
                  >
                    Be the first to share!
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          filteredPosts.map((post) => (
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
                  <span className="date">
                    {post.timestamp?.toDate().toLocaleDateString()}
                  </span>
                </div>
                <p className="description">{post.description}</p>
                <div className="tags">
                  {post.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
                <div className="post-actions">
                  {currentUser ? (
                    <button 
                      className={`like-button ${post.likedBy?.includes(currentUser.uid) ? 'liked' : ''}`}
                      onClick={() => handleLike(post.id, post.likes, post.likedBy || [])}
                    >
                      <span className="icon">❤️</span>
                      <span className="count">{post.likes}</span>
                    </button>
                  ) : (
                    <div className="like-button disabled">
                      <span className="icon">❤️</span>
                      <span className="count">{post.likes}</span>
                    </div>
                  )}
                  {currentUser && post.authorId === currentUser.uid && (
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteClick(post.id, post.title)}
                    >
                      <span className="icon">🗑️</span>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

export default Community; 