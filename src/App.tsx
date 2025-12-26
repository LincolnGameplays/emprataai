/**
 * Emprata.ai Routes v1.2
 * Clean routing without admin functionality
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AppStudio from './pages/AppStudio';
import ProfilePage from './pages/ProfilePage';
import SuccessPage from './pages/SuccessPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      {/* Global Toast Notifications */}
      <Toaster 
        position="top-center"
        richColors
        toastOptions={{
          style: {
            background: '#18181b',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
          },
        }}
      />
      
      <div className="min-h-screen relative overflow-x-hidden">
        <Routes>
          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* PUBLIC ROUTES */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<LoginPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          
          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* PROTECTED ROUTES (Requires Authentication) */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          <Route 
            path="/app" 
            element={
              <ProtectedRoute>
                <AppStudio />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/success" 
            element={
              <ProtectedRoute>
                <SuccessPage />
              </ProtectedRoute>
            } 
          />
          
          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* 404 FALLBACK */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
}
