import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  Settings, RefreshCw, Check, X, Eye, Edit3, Play, Pause,
  Send, MessageCircle, DollarSign, Gamepad2, FileText,
  Link, Shield, Zap, AlertTriangle, ChevronDown, ChevronRight,
  Copy, ExternalLink, Power, Database, Webhook, ArrowDownCircle,
  ArrowUpCircle, Clock, CheckCircle, XCircle, Search, Filter,
  Plus, Trash2, ToggleLeft, ToggleRight, BookOpen, Terminal,
  Hash, User, Globe, Key, List, Activity, Bot, Smartphone
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const AdminOperationsPanel = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [telegramConfig, setTelegramConfig] = useState(null);
  const [orderStates, setOrderStates] = useState([]);
  const [telegramActions, setTelegramActions] = useState([]);
  const [apiConnectors, setApiConnectors] = useState([]);
  const [stats, setStats] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Feature toggles
  const [featureToggles, setFeatureToggles] = useState({
    api_enabled: true,
    telegram_forwarding: false,
    manual_verification: true,
    auto_approve_loads: false,
    auto_approve_withdrawals: false,
    referral_system: true,
    bonus_system: true,
    webhook_notifications: true
  });

  // Telegram config form
  const [telegramForm, setTelegramForm] = useState({
    bot_token: '',
    admin_chat_id: '',
    notification_chat_id: '',
    forward_payments: false,
    forward_withdrawals: false,
    forward_loads: false
  });

  // Order state form
  const [orderStateForm, setOrderStateForm] = useState({
    name: '',
    display_name: '',
    color: '#10b981',
    telegram_button_text: '',
    auto_action: 'none'
  });

  // Telegram action form
  const [actionForm, setActionForm] = useState({
    name: '',
    button_text: '',
    action_type: 'confirm',
    target_state: '',
    requires_input: false
  });

  // API connector form
  const [connectorForm, setConnectorForm] = useState({
    name: '',
    type: 'load',
    endpoint: '',
    method: 'POST',
    auth_type: 'bearer',
    api_key: '',
    enabled: true
  });

  // Modal states
  const [showOrderStateModal, setShowOrderStateModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showConnectorModal, setShowConnectorModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Transaction filters
  const [txFilter, setTxFilter] = useState({ status: '', type: '', search: '' });

  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, statsRes, txRes] = await Promise.all([
        axios.get(`${API}/api/v1/admin/system`, config).catch(() => ({ data: {} })),
        axios.get(`${API}/api/v1/admin/dashboard`, config).catch(() => ({ data: {} })),
        axios.get(`${API}/api/v1/admin/orders?limit=100`, config).catch(() => ({ data: { orders: [] } }))
      ]);

      setSettings(settingsRes.data);
      setStats(statsRes.data);
      setTransactions(txRes.data.transactions || []);

      // Set feature toggles from settings
      if (settingsRes.data?.feature_toggles) {
        setFeatureToggles(prev => ({ ...prev, ...settingsRes.data.feature_toggles }));
      }
      if (settingsRes.data?.telegram_config) {
        setTelegramConfig(settingsRes.data.telegram_config);
        setTelegramForm(prev => ({ ...prev, ...settingsRes.data.telegram_config }));
      }
      if (settingsRes.data?.order_states) {
        setOrderStates(settingsRes.data.order_states);
      }
      if (settingsRes.data?.telegram_actions) {
        setTelegramActions(settingsRes.data.telegram_actions);
      }
      if (settingsRes.data?.api_connectors) {
        setApiConnectors(settingsRes.data.api_connectors);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleFeature = async (feature, value) => {
    setProcessing(true);
    try {
      await axios.put(`${API}/api/v1/admin/system`, {
        [feature]: value
      }, config);
      setFeatureToggles(prev => ({ ...prev, [feature]: value }));
    } catch (error) {
      console.error('Failed to toggle feature:', error);
      alert('Failed to update setting');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveTelegramConfig = async () => {
    setProcessing(true);
    try {
      await axios.put(`${API}/api/v1/admin/telegram`, telegramForm, config);
      setTelegramConfig(telegramForm);
      alert('Telegram configuration saved!');
    } catch (error) {
      console.error('Failed to save telegram config:', error);
      alert('Failed to save configuration');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveOrderState = async () => {
    setProcessing(true);
    try {
      // Order states feature - using system endpoint
      await axios.put(`${API}/api/v1/admin/system`, { order_states: orderStateForm }, config);
      fetchData();
      setShowOrderStateModal(false);
      setEditingItem(null);
      resetOrderStateForm();
    } catch (error) {
      console.error('Failed to save order state:', error);
      alert('Failed to save order state');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveAction = async () => {
    setProcessing(true);
    try {
      // Telegram actions - using telegram config endpoint
      await axios.put(`${API}/api/v1/admin/telegram`, { inline_actions: [actionForm] }, config);
      fetchData();
      setShowActionModal(false);
      setEditingItem(null);
      resetActionForm();
    } catch (error) {
      console.error('Failed to save action:', error);
      alert('Failed to save action');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveConnector = async () => {
    setProcessing(true);
    try {
      // API connectors - using webhooks endpoint for now
      await axios.post(`${API}/api/v1/admin/system/webhooks`, {
        name: connectorForm.name,
        url: connectorForm.endpoint,
        events: [connectorForm.type],
        enabled: connectorForm.enabled
      }, config);
      fetchData();
      setShowConnectorModal(false);
      setEditingItem(null);
      resetConnectorForm();
    } catch (error) {
      console.error('Failed to save connector:', error);
      alert('Failed to save API connector');
    } finally {
      setProcessing(false);
    }
  };

  const handleTransactionAction = async (txId, action, extraData = {}) => {
    setProcessing(true);
    try {
      await axios.post(`${API}/api/v1/admin/approvals/${txId}/action`, {
        action,
        ...extraData
      }, config);
      fetchData();
      setShowTransactionModal(false);
      setSelectedTransaction(null);
    } catch (error) {
      console.error('Failed to process transaction:', error);
      alert('Failed to process transaction');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteItem = async (type, id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    setProcessing(true);
    try {
      // Map to correct endpoints
      const endpoints = {
        'order-states': `/api/v1/admin/system`,
        'telegram-actions': `/api/v1/admin/telegram`,
        'api-connectors': `/api/v1/admin/system/webhooks/${id}`
      };
      await axios.delete(`${API}${endpoints[type] || `/api/v1/admin/${type}/${id}`}`, config);
      fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete item');
    } finally {
      setProcessing(false);
    }
  };

  const resetOrderStateForm = () => {
    setOrderStateForm({ name: '', display_name: '', color: '#10b981', telegram_button_text: '', auto_action: 'none' });
  };

  const resetActionForm = () => {
    setActionForm({ name: '', button_text: '', action_type: 'confirm', target_state: '', requires_input: false });
  };

  const resetConnectorForm = () => {
    setConnectorForm({ name: '', type: 'load', endpoint: '', method: 'POST', auth_type: 'bearer', api_key: '', enabled: true });
  };

  const filteredTransactions = transactions.filter(tx => {
    if (txFilter.status && tx.status !== txFilter.status) return false;
    if (txFilter.type && tx.type !== txFilter.type) return false;
    if (txFilter.search) {
      const search = txFilter.search.toLowerCase();
      return tx.client_name?.toLowerCase().includes(search) ||
             tx.transaction_id?.toLowerCase().includes(search);
    }
    return true;
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'transactions', label: 'Transactions', icon: DollarSign },
    { id: 'api', label: 'API & Connectors', icon: Link },
    { id: 'telegram', label: 'Telegram', icon: Send },
    { id: 'states', label: 'Order States', icon: List },
    { id: 'docs', label: 'Documentation', icon: BookOpen }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="operations-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Operations Center</h1>
          <p className="text-gray-400">Manage API, payments, Telegram integration, and system settings</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-4">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium ${
                activeTab === tab.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Feature Toggles */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Power className="w-5 h-5 text-emerald-400" />
              System Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(featureToggles).map(([key, value]) => (
                <FeatureToggle
                  key={key}
                  name={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  enabled={value}
                  onChange={(v) => handleToggleFeature(key, v)}
                  processing={processing}
                />
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={DollarSign}
              label="Pending Transactions"
              value={stats?.pending_orders || 0}
              color="blue"
            />
            <StatCard
              icon={ArrowDownCircle}
              label="Pending Loads"
              value={stats?.pending_loads || 0}
              color="emerald"
            />
            <StatCard
              icon={ArrowUpCircle}
              label="Pending Withdrawals"
              value={stats?.pending_withdrawals || 0}
              color="orange"
            />
            <StatCard
              icon={Send}
              label="Telegram Status"
              value={featureToggles.telegram_forwarding ? 'Active' : 'Inactive'}
              color={featureToggles.telegram_forwarding ? 'emerald' : 'red'}
            />
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={txFilter.search}
                onChange={(e) => setTxFilter(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <select
              value={txFilter.status}
              onChange={(e) => setTxFilter(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={txFilter.type}
              onChange={(e) => setTxFilter(prev => ({ ...prev, type: e.target.value }))}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Types</option>
              <option value="IN">Load / Cash-In</option>
              <option value="OUT">Withdraw / Cash-Out</option>
            </select>
          </div>

          {/* Transactions List */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">All Transactions</h2>
              <p className="text-gray-400 text-sm">View, verify, and manage all payment transactions</p>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No transactions found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {filteredTransactions.map(tx => (
                  <TransactionRow
                    key={tx.transaction_id}
                    transaction={tx}
                    onView={() => {
                      setSelectedTransaction(tx);
                      setShowTransactionModal(true);
                    }}
                    onConfirm={() => handleTransactionAction(tx.transaction_id, 'confirm')}
                    onReject={() => handleTransactionAction(tx.transaction_id, 'reject')}
                    processing={processing}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* API & Connectors Tab */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          {/* API Documentation Quick Links */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              API Documentation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href={`${API}/docs`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
              >
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-white font-medium">Swagger UI</div>
                  <div className="text-gray-400 text-sm">Interactive API Explorer</div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-500 ml-auto" />
              </a>
              <a
                href={`${API}/redoc`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
              >
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-white font-medium">ReDoc</div>
                  <div className="text-gray-400 text-sm">API Reference</div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-500 ml-auto" />
              </a>
              <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Terminal className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-white font-medium">API v1 Base</div>
                  <div className="text-gray-400 text-sm font-mono text-xs">/api/v1</div>
                </div>
              </div>
            </div>
          </div>

          {/* Games API Connectors */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-purple-400" />
                  Games API Connectors
                </h2>
                <p className="text-gray-400 text-sm">Configure external APIs for Load and Withdraw operations</p>
              </div>
              <button
                onClick={() => {
                  setEditingItem(null);
                  resetConnectorForm();
                  setShowConnectorModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Add Connector
              </button>
            </div>

            {apiConnectors.length === 0 ? (
              <div className="text-center py-12">
                <Link className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No API connectors configured</p>
                <p className="text-gray-500 text-sm">Add connectors to enable automated Load/Withdraw operations</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {apiConnectors.map(connector => (
                  <ConnectorRow
                    key={connector.id}
                    connector={connector}
                    onEdit={() => {
                      setEditingItem(connector);
                      setConnectorForm(connector);
                      setShowConnectorModal(true);
                    }}
                    onDelete={() => handleDeleteItem('api-connectors', connector.id)}
                    onToggle={(enabled) => handleToggleFeature(`connector_${connector.id}`, enabled)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Telegram Tab - REDIRECTS TO NEW MULTI-BOT SYSTEM */}
      {activeTab === 'telegram' && (
        <div className="space-y-6">
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bot className="w-8 h-8 text-blue-400" />
              <div>
                <h2 className="text-xl font-bold text-white">Telegram Configuration Moved</h2>
                <p className="text-blue-300">
                  Telegram bot management has been upgraded to a multi-bot system with per-event permissions.
                </p>
              </div>
            </div>
            
            <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
              <h3 className="text-white font-medium mb-2">New Features:</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Multiple Telegram bots support</li>
                <li>• Per-bot event permissions (toggle which events each bot receives)</li>
                <li>• Reviewer bots can approve/reject/edit payments directly in Telegram</li>
                <li>• Notification-only bots for alerts</li>
                <li>• Secure webhook (no bot token in URL)</li>
              </ul>
            </div>
            
            <a
              href="/admin/system/telegram-bots"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition"
            >
              <ExternalLink className="w-4 h-4" />
              Go to Telegram Bots Management
            </a>
          </div>
        </div>
      )}
                  setEditingItem(null);
                  resetActionForm();
      {/* Order States Tab */}
      {activeTab === 'states' && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <List className="w-5 h-5 text-purple-400" />
                  Order States
                </h2>
                <p className="text-gray-400 text-sm">Define custom order states and their behavior</p>
              </div>
              <button
                onClick={() => {
                  setEditingItem(null);
                  resetOrderStateForm();
                  setShowOrderStateModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Add State
              </button>
            </div>

            {/* Default States */}
            <div className="p-4 bg-gray-800/50">
              <p className="text-gray-400 text-sm mb-3">Default System States:</p>
              <div className="flex flex-wrap gap-2">
                {['pending', 'pending_confirmation', 'confirmed', 'rejected', 'completed'].map(state => (
                  <span key={state} className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
                    {state}
                  </span>
                ))}
              </div>
            </div>

            {orderStates.length === 0 ? (
              <div className="text-center py-12">
                <List className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No custom states configured</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {orderStates.map(state => (
                  <StateRow
                    key={state.id}
                    state={state}
                    onEdit={() => {
                      setEditingItem(state);
                      setOrderStateForm(state);
                      setShowOrderStateModal(true);
                    }}
                    onDelete={() => handleDeleteItem('order-states', state.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Documentation Tab */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              API Documentation
            </h2>
            <div className="prose prose-invert max-w-none">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ApiEndpointCard
                  method="POST"
                  endpoint="/api/v1/auth/signup"
                  description="Create new user account"
                />
                <ApiEndpointCard
                  method="POST"
                  endpoint="/api/v1/auth/magic-link/request"
                  description="Request magic link for login"
                />
                <ApiEndpointCard
                  method="GET"
                  endpoint="/api/v1/auth/magic-link/consume"
                  description="Consume magic link token"
                />
                <ApiEndpointCard
                  method="POST"
                  endpoint="/api/v1/referrals/validate"
                  description="Validate referral code"
                />
                <ApiEndpointCard
                  method="POST"
                  endpoint="/api/v1/orders/validate"
                  description="Validate order without creating"
                />
                <ApiEndpointCard
                  method="POST"
                  endpoint="/api/v1/orders/create"
                  description="Create new order with bonus"
                />
                <ApiEndpointCard
                  method="POST"
                  endpoint="/api/v1/webhooks/register"
                  description="Register webhook endpoint"
                />
                <ApiEndpointCard
                  method="GET"
                  endpoint="/api/v1/admin/perks"
                  description="List referral perks (Admin)"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Quick Start</h2>
            <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto">
              <pre>{`# Create a user
curl -X POST ${API}/api/v1/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{"username":"player1","password":"pass123","display_name":"Player One"}'

# Create an order
curl -X POST ${API}/api/v1/orders/create \\
  -H "Content-Type: application/json" \\
  -d '{"username":"player1","password":"pass123","game_name":"dragon_quest","recharge_amount":100}'`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showConnectorModal && (
        <Modal
          title={editingItem ? 'Edit API Connector' : 'Add API Connector'}
          onClose={() => { setShowConnectorModal(false); setEditingItem(null); }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Name</label>
              <input
                type="text"
                value={connectorForm.name}
                onChange={(e) => setConnectorForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Game API"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Type</label>
              <select
                value={connectorForm.type}
                onChange={(e) => setConnectorForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="load">Load / Cash-In</option>
                <option value="withdraw">Withdraw / Cash-Out</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Endpoint URL</label>
              <input
                type="text"
                value={connectorForm.endpoint}
                onChange={(e) => setConnectorForm(prev => ({ ...prev, endpoint: e.target.value }))}
                placeholder="https://api.game.com/v1/transactions"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Method</label>
                <select
                  value={connectorForm.method}
                  onChange={(e) => setConnectorForm(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                  <option value="PUT">PUT</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Auth Type</label>
                <select
                  value={connectorForm.auth_type}
                  onChange={(e) => setConnectorForm(prev => ({ ...prev, auth_type: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="bearer">Bearer Token</option>
                  <option value="api_key">API Key</option>
                  <option value="basic">Basic Auth</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">API Key / Token</label>
              <input
                type="password"
                value={connectorForm.api_key}
                onChange={(e) => setConnectorForm(prev => ({ ...prev, api_key: e.target.value }))}
                placeholder="sk_live_..."
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="connector_enabled"
                checked={connectorForm.enabled}
                onChange={(e) => setConnectorForm(prev => ({ ...prev, enabled: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800"
              />
              <label htmlFor="connector_enabled" className="text-gray-300">Enabled</label>
            </div>
          </div>
          <div className="mt-6 flex gap-3 justify-end">
            <button
              onClick={() => { setShowConnectorModal(false); setEditingItem(null); }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveConnector}
              disabled={processing}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg transition"
            >
              {processing ? 'Saving...' : 'Save Connector'}
            </button>
          </div>
        </Modal>
      )}

      {showActionModal && (
        <Modal
          title={editingItem ? 'Edit Telegram Action' : 'Add Telegram Action'}
          onClose={() => { setShowActionModal(false); setEditingItem(null); }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Action Name</label>
              <input
                type="text"
                value={actionForm.name}
                onChange={(e) => setActionForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="approve_payment"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Button Text</label>
              <input
                type="text"
                value={actionForm.button_text}
                onChange={(e) => setActionForm(prev => ({ ...prev, button_text: e.target.value }))}
                placeholder="✅ Approve"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Action Type</label>
              <select
                value={actionForm.action_type}
                onChange={(e) => setActionForm(prev => ({ ...prev, action_type: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="confirm">Confirm Order</option>
                <option value="reject">Reject Order</option>
                <option value="change_state">Change State</option>
                <option value="request_info">Request Info</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Target State (if applicable)</label>
              <input
                type="text"
                value={actionForm.target_state}
                onChange={(e) => setActionForm(prev => ({ ...prev, target_state: e.target.value }))}
                placeholder="confirmed"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requires_input"
                checked={actionForm.requires_input}
                onChange={(e) => setActionForm(prev => ({ ...prev, requires_input: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800"
              />
              <label htmlFor="requires_input" className="text-gray-300">Requires Input (e.g., reason)</label>
            </div>
          </div>
          <div className="mt-6 flex gap-3 justify-end">
            <button
              onClick={() => { setShowActionModal(false); setEditingItem(null); }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAction}
              disabled={processing}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-black rounded-lg transition"
            >
              {processing ? 'Saving...' : 'Save Action'}
            </button>
          </div>
        </Modal>
      )}

      {showOrderStateModal && (
        <Modal
          title={editingItem ? 'Edit Order State' : 'Add Order State'}
          onClose={() => { setShowOrderStateModal(false); setEditingItem(null); }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">State Name (snake_case)</label>
              <input
                type="text"
                value={orderStateForm.name}
                onChange={(e) => setOrderStateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="pending_review"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Display Name</label>
              <input
                type="text"
                value={orderStateForm.display_name}
                onChange={(e) => setOrderStateForm(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="Pending Review"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Color</label>
              <input
                type="color"
                value={orderStateForm.color}
                onChange={(e) => setOrderStateForm(prev => ({ ...prev, color: e.target.value }))}
                className="w-full h-10 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Telegram Button Text</label>
              <input
                type="text"
                value={orderStateForm.telegram_button_text}
                onChange={(e) => setOrderStateForm(prev => ({ ...prev, telegram_button_text: e.target.value }))}
                placeholder="📋 Review"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Auto Action</label>
              <select
                value={orderStateForm.auto_action}
                onChange={(e) => setOrderStateForm(prev => ({ ...prev, auto_action: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="none">None</option>
                <option value="notify_telegram">Notify Telegram</option>
                <option value="call_api">Call API Connector</option>
                <option value="send_webhook">Send Webhook</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex gap-3 justify-end">
            <button
              onClick={() => { setShowOrderStateModal(false); setEditingItem(null); }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveOrderState}
              disabled={processing}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg transition"
            >
              {processing ? 'Saving...' : 'Save State'}
            </button>
          </div>
        </Modal>
      )}

      {showTransactionModal && selectedTransaction && (
        <Modal
          title="Transaction Details"
          onClose={() => { setShowTransactionModal(false); setSelectedTransaction(null); }}
        >
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <DetailRow label="Transaction ID" value={selectedTransaction.transaction_id} mono />
              <DetailRow label="Client" value={selectedTransaction.client_name} />
              <DetailRow label="Type" value={selectedTransaction.type === 'IN' ? 'Load / Cash-In' : 'Withdraw / Cash-Out'} />
              <DetailRow label="Amount" value={`$${selectedTransaction.amount?.toFixed(2)}`} highlight />
              <DetailRow label="Status" value={selectedTransaction.status} />
              <DetailRow label="Created" value={new Date(selectedTransaction.created_at).toLocaleString()} />
            </div>

            {selectedTransaction.status === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleTransactionAction(selectedTransaction.transaction_id, 'confirm')}
                  disabled={processing}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Confirm
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Enter rejection reason:');
                    if (reason) handleTransactionAction(selectedTransaction.transaction_id, 'reject', { reason });
                  }}
                  disabled={processing}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Reject
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

// Helper Components
const FeatureToggle = ({ name, enabled, onChange, processing }) => (
  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
    <span className="text-gray-300 text-sm">{name}</span>
    <button
      onClick={() => onChange(!enabled)}
      disabled={processing}
      className={`relative w-12 h-6 rounded-full transition ${enabled ? 'bg-emerald-500' : 'bg-gray-600'}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'left-7' : 'left-1'}`} />
    </button>
  </div>
);

const ForwardingToggle = ({ label, description, enabled, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
    <div>
      <div className="text-white font-medium">{label}</div>
      <div className="text-gray-400 text-sm">{description}</div>
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-14 h-7 rounded-full transition ${enabled ? 'bg-emerald-500' : 'bg-gray-600'}`}
    >
      <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${enabled ? 'left-8' : 'left-1'}`} />
    </button>
  </div>
);

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: 'bg-blue-500/20 text-blue-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    orange: 'bg-orange-500/20 text-orange-400',
    red: 'bg-red-500/20 text-red-400',
    purple: 'bg-purple-500/20 text-purple-400'
  };
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
};

const TransactionRow = ({ transaction, onView, onConfirm, onReject, processing }) => (
  <div className="p-4 hover:bg-gray-800/50 transition">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          transaction.type === 'IN' ? 'bg-emerald-500/20' : 'bg-orange-500/20'
        }`}>
          {transaction.type === 'IN' ? (
            <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
          ) : (
            <ArrowUpCircle className="w-5 h-5 text-orange-400" />
          )}
        </div>
        <div>
          <div className="text-white font-medium">{transaction.client_name || 'Unknown'}</div>
          <div className="text-gray-400 text-sm">
            {transaction.type === 'IN' ? 'Load' : 'Withdraw'} • {new Date(transaction.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className={`text-lg font-bold ${transaction.type === 'IN' ? 'text-emerald-400' : 'text-orange-400'}`}>
            {transaction.type === 'IN' ? '+' : '-'}${transaction.amount?.toFixed(2)}
          </div>
          <StatusBadge status={transaction.status} />
        </div>
        <div className="flex gap-2">
          {transaction.status === 'pending' && (
            <>
              <button
                onClick={onConfirm}
                disabled={processing}
                className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition"
                title="Confirm"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={onReject}
                disabled={processing}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
                title="Reject"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={onView}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    confirmed: 'bg-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/20 text-red-400'
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${styles[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {status}
    </span>
  );
};

const ConnectorRow = ({ connector, onEdit, onDelete, onToggle }) => (
  <div className="p-4 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        connector.enabled ? 'bg-emerald-500/20' : 'bg-gray-700'
      }`}>
        <Link className={`w-5 h-5 ${connector.enabled ? 'text-emerald-400' : 'text-gray-500'}`} />
      </div>
      <div>
        <div className="text-white font-medium">{connector.name}</div>
        <div className="text-gray-400 text-sm">
          {connector.type} • {connector.method} • {connector.endpoint?.substring(0, 40)}...
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <button
        onClick={() => onToggle(!connector.enabled)}
        className={`px-3 py-1 rounded-full text-sm ${connector.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'}`}
      >
        {connector.enabled ? 'Active' : 'Inactive'}
      </button>
      <button onClick={onEdit} className="p-2 hover:bg-gray-700 text-gray-400 rounded-lg transition">
        <Edit3 className="w-4 h-4" />
      </button>
      <button onClick={onDelete} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const ActionRow = ({ action, onEdit, onDelete }) => (
  <div className="p-4 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
        <Zap className="w-5 h-5 text-yellow-400" />
      </div>
      <div>
        <div className="text-white font-medium">{action.button_text}</div>
        <div className="text-gray-400 text-sm">
          {action.name} → {action.action_type} {action.target_state && `→ ${action.target_state}`}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button onClick={onEdit} className="p-2 hover:bg-gray-700 text-gray-400 rounded-lg transition">
        <Edit3 className="w-4 h-4" />
      </button>
      <button onClick={onDelete} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const StateRow = ({ state, onEdit, onDelete }) => (
  <div className="p-4 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${state.color}20` }}
      >
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: state.color }} />
      </div>
      <div>
        <div className="text-white font-medium">{state.display_name}</div>
        <div className="text-gray-400 text-sm font-mono">{state.name}</div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {state.telegram_button_text && (
        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
          {state.telegram_button_text}
        </span>
      )}
      <button onClick={onEdit} className="p-2 hover:bg-gray-700 text-gray-400 rounded-lg transition">
        <Edit3 className="w-4 h-4" />
      </button>
      <button onClick={onDelete} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const ApiEndpointCard = ({ method, endpoint, description }) => {
  const methodColors = {
    GET: 'bg-blue-500',
    POST: 'bg-emerald-500',
    PUT: 'bg-yellow-500',
    DELETE: 'bg-red-500'
  };
  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className={`px-2 py-0.5 ${methodColors[method]} text-white text-xs font-bold rounded`}>
          {method}
        </span>
        <code className="text-gray-300 text-sm">{endpoint}</code>
      </div>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const DetailRow = ({ label, value, mono, highlight }) => (
  <div className="flex justify-between">
    <span className="text-gray-400">{label}</span>
    <span className={`${mono ? 'font-mono text-sm' : ''} ${highlight ? 'text-emerald-400 font-bold' : 'text-white'}`}>
      {value}
    </span>
  </div>
);

export default AdminOperationsPanel;
