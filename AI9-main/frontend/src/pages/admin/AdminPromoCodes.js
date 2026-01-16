import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { Gift, Plus, RefreshCw, Ban, Eye } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const AdminPromoCodes = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [codes, setCodes] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState({ code: '', credit_amount: '', max_redemptions: '' });
  const [creating, setCreating] = useState(false);
  const [selectedCode, setSelectedCode] = useState(null);
  const [redemptions, setRedemptions] = useState([]);

  useEffect(() => {
    fetchCodes();
  }, [token]);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/admin/promo-codes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCodes(data.promo_codes || []);
      }
    } catch (err) {
      console.error('Failed to fetch codes:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCode = async () => {
    if (!newCode.code || !newCode.credit_amount) {
      toast.error('Please fill in code and amount');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API}/api/v1/admin/promo-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          code: newCode.code,
          credit_amount: parseFloat(newCode.credit_amount),
          max_redemptions: newCode.max_redemptions ? parseInt(newCode.max_redemptions) : null
        })
      });
      if (res.ok) {
        toast.success('Promo code created');
        setNewCode({ code: '', credit_amount: '', max_redemptions: '' });
        setShowCreate(false);
        fetchCodes();
      } else {
        const data = await res.json();
        toast.error(data.detail || 'Failed to create code');
      }
    } catch (err) {
      toast.error('Error creating code');
    } finally {
      setCreating(false);
    }
  };

  const disableCode = async (codeId) => {
    try {
      const res = await fetch(`${API}/api/v1/admin/promo-codes/${codeId}/disable`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Code disabled');
        fetchCodes();
      }
    } catch (err) {
      toast.error('Error disabling code');
    }
  };

  const viewRedemptions = async (codeId) => {
    setSelectedCode(codeId);
    try {
      const res = await fetch(`${API}/api/v1/admin/promo-codes/${codeId}/redemptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRedemptions(data.redemptions || []);
      }
    } catch (err) {
      console.error('Failed to fetch redemptions:', err);
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
    <div className="space-y-6" data-testid="promo-codes-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Gift className="w-6 h-6 text-purple-400" />
            Promo Codes
          </h1>
          <p className="text-gray-400 text-sm">Manage play credit promo codes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchCodes} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white">
            <RefreshCw className="w-5 h-5" />
          </button>
          <Button onClick={() => setShowCreate(!showCreate)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Create Code
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg">Create Promo Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  placeholder="SUMMER2024"
                  value={newCode.code}
                  onChange={(e) => setNewCode({...newCode, code: e.target.value.toUpperCase()})}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Credit Amount ($)</Label>
                <Input
                  type="number"
                  placeholder="10"
                  value={newCode.credit_amount}
                  onChange={(e) => setNewCode({...newCode, credit_amount: e.target.value})}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Redemptions (optional)</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={newCode.max_redemptions}
                  onChange={(e) => setNewCode({...newCode, max_redemptions: e.target.value})}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={createCode} disabled={creating}>
                {creating ? 'Creating...' : 'Create Code'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Codes List */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-4">
          {codes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No promo codes yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-gray-400 text-xs py-2 px-3">Code</th>
                    <th className="text-right text-gray-400 text-xs py-2 px-3">Amount</th>
                    <th className="text-center text-gray-400 text-xs py-2 px-3">Redemptions</th>
                    <th className="text-center text-gray-400 text-xs py-2 px-3">Status</th>
                    <th className="text-right text-gray-400 text-xs py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((code) => (
                    <tr key={code.code_id} className="border-b border-gray-800/50">
                      <td className="py-3 px-3 font-mono text-purple-400">{code.code}</td>
                      <td className="py-3 px-3 text-right text-emerald-400">${code.credit_amount}</td>
                      <td className="py-3 px-3 text-center text-gray-400">
                        {code.current_redemptions}{code.max_redemptions ? `/${code.max_redemptions}` : ''}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          code.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {code.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => viewRedemptions(code.code_id)}
                            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {code.is_active && (
                            <button
                              onClick={() => disableCode(code.code_id)}
                              className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-red-400"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Redemptions Modal */}
      {selectedCode && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Redemption History</CardTitle>
            <button onClick={() => setSelectedCode(null)} className="text-gray-400 hover:text-white">×</button>
          </CardHeader>
          <CardContent>
            {redemptions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No redemptions yet</p>
            ) : (
              <div className="space-y-2">
                {redemptions.map((r, i) => (
                  <div key={i} className="flex justify-between p-2 bg-gray-800 rounded">
                    <span className="text-white">{r.username}</span>
                    <span className="text-emerald-400">${r.credit_amount}</span>
                    <span className="text-gray-500 text-sm">
                      {r.redeemed_at ? new Date(r.redeemed_at).toLocaleString() : '-'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminPromoCodes;
