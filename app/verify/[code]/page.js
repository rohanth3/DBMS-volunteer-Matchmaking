'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Award, CheckCircle2, XCircle, ShieldCheck, Printer, 
  ArrowLeft, Building2, User, Clock, Calendar
} from 'lucide-react';

export default function CertificateVerifyPage() {
  const { code } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (code) {
      verifyCode(code);
    }
  }, [code]);

  const verifyCode = async (hash) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/certificates/verify/${hash}`);
      const data = await res.json();
      if (data.success && data.certificate) {
        setCert(data.certificate);
      } else {
        setError(data.error || 'Invalid certificate hash');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Link
        href="/opportunities"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Platform
      </Link>

      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          Verifying certificate hash against database...
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl p-8 border border-rose-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Certificate Verification Failed</h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The cryptographic hash <code>{code}</code> was not found in the verified database ledger.
          </p>
          <div className="pt-2">
            <Link
              href="/opportunities"
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs"
            >
              Return to Explorer
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border-4 border-amber-600/30 shadow-2xl space-y-8 relative">
          {/* Top Verification Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Authenticity Verified
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Database Ledger Record • Cryptographically Sealed
                </p>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" /> Print Certificate (PDF)
            </button>
          </div>

          {/* Certificate Body */}
          <div className="border-2 border-dashed border-amber-500/50 p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-white via-amber-50/20 to-emerald-50/20 text-center space-y-6">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-widest text-slate-500 font-extrabold">
                Department of Computer Science & Engineering — PES University
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 uppercase tracking-wider">
                Certificate of Social Contribution
              </h2>
              <p className="text-xs text-slate-400 font-medium">This is proudly presented to</p>
            </div>

            <div>
              <p className="text-3xl sm:text-4xl font-bold text-emerald-800 underline decoration-emerald-500 decoration-4 underline-offset-8">
                {cert.volunteer_name}
              </p>
              <p className="text-xs text-slate-400 mt-2 font-mono">{cert.volunteer_email}</p>
            </div>

            <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              In grateful recognition for successfully completing <strong>{cert.total_hours_credited} hours</strong> of verified volunteer community service for the initiative <em>&ldquo;{cert.title}&rdquo;</em> under <strong>{cert.org_name}</strong>.
            </p>

            {/* Signature & Verification Seal Grid */}
            <div className="pt-8 grid sm:grid-cols-2 gap-8 text-xs text-slate-600 border-t border-slate-200">
              <div className="text-left space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Authorized Signatory</p>
                <p className="font-extrabold text-slate-900 text-sm">{cert.signatory_name}</p>
                <p className="text-slate-500">{cert.signatory_role}</p>
                <p className="text-emerald-700 font-semibold">{cert.org_name}</p>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Issuance Metadata</p>
                <p className="font-bold text-slate-800">Date: {cert.issued_date}</p>
                <p className="text-slate-500">Cause: {cert.cause_category}</p>
                <p className="text-emerald-600 font-mono text-[11px]">Status: Active & Valid</p>
              </div>
            </div>

            {/* Cryptographic SHA-256 Ledger Hash */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-500 break-all">
              Verification Code (SHA-256): {cert.certificate_code}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

