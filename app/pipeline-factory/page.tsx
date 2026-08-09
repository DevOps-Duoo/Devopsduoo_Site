'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ─── Types & Data ──────────────────────────────────────────────────────────

type StageId = 'build' | 'unit_test' | 'sast_scan' | 'staging' | 'approval' | 'production';
type GamePhase = 'SCENARIO_SELECT' | 'BUILDING' | 'RUNNING' | 'RESULT';

interface StageConfig {
  id: string;
  label: string;
  time: number; // in minutes
  cost: number; // in dollars
  risk?: 'HIGH' | 'LOW'; 
}

interface StageDef {
  id: StageId;
  label: string;
  icon: string;
  description: string;
  color: string;
  configs: StageConfig[];
}

const AVAILABLE_STAGES: StageDef[] = [
  { 
    id: 'build', label: 'Build', icon: '🔨', description: 'Compiles source code into a deployable artifact.', color: '#3b82f6',
    configs: [
      { id: 'standard', label: 'Standard Build', time: 5, cost: 0 },
      { id: 'cached', label: 'Docker Layer Caching', time: 1, cost: 5 },
      { id: 'web3', label: 'Web3 Blockchain Build', time: 15, cost: 80, risk: 'HIGH' },
    ]
  },
  { 
    id: 'unit_test', label: 'Unit Test', icon: '🧪', description: 'Runs automated tests to catch bugs early.', color: '#8b5cf6',
    configs: [
      { id: 'sequential', label: 'Sequential Tests', time: 8, cost: 0 },
      { id: 'matrix', label: 'Parallel Matrix', time: 2, cost: 15 },
      { id: 'ai', label: 'AI Test Generation', time: 25, cost: 50, risk: 'HIGH' },
    ]
  },
  { 
    id: 'sast_scan', label: 'Security Scan', icon: '🔒', description: 'Static analysis to find vulnerabilities.', color: '#f59e0b',
    configs: [
      { id: 'lint', label: 'Basic Linting', time: 1, cost: 0, risk: 'HIGH' },
      { id: 'deep', label: 'Deep SAST/DAST', time: 5, cost: 10, risk: 'LOW' },
      { id: 'manual_pen', label: 'Manual Pen-Test', time: 120, cost: 500, risk: 'LOW' },
    ]
  },
  { 
    id: 'compliance', label: 'Compliance', icon: '📋', description: 'Generates ISO-9001 compliance PDFs for management.', color: '#6366f1',
    configs: [
      { id: 'auto', label: 'Automated Audit', time: 5, cost: 20 },
      { id: 'manual_audit', label: 'Manual Paperwork', time: 60, cost: 0 },
    ]
  },
  { 
    id: 'staging', label: 'Staging', icon: '🚀', description: 'Deploys to a pre-production environment.', color: '#06b6d4',
    configs: [
      { id: 'micro', label: 'Micro VM', time: 2, cost: 2 },
      { id: 'replica', label: 'Replica Cluster', time: 1, cost: 10 },
      { id: 'chaos', label: 'Chaos Monkey', time: 1, cost: 1, risk: 'HIGH' },
    ]
  },
  { 
    id: 'approval', label: 'Approval', icon: '🛑', description: 'Requires a human to approve the release.', color: '#ec4899',
    configs: [
      { id: 'manager', label: 'Manager Review', time: 10, cost: 0 },
      { id: 'committee', label: 'Committee Vote', time: 1440, cost: 0 },
    ]
  },
  { 
    id: 'production', label: 'Production', icon: '🚢', description: 'Releases the code to live customers.', color: '#10b981',
    configs: [
      { id: 'rolling', label: 'Rolling Update', time: 5, cost: 0 },
      { id: 'blue_green', label: 'Blue/Green Deploy', time: 1, cost: 15 },
      { id: 'yolo', label: 'YOLO FTP Deploy', time: 0, cost: 0, risk: 'HIGH' },
    ]
  },
];

interface Scenario {
  id: string;
  name: string;
  description: string;
  budget: number;
  timeLimit: number;
  icon: string;
  hint?: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'startup', name: 'The Bootstrap Startup', icon: '🌱',
    description: 'Funds are running extremely low. You must deliver a secure pipeline without spending too much money. Speed is not the priority.',
    budget: 15, timeLimit: 30,
    hint: 'Security cannot be compromised, but everything else can run slowly. Use Manager Approvals to save money!'
  },
  {
    id: 'hotfix', name: 'Critical Hotfix', icon: '🔥',
    description: 'Production is down! You have plenty of budget, but the pipeline MUST finish lightning fast so we can push the fix.',
    budget: 100, timeLimit: 10,
    hint: 'Buy the most expensive and fastest configurations for every single stage. Parallelization is your best friend.'
  },
  {
    id: 'enterprise', name: 'Enterprise Standard', icon: '🏢',
    description: 'A balanced challenge. Maintain reasonable costs and time while ensuring enterprise-grade security and testing.',
    budget: 40, timeLimit: 15,
    hint: 'Balance is key. Spend money to speed up the slow stages (like Build and Test), but save money on fast stages (like Production).'
  }
];

interface PipelineNode {
  stage: StageDef;
  configId: string;
}

interface RunResult {
  success: boolean;
  title: string;
  message: string;
  failedNodeIndex?: number;
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function PipelineFactory() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('SCENARIO_SELECT');
  const [scenario, setScenario] = useState<Scenario | null>(null);
  
  const [pipeline, setPipeline] = useState<PipelineNode[]>([]);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number>(-1);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [editingNode, setEditingNode] = useState<number | null>(null);

  // Derived metrics
  const totalCost = pipeline.reduce((sum, node) => {
    const config = node.stage.configs.find(c => c.id === node.configId);
    return sum + (config?.cost || 0);
  }, 0);
  
  const totalTime = pipeline.reduce((sum, node) => {
    const config = node.stage.configs.find(c => c.id === node.configId);
    return sum + (config?.time || 0);
  }, 0);

  // ─── Logic ──────────────────────────────────────────────────────────────

  const selectScenario = (s: Scenario) => {
    setScenario(s);
    setPipeline([]);
    setRunResult(null);
    setGamePhase('BUILDING');
  };

  const addStage = (stage: StageDef) => {
    if (pipeline.length >= 8) return;
    setPipeline([...pipeline, { stage, configId: stage.configs[0].id }]);
  };

  const removeStage = (index: number) => {
    setPipeline(pipeline.filter((_, i) => i !== index));
    if (editingNode === index) setEditingNode(null);
  };

  const updateNodeConfig = (index: number, configId: string) => {
    const newPipe = [...pipeline];
    newPipe[index].configId = configId;
    setPipeline(newPipe);
    setEditingNode(null);
  };

  const runPipeline = () => {
    if (pipeline.length === 0 || !scenario) return;
    setGamePhase('RUNNING');
    setActiveNodeIndex(-1);
    setRunResult(null);
    setEditingNode(null);

    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex >= pipeline.length) {
        clearInterval(interval);
        evaluatePipeline();
        return;
      }

      setActiveNodeIndex(currentIndex);
      
      // Immediate failure check: first node must be build
      if (currentIndex === 0 && pipeline[0].stage.id !== 'build') {
        clearInterval(interval);
        setTimeout(() => {
          setRunResult({
            success: false,
            title: 'Build Failed!',
            message: 'Cannot deploy uncompiled code. The pipeline must start with a Build stage.',
            failedNodeIndex: 0,
          });
          setGamePhase('RESULT');
        }, 1000);
        return;
      }

      currentIndex++;
    }, 1200);
  };

  const evaluatePipeline = () => {
    setTimeout(() => {
      if (!scenario) return;

      const hasTest = pipeline.some(n => n.stage.id === 'unit_test');
      const hasSecurity = pipeline.some(n => n.stage.id === 'sast_scan');
      const hasStaging = pipeline.some(n => n.stage.id === 'staging');
      const hasApproval = pipeline.some(n => n.stage.id === 'approval');
      const hasProd = pipeline.some(n => n.stage.id === 'production');
      const prodIndex = pipeline.findIndex(n => n.stage.id === 'production');
      
      const highRiskSecurity = pipeline.some(n => n.stage.id === 'sast_scan' && n.stage.configs.find(c => c.id === n.configId)?.risk === 'HIGH');

      if (totalCost > scenario.budget) {
        setRunResult({
          success: false,
          title: 'Budget Exceeded! 💸',
          message: `Your pipeline cost $${totalCost}, but the budget was only $${scenario.budget}. Try using cheaper, less resource-intensive configurations.`,
        });
      } else if (totalTime > scenario.timeLimit) {
        setRunResult({
          success: false,
          title: 'Too Slow! 🐢',
          message: `The pipeline took ${totalTime} minutes, exceeding the ${scenario.timeLimit} minute limit. You need to pay for parallelization or caching!`,
        });
      } else if (!hasProd) {
        setRunResult({
          success: false, title: 'Incomplete',
          message: 'The pipeline finished, but never deployed to Production.',
          failedNodeIndex: pipeline.length - 1,
        });
      } else if (!hasTest) {
        setRunResult({
          success: false, title: 'Bugs in Production! 🐛',
          message: 'Code deployed to production without Unit Tests. It was full of bugs!',
          failedNodeIndex: prodIndex,
        });
      } else if (!hasSecurity) {
        setRunResult({
          success: false, title: 'No Security Gates! 🔓',
          message: 'You completely skipped the Security Scan. Hackers found a vulnerability.',
          failedNodeIndex: prodIndex,
        });
      } else if (pipeline.some(n => n.configId === 'web3')) {
        setRunResult({
          success: false, title: 'Web3 Bankruptcy! 📉',
          message: 'You spent a fortune compiling code onto the blockchain. The company went bankrupt paying gas fees.',
          failedNodeIndex: pipeline.findIndex(n => n.configId === 'web3'),
        });
      } else if (pipeline.some(n => n.configId === 'ai')) {
        setRunResult({
          success: false, title: 'AI Hallucination! 🤖',
          message: 'Your AI test generator hallucinated a nonexistent microservice. Tests hung forever in an infinite loop.',
          failedNodeIndex: pipeline.findIndex(n => n.configId === 'ai'),
        });
      } else if (pipeline.some(n => n.configId === 'chaos') && !pipeline.some(n => n.configId === 'replica')) {
        setRunResult({
          success: false, title: 'Chaos Destroyed Staging! 🐒',
          message: 'You unleashed the Chaos Monkey on a cheap Micro VM. It instantly deleted the entire server!',
          failedNodeIndex: pipeline.findIndex(n => n.configId === 'chaos'),
        });
      } else if (pipeline.some(n => n.configId === 'committee')) {
        setRunResult({
          success: false, title: 'Bureaucracy! 👔',
          message: 'The release committee took 24 hours to schedule a meeting. You completely missed the deployment window.',
          failedNodeIndex: pipeline.findIndex(n => n.configId === 'committee'),
        });
      } else if (pipeline.some(n => n.configId === 'yolo')) {
        setRunResult({
          success: false, title: 'YOLO Outage! 🔥',
          message: 'You dragged and dropped files to production over FTP without downtime protection. Half the files were corrupted.',
          failedNodeIndex: pipeline.findIndex(n => n.configId === 'yolo'),
        });
      } else if (highRiskSecurity) {
        setRunResult({
          success: false, title: 'Security Breach! 🏴‍☠️',
          message: 'You used cheap Basic Linting instead of Deep SAST. A critical vulnerability slipped through to production.',
          failedNodeIndex: pipeline.findIndex(n => n.stage.id === 'sast_scan'),
        });
      } else if (!hasStaging && !hasApproval) {
        setRunResult({
          success: false, title: 'Production Outage! 💥',
          message: 'Deploying straight to production without Staging or Approval caused an outage.',
          failedNodeIndex: prodIndex,
        });
      } else if (prodIndex !== pipeline.length - 1) {
         setRunResult({
          success: false, title: 'Illogical Order',
          message: 'You have stages running AFTER deploying to Production.',
          failedNodeIndex: prodIndex + 1,
        });
      } else {
        setRunResult({
          success: true,
          title: 'Perfect Architecture! 🎉',
          message: `You delivered the software securely, within budget ($${totalCost}/${scenario.budget}) and on time (${totalTime}m/${scenario.timeLimit}m)!`,
        });
      }

      setGamePhase('RESULT');
    }, 800);
  };

  // ═════════════════════════════════════════════════════════════════════════
  //  STYLES
  // ═════════════════════════════════════════════════════════════════════════
  const pfStyles = `
    .pf-root, .pf-root * { user-select: auto !important; }
    .pf-root button, .pf-root a { pointer-events: auto !important; cursor: pointer !important; }
    .pf-root ::-webkit-scrollbar { width: 6px; height: 6px; }
    .pf-root ::-webkit-scrollbar-track { background: rgba(31,41,55,0.5); border-radius: 4px; }
    .pf-root ::-webkit-scrollbar-thumb { background: rgba(107,114,128,0.5); border-radius: 4px; }
    
    @keyframes pf-pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.8; }
    }
    @keyframes pf-slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pf-conveyorMove {
      from { background-position: 0 0; }
      to { background-position: 40px 0; }
    }
    .pf-anim-slideUp { animation: pf-slideUp 0.4s ease-out forwards; }
  `;

  // ═════════════════════════════════════════════════════════════════════════
  //  SCENE 1: SCENARIO SELECT
  // ═════════════════════════════════════════════════════════════════════════
  if (gamePhase === 'SCENARIO_SELECT') {
    return (
      <div className="pf-root" style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '104px 16px 40px', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <style dangerouslySetInnerHTML={{ __html: pfStyles }} />
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 900, width: '100%' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, marginBottom: 16 }}>
            The Pipeline <span style={{ background: 'linear-gradient(135deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Architect</span>
          </h1>
          <p style={{ fontSize: 18, color: '#cbd5e1', marginBottom: 48, maxWidth: 600, margin: '0 auto 48px' }}>
            Balance cost, speed, and security. Choose a scenario below to begin designing your CI/CD architecture.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, textAlign: 'left' }}>
            {SCENARIOS.map(s => (
              <div
                key={s.id}
                onClick={() => selectScenario(s)}
                style={{
                  background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(51,65,85,0.6)', borderRadius: 16, padding: 24,
                  cursor: 'pointer', transition: 'all 0.3s', backdropFilter: 'blur(8px)',
                  display: 'flex', flexDirection: 'column'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(56,189,248,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(51,65,85,0.6)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ fontSize: 40, marginBottom: 16 }}>{s.icon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#f8fafc' }}>{s.name}</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, marginBottom: 24, flex: 1 }}>{s.description}</p>
                
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1, background: 'rgba(15,23,42,0.5)', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Budget</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981' }}>${s.budget}</div>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(15,23,42,0.5)', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Time Limit</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b' }}>{s.timeLimit}m</div>
                  </div>
                </div>

                {s.hint && (
                  <details style={{ marginTop: 16, cursor: 'pointer' }} onClick={e => e.stopPropagation()}>
                    <summary style={{ fontSize: 12, color: '#38bdf8', fontWeight: 600, outline: 'none', userSelect: 'none' }}>💡 Need a hint?</summary>
                    <div style={{ marginTop: 8, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', padding: '8px 12px', borderRadius: 8, fontSize: 12, color: '#bae6fd', lineHeight: 1.4 }}>
                      {s.hint}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: 40 }}>
            <Link href="/" style={{ fontSize: 14, color: '#64748b', textDecoration: 'none' }}>← Back to DevOps Duoo</Link>
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  //  SCENE 2/3: BUILDING & RUNNING
  // ═════════════════════════════════════════════════════════════════════════
  
  const isRunning = gamePhase === 'RUNNING';
  const isResult = gamePhase === 'RESULT';
  const budgetWarn = totalCost > (scenario?.budget || 0);
  const timeWarn = totalTime > (scenario?.timeLimit || 0);

  return (
    <div className="pf-root" style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', padding: '104px 16px 40px', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: pfStyles }} />
      
      {/* Overlays */}
      {isResult && <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)', zIndex: 40 }} />}
      {editingNode !== null && <div onClick={() => setEditingNode(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', zIndex: 40 }} />}
      
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        
        {/* Top Dashboard */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(51,65,85,0.8)', borderRadius: 16, padding: '16px 24px', marginBottom: 24, backdropFilter: 'blur(12px)', position: 'relative', zIndex: 10 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              {scenario?.icon} {scenario?.name}
            </h2>
            <button onClick={() => setGamePhase('SCENARIO_SELECT')} disabled={isRunning} style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: 12, padding: 0, marginTop: 4 }}>
              Change Scenario
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 2 }}>Est. Cost</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: budgetWarn ? '#ef4444' : '#10b981' }}>
                ${totalCost} <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>/ ${scenario?.budget}</span>
              </div>
            </div>
            <div style={{ width: 1, background: 'rgba(51,65,85,0.5)' }} />
            <div>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 2 }}>Est. Time</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: timeWarn ? '#ef4444' : '#f59e0b' }}>
                {totalTime}m <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>/ {scenario?.timeLimit}m</span>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setPipeline([])} disabled={isRunning || isResult || pipeline.length === 0} style={{ padding: '8px 16px', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(51,65,85,0.5)', color: '#cbd5e1', borderRadius: 8, fontWeight: 600 }}>
              Clear
            </button>
            <button
              onClick={runPipeline}
              disabled={isRunning || isResult || pipeline.length === 0}
              style={{
                padding: '8px 20px', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', border: 'none', color: '#fff',
                borderRadius: 8, fontWeight: 700, boxShadow: '0 4px 12px rgba(56,189,248,0.2)', opacity: (isRunning || isResult || pipeline.length === 0) ? 0.5 : 1
              }}
            >
              {isRunning ? 'Running...' : '▶️ Run Pipeline'}
            </button>
          </div>
        </div>

        {/* Workspace Layout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Canvas (Track) */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.8)', borderRadius: 16, padding: '32px 24px', backdropFilter: 'blur(12px)', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 48 }}>
                <h3 style={{ fontSize: 14, textTransform: 'uppercase', color: '#94a3b8', margin: 0, fontWeight: 700 }}>Conveyor Belt</h3>
                <span style={{ fontSize: 12, color: '#64748b' }}>{pipeline.length}/8 stages</span>
              </div>
              
              {pipeline.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(51,65,85,0.6)', borderRadius: 12 }}>
                  <span style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>📥</span>
                  <div style={{ fontSize: 16, color: '#94a3b8', fontWeight: 500 }}>Empty Pipeline</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Click stages from the toolbox below to add them here.</div>
                </div>
              ) : (
                <div style={{ position: 'relative', flex: 1, overflowX: 'auto', paddingBottom: 16 }}>
                  <div style={{ position: 'relative', minWidth: 'max(100%, 700px)', display: 'flex', alignItems: 'center', minHeight: 140 }}>
                    {/* Track line */}
                    <div style={{ position: 'absolute', top: '50%', left: 20, right: 20, height: 16, background: '#1e293b', transform: 'translateY(-50%)', borderRadius: 8, border: '2px solid #0f172a', overflow: 'hidden' }}>
                      <div style={{ width: '200%', height: '100%', background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)', animation: isRunning ? 'pf-conveyorMove 1s linear infinite' : 'none' }} />
                    </div>
                    
                    {/* Package */}
                    {isRunning && activeNodeIndex >= 0 && (
                      <div style={{
                        position: 'absolute', top: '50%', left: `calc(${Math.max(0, activeNodeIndex) * (100 / Math.max(1, pipeline.length - 1))}% )`,
                        transform: 'translate(-50%, -50%)', width: 32, height: 32, background: '#f8fafc', borderRadius: 8, zIndex: 20,
                        boxShadow: '0 0 20px rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'left 1s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}>
                        <span style={{ fontSize: 20 }}>📦</span>
                      </div>
                    )}

                    {/* Nodes */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', position: 'relative', zIndex: 10 }}>
                      {pipeline.map((node, idx) => {
                        const isActive = isRunning && idx === activeNodeIndex;
                        const isPast = isRunning && idx < activeNodeIndex;
                        const isFailedNode = isResult && runResult && !runResult.success && idx === runResult.failedNodeIndex;
                        const config = node.stage.configs.find(c => c.id === node.configId);
                        
                        let nodeBg = 'rgba(30,41,59,0.9)';
                        let nodeBorder = node.stage.color;

                        if (isActive) nodeBg = `${node.stage.color}22`;
                        else if (isFailedNode) { nodeBg = 'rgba(239,68,68,0.2)'; nodeBorder = '#ef4444'; }
                        else if (isPast || (isResult && runResult?.success)) { nodeBg = 'rgba(16,185,129,0.15)'; nodeBorder = '#10b981'; }

                        return (
                          <div key={`${node.stage.id}-${idx}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, minWidth: 80, position: 'relative' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: (isActive || isPast || isFailedNode) ? '#f8fafc' : '#94a3b8', textAlign: 'center', whiteSpace: 'nowrap' }}>
                              {node.stage.label}
                            </div>
                            
                            <div
                              onClick={() => !isRunning && !isResult && setEditingNode(idx)}
                              style={{
                                width: 56, height: 56, borderRadius: '50%', background: nodeBg, border: `3px solid ${nodeBorder}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, position: 'relative',
                                animation: isActive ? 'pf-pulse 1s infinite' : 'none', transition: 'all 0.3s', cursor: (!isRunning && !isResult) ? 'pointer' : 'default',
                              }}
                            >
                              {isFailedNode ? '💥' : node.stage.icon}
                              {!isRunning && !isResult && (
                                <button onClick={(e) => { e.stopPropagation(); removeStage(idx); }} style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8 }}>×</button>
                              )}
                            </div>
                            
                            {/* Config summary */}
                            <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.8)', borderRadius: 4, padding: '4px 6px', textAlign: 'center', width: 90 }}>
                              <div style={{ fontSize: 9, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{config?.label}</div>
                              <div style={{ fontSize: 9, fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>{config?.time}m • ${config?.cost}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Palette (Toolbox) */}
          <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.6)', borderRadius: 16, padding: 32, backdropFilter: 'blur(8px)', position: 'relative', zIndex: 10 }}>
            <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', margin: '0 0 24px', fontWeight: 700, textAlign: 'center' }}>
              Toolbox
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
              {AVAILABLE_STAGES.map(stage => (
                <button
                  key={stage.id}
                  onClick={() => addStage(stage)}
                  disabled={isRunning || isResult || pipeline.length >= 8}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 16px', background: 'rgba(30,41,59,0.6)',
                    border: '1px solid rgba(51,65,85,0.6)', borderRadius: 16, transition: 'all 0.3s', opacity: (isRunning || isResult) ? 0.5 : 1, width: 140, cursor: 'pointer'
                  }}
                  onMouseEnter={e => { if(!e.currentTarget.disabled) { e.currentTarget.style.borderColor = stage.color; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 24px ${stage.color}22`; e.currentTarget.style.background = 'rgba(30,41,59,0.9)'; } }}
                  onMouseLeave={e => { if(!e.currentTarget.disabled) { e.currentTarget.style.borderColor = 'rgba(51,65,85,0.6)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'rgba(30,41,59,0.6)'; } }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${stage.color}22`, color: stage.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                    {stage.icon}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', textAlign: 'center' }}>{stage.label}</div>
                  <div style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>+ Add Stage</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* ─── CONFIGURATION MODAL ─────────────────────────────────────────────────── */}
      {editingNode !== null && pipeline[editingNode] && (
        <div className="pf-anim-slideUp" style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 50,
          background: 'rgba(30,41,59,0.95)', border: `1px solid ${pipeline[editingNode].stage.color}`,
          borderRadius: 24, padding: 32, width: '90%', maxWidth: 400,
          boxShadow: `0 20px 60px ${pipeline[editingNode].stage.color}22`, backdropFilter: 'blur(20px)'
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', marginBottom: 24, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>{pipeline[editingNode].stage.icon}</span>
            Configure {pipeline[editingNode].stage.label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pipeline[editingNode].stage.configs.map(cfg => (
              <div key={cfg.id} onClick={() => updateNodeConfig(editingNode, cfg.id)} style={{ padding: 16, borderRadius: 16, background: cfg.id === pipeline[editingNode].configId ? `${pipeline[editingNode].stage.color}33` : 'rgba(15,23,42,0.6)', border: `2px solid ${cfg.id === pipeline[editingNode].configId ? pipeline[editingNode].stage.color : 'rgba(51,65,85,0.6)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 6 }}>{cfg.label}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>⏱️ {cfg.time}m</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>💰 ${cfg.cost}</span>
                </div>
                {cfg.risk === 'HIGH' && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 8, fontWeight: 700 }}>⚠️ High Security Risk</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── RESULT MODAL ─────────────────────────────────────────────────── */}
      {isResult && runResult && (
        <div className="pf-anim-slideUp" style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 50,
          background: 'rgba(15,23,42,0.95)', border: `1px solid ${runResult.success ? '#10b981' : '#ef4444'}`,
          borderRadius: 24, padding: 40, width: '90%', maxWidth: 500, textAlign: 'center',
          boxShadow: `0 20px 60px ${runResult.success ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>{runResult.success ? '🎉' : '❌'}</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: runResult.success ? '#34d399' : '#f87171', margin: '0 0 16px' }}>{runResult.title}</h2>
          <p style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 32 }}>{runResult.message}</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button
              onClick={() => { setGamePhase('BUILDING'); setRunResult(null); setActiveNodeIndex(-1); }}
              style={{ padding: '12px 32px', background: runResult.success ? '#10b981' : '#ef4444', color: '#fff', fontWeight: 700, fontSize: 16, borderRadius: 12, border: 'none', cursor: 'pointer' }}
            >
              {runResult.success ? 'Play Another Scenario' : 'Fix Pipeline'}
            </button>
            {runResult.success && (
              <button
                onClick={() => setGamePhase('SCENARIO_SELECT')}
                style={{ padding: '12px 24px', background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(51,65,85,0.8)', color: '#fff', fontWeight: 600, fontSize: 14, borderRadius: 12, cursor: 'pointer' }}
              >
                Change Scenario
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
