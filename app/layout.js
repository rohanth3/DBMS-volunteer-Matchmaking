import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'VolunTrack AI - NGO Volunteer Matchmaking Platform (PES DBMS Level 3)',
  description: 'AI-driven Semantic Volunteer Matchmaking & Impact Tracking using SQL & Vector Databases. Developed by Rishi (PES1UG24AM224) & Rohanth (PES1UG24AM227).',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
            <p className="font-semibold text-slate-700">
              Department of Computer Science & Engineering — PES University
            </p>
            <p>
              DBMS Experiential Learning Level 3 Project • Dual-Paradigm: Relational SQL (ACID, Triggers, Views) + 384-d Vector Similarity Search
            </p>
            <p className="text-slate-400">
              Team Members: <strong className="text-slate-600">Rishi</strong> (SRN: PES1UG24AM224) & <strong className="text-slate-600">Rohanth</strong> (SRN: PES1UG24AM227)
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

