'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LabTerminalProps {
  terminalUrl?: string;
  isConnected: boolean;
  sessionStatus: string;
}

export default function LabTerminal({ terminalUrl, isConnected, sessionStatus }: LabTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([
    '\x1b[1;32m╔══════════════════════════════════════════════════════════════╗\x1b[0m',
    '\x1b[1;32m║\x1b[0m  \x1b[1;36m🚀 DevOps Duoo — Interactive Lab Terminal\x1b[0m                   \x1b[1;32m║\x1b[0m',
    '\x1b[1;32m║\x1b[0m  \x1b[33mType commands below to practice DevOps skills\x1b[0m              \x1b[1;32m║\x1b[0m',
    '\x1b[1;32m╚══════════════════════════════════════════════════════════════╝\x1b[0m',
    '',
  ]);

  const initTerminal = useCallback(async () => {
    if (!terminalRef.current || terminalInstanceRef.current) return;

    try {
      const { Terminal } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');
      const { WebLinksAddon } = await import('@xterm/addon-web-links');

      // CSS is imported via globals.css

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();

      const terminal = new Terminal({
        cursorBlink: true,
        cursorStyle: 'bar',
        fontSize: 14,
        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, Monaco, monospace',
        theme: {
          background: '#0a0e1a',
          foreground: '#e2e8f0',
          cursor: '#22d3ee',
          cursorAccent: '#0a0e1a',
          selectionBackground: '#334155',
          selectionForeground: '#f8fafc',
          black: '#0f172a',
          red: '#f43f5e',
          green: '#22c55e',
          yellow: '#eab308',
          blue: '#3b82f6',
          magenta: '#a855f7',
          cyan: '#22d3ee',
          white: '#e2e8f0',
          brightBlack: '#475569',
          brightRed: '#fb7185',
          brightGreen: '#4ade80',
          brightYellow: '#fde047',
          brightBlue: '#60a5fa',
          brightMagenta: '#c084fc',
          brightCyan: '#67e8f9',
          brightWhite: '#f8fafc',
        },
        allowProposedApi: true,
        scrollback: 1000,
        convertEol: true,
      });

      terminal.loadAddon(fitAddon);
      terminal.loadAddon(webLinksAddon);
      terminal.open(terminalRef.current);

      fitAddonRef.current = fitAddon;
      terminalInstanceRef.current = terminal;

      // Fit to container
      setTimeout(() => {
        fitAddon.fit();
      }, 100);

      // Write welcome message
      terminalLines.forEach((line) => {
        terminal.writeln(line);
      });

      // If connected to a real terminal, set up WebSocket
      if (terminalUrl && isConnected) {
        connectWebSocket(terminal, terminalUrl);
      } else {
        // Demo mode: local echo terminal
        setupDemoMode(terminal);
      }

      setIsLoaded(true);

      // Handle resize
      const handleResize = () => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        terminal.dispose();
      };
    } catch (error) {
      console.error('Failed to initialize terminal:', error);
    }
  }, [terminalUrl, isConnected]);

  const connectWebSocket = (terminal: any, url: string) => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      terminal.writeln('\x1b[1;32m✓ Connected to lab environment\x1b[0m\r\n');
    };

    ws.onmessage = (event) => {
      terminal.write(event.data);
    };

    ws.onclose = () => {
      terminal.writeln('\r\n\x1b[1;31m✗ Disconnected from lab environment\x1b[0m');
    };

    ws.onerror = () => {
      terminal.writeln('\r\n\x1b[1;31m✗ Connection error\x1b[0m');
    };

    terminal.onData((data: string) => {
      ws.send(data);
    });
  };

  const setupDemoMode = (terminal: any) => {
    let currentLine = '';
    const prompt = '\x1b[1;36mdevops-duoo\x1b[0m:\x1b[1;34m~\x1b[0m$ ';

    terminal.write(prompt);

    const demoCommands: Record<string, string> = {
      'help': '\x1b[33mAvailable demo commands:\x1b[0m\r\n  help        - Show this help message\r\n  whoami      - Show current user\r\n  docker --version - Show Docker version\r\n  kubectl version  - Show kubectl version\r\n  terraform --version - Show Terraform version\r\n  clear       - Clear the terminal\r\n  uname -a    - Show system info\r\n  date        - Show current date\r\n  ls          - List files\r\n  cat README  - Read README file\r\n',
      'whoami': 'devops-learner',
      'docker --version': 'Docker version 24.0.7, build afdd53b',
      'kubectl version': 'Client Version: v1.28.4\r\nServer Version: v1.28.4',
      'terraform --version': 'Terraform v1.6.6\r\non linux_amd64',
      'uname -a': 'Linux devops-lab 5.15.0-1052-aws #57~20.04.1-Ubuntu SMP x86_64 GNU/Linux',
      'date': new Date().toUTCString(),
      'ls': '\x1b[1;34mDockerfile\x1b[0m  \x1b[1;34mdocker-compose.yml\x1b[0m  \x1b[1;32mREADME.md\x1b[0m  \x1b[1;34msrc/\x1b[0m  \x1b[1;34mterraform/\x1b[0m',
      'cat README': '\x1b[1;36m# DevOps Duoo Lab Environment\x1b[0m\r\n\r\nWelcome to your hands-on lab! This is a demo terminal.\r\nStart a real lab session to get a fully provisioned AWS environment.\r\n\r\n\x1b[33mTools available:\x1b[0m Docker, Kubernetes, Terraform, Ansible, Helm\r\n\x1b[33mSession duration:\x1b[0m 30 minutes\r\n',
      'cat readme': '\x1b[1;36m# DevOps Duoo Lab Environment\x1b[0m\r\n\r\nWelcome to your hands-on lab! This is a demo terminal.\r\nStart a real lab session to get a fully provisioned AWS environment.\r\n\r\n\x1b[33mTools available:\x1b[0m Docker, Kubernetes, Terraform, Ansible, Helm\r\n\x1b[33mSession duration:\x1b[0m 30 minutes\r\n',
      'pwd': '/home/devops-learner',
      'echo hello': 'hello',
    };

    terminal.onData((data: string) => {
      const code = data.charCodeAt(0);

      if (code === 13) { // Enter
        terminal.write('\r\n');
        const cmd = currentLine.trim();

        if (cmd === 'clear') {
          terminal.clear();
        } else if (cmd in demoCommands) {
          terminal.writeln(demoCommands[cmd]);
        } else if (cmd.startsWith('echo ')) {
          terminal.writeln(cmd.slice(5));
        } else if (cmd !== '') {
          terminal.writeln(`\x1b[33m⚡ This is a demo terminal. Start a lab session for full access.\x1b[0m`);
          terminal.writeln(`\x1b[90mTry: help, docker --version, kubectl version, terraform --version\x1b[0m`);
        }

        currentLine = '';
        terminal.write(prompt);
      } else if (code === 127) { // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          terminal.write('\b \b');
        }
      } else if (code === 3) { // Ctrl+C
        terminal.write('^C\r\n');
        currentLine = '';
        terminal.write(prompt);
      } else if (code >= 32) { // Printable characters
        currentLine += data;
        terminal.write(data);
      }
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      initTerminal();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.dispose();
        terminalInstanceRef.current = null;
      }
    };
  }, [initTerminal]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-700/50 bg-[#0a0e1a] shadow-2xl">
      {/* Terminal Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors cursor-pointer" />
          </div>
          <span className="text-xs text-gray-400 ml-2 font-mono">devops-duoo-lab</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection status indicator */}
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${
              sessionStatus === 'active' || sessionStatus === 'ready'
                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                : sessionStatus === 'provisioning'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-gray-500'
            }`} />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
              {sessionStatus === 'active' || sessionStatus === 'ready'
                ? 'Connected'
                : sessionStatus === 'provisioning'
                ? 'Connecting...'
                : 'Demo Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="relative min-h-[400px] lg:min-h-[500px] w-full" style={{ background: '#0a0e1a' }}>
        {isConnected && terminalUrl ? (
          <div className="absolute inset-0 flex flex-col">
            {/* Embedded terminal via iframe */}
            <iframe
              src={terminalUrl}
              className="flex-1 w-full border-0 rounded-b-xl"
              style={{ background: '#0a0e1a', minHeight: '100%' }}
              allow="clipboard-read; clipboard-write"
              title="DevOps Duoo Lab Terminal"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
            
            {/* Fallback: open in new tab if iframe fails */}
            <div className="absolute bottom-3 right-3 z-10">
              <a
                href={terminalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium text-gray-400 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600/50 rounded-lg backdrop-blur-sm transition-colors"
                title="Open terminal in new tab"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Pop Out
              </a>
            </div>
          </div>
        ) : (
          <div
            ref={terminalRef}
            className="absolute inset-0 w-full h-full p-1"
          />
        )}
      </div>

      {/* Loading overlay */}
      <AnimatePresence>
        {!isLoaded && !isConnected && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-[#0a0e1a]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-400 font-mono">Initializing demo terminal...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
