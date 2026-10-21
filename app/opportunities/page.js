'use client';

import { useState, useEffect } from 'react';
import { 
  Sparkles, Compass, MapPin, Calendar, Clock, Users, 
  CheckCircle2, ArrowRight, Filter, AlertCircle, ExternalLink
} from 'lucide-react';

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCause, setSelectedCause] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [isMatching, setIsMatching] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [applyingShiftId, setApplyingShiftId] = useState(null);
  const [applyMessage, setApplyMessage] = useState(null);

  const causes = ['ALL', 'Education', 'Environment', 'Healthcare', 'Animal Welfare', 'Disaster Relief'];

  useEffect(() => {
    fetchOpportunities();
  }, [selectedCause, selectedLocation]);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      let url = `/api/opportunities?cause=${selectedCause}&city=${selectedLocation}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setOpportunities(data.opportunities);
      }
    } catch (err) {
      console.error('Failed to load opportunities', err);
    } finally {
      setLoading(false);
    }
  };

  const runSemanticMatch = async () => {
    setIsMatching(true);
    setApplyMessage(null);
    try {
      const res = await fetch('/api/opportunities/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setMatchData(data);
        setOpportunities(data.rankedOpportunities);
      } else {
        alert(data.error || 'Failed to calculate semantic matches');
      }
    } catch (err) {
      console.error('Semantic match failed', err);
    } finally {
      setIsMatching(false);
    }
  };

  const handleApplyShift = async (shiftId) => {
    setApplyingShiftId(shiftId);
    setApplyMessage(null);
    try {
      const res = await fetch('/api/shifts/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          shiftId, 
          opportunityId: selectedOpp?.opportunity_id 
        }),
      });
      const data = await res.json();
      if (data.success) {
        setApplyMessage({ type: 'success', text: data.message });
        fetchOpportunities(); // Refresh shift occupancy
      } else {
        setApplyMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setApplyMessage({ type: 'error', text: err.message });
    } finally {
      setApplyingShiftId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Compass className="w-7 h-7 text-emerald-600" />
            Volunteer Opportunity Explorer
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse verified community opportunities or trigger our <strong>384-dimensional vector semantic engine</strong> to find matches.
          </p>
        </div>

        {/* AI Vector Match Trigger */}
        <button
          onClick={runSemanticMatch}
          disabled={isMatching}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md ${
            matchData
              ? 'bg-emerald-700 text-white shadow-emerald-700/25 ring-2 ring-emerald-400'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:scale-[1.02]'
          }`}
        >
          <Sparkles className={`w-4 h-4 ${isMatching ? 'animate-spin' : 'text-emerald-200'}`} />
          {isMatching ? 'Computing Cosine Vectors...' : matchData ? 'Re-run AI Match' : 'Match With My Profile (AI)'}
        </button>
      </div>

      {/* Semantic Matching Status Banner */}
      {matchData && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-950">
                Vector Match Results for: <span className="text-emerald-700">{matchData.volunteer?.name}</span>
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Skills Analyzed: <code className="bg-emerald-100/70 text-emerald-800 px-1.5 py-0.5 rounded text-[11px]">{matchData.volunteer?.skills}</code>
              </p>
            </div>
          </div>
          <button
            onClick={() => { setMatchData(null); fetchOpportunities(); }}
            className="text-xs text-emerald-700 hover:text-emerald-900 underline font-medium"
          >
            Clear AI Filter
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Cause categories */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Cause:
          </span>
          {causes.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCause(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCause === c
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Location Type */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Location:</span>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Cities</option>
            <option value="Bengaluru">Bengaluru</option>
          </select>
        </div>
      </div>

      {/* Opportunities List Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          Loading opportunities from database views...
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500">
          No opportunities match the selected filters.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opp) => {
            const hasMatch = opp.matchMetrics;
            const matchScore = hasMatch ? opp.matchMetrics.matchPercentage : null;
            const totalCapacity = Number(opp.aggregate_capacity) || opp.required_volunteers || 15;
            const enrolledCount = opp.accepted_volunteers || 0;
            const openSlots = Math.max(1, totalCapacity - enrolledCount);

            return (
              <div
                key={opp.opportunity_id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                {/* Match Banner if AI search is active */}
                {hasMatch && (
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                      {matchScore}% Semantic Match
                    </span>
                    <span className="text-[11px] opacity-90">
                      Cosine Sim: {opp.matchMetrics.semanticScore}
                    </span>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    {/* Cause & Status Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {opp.cause_category}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {opp.location_city} ({opp.location_type})
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                      {opp.opportunity_title || opp.title}
                    </h2>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {opp.description}
                    </p>
                  </div>

                  {/* NGO info */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{opp.org_name}</span>
                      {opp.verification_status === 'VERIFIED' && (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>

                    {/* Required Skills */}
                    <div className="flex flex-wrap gap-1">
                      {(opp.required_skills || '').split(',').slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>

                    {/* Shifts & Slot Occupancy */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {opp.shifts?.length || 0} scheduled shifts
                      </span>
                      <span className={`font-semibold ${openSlots > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {openSlots > 0 ? `${openSlots} slots open` : 'Full capacity'}
                      </span>
                    </div>
                  </div>

                  {/* Match Breakdown if present */}
                  {hasMatch && opp.matchMetrics.matchReasons?.length > 0 && (
                    <div className="bg-slate-50 rounded-lg p-2.5 text-[11px] text-slate-600 space-y-1">
                      <p className="font-semibold text-slate-700">Vector match reasons:</p>
                      <ul className="list-disc pl-3.5 space-y-0.5 text-slate-500">
                        {opp.matchMetrics.matchReasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action button */}
                  <button
                    onClick={() => { setSelectedOpp(opp); setApplyMessage(null); }}
                    className="w-full mt-2 py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    View Shifts & Enroll
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shift Enrollment Modal */}
      {selectedOpp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                  {selectedOpp.cause_category}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  {selectedOpp.opportunity_title || selectedOpp.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Hosted by <strong>{selectedOpp.org_name}</strong> • {selectedOpp.location_city} ({selectedOpp.location_type})
                </p>
              </div>
              <button
                onClick={() => setSelectedOpp(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Apply Feedback Alert */}
            {applyMessage && (
              <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                applyMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {applyMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{applyMessage.text}</span>
              </div>
            )}

            {/* Opportunity Details */}
            <div className="space-y-3 text-xs text-slate-600">
              <p className="leading-relaxed">{selectedOpp.description}</p>
              <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                <p><strong>Required Skills:</strong> {selectedOpp.required_skills}</p>
                <p><strong>Experience Required:</strong> {selectedOpp.experience_required} years</p>
                <p><strong>Campaign Window:</strong> {selectedOpp.start_date} to {selectedOpp.end_date}</p>
              </div>
            </div>

            {/* Shifts Roster Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Available Shifts (ACID Transaction Enrollment)
              </h4>

              {selectedOpp.shifts?.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center space-y-2">
                  <p className="text-xs text-slate-500">Flexible schedule opportunity (open enrollment).</p>
                  <button
                    onClick={() => handleApplyShift('sh-def-' + selectedOpp.opportunity_id)}
                    disabled={applyingShiftId !== null}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                  >
                    {applyingShiftId ? 'Enrolling...' : 'Enroll in Opportunity'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedOpp.shifts?.map((shift) => {
                    const capacity = shift.capacity || 10;
                    const filled = shift.filled_count || 0;
                    const isFull = filled >= capacity;
                    const occupancyPct = Math.round((filled / capacity) * 100);
                    const durationHours = shift.hours || 4.0;

                    return (
                      <div
                        key={shift.shift_id}
                        className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-xs font-bold text-slate-800">{shift.shift_date}</span>
                            <span className="text-[11px] text-slate-400">({shift.start_time} - {shift.end_time})</span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Duration: {durationHours} hours • Capacity: {filled} / {capacity} enrolled ({occupancyPct}%)
                          </p>
                          {/* Progress bar */}
                          <div className="w-48 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${isFull ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, occupancyPct)}%` }}
                            ></div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleApplyShift(shift.shift_id)}
                          disabled={isFull || applyingShiftId === shift.shift_id}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isFull
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                        >
                          {applyingShiftId === shift.shift_id
                            ? 'Processing Transaction...'
                            : isFull
                            ? 'Full'
                            : 'Enroll in Shift'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOpp(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
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

