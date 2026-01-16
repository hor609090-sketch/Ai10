import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../utils/api';
import PortalLayout from '../../components/PortalLayout';
import '../../styles/portal-design-system.css';
import { 
  ArrowDownCircle, CheckCircle, Clock, XCircle, Info, Plus, Wallet, CreditCard
} from 'lucide-react';

const PortalWithdrawals = () => {
  const navigate = useNavigate();
  const { clientToken, portalToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState([]);
  const [cashoutPreview, setCashoutPreview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: '',
    account_name: '',
    account_number: ''
  });

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
      const [previewRes, txRes, methodsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/v1/portal/wallet/cashout-preview`, { headers: getAuthHeaders() }).catch(() => ({ data: null })),
        axios.get(`${API_BASE}/api/v1/portal/transactions/enhanced?type_filter=withdrawal`, { headers: getAuthHeaders() }).catch(() => ({ data: { transactions: [] } })),
        axios.get(`${API_BASE}/api/v1/wallet/qr`, { headers: getAuthHeaders() }).catch(() => ({ data: { qr_codes: [] } }))
      ]);
      setCashoutPreview(previewRes.data);
      setWithdrawals(txRes.data?.transactions || []);
      // Use payment methods from QR endpoint
      const methods = previewRes.data?.payment_methods || methodsRes.data?.qr_codes?.map(q => q.payment_method) || ['GCash', 'PayMaya', 'BPI', 'BDO'];
      setPaymentMethods([...new Set(methods)]);
    } catch (error) {
      console.error('Failed to fetch withdrawal data:', error);
      setCashoutPreview({ can_withdraw: false, preview: { payout_amount: 0 } });
      setWithdrawals([]);
      setPaymentMethods(['GCash', 'PayMaya', 'BPI', 'BDO']);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWithdrawal = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (!formData.payment_method) {
      alert('Please select a payment method');
      return;
    }
    if (!formData.account_name || !formData.account_number) {
      alert('Please enter your account details');
      return;
    }

    setProcessing(true);
    try {
      await axios.post(`${API_BASE}/api/v1/withdrawals/create`, {
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        account_name: formData.account_name,
        account_number: formData.account_number
      }, { headers: getAuthHeaders() });

      alert('Withdrawal request submitted! Awaiting review.');
      setShowModal(false);
      setFormData({ amount: '', payment_method: '', account_name: '', account_number: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to submit withdrawal request');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusChip = (status) => {
    const statusMap = {
      'approved': { class: 'status-chip-success', label: 'Completed', icon: CheckCircle },
      'confirmed': { class: 'status-chip-success', label: 'Completed', icon: CheckCircle },
      'rejected': { class: 'status-chip-error', label: 'Rejected', icon: XCircle },
      'cancelled': { class: 'status-chip-error', label: 'Cancelled', icon: XCircle }
    };
    const config = statusMap[status] || { class: 'status-chip-warning', label: 'Pending', icon: Clock };
    const Icon = config.icon;
    return (
      <span className={`status-chip ${config.class}`}>
        <Icon style={{ width: 12, height: 12 }} />
        {config.label}
      </span>
    );
  };

  const totalPending = withdrawals
    .filter(w => !['approved', 'confirmed', 'rejected', 'cancelled'].includes(w.status))
    .reduce((sum, w) => sum + (w.amount || 0), 0);
  const totalCompleted = withdrawals
    .filter(w => ['approved', 'confirmed'].includes(w.status))
    .reduce((sum, w) => sum + (w.payout_amount || w.amount || 0), 0);
  const availableBalance = cashoutPreview?.preview?.payout_amount || 0;

  if (loading) {
    return (
      <PortalLayout title="Withdrawals">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'var(--portal-accent)' }}></div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="Withdrawals">
      {/* Summary Stats */}
      <div className="stats-row portal-section" data-testid="withdrawal-stats">
        <div className="stat-card">
          <p className="stat-label">Available</p>
          <p className="stat-value stat-value-success">₱{availableBalance.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Pending</p>
          <p className="stat-value stat-value-warning">₱{totalPending.toFixed(2)}</p>
        </div>
      </div>

      {/* Request Withdrawal Button */}
      <div className="portal-section">
        <button
          onClick={() => setShowModal(true)}
          disabled={availableBalance <= 0}
          className="portal-btn portal-btn-primary"
          style={{ 
            width: '100%', 
            padding: 'var(--space-md)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 'var(--space-sm)',
            opacity: availableBalance <= 0 ? 0.5 : 1
          }}
          data-testid="request-withdrawal-btn"
        >
          <Plus style={{ width: 20, height: 20 }} />
          Request Withdrawal
        </button>
        {availableBalance <= 0 && (
          <p style={{ textAlign: 'center', color: 'var(--portal-text-muted)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-sm)' }}>
            No balance available for withdrawal
          </p>
        )}
      </div>

      {/* Withdrawal History */}
      <div className="portal-section">
        <p className="portal-section-title">History</p>
        
        {withdrawals.length === 0 ? (
          <div className="portal-empty" data-testid="empty-withdrawals">
            <ArrowDownCircle className="portal-empty-icon" />
            <p className="portal-empty-title">No withdrawals yet</p>
            <p className="portal-empty-text">Request a withdrawal when you have available balance</p>
          </div>
        ) : (
          <div className="portal-list" data-testid="withdrawals-list">
            {withdrawals.map((w) => (
              <div key={w.order_id || w.transaction_id} className="portal-list-item" data-testid={`withdrawal-${w.order_id || w.transaction_id}`}>
                <div className="portal-list-item-left">
                  <div className="portal-list-item-content">
                    <span className="portal-list-item-title">
                      {w.payment_method || w.game || 'Withdrawal'}
                    </span>
                    <span className="portal-list-item-subtitle">
                      {w.created_at ? new Date(w.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="portal-list-item-right">
                  <p className="portal-list-item-value" style={{ color: 'var(--portal-error)', marginBottom: 'var(--space-xs)' }}>
                    -₱{(w.amount || 0).toFixed(2)}
                  </p>
                  {getStatusChip(w.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Info */}
      <div className="portal-info" data-testid="withdrawal-help">
        <Info className="portal-info-icon" />
        <p className="portal-info-text">
          Withdrawal requests are reviewed by our team via Telegram. You'll be notified once processed.
        </p>
      </div>

      {/* Withdrawal Request Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: 'var(--space-md)'
        }}>
          <div style={{
            backgroundColor: 'var(--portal-surface)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '400px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              padding: 'var(--space-md)',
              borderBottom: '1px solid var(--portal-border)'
            }}>
              <h3 style={{ color: 'var(--portal-text-primary)', fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>
                Request Withdrawal
              </h3>
            </div>

            <form onSubmit={handleSubmitWithdrawal} style={{ padding: 'var(--space-md)' }}>
              {/* Amount */}
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <label style={{ display: 'block', color: 'var(--portal-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-xs)' }}>
                  Amount (₱)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  max={availableBalance}
                  min="1"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: 'var(--space-sm)',
                    backgroundColor: 'var(--portal-bg)',
                    border: '1px solid var(--portal-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--portal-text-primary)'
                  }}
                  data-testid="withdrawal-amount-input"
                />
                <p style={{ color: 'var(--portal-text-muted)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-xs)' }}>
                  Max: ₱{availableBalance.toFixed(2)}
                </p>
              </div>

              {/* Payment Method */}
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <label style={{ display: 'block', color: 'var(--portal-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-xs)' }}>
                  Payment Method
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: 'var(--space-sm)',
                    backgroundColor: 'var(--portal-bg)',
                    border: '1px solid var(--portal-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--portal-text-primary)'
                  }}
                  data-testid="withdrawal-method-select"
                >
                  <option value="">Select method</option>
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              {/* Account Name */}
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <label style={{ display: 'block', color: 'var(--portal-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-xs)' }}>
                  Account Name
                </label>
                <input
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
                  placeholder="Juan Dela Cruz"
                  style={{
                    width: '100%',
                    padding: 'var(--space-sm)',
                    backgroundColor: 'var(--portal-bg)',
                    border: '1px solid var(--portal-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--portal-text-primary)'
                  }}
                  data-testid="withdrawal-account-name"
                />
              </div>

              {/* Account Number */}
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <label style={{ display: 'block', color: 'var(--portal-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-xs)' }}>
                  Account Number / Phone
                </label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                  placeholder="09171234567"
                  style={{
                    width: '100%',
                    padding: 'var(--space-sm)',
                    backgroundColor: 'var(--portal-bg)',
                    border: '1px solid var(--portal-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--portal-text-primary)'
                  }}
                  data-testid="withdrawal-account-number"
                />
              </div>

              {/* Info */}
              <div style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-sm)',
                marginBottom: 'var(--space-md)'
              }}>
                <p style={{ color: 'rgb(147, 197, 253)', fontSize: 'var(--text-xs)' }}>
                  Your withdrawal request will be reviewed via Telegram. Please allow 1-24 hours for processing.
                </p>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: 'var(--space-sm)',
                    backgroundColor: 'var(--portal-bg)',
                    border: '1px solid var(--portal-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--portal-text-secondary)'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  style={{
                    flex: 1,
                    padding: 'var(--space-sm)',
                    backgroundColor: 'var(--portal-accent)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    fontWeight: 'bold',
                    opacity: processing ? 0.5 : 1
                  }}
                  data-testid="submit-withdrawal-btn"
                >
                  {processing ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default PortalWithdrawals;
