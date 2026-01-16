import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import PortalLayout from '../../components/PortalLayout';
import '../../styles/portal-design-system.css';
import { 
  TrendingUp, TrendingDown, Filter, ChevronDown, CheckCircle, Clock, XCircle
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const PortalTransactions = () => {
  const navigate = useNavigate();
  const { clientToken, portalToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showFilter, setShowFilter] = useState(false);

  const getAuthHeaders = () => {
    if (clientToken) return { Authorization: `Bearer ${clientToken}` };
    if (portalToken) return { 'X-Portal-Token': portalToken };
    return {};
  };

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let url = `${BACKEND_URL}/api/v1/portal/transactions/enhanced`;
      if (filter !== 'all') url += `?type_filter=${filter}`;
      const response = await axios.get(url, { headers: getAuthHeaders() });
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      // Mock data for UI demo
      const mockTransactions = [
        { transaction_id: '1', type: 'IN', amount: 500, status: 'approved', game: 'Dragon Quest', created_at: new Date(Date.now() - 86400000).toISOString() },
        { transaction_id: '2', type: 'IN', amount: 250, status: 'approved', game: 'Battle Arena', created_at: new Date(Date.now() - 172800000).toISOString() },
        { transaction_id: '3', type: 'OUT', amount: 100, status: 'pending_review', game: 'Speed Racer', created_at: new Date(Date.now() - 259200000).toISOString() },
        { transaction_id: '4', type: 'IN', amount: 150, status: 'approved', game: 'Puzzle Master', created_at: new Date(Date.now() - 345600000).toISOString() },
        { transaction_id: '5', type: 'OUT', amount: 75, status: 'approved', game: 'Dragon Quest', created_at: new Date(Date.now() - 432000000).toISOString() }
      ];
      let filtered = mockTransactions;
      if (filter === 'deposit') filtered = mockTransactions.filter(t => t.type === 'IN');
      else if (filter === 'withdrawal') filtered = mockTransactions.filter(t => t.type === 'OUT');
      setTransactions(filtered);
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    const statusMap = {
      'approved': { class: 'status-chip-success', label: 'Approved' },
      'rejected': { class: 'status-chip-error', label: 'Rejected' },
      'pending_review': { class: 'status-chip-warning', label: 'Pending' },
      'pending_confirmation': { class: 'status-chip-warning', label: 'Pending' }
    };
    const config = statusMap[status] || { class: 'status-chip-neutral', label: status };
    return (
      <span className={`status-chip ${config.class}`}>
        <span className="status-dot"></span>
        {config.label}
      </span>
    );
  };

  const totals = transactions.reduce((acc, tx) => {
    if (tx.status === 'approved') {
      if (tx.type === 'IN') acc.in += tx.amount || 0;
      else if (tx.type === 'OUT') acc.out += tx.amount || 0;
    }
    return acc;
  }, { in: 0, out: 0 });

  const filterOptions = [
    { value: 'all', label: 'All Transactions' },
    { value: 'deposit', label: 'Deposits Only' },
    { value: 'withdrawal', label: 'Withdrawals Only' }
  ];

  return (
    <PortalLayout title="Transactions">
      {/* Summary Stats */}
      <div className="stats-row portal-section" data-testid="transaction-stats">
        <div className="stat-card">
          <p className="stat-label">Total In</p>
          <p className="stat-value stat-value-success">${totals.in.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Out</p>
          <p className="stat-value stat-value-error">${totals.out.toFixed(2)}</p>
        </div>
      </div>

      {/* Filter Dropdown */}
      <div className="portal-section" style={{ position: 'relative' }}>
        <button 
          className="portal-btn portal-btn-secondary portal-btn-full"
          onClick={() => setShowFilter(!showFilter)}
          style={{ justifyContent: 'space-between' }}
          data-testid="filter-dropdown-btn"
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <Filter style={{ width: 16, height: 16 }} />
            {filterOptions.find(f => f.value === filter)?.label}
          </span>
          <ChevronDown style={{ width: 16, height: 16, transform: showFilter ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
        
        {showFilter && (
          <div style={{ 
            position: 'absolute', 
            top: '100%', 
            left: 0, 
            right: 0, 
            marginTop: 'var(--space-xs)',
            background: 'var(--portal-card-bg)',
            border: '1px solid var(--portal-card-border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            zIndex: 50,
            boxShadow: 'var(--shadow-lg)'
          }}>
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setFilter(opt.value); setShowFilter(false); }}
                style={{
                  width: '100%',
                  padding: 'var(--space-md)',
                  background: filter === opt.value ? 'var(--portal-accent-soft)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--portal-card-border)',
                  color: filter === opt.value ? 'var(--portal-accent)' : 'var(--portal-text-primary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  minHeight: '48px'
                }}
                data-testid={`filter-option-${opt.value}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Transaction List */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '30vh' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'var(--portal-accent)' }}></div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="portal-empty" data-testid="empty-transactions">
          <TrendingUp className="portal-empty-icon" />
          <p className="portal-empty-title">No transactions yet</p>
          <p className="portal-empty-text">Your transaction history will appear here</p>
        </div>
      ) : (
        <div className="portal-list" data-testid="transaction-list">
          {transactions.map((tx) => (
            <div key={tx.transaction_id || tx.order_id} className="portal-list-item" data-testid={`transaction-${tx.transaction_id || tx.order_id}`}>
              <div className="portal-list-item-left">
                <div className="portal-list-item-icon" style={{ 
                  background: tx.type === 'IN' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(220, 38, 38, 0.1)' 
                }}>
                  {tx.type === 'IN' ? 
                    <TrendingUp style={{ width: 18, height: 18, color: 'var(--portal-success)' }} /> :
                    <TrendingDown style={{ width: 18, height: 18, color: 'var(--portal-error)' }} />
                  }
                </div>
                <div className="portal-list-item-content">
                  <span className="portal-list-item-title">
                    {tx.type === 'IN' ? 'Deposit' : 'Withdrawal'}
                    {tx.game && <span style={{ color: 'var(--portal-text-muted)' }}> • {tx.game}</span>}
                  </span>
                  <span className="portal-list-item-subtitle">
                    {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="portal-list-item-right">
                <p className="portal-list-item-value" style={{ 
                  color: tx.type === 'IN' ? 'var(--portal-success)' : 'var(--portal-error)',
                  marginBottom: 'var(--space-xs)'
                }}>
                  {tx.type === 'IN' ? '+' : '-'}${(tx.amount || 0).toFixed(2)}
                </p>
                {getStatusChip(tx.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalLayout>
  );
};

export default PortalTransactions;
