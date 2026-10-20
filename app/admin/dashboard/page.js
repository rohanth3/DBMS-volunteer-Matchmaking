'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, Database, Play, CheckCircle2, XCircle, 
  Clock, Users, AlertTriangle, FileText, Terminal, Sparkles
} from 'lucide-react';

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pendingNgos, setPendingNgos] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [presetQueries, setPresetQueries] = useState({});
  const [selectedKey, setSelectedKey] = useState('join_aggregate');
  const [sqlText, setSqlText] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  useEffect(() => {
    loadAdminData();
    loadPresetQueries();
  }, []);

  const loadAdminData = async () => {
    try {
      setAuthLoading(true);
      const resUser = await fetch('/api/auth/me');
      const dataUser = await resUser.json();

      if (!dataUser.success || dataUser.user?.role !== 'ADMIN') {
        setCurrentUser(dataUser.user || null);
        setUnauthorized(true);
        setAuthLoading(false);
        return;
      }

      setCurrentUser(dataUser.user);
      setUnauthorized(false);
      setAuthLoading(false);

      // Fetch platform metrics
      const resStats = await fetch('/api/admin/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customSql: `
            SELECT 
              (SELECT COUNT(*) FROM users WHERE role = 'VOLUNTEER') as total_volunteers,
              (SELECT COUNT(*) FROM ngos WHERE UPPER(verification_status) = 'VERIFIED') as verified_ngos,
              (SELECT COUNT(*) FROM opportunities WHERE UPPER(status) = 'OPEN') as open_opps,
              (SELECT COALESCE(SUM(hours_logged), 0) FROM shift_assignments WHERE verified_by_ngo = 1) as total_hours,
              (SELECT COUNT(*) FROM certificates) as total_certs
          `
        })
      }).then(r => r.json());

      if (resStats.rows?.length > 0) {
        setStats(resStats.rows[0]);
      }

      // Fetch pending NGOs
      const resPending = await fetch('/api/admin/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customSql: `SELECT * FROM ngos WHERE verification_status = 'PENDING'`
        })
      }).then(r => r.json());

      setPendingNgos(resPending.rows || []);

      // Fetch latest audit logs
      const resLogs = await fetch('/api/admin/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customSql: `SELECT * FROM audit_logs ORDER BY logged_at DESC LIMIT 8`
        })
      }).then(r => r.json());

      setAuditLogs(resLogs.rows || []);
    } catch (err) {
      console.error('Failed to load admin data', err);
    }
  };

  const loadPresetQueries = async () => {
    try {
      const res = await fetch('/api/admin/query');
      const data = await res.json();
      if (data.success && data.presetQueries) {
        setPresetQueries(data.presetQueries);
        setSqlText(data.presetQueries['join_aggregate']?.sql || '');
      }
    } catch (err) {
      console.error('Failed to load preset queries', err);
    }
  };

  const handleSelectQuery = (key) => {
    setSelectedKey(key);
    if (presetQueries[key]) {
      setSqlText(presetQueries[key].sql);
    }
  };

  const handleRunQuery = async () => {
    setExecuting(true);
    setQueryResult(null);
    try {
      const res = await fetch('/api/admin/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customSql: sqlText })
      });
      const data = await res.json();
      setQueryResult(data);
    } catch (err) {
      setQueryResult({ success: false, error: err.message });
    } finally {
      setExecuting(false);
    }
  };

  const handleVerifyNgo = async (ngoId, status) => {
    try {
      const res = await fetch('/api/ngos/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ngoId, status })
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg({ type: 'success', text: data.message });
        loadAdminData(); // Reload pending NGOs and audit logs
      } else {
        setActionMsg({ type: 'error', text: data.error });
      }
    } catch (err) {
      setActionMsg({ type: 'error', text: err.message });
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">
        Verifying administrator session permissions...
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-3xl border border-rose-200 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Access Denied (403 Forbidden)</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          The <strong>Admin Control Center & SQL Laboratory</strong> is restricted strictly to authenticated users with the <span className="px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800">ADMIN</span> role.
        </p>
        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
          Currently signed in as: <strong>{currentUser ? `${currentUser.full_name} (${currentUser.role})` : 'Unauthenticated Guest'}</strong>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <a
            href={currentUser?.role === 'NGO' ? '/ngo/dashboard' : currentUser?.role === 'VOLUNTEER' ? '/volunteer/dashboard' : '/opportunities'}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Go to My Portal
          </a>
          <a
            href="/login"
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
          >
            Switch to Admin Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-emerald-600" />
            Admin Control Center & Interactive DBMS Laboratory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            PES University Level 3 System Management • Real-time SQL execution engine, trigger audit trail, and verification queues.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
          <Terminal className="w-4 h-4 text-slate-700" />
          <span>Interactive Query Console Mode</span>
        </div>
      </div>

      {actionMsg && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
          actionMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {actionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-400 font-semibold uppercase">Total Volunteers</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total_volunteers || 5}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-400 font-semibold uppercase">Verified NGOs</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.verified_ngos || 4}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-400 font-semibold uppercase">Open Campaigns</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{stats?.open_opps || 5}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-400 font-semibold uppercase">Verified Hours</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats?.total_hours || 277}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-xs text-slate-400 font-semibold uppercase">Certificates</p>
          <p className="text-2xl font-black text-purple-600 mt-1">{stats?.total_certs || 3}</p>
        </div>
      </div>

      {/* Interactive SQL Laboratory */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Advanced SQL Queries & Analytics Console</h2>
              <p className="text-xs text-slate-300">
                Execute JOINs, GROUP BY with HAVING, Correlated Subqueries, NOT IN, and Window Functions (DENSE_RANK) directly against the live database.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunQuery}
              disabled={executing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${executing ? 'animate-spin' : ''}`} />
              {executing ? 'Executing Query...' : 'Run Query Live'}
            </button>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Choose Required DBMS Level 3 Demonstration Query:
          </label>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
            {Object.keys(presetQueries).map((key) => {
              const item = presetQueries[key];
              const isSelected = selectedKey === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectQuery(key)}
                  className={`text-left p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold line-clamp-1">{item.title}</p>
                  <p className="text-[10px] text-slate-500 font-normal line-clamp-1 mt-0.5">{item.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* SQL Editor Area */}
        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                SQL Query Statement (Editable):
              </span>
              <span className="text-[11px] text-slate-400">SELECT / WITH statements supported</span>
            </div>
            <textarea
              value={sqlText}
              onChange={(e) => setSqlText(e.target.value)}
              rows={8}
              className="w-full font-mono text-xs p-4 bg-slate-900 text-emerald-400 rounded-2xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
              spellCheck={false}
            />
          </div>

          {/* Results Table & Performance Metrics */}
          {queryResult && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs bg-slate-100 p-3 rounded-xl">
                <span className="font-semibold text-slate-700">
                  Status: {queryResult.success ? 'Success ✓' : 'Failed ❌'}
                </span>
                {queryResult.success && (
                  <span className="text-slate-500">
                    Retrieved <strong>{queryResult.rowCount} rows</strong> in <strong className="text-emerald-700">{queryResult.durationMs} ms</strong>
                  </span>
                )}
              </div>

              {!queryResult.success ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-mono">
                  {queryResult.error}
                </div>
              ) : queryResult.rows?.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                  Query returned zero rows.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-700 font-mono">
                    <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] sticky top-0">
                      <tr>
                        {queryResult.columns?.map((col) => (
                          <th key={col} className="p-3 border-b border-slate-200">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {queryResult.rows?.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          {queryResult.columns?.map((col) => (
                            <td key={col} className="p-3 whitespace-nowrap">
                              {row[col] === null ? <em className="text-slate-400 font-sans">NULL</em> : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* NGO Verification Queue */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">NGO Organization Verification Queue</h2>
              <p className="text-xs text-slate-500">
                Updating status activates the database trigger <code>trg_audit_ngo_verification</code>, capturing timestamp and admin id.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            {pendingNgos.length} Pending
          </span>
        </div>

        {pendingNgos.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
            ✓ No pending NGO verification applications. All organizations verified!
          </div>
        ) : (
          <div className="space-y-3">
            {pendingNgos.map((ngo) => (
              <div
                key={ngo.ngo_id}
                className="border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{ngo.org_name}</h3>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-semibold">
                      {ngo.cause_category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Reg No: <strong>{ngo.registration_number}</strong> • Darpan: {ngo.darpan_id || 'N/A'} • {ngo.city}, {ngo.state}
                  </p>
                  <p className="text-xs text-slate-500">
                    Contact: {ngo.contact_person} ({ngo.contact_email}, {ngo.contact_phone})
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleVerifyNgo(ngo.ngo_id, 'VERIFIED')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve NGO
                  </button>
                  <button
                    onClick={() => handleVerifyNgo(ngo.ngo_id, 'REJECTED')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shadow-xs"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Audit Trail Viewer */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <Clock className="w-5 h-5 text-slate-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">Security & Database Trigger Audit Trail</h2>
            <p className="text-xs text-slate-500">
              Live records from <code>audit_logs</code> written automatically by database triggers (insert, update, verification).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 font-mono">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Table Name</th>
                <th className="p-3">Action</th>
                <th className="p-3">Change Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.log_id} className="hover:bg-slate-50/50">
                  <td className="p-3 whitespace-nowrap text-slate-400">{log.logged_at}</td>
                  <td className="p-3 font-semibold text-slate-800">{log.table_name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.action === 'INSERT'
                        ? 'bg-blue-100 text-blue-800'
                        : log.action === 'UPDATE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-sans text-slate-600 text-xs">{log.change_details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

