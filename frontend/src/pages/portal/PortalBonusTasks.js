import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import BottomNav from '../../components/BottomNav';
import { ArrowLeft, Gift, Target, Check, Trophy, Users, ArrowRight, Sparkles, Crown } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PortalBonusTasks = () => {
  const navigate = useNavigate();
  const { portalToken, clientToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const getAuthHeaders = () => {
    if (clientToken) {
      return { Authorization: `Bearer ${clientToken}` };
    } else if (portalToken) {
      return { 'X-Portal-Token': portalToken };
    }
    return {};
  };

  useEffect(() => {
    fetchBonusTasks();
  }, []);

  const fetchBonusTasks = async () => {
    try {
      const response = await axios.get(`${API}/portal/bonus-tasks`, {
        headers: getAuthHeaders()
      });
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch bonus tasks:', error);
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

  const tasks = data?.tasks || [];
  const bonusHistory = data?.bonus_history || [];
  const bonusBalance = data?.wallet_bonus_balance || 0;

  // Primary task - GET 5 REFERRALS
  const primaryTask = {
    id: 'get-5-referrals',
    title: '🎯 GET 5 REFERRALS',
    description: 'Invite 5 friends and earn $5.00 bonus instantly!',
    progress: tasks[0]?.progress || 0,
    target: 5,
    reward_amount: 5.00,
    status: (tasks[0]?.progress || 0) >= 5 ? 'claimable' : 'in_progress'
  };

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
            <h1 className="text-xl font-bold text-white">Bonus Tasks</h1>
            <div className="w-10"></div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Bonus Wallet Summary */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white/80 text-sm">Bonus Wallet Balance</h3>
                <p className="text-3xl font-bold text-white">${bonusBalance.toFixed(2)}</p>
              </div>
            </div>
            <p className="text-white/60 text-xs">
              Bonus funds can be used to load games but cannot be withdrawn.
            </p>
          </div>

          {/* 🔥 MAIN HIGHLIGHT - EARN UP TO 30% */}
          <div
            onClick={() => navigate('/portal/referrals')}
            className="bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-red-500/20 border-2 border-amber-500/50 rounded-2xl p-5 cursor-pointer hover:border-amber-400 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-400/30 to-transparent rounded-bl-full"></div>
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-6 h-6 text-amber-400" />
              <span className="text-amber-400 font-bold text-lg">LIFETIME PASSIVE INCOME</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-2">
              EARN UP TO <span className="text-amber-400 text-3xl">30%</span>
            </h3>
            <p className="text-gray-300 text-sm mb-3">
              From ALL your referral deposits - <span className="text-amber-400 font-bold">FOREVER!</span>
            </p>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Build your network, earn while you sleep</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                Start Now <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* PRIMARY TASK - GET 5 REFERRALS */}
          <div className="bg-gray-900 border-2 border-emerald-500/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{primaryTask.title}</h3>
                <p className="text-gray-400 text-sm">{primaryTask.description}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">
                  <span className="text-emerald-400 font-bold text-xl">{primaryTask.progress}</span> / {primaryTask.target} referrals
                </span>
                <span className="text-emerald-400 font-bold text-lg">
                  +${primaryTask.reward_amount.toFixed(2)} BONUS
                </span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    primaryTask.progress >= primaryTask.target 
                      ? 'bg-emerald-500' 
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  }`}
                  style={{ width: `${Math.min(100, (primaryTask.progress / primaryTask.target) * 100)}%` }}
                ></div>
              </div>
            </div>

            {primaryTask.progress < primaryTask.target ? (
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-sm">
                  {primaryTask.target - primaryTask.progress} more referral{primaryTask.target - primaryTask.progress > 1 ? 's' : ''} needed
                </p>
                <button
                  onClick={() => navigate('/portal/referrals')}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Invite Friends
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 p-3 rounded-lg">
                <Check className="w-5 h-5" />
                <span className="font-medium">Congratulations! Bonus credited to your wallet!</span>
              </div>
            )}
          </div>

          {/* Additional Tasks */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Milestone Bonuses
            </h3>

            <div className="space-y-3">
              {/* Milestone 1 - 5 refs */}
              <div className={`p-3 rounded-lg border ${
                primaryTask.progress >= 5 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-gray-700 bg-black'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      primaryTask.progress >= 5 ? 'bg-emerald-500' : 'bg-gray-700'
                    }`}>
                      {primaryTask.progress >= 5 ? <Check className="w-4 h-4 text-white" /> : <span className="text-gray-400 text-sm">5</span>}
                    </div>
                    <div>
                      <p className="text-white font-medium">5 Referrals</p>
                      <p className="text-gray-500 text-xs">First milestone</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold">+$5.00</span>
                </div>
              </div>

              {/* Milestone 2 - 10 refs */}
              <div className={`p-3 rounded-lg border ${
                primaryTask.progress >= 10 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-gray-700 bg-black'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      primaryTask.progress >= 10 ? 'bg-emerald-500' : 'bg-gray-700'
                    }`}>
                      {primaryTask.progress >= 10 ? <Check className="w-4 h-4 text-white" /> : <span className="text-gray-400 text-sm">10</span>}
                    </div>
                    <div>
                      <p className="text-white font-medium">10 Referrals</p>
                      <p className="text-gray-500 text-xs">Unlock Tier 1</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold">+$2.00</span>
                </div>
              </div>

              {/* Milestone 3 - 25 refs */}
              <div className={`p-3 rounded-lg border ${
                primaryTask.progress >= 25 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-gray-700 bg-black'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      primaryTask.progress >= 25 ? 'bg-emerald-500' : 'bg-gray-700'
                    }`}>
                      {primaryTask.progress >= 25 ? <Check className="w-4 h-4 text-white" /> : <span className="text-gray-400 text-sm">25</span>}
                    </div>
                    <div>
                      <p className="text-white font-medium">25 Referrals</p>
                      <p className="text-gray-500 text-xs">Unlock Tier 2</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold">+$5.00</span>
                </div>
              </div>

              {/* Milestone 4 - 50 refs */}
              <div className={`p-3 rounded-lg border ${
                primaryTask.progress >= 50 ? 'border-amber-500/30 bg-amber-500/5' : 'border-gray-700 bg-black'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      primaryTask.progress >= 50 ? 'bg-amber-500' : 'bg-gray-700'
                    }`}>
                      {primaryTask.progress >= 50 ? <Crown className="w-4 h-4 text-white" /> : <span className="text-gray-400 text-sm">50</span>}
                    </div>
                    <div>
                      <p className="text-white font-medium">50 Referrals</p>
                      <p className="text-amber-400 text-xs">VIP Status + 30% Rate!</p>
                    </div>
                  </div>
                  <span className="text-amber-400 font-bold">+$10.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bonus History */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-400" />
              Bonus History
            </h3>

            {bonusHistory.length === 0 ? (
              <div className="text-center py-6">
                <Gift className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">No bonuses earned yet</p>
                <p className="text-gray-600 text-sm mt-1">Complete tasks to earn bonus rewards!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bonusHistory.map((bonus, idx) => (
                  <div
                    key={bonus.transaction_id || idx}
                    className="flex items-center justify-between p-3 bg-black border border-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Gift className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {bonus.reason || 'Referral Bonus'}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {new Date(bonus.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-purple-400 font-bold">+${bonus.amount?.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* How It Works */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              How Referral Bonuses Work
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-emerald-400 font-bold text-xs">1</span>
                </div>
                <p className="text-gray-400">Get <span className="text-emerald-400 font-bold">5 valid referrals</span> → Earn <span className="text-emerald-400 font-bold">$5.00</span> bonus</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-emerald-400 font-bold text-xs">2</span>
                </div>
                <p className="text-gray-400">Every <span className="text-emerald-400 font-bold">5 additional referrals</span> → Earn <span className="text-emerald-400 font-bold">$2.00</span> bonus</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-amber-500/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Crown className="w-3 h-3 text-amber-400" />
                </div>
                <p className="text-gray-400">Plus earn <span className="text-amber-400 font-bold">5-30% commission</span> on ALL their deposits!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default PortalBonusTasks;
