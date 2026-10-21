'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  UserCheck, Award, Clock, Calendar, CheckCircle2, 
  Sparkles, ExternalLink, Edit3, Save, ShieldCheck, Printer
} from 'lucide-react';

export default function VolunteerDashboard() {
  const [user, setUser] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [skillsForm, setSkillsForm] = useState({
    skills: '',
    interests: '',
    bio: '',
    location_city: 'Bengaluru',
    experience_years: 2,
    availability_type: 'WEEKENDS'
  });
  const [statusMessage, setStatusMessage] = useState(null);
  const [selectedCert, setSelectedCert] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const resUser = await fetch('/api/auth/me');
      const dataUser = await resUser.json();

      if (dataUser.success && dataUser.user) {
        setUser(dataUser.user);
        setSkillsForm({
          skills: dataUser.user.skills || '',
          interests: dataUser.user.interests || '',
          bio: dataUser.user.bio || '',
          location_city: dataUser.user.location_city || 'Bengaluru',
          experience_years: dataUser.user.experience_years || 0,
          availability_type: dataUser.user.availability_type || 'WEEKENDS'
        });

        // Fetch volunteer hours and shifts from MySQL
        const resLeaderboard = await fetch('/api/admin/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customSql: `
              SELECT sa.assignment_id, 
                     sa.attendance_status,
                     sa.hours_logged, sa.verified_by_ngo, sa.feedback,
                     s.shift_date, s.start_time, s.end_time,
                     o.title AS opportunity_title, n.cause_category, n.org_name
              FROM shift_assignments sa
              JOIN shifts s ON sa.shift_id = s.shift_id
              JOIN opportunities o ON s.opportunity_id = o.opportunity_id
              JOIN ngos n ON o.ngo_id = n.ngo_id
              WHERE sa.volunteer_id = '${dataUser.user.user_id}'
              ORDER BY s.shift_date DESC
            `
          })
        }).then(r => r.json()).catch(() => ({ rows: [] }));

        setShifts(resLeaderboard.rows || []);

        const resCerts = await fetch('/api/admin/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customSql: `
              SELECT c.*, c.issued_date AS issue_date, n.org_name, o.title as opp_title
              FROM certificates c
              JOIN opportunities o ON c.opportunity_id = o.opportunity_id
              JOIN ngos n ON (c.ngo_id = n.ngo_id OR o.ngo_id = n.ngo_id)
              WHERE c.volunteer_id = '${dataUser.user.user_id}'
              ORDER BY c.issued_date DESC
            `
          })
        }).then(r => r.json()).catch(() => ({ rows: [] }));

        setCertificates(resCerts.rows || []);
      }
    } catch (err) {
      console.error('Failed to load volunteer data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSkills = async (e) => {
    e.preventDefault();
    setStatusMessage(null);
    try {
      const res = await fetch('/api/volunteers/skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skillsForm)
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: data.message });
        setEditMode(false);
        loadDashboard();
      } else {
        setStatusMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-slate-400 text-sm">Loading volunteer records...</div>;
  }

  const tierColors = {
    PLATINUM: 'bg-purple-100 text-purple-800 border-purple-200',
    GOLD: 'bg-amber-100 text-amber-800 border-amber-200',
    SILVER: 'bg-slate-200 text-slate-800 border-slate-300',
    BRONZE: 'bg-orange-100 text-orange-800 border-orange-200',
  };

  const totalVerifiedHours = shifts.length > 0
    ? shifts.filter(s => s.verified_by_ngo === 1 || s.attendance_status === 'ATTENDED').reduce((acc, curr) => acc + Number(curr.hours_logged || 0), 0)
    : (Number(user?.total_hours_contributed) || 0);

  const getTier = (hours) => {
    if (hours >= 100) return 'PLATINUM';
    if (hours >= 50) return 'GOLD';
    if (hours >= 20) return 'SILVER';
    return 'BRONZE';
  };

  const currentTier = user?.volunteer_level || getTier(totalVerifiedHours);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Volunteer Header & Tier Badge */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            {user?.full_name ? user.full_name[0] : 'V'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{user?.full_name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${tierColors[currentTier] || 'bg-slate-100 text-slate-700'}`}>
                {currentTier} TIER
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {user?.email} • {user?.location_city || user?.city || 'Bengaluru'}, {user?.location_state || user?.state || 'Karnataka'} • {user?.availability_type} Availability
            </p>
          </div>
        </div>

        {/* Total Hours Metric */}
        <div className="flex items-center gap-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {totalVerifiedHours}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Hours Verified</p>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {certificates.length}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Certificates</p>
          </div>
        </div>
      </div>

      {/* Skills & Vector Profile Editor */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Semantic Vector Profile & Skills</h2>
          </div>
          <button
            onClick={() => setEditMode(!editMode)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {editMode ? 'Cancel Edit' : 'Edit Skills & Re-Embed'}
          </button>
        </div>

        {statusMessage && (
          <div className={`p-3 rounded-xl text-xs ${statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
            {statusMessage.text}
          </div>
        )}

        {!editMode ? (
          <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-600">
            <div>
              <p className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Registered Skills</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {(user?.skills || '').split(',').map((s, i) => (
                  <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg text-xs font-medium">
                    {s.trim()}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Passions & Causes</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {(user?.interests || '').split(',').map((c, i) => (
                  <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-100 rounded-lg text-xs font-medium">
                    {c.trim()}
                  </span>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 bg-slate-50 p-3 rounded-xl">
              <p className="font-semibold text-slate-700 mb-1">Volunteer Bio:</p>
              <p className="text-slate-600 leading-relaxed">{user?.bio}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdateSkills} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Skills (comma-separated):</label>
                <input
                  type="text"
                  value={skillsForm.skills}
                  onChange={(e) => setSkillsForm({ ...skillsForm, skills: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Causes & Interests:</label>
                <input
                  type="text"
                  value={skillsForm.interests}
                  onChange={(e) => setSkillsForm({ ...skillsForm, interests: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bio / Motivation:</label>
              <textarea
                value={skillsForm.bio}
                onChange={(e) => setSkillsForm({ ...skillsForm, bio: e.target.value })}
                rows={3}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City:</label>
                <input
                  type="text"
                  value={skillsForm.location_city}
                  onChange={(e) => setSkillsForm({ ...skillsForm, location_city: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Experience (Years):</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={skillsForm.experience_years}
                  onChange={(e) => setSkillsForm({ ...skillsForm, experience_years: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Availability:</label>
                <select
                  value={skillsForm.availability_type}
                  onChange={(e) => setSkillsForm({ ...skillsForm, availability_type: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                >
                  <option value="WEEKENDS">WEEKENDS</option>
                  <option value="WEEKDAYS">WEEKDAYS</option>
                  <option value="FLEXIBLE">FLEXIBLE</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              Save Profile & Recalculate 384-d Embedding
            </button>
          </form>
        )}
      </div>

      {/* Enrolled Shifts & Attendance */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">My Shift Enrollments & Logged Hours</h2>
          </div>
          <Link href="/opportunities" className="text-xs text-emerald-600 hover:underline font-semibold">
            Browse More Shifts →
          </Link>
        </div>

        {shifts.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No shifts registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Campaign & Organization</th>
                  <th className="p-3">Shift Date & Time</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Hours Credited</th>
                  <th className="p-3">NGO Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shifts.map((s) => (
                  <tr key={s.assignment_id} className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{s.opportunity_title}</p>
                      <p className="text-[11px] text-slate-400">{s.org_name} • {s.cause_category}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-slate-800">{s.shift_date}</p>
                      <p className="text-[11px] text-slate-400">{s.start_time} - {s.end_time}</p>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        s.attendance_status === 'ATTENDED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {s.attendance_status}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      {s.hours_logged > 0 ? `${s.hours_logged} hrs` : 'Pending'}
                    </td>
                    <td className="p-3 text-slate-500 italic text-[11px]">
                      {s.feedback || 'Attendance pending verification by NGO.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verified Cryptographic Certificates */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <Award className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-slate-900">Cryptographically Verifiable Certificates</h2>
        </div>

        {certificates.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No certificates issued yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {certificates.map((cert) => (
              <div
                key={cert.certificate_id}
                className="border border-slate-200 rounded-2xl p-5 hover:border-amber-300 hover:shadow-sm transition-all space-y-3 bg-gradient-to-br from-white to-amber-50/20"
              >
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    VERIFIED CERTIFICATE
                  </span>
                  <span className="text-xs font-bold text-slate-500">{cert.issued_date}</span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{cert.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Issued by <strong>{cert.org_name}</strong> • {cert.total_hours_credited} Hours Credited
                  </p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl text-[10px] font-mono text-slate-500 break-all border border-slate-100">
                  SHA-256: {cert.certificate_code}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setSelectedCert(cert)}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Preview & Print Certificate
                  </button>
                  <Link
                    href={`/verify/${cert.certificate_code}`}
                    className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                  >
                    Public URL <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-8 shadow-2xl space-y-6 relative border-4 border-amber-600/30">
            <button
              onClick={() => setSelectedCert(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ✕
            </button>

            {/* Official Certificate Canvas Mock */}
            <div className="border-2 border-dashed border-amber-500/50 p-8 rounded-2xl bg-amber-50/20 text-center space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-amber-700 font-extrabold">
                  PES University Experiential Learning • Department of CSE
                </span>
                <h2 className="text-2xl font-serif font-black text-slate-900 tracking-wide uppercase">
                  Certificate of Social Contribution
                </h2>
                <p className="text-xs text-slate-500">This official credential certifies that</p>
              </div>

              <div>
                <p className="text-2xl font-bold text-emerald-800 underline decoration-emerald-500 decoration-2 underline-offset-8">
                  {user?.full_name}
                </p>
              </div>

              <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                has successfully contributed <strong>{selectedCert.total_hours_credited} verified community service hours</strong> towards the cause of <em>&ldquo;{selectedCert.title}&rdquo;</em> organized by <strong>{selectedCert.org_name}</strong>.
              </p>

              <div className="pt-6 grid grid-cols-2 gap-8 text-xs text-slate-600 border-t border-slate-200">
                <div>
                  <p className="font-bold text-slate-800">{selectedCert.signatory_name}</p>
                  <p className="text-[10px] text-slate-400">{selectedCert.signatory_role}</p>
                  <p className="text-[10px] text-slate-400">{selectedCert.org_name}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-800">{selectedCert.issued_date}</p>
                  <p className="text-[10px] text-slate-400">Date of Registration</p>
                  <p className="text-[10px] text-emerald-600 font-mono">Status: Cryptographically Verified</p>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 text-[10px] font-mono text-slate-400 break-all">
                Hash: {selectedCert.certificate_code}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print Certificate (PDF)
              </button>
              <button
                onClick={() => setSelectedCert(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

