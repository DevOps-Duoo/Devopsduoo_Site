'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────────────

type MetricKey = 'cpu' | 'memory' | 'network' | 'errorRate';
type GamePhase = 'MENU' | 'PLAYING' | 'GAME_OVER';

interface Action {
  id: string;
  label: string;
  icon: string;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  icon: string;
  affectedMetric: MetricKey;
  correctAction: string;
  actions: Action[];
  difficulty: number;
  spikeRate: number;
}

interface IncidentLogEntry {
  title: string;
  icon: string;
  resolved: boolean;
  timestamp: number;
}

// ─── Incident Pool ──────────────────────────────────────────────────────────

const INCIDENTS: Incident[] = [
  {
    id: 'db_query_storm',
    title: 'Database Query Storm',
    description: 'A runaway aggregation query is consuming all available CPU on the primary RDS instance.',
    icon: '🗄️',
    affectedMetric: 'cpu',
    correctAction: 'kill_query',
    actions: [
      { id: 'kill_query', label: 'Kill Slow Query', icon: '🔪' },
      { id: 'restart_frontend', label: 'Restart Frontend', icon: '🔄' },
      { id: 'add_cdn', label: 'Add CDN Layer', icon: '🌐' },
    ],
    difficulty: 1,
    spikeRate: 18,
  },
  {
    id: 'memory_leak',
    title: 'Memory Leak in Worker',
    description: 'A background worker process has a memory leak and is consuming all available RAM.',
    icon: '🧠',
    affectedMetric: 'memory',
    correctAction: 'restart_service',
    actions: [
      { id: 'clear_cache', label: 'Clear Redis Cache', icon: '🧹' },
      { id: 'restart_service', label: 'Restart Service', icon: '♻️' },
      { id: 'scale_down', label: 'Scale Down Pods', icon: '📉' },
    ],
    difficulty: 1,
    spikeRate: 16,
  },
  {
    id: 'ddos_attack',
    title: 'DDoS Attack Detected',
    description: 'Massive spike in incoming requests from suspicious IPs. Network latency is through the roof.',
    icon: '🛡️',
    affectedMetric: 'network',
    correctAction: 'enable_waf',
    actions: [
      { id: 'enable_waf', label: 'Enable WAF Rules', icon: '🔒' },
      { id: 'increase_cpu', label: 'Scale Up CPU', icon: '⬆️' },
      { id: 'rollback', label: 'Rollback Deploy', icon: '⏪' },
    ],
    difficulty: 2,
    spikeRate: 22,
  },
  {
    id: 'bad_deploy',
    title: 'Bad Deployment (500s)',
    description: 'Latest deployment is returning HTTP 500 errors across all endpoints. Error rate climbing fast.',
    icon: '🚨',
    affectedMetric: 'errorRate',
    correctAction: 'rollback_deploy',
    actions: [
      { id: 'rollback_deploy', label: 'Rollback Deployment', icon: '⏪' },
      { id: 'flush_dns', label: 'Flush DNS Cache', icon: '🌐' },
      { id: 'restart_worker', label: 'Restart Workers', icon: '♻️' },
    ],
    difficulty: 1,
    spikeRate: 20,
  },
  {
    id: 'ssl_expiry',
    title: 'SSL Certificate Expiry',
    description: 'TLS certificate has expired on the load balancer. All HTTPS connections are failing.',
    icon: '🔐',
    affectedMetric: 'errorRate',
    correctAction: 'renew_cert',
    actions: [
      { id: 'renew_cert', label: 'Renew Certificate', icon: '📜' },
      { id: 'restart_lb', label: 'Restart Load Balancer', icon: '🔄' },
      { id: 'switch_http', label: 'Force HTTP Mode', icon: '⚠️' },
    ],
    difficulty: 2,
    spikeRate: 25,
  },
  {
    id: 'disk_io',
    title: 'Disk I/O Saturation',
    description: 'Storage IOPS maxed out. Write queue is backed up and blocking all compute operations.',
    icon: '💾',
    affectedMetric: 'cpu',
    correctAction: 'scale_storage',
    actions: [
      { id: 'scale_storage', label: 'Scale Storage IOPS', icon: '📦' },
      { id: 'kill_process', label: 'Kill Top Process', icon: '🔪' },
      { id: 'add_replica', label: 'Add Read Replica', icon: '📋' },
    ],
    difficulty: 3,
    spikeRate: 20,
  },
  {
    id: 'container_oom',
    title: 'Container OOM Kill',
    description: 'Kubernetes pods are getting OOM-killed. Memory limits are too low for current traffic.',
    icon: '📦',
    affectedMetric: 'memory',
    correctAction: 'increase_limits',
    actions: [
      { id: 'increase_limits', label: 'Increase Mem Limits', icon: '⬆️' },
      { id: 'drain_node', label: 'Drain Node', icon: '🚰' },
      { id: 'reduce_replicas', label: 'Reduce Replicas', icon: '📉' },
    ],
    difficulty: 2,
    spikeRate: 22,
  },
  {
    id: 'dns_failure',
    title: 'DNS Resolution Failure',
    description: 'Upstream DNS resolver is failing. Services cannot discover each other. Latency spiking.',
    icon: '🌐',
    affectedMetric: 'network',
    correctAction: 'flush_dns_cache',
    actions: [
      { id: 'flush_dns_cache', label: 'Flush DNS Cache', icon: '🧹' },
      { id: 'increase_timeout', label: 'Increase Timeouts', icon: '⏱️' },
      { id: 'restart_db', label: 'Restart Database', icon: '🗄️' },
    ],
    difficulty: 3,
    spikeRate: 18,
  },
  {
    id: 'log_overflow',
    title: 'Log Pipeline Overflow',
    description: 'Logging agent is consuming 100% CPU writing debug-level logs to the aggregation pipeline.',
    icon: '📝',
    affectedMetric: 'cpu',
    correctAction: 'rate_limit_logs',
    actions: [
      { id: 'rate_limit_logs', label: 'Rate Limit Logging', icon: '🚦' },
      { id: 'increase_instance', label: 'Scale Up Instance', icon: '⬆️' },
      { id: 'disable_monitoring', label: 'Disable Monitoring', icon: '🔕' },
    ],
    difficulty: 3,
    spikeRate: 15,
  },
  {
    id: 'api_rate_limit',
    title: 'API Gateway Throttling',
    description: 'Third-party API rate limits exceeded. Upstream requests are timing out and backing up.',
    icon: '🚦',
    affectedMetric: 'network',
    correctAction: 'scale_gateway',
    actions: [
      { id: 'scale_gateway', label: 'Scale API Gateway', icon: '📈' },
      { id: 'clear_queue', label: 'Clear Message Queue', icon: '🧹' },
      { id: 'restart_proxy', label: 'Restart Proxy', icon: '🔄' },
    ],
    difficulty: 4,
    spikeRate: 20,
  },
  {
    id: 'cache_stampede',
    title: 'Cache Stampede',
    description: 'Redis cache expired simultaneously. All requests are hitting the database directly.',
    icon: '🏃',
    affectedMetric: 'cpu',
    correctAction: 'warm_cache',
    actions: [
      { id: 'warm_cache', label: 'Warm Cache Layer', icon: '🔥' },
      { id: 'increase_db', label: 'Scale Database', icon: '⬆️' },
      { id: 'block_traffic', label: 'Block All Traffic', icon: '🚫' },
    ],
    difficulty: 4,
    spikeRate: 24,
  },
  {
    id: 'zombie_process',
    title: 'Zombie Processes',
    description: 'Orphaned zombie processes are consuming memory and not releasing handles.',
    icon: '🧟',
    affectedMetric: 'memory',
    correctAction: 'reap_zombies',
    actions: [
      { id: 'reap_zombies', label: 'Reap Zombie PIDs', icon: '🔪' },
      { id: 'add_swap', label: 'Add Swap Space', icon: '💾' },
      { id: 'restart_cluster', label: 'Restart Cluster', icon: '🔄' },
    ],
    difficulty: 5,
    spikeRate: 14,
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getMetricColor(value: number): string {
  if (value < 50) return '#22C55E';
  if (value < 75) return '#FFC300';
  return '#F43F5E';
}

function getMetricLabel(key: MetricKey): string {
  switch (key) {
    case 'cpu': return 'CPU Usage';
    case 'memory': return 'Memory';
    case 'network': return 'Latency';
    case 'errorRate': return 'Error Rate';
  }
}

function getMetricUnit(key: MetricKey): string {
  switch (key) {
    case 'cpu': return '%';
    case 'memory': return '%';
    case 'network': return 'ms';
    case 'errorRate': return '%';
  }
}

function getMetricIcon(key: MetricKey): string {
  switch (key) {
    case 'cpu': return '⚡';
    case 'memory': return '🧠';
    case 'network': return '🌐';
    case 'errorRate': return '❌';
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ─── Sparkline Component ────────────────────────────────────────────────────

function Sparkline({ data, color, danger }: { data: number[]; color: string; danger: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    if (data.length < 2) return;

    const max = 100;
    const stepX = w / (data.length - 1);

    // Fill gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, danger ? 'rgba(244,63,94,0.3)' : `${color}33`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.beginPath();
    ctx.moveTo(0, h);
    data.forEach((v, i) => {
      const x = i * stepX;
      const y = h - (v / max) * h;
      ctx.lineTo(x, y);
    });
    ctx.lineTo((data.length - 1) * stepX, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = i * stepX;
      const y = h - (v / max) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = danger ? '#F43F5E' : color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Glow dot at end
    const lastX = (data.length - 1) * stepX;
    const lastY = h - (data[data.length - 1] / max) * h;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = danger ? '#F43F5E' : color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
    ctx.fillStyle = danger ? 'rgba(244,63,94,0.3)' : `${color}44`;
    ctx.fill();
  }, [data, color, danger]);

  return (
    <canvas
      ref={canvasRef}
      className="dd-sparkline"
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}

// ─── Circular Gauge ─────────────────────────────────────────────────────────

function CircularGauge({ value, color, size = 100 }: { value: number; color: string; size?: number }) {
  const angle = (value / 100) * 360;
  const bgTrack = 'rgba(255,255,255,0.07)';

  return (
    <div
      className="dd-gauge"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `conic-gradient(${color} 0deg, ${color} ${angle}deg, ${bgTrack} ${angle}deg, ${bgTrack} 360deg)`,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: size - 14,
          height: size - 14,
          borderRadius: '50%',
          backgroundColor: '#0a0a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
        }}
      >
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.125rem', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      </div>
    </div>
  );
}

// ─── Main Game Component ────────────────────────────────────────────────────

export default function DashboardDetective() {
  // -- Game state --
  const [gamePhase, setGamePhase] = useState<GamePhase>('MENU');
  const [cpu, setCpu] = useState(30);
  const [memory, setMemory] = useState(40);
  const [network, setNetwork] = useState(25);
  const [errorRate, setErrorRate] = useState(5);
  const [systemHealth, setSystemHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [incidentLog, setIncidentLog] = useState<IncidentLogEntry[]>([]);
  const [wrongPick, setWrongPick] = useState(false);
  const [rightPick, setRightPick] = useState(false);
  const [shakeCard, setShakeCard] = useState<MetricKey | null>(null);

  // Sparkline histories
  const [cpuHistory, setCpuHistory] = useState<number[]>([30]);
  const [memHistory, setMemHistory] = useState<number[]>([40]);
  const [netHistory, setNetHistory] = useState<number[]>([25]);
  const [errHistory, setErrHistory] = useState<number[]>([5]);

  // Refs for interval
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickCountRef = useRef(0);
  const lastIncidentTickRef = useRef(0);
  const incidentActiveRef = useRef(false);
  const activeIncidentRef = useRef<Incident | null>(null);

  // Metric refs for reading latest values in interval
  const cpuRef = useRef(cpu);
  const memRef = useRef(memory);
  const netRef = useRef(network);
  const errRef = useRef(errorRate);

  // Keep refs in sync
  useEffect(() => {
    incidentActiveRef.current = activeIncident !== null;
    activeIncidentRef.current = activeIncident;
  }, [activeIncident]);

  useEffect(() => { cpuRef.current = cpu; }, [cpu]);
  useEffect(() => { memRef.current = memory; }, [memory]);
  useEffect(() => { netRef.current = network; }, [network]);
  useEffect(() => { errRef.current = errorRate; }, [errorRate]);

  // ─── Start Game ─────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    setCpu(30);
    setMemory(40);
    setNetwork(25);
    setErrorRate(5);
    setSystemHealth(100);
    setScore(0);
    setLevel(1);
    setTimeElapsed(0);
    setActiveIncident(null);
    setIncidentLog([]);
    setCpuHistory([30]);
    setMemHistory([40]);
    setNetHistory([25]);
    setErrHistory([5]);
    tickCountRef.current = 0;
    lastIncidentTickRef.current = 0;
    incidentActiveRef.current = false;
    activeIncidentRef.current = null;
    setWrongPick(false);
    setRightPick(false);
    setShakeCard(null);
    setGamePhase('PLAYING');
  }, []);

  // ─── Trigger Incident ───────────────────────────────────────────────────
  const triggerIncident = useCallback((currentLevel: number) => {
    const eligible = INCIDENTS.filter(i => i.difficulty <= currentLevel);
    const pick = eligible[Math.floor(Math.random() * eligible.length)];
    if (pick) {
      setActiveIncident(pick);
    }
  }, []);

  // ─── Apply Remediation ──────────────────────────────────────────────────
  const applyRemediation = useCallback((actionId: string) => {
    const incident = activeIncidentRef.current;
    if (!incident) return;

    if (actionId === incident.correctAction) {
      // SUCCESS
      setRightPick(true);
      setTimeout(() => setRightPick(false), 800);

      const levelBonus = level * 50;
      setScore(prev => prev + 100 + levelBonus);

      // Drop the affected metric to safe range
      switch (incident.affectedMetric) {
        case 'cpu': setCpu(randomBetween(25, 40)); break;
        case 'memory': setMemory(randomBetween(30, 45)); break;
        case 'network': setNetwork(randomBetween(15, 35)); break;
        case 'errorRate': setErrorRate(randomBetween(2, 8)); break;
      }

      setIncidentLog(prev => [
        { title: incident.title, icon: incident.icon, resolved: true, timestamp: tickCountRef.current },
        ...prev,
      ].slice(0, 20));

      setActiveIncident(null);
      lastIncidentTickRef.current = tickCountRef.current;
    } else {
      // WRONG
      setWrongPick(true);
      setShakeCard(incident.affectedMetric);
      setTimeout(() => { setWrongPick(false); setShakeCard(null); }, 600);

      setIncidentLog(prev => [
        { title: `Failed: ${incident.title}`, icon: '❌', resolved: false, timestamp: tickCountRef.current },
        ...prev,
      ].slice(0, 20));
    }
  }, [level]);

  // ─── Game Loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'PLAYING') {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      return;
    }

    gameLoopRef.current = setInterval(() => {
      tickCountRef.current += 1;
      const tick = tickCountRef.current;

      setTimeElapsed(tick);

      // Calculate level
      let currentLevel = 1;
      if (tick > 180) currentLevel = 5;
      else if (tick > 120) currentLevel = 4;
      else if (tick > 60) currentLevel = 3;
      else if (tick > 30) currentLevel = 2;
      setLevel(currentLevel);

      const incident = activeIncidentRef.current;

      // Update metrics
      if (incident) {
        const rate = incident.spikeRate + (currentLevel - 1) * 2;

        setCpu(prev => {
          const val = incident.affectedMetric === 'cpu'
            ? clamp(prev + randomBetween(rate - 5, rate), 0, 100)
            : clamp(prev + randomBetween(-5, 5), 15, 55);
          return val;
        });
        setMemory(prev => {
          const val = incident.affectedMetric === 'memory'
            ? clamp(prev + randomBetween(rate - 5, rate), 0, 100)
            : clamp(prev + randomBetween(-4, 4), 25, 55);
          return val;
        });
        setNetwork(prev => {
          const val = incident.affectedMetric === 'network'
            ? clamp(prev + randomBetween(rate - 5, rate), 0, 100)
            : clamp(prev + randomBetween(-6, 6), 10, 45);
          return val;
        });
        setErrorRate(prev => {
          const val = incident.affectedMetric === 'errorRate'
            ? clamp(prev + randomBetween(rate - 5, rate), 0, 100)
            : clamp(prev + randomBetween(-3, 3), 1, 15);
          return val;
        });
      } else {
        setCpu(prev => clamp(prev + randomBetween(-8, 8), 18, 42));
        setMemory(prev => clamp(prev + randomBetween(-6, 6), 28, 48));
        setNetwork(prev => clamp(prev + randomBetween(-7, 7), 12, 38));
        setErrorRate(prev => clamp(prev + randomBetween(-3, 3), 1, 10));
      }

      // Damage system health if any metric is critical
      if (cpuRef.current >= 95 || memRef.current >= 95 || netRef.current >= 95 || errRef.current >= 95) {
        setSystemHealth(prev => Math.max(0, prev - 20));
      }

      // Maybe trigger an incident
      if (!incidentActiveRef.current) {
        const ticksSinceLastIncident = tick - lastIncidentTickRef.current;
        let incidentThreshold = 15;
        if (currentLevel >= 2) incidentThreshold = 12;
        if (currentLevel >= 3) incidentThreshold = 9;
        if (currentLevel >= 4) incidentThreshold = 7;
        if (currentLevel >= 5) incidentThreshold = 5;

        if (ticksSinceLastIncident >= incidentThreshold) {
          if (Math.random() < 0.4 + (currentLevel * 0.1)) {
            triggerIncident(currentLevel);
            lastIncidentTickRef.current = tick;
          }
        }
      }
    }, 1000);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gamePhase, triggerIncident]);

  // Sync sparkline histories
  useEffect(() => {
    if (gamePhase === 'PLAYING') setCpuHistory(prev => [...prev.slice(-19), cpu]);
  }, [cpu, gamePhase]);
  useEffect(() => {
    if (gamePhase === 'PLAYING') setMemHistory(prev => [...prev.slice(-19), memory]);
  }, [memory, gamePhase]);
  useEffect(() => {
    if (gamePhase === 'PLAYING') setNetHistory(prev => [...prev.slice(-19), network]);
  }, [network, gamePhase]);
  useEffect(() => {
    if (gamePhase === 'PLAYING') setErrHistory(prev => [...prev.slice(-19), errorRate]);
  }, [errorRate, gamePhase]);

  // Check game over
  useEffect(() => {
    if (gamePhase === 'PLAYING' && systemHealth <= 0) {
      setGamePhase('GAME_OVER');
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
  }, [systemHealth, gamePhase]);

  // ─── Health bar color ───────────────────────────────────────────────────
  const healthColor = systemHealth > 60 ? '#22C55E' : systemHealth > 30 ? '#FFC300' : '#F43F5E';
  const isCritical = systemHealth <= 30;

  // ─── Metric data helper ─────────────────────────────────────────────────
  const metrics: { key: MetricKey; value: number; history: number[] }[] = [
    { key: 'cpu', value: cpu, history: cpuHistory },
    { key: 'memory', value: memory, history: memHistory },
    { key: 'network', value: network, history: netHistory },
    { key: 'errorRate', value: errorRate, history: errHistory },
  ];

  // ═════════════════════════════════════════════════════════════════════════
  //  INLINE STYLES (avoids all global CSS conflicts)
  // ═════════════════════════════════════════════════════════════════════════
  const gameStyles = `
    .dd-root, .dd-root * {
      -webkit-user-select: auto !important;
      -moz-user-select: auto !important;
      -ms-user-select: auto !important;
      user-select: auto !important;
      -webkit-touch-callout: default !important;
    }
    .dd-root ::selection {
      background: rgba(59, 130, 246, 0.3) !important;
    }
    .dd-root button {
      pointer-events: auto !important;
      cursor: pointer !important;
    }
    .dd-root a {
      pointer-events: auto !important;
      cursor: pointer !important;
    }
    @keyframes dd-slideIn {
      from { opacity: 0; transform: translateX(30px) scale(0.95); }
      to { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes dd-cardPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
      50% { box-shadow: 0 0 20px 4px rgba(244, 63, 94, 0.15); }
    }
    @keyframes dd-shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
      20%, 40%, 60%, 80% { transform: translateX(3px); }
    }
    @keyframes dd-criticalPulse {
      0%, 100% { filter: brightness(1); }
      50% { filter: brightness(0.92); }
    }
    @keyframes dd-float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-12px); }
    }
    @keyframes dd-ping {
      0% { opacity: 1; }
      100% { opacity: 0; }
    }
    .dd-shake { animation: dd-shake 0.5s ease-in-out; }
    .dd-critical { animation: dd-criticalPulse 2s ease-in-out infinite; }
    .dd-root ::-webkit-scrollbar { width: 4px; }
    .dd-root ::-webkit-scrollbar-track { background: transparent; }
    .dd-root ::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.3); border-radius: 2px; }
  `;

  // ═════════════════════════════════════════════════════════════════════════
  //  MENU SCREEN
  // ═════════════════════════════════════════════════════════════════════════
  if (gamePhase === 'MENU') {
    return (
      <div className="dd-root" style={{ minHeight: '100vh', backgroundColor: '#030712', color: '#fff', overflow: 'hidden', position: 'relative', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
        <style dangerouslySetInnerHTML={{ __html: gameStyles }} />

        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(rgba(51,153,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(51,153,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        {/* Floating orbs */}
        <div style={{ position: 'absolute', top: 80, left: '25%', width: 384, height: 384, background: 'rgba(59,130,246,0.08)', borderRadius: '50%', filter: 'blur(120px)' }} />
        <div style={{ position: 'absolute', bottom: 80, right: '25%', width: 320, height: 320, background: 'rgba(16,185,129,0.08)', borderRadius: '50%', filter: 'blur(100px)' }} />

        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '104px 16px 24px' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(96,165,250,0.2)', color: '#93c5fd', fontSize: 14, fontWeight: 500, padding: '6px 16px', borderRadius: 9999, marginBottom: 32 }}>
            <span style={{ width: 8, height: 8, background: '#60a5fa', borderRadius: '50%', animation: 'dd-float 3s ease-in-out infinite' }} />
            Interactive DevOps Simulation
          </div>

          {/* Title */}
          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 900, textAlign: 'center', marginBottom: 16, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            <span style={{ background: 'linear-gradient(135deg, #60a5fa, #06b6d4, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Dashboard
            </span>
            <br />
            <span style={{ color: '#fff' }}>Detective</span>
          </h1>

          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', color: '#9ca3af', textAlign: 'center', maxWidth: 640, marginBottom: 40, lineHeight: 1.7 }}>
            You&apos;re the on-call engineer. Metrics are spiking, alerts are firing, and production is on the edge.
            <span style={{ color: '#fff', fontWeight: 500 }}> Can you keep the systems alive?</span>
          </p>

          {/* Preview dashboard mockup */}
          <div style={{ width: '100%', maxWidth: 540, marginBottom: 40 }}>
            <div style={{ background: 'rgba(17,24,39,0.8)', border: '1px solid rgba(55,65,81,0.6)', borderRadius: 16, padding: 20, backdropFilter: 'blur(12px)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'CPU', value: '32%' },
                  { label: 'MEM', value: '41%' },
                  { label: 'NET', value: '28ms' },
                  { label: 'ERR', value: '3%' },
                ].map((m, i) => (
                  <div key={i} style={{ background: 'rgba(31,41,55,0.6)', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid rgba(55,65,81,0.4)' }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#22C55E' }}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ height: 8, background: '#1f2937', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, #22c55e, #4ade80)', borderRadius: 9999, width: '100%' }} />
              </div>
              <div style={{ fontSize: 10, color: '#6b7280', marginTop: 6, textAlign: 'center' }}>SYSTEM HEALTH — 100%</div>
            </div>
          </div>

          {/* How it works */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, maxWidth: 640, width: '100%', marginBottom: 40 }}>
            {[
              { step: '01', title: 'Monitor', desc: 'Watch real-time metrics on your dashboard', icon: '📊' },
              { step: '02', title: 'Detect', desc: 'Spot the spikes and identify the root cause', icon: '🔍' },
              { step: '03', title: 'Remediate', desc: 'Pick the right fix before production crashes', icon: '🔧' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(17,24,39,0.6)', border: '1px solid rgba(55,65,81,0.5)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 11, color: '#60a5fa', fontFamily: 'monospace', marginBottom: 4 }}>STEP {s.step}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{s.desc}</div>
              </div>
            ))}
          </div>

          {/* Start Button */}
          <button
            id="start-game-btn"
            onClick={startGame}
            style={{
              padding: '16px 48px', background: 'linear-gradient(135deg, #2563eb, #06b6d4)', color: '#fff',
              fontWeight: 700, fontSize: 18, borderRadius: 16, border: 'none', cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(37,99,235,0.3)', transition: 'all 0.3s ease',
              transform: 'translateY(0)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(37,99,235,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(37,99,235,0.3)'; }}
          >
            🚀 Start Mission
          </button>

          <p style={{ fontSize: 12, color: '#4b5563', marginTop: 16 }}>No sign-up required. 100% client-side.</p>

          {/* Back to home */}
          <Link href="/" style={{ fontSize: 13, color: '#6b7280', marginTop: 24, textDecoration: 'none', transition: 'color 0.2s' }}>
            ← Back to DevOps Duoo
          </Link>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  //  GAME OVER SCREEN
  // ═════════════════════════════════════════════════════════════════════════
  if (gamePhase === 'GAME_OVER') {
    const incidentsResolved = incidentLog.filter(i => i.resolved).length;
    const incidentsFailed = incidentLog.filter(i => !i.resolved).length;

    return (
      <div className="dd-root" style={{ minHeight: '100vh', backgroundColor: '#030712', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '104px 16px 24px', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
        <style dangerouslySetInnerHTML={{ __html: gameStyles }} />

        {/* Red ambient glow */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(127,29,29,0.15), transparent)' }} />
        <div style={{ position: 'absolute', top: '33%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, background: 'rgba(239,68,68,0.08)', borderRadius: '50%', filter: 'blur(150px)' }} />

        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 480 }}>
          {/* Crash icon */}
          <div style={{ fontSize: 72, marginBottom: 24 }}>💥</div>

          <h2 style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', fontWeight: 900, marginBottom: 12 }}>
            <span style={{ background: 'linear-gradient(135deg, #f87171, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              System Down
            </span>
          </h2>
          <p style={{ color: '#9ca3af', fontSize: 18, marginBottom: 32 }}>Production went offline. The PagerDuty is still ringing.</p>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
            {[
              { label: 'Final Score', value: score.toLocaleString(), color: '#60a5fa' },
              { label: 'Survival Time', value: formatTime(timeElapsed), color: '#22d3ee' },
              { label: 'Incidents Fixed', value: incidentsResolved.toString(), color: '#34d399' },
              { label: 'Fixes Failed', value: incidentsFailed.toString(), color: '#f87171' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(17,24,39,0.8)', border: '1px solid rgba(55,65,81,0.5)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Level reached */}
          <div style={{ background: 'rgba(17,24,39,0.6)', border: '1px solid rgba(55,65,81,0.4)', borderRadius: 12, padding: 12, marginBottom: 32 }}>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>LEVEL REACHED</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              {[1, 2, 3, 4, 5].map(l => (
                <div key={l} style={{ width: 32, height: 8, borderRadius: 9999, backgroundColor: l <= level ? '#3b82f6' : '#1f2937' }} />
              ))}
            </div>
            <div style={{ fontSize: 14, color: '#9ca3af', marginTop: 4 }}>Level {level} / 5</div>
          </div>

          {/* Actions */}
          <button
            id="try-again-btn"
            onClick={startGame}
            style={{
              width: '100%', padding: '16px 0', background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
              color: '#fff', fontWeight: 700, fontSize: 18, borderRadius: 16, border: 'none',
              cursor: 'pointer', boxShadow: '0 8px 32px rgba(37,99,235,0.3)', marginBottom: 12,
            }}
          >
            🔄 Try Again
          </button>

          <Link
            href="/contact"
            style={{
              display: 'block', width: '100%', padding: '12px 0', background: 'rgba(31,41,55,0.8)',
              border: '1px solid rgba(55,65,81,0.5)', color: '#d1d5db', fontWeight: 500,
              borderRadius: 16, textDecoration: 'none', fontSize: 14, textAlign: 'center',
            }}
          >
            Want to master real incident response? → Talk to DevOps Duoo
          </Link>

          <button
            onClick={() => setGamePhase('MENU')}
            style={{ background: 'none', border: 'none', fontSize: 13, color: '#4b5563', marginTop: 16, cursor: 'pointer' }}
          >
            ← Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  //  PLAYING SCREEN
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className={`dd-root ${isCritical ? 'dd-critical' : ''}`} style={{ minHeight: '100vh', backgroundColor: '#030712', color: '#fff', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, -apple-system, sans-serif', paddingTop: 80 }}>
      <style dangerouslySetInnerHTML={{ __html: gameStyles }} />

      {/* Critical vignette overlay */}
      {isCritical && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 40,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(244,63,94,0.15) 100%)',
        }} />
      )}

      {/* Success flash */}
      {rightPick && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50,
          background: 'rgba(16,185,129,0.12)', animation: 'dd-ping 0.5s ease-out forwards',
        }} />
      )}

      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'linear-gradient(rgba(51,153,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(51,153,255,0.3) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* ─── Top Status Bar ──────────────────────────────────────────── */}
        <div style={{
          background: 'rgba(17,24,39,0.92)', borderBottom: '1px solid rgba(55,65,81,0.5)',
          backdropFilter: 'blur(12px)', padding: '12px 16px', position: 'relative', zIndex: 30,
        }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {/* System Health */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', fontWeight: 500 }}>System Health</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: healthColor, fontVariantNumeric: 'tabular-nums' }}>{systemHealth}%</span>
              </div>
              <div style={{ height: 10, background: '#1f2937', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 9999, transition: 'all 0.5s ease-out',
                  width: `${systemHealth}%`, backgroundColor: healthColor,
                  boxShadow: `0 0 12px ${healthColor}66`,
                }} />
              </div>
            </div>

            {/* Score */}
            <div style={{ textAlign: 'center', padding: '0 16px', borderLeft: '1px solid rgba(55,65,81,0.5)' }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280' }}>Score</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#60a5fa', fontVariantNumeric: 'tabular-nums' }}>{score.toLocaleString()}</div>
            </div>

            {/* Level */}
            <div style={{ textAlign: 'center', padding: '0 16px', borderLeft: '1px solid rgba(55,65,81,0.5)' }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280' }}>Level</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 4 }}>
                {[1, 2, 3, 4, 5].map(l => (
                  <div key={l} style={{ width: 16, height: 6, borderRadius: 9999, backgroundColor: l <= level ? '#3b82f6' : '#1f2937', transition: 'background-color 0.3s' }} />
                ))}
              </div>
            </div>

            {/* Timer */}
            <div style={{ textAlign: 'center', padding: '0 16px', borderLeft: '1px solid rgba(55,65,81,0.5)' }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280' }}>Time</div>
              <div style={{ fontSize: 20, fontFamily: 'monospace', fontWeight: 700, color: '#d1d5db', fontVariantNumeric: 'tabular-nums' }}>{formatTime(timeElapsed)}</div>
            </div>

            {/* Status indicator */}
            <div style={{ paddingLeft: 16, borderLeft: '1px solid rgba(55,65,81,0.5)' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 500,
                background: activeIncident ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                color: activeIncident ? '#f87171' : '#34d399',
                border: `1px solid ${activeIncident ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: activeIncident ? '#f87171' : '#34d399' }} />
                {activeIncident ? 'INCIDENT' : 'STABLE'}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Main Content ────────────────────────────────────────────── */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            {/* Desktop layout */}
            <div className="dd-game-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
              {/* ─── Left: Metric Cards (2×2) ────────────────────────────── */}
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  {metrics.map(({ key, value, history }) => {
                    const color = getMetricColor(value);
                    const isDanger = value >= 75;
                    const isAffected = activeIncident?.affectedMetric === key;
                    const isShaking = shakeCard === key;

                    return (
                      <div
                        key={key}
                        id={`metric-card-${key}`}
                        className={isShaking ? 'dd-shake' : ''}
                        style={{
                          background: 'rgba(17,24,39,0.8)', borderRadius: 16, padding: 20,
                          backdropFilter: 'blur(12px)', transition: 'all 0.3s ease',
                          border: `1px solid ${isAffected ? 'rgba(239,68,68,0.5)' : isDanger ? 'rgba(245,158,11,0.35)' : 'rgba(55,65,81,0.5)'}`,
                          boxShadow: isAffected ? '0 0 24px rgba(239,68,68,0.1)' : 'none',
                          animation: isAffected ? 'dd-cardPulse 1.5s ease-in-out infinite' : 'none',
                        }}
                      >
                        {/* Card header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>{getMetricIcon(key)}</span>
                            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', fontWeight: 500 }}>
                              {getMetricLabel(key)}
                            </span>
                          </div>
                          {isAffected && (
                            <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', padding: '2px 8px', borderRadius: 9999, fontWeight: 500 }}>
                              AFFECTED
                            </span>
                          )}
                        </div>

                        {/* Gauge + Value */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
                          <CircularGauge value={value} color={color} size={80} />
                          <div>
                            <div style={{ fontSize: 30, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums' }}>
                              {value}
                              <span style={{ fontSize: 16, color: '#6b7280', fontWeight: 400 }}>{getMetricUnit(key)}</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                              {value < 50 ? 'Normal' : value < 75 ? 'Warning' : 'Critical'}
                            </div>
                          </div>
                        </div>

                        {/* Sparkline */}
                        <div style={{ height: 48, width: '100%' }}>
                          <Sparkline data={history} color={color} danger={isDanger} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ─── Activity Log ─────────────────────────────────────── */}
                <div style={{ marginTop: 20, background: 'rgba(17,24,39,0.8)', border: '1px solid rgba(55,65,81,0.5)', borderRadius: 16, padding: 20, backdropFilter: 'blur(12px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 14 }}>📋</span>
                    <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', fontWeight: 500 }}>Activity Log</span>
                  </div>
                  <div style={{ maxHeight: 144, overflowY: 'auto' }}>
                    {incidentLog.length === 0 ? (
                      <div style={{ fontSize: 12, color: '#4b5563', padding: '8px 0', textAlign: 'center' }}>Monitoring systems... All quiet.</div>
                    ) : (
                      incidentLog.map((entry, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '6px 12px', borderRadius: 8, marginBottom: 4,
                          background: entry.resolved ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                          color: entry.resolved ? '#34d399' : '#f87171',
                        }}>
                          <span>{entry.icon}</span>
                          <span style={{ flex: 1 }}>{entry.title}</span>
                          <span style={{ color: '#4b5563', fontFamily: 'monospace' }}>{formatTime(entry.timestamp)}</span>
                          <span style={{
                            fontSize: 10, padding: '2px 6px', borderRadius: 9999, fontWeight: 500,
                            background: entry.resolved ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                          }}>
                            {entry.resolved ? 'RESOLVED' : 'FAILED'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* ─── Right: Incident Panel ───────────────────────────────── */}
              <div>
                {activeIncident ? (
                  <div style={{
                    background: 'rgba(17,24,39,0.92)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 16,
                    overflow: 'hidden', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(239,68,68,0.05)',
                    animation: 'dd-slideIn 0.4s cubic-bezier(0.16,1,0.3,1)',
                  }}>
                    {/* Alert header */}
                    <div style={{ background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.15)', padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, background: '#ef4444', borderRadius: '50%', animation: 'dd-float 1s ease-in-out infinite' }} />
                        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#f87171', fontWeight: 700 }}>Incident Alert</span>
                      </div>
                    </div>

                    <div style={{ padding: 20 }}>
                      {/* Incident info */}
                      <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>{activeIncident.icon}</div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{activeIncident.title}</h3>
                        <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>{activeIncident.description}</p>
                      </div>

                      {/* Affected metric badge */}
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{getMetricIcon(activeIncident.affectedMetric)}</span>
                          <span style={{ fontSize: 12, color: '#f87171', fontWeight: 500 }}>
                            {getMetricLabel(activeIncident.affectedMetric)} SPIKING
                          </span>
                        </div>
                      </div>

                      {/* Remediation buttons */}
                      <div>
                        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', fontWeight: 500, marginBottom: 10 }}>
                          Choose Remediation
                        </div>
                        {activeIncident.actions.map((action) => (
                          <button
                            key={action.id}
                            id={`action-${action.id}`}
                            onClick={() => applyRemediation(action.id)}
                            style={{
                              width: '100%', textAlign: 'left', padding: '14px 16px', borderRadius: 12, marginBottom: 10,
                              background: 'rgba(31,41,55,0.6)', border: '1px solid rgba(55,65,81,0.4)',
                              cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 12,
                              color: '#e5e7eb',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; e.currentTarget.style.background = 'rgba(59,130,246,0.05)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(55,65,81,0.4)'; e.currentTarget.style.background = 'rgba(31,41,55,0.6)'; }}
                          >
                            <span style={{ fontSize: 20 }}>{action.icon}</span>
                            <span style={{ fontSize: 14, fontWeight: 500 }}>{action.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Urgency warning */}
                      <div style={{ marginTop: 16, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'rgba(248,113,113,0.8)' }}>
                          ⚠️ System health draining — act fast!
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(17,24,39,0.8)', border: '1px solid rgba(55,65,81,0.5)', borderRadius: 16, padding: 32, backdropFilter: 'blur(12px)', textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🛡️</div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#9ca3af', marginBottom: 8 }}>Systems Nominal</h3>
                    <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.6 }}>
                      All metrics within normal parameters. Stay vigilant — incidents can strike at any moment.
                    </p>
                    <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', animation: 'dd-float 2s ease-in-out infinite' }} />
                      <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 500 }}>Monitoring Active</span>
                    </div>
                  </div>
                )}

                {/* Quick stats */}
                <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: 'rgba(17,24,39,0.8)', border: '1px solid rgba(55,65,81,0.5)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resolved</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>
                      {incidentLog.filter(i => i.resolved).length}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(17,24,39,0.8)', border: '1px solid rgba(55,65,81,0.5)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Failed</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#f87171', fontVariantNumeric: 'tabular-nums' }}>
                      {incidentLog.filter(i => !i.resolved).length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive override for mobile */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1024px) {
          .dd-game-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .dd-game-grid div[style*="grid-template-columns: repeat(2"] { grid-template-columns: 1fr !important; }
        }
      `}} />
    </div>
  );
}
