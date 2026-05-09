import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { auditAPI } from '../utils/api';
import { PageHeader, Badge, EmptyState, Spinner, fmtDateTime } from '../components/shared/UI';

const ACTION_COLOR = {
  CREATE:'green', UPDATE:'blue', DELETE:'red', LOGIN:'purple',
  CHANGE_PASSWORD:'orange', DEACTIVATE:'red',
};

export default function AuditPage() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [filters, setFilters] = useState({ module:'', username:'', startDate:'', endDate:'' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50, ...filters };
      const res = await auditAPI.getAll(params);
      setLogs(res.data.data);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load audit log'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const f = k => e => setFilters(p => ({ ...p, [k]: e.target.value }));

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Complete history of all actions in the system" />

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <select value={filters.module} onChange={f('module')}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg">
          <option value="">All Modules</option>
          {['auth','sale','purchase','product','usedMobile','service','customer','user','expense'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input value={filters.username} onChange={f('username')} placeholder="Filter by user..."
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg" />
        <input type="date" value={filters.startDate} onChange={f('startDate')}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg" />
        <input type="date" value={filters.endDate} onChange={f('endDate')}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg" />
      </div>

      <div className="text-xs text-gray-400 mb-3">
        Showing {logs.length} of {total} records
      </div>

      {loading ? <Spinner /> : logs.length === 0 ? (
        <EmptyState icon="🔍" title="No audit logs found" />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Time','User','Action','Module','Description'].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map(log => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDateTime(log.createdAt)}</td>
                    <td className="px-3 py-3 font-mono text-xs font-medium text-gray-700">@{log.username}</td>
                    <td className="px-3 py-3">
                      <Badge label={log.action} color={ACTION_COLOR[log.action] || 'gray'} />
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">{log.module}</td>
                    <td className="px-3 py-3 text-xs text-gray-600 max-w-xs">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <span className="text-xs text-gray-500">Page {page} of {Math.ceil(total/50)}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="px-3 py-1 text-xs border rounded disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage(p => p+1)} disabled={page >= Math.ceil(total/50)}
                className="px-3 py-1 text-xs border rounded disabled:opacity-40">Next →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
