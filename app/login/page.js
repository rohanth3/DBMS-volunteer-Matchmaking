'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeartHandshake, Shield, User, Building2, Sparkles, CheckCircle2, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const demoAccounts = [
    {
      id: 'usr-admin-1',
      name: 'Rishi (PES1UG24AM224)',
      role: 'ADMIN',
      email: 'rishi.admin@pes.edu',
      password: 'Password@123',
      desc: 'Platform Administrator • Approves NGOs, inspects triggers & executes SQL'
    },
    {
      id: 'usr-vol-rishi',
      name: 'Rishi (PES1UG24AM224)',
      role: 'VOLUNTEER',
      email: 'rishi@pes.edu',
      password: 'Password@123',
      desc: 'Volunteer • CS Student • STEM & Coding Mentor'
    },
    {
      id: 'usr-vol-rohanth',
      name: 'Rohanth (PES1UG24AM227)',
      role: 'VOLUNTEER',
      email: 'rohanth@pes.edu',
      password: 'Password@123',
      desc: 'Volunteer • First Aid Responder • Healthcare & Animal Welfare'
    },
    {
      id: 'ngo-001',
      name: 'Bright Futures Trust',
      role: 'NGO',
      email: 'contact@brightfutures.org',
      password: 'Password@123',
      desc: 'Verified Education NGO • Posts opportunities, verifies roster & issues certs'
    }
  ];

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg(data.message);
        setTimeout(() => {
          if (data.user.role === 'NGO') {
            router.push('/ngo/dashboard');
          } else if (data.user.role === 'ADMIN') {
            router.push('/admin/dashboard');
          } else {
            router.push('/volunteer/dashboard');
          }
          router.refresh();
        }, 600);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
          <HeartHandshake className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Sign In to VolunTrack<span className="text-emerald-600">.AI</span>
        </h1>
        <p className="text-xs text-slate-500">
          PES University • DBMS Level 3 Verified Authentication (MySQL 8.0 + Bcrypt)
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs text-center font-medium">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs text-center font-medium">
          {successMsg}
        </div>
      )}

      {/* Real Email / Password Credential Form */}
      <form onSubmit={handleLogin} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rishi@pes.edu"
              required
              className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
        >
          {loading ? 'Authenticating with Bcrypt...' : 'Sign In Securely'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Quick-Fill Demonstration Credentials */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Quick-Fill Test Credentials (Evaluation)
          </h2>
        </div>
        <p className="text-[11px] text-slate-400">
          Click any account below to populate the credentials form and test bcrypt verification:
        </p>

        <div className="grid sm:grid-cols-2 gap-2 pt-1">
          {demoAccounts.map((acc) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => handleQuickFill(acc)}
              className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">{acc.name}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                  {acc.role}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">{acc.email}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
