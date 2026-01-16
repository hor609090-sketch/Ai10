import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Webhook, Plus, Trash2, Power, RefreshCw, CheckCircle, XCircle, AlertCircle, History } from 'lucide-react';

// Safe fallback for backend URL
const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const SystemWebhooks = () => {
  const { token } = useAuth();
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeliveries, setShowDeliveries] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [form, setForm] = useState({
    name: '',
    url: '',
    events: [],
    enabled: true
  });

  const availableEvents = [
    { value: 'deposit.approved', label: 'Deposit Approved' },
    { value: 'deposit.rejected', label: 'Deposit Rejected' },
    { value: 'withdrawal.approved', label: 'Withdrawal Approved' },
    { value: 'withdrawal.rejected', label: 'Withdrawal Rejected' },
    { value: 'user.registered', label: 'User Registered' },
    { value: 'promo.redeemed', label: 'Promo Code Redeemed' },
    { value: 'referral.earned', label: 'Referral Commission Earned' }
  ];

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    setLoading(true);
    setError(null);
    try {
      // FIXED: Correct endpoint path with /system prefix
      const res = await fetch(`${API}/api/v1/admin/system/webhooks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.webhooks || []);
      } else if (res.status === 404) {
        // Endpoint might not exist yet - show empty state
        setWebhooks([]);
      } else {
        throw new Error('Failed to fetch webhooks');
      }
    } catch (err) {
      console.error('Failed to fetch webhooks:', err);
      setError('Could not load webhooks. The feature may not be configured yet.');
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.url) return;

    try {
      // FIXED: Correct endpoint path with /system prefix
      const res = await fetch(`${API}/api/v1/admin/system/webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setShowModal(false);
        setForm({ name: '', url: '', events: [], enabled: true });
        fetchWebhooks();
      } else {
        const errorData = await res.json();
        alert(errorData.detail || 'Failed to create webhook');
      }
    } catch (err) {
      console.error('Failed to create webhook:', err);
      alert('Failed to create webhook');
    }
  };

  const handleToggle = async (id, enabled) => {
    try {
      // FIXED: Correct endpoint path with /system prefix
      await fetch(`${API}/api/v1/admin/system/webhooks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ enabled: !enabled })
      });
      fetchWebhooks();
    } catch (err) {
      console.error('Failed to toggle webhook:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this webhook?')) return;

    try {
      // FIXED: Correct endpoint path with /system prefix
      await fetch(`${API}/api/v1/admin/system/webhooks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchWebhooks();
    } catch (err) {
      console.error('Failed to delete webhook:', err);
    }
  };

  const fetchDeliveries = async (webhookId) => {
    try {
      // FIXED: Correct endpoint path with /system prefix
      const res = await fetch(`${API}/api/v1/admin/system/webhooks/${webhookId}/deliveries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data.deliveries || []);
        setShowDeliveries(webhookId);
      }
    } catch (err) {
      console.error('Failed to fetch deliveries:', err);
    }
  };

  const handleEventToggle = (event) => {
    if (form.events.includes(event)) {
      setForm({ ...form, events: form.events.filter(e => e !== event) });
    } else {
      setForm({ ...form, events: [...form.events, event] });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Webhook className="w-6 h-6 text-purple-400" />
            Webhooks
          </h1>
          <p className="text-gray-400 text-sm mt-1">Receive real-time notifications for platform events</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-emerald-500 hover:bg-emerald-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-medium">Notice</p>
            <p className="text-yellow-300/70 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Webhooks List */}
      <div className="space-y-3">
        {webhooks.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-12 text-center">
              <Webhook className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">No webhooks configured</p>
              <p className="text-gray-600 text-sm mt-1">Create a webhook to receive event notifications</p>
            </CardContent>
          </Card>
        ) : (
          webhooks.map(webhook => (
            <Card key={webhook.id} className="bg-gray-900 border-gray-800">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-semibold">{webhook.name}</h3>
                      {webhook.enabled ? (
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded-full flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm font-mono mb-3">{webhook.url}</p>
                    <div className="flex flex-wrap gap-2">
                      {webhook.events?.map(event => (
                        <span key={event} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded">
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchDeliveries(webhook.id)}
                      className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                      title="View Deliveries"
                    >
                      <History className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleToggle(webhook.id, webhook.enabled)}
                      className={`p-2 rounded-lg transition ${
                        webhook.enabled
                          ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(webhook.id)}
                      className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <Card className="bg-gray-900 border-gray-800 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Create Webhook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Name</label>
                <Input
                  placeholder="My Webhook"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Webhook URL</label>
                <Input
                  placeholder="https://example.com/webhook"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Events to Listen</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableEvents.map(event => (
                    <label key={event.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.events.includes(event.value)}
                        onChange={() => handleEventToggle(event.value)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-emerald-500"
                      />
                      <span className="text-gray-300 text-sm">{event.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setShowModal(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                  Create Webhook
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Deliveries Modal */}
      {showDeliveries && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowDeliveries(null)}>
          <Card className="bg-gray-900 border-gray-800 w-full max-w-lg max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Delivery History</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-96">
              {deliveries.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No deliveries yet</p>
              ) : (
                <div className="space-y-2">
                  {deliveries.map((d, idx) => (
                    <div key={idx} className="bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm">{d.event}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          d.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {d.status_code || d.status}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs">
                        {d.delivered_at ? new Date(d.delivered_at).toLocaleString() : 'Pending'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={() => setShowDeliveries(null)} className="w-full mt-4">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SystemWebhooks;
