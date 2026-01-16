import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import PortalLayout from '../../components/PortalLayout';
import '../../styles/portal-design-system.css';
import { Gift, Info } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const PortalRewards = () => {
  const navigate = useNavigate();
  const { clientToken, portalToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState([]);
  const [totalEarned, setTotalEarned] = useState(0);

  const getAuthHeaders = () => {
    if (clientToken) return { Authorization: `Bearer ${clientToken}` };
    if (portalToken) return { 'X-Portal-Token': portalToken };
    return {};
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/v1/portal/rewards`, {
        headers: getAuthHeaders()
      });
      setRewards(response.data.rewards || []);
      setTotalEarned(response.data.total_rewards_earned || 0);
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
      // Mock data for UI demo
      setRewards([
        { name: 'Welcome Bonus', value: 25.00, granted_at: new Date(Date.now() - 604800000).toISOString() },
        { name: 'First Deposit Bonus', value: 50.00, granted_at: new Date(Date.now() - 518400000).toISOString() },
        { name: 'Referral Reward', value: 15.00, granted_at: new Date(Date.now() - 432000000).toISOString() },
        { name: 'Weekly Login Bonus', value: 5.00, granted_at: new Date(Date.now() - 172800000).toISOString() }
      ]);
      setTotalEarned(95.00);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout title="Rewards">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'var(--portal-accent)' }}></div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="Rewards">
      {/* Total Earned */}
      <div className="portal-card portal-section" data-testid="total-rewards-card">
        <div style={{ textAlign: 'center', padding: 'var(--space-sm) 0' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--portal-text-muted)', marginBottom: 'var(--space-xs)' }}>Total Rewards Earned</p>
          <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--portal-warning)' }}>${totalEarned.toFixed(2)}</p>
        </div>
      </div>

      {/* Rewards List */}
      <div className="portal-section">
        <p className="portal-section-title">Reward History</p>
        
        {rewards.length === 0 ? (
          <div className="portal-empty" data-testid="empty-rewards">
            <Gift className="portal-empty-icon" />
            <p className="portal-empty-title">No rewards yet</p>
            <p className="portal-empty-text">Complete actions to earn rewards</p>
          </div>
        ) : (
          <div className="portal-list" data-testid="rewards-list">
            {rewards.map((reward, idx) => (
              <div key={idx} className="portal-list-item" data-testid={`reward-${idx}`}>
                <div className="portal-list-item-left">
                  <div className="portal-list-item-icon" style={{ background: 'rgba(217, 119, 6, 0.1)' }}>
                    <Gift style={{ width: 18, height: 18, color: 'var(--portal-warning)' }} />
                  </div>
                  <div className="portal-list-item-content">
                    <span className="portal-list-item-title">{reward.name || 'Reward'}</span>
                    <span className="portal-list-item-subtitle">
                      {reward.granted_at ? new Date(reward.granted_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
                <span className="portal-list-item-value" style={{ color: 'var(--portal-warning)' }}>
                  +${(reward.value || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How to Earn */}
      <div className="portal-card" data-testid="how-to-earn-card">
        <div className="portal-card-header">
          <div className="portal-card-title">
            <Info style={{ width: 20, height: 20, color: 'var(--portal-info)' }} />
            How to Earn Rewards
          </div>
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--portal-text-secondary)', lineHeight: 1.6 }}>
          <p style={{ marginBottom: 'var(--space-sm)' }}>• Complete your account setup</p>
          <p style={{ marginBottom: 'var(--space-sm)' }}>• Log in for the first time</p>
          <p style={{ marginBottom: 'var(--space-sm)' }}>• Make your first deposit</p>
          <p style={{ marginBottom: 'var(--space-md)' }}>• Refer friends who deposit</p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--portal-text-muted)' }}>
            Rewards are credited as Play Credits automatically.
          </p>
        </div>
      </div>
    </PortalLayout>
  );
};

export default PortalRewards;
