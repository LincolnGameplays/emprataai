import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Layouts
import AppLayout from './layouts/AppLayout';
import CustomerLayout from './layouts/CustomerLayout';

// Pages - Public
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PublicMenu from './pages/PublicMenu';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import NotFoundPage from './pages/NotFoundPage';

// Pages - Admin (Dono)
import Dashboard from './pages/Dashboard';
import DispatchConsole from './pages/DispatchConsole';
import KitchenDisplay from './pages/KitchenDisplay';
import MenuBuilder from './pages/MenuBuilder';
import AppStudio from './pages/AppStudio';
import StaffManagement from './pages/StaffManagement';
import ProfilePage from './pages/ProfilePage';
import FinanceModule from './pages/admin/FinanceModule';
import PricingTable from './pages/admin/PricingTable';
import BusinessIntelligence from './pages/admin/BusinessIntelligence';
import SubscriptionPage from './pages/admin/SubscriptionPage';
import StorefrontEditor from './components/admin/StorefrontEditor';

// Pages - Marketplace (Cliente)
import MarketplaceHome from './pages/marketplace/Home';
import ConsumerProfile from './pages/marketplace/ConsumerProfile';
import DeliveryTracking from './pages/DeliveryTracking';

// Pages - Workforce Apps (PWA Mobile)
import DriverApp from './pages/DriverApp';
import WaiterApp from './pages/WaiterApp';
import WaiterLogin from './pages/WaiterLogin';
import StaffLogin from './pages/StaffLogin';
import AppsHub from './pages/AppsHub';
import OwnerApp from './pages/apps/OwnerApp';
import PosTerminal from './pages/apps/PosTerminal';

// Components
import { ProtectedRoute } from './components/ProtectedRoute';
import PlanProtected from './components/auth/PlanProtected';
import { useAuth } from './hooks/useAuth';

// ----------------------------------------------------------------------
// ROTA INTELIGENTE (Define para onde ir ao abrir o app)
// ----------------------------------------------------------------------
function RootRedirect() {
  const { user, loading } = useAuth();
  const lastMode = localStorage.getItem('emprata_mode');

  if (loading) return null;

  if (!user) return <LandingPage />;

  if (lastMode === 'OWNER') return <Navigate to="/dashboard" replace />;
  
  return <Navigate to="/delivery" replace />;
}

export default function App() {
  return (
    <Router>
      <Toaster 
        position="top-center"
        richColors
        toastOptions={{
          style: { background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' },
        }}
      />
      
      <Routes>
        {/* RAIZ INTELIGENTE */}
        <Route path="/" element={<RootRedirect />} />

        {/* ROTAS PÚBLICAS */}
        <Route path="/auth" element={<LoginPage />} />
        <Route path="/menu/:slug" element={<PublicMenu />} />
        <Route path="/menu/:slug/table/:tableNum" element={<PublicMenu />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/track/:orderId" element={<DeliveryTracking />} />

        {/* 🚀 MODOS DEDICADOS - Workforce PWA Apps (Sem Layout Padrão) */}
        <Route path="/kitchen-mode" element={<KitchenDisplay />} />
        <Route path="/driver" element={<DriverApp />} />
        <Route path="/waiter" element={<WaiterApp />} />
        <Route path="/waiter-login" element={<WaiterLogin />} />
        <Route path="/staff-login" element={<StaffLogin />} />
        <Route path="/apps" element={<AppsHub />} />
        <Route path="/owner" element={<ProtectedRoute><OwnerApp /></ProtectedRoute>} />
        <Route path="/pos" element={<ProtectedRoute><PosTerminal /></ProtectedRoute>} />

        {/* 🏢 MUNDO DO DONO (Protegido + AppLayout) */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          {/* ════════════════════════════════════════════════════════════════ */}
          {/* ROTAS STARTER (Livres para todos os planos)                      */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/menu-builder" element={<MenuBuilder />} />
          <Route path="/kitchen-display" element={<KitchenDisplay />} />
          <Route path="/staff" element={<StaffManagement />} />
          <Route path="/store-settings" element={<StorefrontEditor />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/studio" element={<AppStudio />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/pricing" element={<PricingTable />} />
          {/* 💰 CARTEIRA (Aberta para TODOS - Correção do Loop de Frustração) */}
          <Route path="/finance" element={<FinanceModule />} />

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* 🚀 ROTAS GROWTH (Protegidas - Requerem plano Growth+)            */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <Route 
            path="/dispatch" 
            element={
              <PlanProtected feature="driver_app_access">
                <DispatchConsole />
              </PlanProtected>
            } 
          />

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* 💎 ROTAS BLACK (Proteção Máxima - Requerem plano Black)          */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <Route 
            path="/intelligence" 
            element={
              <PlanProtected feature="ai_insights">
                <BusinessIntelligence />
              </PlanProtected>
            } 
          />

        </Route>

        {/* 🍔 MUNDO DO CLIENTE (Layout de App de Delivery) */}
        <Route element={<CustomerLayout />}>
          <Route path="/delivery" element={<MarketplaceHome />} />
          <Route path="/search" element={<MarketplaceHome />} />
          <Route path="/me" element={<ConsumerProfile />} />
          <Route path="/me/orders" element={<ConsumerProfile />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}
