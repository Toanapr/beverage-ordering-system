import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';
import { PageLoader } from './Feedback';

export function ProtectedRoute({ roles }: { roles: Role[] }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <div className="route-loader"><PageLoader /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!roles.includes(user.role)) return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'staff' ? '/staff' : '/'} replace />;
  return <Outlet />;
}
