
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import QrPrint from './pages/QrPrint';
import StaffManagement from './pages/StaffManagement';
import WaiterLogin from './pages/WaiterLogin';
import WaiterApp from './pages/WaiterApp';
import ProfilePage from './pages/ProfilePage';
import UserProfile from './pages/admin/UserProfile';
import SuccessPage from './pages/SuccessPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import NotFoundPage from './pages/NotFoundPage';
import ToolsHub from './pages/ToolsHub';
import WhatsappTool from './pages/WhatsappTool';
import DispatchConsole from './pages/DispatchConsole';
import DriverApp from './pages/DriverApp';
import DeliveryTracking from './pages/DeliveryTracking';
import FinanceDashboard from './pages/admin/FinanceDashboard';

// Marketplace (Consumer)
import MarketplaceHome from './pages/marketplace/Home';
import ConsumerProfile from './pages/marketplace/ConsumerProfile';

// Components
import { ProtectedRoute } from './components/ProtectedRoute';
import CheckoutModal from './components/CheckoutModal';

// Hooks
import { usePendingCheckout } from './hooks/usePendingCheckout';

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { pendingPlan, clearPending } = usePendingCheckout();
  return (
    <>
      {children}
      {pendingPlan && (
        <CheckoutModal
          isOpen={!!pendingPlan}
          onClose={clearPending}
          plan={pendingPlan.plan}
          price={pendingPlan.price}
        />
      )}
    </>
  );
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
      
      <AuthWrapper>
      <Routes>
        {/* ROTAS PÚBLICAS */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<LoginPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/menu/:slug" element={<PublicMenu />} />
        <Route path="/marketplace" element={<MarketplaceHome />} />
        <Route path="/delivery" element={<MarketplaceHome />} />
        <Route path="/me" element={<ConsumerProfile />} />
        <Route path="/track/:orderId" element={<DeliveryTracking />} />

        {/* MODOS DEDICADOS (Sem Layout Padrão) */}
        <Route path="/waiter-login" element={<WaiterLogin />} />
        <Route path="/waiter-mode" element={<WaiterApp />} />
        <Route path="/kitchen-mode" element={<KitchenDisplay />} />
        <Route path="/driver-mode" element={<DriverApp />} />
        {/* Rota pública da cozinha (opcional, para usar em TV separada) */}
        <Route path="/kitchen/:restaurantId" element={<KitchenDisplay />} />

        {/* ÁREA LOGADA (Com Sidebar) */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/menu-builder" element={<MenuBuilder />} />
          <Route path="/staff" element={<StaffManagement />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin/profile" element={<UserProfile />} />
          <Route path="/finance" element={<FinanceDashboard />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/print-qr" element={<QrPrint />} />
          <Route path="/tools" element={<ToolsHub />} />
          <Route path="/tools/whatsapp" element={<WhatsappTool />} />
          
          {/* ✅ CORREÇÃO: Rotas simplificadas para bater com a Sidebar */}
          <Route path="/dispatch" element={<DispatchConsole />} />
          <Route path="/kitchen-display" element={<KitchenDisplay />} />
        </Route>

        {/* STUDIO (Tela Cheia) */}
        <Route path="/studio" element={<ProtectedRoute><AppStudio /></ProtectedRoute>} />
        <Route path="/app" element={<Navigate to="/studio" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </AuthWrapper>
    </Router>
  );
}
