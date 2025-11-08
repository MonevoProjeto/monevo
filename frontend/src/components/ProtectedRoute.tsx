import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

// Wrap routes that require authentication with <ProtectedRoute>
// Usage: <Route path="/index" element={<ProtectedRoute><Index /></ProtectedRoute>} />
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { currentUser } = useApp();

  // If we don't have a currentUser (or token), redirect to login
  if (!currentUser && !localStorage.getItem('token')) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
