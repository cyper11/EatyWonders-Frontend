import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleRoute = ({ roles, element }) => {
  const { user, loading } = useAuth();
  const normalizedRole = user?.role === 'end_user' ? 'user' : user?.role;
  const normalizedRoles = roles?.map((role) => (role === 'end_user' ? 'user' : role));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-content-secondary animate-pulse">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!normalizedRoles?.includes(normalizedRole)) return <Navigate to="/" replace />;
  
  return element;
};

export default RoleRoute;
