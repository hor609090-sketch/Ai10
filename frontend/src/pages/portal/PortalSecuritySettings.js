import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import PortalLayout from '../../components/PortalLayout';
import '../../styles/portal-design-system.css';
import { Shield, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const PortalSecuritySettings = () => {
  const navigate = useNavigate();
  const { user, clientToken, portalToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });

  const getAuthHeaders = () => {
    if (clientToken) return { Authorization: `Bearer ${clientToken}` };
    if (portalToken) return { 'X-Portal-Token': portalToken };
    return {};
  };

  const hasPasswordLogin = user?.has_password || false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (form.password !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (form.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/v1/portal/security/set-password`,
        { username: form.username, password: form.password },
        { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
      );
      setMessage({ type: 'success', text: 'Password login set up successfully!' });
      setForm({ username: '', password: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail?.message || 'Failed to set up password login' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalLayout title="Security">
      {/* Status Card */}
      <div className="portal-card portal-section" data-testid="security-status-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: 'var(--radius-md)', 
            background: hasPasswordLogin ? 'rgba(5, 150, 105, 0.1)' : 'var(--portal-bg)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Shield style={{ width: 24, height: 24, color: hasPasswordLogin ? 'var(--portal-success)' : 'var(--portal-text-muted)' }} />
          </div>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--portal-text-primary)', fontSize: 'var(--text-base)' }}>
              Password Login
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: hasPasswordLogin ? 'var(--portal-success)' : 'var(--portal-text-muted)' }}>
              {hasPasswordLogin ? 'Enabled' : 'Not set up'}
            </p>
          </div>
        </div>
      </div>

      {/* Setup Form */}
      {!hasPasswordLogin && (
        <div className="portal-card portal-section" data-testid="password-setup-form">
          <div className="portal-card-header">
            <div className="portal-card-title">Set Up Password Login</div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="portal-form-group">
              <label className="portal-label">Username</label>
              <input
                type="text"
                className="portal-input"
                placeholder="Choose a username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                data-testid="username-input"
              />
            </div>

            <div className="portal-form-group">
              <label className="portal-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="portal-input"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  style={{ paddingRight: 48 }}
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--portal-text-muted)',
                    cursor: 'pointer',
                    padding: 8
                  }}
                >
                  {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                </button>
              </div>
            </div>

            <div className="portal-form-group" style={{ marginBottom: 'var(--space-lg)' }}>
              <label className="portal-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="portal-input"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                  style={{ paddingRight: 48 }}
                  data-testid="confirm-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--portal-text-muted)',
                    cursor: 'pointer',
                    padding: 8
                  }}
                >
                  {showConfirm ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                </button>
              </div>
            </div>

            {message && (
              <div style={{ 
                marginBottom: 'var(--space-md)', 
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                background: message.type === 'success' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)'
              }} data-testid="form-message">
                {message.type === 'success' ? 
                  <Check style={{ width: 18, height: 18, color: 'var(--portal-success)' }} /> :
                  <AlertCircle style={{ width: 18, height: 18, color: 'var(--portal-error)' }} />
                }
                <span style={{ 
                  fontSize: 'var(--text-sm)', 
                  color: message.type === 'success' ? 'var(--portal-success)' : 'var(--portal-error)' 
                }}>
                  {message.text}
                </span>
              </div>
            )}

            <button 
              type="submit" 
              className="portal-btn portal-btn-primary portal-btn-full"
              disabled={loading}
              data-testid="submit-password-btn"
            >
              {loading ? 'Setting up...' : 'Set Up Password Login'}
            </button>
          </form>
        </div>
      )}

      {/* Info */}
      <div className="portal-info" data-testid="security-info">
        <Shield className="portal-info-icon" />
        <p className="portal-info-text">
          Password login is optional. You can always access your account via magic link from Messenger.
        </p>
      </div>
    </PortalLayout>
  );
};

export default PortalSecuritySettings;
