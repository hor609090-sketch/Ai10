import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PortalRoute = ({ children }) => {
  const { isPortalAuthenticated, loading } = useAuth();

  // DEMO_MODE OFF - require real authentication
  const DEMO_MODE = false;

  if (loading && !DEMO_MODE) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--portal-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: 'var(--portal-accent)' }}></div>
      </div>
    );
  }

  if (!isPortalAuthenticated && !DEMO_MODE) {
    return <Navigate to="/client-login" replace />;
  }

  return children;
};

export default PortalRoute;
