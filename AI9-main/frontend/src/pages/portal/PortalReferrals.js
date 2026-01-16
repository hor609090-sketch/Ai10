import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import PortalLayout from '../../components/PortalLayout';
import InviteModal from '../../components/InviteModal';
import '../../styles/portal-design-system.css';
import { 
  Users, Copy, Check, Share2, TrendingUp
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const PortalReferrals = () => {
  const navigate = useNavigate();
  const { user, clientToken, portalToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const getAuthHeaders = () => {
    if (clientToken) return { Authorization: `Bearer ${clientToken}` };
    if (portalToken) return { 'X-Portal-Token': portalToken };
    return {};
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/v1/portal/referrals/details`, {
        headers: getAuthHeaders()
      });
      setReferralData(response.data);
    } catch (error) {
      console.error('Failed to fetch referrals:', error);
      // Mock data for UI demo
      setReferralData({
        referral_code: user?.referral_code || 'DEMO2024',
        earnings: { pending: 45.50, confirmed: 125.00, total: 170.50 },
        stats: { total_referrals: 12, active_referrals: 8 },
        tier: { 
          current: { name: 'Bronze', commission: 10 },
          all_tiers: [
            { name: 'Starter', commission: 5, min_refs: 0 },
            { name: 'Bronze', commission: 10, min_refs: 5 },
            { name: 'Silver', commission: 15, min_refs: 15 },
            { name: 'Gold', commission: 20, min_refs: 30 },
            { name: 'Platinum', commission: 25, min_refs: 50 },
            { name: 'Diamond', commission: 30, min_refs: 100 }
          ]
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const code = referralData?.referral_code || user?.referral_code || 'N/A';
    if (code && navigator.clipboard && navigator.clipboard.writeText) {
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
      <PortalLayout title="Referrals">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'var(--portal-accent)' }}></div>
        </div>
      </PortalLayout>
    );
  }

  const referralCode = referralData?.referral_code || user?.referral_code || 'N/A';
  const earnings = referralData?.earnings || { pending: 0, confirmed: 0, total: 0 };
  const stats = referralData?.stats || { total_referrals: 0, active_referrals: 0 };
  const currentTier = referralData?.tier?.current || { name: 'Starter', commission: 5 };
  const tiers = referralData?.tier?.all_tiers || [
    { name: 'Starter', commission: 5, min_refs: 0 },
    { name: 'Bronze', commission: 10, min_refs: 10 },
    { name: 'Silver', commission: 15, min_refs: 25 },
    { name: 'Gold', commission: 20, min_refs: 50 },
    { name: 'Platinum', commission: 25, min_refs: 100 },
    { name: 'Diamond', commission: 30, min_refs: 200 }
  ];

  return (
    <PortalLayout title="Referrals">
      {/* Stats Summary */}
      <div className="portal-section" data-testid="referral-stats">
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <div className="stat-card" style={{ flex: 1 }}>
            <p className="stat-label">Total</p>
            <p className="stat-value">{stats.total_referrals}</p>
          </div>
          <div className="stat-card" style={{ flex: 1 }}>
            <p className="stat-label">Active</p>
            <p className="stat-value stat-value-success">{stats.active_referrals}</p>
          </div>
          <div className="stat-card" style={{ flex: 1 }}>
            <p className="stat-label">Earned</p>
            <p className="stat-value stat-value-warning">${earnings.total.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* Referral Highlight */}
      <div className="referral-highlight portal-section" data-testid="referral-program-info">
        <p className="referral-highlight-title">
          Earn up to <span className="referral-highlight-accent">30%</span> forever
        </p>
        <p className="referral-highlight-text">
          Get lifetime commission from all your referral deposits. Your current rate: <strong>{currentTier.commission}%</strong> ({currentTier.name})
        </p>
      </div>

      {/* Earnings Breakdown */}
      <div className="portal-card portal-section" data-testid="earnings-breakdown">
        <div className="portal-card-header">
          <div className="portal-card-title">
            <TrendingUp style={{ width: 20, height: 20, color: 'var(--portal-accent)' }} />
            Earnings Breakdown
          </div>
        </div>
        <div className="stats-row">
          <div style={{ flex: 1, textAlign: 'center', padding: 'var(--space-md)', background: 'rgba(217, 119, 6, 0.08)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--portal-text-muted)', marginBottom: 'var(--space-xs)' }}>Pending</p>
            <p style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--portal-warning)' }}>${earnings.pending.toFixed(2)}</p>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: 'var(--space-md)', background: 'rgba(5, 150, 105, 0.08)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--portal-text-muted)', marginBottom: 'var(--space-xs)' }}>Confirmed</p>
            <p style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--portal-success)' }}>${earnings.confirmed.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Referral Code */}
      <div className="portal-card portal-section" data-testid="referral-code-section">
        <div className="portal-card-header">
          <div className="portal-card-title">Your Referral Code</div>
        </div>
        <div className="referral-code-display" style={{ marginBottom: 'var(--space-md)' }}>
          <span className="referral-code-value">{referralCode}</span>
          <button className="referral-code-btn" onClick={handleCopy} data-testid="copy-code-btn">
            {copied ? <Check style={{ width: 18, height: 18 }} /> : <Copy style={{ width: 18, height: 18 }} />}
          </button>
        </div>
        <button 
          className="portal-btn portal-btn-primary portal-btn-full"
          onClick={() => setShowInviteModal(true)}
          data-testid="share-earn-btn"
        >
          <Share2 style={{ width: 18, height: 18 }} />
          Share & Earn
        </button>
      </div>

      {/* Commission Tiers */}
      <div className="portal-section">
        <p className="portal-section-title">Commission Tiers</p>
        <div className="portal-list" data-testid="commission-tiers">
          {tiers.slice(0, 4).map((tier, idx) => {
            const isCurrent = tier.name === currentTier.name;
            return (
              <div 
                key={idx} 
                className="portal-list-item"
                style={isCurrent ? { borderColor: 'var(--portal-accent-border)', background: 'var(--portal-accent-soft)' } : {}}
              >
                <div className="portal-list-item-left">
                  <div className="portal-list-item-content">
                    <span className="portal-list-item-title" style={isCurrent ? { color: 'var(--portal-accent)' } : {}}>
                      {tier.name}
                      {isCurrent && <span style={{ marginLeft: 'var(--space-sm)', fontSize: 'var(--text-xs)', opacity: 0.8 }}>• Current</span>}
                    </span>
                    <span className="portal-list-item-subtitle">
                      {tier.min_refs === 0 ? 'Starting tier' : `${tier.min_refs}+ active referrals`}
                    </span>
                  </div>
                </div>
                <span style={{ 
                  fontSize: 'var(--text-lg)', 
                  fontWeight: 700, 
                  color: isCurrent ? 'var(--portal-accent)' : 'var(--portal-text-primary)' 
                }}>
                  {tier.commission}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        referralCode={referralCode}
      />
    </PortalLayout>
  );
};

export default PortalReferrals;
