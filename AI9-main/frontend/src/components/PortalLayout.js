import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/portal-design-system.css';
import { 
  Home, Wallet, Receipt, Users, Gift, Shield, Gamepad2, 
  ArrowDownCircle, LogOut, ChevronLeft, Sparkles
} from 'lucide-react';

// Desktop Sidebar Navigation
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: Home, path: '/portal' },
    { id: 'wallet', label: 'Wallet', icon: Wallet, path: '/portal/wallet' },
    { id: 'transactions', label: 'Transactions', icon: Receipt, path: '/portal/transactions' },
    { id: 'referrals', label: 'Referrals', icon: Users, path: '/portal/referrals' },
    { id: 'rewards', label: 'Rewards', icon: Gift, path: '/portal/rewards' },
    { id: 'withdrawals', label: 'Withdrawals', icon: ArrowDownCircle, path: '/portal/withdrawals' },
    { id: 'credentials', label: 'Game Credentials', icon: Gamepad2, path: '/portal/credentials' },
    { id: 'security', label: 'Security', icon: Shield, path: '/portal/security' },
  ];

  const isActive = (path) => {
    if (path === '/portal') return location.pathname === '/portal';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/client-login');
  };

  return (
    <aside className="portal-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">
          <div className="sidebar-brand-icon">
            <Sparkles style={{ width: 20, height: 20 }} />
          </div>
          <span>Portal</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              data-testid={`sidebar-${item.id}`}
            >
              <Icon className="sidebar-nav-item-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user?.display_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">
              {user?.display_name || user?.username || 'Client'}
            </div>
            <div className="sidebar-user-email">
              {user?.referral_code || 'N/A'}
            </div>
          </div>
        </div>
        <button
          className="sidebar-nav-item"
          onClick={handleLogout}
          style={{ marginTop: 'var(--space-sm)', color: 'var(--portal-error)' }}
          data-testid="sidebar-logout"
        >
          <LogOut className="sidebar-nav-item-icon" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

// Mobile Header
const MobileHeader = ({ title, showBack = true, onBack }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/portal');
    }
  };

  return (
    <header className="portal-mobile-header">
      {showBack ? (
        <button 
          className="portal-mobile-header-back" 
          onClick={handleBack}
          data-testid="mobile-back-btn"
        >
          <ChevronLeft style={{ width: 24, height: 24 }} />
        </button>
      ) : (
        <div className="portal-mobile-header-action" />
      )}
      <h1 className="portal-mobile-header-title">{title}</h1>
      <div className="portal-mobile-header-action" />
    </header>
  );
};

// Mobile Bottom Navigation
const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'home', label: 'Home', icon: Home, path: '/portal' },
    { id: 'wallet', label: 'Wallet', icon: Wallet, path: '/portal/wallet' },
    { id: 'transactions', label: 'History', icon: Receipt, path: '/portal/transactions' },
    { id: 'referrals', label: 'Referrals', icon: Users, path: '/portal/referrals' },
    { id: 'rewards', label: 'Rewards', icon: Gift, path: '/portal/rewards' }
  ];

  const isActive = (path) => {
    if (path === '/portal') return location.pathname === '/portal';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="portal-bottom-nav">
      <div className="portal-bottom-nav-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`portal-bottom-nav-item ${isActive(tab.path) ? 'active' : ''}`}
              onClick={() => navigate(tab.path)}
              data-testid={`bottom-nav-${tab.id}`}
              style={{ position: 'relative' }}
            >
              <Icon className="portal-bottom-nav-item-icon" />
              <span className="portal-bottom-nav-item-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// Main Layout Wrapper
const PortalLayout = ({ children, title, showBack = true, onBack }) => {
  return (
    <div className="portal-layout">
      <Sidebar />
      <main className="portal-main">
        <MobileHeader title={title} showBack={showBack} onBack={onBack} />
        <div className="portal-content">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export { PortalLayout, MobileHeader, BottomNav, Sidebar };
export default PortalLayout;
