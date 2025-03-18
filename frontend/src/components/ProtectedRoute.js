import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const ProtectedRoute = ({ children }) => {
  const auth = useAuth();
  
  if (!auth) {
    console.error("Auth context is undefined!");
    return <Navigate to="/admin/login" />;
  }
  
  const { isAuthenticated, isAdmin, loading } = auth;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    console.log('Not authenticated or not admin, redirecting to login');
    return <Navigate to="/admin/login" />;
  }

  return children;
};

export default ProtectedRoute; 