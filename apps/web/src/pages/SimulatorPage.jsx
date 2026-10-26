import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  Bot, 
  User, 
  Send, 
  Lightbulb, 
  ShieldCheck, 
  Award, 
  AlertTriangle, 
  RotateCcw,
  Sparkles,
  Target,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SimulatorPage() {
  const [scenario, setScenario] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputReply, setInputReply] = useState('');
  const [turnCount, setTurnCount] = useState(1);
  const [showHints, setShowHints] = useState(true);
  const [sessionDebrief, setSessionDebrief] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Quick reply suggestions
  const SUGGESTED_REPLIES = [
    "I never share OTPs or passwords over the phone. I will verify at my home branch.",
    "Which official circular or FIR number is this? Provide your government officer ID.",
    "I will not click any third-party links or download AnyDesk. I am reporting this number to 1930.",
    "My OTP is 849204." // deliberate bad choice for testing failure
  ];

  const startDrill = async (scenarioId = null, difficulty = null) => {
    setLoading(true);
    setSessionDebrief(null);
    setMessages([]);
    setTurnCount(1);

    try {
      const res = await fetch('/api/sim/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenarioId, difficulty: difficulty })
      });
      const data = await res.json();
      setScenario(data.scenario);
      setMessages([
        {
          sender: 'scammer',
          text: data.scenario.initial_message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      fetchProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/sim/profile');
      const data = await res.json();
      setUserProfile(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    startDrill();
  }, []);

  const handleSendReply = async (textToSend = inputReply) => {
    if (!textToSend.trim() || !scenario) return;

    const userMsg = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputReply('');
    setLoading(true);

    try {
      const res = await fetch('/api/sim/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: scenario.id,
          user_reply: textToSend,
          turn_number: turnCount
        })
      });
      const turnRes = await res.json();

      const scammerMsg = {
        sender: 'scammer',
        text: turnRes.scammer_reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, scammerMsg]);
      setTurnCount((c) => c + 1);

      if (turnRes.status === 'passed' || turnRes.status === 'failed') {
        setSessionDebrief(turnRes);
        fetchProfile();
        if (turnRes.status === 'passed') {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Gamepad2 className="w-7 h-7 text-cyan-400" />
            <span>Adaptive Scam Simulator</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Roleplay against simulated scammer personas. A Bayesian Bandit dynamically serves drills based on your weakest resistance habits.
          </p>
        </div>

        {userProfile && (
          <div className="flex items-center gap-3 bg-gray-900/90 border border-gray-800 p-3 rounded-2xl shadow-lg">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold block">
                Your Resistance Score
              </span>
              <span className="text-xl font-mono font-bold text-white">
                {userProfile.resistance_score} <span className="text-xs text-gray-500">/ 100</span>
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Chat Interface */}
        <div className="lg:col-span-8 flex flex-col h-[650px] glass-panel rounded-3xl border border-gray-800 shadow-2xl overflow-hidden">
          {/* Chat Header */}
          {scenario && (
            <div className="p-4 bg-gray-900/90 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white font-bold shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{scenario.persona_name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                      scenario.difficulty === 'hard'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : scenario.difficulty === 'medium'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {scenario.difficulty}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono">
                    Scenario: {scenario.title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHints(!showHints)}
                  className={`p-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
                    showHints 
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' 
                      : 'bg-gray-800 border-gray-700 text-gray-400'
                  }`}
                  title="Toggle live defense hints"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span className="hidden sm:inline">Hints</span>
                </button>
                <button
                  onClick={() => startDrill()}
                  className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
                  title="Restart / Next Scenario"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {messages.map((m, idx) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs flex-shrink-0 ${
                    isUser ? 'bg-cyan-600 text-white' : 'bg-rose-900/60 text-rose-200 border border-rose-700/50'
                  }`}>
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className={`max-w-[78%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-cyan-600 text-white rounded-tr-none'
                      : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-none'
                  }`}>
                    <p>{m.text}</p>
                    <span className={`block text-[10px] mt-1 font-mono text-right ${
                      isUser ? 'text-cyan-200' : 'text-gray-500'
                    }`}>
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Suggestion Pills */}
          {!sessionDebrief && (
            <div className="px-4 py-2 bg-gray-950/60 border-t border-gray-800/80 flex flex-wrap gap-1.5">
              <span className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1 mr-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> Quick Replies:
              </span>
              {SUGGESTED_REPLIES.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => handleSendReply(reply)}
                  className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-[11px] text-gray-300 hover:text-white transition-all text-left truncate max-w-xs"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Reply Input Bar */}
          <div className="p-4 bg-gray-900/90 border-t border-gray-800">
            {sessionDebrief ? (
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${
                  sessionDebrief.passed ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  Drill Concluded: {sessionDebrief.passed ? 'Threat Neutralized' : 'Account Compromised'}
                </span>
                <button
                  onClick={() => startDrill()}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-600/20"
                >
                  <span>Next Adaptive Drill (Thompson Sampling)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputReply}
                  onChange={(e) => setInputReply(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                  placeholder="Type your response to the caller / message..."
                  className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60"
                />
                <button
                  onClick={() => handleSendReply()}
                  disabled={loading || !inputReply.trim()}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Hints, Skill Profile & Debrief */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Scenario Hints */}
          {showHints && scenario && scenario.hints && (
            <div className="glass-panel rounded-2xl p-5 border border-amber-500/30 shadow-lg shadow-amber-500/5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Live Defensive Clues
                </h4>
              </div>
              <ul className="space-y-2 text-xs text-gray-300">
                {scenario.hints.map((hint, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{hint}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* End-of-Session Debrief Banner */}
          {sessionDebrief && (
            <div className={`p-5 rounded-2xl border animate-in zoom-in-95 duration-200 ${
              sessionDebrief.passed 
                ? 'bg-emerald-950/30 border-emerald-500/40' 
                : 'bg-rose-950/30 border-rose-500/40'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Award className={`w-5 h-5 ${sessionDebrief.passed ? 'text-emerald-400' : 'text-rose-400'}`} />
                <h4 className="text-sm font-bold text-white">
                  Evaluation: {sessionDebrief.user_defense}
                </h4>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed mb-3">
                {sessionDebrief.debrief}
              </p>
              <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-gray-800">
                <span className="text-gray-400">Resistance Score Delta:</span>
                <span className={`font-bold ${sessionDebrief.score_delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {sessionDebrief.score_delta >= 0 ? `+${sessionDebrief.score_delta}` : sessionDebrief.score_delta} pts
                </span>
              </div>
            </div>
          )}

          {/* Cyber Resistance Skill Breakdown */}
          {userProfile && userProfile.skills && (
            <div className="glass-panel rounded-2xl p-5 border border-gray-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-cyan-400" /> Defense Skill Metrics
              </h4>
              <div className="space-y-3 text-xs">
                {Object.entries(userProfile.skills).map(([sk, val]) => (
                  <div key={sk}>
                    <div className="flex justify-between text-gray-300 mb-1">
                      <span className="capitalize">{sk.replace('_', ' ')}</span>
                      <span className="font-mono text-cyan-400 font-semibold">{val}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Badges */}
          {userProfile && userProfile.badges && (
            <div className="glass-panel rounded-2xl p-5 border border-gray-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" /> Achievement Badges
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {userProfile.badges.map((b) => (
                  <div
                    key={b.id}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      b.earned
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-gray-900 border-gray-800 text-gray-600 opacity-60'
                    }`}
                  >
                    <span className="font-semibold block text-[11px]">{b.name}</span>
                    <span className="text-[10px] text-gray-400">{b.earned ? 'Unlocked' : 'Locked'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

