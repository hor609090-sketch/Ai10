import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  Settings, Users, Gift, Shield, Save, RefreshCw, Plus, Trash2, 
  Edit2, X, AlertTriangle, Check, Percent, Target, Award, Lock,
  MessageCircle, Clock, UserCheck, DollarSign
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const AdminSettings = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  
  // Edit modals
  const [showTierModal, setShowTierModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showGreetingModal, setShowGreetingModal] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [editingGreeting, setEditingGreeting] = useState(null);

  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/api/v1/admin/settings`, config);
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGlobalSettings = async (updates) => {
    setSaving(true);
    try {
      await axios.put(`${API}/api/v1/admin/settings`, updates, config);
      await fetchSettings();
      alert('Settings saved successfully');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const saveTiers = async (tiers) => {
    setSaving(true);
    try {
      await axios.put(`${API}/api/v1/admin/settings`, { referral_tiers: tiers }, config);
      await fetchSettings();
      setShowTierModal(false);
      setEditingTier(null);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to save tiers');
    } finally {
      setSaving(false);
    }
  };

  const deleteTier = async (tierNumber) => {
    if (!window.confirm('Delete this tier?')) return;
    try {
      await axios.put(`${API}/api/v1/admin/settings`, { remove_tier: tierNumber }, config);
      await fetchSettings();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete tier');
    }
  };

  const saveMilestones = async (milestones) => {
    setSaving(true);
    try {
      await axios.put(`${API}/api/v1/admin/settings`, { bonus_milestones: milestones }, config);
      await fetchSettings();
      setShowMilestoneModal(false);
      setEditingMilestone(null);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to save milestones');
    } finally {
      setSaving(false);
    }
  };

  const saveAntifraud = async (updates) => {
    setSaving(true);
    try {
      await axios.put(`${API}/api/v1/admin/settings`, { anti_fraud: updates }, config);
      await fetchSettings();
      alert('Anti-fraud settings saved');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const saveActiveReferralCriteria = async (criteria) => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/settings/active-referral-criteria`, criteria, config);
      await fetchSettings();
      alert('Active referral criteria saved');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const saveGreetingSettings = async (greetingConfig) => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/settings/first-time-greeting`, greetingConfig, config);
      await fetchSettings();
      alert('Greeting settings saved');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const addGreetingMessage = async (message) => {
    try {
      await axios.post(`${API}/admin/settings/first-time-greeting/messages`, message, config);
      await fetchSettings();
      setShowGreetingModal(false);
      setEditingGreeting(null);
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to add message');
    }
  };

  const deleteGreetingMessage = async (order) => {
    if (!window.confirm('Delete this greeting message?')) return;
    try {
      await axios.delete(`${API}/admin/settings/first-time-greeting/messages/${order}`, config);
      await fetchSettings();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete');
    }
  };

  const resetToDefaults = async (section = 'all') => {
    if (!window.confirm(`Reset ${section} settings to defaults?`)) return;
    try {
      await axios.post(`${API}/admin/settings/reset-defaults?section=${section}`, {}, config);
      await fetchSettings();
      alert('Settings reset to defaults');
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to reset');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const tiers = settings?.referral_tier_config?.tiers || [];
  const milestones = settings?.bonus_rules?.milestones || [];
  const antifraud = settings?.anti_fraud || {};
  const activeRefCriteria = settings?.active_referral_criteria || {};
  const greetingConfig = settings?.first_time_greeting || {};

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'tiers', label: 'Commission Tiers', icon: Users },
    { id: 'milestones', label: 'Bonus Milestones', icon: Gift },
    { id: 'active-referral', label: 'Active Referral', icon: UserCheck },
    { id: 'greeting', label: 'First Message', icon: MessageCircle },
    { id: 'antifraud', label: 'Anti-Fraud', icon: Shield },
  ];

  return (
    <div className="space-y-6" data-testid="admin-settings">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
          <p className="text-gray-400 text-sm">Configure referral system, bonuses, and platform behavior</p>
        </div>
        <button
          onClick={() => resetToDefaults('all')}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reset All
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" />
              General Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <span className="text-white">Automation Enabled</span>
                  <input
                    type="checkbox"
                    checked={settings?.automation_enabled || false}
                    onChange={(e) => saveGlobalSettings({ automation_enabled: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <span className="text-white">Withdrawals Enabled</span>
                  <input
                    type="checkbox"
                    checked={settings?.withdrawals_enabled || false}
                    onChange={(e) => saveGlobalSettings({ withdrawals_enabled: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <span className="text-white">Bonus System Enabled</span>
                  <input
                    type="checkbox"
                    checked={settings?.bonus_system_enabled || false}
                    onChange={(e) => saveGlobalSettings({ bonus_system_enabled: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <span className="text-white">Referral System Enabled</span>
                  <input
                    type="checkbox"
                    checked={settings?.referral_system_enabled || false}
                    onChange={(e) => saveGlobalSettings({ referral_system_enabled: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <label className="text-white text-sm mb-2 block">Min Withdrawal Amount</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">$</span>
                    <input
                      type="number"
                      value={settings?.min_withdrawal_amount || 20}
                      onChange={(e) => saveGlobalSettings({ min_withdrawal_amount: parseFloat(e.target.value) })}
                      className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="p-4 bg-gray-800 rounded-lg">
                  <label className="text-white text-sm mb-2 block">Max Withdrawal Amount</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">$</span>
                    <input
                      type="number"
                      value={settings?.max_withdrawal_amount || 10000}
                      onChange={(e) => saveGlobalSettings({ max_withdrawal_amount: parseFloat(e.target.value) })}
                      className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TIERS TAB */}
        {activeTab === 'tiers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Commission Tiers (Up to 30%)
              </h2>
              <button
                onClick={() => {
                  setEditingTier(null);
                  setShowTierModal(true);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Tier
              </button>
            </div>

            <div className="space-y-3">
              {tiers.map((tier, idx) => (
                <div
                  key={tier.tier_number}
                  className={`p-4 rounded-lg border ${
                    idx === 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-gray-800 border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        tier.commission_percentage >= 25 ? 'bg-purple-500' :
                        tier.commission_percentage >= 20 ? 'bg-amber-500' :
                        tier.commission_percentage >= 15 ? 'bg-slate-400' :
                        tier.commission_percentage >= 10 ? 'bg-amber-600' :
                        'bg-gray-600'
                      }`}>
                        <span className="text-white font-bold">{tier.tier_number}</span>
                      </div>
                      <div>
                        <h4 className="text-white font-bold">{tier.name}</h4>
                        <p className="text-gray-400 text-sm">
                          {tier.min_referrals === 0 ? 'Base tier' : `${tier.min_referrals}+ active referrals`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-400">{tier.commission_percentage}%</p>
                        <p className="text-gray-500 text-xs">commission</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingTier(tier);
                            setShowTierModal(true);
                          }}
                          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4 text-gray-300" />
                        </button>
                        {tier.tier_number > 0 && (
                          <button
                            onClick={() => deleteTier(tier.tier_number)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MILESTONES TAB */}
        {activeTab === 'milestones' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-400" />
                Bonus Milestones
              </h2>
              <button
                onClick={() => {
                  setEditingMilestone(null);
                  setShowMilestoneModal(true);
                }}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Milestone
              </button>
            </div>

            <div className="space-y-3">
              {milestones.map((milestone) => (
                <div
                  key={milestone.milestone_number}
                  className="p-4 bg-gray-800 border border-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <Award className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold">{milestone.referrals_required} Referrals</h4>
                        <p className="text-gray-400 text-sm">{milestone.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-bold text-purple-400">+${milestone.bonus_amount.toFixed(2)}</p>
                        <p className="text-gray-500 text-xs">bonus</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingMilestone(milestone);
                            setShowMilestoneModal(true);
                          }}
                          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4 text-gray-300" />
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm('Delete this milestone?')) {
                              try {
                                await axios.delete(`${API}/admin/settings/bonus-milestones/${milestone.milestone_number}`, config);
                                await fetchSettings();
                              } catch (err) {
                                alert('Failed to delete');
                              }
                            }
                          }}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTIVE REFERRAL CRITERIA TAB */}
        {activeTab === 'active-referral' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                Active Referral Criteria
              </h2>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
              <p className="text-blue-300 text-sm">
                <strong>Active Referral Definition:</strong> A referral is considered "active" when they meet ALL of the criteria below.
                Only active referrals count towards commission tiers and bonus milestones.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-800 rounded-lg">
                <label className="text-white text-sm mb-2 block flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  Minimum Number of Deposits
                </label>
                <input
                  type="number"
                  min="1"
                  value={activeRefCriteria.min_deposits_required || 1}
                  onChange={(e) => saveActiveReferralCriteria({ min_deposits_required: parseInt(e.target.value) })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-gray-500 text-xs mt-1">Referral must make at least this many deposits</p>
              </div>

              <div className="p-4 bg-gray-800 rounded-lg">
                <label className="text-white text-sm mb-2 block flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Minimum Total Deposit Amount
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={activeRefCriteria.min_total_deposit_amount || 10}
                    onChange={(e) => saveActiveReferralCriteria({ min_total_deposit_amount: parseFloat(e.target.value) })}
                    className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-gray-500 text-xs mt-1">Total deposits must be at least this amount</p>
              </div>

              <div className="p-4 bg-gray-800 rounded-lg">
                <label className="text-white text-sm mb-2 block flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Activity Window (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={activeRefCriteria.activity_window_days || 30}
                  onChange={(e) => saveActiveReferralCriteria({ activity_window_days: parseInt(e.target.value) })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-gray-500 text-xs mt-1">Deposits must be within the last X days</p>
              </div>

              <div className="p-4 bg-gray-800 rounded-lg">
                <label className="flex items-center justify-between">
                  <span className="text-white text-sm flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    Require Recent Activity
                  </span>
                  <input
                    type="checkbox"
                    checked={activeRefCriteria.require_recent_activity || false}
                    onChange={(e) => saveActiveReferralCriteria({ require_recent_activity: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
                  />
                </label>
                <p className="text-gray-500 text-xs mt-2">If enabled, referral must have activity within the window</p>
              </div>
            </div>

            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <h4 className="text-emerald-400 font-bold mb-2">Current Criteria Summary:</h4>
              <p className="text-gray-300 text-sm">
                A referral is <span className="text-emerald-400 font-bold">ACTIVE</span> when they have made 
                <span className="text-white font-bold"> {activeRefCriteria.min_deposits_required || 1}+ deposit(s)</span>, 
                totaling at least <span className="text-white font-bold">${(activeRefCriteria.min_total_deposit_amount || 10).toFixed(2)}</span>, 
                within the last <span className="text-white font-bold">{activeRefCriteria.activity_window_days || 30} days</span>.
              </p>
            </div>
          </div>
        )}

        {/* FIRST-TIME GREETING TAB */}
        {activeTab === 'greeting' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-400" />
                First-Time Client Greeting
              </h2>
              <button
                onClick={() => {
                  setEditingGreeting(null);
                  setShowGreetingModal(true);
                }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Message
              </button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
              <p className="text-blue-300 text-sm">
                <strong>First Contact:</strong> These messages are sent when a new client messages your Messenger for the first time.
                Use this to greet them and ask for their referral code if they have one.
              </p>
            </div>

            {/* Enable/Disable */}
            <div className="p-4 bg-gray-800 rounded-lg">
              <label className="flex items-center justify-between">
                <span className="text-white font-medium">Enable First-Time Greeting</span>
                <input
                  type="checkbox"
                  checked={greetingConfig.enabled || false}
                  onChange={(e) => saveGreetingSettings({ enabled: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                />
              </label>
            </div>

            {/* Ask for Referral Code */}
            <div className="p-4 bg-gray-800 rounded-lg">
              <label className="flex items-center justify-between mb-3">
                <span className="text-white font-medium">Ask for Referral Code</span>
                <input
                  type="checkbox"
                  checked={greetingConfig.ask_referral_code || false}
                  onChange={(e) => saveGreetingSettings({ ask_referral_code: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                />
              </label>
              {greetingConfig.ask_referral_code && (
                <div className="mt-3">
                  <label className="text-gray-400 text-sm mb-2 block">Referral Code Prompt</label>
                  <input
                    type="text"
                    value={greetingConfig.referral_code_prompt || ''}
                    onChange={(e) => saveGreetingSettings({ referral_code_prompt: e.target.value })}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    placeholder="Please enter your referral code, or type 'SKIP'..."
                  />
                </div>
              )}
            </div>

            {/* Messages List */}
            <div className="space-y-3">
              <h3 className="text-white font-medium">Greeting Messages (in order)</h3>
              {(greetingConfig.messages || []).length === 0 ? (
                <div className="text-center py-8 bg-gray-800 rounded-lg">
                  <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No greeting messages configured</p>
                  <p className="text-gray-500 text-sm">Add messages to greet first-time clients</p>
                </div>
              ) : (
                (greetingConfig.messages || []).map((msg, idx) => (
                  <div
                    key={msg.order}
                    className="p-4 bg-gray-800 border border-gray-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-400 font-bold text-sm">{msg.order}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white">{msg.message}</p>
                          <p className="text-gray-500 text-xs mt-1">
                            Delay: {msg.delay_seconds || 0}s after previous
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteGreetingMessage(msg.order)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ANTI-FRAUD TAB */}
        {activeTab === 'antifraud' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-400" />
              Anti-Fraud Settings
            </h2>

            <div className="p-4 bg-gray-800 rounded-lg">
              <label className="flex items-center justify-between">
                <span className="text-white font-medium">Enable Anti-Fraud Detection</span>
                <input
                  type="checkbox"
                  checked={antifraud.enabled || false}
                  onChange={(e) => saveAntifraud({ enabled: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-600 text-red-500 focus:ring-red-500"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <label className="text-white text-sm mb-2 block">Max Referrals Per IP</label>
                <input
                  type="number"
                  value={antifraud.max_referrals_per_ip || 3}
                  onChange={(e) => saveAntifraud({ max_referrals_per_ip: parseInt(e.target.value) })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
                />
              </div>

              <div className="p-4 bg-gray-800 rounded-lg">
                <label className="text-white text-sm mb-2 block">IP Cooldown (Hours)</label>
                <input
                  type="number"
                  value={antifraud.ip_cooldown_hours || 24}
                  onChange={(e) => saveAntifraud({ ip_cooldown_hours: parseInt(e.target.value) })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
                />
              </div>

              <div className="p-4 bg-gray-800 rounded-lg">
                <label className="text-white text-sm mb-2 block">Min Deposit for Valid Referral</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">$</span>
                  <input
                    type="number"
                    value={antifraud.min_deposit_for_valid_referral || 10}
                    onChange={(e) => saveAntifraud({ min_deposit_for_valid_referral: parseFloat(e.target.value) })}
                    className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-800 rounded-lg">
                <label className="flex items-center justify-between">
                  <span className="text-white text-sm">Auto-Flag Suspicious</span>
                  <input
                    type="checkbox"
                    checked={antifraud.auto_flag_suspicious || false}
                    onChange={(e) => saveAntifraud({ auto_flag_suspicious: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 text-red-500"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TIER MODAL */}
      {showTierModal && (
        <TierModal
          tier={editingTier}
          existingTiers={tiers}
          onSave={async (tier) => {
            const newTiers = editingTier
              ? tiers.map(t => t.tier_number === editingTier.tier_number ? tier : t)
              : [...tiers, tier];
            await saveTiers(newTiers);
          }}
          onClose={() => {
            setShowTierModal(false);
            setEditingTier(null);
          }}
        />
      )}

      {/* MILESTONE MODAL */}
      {showMilestoneModal && (
        <MilestoneModal
          milestone={editingMilestone}
          existingMilestones={milestones}
          onSave={async (milestone) => {
            const newMilestones = editingMilestone
              ? milestones.map(m => m.milestone_number === editingMilestone.milestone_number ? milestone : m)
              : [...milestones, milestone];
            await saveMilestones(newMilestones);
          }}
          onClose={() => {
            setShowMilestoneModal(false);
            setEditingMilestone(null);
          }}
        />
      )}

      {/* GREETING MODAL */}
      {showGreetingModal && (
        <GreetingModal
          onSave={addGreetingMessage}
          onClose={() => {
            setShowGreetingModal(false);
            setEditingGreeting(null);
          }}
        />
      )}
    </div>
  );
};

// Tier Modal Component
const TierModal = ({ tier, existingTiers, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    tier_number: tier?.tier_number ?? existingTiers.length,
    name: tier?.name || '',
    min_referrals: tier?.min_referrals || 0,
    commission_percentage: tier?.commission_percentage || 5
  });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          {tier ? 'Edit Tier' : 'Add New Tier'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm block mb-1">Tier Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600"
              placeholder="e.g., Gold"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Min Active Referrals</label>
            <input
              type="number"
              value={formData.min_referrals}
              onChange={(e) => setFormData({...formData, min_referrals: parseInt(e.target.value)})}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Commission Percentage (%)</label>
            <input
              type="number"
              value={formData.commission_percentage}
              onChange={(e) => setFormData({...formData, commission_percentage: parseFloat(e.target.value)})}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600"
              max={30}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg">
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="flex-1 py-2 bg-emerald-500 text-white rounded-lg"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Milestone Modal Component
const MilestoneModal = ({ milestone, existingMilestones, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    milestone_number: milestone?.milestone_number ?? existingMilestones.length + 1,
    referrals_required: milestone?.referrals_required || 5,
    bonus_amount: milestone?.bonus_amount || 5,
    bonus_type: milestone?.bonus_type || 'bonus',
    description: milestone?.description || ''
  });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          {milestone ? 'Edit Milestone' : 'Add Milestone'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm block mb-1">Referrals Required</label>
            <input
              type="number"
              value={formData.referrals_required}
              onChange={(e) => setFormData({...formData, referrals_required: parseInt(e.target.value)})}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Bonus Amount ($)</label>
            <input
              type="number"
              step="0.01"
              value={formData.bonus_amount}
              onChange={(e) => setFormData({...formData, bonus_amount: parseFloat(e.target.value)})}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600"
              placeholder="e.g., First milestone bonus"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg">
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="flex-1 py-2 bg-purple-500 text-white rounded-lg"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Greeting Modal Component
const GreetingModal = ({ onSave, onClose }) => {
  const [formData, setFormData] = useState({
    message: '',
    delay_seconds: 1
  });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Add Greeting Message</h3>
        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm block mb-1">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600 h-24"
              placeholder="Enter your greeting message..."
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Delay After Previous (seconds)</label>
            <input
              type="number"
              min="0"
              value={formData.delay_seconds}
              onChange={(e) => setFormData({...formData, delay_seconds: parseInt(e.target.value)})}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg">
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={!formData.message.trim()}
            className="flex-1 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
          >
            Add Message
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
