'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  FaArrowLeft,
  FaClock,
  FaGraduationCap,
  FaPlay,
  FaStop,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTerminal,
  FaListOl,
  FaChevronRight,
  FaRedo,
  FaCopy,
  FaCheck,
  FaSpinner,
} from 'react-icons/fa';
import { getLabById, difficultyConfig, type Lab, type SessionStatus } from '@/lib/labs';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";

// Dynamic import for terminal (client-only, no SSR)
const LabTerminal = dynamic(() => import('@/components/LabTerminal'), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-gray-700/50 bg-[#0a0e1a] min-h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400 font-mono">Loading terminal...</span>
      </div>
    </div>
  ),
});

// Command copy button
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-300 transition-colors"
      title="Copy command"
    >
      {copied ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// Timer component
function SessionTimer({ expiresAt, onExpired }: { expiresAt?: string; onExpired?: () => void }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining(0);
        onExpired?.();
        clearInterval(interval);
      } else {
        setRemaining(Math.floor(diff / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  if (remaining === null) return null;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isLow = remaining < 300; // Less than 5 min
  const isCritical = remaining < 60; // Less than 1 min

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-bold ${
        isCritical
          ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
          : isLow
          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          : 'bg-gray-800 text-gray-300 border border-gray-700'
      }`}
    >
      <FaClock className="text-xs" />
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

// Provisioning animation
function ProvisioningOverlay() {
  const steps = [
    { text: 'Queuing lab environment...', icon: '📋' },
    { text: 'Provisioning AWS resources...', icon: '☁️' },
    { text: 'Configuring container...', icon: '🐳' },
    { text: 'Installing tools...', icon: '🔧' },
    { text: 'Starting terminal service...', icon: '💻' },
    { text: 'Almost ready...', icon: '✨' },
  ];

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0e1a]/95 backdrop-blur-sm rounded-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center max-w-sm">
        {/* Spinner */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-primary-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-accent-500/20" />
          <div className="absolute inset-2 rounded-full border-2 border-accent-500 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">
            {steps[currentStep].icon}
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              className={`flex items-center gap-2 justify-center text-sm ${
                i < currentStep
                  ? 'text-emerald-400'
                  : i === currentStep
                  ? 'text-white'
                  : 'text-gray-600'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: i <= currentStep ? 1 : 0.3, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {i < currentStep ? (
                <FaCheckCircle className="text-emerald-400" />
              ) : i === currentStep ? (
                <FaSpinner className="animate-spin text-primary-400" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-gray-600" />
              )}
              <span>{step.text}</span>
            </motion.div>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-6">
          This usually takes 30-60 seconds
        </p>
      </div>
    </motion.div>
  );
}

export default function LabDetailPage({ params }: { params: { labId: string } }) {
  const lab = getLabById(params.labId);
  const [activeStep, setActiveStep] = useState(0);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('queued');
  const [terminalUrl, setTerminalUrl] = useState<string | undefined>();
  const [expiresAt, setExpiresAt] = useState<string | undefined>();
  const [showInstructions, setShowInstructions] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize(); // set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Start lab session
  const startLab = useCallback(async () => {
    if (!lab) return;
    setIsStarting(true);
    setSessionStatus('provisioning');

    try {
      const response = await fetch('/api/labs/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labId: lab.id, userName }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);

        // Start polling for status
        pollStatus(data.sessionId);
      } else {
        // In demo mode, simulate provisioning
        simulateProvisioning();
      }
    } catch {
      // API not available - simulate for demo
      simulateProvisioning();
    }
  }, [lab]);

  // Poll for session status
  const pollStatus = async (sid: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/labs/status?sessionId=${sid}`);
        if (response.ok) {
          const data = await response.json();
          setSessionStatus(data.status);

          if (data.status === 'ready' || data.status === 'active') {
            setTerminalUrl(data.terminalUrl);
            setExpiresAt(data.expiresAt);
            setIsStarting(false);
            clearInterval(interval);
          } else if (data.status === 'error') {
            setIsStarting(false);
            clearInterval(interval);
          }
        }
      } catch {
        // Silent fail, keep polling
      }
    }, 3000);

    // Timeout after 3 minutes
    setTimeout(() => {
      clearInterval(interval);
      if (sessionStatus === 'provisioning') {
        simulateProvisioning();
      }
    }, 180000);
  };

  // Simulate provisioning for demo
  const simulateProvisioning = () => {
    setTimeout(() => {
      setSessionStatus('ready');
      setExpiresAt(new Date(Date.now() + 30 * 60 * 1000).toISOString());
      setIsStarting(false);

      setTimeout(() => {
        setSessionStatus('active');
      }, 1000);
    }, 5000);
  };

  // Terminate session
  const terminateSession = async () => {
    setSessionStatus('terminating');

    if (sessionId) {
      try {
        await fetch('/api/labs/terminate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      } catch {
        // Silent fail
      }
    }

    setTimeout(() => {
      setSessionStatus('terminated');
      setTerminalUrl(undefined);
      setExpiresAt(undefined);
      setSessionId(null);
    }, 2000);
  };

  if (!lab) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Lab Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The lab you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/labs">
            <motion.button
              className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold"
              whileHover={{ scale: 1.05 }}
            >
              Back to Labs
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  const difficulty = difficultyConfig[lab.difficulty];
  const isActive = sessionStatus === 'active' || sessionStatus === 'ready';
  const isProvisioning = sessionStatus === 'provisioning';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Top Bar */}
      <div className="fixed top-20 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Back + Lab info */}
            <div className="flex items-center gap-4">
              <Link href="/labs">
                <motion.div
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  whileHover={{ x: -4 }}
                >
                  <FaArrowLeft className="text-xs" />
                  <span>All Labs</span>
                </motion.div>
              </Link>

              <div className="hidden sm:flex items-center gap-2">
                <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
                <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[300px]">
                  {lab.title}
                </h1>
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${difficulty.bgColor} ${difficulty.color} ${difficulty.borderColor} border`}>
                  {difficulty.label}
                </div>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-3">
              {/* Timer */}
              {isActive && expiresAt && (
                <SessionTimer
                  expiresAt={expiresAt}
                  onExpired={() => setSessionStatus('terminated')}
                />
              )}

              {/* Toggle instructions (mobile) */}
              <button
                className="lg:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                onClick={() => setShowInstructions(!showInstructions)}
              >
                <FaListOl />
              </button>

              {/* Start / Stop buttons */}
              {!isActive && !isProvisioning && sessionStatus !== 'terminating' && (
                <motion.button
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-semibold text-sm shadow-lg shadow-emerald-500/25"
                  onClick={startLab}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isStarting}
                >
                  <FaPlay className="text-xs" />
                  {sessionStatus === 'terminated' ? 'Restart Lab' : 'Start Lab'}
                </motion.button>
              )}

              {isActive && (
                <motion.button
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg font-semibold text-sm border border-red-500/30 hover:bg-red-500/20 transition-colors"
                  onClick={terminateSession}
                  whileHover={{ scale: 1.02 }}
                >
                  <FaStop className="text-xs" />
                  End Lab
                </motion.button>
              )}

              {sessionStatus === 'terminating' && (
                <div className="flex items-center gap-2 px-4 py-2 text-amber-500 text-sm">
                  <FaSpinner className="animate-spin" />
                  Terminating...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content — Split Pane */}
      <div className="pt-[5.5rem] pb-0 h-screen">
        <div className="w-full h-full p-4 lg:p-6 pb-6">
          <PanelGroup orientation={isMobile ? "vertical" : "horizontal"} className="w-full h-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/50 shadow-2xl bg-white dark:bg-gray-800/50">
            {/* ─────── LEFT: Instructions ─────── */}
            <Panel defaultSize={35} minSize={20} className="relative">
              <div className="absolute inset-0 overflow-y-auto p-6 scrollbar-thin">
                <AnimatePresence>
                  {showInstructions && (
                    <motion.div
                      className="space-y-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {/* Lab overview card */}
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                          {lab.title}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {lab.fullDescription.split('\n')[0]}
                        </p>

                        {/* Meta */}
                        <div className="flex flex-wrap gap-3 mb-4">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <FaClock />
                            <span>{lab.estimatedMinutes} min</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <FaGraduationCap />
                            <span>{lab.steps.length} steps</span>
                          </div>
                        </div>

                        {/* Learning objectives */}
                        <div className="border-t border-gray-100 dark:border-gray-700/50 pt-4">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Learning Objectives
                          </h4>
                          <ul className="space-y-1.5">
                            {lab.learningObjectives.map((obj, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <FaCheckCircle className="text-emerald-500 text-xs mt-1 flex-shrink-0" />
                                <span>{obj}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Steps */}
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/50">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FaListOl className="text-primary-500" />
                            Lab Steps
                          </h3>
                        </div>

                        <div className="divide-y divide-gray-100 dark:divide-gray-700/30">
                          {lab.steps.map((step, i) => (
                            <motion.div
                              key={i}
                              className={`p-4 cursor-pointer transition-colors ${
                                activeStep === i
                                  ? 'bg-primary-50/50 dark:bg-primary-900/10 border-l-2 border-primary-500'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/80 border-l-2 border-transparent'
                              }`}
                              onClick={() => setActiveStep(i)}
                            >
                              <div className="flex items-start gap-3">
                                {/* Step number */}
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                    activeStep === i
                                      ? 'bg-primary-500 text-white'
                                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                  }`}
                                >
                                  {i + 1}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h4
                                    className={`text-sm font-semibold mb-1 ${
                                      activeStep === i
                                        ? 'text-primary-700 dark:text-primary-300'
                                        : 'text-gray-700 dark:text-gray-300'
                                    }`}
                                  >
                                    {step.title}
                                  </h4>

                                  {activeStep === i && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                        {step.description}
                                      </p>

                                      {step.command && (
                                        <div className="rounded-lg bg-gray-900 dark:bg-[#0a0e1a] p-3 mb-2">
                                          <div className="flex items-start justify-between gap-2">
                                            <code className="text-xs text-emerald-400 font-mono break-all">
                                              $ {step.command}
                                            </code>
                                            <CopyButton text={step.command} />
                                          </div>
                                        </div>
                                      )}

                                      {step.hint && (
                                        <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 rounded-lg p-2 border border-amber-200 dark:border-amber-800/30">
                                          <FaExclamationTriangle className="text-[10px] mt-0.5 flex-shrink-0" />
                                          <span>{step.hint}</span>
                                        </div>
                                      )}
                                    </motion.div>
                                  )}
                                </div>

                                <FaChevronRight
                                  className={`text-xs transition-transform flex-shrink-0 mt-1 ${
                                    activeStep === i ? 'rotate-90 text-primary-500' : 'text-gray-300 dark:text-gray-600'
                                  }`}
                                />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Nav buttons */}
                      <div className="flex gap-2">
                        <button
                          className="flex-1 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-30"
                          disabled={activeStep === 0}
                          onClick={() => setActiveStep((prev) => prev - 1)}
                        >
                          ← Previous
                        </button>
                        <button
                          className="flex-1 py-2 text-sm font-medium rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-30"
                          disabled={activeStep === lab.steps.length - 1}
                          onClick={() => setActiveStep((prev) => prev + 1)}
                        >
                          Next →
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Panel>

            <PanelResizeHandle className={`${isMobile ? 'h-3 w-full cursor-row-resize' : 'w-2 h-full cursor-col-resize'} bg-gray-100 dark:bg-gray-800 hover:bg-primary-500/50 dark:hover:bg-primary-500/50 transition-colors flex items-center justify-center flex-shrink-0`}>
              <div className={`${isMobile ? 'w-8 h-1' : 'w-1 h-8'} bg-gray-300 dark:bg-gray-600 rounded-full`} />
            </PanelResizeHandle>

            {/* ─────── RIGHT: Terminal ─────── */}
            <Panel defaultSize={65} minSize={30} className="bg-[#0a0e1a] relative">
              <div className="absolute inset-0">
                {/* Provisioning overlay */}
                <AnimatePresence>
                  {isProvisioning && <ProvisioningOverlay />}
                </AnimatePresence>

                {/* Terminated overlay */}
                <AnimatePresence>
                  {sessionStatus === 'terminated' && (
                    <motion.div
                      className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0e1a]/90 backdrop-blur-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="text-center">
                        <div className="text-5xl mb-4">⏱️</div>
                        <h3 className="text-xl font-bold text-white mb-2">Session Ended</h3>
                        <p className="text-gray-400 text-sm mb-6">
                          Your lab environment has been terminated.
                        </p>
                        <motion.button
                          className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold"
                          onClick={() => {
                            setSessionStatus('queued');
                            startLab();
                          }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <FaRedo className="text-sm" />
                          Start New Session
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Not started state */}
                {sessionStatus === 'queued' && !isStarting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e1a]">
                    <div className="text-center max-w-md px-6">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/20 flex items-center justify-center">
                        <FaTerminal className="text-3xl text-primary-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        Ready to Practice?
                      </h3>
                      <p className="text-sm text-gray-400 mb-6">
                        Enter your name and click &quot;Start Lab&quot; to provision a real AWS environment.
                      </p>
                      <input
                        type="text"
                        placeholder="Your Name (Required)"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full max-w-[280px] mx-auto mb-6 px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-center"
                      />
                      <div className="block">
                        <motion.button
                          className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={startLab}
                          disabled={!userName.trim()}
                          whileHover={{ scale: userName.trim() ? 1.05 : 1, boxShadow: userName.trim() ? '0 20px 40px rgba(16,185,129,0.3)' : 'none' }}
                          whileTap={{ scale: userName.trim() ? 0.95 : 1 }}
                        >
                          <FaPlay />
                          Start Lab
                        </motion.button>
                      </div>
                      <p className="text-xs text-gray-500 mt-4">
                        No sign-up required • Auto-terminates after 30 min
                      </p>
                    </div>
                  </div>
                )}

                {/* Active terminal */}
                {(isActive || isProvisioning) && (
                  <LabTerminal
                    terminalUrl={terminalUrl}
                    isConnected={isActive}
                    sessionStatus={sessionStatus}
                  />
                )}
              </div>
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </div>
  );
}
