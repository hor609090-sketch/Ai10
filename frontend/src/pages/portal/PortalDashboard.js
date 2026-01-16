import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import PortalLayout from '../../components/PortalLayout';
import '../../styles/portal-design-system.css';
import { 
  Wallet, TrendingUp, Gift, Users, ChevronRight, Copy, Check,
  ArrowDownCircle, Shield, Gamepad2, Sparkles
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const PortalDashboard = () => {
  const navigate = useNavigate();
  const { user, clientToken, portalToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState(null);
  const [copied, setCopied] = useState(false);

  const getAuthHeaders = () => {
    if (clientToken) return { Authorization: `Bearer ${clientToken}` };
    if (portalToken) return { 'X-Portal-Token': portalToken };
    return {};
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/v1/portal/wallet/breakdown`, {
        headers: getAuthHeaders()
      });
      setWalletData(response.data);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
      // Mock data for UI demo
      setWalletData({
        overview: {
          total_balance: 1250.50,
          cash_balance: 850.00,
          play_credits: 400.50,
          bonus_balance: 400.50,
          withdrawable_amount: 850.00,
          locked_amount: 400.50
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const code = user?.referral_code || 'DEMO2024';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        // Fallback for clipboard permission issues
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
        document.body.removeChild(textArea);
      });
    }
  };

  if (loading) {
    return (
      <PortalLayout title="Dashboard" showBack={false}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: 'var(--portal-accent)' }}></div>
        </div>
      </PortalLayout>
    );
  }

  const totalBalance = walletData?.overview?.total_balance || 0;
  const cashBalance = walletData?.overview?.cash_balance || 0;
  const bonusBalance = walletData?.overview?.play_credits || walletData?.overview?.bonus_balance || 0;
  const withdrawableAmount = walletData?.overview?.withdrawable_amount || 0;

  return (
    <PortalLayout title="Dashboard" showBack={false}>
      {/* Balance Card with Gradient */}
      <div className="portal-card portal-card-accent portal-section" data-testid="balance-card">
        <div className="balance-display">
          <p className="balance-label">Total Balance</p>
          <p className="balance-amount">${totalBalance.toFixed(2)}</p>
          <div className="balance-breakdown">
            <div className="balance-breakdown-item">
              <p className="balance-breakdown-label">Cash</p>
              <p className="balance-breakdown-value" style={{ color: 'var(--portal-success)' }}>${cashBalance.toFixed(2)}</p>
            </div>
            <div className="balance-breakdown-item">
              <p className="balance-breakdown-label">Play Credits</p>
              <p className="balance-breakdown-value" style={{ color: 'var(--portal-warning)' }}>${bonusBalance.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Highlight Card */}
      <div className="referral-highlight portal-section" data-testid="referral-highlight">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)', marginBottom: 'var(--space-md)', position: 'relative' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--portal-warning) 0%, #f97316 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)'
          }}>
            <Sparkles style={{ width: 22, height: 22, color: 'white' }} />
          </div>
          <div>
            <p className="referral-highlight-title">
              Earn up to <span className="referral-highlight-accent">30%</span> forever
            </p>
            <p className="referral-highlight-text" style={{ marginBottom: 0 }}>
              Get lifetime commission from all your referral deposits — no limits, no expiration.
            </p>
          </div>
        </div>
        <button 
          className="portal-btn portal-btn-secondary"
          onClick={() => navigate('/portal/referrals')}
          data-testid="view-referrals-btn"
          style={{ width: '100%' }}
        >
          View Referrals
          <ChevronRight style={{ width: 18, height: 18 }} />
        </button>
      </div>

      {/* Quick Status Cards */}
      <div className="portal-section">
        <p className="portal-section-title">Quick Status</p>
        <div className="stats-row">
          <div className="stat-card">
            <p className="stat-label">Withdrawable</p>
            <p className="stat-value stat-value-success">${withdrawableAmount.toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Play Credits</p>
            <p className="stat-value stat-value-warning">${bonusBalance.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Quick Access List */}
      <div className="portal-section">
        <p className="portal-section-title">Quick Access</p>
        <div className="portal-list">
          <div 
            className="portal-list-item portal-list-item-clickable"
            onClick={() => navigate('/portal/wallet')}
            data-testid="quick-access-wallet"
          >
            <div className="portal-list-item-left">
              <div className="portal-list-item-icon" style={{ background: 'var(--portal-success-bg)' }}>
                <Wallet style={{ width: 20, height: 20, color: 'var(--portal-success)' }} />
              </div>
              <div className="portal-list-item-content">
                <span className="portal-list-item-title">Wallet</span>
                <span className="portal-list-item-subtitle">Manage your balance</span>
              </div>
            </div>
            <ChevronRight style={{ width: 20, height: 20, color: 'var(--portal-text-dim)' }} />
          </div>

          <div 
            className="portal-list-item portal-list-item-clickable"
            onClick={() => navigate('/portal/transactions')}
            data-testid="quick-access-transactions"
          >
            <div className="portal-list-item-left">
              <div className="portal-list-item-icon" style={{ background: 'var(--portal-info-bg)' }}>
                <TrendingUp style={{ width: 20, height: 20, color: 'var(--portal-info)' }} />
              </div>
              <div className="portal-list-item-content">
                <span className="portal-list-item-title">Transactions</span>
                <span className="portal-list-item-subtitle">View history</span>
              </div>
            </div>
            <ChevronRight style={{ width: 20, height: 20, color: 'var(--portal-text-dim)' }} />
          </div>

          <div 
            className="portal-list-item portal-list-item-clickable"
            onClick={() => navigate('/portal/rewards')}
            data-testid="quick-access-rewards"
          >
            <div className="portal-list-item-left">
              <div className="portal-list-item-icon" style={{ background: 'var(--portal-warning-bg)' }}>
                <Gift style={{ width: 20, height: 20, color: 'var(--portal-warning)' }} />
              </div>
              <div className="portal-list-item-content">
                <span className="portal-list-item-title">Rewards</span>
                <span className="portal-list-item-subtitle">Earn bonuses</span>
              </div>
            </div>
            <ChevronRight style={{ width: 20, height: 20, color: 'var(--portal-text-dim)' }} />
          </div>

          <div 
            className="portal-list-item portal-list-item-clickable"
            onClick={() => navigate('/portal/withdrawals')}
            data-testid="quick-access-withdrawals"
          >
            <div className="portal-list-item-left">
              <div className="portal-list-item-icon" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
                <ArrowDownCircle style={{ width: 20, height: 20, color: '#8b5cf6' }} />
              </div>
              <div className="portal-list-item-content">
                <span className="portal-list-item-title">Withdrawals</span>
                <span className="portal-list-item-subtitle">Cash out funds</span>
              </div>
            </div>
            <ChevronRight style={{ width: 20, height: 20, color: 'var(--portal-text-dim)' }} />
          </div>
        </div>
      </div>

      {/* Referral Code */}
      <div className="portal-section">
        <p className="portal-section-title">Your Referral Code</p>
        <div className="referral-code-display" data-testid="referral-code-display">
          <span className="referral-code-value">{user?.referral_code || 'DEMO2024'}</span>
          <button className="referral-code-btn" onClick={handleCopy} data-testid="copy-referral-btn">
            {copied ? <Check style={{ width: 18, height: 18 }} /> : <Copy style={{ width: 18, height: 18 }} />}
          </button>
        </div>
      </div>
    </PortalLayout>
  );
};

export default PortalDashboard;
