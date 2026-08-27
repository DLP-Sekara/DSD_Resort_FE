import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'HEAD_CHEF';

interface RoleProtectedRouteProps {
  allowedRoles?: string[];
  redirectPath?: string;
}

export const getDefaultRedirectPath = (role?: string): string => {
  const r = (role || '').toUpperCase();
  if (r === 'HEAD_CHEF' || r === 'CHEF') {
    return '/dashboard/chef-desk';
  }
  return '/dashboard';
};

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  allowedRoles,
  redirectPath,
}) => {
  const { userData } = useAuth();

  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (userData?.role || '').toUpperCase();

  // ADMIN has full access to all sections
  if (userRole === 'ADMIN') {
    return <Outlet />;
  }

  // If specific allowed roles are defined, verify membership
  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.some((role) => role.toUpperCase() === userRole);

    if (!isAllowed) {
      const fallback = redirectPath || getDefaultRedirectPath(userRole);
      return <Navigate to={fallback} replace />;
    }
  }

  return <Outlet />;
};

export default RoleProtectedRoute;
