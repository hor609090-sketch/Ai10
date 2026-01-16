import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE } from '../../../utils/api';
import axios from 'axios';
import { 
  Wallet, RefreshCw, Clock, Eye, User, 
  CreditCard, AlertCircle, CheckCircle, XCircle, ExternalLink, Bot
} from 'lucide-react';

const AdminWalletLoads = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? `?status_filter=${statusFilter}` : '';
      const response = await axios.get(`${API_BASE}/api/v1/admin/system/wallet-loads${params}`, config);
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Failed to fetch wallet loads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Clock },
      approved: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle }
    };
    const style = styles[status] || styles.pending;
    const Icon = style.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6" data-testid="admin-wallet-loads">
      {/* Info Banner - Telegram Review */}
      <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-blue-400 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-blue-400 font-bold">Wallet Load Review via Telegram</h3>
            <p className="text-blue-300/80 text-sm">
              Wallet load approvals are handled via Telegram reviewer bots. This page is read-only for monitoring.
            </p>
          </div>
          <a
            href="/admin/system/telegram-bots"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Manage Bots
          </a>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Wallet className="w-7 h-7 text-emerald-400" />
            Wallet Load Requests
          </h1>
          <p className="text-gray-400">Monitor wallet top-up requests (read-only)</p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'pending', 'approved', 'rejected'].map(filter => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`px-4 py-2 rounded-lg transition font-medium ${
              statusFilter === filter
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No wallet load requests found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {requests.map(req => (
              <div key={req.request_id} className="p-4 hover:bg-gray-800/50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{req.display_name || req.username}</span>
                        {getStatusBadge(req.status)}
                        {req.amount_adjusted && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                            ADJUSTED
                          </span>
                        )}
                      </div>
                      <div className="text-gray-400 text-sm flex items-center gap-2">
                        <CreditCard className="w-3 h-3" />
                        {req.payment_method}
                        <span className="text-gray-600">•</span>
                        <Clock className="w-3 h-3" />
                        {new Date(req.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xl font-bold text-emerald-400">
                        ₱{req.amount?.toFixed(2)}
                      </div>
                      {req.reviewed_by && (
                        <div className="text-gray-500 text-xs">
                          Reviewed by: {req.reviewed_by}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal (Read-Only) */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg mx-4">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">Wallet Load Request Details</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Request ID</span>
                  <span className="text-white font-mono text-sm">{selectedRequest.request_id?.substring(0, 16)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">User</span>
                  <span className="text-white">{selectedRequest.display_name || selectedRequest.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-emerald-400 font-bold">₱{selectedRequest.amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment Method</span>
                  <span className="text-white">{selectedRequest.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created</span>
                  <span className="text-gray-300">{new Date(selectedRequest.created_at).toLocaleString()}</span>
                </div>
                {selectedRequest.reviewed_by && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Reviewed By</span>
                      <span className="text-gray-300">{selectedRequest.reviewed_by}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Reviewed At</span>
                      <span className="text-gray-300">{new Date(selectedRequest.reviewed_at).toLocaleString()}</span>
                    </div>
                  </>
                )}
                {selectedRequest.rejection_reason && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rejection Reason</span>
                    <span className="text-red-400">{selectedRequest.rejection_reason}</span>
                  </div>
                )}
              </div>

              {selectedRequest.status === 'pending' && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-300 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Pending requests are reviewed via Telegram. Payment proof was sent to reviewer bot(s).
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-800">
              <button
                onClick={() => setSelectedRequest(null)}
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

export default AdminWalletLoads;
