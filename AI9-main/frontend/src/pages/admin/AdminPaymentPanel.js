import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../utils/api';
import { 
  CreditCard, AlertTriangle, Check, X, RefreshCw, 
  User, Clock, Eye, Wallet, ArrowDownCircle, ArrowUpCircle, 
  FileText, ExternalLink
} from 'lucide-react';

const AdminPaymentPanel = () => {
  const { token } = useAuth();
  const [pendingPayments, setPendingPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchPendingPayments();
    fetchStats();
  }, [token]);

  const fetchPendingPayments = async () => {
    try {
      // FIXED: Use order_type instead of type
      const response = await axios.get(
        `${API_BASE}/api/v1/admin/approvals/pending?order_type=deposit`, 
        config
      );
      setPendingPayments(response.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch pending payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/v1/admin/dashboard`, config);
      setStats(response.data.financial_summary || {});
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handlePaymentAction = async (orderId, action, extraData = {}) => {
    setProcessing(true);
    try {
      await axios.post(`${API_BASE}/api/v1/admin/approvals/${orderId}/action`, {
        action: action,
        ...extraData
      }, config);
      
      setShowDetailModal(false);
      setSelectedOrder(null);
      fetchPendingPayments();
      fetchStats();
    } catch (error) {
      console.error('Failed to process action:', error);
      alert('Failed: ' + (error.response?.data?.detail || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  const viewOrderDetail = async (orderId) => {
    try {
      const response = await axios.get(`${API_BASE}/api/v1/admin/orders/${orderId}`, config);
      setSelectedOrder(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Failed to fetch order detail:', error);
    }
  };

  return (
    <div className="space-y-6" data-testid="payment-panel">
      {/* Info Banner */}
      <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-blue-400 flex-shrink-0" />
          <div>
            <h3 className="text-blue-400 font-bold">Payment Review Panel</h3>
            <p className="text-blue-300/80 text-sm">
              Payments are primarily reviewed via Telegram bots. This panel shows pending orders for reference.
              <a href="/admin/system/telegram-bots" className="ml-2 underline inline-flex items-center gap-1">
                Configure Telegram Bots <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-gray-400 text-sm">Pending</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats?.pending_payments || pendingPayments.length}</div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-gray-400 text-sm">Approved Today</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats?.approved_today || 0}</div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <X className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-gray-400 text-sm">Rejected Today</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats?.rejected_today || 0}</div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-gray-400 text-sm">Total Clients</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats?.total_clients || 0}</div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchPendingPayments}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition flex items-center gap-2"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Pending Payments List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Pending Payment Verification</h2>
          <p className="text-gray-400 text-sm">Orders awaiting approval (primarily via Telegram)</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : pendingPayments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No pending payments</p>
            <p className="text-gray-500 text-sm">All payments have been reviewed</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {pendingPayments.map(order => (
              <div key={order.order_id} className="p-4 hover:bg-gray-800/50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      order.order_type === 'deposit' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                    }`}>
                      {order.order_type === 'deposit' ? (
                        <ArrowDownCircle className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <ArrowUpCircle className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{order.display_name || order.username}</span>
                        {order.amount_adjusted && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                            ADJUSTED
                          </span>
                        )}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {order.order_type === 'deposit' ? 'Deposit' : 'Withdrawal'} 
                        • {order.payment_method || 'N/A'}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {new Date(order.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-xl font-bold ${
                        order.order_type === 'deposit' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        ₱{order.amount?.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => viewOrderDetail(order.order_id)}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition"
                        title="View Details"
                        data-testid={`view-detail-${order.order_id}`}
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Modal (Read-Only) */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">Payment Details</h3>
              <p className="text-gray-400 text-sm">Review via Telegram for approval</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Order ID</span>
                  <span className="text-white font-mono text-sm">{selectedOrder.order?.order_id?.substring(0, 16)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Client</span>
                  <span className="text-white">{selectedOrder.client?.display_name || selectedOrder.order?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type</span>
                  <span className="text-white">{selectedOrder.order?.order_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount</span>
                  <span className={`text-lg font-bold ${
                    selectedOrder.order?.order_type === 'deposit' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    ₱{selectedOrder.order?.amount?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className="text-yellow-400">{selectedOrder.order?.status}</span>
                </div>
                {selectedOrder.order?.amount_adjusted && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Adjusted By</span>
                    <span className="text-yellow-400">{selectedOrder.order?.adjusted_by}</span>
                  </div>
                )}
              </div>

              {/* Wallet Balance */}
              {selectedOrder.wallet && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Wallet className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">Current Wallet Balance</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-gray-400 text-sm">Real</div>
                      <div className="text-white font-bold">₱{selectedOrder.wallet?.real_balance?.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Bonus</div>
                      <div className="text-purple-400 font-bold">₱{selectedOrder.wallet?.bonus_balance?.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Notice */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  ℹ️ Approvals are handled via Telegram reviewer bots. 
                  <a href="/admin/system/telegram-bots" className="underline ml-1">
                    Manage Telegram Bots
                  </a>
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-800">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedOrder(null);
                }}
                className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentPanel;
