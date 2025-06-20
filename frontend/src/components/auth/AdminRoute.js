import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // If not logged in, redirect to auth page
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!currentUser.isAdmin) {
    // If logged in but not an admin, redirect to home page
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute; 