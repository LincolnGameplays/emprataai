/**
 * Protected Route Component - v2.0
 * Full-screen loading spinner + auth redirect
 * 
 * VISUAL: Shows branded spinner while auth loads
 * SECURITY: Redirects to /auth if not authenticated
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // ============================================
  // LOADING STATE - Full screen branded spinner
  // ============================================
  if (loading) {
    return (
      <div className="fixed inset-0 h-screen w-screen bg-[#0a0a0a] flex items-center justify-center z-50">
        <div className="text-center">
          {/* Animated Logo */}
          <div className="mb-6">
            <h1 className="text-4xl font-black italic tracking-tight">
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
            Carregando Emprata AI...
          </p>
          
          {/* Subtle hint */}
          <p className="text-white/20 font-medium text-xs mt-4">
            Conectando ao servidor
          </p>
        </div>
        
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent pointer-events-none" />
      </div>
    );
  }

  // ============================================
  // NOT AUTHENTICATED - Redirect to login
  // ============================================
  if (!user) {
    console.log('🔒 [ProtectedRoute] No user, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  // ============================================
  // AUTHENTICATED - Render children
  // ============================================
  return <>{children}</>;
}
