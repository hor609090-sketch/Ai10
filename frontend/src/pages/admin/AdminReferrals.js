import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  RefreshCw, 
  Share2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Sparkles, 
  Star, 
  Award,
  UserPlus,
  Gift,
  Crown
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * REFERRALS PAGE - REDESIGNED FOR GROWTH FOCUS
 * Highlighting 30% commission and visual attractiveness
 */

const AdminReferrals = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [ledger, setLedger] = useState([]);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, ledgerRes] = await Promise.all([
        fetch(`${API}/api/v1/admin/referrals/dashboard`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/v1/admin/referrals/ledger`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (dashRes.ok) setDashboard(await dashRes.json());
      if (ledgerRes.ok) {
        const data = await ledgerRes.json();
        setLedger(data.ledger || []);
      }
    } catch (err) {
      console.error('Failed to fetch referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const topReferrer = dashboard?.top_referrers?.[0];
  const totalCommission = dashboard?.stats?.total_commission_earned || 0;

  return (
    <div className="space-y-6" data-testid="referrals-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Share2 className="w-7 h-7 text-purple-400" />
            Referral Program
          </h1>
          <p className="text-gray-400 mt-1">Growth engine powered by referrals</p>
        </div>
        <button 
          onClick={fetchData} 
          className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 hover:text-white transition-all"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <UserPlus className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Referred</p>
                <p className="text-2xl font-bold text-white">{dashboard?.stats?.total_referred_users || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Active Referrers</p>
                <p className="text-2xl font-bold text-white">{dashboard?.stats?.active_referrers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Commission</p>
                <p className="text-2xl font-bold text-white">${totalCommission.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <TrendingUp className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Avg per Referrer</p>
                <p className="text-2xl font-bold text-white">
                  ${dashboard?.stats?.active_referrers > 0 
                    ? (totalCommission / dashboard.stats.active_referrers).toFixed(2) 
                    : '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performer Spotlight */}
      {topReferrer && (
        <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-gray-900">
                    <span className="text-gray-900 text-xs font-bold">1</span>
                  </div>
                </div>
                <div>
                  <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wide mb-1">Top Referrer</p>
                  <p className="text-white font-bold text-2xl">{topReferrer.username}</p>
                  <p className="text-gray-400 text-sm font-mono mt-1">Code: {topReferrer.referral_code}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm mb-1">Total Referrals</p>
                <p className="text-yellow-400 font-bold text-3xl">{topReferrer.referral_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="top" className="space-y-4">
        <TabsList className="bg-gray-900 border border-gray-800">
          <TabsTrigger value="top" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
            <Award className="w-4 h-4 mr-2" />
            Top Referrers
          </TabsTrigger>
          <TabsTrigger value="ledger" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
            <Gift className="w-4 h-4 mr-2" />
            Referral Ledger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="top">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.top_referrers?.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No referrers yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboard?.top_referrers?.map((r, i) => {
                    const isTop3 = i < 3;
                    const medalColors = [
                      'from-yellow-400 to-orange-500',
                      'from-gray-300 to-gray-400',
                      'from-amber-600 to-amber-700'
                    ];
                    return (
                      <div 
                        key={i} 
                        className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                          isTop3 
                            ? 'bg-gradient-to-r from-gray-800 to-gray-800/50 border border-gray-700' 
                            : 'bg-gray-800/50 hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          {isTop3 ? (
                            <div className={`w-10 h-10 bg-gradient-to-br ${medalColors[i]} rounded-full flex items-center justify-center shadow-lg`}>
                              <span className="text-white font-bold text-sm">{i + 1}</span>
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                              <span className="text-gray-400 font-mono text-sm">#{i + 1}</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-white font-semibold">{r.username}</p>
                            <p className="text-gray-500 text-sm font-mono">{r.referral_code}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-purple-400 font-bold text-lg">{r.referral_count}</p>
                            <p className="text-gray-500 text-xs">referrals</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg text-white">Complete Referral History</CardTitle>
            </CardHeader>
            <CardContent>
              {ledger.length === 0 ? (
                <div className="py-12 text-center">
                  <Gift className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No referral history yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left text-gray-400 text-xs py-3 px-4 font-semibold uppercase tracking-wide">User</th>
                        <th className="text-left text-gray-400 text-xs py-3 px-4 font-semibold uppercase tracking-wide">Referrer</th>
                        <th className="text-left text-gray-400 text-xs py-3 px-4 font-semibold uppercase tracking-wide">Code</th>
                        <th className="text-right text-gray-400 text-xs py-3 px-4 font-semibold uppercase tracking-wide">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((r, i) => (
                        <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4 text-white">{r.user}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Star className="w-3 h-3 text-purple-400" />
                              <span className="text-purple-400 font-medium">{r.referrer}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-gray-800 rounded text-gray-400 text-sm font-mono">
                              {r.referral_code}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-500 text-sm text-right">
                            {r.joined_at ? new Date(r.joined_at).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReferrals;
