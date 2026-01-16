import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/ui/card';
import { 
  CheckSquare, 
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Users,
  AlertTriangle,
  Star,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Ban,
  Shield,
  Zap
} from 'lucide-react';
import RiskSnapshotCards from '../../components/analytics/RiskSnapshotCards';
import PlatformTrendChart from '../../components/analytics/PlatformTrendChart';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * ADMIN DASHBOARD - REDESIGNED WITH ANALYTICS
 * Focus: Action Required → Money Flow → Platform Trend → Risk & Exposure → Growth
 * Layered analytics approach
 */

const AdminDashboard = () => {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [dashRes, refRes] = await Promise.all([
        fetch(`${API}/api/v1/admin/dashboard`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/v1/admin/referrals/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (dashRes.ok) setData(await dashRes.json());
      if (refRes.ok) setReferralData(await refRes.json());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-3" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const pendingCount = data?.pending_approvals?.total || 0;
  const topReferrer = referralData?.top_referrers?.[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto" data-testid="admin-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-500 mt-1">Your command center</p>
        </div>
        <button 
          onClick={fetchData}
          className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 hover:text-white transition-all"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* ============ SECTION 1: ACTION REQUIRED ============ */}
      {pendingCount > 0 && (
        <Link to="/admin/approvals" className="block group">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border border-amber-500/30 p-6 hover:border-amber-500/50 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center">
                  <CheckSquare className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <p className="text-amber-400 font-bold text-xl">{pendingCount} Pending Approval{pendingCount > 1 ? 's' : ''}</p>
                  <p className="text-amber-400/70 text-sm">
                    {data?.pending_approvals?.deposits || 0} deposits · {data?.pending_approvals?.withdrawals || 0} withdrawals
                  </p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      )}

      {/* ============ SECTION 2: TODAY'S MONEY FLOW ============ */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-emerald-400" />
          Today's Money Flow
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {/* Deposits In */}
          <Link to="/admin/orders?type=deposit" className="group">
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40 transition-all h-full">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-emerald-400/80 text-sm font-medium">Deposits In</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-3xl font-bold text-emerald-400">
                  ${data?.today?.deposits_in?.toFixed(2) || '0.00'}
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Withdrawals Out */}
          <Link to="/admin/orders?type=withdrawal" className="group">
            <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20 hover:border-red-500/40 transition-all h-full">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-red-400/80 text-sm font-medium">Withdrawals Out</span>
                  <ArrowDownRight className="w-4 h-4 text-red-400" />
                </div>
                <p className="text-3xl font-bold text-red-400">
                  ${data?.today?.withdrawals_out?.toFixed(2) || '0.00'}
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Net Profit */}
          <Link to="/admin/reports" className="group">
            <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/5 border-blue-500/20 hover:border-blue-500/40 transition-all h-full">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-blue-400/80 text-sm font-medium">Net Profit</span>
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                </div>
                <p className={`text-3xl font-bold ${(data?.net_profit || 0) >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                  ${data?.net_profit?.toFixed(2) || '0.00'}
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* ============ SECTION 3: PLATFORM TREND CHART (NEW - Layer 2) ============ */}
      <PlatformTrendChart />

      {/* ============ SECTION 4: RISK & EXPOSURE SNAPSHOT (NEW - Layer 1) ============ */}
      <RiskSnapshotCards />

      {/* ============ SECTION 5: REFERRAL PROGRAM TRACKING ============ */}
      <Link to="/admin/referrals" className="block group">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900/40 via-purple-800/30 to-purple-900/40 border border-purple-700/30 p-6 hover:border-purple-600/50 transition-all">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-purple-300 text-sm font-medium">Referral Program</p>
                  <p className="text-white font-bold text-xl">Growth Tracking</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-5">
              <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-purple-300/70 text-xs mb-1">Referred Users</p>
                <p className="text-white font-bold text-xl">{referralData?.stats?.total_referred_users || 0}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-purple-300/70 text-xs mb-1">Active Referrers</p>
                <p className="text-white font-bold text-xl">{referralData?.stats?.active_referrers || 0}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-purple-300/70 text-xs mb-1">Top Referrer</p>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <p className="text-white font-bold truncate">{topReferrer?.username || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/10">
              <p className="text-purple-300/80 text-sm">Manage referral program</p>
              <ChevronRight className="w-5 h-5 text-purple-300 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </Link>

      {/* ============ SECTION 6: GROWTH & RISK ============ */}
      <div className="grid grid-cols-2 gap-4">
        {/* Growth Snapshot */}
        <Link to="/admin/clients" className="group">
          <Card className="bg-gray-900/50 border-gray-800 hover:border-emerald-500/30 transition-all h-full">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Growth Snapshot</p>
                  <p className="text-white font-semibold">Active Clients</p>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-bold text-white">{data?.active_clients || 0}</p>
                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Risk Snapshot */}
        <Link to="/admin/reports?tab=voids" className="group">
          <Card className="bg-gray-900/50 border-gray-800 hover:border-orange-500/30 transition-all h-full">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Risk Snapshot</p>
                  <p className="text-white font-semibold">Voided Today</p>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-bold text-orange-400">${data?.today?.voided?.toFixed(2) || '0.00'}</p>
                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* System Status - Minimal */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900/30 rounded-xl border border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${data?.system_status?.kill_switch ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
          <span className="text-gray-400 text-sm">
            System: {data?.system_status?.kill_switch ? 'KILL SWITCH ACTIVE' : 'Operational'}
          </span>
        </div>
        <Link to="/admin/system" className="text-gray-500 hover:text-white text-sm transition-colors">
          Configure →
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
