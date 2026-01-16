import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../utils/api';
import axios from 'axios';
import { 
  Plus, Edit2, Trash2, Search, Gift, Users, 
  TrendingUp, DollarSign, Gamepad2, RefreshCw,
  CheckCircle, XCircle, Clock, Percent, AlertTriangle
} from 'lucide-react';

export default function AdminPerksPage() {
  const { token } = useAuth();
  const [perks, setPerks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPerk, setSelectedPerk] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    referral_code: '',
    game_name: '',
    percent_bonus: 5,
    flat_bonus: 0,
    max_bonus: '',
    min_amount: '',
    valid_until: '',
    max_uses: '',
    is_active: true
  });

  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchData = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      // Use existing perks endpoint
      const response = await axios.get(`${API_BASE}/api/v1/admin/perks`, config);
      setPerks(response.data.perks || response.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch perks:', err);
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreatePerk = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await axios.post(`${API_BASE}/api/v1/admin/perks`, formData, config);
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create perk');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdatePerk = async (e) => {
    e.preventDefault();
    if (!selectedPerk) return;
    
    setProcessing(true);
    try {
      await axios.put(`${API_BASE}/api/v1/admin/perks/${selectedPerk.perk_id || selectedPerk.id}`, formData, config);
      setShowEditModal(false);
      setSelectedPerk(null);
      resetForm();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update perk');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeletePerk = async (perkId) => {
    if (!window.confirm('Are you sure you want to delete this perk?')) return;
    
    try {
      await axios.delete(`${API_BASE}/api/v1/admin/perks/${perkId}`, config);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete perk');
    }
  };

  const resetForm = () => {
    setFormData({
      referral_code: '',
      game_name: '',
      percent_bonus: 5,
      flat_bonus: 0,
      max_bonus: '',
      min_amount: '',
      valid_until: '',
      max_uses: '',
      is_active: true
    });
  };

  const openEditModal = (perk) => {
    setSelectedPerk(perk);
    setFormData({
      referral_code: perk.referral_code || '',
      game_name: perk.game_name || '',
      percent_bonus: perk.percent_bonus || 5,
      flat_bonus: perk.flat_bonus || 0,
      max_bonus: perk.max_bonus || '',
      min_amount: perk.min_amount || '',
      valid_until: perk.valid_until || '',
      max_uses: perk.max_uses || '',
      is_active: perk.is_active !== false
    });
    setShowEditModal(true);
  };

  const filteredPerks = perks.filter(perk => {
    const matchesSearch = !searchTerm || 
      (perk.referral_code?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (perk.game_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterActive === null || perk.is_active === filterActive;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-perks-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Gift className="w-7 h-7 text-purple-400" />
            Perks & Bonuses
          </h1>
          <p className="text-gray-400">Manage referral perks and bonus configurations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Add Perk
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="text-red-400 font-bold">Error Loading Data</h3>
              <p className="text-red-300/80 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search perks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterActive(null)}
            className={`px-4 py-2 rounded-lg transition ${
              filterActive === null ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-800 text-gray-400'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterActive(true)}
            className={`px-4 py-2 rounded-lg transition ${
              filterActive === true ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterActive(false)}
            className={`px-4 py-2 rounded-lg transition ${
              filterActive === false ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-400'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Perks List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {filteredPerks.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No perks found</p>
            <p className="text-gray-500 text-sm">Create a perk to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filteredPerks.map(perk => (
              <div key={perk.perk_id || perk.id} className="p-4 hover:bg-gray-800/50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      perk.is_active ? 'bg-purple-500/20' : 'bg-gray-700'
                    }`}>
                      <Percent className={`w-6 h-6 ${perk.is_active ? 'text-purple-400' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{perk.referral_code || 'N/A'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          perk.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {perk.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-gray-400 text-sm">
                        {perk.game_name || 'All Games'} • {perk.percent_bonus}% bonus
                        {perk.flat_bonus > 0 && ` + ₱${perk.flat_bonus}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(perk)}
                      className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePerk(perk.perk_id || perk.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <PerkModal
          title="Create Perk"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreatePerk}
          onClose={() => setShowCreateModal(false)}
          processing={processing}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <PerkModal
          title="Edit Perk"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleUpdatePerk}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPerk(null);
          }}
          processing={processing}
        />
      )}
    </div>
  );
}

// Perk Modal Component
function PerkModal({ title, formData, setFormData, onSubmit, onClose, processing }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg mx-4">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Referral Code</label>
            <input
              type="text"
              value={formData.referral_code}
              onChange={(e) => setFormData(prev => ({ ...prev, referral_code: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="BONUS2024"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Game Name (Optional)</label>
            <input
              type="text"
              value={formData.game_name}
              onChange={(e) => setFormData(prev => ({ ...prev, game_name: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="Leave empty for all games"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Percent Bonus (%)</label>
              <input
                type="number"
                value={formData.percent_bonus}
                onChange={(e) => setFormData(prev => ({ ...prev, percent_bonus: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Flat Bonus (₱)</label>
              <input
                type="number"
                value={formData.flat_bonus}
                onChange={(e) => setFormData(prev => ({ ...prev, flat_bonus: parseFloat(e.target.value) || 0 }))}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                min="0"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-5 h-5 bg-gray-800 border-gray-700 rounded focus:ring-purple-500"
            />
            <label htmlFor="is_active" className="text-gray-300">Active</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg transition"
            >
              {processing ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
