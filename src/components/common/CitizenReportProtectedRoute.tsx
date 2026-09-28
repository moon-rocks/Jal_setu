import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingState } from '../ui/LoadingState';
import { useAuth } from '../../context/AuthContext';

export const CitizenReportProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState message="Checking your session..." className="min-h-screen" />;
  }

  if (!user) {
    return (
      <Navigate
        to="/signup"
        replace
        state={{
          flow: 'report',
          returnTo: location.pathname,
          returnState: location.state,
        }}
      />
    );
  }

  return <Outlet />;
};