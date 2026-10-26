import React, { useState } from 'react';
import Navbar from './components/Navbar';
import AnalyzerPage from './pages/AnalyzerPage';
import SafePayPage from './pages/SafePayPage';
import AlreadyPaidPage from './pages/AlreadyPaidPage';
import DashboardPage from './pages/DashboardPage';
import MetricsPage from './pages/MetricsPage';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('analyzer');

  return (
    <div className="min-h-screen text-gray-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Floating Scamadviser-style Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Page Body */}
      <main className="flex-1">
        {activeTab === 'analyzer' && <AnalyzerPage />}
        {activeTab === 'safepay' && <SafePayPage />}
        {activeTab === 'already-paid' && <AlreadyPaidPage />}
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'metrics' && <MetricsPage />}
      </main>

      {/* Scamadviser Sleek Dark Footer */}
      <footer className="border-t border-[#1C1C24] bg-[#0A0A0E] py-8 mt-16 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-black flex items-center justify-center border border-red-600/40">
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
            </div>
            <span className="text-white font-bold tracking-tight">ScamShield AI</span>
            <span className="text-gray-500">— Too Good to be True? Check Before You Trust.</span>
          </div>

          <div className="flex items-center gap-6 text-[11px] text-gray-400">
            <span>FastAPI • GBDT • NetworkX • PaySim</span>
            <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              All Defense Nodes Active
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
