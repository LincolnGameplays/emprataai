/**
 * PrivateRoute - Role-Based Access Control v2.0
 * 
 * FEATURES:
 * 1. Authentication check - Redirects to /auth if not logged in
 * 2. Role verification - Ensures users access their designated areas
 * 3. Cross-role protection - Customers can't access /dashboard, Owners can't access /me
 * 4. Branded loading state - Professional spinner while checking auth
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  children: JSX.Element;
  allowedRole?: 'OWNER' | 'CUSTOMER'; // Optional: If not passed, accepts any authenticated user
}

export default function PrivateRoute({ children, allowedRole }: Props) {
  const { user, userData, loading } = useAuth();
  const location = useLocation();

  // ════════════════════════════════════════════════════════════════
  // LOADING STATE - Full screen branded spinner
  // ════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="fixed inset-0 h-screen w-screen bg-[#0a0a0a] flex items-center justify-center z-50">
        <div className="text-center">
          {/* Animated Logo */}
          <div className="mb-6">
            <h1 className="text-4xl font-black italic tracking-tight text-white">
              Emprata<span className="text-primary">.ai</span>
            </h1>
          </div>
          
          {/* Spinner */}
          <div className="relative w-16 h-16 mx-auto mb-6">
            {/* Outer ring */}
            <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
            {/* Animated ring */}
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            {/* Inner glow */}
            <div className="absolute inset-2 bg-primary/20 rounded-full blur-md animate-pulse" />
          </div>
          
          {/* Text */}
          <p className="text-white/50 font-bold text-sm uppercase tracking-widest">
            Verificando acesso...
          </p>
        </div>
        
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent pointer-events-none" />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // NOT AUTHENTICATED - Redirect to login
  // ════════════════════════════════════════════════════════════════
  if (!user) {
    console.log('🔒 [PrivateRoute] No user, redirecting to /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // ════════════════════════════════════════════════════════════════
  // ROLE VERIFICATION - Cross-role protection
  // ════════════════════════════════════════════════════════════════
  if (allowedRole && userData?.role) {
    const userRole = userData.role.toUpperCase();
    
    // Customer trying to access Owner area → Redirect to /me
    if (allowedRole === 'OWNER' && userRole === 'CONSUMER') {
      console.log('🔒 [PrivateRoute] Customer tried to access Owner area, redirecting to /me');
      return <Navigate to="/me" replace />;
    }
    
    // Owner trying to access Customer area → Redirect to /dashboard
    if (allowedRole === 'CUSTOMER' && (userRole === 'OWNER' || userRole === 'ADMIN')) {
      console.log('🔒 [PrivateRoute] Owner tried to access Customer area, redirecting to /dashboard');
      return <Navigate to="/dashboard" replace />;
    }
  }

  // ════════════════════════════════════════════════════════════════
  // AUTHENTICATED & AUTHORIZED - Render children
  // ════════════════════════════════════════════════════════════════
  return children;
}
