import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, 
  PhoneCall, 
  Clock, 
  CheckSquare, 
  Square, 
  Copy, 
  Check, 
  ExternalLink, 
  FileText, 
  Lock, 
  ShieldAlert,
  Building2,
  ChevronRight
} from 'lucide-react';

const BANK_HELPLINES = [
  { bank: "State Bank of India (SBI)", tollfree: "18001234 / 18002100", smsBlock: "SMS BLOCK to 567676" },
  { bank: "HDFC Bank", tollfree: "18002026161 / 18001600", smsBlock: "Netbanking -> Security -> Freeze UPI" },
  { bank: "ICICI Bank", tollfree: "18001080", smsBlock: "iMobile -> Services -> Block Account" },
  { bank: "Axis Bank", tollfree: "18604195555 / 18605005555", smsBlock: "SMS BLOCK to 56161600" },
  { bank: "Punjab National Bank (PNB)", tollfree: "18001802222 / 18001032222", smsBlock: "Call 24x7 Emergency Cell" }
];

export default function AlreadyPaidPage() {
  // Golden 2-hour recovery timer (starts at 1h 48m 20s)
  const [secondsLeft, setSecondsLeft] = useState(108 * 60 + 20);
  const [checkedSteps, setCheckedSteps] = useState([false, false, false, false, false]);
  const [copiedLetter, setCopiedLetter] = useState(false);

  // Form states for complaint generator
  const [txnRef, setTxnRef] = useState('UPI749204829103');
  const [amount, setAmount] = useState('24500');
  const [scammerDetail, setScammerDetail] = useState('refund-desk99@okhdfcbank');
  const [bankName, setBankName] = useState('HDFC Bank');

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleStep = (idx) => {
    const copy = [...checkedSteps];
    copy[idx] = !copy[idx];
    setCheckedSteps(copy);
  };

  const progressPercent = Math.round((checkedSteps.filter(Boolean).length / checkedSteps.length) * 100);

  const complaintLetter = `To: The Branch Manager / Cyber Crime Cell, ${bankName}
Date: ${new Date().toLocaleDateString('en-GB')}
Subject: Urgent: Request for Immediate Freezing of Recipient Account & Reversal of Unauthorized UPI Transaction

Respected Sir/Madam,

I am writing to report a fraudulent digital transaction initiated under psychological deception and false pretext. The funds were siphoned off without legitimate consideration.

Details of Fraudulent Debit:
1. Transaction Reference (UTR / UPI Ref): ${txnRef}
2. Amount Debited: INR ${parseFloat(amount || 0).toLocaleString('en-IN')}
3. Recipient UPI ID / Account: ${scammerDetail}
4. Debiting Bank & Account: ${bankName}
5. National Cyber Crime Portal Acknowledgement: 1930 Helpline Contacted

In accordance with RBI Master Direction on Customer Protection – Limiting Liability in Unauthorized Electronic Banking Transactions (RBI/2017-18/15), I hereby report this incident within the Golden Window (zero-liability / immediate notification period).

I request you to coordinate immediately through NPCI and the beneficiary bank's Nodal Officer to freeze the disputed amount in the beneficiary account before cash-out or mule dispersal.

Yours sincerely,
[Your Full Name]
Phone: [Your Registered Phone Number]`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(complaintLetter);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Emergency Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-rose-950/80 via-red-900/60 to-gray-900 border border-rose-500/40 shadow-2xl mb-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-rose-600/30 text-rose-400 border border-rose-500/40 shadow-lg shadow-rose-600/30">
              <AlertOctagon className="w-10 h-10 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Emergency Incident Response
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white uppercase animate-pulse">
                  Already Paid?
                </span>
              </div>
              <p className="text-gray-300 text-sm mt-1 max-w-xl">
                The first 2 hours are the <strong className="text-rose-300 font-semibold">"Golden Window"</strong>. Banks and NPCI can intercept and freeze funds along the mule account chain before scammers execute cash-outs at ATMs or P2P crypto desks.
              </p>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-black/60 border border-rose-500/30 min-w-[200px]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-rose-300 flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-rose-400" /> Golden Window Left
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-wider">
              {formatTimer(secondsLeft)}
            </span>
            <span className="text-[10px] text-gray-400 mt-1">Act fast to recover stolen funds</span>
          </div>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 mb-8">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-gray-300 uppercase tracking-wider">
            Incident Recovery Checklist Progress
          </span>
          <span className="text-red-400 font-mono text-sm">{progressPercent}% Completed</span>
        </div>
        <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Action Checklist */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" /> Mandatory Recovery Steps
          </h2>

          {/* Step 1 */}
          <div 
            onClick={() => toggleStep(0)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              checkedSteps[0] 
                ? 'bg-emerald-950/20 border-emerald-500/40' 
                : 'bg-gray-900/80 border-gray-800 hover:border-gray-700'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <button className="mt-0.5 text-cyan-400">
                {checkedSteps[0] ? <CheckSquare className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5 text-gray-500" />}
              </button>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Step 1: Call 1930 National Cyber Crime Helpline</h3>
                  <a
                    href="tel:1930"
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Dial 1930
                  </a>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Managed by the Ministry of Home Affairs (I4C). Coordinates directly with bank nodal officers and NPCI to initiate emergency lien freezes on recipient accounts.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div 
            onClick={() => toggleStep(1)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              checkedSteps[1] 
                ? 'bg-emerald-950/20 border-emerald-500/40' 
                : 'bg-gray-900/80 border-gray-800 hover:border-gray-700'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <button className="mt-0.5 text-cyan-400">
                {checkedSteps[1] ? <CheckSquare className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5 text-gray-500" />}
              </button>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Step 2: Emergency Freeze Your Bank Account & UPI</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Call your debiting bank's 24x7 toll-free helpline. Request an instant freeze on internet banking and hotlist registered UPI VPAs to halt recurring auto-pay mandates.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div 
            onClick={() => toggleStep(2)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              checkedSteps[2] 
                ? 'bg-emerald-950/20 border-emerald-500/40' 
                : 'bg-gray-900/80 border-gray-800 hover:border-gray-700'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <button className="mt-0.5 text-cyan-400">
                {checkedSteps[2] ? <CheckSquare className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5 text-gray-500" />}
              </button>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Step 3: Lodge Incident on cybercrime.gov.in</h3>
                  <a
                    href="https://cybercrime.gov.in"
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
                  >
                    <span>cybercrime.gov.in</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Submit transaction reference (UTR), screenshot of communication, scammer phone number, and generate your 14-digit National Cyber Crime Acknowledgement Number.
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div 
            onClick={() => toggleStep(3)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              checkedSteps[3] 
                ? 'bg-emerald-950/20 border-emerald-500/40' 
                : 'bg-gray-900/80 border-gray-800 hover:border-gray-700'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <button className="mt-0.5 text-cyan-400">
                {checkedSteps[3] ? <CheckSquare className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5 text-gray-500" />}
              </button>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Step 4: Preserve Digital Evidence Integrity</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Do not delete chats, SMS alerts, or call logs. Take timestamped screenshots showing incoming sender handles, full URLs, and payment debit confirmation receipts.
                </p>
              </div>
            </div>
          </div>

          {/* Bank Emergency Helplines Accordion */}
          <div className="mt-6 glass-panel rounded-2xl p-5 border border-gray-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-cyan-400" /> Bank 24x7 Emergency Hotlines
            </h3>
            <div className="divide-y divide-gray-800 text-xs">
              {BANK_HELPLINES.map((bh, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-gray-200">{bh.bank}</span>
                  <div className="text-right">
                    <span className="font-mono text-cyan-400 font-bold block">{bh.tollfree}</span>
                    <span className="text-[10px] text-gray-500">{bh.smsBlock}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Automated FIR / Formal Complaint Generator */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-gray-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
              <FileText className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Automated Bank & Police Grievance Letter
                </h3>
                <p className="text-[11px] text-gray-400">Customized with statutory RBI Zero-Liability clauses</p>
              </div>
            </div>

            {/* Quick Fill Inputs */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Your Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full p-2 rounded-lg bg-gray-950 border border-gray-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Disputed Amount (₹)</label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2 rounded-lg bg-gray-950 border border-gray-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Transaction Ref (UTR)</label>
                <input
                  type="text"
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  className="w-full p-2 rounded-lg bg-gray-950 border border-gray-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Scammer VPA / Phone</label>
                <input
                  type="text"
                  value={scammerDetail}
                  onChange={(e) => setScammerDetail(e.target.value)}
                  className="w-full p-2 rounded-lg bg-gray-950 border border-gray-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Formatted Letter Output */}
            <div className="relative">
              <pre className="p-3.5 bg-gray-950/90 rounded-xl border border-gray-800 font-mono text-[11px] leading-relaxed text-gray-300 max-h-72 overflow-y-auto whitespace-pre-wrap select-all">
                {complaintLetter}
              </pre>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800">
            <button
              onClick={copyToClipboard}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
            >
              {copiedLetter ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Copied Letter to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Official Grievance Letter</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

