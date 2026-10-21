import Link from 'next/link';
import { 
  HeartHandshake, Sparkles, Database, ShieldCheck, 
  Award, Clock, Users, ArrowRight, CheckCircle2, ChevronRight
} from 'lucide-react';
import { queryOne } from '@/lib/db';

export const revalidate = 0;

export default async function Home() {
  // Aggregate live metrics from Database
  const stats = (await queryOne(`
    SELECT 
      (SELECT COUNT(*) FROM opportunities WHERE UPPER(status) = 'OPEN') as active_opps,
      (SELECT COUNT(*) FROM ngos WHERE UPPER(verification_status) = 'VERIFIED') as verified_ngos,
      (SELECT ROUND(COALESCE(SUM(hours_logged), 0), 0) FROM shift_assignments WHERE verified_by_ngo = 1) as total_hours,
      (SELECT COUNT(*) FROM volunteers) as volunteers_count
  `).catch(err => {
    console.error('[Home Page Stats Query Error]:', err.message);
    return null;
  })) || { active_opps: 0, verified_ngos: 0, total_hours: 0, volunteers_count: 0 };

  return (
    <div className="space-y-16 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>PES University • DBMS Experiential Learning Level 3 Project</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
          Next-Gen <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Volunteer Matchmaking</span> & NGO Impact System
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Connecting passionate volunteers with verified NGO opportunities through <strong>384-dimensional semantic vector search</strong>, transactional shift coordination, and tamper-proof certificate verification.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4" />
            AI Semantic Opportunity Matcher
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 shadow-sm transition-all"
          >
            <Database className="w-4 h-4 text-emerald-600" />
            Interactive SQL & Analytics Lab
          </Link>
        </div>

        {/* Project Authors Banner */}
        <div className="pt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <strong>Rishi</strong> (PES1UG24AM224)
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            <strong>Rohanth</strong> (PES1UG24AM227)
          </span>
        </div>
      </section>

      {/* Real-Time Platform Stats Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{stats.total_hours}+</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Verified Volunteer Hours</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{stats.verified_ngos}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Government Verified NGOs</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{stats.active_opps}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Active Community Campaigns</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{stats.beneficiaries}+</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Lives Directly Impacted</p>
          </div>
        </div>
      </section>

      {/* Dual Database Architecture Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-700/50">
          <div className="max-w-3xl">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider border border-emerald-500/30">
              Database Paradigm Design (Option 2)
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-4 leading-snug">
              Relational SQL Engine + 384-d Vector Similarity Search
            </h2>
            <p className="text-slate-300 text-sm mt-3 leading-relaxed">
              Designed specifically according to the PES University DBMS Experiential Learning guidelines. Combining ACID transactions for shift capacity booking, database triggers for automatic hour accumulation, complex analytical views, and dense vector embeddings for semantic skill matchmaking.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <Database className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Relational SQL Paradigm</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>ACID Transactions:</strong> Shift enrollment and certificate generation.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Active Triggers:</strong> Automatic hour accumulation and audit trail.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Multi-table Views:</strong> Dynamic leaderboards and occupancy tracking.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Advanced Queries:</strong> Correlated subqueries and window rankings.</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white text-base">Vector Search Paradigm</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span><strong>Dense Embeddings:</strong> 384-dimensional volunteer & opportunity vectors.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span><strong>Cosine Similarity:</strong> Precise semantic matching on skills and causes.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span><strong>Hybrid Search:</strong> 60% Semantic + 20% City + 10% Experience + 10% Trust.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span><strong>Dynamic Re-indexing:</strong> Live embedding generation on profile updates.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Navigation Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Explore System Portals</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/volunteer/dashboard"
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors flex items-center justify-between">
              Volunteer Portal
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Manage skills, view verified hours, track volunteer tier (Bronze to Platinum), and inspect cryptographic certificates.
            </p>
          </Link>

          <Link
            href="/ngo/dashboard"
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center justify-between">
              NGO Operations Portal
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Post opportunities with auto-vector generation, coordinate shift rosters, mark attendance, and issue SHA-256 verified certificates.
            </p>
          </Link>

          <Link
            href="/admin/dashboard"
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors flex items-center justify-between">
              Admin & SQL Lab
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Verify NGO applications, inspect security audit logs, and execute the 6 Advanced SQL Queries live in the interactive laboratory.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}

