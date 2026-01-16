import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import PortalLayout from '../../components/PortalLayout';
import '../../styles/portal-design-system.css';
import { Gamepad2, Copy, Check, Eye, EyeOff } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const PortalCredentials = () => {
  const navigate = useNavigate();
  const { clientToken, portalToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState([]);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copied, setCopied] = useState({});

  const getAuthHeaders = () => {
    if (clientToken) return { Authorization: `Bearer ${clientToken}` };
    if (portalToken) return { 'X-Portal-Token': portalToken };
    return {};
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/v1/portal/credentials`, {
        headers: getAuthHeaders()
      });
      setCredentials(response.data.credentials || []);
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
      // No mock data - show empty state for demo
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  };

  const togglePassword = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [id]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [id]: false })), 2000);
  };

  if (loading) {
    return (
      <PortalLayout title="Game Credentials">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'var(--portal-accent)' }}></div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="Game Credentials">
      {credentials.length === 0 ? (
        <div className="portal-empty" style={{ marginTop: 'var(--space-xl)' }} data-testid="empty-credentials">
          <Gamepad2 className="portal-empty-icon" />
          <p className="portal-empty-title">No game credentials yet</p>
          <p className="portal-empty-text">
            Create an account through Messenger to get started with your favorite games.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }} data-testid="credentials-list">
          {credentials.map((cred) => (
            <div key={cred.id} className="portal-card" data-testid={`credential-${cred.id}`}>
              {/* Game Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 'var(--radius-md)', 
                  background: 'var(--portal-accent-soft)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Gamepad2 style={{ width: 24, height: 24, color: 'var(--portal-accent)' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--portal-text-primary)', fontSize: 'var(--text-base)' }}>
                    {cred.game_name}
                  </p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--portal-text-muted)' }}>
                    {cred.platform || 'Game Account'}
                  </p>
                </div>
              </div>

              {/* Username Field */}
              <div className="portal-form-group">
                <label className="portal-label">Username</label>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <div className="portal-input" style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--portal-bg)' }}>
                    {cred.username}
                  </div>
                  <button 
                    className="portal-btn portal-btn-secondary"
                    onClick={() => copyToClipboard(cred.username, `${cred.id}-user`)}
                    data-testid={`copy-username-${cred.id}`}
                  >
                    {copied[`${cred.id}-user`] ? <Check style={{ width: 16, height: 16 }} /> : <Copy style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              </div>

              {/* Password Field */}
              <div style={{ marginTop: 'var(--space-md)' }}>
                <label className="portal-label">Password</label>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <div className="portal-input" style={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    fontFamily: 'monospace',
                    background: 'var(--portal-bg)'
                  }}>
                    {visiblePasswords[cred.id] ? cred.password : '••••••••'}
                  </div>
                  <button 
                    className="portal-btn portal-btn-secondary"
                    onClick={() => togglePassword(cred.id)}
                    data-testid={`toggle-password-${cred.id}`}
                  >
                    {visiblePasswords[cred.id] ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                  <button 
                    className="portal-btn portal-btn-secondary"
                    onClick={() => copyToClipboard(cred.password, `${cred.id}-pass`)}
                    data-testid={`copy-password-${cred.id}`}
                  >
                    {copied[`${cred.id}-pass`] ? <Check style={{ width: 16, height: 16 }} /> : <Copy style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalLayout>
  );
};

export default PortalCredentials;
