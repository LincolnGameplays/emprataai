/**
 * Emprata.ai Routes v4.0 - App Shell Layout
 */
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';

// Layouts
import AppLayout from './layouts/AppLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AppStudio from './pages/AppStudio';
import Dashboard from './pages/Dashboard';
import MenuBuilder from './pages/MenuBuilder';
import PublicMenu from './pages/PublicMenu';
import KitchenDisplay from './pages/KitchenDisplay';
import StaffManagement from './pages/StaffManagement';
import WaiterLogin from './pages/WaiterLogin';
import WaiterApp from './pages/WaiterApp';
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
      
      <Routes>
        {/* ══════════════════════════════════════════════════════════ */}
        {/* ROTAS PÚBLICAS (Sem Layout) */}
        {/* ══════════════════════════════════════════════════════════ */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<LoginPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        
        {/* Cardápio Público */}
        <Route path="/menu/:slug" element={<PublicMenu />} />

        {/* ══════════════════════════════════════════════════════════ */}
        {/* WAITER MODE (Layout Próprio) */}
        {/* ══════════════════════════════════════════════════════════ */}
        <Route path="/waiter-login" element={<WaiterLogin />} />
        <Route path="/waiter-mode" element={<WaiterApp />} />

        {/* ══════════════════════════════════════════════════════════ */}
        {/* KITCHEN DISPLAY SYSTEM (Fullscreen) */}
        {/* ══════════════════════════════════════════════════════════ */}
        <Route path="/kitchen/:restaurantId" element={<KitchenDisplay />} />

        {/* ══════════════════════════════════════════════════════════ */}
        {/* ÁREA LOGADA COM APP LAYOUT */}
        {/* ══════════════════════════════════════════════════════════ */}
        <Route 
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard Principal */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Construtor de Cardápio */}
          <Route path="/menu-builder" element={<MenuBuilder />} />
          
          {/* Gestão de Equipe */}
          <Route path="/staff" element={<StaffManagement />} />
          
          {/* Perfil / Configurações */}
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* Sucesso Pagamento */}
          <Route path="/success" element={<SuccessPage />} />
        </Route>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* STUDIO (Fullscreen - Sem AppLayout) */}
        {/* ══════════════════════════════════════════════════════════ */}
        <Route 
          path="/studio" 
          element={
            <ProtectedRoute>
              <AppStudio />
            </ProtectedRoute>
          } 
        />

        {/* ══════════════════════════════════════════════════════════ */}
        {/* REDIRECTS & 404 */}
        {/* ══════════════════════════════════════════════════════════ */}
        
        {/* Compatibilidade: /app → /studio */}
        <Route path="/app" element={<Navigate to="/studio" replace />} />
        
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}
