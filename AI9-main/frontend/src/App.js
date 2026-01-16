import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './App.css';

// Components
import PortalRoute from './components/PortalRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import PublicGames from './pages/PublicGames';

// Portal Pages
import PortalLanding from './pages/portal/PortalLanding';
import PortalDashboard from './pages/portal/PortalDashboard';
import PortalTransactions from './pages/portal/PortalTransactions';
import PortalCredentials from './pages/portal/PortalCredentials';
import PortalReferrals from './pages/portal/PortalReferrals';
import PortalWithdrawals from './pages/portal/PortalWithdrawals';
import PortalWallets from './pages/portal/PortalWallets';
import PortalWallet from './pages/portal/PortalWallet';
import PortalLoadGame from './pages/portal/PortalLoadGame';
import PortalBonusTasks from './pages/portal/PortalBonusTasks';
import ClientLogin from './pages/portal/ClientLogin';
import PortalSecuritySettings from './pages/portal/PortalSecuritySettings';
import PortalRewards from './pages/portal/PortalRewards';

// Admin Pages - RESTRUCTURED
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminApprovals from './pages/admin/AdminApprovals';
import AdminOrders from './pages/admin/AdminOrders';
import AdminClients from './pages/admin/AdminClients';
import AdminClientDetail from './pages/admin/AdminClientDetail';
import AdminClientCreate from './pages/admin/AdminClientCreate';
import AdminGames from './pages/admin/AdminGames';
import AdminRulesEngine from './pages/admin/AdminRulesEngine';
import AdminReferrals from './pages/admin/AdminReferrals';
import AdminPromoCodes from './pages/admin/AdminPromoCodes';
import AdminReports from './pages/admin/AdminReports';
import AdminSystem from './pages/admin/AdminSystem';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';

// System Subsections
import SystemWebhooks from './pages/admin/system/SystemWebhooks';
import SystemAPIAccess from './pages/admin/system/SystemAPIAccess';
import SystemDocumentation from './pages/admin/system/SystemDocumentation';
import AdminRewardsPage from './pages/admin/system/AdminRewards';
import AdminPaymentQR from './pages/admin/system/AdminPaymentQR';
import AdminWalletLoads from './pages/admin/system/AdminWalletLoads';
import TelegramBots from './pages/admin/system/TelegramBots';

// Legacy Admin Pages (for backwards compat)
import AdminSettings from './pages/admin/AdminSettings';
import AdminPaymentPanel from './pages/admin/AdminPaymentPanel';
// AdminTelegramSetup REMOVED - use /admin/system/telegram-bots instead
import AdminPerksPage from './pages/admin/AdminPerksPage';
import AdminOperationsPanel from './pages/admin/AdminOperationsPanel';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-black">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/games" element={<PublicGames />} />
            
            {/* Portal Magic Link Landing */}
            <Route path="/p/:token" element={<PortalLanding />} />
            
            {/* Protected Portal routes */}
            <Route path="/portal" element={
              <PortalRoute>
                <PortalDashboard />
              </PortalRoute>
            } />
            <Route path="/portal/transactions" element={
              <PortalRoute>
                <PortalTransactions />
              </PortalRoute>
            } />
            <Route path="/portal/credentials" element={
              <PortalRoute>
                <PortalCredentials />
              </PortalRoute>
            } />
            <Route path="/portal/referrals" element={
              <PortalRoute>
                <PortalReferrals />
              </PortalRoute>
            } />
            <Route path="/portal/withdrawals" element={
              <PortalRoute>
                <PortalWithdrawals />
              </PortalRoute>
            } />
            
            {/* FIXED: Redirect /portal/wallets to /portal/wallet */}
            <Route path="/portal/wallets" element={<Navigate to="/portal/wallet" replace />} />
            
            <Route path="/portal/wallet" element={
              <PortalRoute>
                <PortalWallet />
              </PortalRoute>
            } />
            <Route path="/portal/rewards" element={
              <PortalRoute>
                <PortalRewards />
              </PortalRoute>
            } />
            <Route path="/portal/load-game" element={
              <PortalRoute>
                <PortalLoadGame />
              </PortalRoute>
            } />
            
            {/* FIXED: Redirect /portal/bonus-tasks to /portal/rewards */}
            <Route path="/portal/bonus-tasks" element={<Navigate to="/portal/rewards" replace />} />
            
            <Route path="/portal/security" element={
              <PortalRoute>
                <PortalSecuritySettings />
              </PortalRoute>
            } />
            
            {/* Client Login (optional password auth) */}
            <Route path="/client-login" element={<ClientLogin />} />
            
            {/* Protected Admin routes - RESTRUCTURED SIDEBAR */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }>
              {/* 1. Dashboard */}
              <Route index element={<AdminDashboard />} />
              
              {/* 2. Approvals */}
              <Route path="approvals" element={<AdminApprovals />} />
              
              {/* 3. Orders */}
              <Route path="orders" element={<AdminOrders />} />
              
              {/* 4. Clients */}
              <Route path="clients" element={<AdminClients />} />
              <Route path="clients/new" element={<AdminClientCreate />} />
              <Route path="clients/:clientId" element={<AdminClientDetail />} />
              
              {/* 5. Games */}
              <Route path="games" element={<AdminGames />} />
              
              {/* 6. Rules (Global Defaults Only) */}
              <Route path="rules" element={<AdminRulesEngine />} />
              
              {/* 7. Referrals */}
              <Route path="referrals" element={<AdminReferrals />} />
              
              {/* 8. Promo Codes */}
              <Route path="promo-codes" element={<AdminPromoCodes />} />
              
              {/* 9. Reports */}
              <Route path="reports" element={<AdminReports />} />
              
              {/* 10. System */}
              <Route path="system" element={<AdminSystem />} />
              <Route path="system/webhooks" element={<SystemWebhooks />} />
              <Route path="system/api-access" element={<SystemAPIAccess />} />
              <Route path="system/documentation" element={<SystemDocumentation />} />
              <Route path="system/rewards" element={<AdminRewardsPage />} />
              <Route path="system/automations" element={<AdminOperationsPanel />} />
              <Route path="system/payment-methods" element={<AdminPaymentPanel />} />
              {/* Legacy telegram route redirects to new multi-bot system */}
              <Route path="system/telegram" element={<TelegramBots />} />
              <Route path="system/telegram-bots" element={<TelegramBots />} />
              <Route path="system/payment-qr" element={<AdminPaymentQR />} />
              <Route path="system/wallet-loads" element={<AdminWalletLoads />} />
              
              {/* 11. Audit Logs */}
              <Route path="audit-logs" element={<AdminAuditLogs />} />
              
              {/* Legacy routes - redirect or keep for backwards compat */}
              <Route path="operations" element={<AdminOperationsPanel />} />
              <Route path="payment-panel" element={<AdminPaymentPanel />} />
              {/* Legacy telegram route redirects to new multi-bot system */}
              <Route path="telegram" element={<TelegramBots />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            
            {/* API v1 Admin - Standalone page */}
            <Route path="/admin/perks" element={<AdminPerksPage />} />
            
            {/* Default redirect to public games (no login required) */}
            <Route path="/" element={<Navigate to="/games" replace />} />
            
            <Route path="*" element={<Navigate to="/games" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
