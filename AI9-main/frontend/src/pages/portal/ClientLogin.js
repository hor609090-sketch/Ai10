import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/portal-design-system.css';
import { Lock, Eye, EyeOff, ArrowLeft, User, Gamepad2 } from 'lucide-react';

const ClientLogin = () => {
  const navigate = useNavigate();
  const { clientPasswordLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await clientPasswordLogin(form.username, form.password);
      if (result.success) {
        navigate('/portal');
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0a0f14 0%, #111827 50%, #1a1f2e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-md)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Card */}
        <div className="portal-card" style={{ padding: 'var(--space-2xl)' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-lg)',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
            }}>
              <Gamepad2 style={{ width: 36, height: 36, color: 'white' }} />
            </div>
            <h1 style={{ 
              fontSize: 'var(--text-2xl)', 
              fontWeight: 800, 
              background: 'linear-gradient(135deg, #ffffff 0%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 'var(--space-sm)'
            }}>
              Welcome Back
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--portal-text-muted)' }}>
              Sign in to access your portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="portal-form-group">
              <label className="portal-label">Username</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: 18,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--portal-text-dim)'
                }}>
                  <User style={{ width: 18, height: 18 }} />
                </span>
                <input
                  type="text"
                  className="portal-input"
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  style={{ paddingLeft: 52 }}
                  data-testid="login-username-input"
                />
              </div>
            </div>

            <div className="portal-form-group">
              <label className="portal-label">Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: 18,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--portal-text-dim)'
                }}>
                  <Lock style={{ width: 18, height: 18 }} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="portal-input"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  style={{ paddingLeft: 52, paddingRight: 52 }}
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--portal-text-dim)',
                    cursor: 'pointer',
                    padding: 8
                  }}
                >
                  {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: 'var(--space-md)',
                background: 'var(--portal-error-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--portal-error)',
                fontSize: 'var(--text-sm)',
                marginBottom: 'var(--space-md)'
              }} data-testid="login-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="portal-btn portal-btn-primary portal-btn-full"
              disabled={loading}
              style={{ marginTop: 'var(--space-md)' }}
              data-testid="login-submit-btn"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: 'var(--space-2xl)',
            paddingTop: 'var(--space-xl)',
            borderTop: '1px solid var(--portal-card-border)'
          }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--portal-text-muted)', marginBottom: 'var(--space-lg)' }}>
              Don&apos;t have an account? Get a magic link from our messenger.
            </p>
            <Link 
              to="/games" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 'var(--space-sm)',
                color: 'var(--portal-accent)',
                fontSize: 'var(--text-sm)',
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              <ArrowLeft style={{ width: 16, height: 16 }} />
              Back to Games
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientLogin;
