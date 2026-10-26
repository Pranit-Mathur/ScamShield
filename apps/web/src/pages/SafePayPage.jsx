import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldAlert,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Wallet,
  ChevronDown,
  Lightbulb,
  RefreshCw,
  Info,
  Layers,
  AlertCircle,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';

// ─── Scenario Library ────────────────────────────────────────────────────────
const SCENARIOS = [
  // ── GROUP A ────────────────────────────────────────────────────────────────
  {
    id: 'fake-refund',
    category: 'high',
    label: '💸 Fake Refund Approval',
    vpa: 'paytm-refund-approval@paytm',
    amount: '4999',
    note: 'Cashback Reversal Approval',
    is_new: true,
    badge: 'FRAUD',
    uniqueVerdict: `This VPA is a classic brand-impersonation trap. The prefix "paytm-refund-approval" mimics Paytm's official communication style to create false legitimacy. Legitimate refunds are NEVER initiated by a payee requesting YOU to send money — refunds always arrive as credits, not debit requests. The ₹4,999 amount is precisely calibrated to stay under the ₹5,000 UPI scrutiny threshold. Our lookalike model detected "paytm" as a spoofed brand token with 94% confidence.`,
    uniqueReasons: [
      'Brand impersonation: "paytm" in prefix spoofs a regulated PSP identity',
      'Reverse refund scam: no legitimate refund requires an outgoing payment',
      'Threshold manipulation: ₹4,999 engineered to avoid 5K-limit scrutiny',
    ],
  },
  {
    id: 'kyc-fee',
    category: 'high',
    label: '🏦 SBI KYC Fee Scam',
    vpa: 'sbi-kyc-desk@okhdfcbank',
    amount: '500',
    note: 'KYC verification fee — mandatory before account freeze',
    is_new: true,
    badge: 'FRAUD',
    uniqueVerdict: `"sbi-kyc-desk" impersonates the State Bank of India by embedding an official-sounding institutional keyword ("kyc-desk") in the VPA prefix while routing through an unaffiliated bank handle (@okhdfcbank). RBI mandates that KYC updates are free and conducted in-branch or via official apps — no fee is ever charged via UPI. The note's threat language ("account freeze") is a social engineering pressure tactic designed to bypass rational decision-making.`,
    uniqueReasons: [
      'Regulatory deception: SBI KYC is always free — no UPI fee exists',
      'Handle mismatch: SBI would use @sbi, not an HDFC handle',
      'Urgency coercion: "account freeze" threat is a social engineering trigger',
    ],
  },
  {
    id: 'digital-arrest',
    category: 'high',
    label: '👮 Digital Arrest Clearance',
    vpa: 'police.cyber.officer@ybl',
    amount: '75000',
    note: 'Digital arrest clearance — compliance mandatory',
    is_new: true,
    badge: 'FRAUD',
    uniqueVerdict: `"Digital arrest" is a widely-documented scam category (MHA Cyber Crime Division advisory 2024). No Indian law enforcement agency collects fines or clearance fees via UPI — all judicial payments are processed through official government payment portals with court receipts. The ₹75,000 amount is astronomically above the victim's normal transaction pattern. The VPA structure "police.cyber.officer" is a fabricated authority identity with no institutional registration.`,
    uniqueReasons: [
      'Digital arrest scam: Indian Police never collect payments via UPI',
      'Fabricated authority: no "cyber officer" UPI identity is legally registered',
      'Extreme amount spike: ₹75,000 is 62× your average transaction',
    ],
  },
  {
    id: 'rbi-settlement',
    category: 'high',
    label: '🏛️ RBI Settlement Escrow',
    vpa: 'rbi-refund-nodal@icici',
    amount: '20000',
    note: 'RBI settlement escrow — release pending clearance',
    is_new: true,
    badge: 'FRAUD',
    uniqueVerdict: `The Reserve Bank of India does not have a UPI VPA, does not hold escrow accounts accessible via retail payment apps, and never contacts individuals for fund transfers. "rbi-refund-nodal@icici" is a fabricated identity designed to exploit the high-trust reputation of India's central bank. Our URL/UPI lookalike model flagged "rbi" as a spoofed regulatory authority token. The ₹20,000 amount combined with "escrow" terminology signals an advance-fee fraud architecture.`,
    uniqueReasons: [
      'Regulatory impersonation: RBI has no retail UPI address — zero exceptions',
      'Advance-fee structure: "escrow release" demands payment to receive a larger sum',
      '"nodal" keyword: mimics banking jargon to project institutional legitimacy',
    ],
  },
  {
    id: 'lottery',
    category: 'high',
    label: '🎁 Amazon Lottery Prize',
    vpa: 'amazon-prize-claim@paytm',
    amount: '2000',
    note: 'Diwali lottery registration fee — claim ₹1,00,000 prize',
    is_new: true,
    badge: 'FRAUD',
    uniqueVerdict: `Amazon does not operate lotteries or prize draws in India, and no legitimate prize requires a registration fee payment to claim winnings. The VPA "amazon-prize-claim" is a well-known advance-fee fraud variant — you pay a small "registration fee" to receive a prize that never materialises. Our brand lookalike model detected "amazon" as a spoofed e-commerce token. The seasonal "Diwali lottery" framing exploits gift-giving cultural norms to lower victim suspicion.`,
    uniqueReasons: [
      'Prize scam: Amazon runs no UPI-based lotteries — this is unsolicited fraud',
      '"amazon" brand token spoofed in an unaffiliated @paytm handle',
      'Advance-fee trap: legitimate prizes never require upfront fee payment',
    ],
  },
  {
    id: 'support-scam',
    category: 'high',
    label: '📞 Paytm Care Support Fee',
    vpa: 'paytm-care@okhdfcbank',
    amount: '1500',
    note: 'Support ticket resolution — processing charge',
    is_new: true,
    badge: 'FRAUD',
    uniqueVerdict: `"paytm-care" combines the Paytm brand with a high-trust support keyword to simulate an official helpdesk identity. Crucially, the bank handle is @okhdfcbank — Paytm's actual UPI handle is @paytm, making this a cross-bank spoofing attempt. Paytm's official support never charges fees for ticket resolution; such fees are always free. Our deceptive-keyword model flagged "care" as a social-engineering token with 89% pattern confidence.`,
    uniqueReasons: [
      '"care" is a deceptive support keyword used to fabricate helpdesk authority',
      'Handle mismatch: Paytm support would use @paytm, not @okhdfcbank',
      'No legitimate support service charges UPI fees for issue resolution',
    ],
  },

  // ── GROUP B ────────────────────────────────────────────────────────────────
  {
    id: 'electricity-arrears',
    category: 'suspicious',
    label: '⚡ Electricity Bill Arrears',
    vpa: 'bescom-official@okhdfcbank',
    amount: '1450',
    note: 'Electricity arrears — pay before service disconnection',
    is_new: true,
    badge: 'SUSPICIOUS',
    uniqueVerdict: `This transaction has mixed signals. BESCOM (Bangalore Electricity Supply Company) does have official UPI IDs, but "bescom-official" on an @okhdfcbank handle is atypical — BESCOM payments are usually processed through bbpscou.rzp@icici or similar BBPS-registered handles. The disconnection threat note adds urgency pressure. We recommend verifying the exact payee ID on BESCOM's official website before proceeding. Risk is elevated but not definitively fraudulent.`,
    uniqueReasons: [
      '"official" keyword in VPA is a common impersonation signal',
      'Disconnection threat note triggers urgency bias — slow down and verify',
      'BESCOM\'s registered UPI handles differ from this format — cross-check official site',
    ],
  },
  {
    id: 'lottery-helpdesk',
    category: 'suspicious',
    label: '🎰 Lottery Processing Fee',
    vpa: 'lottery-helpdesk@ybl',
    amount: '999',
    note: 'Processing charge for prize disbursement',
    is_new: true,
    badge: 'SUSPICIOUS',
    uniqueVerdict: `The combination of "lottery" and "helpdesk" in the VPA is a medium-confidence fraud signal. Legitimate lottery operators in India are regulated by state governments and do not collect processing fees via personal UPI addresses. The ₹999 amount is a common psychological anchor — low enough to seem inconsequential, but sufficient to test victim compliance before escalating to larger demands. The note "prize disbursement" implies you will receive money, yet you are being asked to send it.`,
    uniqueReasons: [
      '"lottery-helpdesk" VPA has no registered institutional identity',
      'Prize-fee paradox: you cannot pay to receive money from a legitimate prize',
      '₹999 is a compliance-test amount used to identify susceptible victims',
    ],
  },
  {
    id: 'unknown-merchant',
    category: 'suspicious',
    label: '❓ Unknown Merchant Payment',
    vpa: 'quickpay-merchant@upi',
    amount: '3500',
    note: 'Invoice #QP-8821 — digital services',
    is_new: true,
    badge: 'SUSPICIOUS',
    uniqueVerdict: `This merchant UPI ID does not match any known registered business pattern. The @upi handle is a generic identifier and the VPA prefix "quickpay-merchant" is not verifiable against merchant directories. Invoice numbers on UPI notes are easily fabricated. While this could be a legitimate small business transaction, the lack of verifiable identity combined with a mid-range amount warrants caution. Verify by calling the merchant on a separately obtained phone number before proceeding.`,
    uniqueReasons: [
      'No verified merchant registration found for "quickpay-merchant@upi"',
      'Generic @upi handle with vague "digital services" note — no paper trail',
      'Unverified invoice number: always cross-confirm via phone before paying',
    ],
  },

  // ── GROUP C ────────────────────────────────────────────────────────────────
  {
    id: 'swiggy',
    category: 'low',
    label: '🍔 Swiggy Food Order',
    vpa: 'swiggy@okhdfcbank',
    amount: '420',
    note: 'Lunch order #94820',
    is_new: false,
    badge: 'SAFE',
    uniqueVerdict: `This is a verified, low-risk payment. "swiggy@okhdfcbank" matches Swiggy's registered NPCI merchant UPI handle. The amount (₹420) is well within normal food delivery spend patterns and consistent with your transaction history. The note references a valid order format. No impersonation signals, deceptive keywords, or suspicious patterns detected. Our model assigns 97% confidence that this is a legitimate merchant transaction.`,
    uniqueReasons: [
      'Registered merchant UPI: swiggy@okhdfcbank matches NPCI records',
      'Amount (₹420) is consistent with typical food delivery spend',
      'No deceptive keywords, brand spoofing, or urgency signals detected',
    ],
  },
  {
    id: 'zomato',
    category: 'low',
    label: '🍕 Zomato Dinner Order',
    vpa: 'zomato@icici',
    amount: '610',
    note: 'Dinner delivery — order #ZMT-77234',
    is_new: false,
    badge: 'SAFE',
    uniqueVerdict: `Zomato's @icici UPI handle is a registered payment partner. The ₹610 amount is consistent with dinner delivery pricing in metro areas, and the structured order note format (ZMT-XXXXX) matches Zomato's official order reference pattern. Zero fraud signals were detected across UPI lookalike analysis, note semantic classification, and transaction pattern scoring. This payment is cleared as safe to proceed.`,
    uniqueReasons: [
      'zomato@icici is a verified NPCI-registered merchant handle',
      'Amount and note structure match authentic Zomato order patterns',
      'All three model layers (UPI, Note, TXN) returned low-risk signals',
    ],
  },
  {
    id: 'rent',
    category: 'low',
    label: '🏠 Monthly Rent Transfer',
    vpa: 'landlordrahul@okhdfcbank',
    amount: '22000',
    note: 'October rent — Flat 4B',
    is_new: false,
    badge: 'SAFE',
    uniqueVerdict: `Recurring rent payments to known landlords are a recognised low-fraud transaction class. "landlordrahul@okhdfcbank" is a personal handle with no brand impersonation signals or deceptive keywords. Although the amount (₹22,000) is above the typical transaction average, it is consistent with metro rental market rates and expected for a known payee. The note clearly identifies the purpose (rent + flat reference). Since this payee has prior history, risk is substantially reduced. Proceed with confidence.`,
    uniqueReasons: [
      'No brand impersonation or deceptive UPI tokens detected in handle',
      'Note is specific and credible: flat reference + month clearly stated',
      'Known payee with prior transfer history significantly reduces risk score',
    ],
  },
  {
    id: 'phone-recharge',
    category: 'low',
    label: '📱 Airtel Recharge',
    vpa: 'airtel@airtel',
    amount: '599',
    note: 'Monthly prepaid recharge plan',
    is_new: false,
    badge: 'SAFE',
    uniqueVerdict: `Airtel's official UPI ID (airtel@airtel) is registered with NPCI as a telecom operator payment handle. Prepaid recharges of ₹599 match Airtel's standard unlimited validity plans widely available on their app. The note clearly states the purpose. All analysis layers — UPI identity validation, semantic note scoring, and transaction pattern matching — return clean results. This is a routine utility payment with negligible fraud risk.`,
    uniqueReasons: [
      'airtel@airtel is an official NPCI-registered telecom operator handle',
      '₹599 matches known Airtel prepaid plan pricing — no anomaly',
      'Purpose note is routine and non-manipulative — clean semantic score',
    ],
  },
];

const CATEGORY_CONFIG = {
  high:       { label: 'Group A', color: 'text-gray-400', dot: 'bg-gray-600' },
  suspicious: { label: 'Group B', color: 'text-gray-400', dot: 'bg-gray-600' },
  low:        { label: 'Group C', color: 'text-gray-400', dot: 'bg-gray-600' },
};

const BADGE_STYLES = {
  FRAUD:      'bg-rose-500/20 text-rose-300 border-rose-500/40',
  SUSPICIOUS: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  SAFE:       'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function SafePayPage() {
  const [payeeVpa, setPayeeVpa] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isNewPayee, setIsNewPayee] = useState(true);

  // Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);

  // Live as-you-type evaluation
  const [liveEvaluation, setLiveEvaluation] = useState(null);

  // Result state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Countdown
  const [countdown, setCountdown] = useState(5);

  // Debounced live VPA rating
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!payeeVpa.trim() || !payeeVpa.includes('@')) {
        setLiveEvaluation(null);
        return;
      }
      try {
        const res = await fetch('/api/payment/evaluate-input', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payee_vpa: payeeVpa, amount: parseFloat(amount) || 0, note }),
        });
        const data = await res.json();
        setLiveEvaluation(data);
      } catch (_) {}
    }, 220);
    return () => clearTimeout(handler);
  }, [payeeVpa, amount, note]);

  // Countdown for manual high-risk entries
  useEffect(() => {
    let t = null;
    if (result && result.requires_friction && countdown > 0) {
      t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    }
    return () => clearInterval(t);
  }, [result, countdown]);

  const selectScenario = (sc) => {
    setSelectedScenario(sc);
    setPayeeVpa(sc.vpa);
    setAmount(sc.amount);
    setNote(sc.note);
    setIsNewPayee(sc.is_new);
    setResult(null);
    setLiveEvaluation(null);
    setDropdownOpen(false);
    setCountdown(5);
  };

  const handleTransfer = async () => {
    if (!payeeVpa || !amount) return;
    setLoading(true);
    setResult(null);
    setCountdown(5);

    try {
      const res = await fetch('/api/payment/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payee_vpa: payeeVpa,
          amount: parseFloat(amount),
          note,
          payee_age_days: isNewPayee ? 2 : 180,
          is_new_payee: isNewPayee,
        }),
      });
      const data = await res.json();

      const merged = {
        ...data,
        scenario: selectedScenario || null,
        displayVerdict: selectedScenario
          ? selectedScenario.uniqueVerdict
          : data.band === 'low'
          ? `No significant fraud signals were detected for "${payeeVpa}". The UPI handle structure, payment note, and transaction amount all fall within normal parameters. Proceed with standard caution for any new payee.`
          : `Our AI engine detected potentially suspicious patterns in this payment request. The UPI ID "${payeeVpa}" triggered ${data.reasons?.length || 1} risk indicator(s). Review the red flags below before proceeding.`,
        displayReasons: selectedScenario
          ? selectedScenario.uniqueReasons
          : data.reasons,
      };

      if (data.band === 'low') {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 }, colors: ['#10b981', '#06b6d4'] });
      }

      setResult(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const grouped = ['high', 'suspicious', 'low'].map(cat => ({
    cat,
    items: SCENARIOS.filter(s => s.category === cat),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2.5">
          <CreditCard className="w-7 h-7 text-red-500" />
          <span>SafePay Sandbox</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1 max-w-2xl mx-auto">
          Pre-transfer AI interception that inspects UPI lookalikes, predatory notes, and brand spoofing.
          Select a demo scenario or enter details manually, then click <strong className="text-white">Transfer</strong> to see the unique risk verdict.
        </p>
      </div>

      {/* Two-column layout: Form | Scenario Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ── LEFT: Payment Form ──────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-5">

          {/* UPI Card */}
          <div className="rounded-3xl bg-gray-900/70 border border-gray-800 shadow-2xl p-6 sm:p-7 relative overflow-hidden">
            {/* Decorative gradient blob */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

            {/* Account Row */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-800 text-xs">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gray-800 text-cyan-400">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Primary Account</span>
                  <span className="text-white font-medium">HDFC Bank •• 4921</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block text-[11px]">Available Balance</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">₹45,000.00</span>
              </div>
            </div>

            {/* Payee VPA */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase text-gray-400">
                    Payee UPI ID (VPA)
                  </label>
                  {liveEvaluation && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                      liveEvaluation.live_risk >= 65
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : liveEvaluation.live_risk >= 35
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      Live Risk: {liveEvaluation.live_risk}/100 · {liveEvaluation.band}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={payeeVpa}
                  onChange={e => { setPayeeVpa(e.target.value); setSelectedScenario(null); setResult(null); }}
                  placeholder="e.g. paytm-refund@paytm or name@okhdfcbank"
                  className="w-full bg-gray-950/80 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/50 transition-all"
                />
              </div>

              {/* Live suggestions */}
              {liveEvaluation && liveEvaluation.suggestions && liveEvaluation.suggestions.length > 0 && !result && (
                <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                  liveEvaluation.live_risk >= 50
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                    : 'bg-red-950/20 border-red-500/30 text-red-200'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold text-[11px]">
                    <Lightbulb className="w-3.5 h-3.5 flex-shrink-0" />
                    Live Security Analysis:
                  </div>
                  <ul className="space-y-1 text-[11px] leading-relaxed">
                    {liveEvaluation.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-red-400 flex-shrink-0">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">
                  Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => { setAmount(e.target.value); setResult(null); }}
                    placeholder="0"
                    className="w-full bg-gray-950/80 border border-gray-800 rounded-xl pl-8 pr-4 py-3 text-lg font-bold font-mono text-white placeholder-gray-600 focus:outline-none focus:border-red-600 transition-all"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">
                  Add Note / Purpose
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={e => { setNote(e.target.value); setResult(null); }}
                  placeholder="e.g. Refund, Dinner, Advance fee"
                  className="w-full bg-gray-950/80 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-600 transition-all"
                />
              </div>

              {/* New Payee Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newPayee"
                  checked={isNewPayee}
                  onChange={e => setIsNewPayee(e.target.checked)}
                  className="rounded bg-gray-950 border-gray-800 text-red-600 focus:ring-red-600/40"
                />
                <label htmlFor="newPayee" className="text-xs text-gray-400 cursor-pointer">
                  Beneficiary has no previous transfer history (New Payee)
                </label>
              </div>
            </div>

            {/* Transfer Button */}
            <div className="mt-6">
              <button
                onClick={handleTransfer}
                disabled={loading || !payeeVpa || !amount}
                className="w-full py-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Running AI Verification...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Transfer ₹{parseFloat(amount || 0).toLocaleString('en-IN')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── VERDICT CARD (shown after Transfer click) ─────────────────── */}
          {result && (
            <div className={`rounded-2xl border p-5 sm:p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300 ${
              result.band === 'low'
                ? 'bg-emerald-950/30 border-emerald-500/40'
                : result.band === 'suspicious'
                ? 'bg-amber-950/30 border-amber-500/40'
                : 'bg-rose-950/30 border-rose-500/40'
            }`}>
              {/* Verdict Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  {result.band === 'low' ? (
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className={`p-2.5 rounded-xl ${result.band === 'suspicious' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h3 className={`font-bold text-base ${
                      result.band === 'low' ? 'text-emerald-300' : result.band === 'suspicious' ? 'text-amber-300' : 'text-rose-300'
                    }`}>
                      {result.band === 'low'
                        ? 'Transaction Cleared — Low Risk'
                        : result.band === 'suspicious'
                        ? 'Caution — Suspicious Transaction'
                        : 'BLOCKED — High Fraud Risk Detected'}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {result.scenario ? `Scenario: ${result.scenario.label}` : `VPA: ${result.payee_vpa}`}
                    </p>
                  </div>
                </div>

                {/* Big Score Badge */}
                <div className={`flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 font-mono font-extrabold text-xl ${
                  result.band === 'low'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : result.band === 'suspicious'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                }`}>
                  {result.risk}
                  <span className="text-[9px] font-normal text-gray-400 uppercase tracking-widest">Risk</span>
                </div>
              </div>

              {/* Risk Band Chip */}
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                  BADGE_STYLES[result.scenario?.badge || (result.band === 'low' ? 'SAFE' : result.band === 'suspicious' ? 'SUSPICIOUS' : 'FRAUD')]
                }`}>
                  {result.scenario?.badge || (result.band === 'low' ? 'SAFE' : result.band === 'suspicious' ? 'SUSPICIOUS' : 'HIGH RISK')}
                </span>
              </div>

              {/* Unique Verdict Narrative */}
              <div className={`p-4 rounded-xl border text-xs leading-relaxed mb-4 ${
                result.band === 'low'
                  ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-100/80'
                  : result.band === 'suspicious'
                  ? 'bg-amber-950/20 border-amber-900/50 text-amber-100/80'
                  : 'bg-rose-950/20 border-rose-900/50 text-rose-100/80'
              }`}>
                <div className="flex items-center gap-1.5 font-bold text-[11px] mb-2 uppercase tracking-wide opacity-70">
                  <Info className="w-3.5 h-3.5" /> AI Verdict Analysis
                </div>
                <p>{result.displayVerdict}</p>
              </div>

              {/* Top Reasons */}
              {result.displayReasons && result.displayReasons.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase text-gray-400 mb-2">
                    {result.band === 'low' ? '✅ Why This Passed' : '🚩 Top Red Flags Detected'}
                  </h4>
                  <div className="space-y-2">
                    {result.displayReasons.map((r, i) => (
                      <div key={i} className={`flex items-start gap-2 text-xs p-2.5 rounded-lg border ${
                        result.band === 'low'
                          ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-200'
                          : result.band === 'suspicious'
                          ? 'bg-amber-950/30 border-amber-900/40 text-amber-200'
                          : 'bg-rose-950/30 border-rose-900/40 text-rose-200'
                      }`}>
                        {result.band === 'low'
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          : <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        }
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Row */}
              <div className="mt-4 pt-4 border-t border-gray-800/60 flex gap-3">
                {result.band === 'low' ? (
                  <button
                    onClick={() => { setResult(null); setPayeeVpa(''); setAmount(''); setNote(''); setSelectedScenario(null); }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Payment Sent Successfully
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => { setResult(null); setPayeeVpa(''); setAmount(''); setNote(''); setSelectedScenario(null); }}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-600/20"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Cancel & Protect Funds
                    </button>
                    <button
                      onClick={() => setResult(null)}
                      disabled={countdown > 0}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        countdown > 0
                          ? 'bg-gray-800/40 border-gray-800 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {countdown > 0 ? `Wait ${countdown}s` : 'Proceed Anyway'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Scenario Selector Panel ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Panel Header */}
          <div className="rounded-2xl bg-gray-900/70 border border-gray-800 overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Demo Scenario Library</h2>
              <span className="ml-auto text-[11px] text-gray-500">{SCENARIOS.length} scenarios</span>
            </div>

            {/* Dropdown Trigger */}
            <div className="p-4">
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-950/80 border border-gray-700 hover:border-cyan-500/40 text-sm text-gray-300 hover:text-white transition-all"
              >
                <span className="truncate">
                  {selectedScenario ? selectedScenario.label : 'Select a payment scenario…'}
                </span>
                <ChevronDown className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="mt-2 rounded-xl border border-gray-700 bg-gray-950 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 max-h-72 overflow-y-auto">
                  {grouped.map(({ cat, items }) => (
                    <div key={cat}>
                      {/* Category header */}
                      <div className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 sticky top-0 bg-gray-950 ${CATEGORY_CONFIG[cat].color}`}>
                        <span className={`w-2 h-2 rounded-full ${CATEGORY_CONFIG[cat].dot}`} />
                        {CATEGORY_CONFIG[cat].label}
                      </div>
                      {items.map(sc => (
                        <button
                          key={sc.id}
                          onClick={() => selectScenario(sc)}
                          className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-xs hover:bg-gray-800/70 transition-colors ${
                            selectedScenario?.id === sc.id ? 'bg-gray-800/80' : ''
                          }`}
                        >
                          <span className="text-gray-200 truncate">{sc.label}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Scenario Preview */}
            {selectedScenario && (
              <div className="px-4 pb-4 space-y-3">
                <div className="rounded-xl p-4 border border-gray-700 bg-gray-950/60 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{selectedScenario.label}</span>
                  </div>
                  <div className="space-y-1 text-gray-400">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 w-12 flex-shrink-0">VPA:</span>
                      <span className="font-mono text-cyan-300 text-[11px] truncate">{selectedScenario.vpa}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 w-12 flex-shrink-0">Amount:</span>
                      <span className="font-mono text-white">₹{parseFloat(selectedScenario.amount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-600 w-12 flex-shrink-0 mt-0.5">Note:</span>
                      <span className="text-gray-300">{selectedScenario.note}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-700/60 text-[11px] italic text-gray-500">
                    Fields auto-filled → click Transfer to see AI verdict
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Explainer Card */}
          <div className="rounded-2xl bg-gray-900/50 border border-gray-800 p-5 text-xs text-gray-400 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-[11px] uppercase tracking-wide">
              <AlertCircle className="w-4 h-4" />
              How This Works
            </div>
            <ul className="space-y-2 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-cyan-400 flex-shrink-0">①</span>
                <span>Select a scenario or type your own VPA to get <strong className="text-white">live risk rating</strong> as you type.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-400 flex-shrink-0">②</span>
                <span>Click <strong className="text-white">Transfer</strong> to run the full AI pipeline: UPI lookalike model, note semantic classifier, and GBDT transaction scorer.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-400 flex-shrink-0">③</span>
                <span>Discover a <strong className="text-white">unique risk score + AI explanation</strong> — the verdict is revealed only after you click Transfer.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
