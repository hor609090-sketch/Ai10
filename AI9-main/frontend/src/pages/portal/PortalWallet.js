import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../utils/api';
import PortalLayout from '../../components/PortalLayout';
import '../../styles/portal-design-system.css';
import { 
  Wallet, Gift, ArrowDownCircle, Lock, Unlock, Info, Check, AlertCircle,
  Plus, Upload, X, Copy, Clock, CheckCircle, XCircle, RefreshCw, QrCode
} from 'lucide-react';

const PortalWallet = () => {
  const navigate = useNavigate();
  const { clientToken, portalToken } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState(null);
  const [bonusData, setBonusData] = useState(null);
  const [cashoutData, setCashoutData] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState(null);
  
  // Add Balance Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState(1); // 1: select method, 2: show QR, 3: upload proof
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedQR, setSelectedQR] = useState(null);
  const [loadAmount, setLoadAmount] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  
  // Load History
  const [loadHistory, setLoadHistory] = useState([]);

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
      const [walletRes, bonusRes, cashoutRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE}/api/v1/wallet/balance`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE}/api/v1/portal/wallet/bonus-progress`, { headers: getAuthHeaders() }).catch(() => ({ data: {} })),
        axios.get(`${API_BASE}/api/v1/portal/wallet/cashout-preview`, { headers: getAuthHeaders() }).catch(() => ({ data: {} })),
        axios.get(`${API_BASE}/api/v1/wallet/load-history`, { headers: getAuthHeaders() }).catch(() => ({ data: { requests: [] } }))
      ]);
      
      setWalletData({
        overview: {
          total_balance: (walletRes.data.wallet_balance || 0) + (walletRes.data.bonus_balance || 0) + (walletRes.data.play_credits || 0),
          cash_balance: walletRes.data.wallet_balance || 0,
          bonus_balance: walletRes.data.bonus_balance || 0,
          play_credits: walletRes.data.play_credits || 0,
          withdrawable_amount: walletRes.data.wallet_balance || 0,
          locked_amount: (walletRes.data.bonus_balance || 0) + (walletRes.data.play_credits || 0),
          pending_loads: walletRes.data.pending_loads || 0
        }
      });
      setBonusData(bonusRes.data);
      setCashoutData(cashoutRes.data);
      setLoadHistory(historyRes.data.requests || []);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
      setWalletData({
        overview: {
          total_balance: 0,
          cash_balance: 0,
          play_credits: 0,
          withdrawable_amount: 0,
          locked_amount: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentQR = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/v1/wallet/qr`, { headers: getAuthHeaders() });
      setPaymentMethods(response.data.payment_methods || []);
      
      // Group QR codes by method
      const qrByMethod = {};
      (response.data.qr_codes || []).forEach(qr => {
        if (!qrByMethod[qr.payment_method]) {
          qrByMethod[qr.payment_method] = [];
        }
        qrByMethod[qr.payment_method].push(qr);
      });
      return qrByMethod;
    } catch (error) {
      console.error('Failed to fetch payment QR:', error);
      return {};
    }
  };

  const handleOpenAddBalance = async () => {
    setShowAddModal(true);
    setAddStep(1);
    setSelectedMethod(null);
    setSelectedQR(null);
    setLoadAmount('');
    setProofImage(null);
    setProofPreview(null);
    setSubmitResult(null);
    const qrData = await fetchPaymentQR();
    setPaymentMethods(Object.keys(qrData).map(method => ({
      method,
      qr_codes: qrData[method]
    })));
  };

  const handleSelectMethod = (methodData) => {
    setSelectedMethod(methodData.method);
    // Select default QR or first one
    const defaultQR = methodData.qr_codes.find(qr => qr.is_default) || methodData.qr_codes[0];
    setSelectedQR(defaultQR);
    setAddStep(2);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setProofImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitLoad = async () => {
    if (!loadAmount || parseFloat(loadAmount) < 10) {
      alert('Minimum load amount is ₱10');
      return;
    }
    if (!proofImage) {
      alert('Please upload payment proof');
      return;
    }

    setSubmitting(true);
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1];
        
        try {
          const response = await axios.post(
            `${API_BASE}/api/v1/wallet/load-request`,
            {
              amount: parseFloat(loadAmount),
              payment_method: selectedMethod,
              proof_image: base64
            },
            { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
          );
          
          setSubmitResult({
            success: true,
            message: response.data.message,
            request_id: response.data.request_id
          });
          setAddStep(4); // Success step
          fetchData(); // Refresh data
        } catch (error) {
          setSubmitResult({
            success: false,
            message: error.response?.data?.detail || 'Failed to submit request'
          });
        } finally {
          setSubmitting(false);
        }
      };
      reader.readAsDataURL(proofImage);
    } catch (error) {
      setSubmitting(false);
      setSubmitResult({
        success: false,
        message: 'Failed to process image'
      });
    }
  };

  const handleRedeemPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoMessage(null);
    try {
      const response = await axios.post(
        `${API_BASE}/api/v1/portal/promo/redeem`,
        { code: promoCode },
        { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
      );
      setPromoMessage({ type: 'success', text: response.data.message });
      setPromoCode('');
      fetchData();
    } catch (error) {
      setPromoMessage({ 
        type: 'error', 
        text: error.response?.data?.detail?.message || 'Failed to redeem promo code' 
      });
    } finally {
      setPromoLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'rgba(234, 179, 8, 0.2)', color: '#eab308', icon: Clock },
      approved: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', icon: CheckCircle },
      rejected: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', icon: XCircle }
    };
    const style = styles[status] || styles.pending;
    const Icon = style.icon;
    
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: style.bg,
        color: style.color
      }}>
        <Icon size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <PortalLayout title="Wallet">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'var(--portal-accent)' }}></div>
        </div>
      </PortalLayout>
    );
  }

  const overview = walletData?.overview || {};
  const progress = bonusData?.progress_tracker || {};
  const bonusSources = bonusData?.bonus_sources || {};

  return (
    <PortalLayout title="Wallet">
      {/* Tabs */}
      <div className="portal-tabs portal-section" data-testid="wallet-tabs">
        <button 
          className={`portal-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          data-testid="tab-overview"
        >
          Overview
        </button>
        <button 
          className={`portal-tab ${activeTab === 'addbalance' ? 'active' : ''}`}
          onClick={() => setActiveTab('addbalance')}
          data-testid="tab-addbalance"
        >
          Add Balance
        </button>
        <button 
          className={`portal-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
          data-testid="tab-history"
        >
          Load History
        </button>
        <button 
          className={`portal-tab ${activeTab === 'bonus' ? 'active' : ''}`}
          onClick={() => setActiveTab('bonus')}
          data-testid="tab-bonus"
        >
          Bonus & Promo
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Balance Card */}
          <div className="portal-card portal-section" data-testid="wallet-balance-card">
            <div className="balance-display">
              <p className="balance-label">Wallet Balance</p>
              <p className="balance-amount">₱{(overview.cash_balance || 0).toFixed(2)}</p>
            </div>
            
            {/* Add Balance Button */}
            <button
              onClick={handleOpenAddBalance}
              className="portal-btn portal-btn-primary"
              style={{ width: '100%', marginTop: 'var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              data-testid="add-balance-btn"
            >
              <Plus size={18} />
              Add Balance
            </button>
            
            <div className="stats-row" style={{ marginTop: 'var(--space-lg)' }}>
              <div className="stat-card">
                <p className="stat-label">Available for Games</p>
                <p className="stat-value" style={{ color: 'var(--portal-success)' }}>₱{(overview.cash_balance || 0).toFixed(2)}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Pending Loads</p>
                <p className="stat-value" style={{ color: 'var(--portal-warning)' }}>₱{(overview.pending_loads || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="portal-info" style={{ marginBottom: 'var(--space-md)' }}>
            <Info className="portal-info-icon" />
            <p className="portal-info-text">
              Games can ONLY be loaded from your wallet balance. Add funds via the Add Balance button above.
            </p>
          </div>

          {/* Withdrawal Status */}
          <div className="portal-card" data-testid="withdrawal-status-card">
            <div className="portal-card-header">
              <div className="portal-card-title">
                {overview.withdrawable_amount > 0 ? (
                  <Unlock style={{ width: 20, height: 20, color: 'var(--portal-success)' }} />
                ) : (
                  <Lock style={{ width: 20, height: 20, color: 'var(--portal-text-muted)' }} />
                )}
                Balance Breakdown
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
              <span style={{ color: 'var(--portal-text-secondary)', fontSize: 'var(--text-sm)' }}>Cash Balance</span>
              <span style={{ color: 'var(--portal-success)', fontWeight: 600 }}>
                ₱{(overview.cash_balance || 0).toFixed(2)}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
              <span style={{ color: 'var(--portal-text-secondary)', fontSize: 'var(--text-sm)' }}>Bonus Balance</span>
              <span style={{ color: 'var(--portal-text-muted)', fontWeight: 500 }}>
                ₱{(overview.bonus_balance || 0).toFixed(2)}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--portal-text-secondary)', fontSize: 'var(--text-sm)' }}>Play Credits</span>
              <span style={{ color: 'var(--portal-text-muted)', fontWeight: 500 }}>
                ₱{(overview.play_credits || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Add Balance Tab */}
      {activeTab === 'addbalance' && (
        <div className="portal-card" data-testid="add-balance-section">
          <div className="portal-card-header">
            <div className="portal-card-title">
              <Plus size={20} style={{ color: 'var(--portal-accent)' }} />
              Add Balance to Wallet
            </div>
          </div>
          
          <p style={{ color: 'var(--portal-text-secondary)', marginBottom: 'var(--space-lg)', fontSize: 'var(--text-sm)' }}>
            Select a payment method, make payment using the QR code, then upload your payment proof.
          </p>
          
          <button
            onClick={handleOpenAddBalance}
            className="portal-btn portal-btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <QrCode size={18} />
            Start Add Balance Process
          </button>
        </div>
      )}

      {/* Load History Tab */}
      {activeTab === 'history' && (
        <div className="portal-card" data-testid="load-history-section">
          <div className="portal-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="portal-card-title">
              <Clock size={20} style={{ color: 'var(--portal-accent)' }} />
              Load History
            </div>
            <button onClick={fetchData} className="portal-btn portal-btn-secondary" style={{ padding: '6px 12px' }}>
              <RefreshCw size={14} />
            </button>
          </div>
          
          {loadHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--portal-text-muted)' }}>
              <Wallet size={48} style={{ marginBottom: 'var(--space-md)', opacity: 0.5 }} />
              <p>No load history yet</p>
              <p style={{ fontSize: 'var(--text-sm)' }}>Your wallet load requests will appear here</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {loadHistory.map((item) => (
                <div 
                  key={item.request_id}
                  style={{
                    padding: 'var(--space-md)',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--portal-text)' }}>
                        ₱{item.amount?.toFixed(2)}
                      </span>
                      <span style={{ marginLeft: '8px', color: 'var(--portal-text-muted)', fontSize: 'var(--text-sm)' }}>
                        via {item.payment_method}
                      </span>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--portal-text-muted)' }}>
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                  {item.rejection_reason && item.status === 'rejected' && (
                    <div style={{ marginTop: 'var(--space-sm)', fontSize: 'var(--text-sm)', color: 'var(--portal-error)' }}>
                      Reason: {item.rejection_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bonus Tab */}
      {activeTab === 'bonus' && (
        <>
          {/* Promo Code Redemption */}
          <div className="portal-card" data-testid="promo-redeem-card">
            <div className="portal-card-header">
              <div className="portal-card-title">
                <Gift style={{ width: 20, height: 20, color: 'var(--portal-accent)' }} />
                Redeem Promo Code
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <input
                type="text"
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="portal-input"
                style={{ flex: 1, textTransform: 'uppercase' }}
                data-testid="promo-input"
              />
              <button
                onClick={handleRedeemPromo}
                disabled={promoLoading || !promoCode.trim()}
                className="portal-btn portal-btn-primary"
                data-testid="promo-redeem-btn"
              >
                {promoLoading ? 'Redeeming...' : 'Redeem'}
              </button>
            </div>
            
            {promoMessage && (
              <div className={`portal-message ${promoMessage.type === 'success' ? 'portal-message-success' : 'portal-message-error'}`} style={{ marginTop: 'var(--space-md)' }}>
                {promoMessage.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                {promoMessage.text}
              </div>
            )}
          </div>

          {/* Bonus Progress */}
          {bonusData?.progress_tracker && (
            <div className="portal-card">
              <div className="portal-card-header">
                <div className="portal-card-title">Bonus Progress</div>
              </div>
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                  <span style={{ color: 'var(--portal-text-secondary)', fontSize: 'var(--text-sm)' }}>Progress</span>
                  <span style={{ fontWeight: 500 }}>{progress.progress_percentage || 0}%</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${progress.progress_percentage || 0}%`, 
                    height: '100%', 
                    backgroundColor: 'var(--portal-accent)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Balance Modal */}
      {showAddModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-md)'
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'var(--portal-card-bg)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255,255,255,0.1)',
              maxWidth: '440px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ 
              padding: 'var(--space-lg)', 
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontWeight: 600 }}>Add Balance</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--portal-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div style={{ padding: 'var(--space-lg)' }}>
              {/* Step 1: Select Payment Method */}
              {addStep === 1 && (
                <>
                  <p style={{ color: 'var(--portal-text-secondary)', marginBottom: 'var(--space-md)' }}>
                    Select a payment method:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {paymentMethods.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--portal-text-muted)', padding: 'var(--space-lg)' }}>
                        No payment methods available. Please contact support.
                      </p>
                    ) : (
                      paymentMethods.map((pm) => (
                        <button
                          key={pm.method}
                          onClick={() => handleSelectMethod(pm)}
                          style={{
                            padding: 'var(--space-md)',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            color: 'var(--portal-text)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-md)'
                          }}
                        >
                          <QrCode size={24} style={{ color: 'var(--portal-accent)' }} />
                          <span style={{ fontWeight: 500 }}>{pm.method}</span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
              
              {/* Step 2: Show QR and Enter Amount */}
              {addStep === 2 && selectedQR && (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                    <p style={{ fontWeight: 500, marginBottom: 'var(--space-sm)' }}>{selectedMethod}</p>
                    {selectedQR.image_url && (
                      <img 
                        src={selectedQR.image_url} 
                        alt="Payment QR"
                        style={{ 
                          maxWidth: '200px', 
                          width: '100%', 
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}
                      />
                    )}
                    {selectedQR.account_name && (
                      <p style={{ color: 'var(--portal-text-secondary)', marginTop: 'var(--space-sm)', fontSize: 'var(--text-sm)' }}>
                        {selectedQR.account_name}
                      </p>
                    )}
                    {selectedQR.account_number && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-xs)', marginTop: 'var(--space-xs)' }}>
                        <code style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                          {selectedQR.account_number}
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText(selectedQR.account_number)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--portal-accent)' }}
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: 'var(--text-sm)', color: 'var(--portal-text-secondary)' }}>
                      Amount to Load (₱)
                    </label>
                    <input
                      type="number"
                      min="10"
                      placeholder="Enter amount (min. ₱10)"
                      value={loadAmount}
                      onChange={(e) => setLoadAmount(e.target.value)}
                      className="portal-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button
                      onClick={() => setAddStep(1)}
                      className="portal-btn portal-btn-secondary"
                      style={{ flex: 1 }}
                    >
                      Back
                    </button>
                    <button
                      onClick={() => loadAmount && parseFloat(loadAmount) >= 10 && setAddStep(3)}
                      className="portal-btn portal-btn-primary"
                      style={{ flex: 1 }}
                      disabled={!loadAmount || parseFloat(loadAmount) < 10}
                    >
                      Next: Upload Proof
                    </button>
                  </div>
                </>
              )}
              
              {/* Step 3: Upload Proof */}
              {addStep === 3 && (
                <>
                  <p style={{ color: 'var(--portal-text-secondary)', marginBottom: 'var(--space-md)' }}>
                    Upload your payment screenshot as proof:
                  </p>
                  
                  <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ 
                      padding: 'var(--space-sm)', 
                      backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 'var(--space-md)'
                    }}>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--portal-success)' }}>
                        Loading: ₱{parseFloat(loadAmount).toFixed(2)} via {selectedMethod}
                      </p>
                    </div>
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                      id="proof-upload"
                    />
                    <label
                      htmlFor="proof-upload"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'var(--space-xl)',
                        border: '2px dashed rgba(255,255,255,0.2)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {proofPreview ? (
                        <img 
                          src={proofPreview} 
                          alt="Proof preview"
                          style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 'var(--radius-sm)' }}
                        />
                      ) : (
                        <>
                          <Upload size={32} style={{ color: 'var(--portal-text-muted)', marginBottom: 'var(--space-sm)' }} />
                          <p style={{ color: 'var(--portal-text-muted)' }}>Click to upload payment proof</p>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--portal-text-muted)' }}>Max 5MB, JPG/PNG</p>
                        </>
                      )}
                    </label>
                  </div>
                  
                  {submitResult && !submitResult.success && (
                    <div style={{ 
                      padding: 'var(--space-md)', 
                      backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 'var(--space-md)',
                      color: 'var(--portal-error)'
                    }}>
                      {submitResult.message}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button
                      onClick={() => setAddStep(2)}
                      className="portal-btn portal-btn-secondary"
                      style={{ flex: 1 }}
                      disabled={submitting}
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmitLoad}
                      className="portal-btn portal-btn-primary"
                      style={{ flex: 1 }}
                      disabled={submitting || !proofImage}
                    >
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </>
              )}
              
              {/* Step 4: Success */}
              {addStep === 4 && submitResult?.success && (
                <div style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                  <CheckCircle size={64} style={{ color: 'var(--portal-success)', marginBottom: 'var(--space-md)' }} />
                  <h4 style={{ marginBottom: 'var(--space-sm)' }}>Request Submitted!</h4>
                  <p style={{ color: 'var(--portal-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                    Your wallet load request has been submitted for review. You will be notified once it is processed.
                  </p>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setActiveTab('history');
                    }}
                    className="portal-btn portal-btn-primary"
                    style={{ width: '100%' }}
                  >
                    View Load History
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default PortalWallet;
