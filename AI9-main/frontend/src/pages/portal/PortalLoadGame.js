import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import PortalLayout from '../../components/PortalLayout';
import '../../styles/portal-design-system.css';
import { 
  Gamepad2, Wallet, AlertCircle, Loader2, Check, ArrowRight, 
  Plus, Info, Lock, ChevronRight
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PortalLoadGame = () => {
  const navigate = useNavigate();
  const { clientToken, portalToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [games, setGames] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedGame, setSelectedGame] = useState(null);
  const [amount, setAmount] = useState('');
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

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
      const [gamesRes, walletRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/v1/games/available`, { headers: getAuthHeaders() }),
        axios.get(`${BACKEND_URL}/api/v1/wallet/balance`, { headers: getAuthHeaders() })
      ]);
      setGames(gamesRes.data.games || []);
      setWalletBalance(gamesRes.data.wallet_balance || walletRes.data.wallet_balance || 0);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setGames([]);
      setWalletBalance(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedGame || !amount || parseFloat(amount) <= 0) {
      setError('Please select a game and enter a valid amount');
      return;
    }

    // STRICT RULE: Only wallet balance can be used
    if (parseFloat(amount) > walletBalance) {
      setError(`Insufficient wallet balance. You have ₱${walletBalance.toFixed(2)} available.`);
      return;
    }

    // Check game minimum
    const minAmount = selectedGame.min_deposit_amount || 10;
    if (parseFloat(amount) < minAmount) {
      setError(`Minimum load amount for ${selectedGame.display_name} is ₱${minAmount}`);
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/v1/games/load`,
        {
          game_id: selectedGame.game_id,
          amount: parseFloat(amount)
        },
        { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
      );

      setSuccess(response.data);
      setWalletBalance(response.data.wallet_balance_remaining);
      setAmount('');
      setSelectedGame(null);
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (typeof detail === 'object') {
        setError(detail.message || 'Failed to load game');
      } else {
        setError(detail || 'Failed to load game');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout title="Load Game">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--portal-accent)' }} />
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="Load Game">
      {/* Wallet Balance Card */}
      <div className="portal-card portal-section" data-testid="game-wallet-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: 'var(--portal-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '4px' }}>
              Available Wallet Balance
            </p>
            <p style={{ fontSize: '1.75rem', fontWeight: 700, color: walletBalance > 0 ? 'var(--portal-success)' : 'var(--portal-text-muted)' }}>
              ₱{walletBalance.toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => navigate('/client/wallet')}
            className="portal-btn portal-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            Add Balance
          </button>
        </div>
      </div>

      {/* Important Notice */}
      <div className="portal-info portal-section" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', borderColor: 'rgba(234, 179, 8, 0.3)' }}>
        <Info size={18} style={{ color: 'var(--portal-warning)', flexShrink: 0 }} />
        <div>
          <p style={{ fontWeight: 500, color: 'var(--portal-warning)', marginBottom: '2px' }}>Important</p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--portal-text-secondary)' }}>
            Games can ONLY be loaded from your wallet balance. Add funds to your wallet first if you need more.
          </p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="portal-card portal-section" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--portal-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Check size={24} style={{ color: 'white' }} />
            </div>
            <div>
              <p style={{ fontWeight: 600, marginBottom: '4px' }}>Game Loaded Successfully!</p>
              <p style={{ color: 'var(--portal-text-secondary)', fontSize: 'var(--text-sm)' }}>
                ₱{success.amount_loaded} loaded to {success.game?.display_name}
              </p>
            </div>
          </div>
          {success.game_credentials && (
            <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--portal-text-muted)', marginBottom: '4px' }}>Game Session:</p>
              <code style={{ fontSize: 'var(--text-sm)' }}>{success.game_credentials.game_token}</code>
            </div>
          )}
          <button
            onClick={() => setSuccess(null)}
            className="portal-btn portal-btn-secondary"
            style={{ marginTop: 'var(--space-md)', width: '100%' }}
          >
            Load Another Game
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="portal-card portal-section" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <AlertCircle size={20} style={{ color: 'var(--portal-error)' }} />
            <p style={{ color: 'var(--portal-error)' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Game Selection */}
      {!success && (
        <>
          <div className="portal-card" data-testid="game-selection">
            <div className="portal-card-header">
              <div className="portal-card-title">
                <Gamepad2 size={20} style={{ color: 'var(--portal-accent)' }} />
                Select Game
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {games.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--portal-text-muted)', padding: 'var(--space-lg)' }}>
                  No games available
                </p>
              ) : (
                games.map((game) => (
                  <button
                    key={game.game_id}
                    onClick={() => {
                      setSelectedGame(game);
                      setError('');
                    }}
                    style={{
                      padding: 'var(--space-md)',
                      backgroundColor: selectedGame?.game_id === game.game_id 
                        ? 'rgba(16, 185, 129, 0.1)' 
                        : 'rgba(255,255,255,0.03)',
                      border: selectedGame?.game_id === game.game_id 
                        ? '2px solid var(--portal-accent)' 
                        : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 'var(--radius-md)',
                      cursor: game.can_load ? 'pointer' : 'not-allowed',
                      textAlign: 'left',
                      color: 'var(--portal-text)',
                      opacity: game.can_load ? 1 : 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    disabled={!game.can_load}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Gamepad2 size={20} style={{ color: 'var(--portal-accent)' }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 500, marginBottom: '2px' }}>{game.display_name}</p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--portal-text-muted)' }}>
                          Min: ₱{game.min_deposit_amount} • Max: ₱{game.max_deposit_amount}
                        </p>
                      </div>
                    </div>
                    {game.can_load ? (
                      <ChevronRight size={20} style={{ color: 'var(--portal-text-muted)' }} />
                    ) : (
                      <Lock size={16} style={{ color: 'var(--portal-text-muted)' }} />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Amount Input */}
          {selectedGame && (
            <div className="portal-card portal-section" data-testid="amount-input">
              <div className="portal-card-header">
                <div className="portal-card-title">
                  <Wallet size={20} style={{ color: 'var(--portal-accent)' }} />
                  Load Amount
                </div>
              </div>
              
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--portal-text-secondary)', marginBottom: 'var(--space-sm)' }}>
                  Loading to: <strong>{selectedGame.display_name}</strong>
                </p>
                <input
                  type="number"
                  min={selectedGame.min_deposit_amount || 10}
                  max={Math.min(selectedGame.max_deposit_amount || 10000, walletBalance)}
                  placeholder={`Enter amount (min ₱${selectedGame.min_deposit_amount || 10})`}
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError('');
                  }}
                  className="portal-input"
                  style={{ width: '100%', fontSize: '1.25rem' }}
                />
              </div>

              {/* Quick Amount Buttons */}
              <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
                {[50, 100, 200, 500].filter(amt => amt <= walletBalance).map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: amount === amt.toString() ? 'var(--portal-accent)' : 'rgba(255,255,255,0.1)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      color: amount === amt.toString() ? 'white' : 'var(--portal-text)',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    ₱{amt}
                  </button>
                ))}
                {walletBalance > 0 && (
                  <button
                    onClick={() => setAmount(walletBalance.toString())}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--portal-accent)',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    Max (₱{walletBalance.toFixed(0)})
                  </button>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={submitting || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > walletBalance}
                className="portal-btn portal-btn-primary"
                style={{ 
                  width: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px',
                  opacity: (submitting || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > walletBalance) ? 0.5 : 1
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Gamepad2 size={18} />
                    Load ₱{amount || '0'} to Game
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </PortalLayout>
  );
};

export default PortalLoadGame;
