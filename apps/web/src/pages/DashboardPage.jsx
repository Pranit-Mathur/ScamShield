import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Share2, 
  AlertTriangle, 
  ShieldAlert, 
  Zap, 
  RefreshCw, 
  RotateCcw,
  Radio, 
  TrendingUp, 
  Eye, 
  ArrowUpRight,
  Filter,
  CheckCircle2
} from 'lucide-react';

export default function DashboardPage() {
  const [transactions, setTransactions] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'flagged'
  const [isInjecting, setIsInjecting] = useState(false);
  const [attackToast, setAttackToast] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  const wsRef = useRef(null);

  // Fetch initial graph
  const fetchGraph = async () => {
    try {
      const res = await fetch('/api/txn/graph');
      const data = await res.json();
      setGraphData(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Connect WebSocket or fallback polling
  useEffect(() => {
    fetchGraph();

    // Initial batch of transactions
    fetch('/api/txn/stream-sample?count=10')
      .then(res => res.json())
      .then(data => {
        if (data.transactions) {
          setTransactions(data.transactions);
        }
      })
      .catch(console.error);

    // WebSocket connection to Gateway
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/stream`;
    
    let ws;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'transaction') {
            setTransactions((prev) => [msg.data, ...prev.slice(0, 24)]);
          } else if (msg.type === 'attack_injected') {
            fetchGraph();
            setAttackToast(msg.data.attack_summary);
            setTimeout(() => setAttackToast(null), 6000);
          }
        } catch (e) {
          // ignore
        }
      };

      ws.onclose = () => setWsConnected(false);
      ws.onerror = () => setWsConnected(false);
    } catch (e) {
      setWsConnected(false);
    }

    // Interval fallback to keep streaming fresh if ws is disconnected
    const fallbackInterval = setInterval(() => {
      fetch('/api/txn/stream-sample?count=1')
        .then(res => res.json())
        .then(data => {
          if (data.transactions && data.transactions.length > 0) {
            setTransactions(prev => [data.transactions[0], ...prev.slice(0, 24)]);
          }
        })
        .catch(() => {});
    }, 2500);

    return () => {
      if (ws) ws.close();
      clearInterval(fallbackInterval);
    };
  }, []);

  // Handle Inject Attack button
  const handleInjectAttack = async () => {
    setIsInjecting(true);
    try {
      const res = await fetch('/api/txn/inject-attack', { method: 'POST' });
      const data = await res.json();
      setAttackToast(data.attack_summary);
      if (data.graph) {
        setGraphData(data.graph);
      }
      if (data.attack_summary?.burst_transactions?.length > 0) {
        setTransactions((prev) => [...data.attack_summary.burst_transactions, ...prev.slice(0, 18)]);
      }
      setTimeout(() => setAttackToast(null), 8000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsInjecting(false);
    }
  };

  // Handle Reset Graph to Baseline
  const handleResetGraph = async () => {
    try {
      const res = await fetch('/api/txn/reset-graph', { method: 'POST' });
      const data = await res.json();
      if (data.graph) {
        setGraphData(data.graph);
      }
      setAttackToast(null);
      setSelectedNode(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Dynamic layout positioning logic in SVG coordinate system (Guaranteed zero node overlap)
  const getNodeCoordinates = (node, index, total) => {
    if (!graphData.nodes || graphData.nodes.length === 0) {
      return { x: 300, y: 200 };
    }

    const hasAttack = graphData.nodes.some(
      n => n.is_flagged || n.id.startsWith('victim') || n.id.startsWith('mule') || n.id.startsWith('exit')
    );

    if (!hasAttack) {
      // Circular / elliptical layout for baseline regular accounts
      const angle = (index / Math.max(1, total)) * 2 * Math.PI - Math.PI / 2;
      const radiusX = 220;
      const radiusY = 135;
      return {
        x: 300 + radiusX * Math.cos(angle),
        y: 200 + radiusY * Math.sin(angle)
      };
    }

    // Separate into topological tiers
    const victims = graphData.nodes.filter(n => n.id.startsWith('victim') || n.role === 'victim');
    const exits = graphData.nodes.filter(n => n.id.startsWith('exit') || n.role === 'exit_aggregator');
    const mules = graphData.nodes.filter(n => (n.id.startsWith('mule') || n.is_flagged) && !n.id.startsWith('exit'));
    const regular = graphData.nodes.filter(
      n => !n.id.startsWith('victim') && !n.id.startsWith('mule') && !n.id.startsWith('exit') && !n.is_flagged
    );

    // 1. Victims (Left Column: x = 70)
    const victimIdx = victims.findIndex(n => n.id === node.id);
    if (victimIdx !== -1) {
      const vCount = victims.length;
      const step = vCount > 1 ? 240 / (vCount - 1) : 0;
      return {
        x: 70,
        y: vCount === 1 ? 190 : 70 + victimIdx * step
      };
    }

    // 2. Mules (Middle Columns: dynamic spacing for peel chains vs. funnels)
    const muleIdx = mules.findIndex(n => n.id === node.id);
    if (muleIdx !== -1) {
      if (mules.length >= 3) {
        // Peel chain horizontal relay: x = 180, 290, 400
        const stepX = 220 / Math.max(1, mules.length - 1);
        return {
          x: 180 + muleIdx * stepX,
          y: 190 + (muleIdx % 2 === 1 ? -30 : 30)
        };
      }
      // Smurfing or 2-mule ring:
      const mCount = mules.length;
      const stepY = mCount > 1 ? 150 / (mCount - 1) : 0;
      return {
        x: 275,
        y: mCount === 1 ? 190 : 115 + muleIdx * stepY
      };
    }

    // 3. Exit Nodes (Right Column: x = 520)
    const exitIdx = exits.findIndex(n => n.id === node.id);
    if (exitIdx !== -1) {
      const eCount = exits.length;
      const stepY = eCount > 1 ? 130 / (eCount - 1) : 0;
      return {
        x: 520,
        y: eCount === 1 ? 190 : 125 + exitIdx * stepY
      };
    }

    // 4. Regular baseline nodes (Placed subtly along bottom baseline: y = 360)
    const regIdx = regular.findIndex(n => n.id === node.id);
    const rCount = regular.length;
    const stepX = rCount > 1 ? 480 / (rCount - 1) : 0;
    return {
      x: 60 + (regIdx !== -1 ? regIdx : index) * stepX,
      y: 360
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Live Status */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Activity className="w-7 h-7 text-red-500" />
              <span>Real-Time Transaction Stream & Mule Graph</span>
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold flex items-center gap-1.5 ${
              wsConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              <Radio className="w-3 h-3 animate-pulse" />
              <span>{wsConnected ? 'WebSocket Live' : 'Replay Active'}</span>
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Simulates PaySim high-frequency transaction stream scored by GBDT & Isolation Forest, with live Louvain mule-ring topology detection.
          </p>
        </div>

        {/* Live Attack Injection & Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchGraph}
            className="p-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 transition-all"
            title="Refresh Graph"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetGraph}
            className="px-3.5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white text-xs sm:text-sm font-semibold border border-gray-800 transition-all flex items-center gap-1.5"
            title="Reset Graph to Baseline"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
            <span>Reset Baseline</span>
          </button>

          <button
            onClick={handleInjectAttack}
            disabled={isInjecting}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-600/30 transition-all flex items-center gap-2"
          >
            <Zap className={`w-4 h-4 ${isInjecting ? 'animate-spin' : ''}`} />
            <span>Inject Mule Attack Burst</span>
          </button>
        </div>
      </div>

      {/* Attack Broadcast Alert Banner */}
      {attackToast && (
        <div className="mb-6 p-4 rounded-2xl bg-red-950/80 border border-red-500/60 shadow-xl shadow-red-950/40 flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-400 animate-bounce" />
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                COORDINATED FRAUD BURST DETECTED: {attackToast.attack_type}
              </h4>
              <p className="text-xs text-red-200">
                Laundered ₹{attackToast.total_laundered?.toLocaleString('en-IN')} across {attackToast.ring_size} coordinated accounts. Identified {attackToast.flagged_accounts?.length} high-velocity mule nodes.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-red-300 px-3 py-1 rounded-lg bg-red-900/50 border border-red-700">
            Peak Mule Risk: {Math.max(...(graphData.nodes?.map(n => n.mule_score) || [92]))}%
          </span>
        </div>
      )}

      {/* Graph and Top Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Interactive Account Graph */}
        <div className="lg:col-span-8 glass-panel rounded-3xl p-5 border border-gray-800 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-800 pb-3 mb-2 gap-2">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-red-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Directed Account Graph & Laundering Topology
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-sky-400">
                <span className="w-2 h-2 rounded-full bg-sky-400" /> Victims
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Mules
              </span>
              <span className="flex items-center gap-1 text-red-500">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Exits
              </span>
              <span className="flex items-center gap-1 text-gray-400">
                <span className="w-2 h-2 rounded-full bg-gray-500" /> Regular
              </span>
            </div>
          </div>

          {/* Topology flow indicator when attack is active */}
          {attackToast && (
            <div className="mb-2 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-red-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                Active Scenario: {attackToast.attack_type}
              </span>
              <span className="text-gray-400 font-mono">
                Flow: Left (Victims) ➔ Center (Mules) ➔ Right (Cashout)
              </span>
            </div>
          )}

          {/* SVG Canvas Graph */}
          <div className="relative w-full h-[360px] bg-gray-950/70 rounded-2xl border border-gray-900 overflow-hidden flex items-center justify-center">
            <svg viewBox="0 0 600 400" className="w-full h-full select-none">
              <defs>
                <marker
                  id="arrow-regular"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#4B5563" />
                </marker>
                <marker
                  id="arrow-fraud"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#DC2626" />
                </marker>
              </defs>

              {/* Render Directed Edges */}
              {graphData.edges.map((e, idx) => {
                const sIdx = graphData.nodes.findIndex(n => n.id === e.source);
                const tIdx = graphData.nodes.findIndex(n => n.id === e.target);
                if (sIdx === -1 || tIdx === -1) return null;

                const src = getNodeCoordinates(graphData.nodes[sIdx], sIdx, graphData.nodes.length);
                const tgt = getNodeCoordinates(graphData.nodes[tIdx], tIdx, graphData.nodes.length);

                return (
                  <g key={idx}>
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke={e.is_fraud ? '#DC2626' : '#374151'}
                      strokeWidth={e.is_fraud ? 2.5 : 1}
                      strokeDasharray={e.is_fraud ? '5 3' : 'none'}
                      markerEnd={e.is_fraud ? 'url(#arrow-fraud)' : 'url(#arrow-regular)'}
                      className={e.is_fraud ? 'animate-pulse' : ''}
                    />
                  </g>
                );
              })}

              {/* Render Nodes */}
              {graphData.nodes.map((node, idx) => {
                const coords = getNodeCoordinates(node, idx, graphData.nodes.length);
                const isSelected = selectedNode?.id === node.id;
                const isExit = node.id.startsWith('exit') || node.role === 'exit_aggregator';
                const isVictim = node.id.startsWith('victim') || node.role === 'victim';
                const isMule = (node.id.startsWith('mule') || node.is_flagged) && !isExit;

                let nodeFill = '#6B7280';
                if (isExit) nodeFill = '#DC2626';
                else if (isMule) nodeFill = '#F59E0B';
                else if (isVictim) nodeFill = '#38BDF8';

                return (
                  <g
                    key={node.id}
                    className="cursor-pointer transition-transform hover:scale-110"
                    onClick={() => setSelectedNode(node)}
                  >
                    {(isMule || isExit) && (
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r={18}
                        fill={isExit ? 'rgba(220, 38, 38, 0.25)' : 'rgba(245, 158, 11, 0.25)'}
                        className="animate-ping"
                      />
                    )}
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r={isSelected ? 14 : (isExit || isMule ? 11 : 8)}
                      fill={nodeFill}
                      stroke={isSelected ? '#FFFFFF' : '#07070A'}
                      strokeWidth={2}
                    />
                    <text
                      x={coords.x}
                      y={coords.y + 18}
                      textAnchor="middle"
                      fill={isExit ? '#FCA5A5' : isMule ? '#FDE68A' : isVictim ? '#BAE6FD' : '#9CA3AF'}
                      fontSize="9"
                      fontFamily="JetBrains Mono"
                      fontWeight={isExit || isMule ? 'bold' : 'normal'}
                    >
                      {node.label.slice(0, 11)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
            <span>Click any node to inspect degree, fan-in ratio, and mule probability.</span>
            <span>Graph nodes: {graphData.nodes.length} | Edges: {graphData.edges.length}</span>
          </div>
        </div>

        {/* Selected Node / Account Intelligence Drawer */}
        <div className="lg:col-span-4 glass-panel rounded-3xl p-5 border border-gray-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-gray-800 pb-3 mb-4">
              <Eye className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Account Forensic Dossier
              </h3>
            </div>

            {selectedNode ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800">
                  <span className="text-[10px] text-gray-500 uppercase block font-mono">Account Identifier</span>
                  <span className="text-sm font-bold font-mono text-white">{selectedNode.id}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-gray-950 border border-gray-800">
                    <span className="text-[10px] text-gray-500 block">Inflow (Fan-in)</span>
                    <span className="text-sm font-bold font-mono text-cyan-400">{selectedNode.in_degree} senders</span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-950 border border-gray-800">
                    <span className="text-[10px] text-gray-500 block">Outflow (Pass-thru)</span>
                    <span className="text-sm font-bold font-mono text-amber-400">{selectedNode.out_degree} receivers</span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border text-xs ${
                  selectedNode.is_flagged ? 'bg-rose-950/40 border-rose-500/40 text-rose-300' : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold">Mule-Likelihood Score:</span>
                    <span className="font-mono text-base font-extrabold">{selectedNode.mule_score}%</span>
                  </div>
                  <p className="text-[11px] text-gray-300">
                    Role: <strong className="capitalize">{selectedNode.role.replace('_', ' ')}</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-gray-500 space-y-2">
                <Share2 className="w-8 h-8 text-gray-700 mx-auto" />
                <p>Select any account node on the left to view transaction velocity and mule scoring.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-800 text-[11px] text-gray-500">
            Detected Fan-In Hubs: {graphData.detected_fan_in_hubs?.length || 0}
          </div>
        </div>
      </div>

      {/* Real-Time PaySim Transaction Stream Table */}
      <div className="glass-panel rounded-3xl p-6 border border-gray-800 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Live Stream Scorer (PaySim High-Frequency Replay)
              </h3>
              <p className="text-[11px] text-gray-400">Drill down into red rows for fraud waterfalls; green rows for normal consumer spending</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-950 p-1 rounded-xl border border-gray-800 text-xs">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterMode === 'all' ? 'bg-cyan-600 text-white font-semibold' : 'text-gray-400 hover:text-white'
                }`}
              >
                All Events ({transactions.length})
              </button>
              <button
                onClick={() => setFilterMode('flagged')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  filterMode === 'flagged' ? 'bg-rose-600 text-white font-semibold' : 'text-rose-400 hover:bg-rose-950/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                <span>Flagged Fraud Only ({transactions.filter(t => t.risk >= 50).length})</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 uppercase font-mono text-[10px]">
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Txn ID</th>
                <th className="py-2.5 px-3">Sender</th>
                <th className="py-2.5 px-3">Beneficiary</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Risk Assessment</th>
                <th className="py-2.5 px-3 text-right">SHAP Explain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900 font-mono">
              {transactions
                .filter(t => filterMode === 'all' || t.risk >= 50)
                .map((txn, idx) => {
                const isHighRisk = txn.risk >= 65;
                const isSuspicious = txn.risk >= 35 && txn.risk < 65;

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-gray-800/40 transition-colors ${
                      isHighRisk ? 'bg-rose-950/25 border-l-2 border-rose-500' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-gray-400">{txn.timestamp}</td>
                    <td className="py-3 px-3 text-cyan-400 font-semibold">{txn.txn_id}</td>
                    <td className="py-3 px-3 text-gray-300 font-sans">{txn.sender}</td>
                    <td className="py-3 px-3 text-gray-300 font-sans">{txn.recipient}</td>
                    <td className="py-3 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-800 text-gray-300">
                        {txn.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-white font-bold">
                      ₹{txn.amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isHighRisk
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : isSuspicious
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {txn.risk} / 100 ({txn.band?.toUpperCase()})
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedTxn(txn)}
                        className={`font-sans font-medium text-xs underline ${
                          isHighRisk ? 'text-rose-400 hover:text-rose-300 font-bold' : 'text-cyan-400 hover:text-cyan-300'
                        }`}
                      >
                        Drill Down
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SHAP Drilldown Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                PaySim GBDT SHAP Attribution
              </h3>
              <button
                onClick={() => setSelectedTxn(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 flex justify-between">
                <span className="text-gray-400">Transaction ID:</span>
                <span className="font-mono text-cyan-400 font-bold">{selectedTxn.txn_id}</span>
              </div>
              <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 flex justify-between">
                <span className="text-gray-400">Total Transferred:</span>
                <span className="font-mono text-white font-bold">₹{selectedTxn.amount?.toLocaleString('en-IN')}</span>
              </div>

              <div>
                <span className="text-gray-400 font-semibold block mb-2 uppercase text-[10px]">
                  Top SHAP Features:
                </span>
                <div className="space-y-1.5">
                  {(selectedTxn.top_features || []).map((f, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-gray-950 border border-gray-800 flex items-start justify-between">
                      <div>
                        <span className="font-bold text-gray-200 block">{f.feature}</span>
                        <span className="text-[11px] text-gray-400">{f.description}</span>
                      </div>
                      <span className="font-mono text-rose-400 text-[11px] font-bold">{f.impact}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedTxn(null)}
              className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold"
            >
              Close SHAP Waterfall
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

