import React from 'react';
import { 
  ShieldAlert, 
  Search, 
  CreditCard, 
  AlertOctagon, 
  Activity, 
  BarChart3,
  ArrowUp,
  ShieldCheck,
  Radio
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'analyzer', label: 'Fraud Analyzer', icon: Search },
    { id: 'safepay', label: 'SafePay Sandbox', icon: CreditCard },
    { id: 'dashboard', label: 'Live Stream & Graph', icon: Activity },
    { id: 'metrics', label: 'Model Card', icon: BarChart3 }
  ];

  return (
    <header className="sticky top-0 z-50 w-full px-3 sm:px-6 pt-3 pb-1">
      <div className="max-w-7xl mx-auto">
        {/* Scamadviser Floating White Nav Bar */}
        <div className="bg-white text-gray-900 rounded-2xl sm:rounded-full px-4 sm:px-6 py-2.5 shadow-2xl shadow-black/60 flex items-center justify-between gap-3 border border-gray-100">
          
          {/* Logo */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer flex-shrink-0"
            onClick={() => setActiveTab('analyzer')}
          >
            {/* Scamadviser shield emblem (Black & Red diamond shield) */}
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center relative overflow-hidden shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-black opacity-90" />
              <ShieldAlert className="w-5 h-5 text-white relative z-10" />
            </div>
            <div className="leading-tight">
              <span className="text-base sm:text-lg font-black tracking-tight text-black font-sans uppercase">
                SCAM<span className="text-red-600">SHIELD</span>
              </span>
            </div>
          </div>

          {/* Mini Search Pill (Scamadviser look) */}
          <div 
            onClick={() => setActiveTab('analyzer')}
            className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200/80 border border-gray-200 text-xs text-gray-500 cursor-pointer transition-all w-64"
          >
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">Paste SMS alert or message to check...</span>
            <div className="ml-auto w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
              <ArrowUp className="w-3 h-3" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-3 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-black text-white shadow-sm'
                      : 'text-gray-700 hover:text-black hover:bg-gray-100'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Red CTA Button: Already Paid? 1930 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setActiveTab('already-paid')}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold text-white transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'already-paid'
                  ? 'bg-black text-white ring-2 ring-red-600'
                  : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Already Paid? (1930)</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
