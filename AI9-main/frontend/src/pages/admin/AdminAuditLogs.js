import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FileText, User, Clock } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const AdminAuditLogs = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${API}/api/v1/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (action.includes('create')) return 'text-emerald-400';
    if (action.includes('update') || action.includes('assign')) return 'text-blue-400';
    if (action.includes('delete') || action.includes('revoke') || action.includes('ban')) return 'text-red-400';
    return 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="text-gray-400 text-sm">Track all admin actions</p>
      </div>

      {/* Logs List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No audit logs yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-800 rounded-lg mt-0.5">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className={`font-medium ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        <span className="text-gray-500">Entity:</span> {log.entity_type} ({log.entity_id?.slice(0, 8)}...)
                      </p>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 text-xs bg-black/50 rounded-lg p-2">
                          <pre className="text-gray-400 whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center text-gray-500 text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLogs;
