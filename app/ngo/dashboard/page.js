'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, PlusCircle, CheckCircle2, Clock, Users, 
  Award, ShieldCheck, AlertCircle, FileText, Send
} from 'lucide-react';

export default function NgoDashboard() {
  const [user, setUser] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [volunteersList, setVolunteersList] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // New Opportunity Form State
  const [newOpp, setNewOpp] = useState({
    title: '',
    description: '',
    cause_category: 'Education',
    required_skills: '',
    experience_required: 0,
    location_city: 'Bengaluru',
    location_type: 'ON_SITE',
    start_date: '2026-11-20',
    end_date: '2026-12-10',
    max_volunteers: 15,
  });

  // Certificate Issuance State
  const [certForm, setCertForm] = useState({
    volunteerId: '',
    opportunityId: '',
    title: 'Certificate of Commendable Community Service',
    totalHours: 10,
    signatoryName: 'Dr. Sunita Rao',
    signatoryRole: 'Executive Director'
  });

  useEffect(() => {
    loadNgoData();
  }, []);

  const loadNgoData = async () => {
    setLoading(true);
    try {
      const resUser = await fetch('/api/auth/me');
      const dataUser = await resUser.json();
      if (!dataUser.success || !['NGO', 'ADMIN'].includes(dataUser.user?.role)) {
        setUser(dataUser.user || null);
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      setUser(dataUser.user);
      setUnauthorized(false);

        const ngoFilter = dataUser.user.role === 'ADMIN' ? '1=1' : `o.ngo_id = '${dataUser.user.user_id}'`;

        // Fetch NGO opportunities
        const resOpps = await fetch('/api/admin/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customSql: `
              SELECT o.*, COUNT(s.shift_id) AS total_shifts,
                     COALESCE(SUM(s.capacity), 0) AS aggregate_capacity,
                     COALESCE(o.accepted_volunteers, 0) AS aggregate_enrolled
              FROM opportunities o
              LEFT JOIN shifts s ON o.opportunity_id = s.opportunity_id
              WHERE ${ngoFilter}
              GROUP BY o.opportunity_id
              ORDER BY o.created_at DESC
            `
          })
        }).then(r => r.json()).catch(() => ({ rows: [] }));

        let loadedOpps = resOpps.rows || [];
        if (loadedOpps.length === 0) {
          const allOpps = await fetch('/api/opportunities').then(r => r.json()).catch(() => ({ opportunities: [] }));
          loadedOpps = allOpps.opportunities || [];
        }
        setOpportunities(loadedOpps);

        // Fetch active platform volunteers for certificate issuance
        const resVols = await fetch('/api/admin/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customSql: `
              SELECT v.volunteer_id, u.full_name, u.email 
              FROM volunteers v 
              JOIN users u ON v.volunteer_id = u.user_id 
              ORDER BY u.full_name ASC
            `
          })
        }).then(r => r.json()).catch(() => ({ rows: [] }));

        setVolunteersList(resVols.rows || []);

        // Fetch volunteer attendance roster across this NGO's shifts
        const resRoster = await fetch('/api/admin/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customSql: `
              SELECT sa.assignment_id,
                     sa.hours_logged, sa.verified_by_ngo, sa.attendance_status,
                     v.volunteer_id, u.full_name AS volunteer_name, u.email AS volunteer_email,
                     s.shift_id, s.shift_date, COALESCE(s.hours, 4.0) AS shift_hours,
                     o.opportunity_id, o.title AS opportunity_title
              FROM shift_assignments sa
              JOIN shifts s ON sa.shift_id = s.shift_id
              JOIN opportunities o ON s.opportunity_id = o.opportunity_id
              JOIN volunteers v ON sa.volunteer_id = v.volunteer_id
              JOIN users u ON v.volunteer_id = u.user_id
              WHERE ${ngoFilter}
              ORDER BY s.shift_date DESC
            `
          })
        }).then(r => r.json()).catch(() => ({ rows: [] }));

        setRoster(resRoster.rows || []);
    } catch (err) {
      console.error('Failed to load NGO data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOpportunity = async (e) => {
    e.preventDefault();
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOpp)
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: data.message });
        setShowCreateModal(false);
        loadNgoData();
      } else {
        setFeedbackMsg({ type: 'error', text: data.error });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    }
  };

  const handleVerifyAttendance = async (assignmentId, hours) => {
    try {
      const res = await fetch('/api/shifts/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, hoursLogged: hours })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: data.message });
        loadNgoData();
      } else {
        setFeedbackMsg({ type: 'error', text: data.error });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    }
  };

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/certificates/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(certForm)
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: `${data.message} Hash: ${data.certificate?.certificateCode.substring(0, 16)}...` });
        setShowCertModal(false);
      } else {
        setFeedbackMsg({ type: 'error', text: data.error });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-slate-400 text-sm">Loading NGO Operations Portal...</div>;
  }

  if (unauthorized) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-3xl border border-rose-200 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <Building2 className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Access Denied (403 Forbidden)</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          The <strong>NGO Operations Portal</strong> is reserved for verified partner organizations and platform administrators.
        </p>
        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
          Currently signed in as: <strong>{user ? `${user.full_name} (${user.role})` : 'Unauthenticated Guest'}</strong>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <a
            href={user?.role === 'VOLUNTEER' ? '/volunteer/dashboard' : '/opportunities'}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Go to My Portal
          </a>
          <a
            href="/login"
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
          >
            Switch to NGO Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* NGO Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{user?.org_name || user?.full_name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                user?.verification_status === 'VERIFIED'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {user?.verification_status || 'VERIFIED'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Primary Cause: <strong>{user?.cause_category}</strong> • Account: {user?.email}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Post Opportunity (Auto-Vector)
          </button>
          <button
            onClick={() => setShowCertModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <Award className="w-4 h-4 text-amber-400" />
            Issue Certificate (SHA-256)
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
          feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Roster & Hours Verification Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Volunteer Attendance & Hours Verification</h2>
              <p className="text-xs text-slate-500">
                Verifying hours executes the <code>trg_update_volunteer_hours</code> database trigger, instantly crediting the volunteer and recalculating their tier!
              </p>
            </div>
          </div>
        </div>

        {roster.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No volunteers currently enrolled in shifts.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Volunteer</th>
                  <th className="p-3">Campaign Opportunity</th>
                  <th className="p-3">Shift Date & Scheduled Hours</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roster.map((row) => (
                  <tr key={row.assignment_id} className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{row.volunteer_name}</p>
                      <p className="text-[11px] text-slate-400">{row.volunteer_email}</p>
                    </td>
                    <td className="p-3 font-medium text-slate-800">{row.opportunity_title}</td>
                    <td className="p-3">
                      <span>{row.shift_date}</span>
                      <span className="text-slate-400 ml-1">({row.shift_hours} hrs)</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        row.verified_by_ngo
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {row.verified_by_ngo ? `Verified (${row.hours_logged} hrs)` : 'Pending Verification'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {!row.verified_by_ngo ? (
                        <button
                          onClick={() => handleVerifyAttendance(row.assignment_id, row.shift_hours)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                        >
                          Verify & Log {row.shift_hours} Hrs
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Logged
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Managed Opportunities */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-4">
          Published Opportunities & Shift Rosters
        </h2>

        {opportunities.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No opportunities posted yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {opportunities.map((opp) => (
              <div key={opp.opportunity_id} className="border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                    {opp.cause_category}
                  </span>
                  <span className="text-[11px] text-slate-400">{opp.start_date} to {opp.end_date}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{opp.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{opp.description}</p>
                <div className="pt-2 text-xs flex items-center justify-between text-slate-600 border-t border-slate-100">
                  <span>Enrolled: <strong>{opp.aggregate_enrolled} / {opp.aggregate_capacity}</strong></span>
                  <span className="text-emerald-600 font-semibold">384-d Vector Embedded ✓</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Opportunity Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Post Volunteer Opportunity</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateOpportunity} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Opportunity Title:</label>
                <input
                  type="text"
                  value={newOpp.title}
                  onChange={(e) => setNewOpp({ ...newOpp, title: e.target.value })}
                  placeholder="e.g. Free Eye Screening & Cataract Camp"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cause Category:</label>
                  <select
                    value={newOpp.cause_category}
                    onChange={(e) => setNewOpp({ ...newOpp, cause_category: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Education">Education</option>
                    <option value="Environment">Environment</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Animal Welfare">Animal Welfare</option>
                    <option value="Disaster Relief">Disaster Relief</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location City:</label>
                  <input
                    type="text"
                    value={newOpp.location_city}
                    onChange={(e) => setNewOpp({ ...newOpp, location_city: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Required Skills (comma-separated):</label>
                <input
                  type="text"
                  value={newOpp.required_skills}
                  onChange={(e) => setNewOpp({ ...newOpp, required_skills: e.target.value })}
                  placeholder="e.g. Ophthalmology, Patient Care, First Aid, Registration"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description:</label>
                <textarea
                  value={newOpp.description}
                  onChange={(e) => setNewOpp({ ...newOpp, description: e.target.value })}
                  rows={3}
                  placeholder="Detailed description of activities and responsibilities..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location Type:</label>
                  <select
                    value={newOpp.location_type}
                    onChange={(e) => setNewOpp({ ...newOpp, location_type: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="ON_SITE">ON_SITE</option>
                    <option value="HYBRID">HYBRID</option>
                    <option value="REMOTE">REMOTE</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date:</label>
                  <input
                    type="date"
                    value={newOpp.start_date}
                    onChange={(e) => setNewOpp({ ...newOpp, start_date: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date:</label>
                  <input
                    type="date"
                    value={newOpp.end_date}
                    onChange={(e) => setNewOpp({ ...newOpp, end_date: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Publish & Generate Embeddings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Certificate Modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Issue Verifiable Certificate (SHA-256)</h3>
              <button onClick={() => setShowCertModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleIssueCertificate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Volunteer:</label>
                <select
                  value={certForm.volunteerId}
                  onChange={(e) => setCertForm({ ...certForm, volunteerId: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                >
                  <option value="">-- Choose Volunteer --</option>
                  {volunteersList.length > 0 ? (
                    volunteersList.map((vol) => (
                      <option key={vol.volunteer_id} value={vol.volunteer_id}>
                        {vol.full_name} ({vol.email})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="usr-vol-rishi">Rishi (PES1UG24AM224) - rishi@pes.edu</option>
                      <option value="usr-vol-rohanth">Rohanth (PES1UG24AM227) - rohanth@pes.edu</option>
                      <option value="vol-001">Kavya Murugan - kavya.m@example.org</option>
                      <option value="vol-002">Asha Ramesh - asha.r@example.org</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Opportunity:</label>
                <select
                  value={certForm.opportunityId}
                  onChange={(e) => setCertForm({ ...certForm, opportunityId: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                >
                  <option value="">-- Choose Opportunity --</option>
                  {opportunities.map((opp) => (
                    <option key={opp.opportunity_id} value={opp.opportunity_id}>
                      {opp.title || opp.opportunity_title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Certificate Title:</label>
                <input
                  type="text"
                  value={certForm.title}
                  onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hours Credited:</label>
                  <input
                    type="number"
                    min="1"
                    value={certForm.totalHours}
                    onChange={(e) => setCertForm({ ...certForm, totalHours: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Signatory Name:</label>
                  <input
                    type="text"
                    value={certForm.signatoryName}
                    onChange={(e) => setCertForm({ ...certForm, signatoryName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCertModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-xs"
                >
                  Sign & Register Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

