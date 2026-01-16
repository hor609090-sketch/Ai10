import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import BottomNav from '../../components/BottomNav';
import { ArrowLeft, Wallet, CreditCard, Gift, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PortalWallets = () => {
  const navigate = useNavigate();
  const { portalToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await axios.get(`${API}/portal/wallets`, {
        headers: { 'X-Portal-Token': portalToken }
      });
      setWallet(response.data);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/portal')}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-400" />
            </button>
            <h1 className="text-xl font-bold text-white">My Wallets</h1>
            <div className="w-10"></div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Cash Wallet Card */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white/80 text-sm font-medium">Cash Balance</h3>
                <p className="text-xs text-white/60">Withdrawable funds</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-white mb-4">
              ${(wallet?.real_balance || 0).toFixed(2)}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center gap-1 text-emerald-300 text-xs mb-1">
                  <ArrowDownRight className="w-3 h-3" />
                  Total Deposited
                </div>
                <p className="text-white font-semibold">${(wallet?.total_in || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center gap-1 text-red-300 text-xs mb-1">
                  <ArrowUpRight className="w-3 h-3" />
                  Total Withdrawn
                </div>
                <p className="text-white font-semibold">${(wallet?.total_out || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Play Credits Card */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white/80 text-sm font-medium">Play Credits</h3>
                <p className="text-xs text-white/60">Non-withdrawable • Use in games</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-white mb-4">
              ${(wallet?.bonus_balance || 0).toFixed(2)}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center gap-1 text-purple-300 text-xs mb-1">
                  <Gift className="w-3 h-3" />
                  Total Earned
                </div>
                <p className="text-white font-semibold">${(wallet?.total_bonus_earned || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center gap-1 text-pink-300 text-xs mb-1">
                  <CreditCard className="w-3 h-3" />
                  Total Used
                </div>
                <p className="text-white font-semibold">${(wallet?.total_bonus_loaded || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3">Additional Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Cash Used for Games</span>
                <span className="text-white font-medium">${(wallet?.total_real_loaded || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Referral Earnings</span>
                <span className="text-emerald-400 font-medium">${(wallet?.referral_earnings || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Pending Deposits</span>
                <span className="text-yellow-400 font-medium">${(wallet?.pending_in || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-400">Pending Withdrawals</span>
                <span className="text-yellow-400 font-medium">${(wallet?.pending_out || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <button
            onClick={() => navigate('/portal/load-game')}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            Load to Game
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default PortalWallets;
