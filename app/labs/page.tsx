'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useMemo, useEffect, useRef } from 'react';
import {
  FaDocker,
  FaSearch,
  FaClock,
  FaFlask,
  FaTerminal,
  FaUsers,
  FaArrowRight,
  FaGraduationCap,
  FaStar,
  FaFire,
  FaLinux,
} from 'react-icons/fa';
import {
  SiKubernetes,
  SiTerraform,
  SiAnsible,
  SiPrometheus,
  SiGrafana,
  SiHelm,
  SiRedhat,
  SiGnubash,
} from 'react-icons/si';
import { labs, categories, difficultyConfig, type Lab, type LabDifficulty } from '@/lib/labs';

// Map tool names to icons
const toolIcons: Record<string, any> = {
  'Docker': FaDocker,
  'Docker Compose': FaDocker,
  'Kubernetes': SiKubernetes,
  'Minikube': SiKubernetes,
  'kubectl': SiKubernetes,
  'K3s': SiKubernetes,
  'Terraform': SiTerraform,
  'HCL': SiTerraform,
  'Ansible': SiAnsible,
  'Prometheus': SiPrometheus,
  'Grafana': SiGrafana,
  'Helm': SiHelm,
  'Linux': FaLinux,
  'Bash': SiGnubash,
  'Red Hat': SiRedhat,
};

// Animated terminal text for the hero
const terminalCommands = [
  { prompt: '$ ', text: 'docker run -d nginx:alpine', delay: 0 },
  { prompt: '', text: '  ✓ Container started: a3f2b1c...', delay: 1200 },
  { prompt: '$ ', text: 'kubectl get pods', delay: 2400 },
  { prompt: '', text: '  NAME          READY   STATUS    AGE', delay: 3200 },
  { prompt: '', text: '  nginx-app     1/1     Running   5s', delay: 3600 },
  { prompt: '$ ', text: 'terraform apply -auto-approve', delay: 4800 },
  { prompt: '', text: '  Apply complete! Resources: 3 added', delay: 6000 },
  { prompt: '$ ', text: '█', delay: 7200 },
];

function AnimatedTerminal() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    terminalCommands.forEach((cmd, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines(i + 1);
        }, cmd.delay)
      );
    });

    // Loop animation
    const loopTimer = setTimeout(() => {
      setVisibleLines(0);
      // Restart
      terminalCommands.forEach((cmd, i) => {
        timers.push(
          setTimeout(() => {
            setVisibleLines(i + 1);
          }, cmd.delay + 500)
        );
      });
    }, 9000);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(loopTimer);
    };
  }, []);

  return (
    <div className="rounded-xl overflow-hidden border border-gray-700/50 bg-[#0a0e1a] shadow-2xl shadow-primary-600/10">
      {/* Terminal Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700/50">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-xs text-gray-500 ml-2 font-mono">devops-duoo-lab</span>
      </div>
      {/* Terminal Body */}
      <div className="p-4 font-mono text-sm leading-relaxed min-h-[200px]">
        {terminalCommands.slice(0, visibleLines).map((cmd, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className={cmd.prompt ? 'text-gray-200' : 'text-gray-400'}
          >
            {cmd.prompt && <span className="text-cyan-400">{cmd.prompt}</span>}
            {cmd.text.includes('✓') || cmd.text.includes('complete') ? (
              <span className="text-emerald-400">{cmd.text}</span>
            ) : cmd.text === '█' ? (
              <span className="text-cyan-400 animate-pulse">█</span>
            ) : (
              <span>{cmd.text}</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function LabCard({ lab, index }: { lab: Lab; index: number }) {
  const difficulty = difficultyConfig[lab.difficulty];
  const mainTool = lab.tools[0];
  const ToolIcon = toolIcons[mainTool] || FaFlask;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link href={lab.status === 'available' ? `/labs/${lab.id}` : '#'}>
        <motion.div
          className={`group relative h-full rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden transition-all duration-300 ${
            lab.status === 'available'
              ? 'hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-500/10 cursor-pointer'
              : 'opacity-60 cursor-not-allowed'
          }`}
          whileHover={lab.status === 'available' ? { y: -4 } : {}}
        >
          {/* Glow effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/0 via-transparent to-accent-600/0 group-hover:from-primary-600/5 group-hover:to-accent-600/5 transition-all duration-500" />

          <div className="relative p-6 flex flex-col h-full">
            {/* Header: Icon & Badges */}
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex-shrink-0 bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/20 flex items-center justify-center">
                <ToolIcon className="text-xl text-primary-400" />
              </div>
              
              <div className="flex flex-col items-end gap-2">
                {/* Status / Popularity Badge */}
                {lab.status === 'coming-soon' ? (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-500/20 to-indigo-500/20 border border-violet-500/30">
                    <span className="text-[10px]">🚀</span>
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Upcoming</span>
                  </div>
                ) : lab.popularityScore >= 90 ? (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                    <FaFire className="text-amber-400 text-xs" />
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Popular</span>
                  </div>
                ) : null}

                {/* Difficulty Badge */}
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${difficulty.bgColor} ${difficulty.borderColor} border ${difficulty.color}`}>
                  {lab.difficulty === 'beginner' && '🟢'}
                  {lab.difficulty === 'intermediate' && '🟡'}
                  {lab.difficulty === 'advanced' && '🔴'}
                  {difficulty.label}
                </div>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {lab.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {lab.shortDescription}
            </p>

            {/* Tools */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {lab.tools.map((tool) => (
                <span
                  key={tool}
                  className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600/30"
                >
                  {tool}
                </span>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <FaClock className="text-[10px]" />
                  <span>{lab.estimatedMinutes} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <FaGraduationCap className="text-[10px]" />
                  <span>{lab.steps.length} steps</span>
                </div>
              </div>

              {lab.status === 'available' && (
                <motion.div
                  className="flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400"
                  whileHover={{ x: 4 }}
                >
                  Start Lab <FaArrowRight className="text-[10px]" />
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// Animated counter
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start = 0;
          const duration = 2000;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(target * eased));
            if (progress < 1) requestAnimationFrame(animate);
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function LabsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<LabDifficulty | 'all'>('all');

  const filteredLabs = useMemo(() => {
    let result = labs;

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((lab) => lab.category === selectedCategory);
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      result = result.filter((lab) => lab.difficulty === selectedDifficulty);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (lab) =>
          lab.title.toLowerCase().includes(q) ||
          lab.shortDescription.toLowerCase().includes(q) ||
          lab.tools.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort: available first, then by popularity
    return result.sort((a, b) => {
      if (a.status === 'available' && b.status !== 'available') return -1;
      if (a.status !== 'available' && b.status === 'available') return 1;
      return b.popularityScore - a.popularityScore;
    });
  }, [searchQuery, selectedCategory, selectedDifficulty]);

  const availableCount = labs.filter((l) => l.status === 'available').length;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* ─────────── HERO SECTION ─────────── */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50/50 via-transparent to-transparent dark:from-primary-900/20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary-500/10 to-transparent rounded-full blur-3xl" />
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(51,153,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(51,153,255,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700/50 mb-6">
                <FaFlask className="text-primary-600 dark:text-primary-400 text-sm" />
                <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                  Free Interactive Labs
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6">
                Learn DevOps{' '}
                <span className="bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  by Doing
                </span>
              </h1>

              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg">
                Get hands-on experience with real AWS environments. No setup, no credit card —
                just pick a lab and start practicing in seconds.
              </p>

              <div className="flex flex-wrap gap-4">
                <a href="#labs-catalog">
                  <motion.button
                    className="px-8 py-3.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary-500/25"
                    whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(51,153,255,0.3)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Browse Labs
                  </motion.button>
                </a>
                <motion.div
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium"
                  whileHover={{ scale: 1.02 }}
                >
                  <FaTerminal className="text-primary-500" />
                  <span>30 min free sessions</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Right: Animated Terminal */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              <AnimatedTerminal />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─────────── STATS BAR ─────────── */}
      <section className="py-8 bg-gray-50/80 dark:bg-gray-800/30 border-y border-gray-200/50 dark:border-gray-700/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: FaFlask, value: availableCount, suffix: '+', label: 'Labs Available' },
              { icon: FaUsers, value: 500, suffix: '+', label: 'Learners' },
              { icon: FaClock, value: 30, suffix: 'min', label: 'Free Per Session' },
              { icon: FaStar, value: 100, suffix: '%', label: 'Free Forever' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <stat.icon className="text-2xl text-primary-500 mb-2" />
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── LABS CATALOG ─────────── */}
      <section id="labs-catalog" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Lab Catalog
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choose a lab below to start practicing. Each lab runs in a real AWS environment
              with all tools pre-installed.
            </p>
          </motion.div>

          {/* Filters */}
          <div className="mb-10 space-y-4">
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search labs by name or tool..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
              />
            </div>

            {/* Category chips */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((cat) => (
                <motion.button
                  key={cat.id}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                    selectedCategory === cat.id
                      ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/25'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
                  }`}
                  onClick={() => setSelectedCategory(cat.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="mr-1.5">{cat.icon}</span>
                  {cat.label}
                </motion.button>
              ))}
            </div>

            {/* Difficulty filter */}
            <div className="flex justify-center gap-2">
              {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((diff) => (
                <button
                  key={diff}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    selectedDifficulty === diff
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                      : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedDifficulty(diff)}
                >
                  {diff === 'all' ? 'All Levels' : diff.charAt(0).toUpperCase() + diff.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Lab Grid */}
          <AnimatePresence mode="wait">
            {filteredLabs.length > 0 ? (
              <motion.div
                key={`${selectedCategory}-${selectedDifficulty}-${searchQuery}`}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {filteredLabs.map((lab, i) => (
                  <LabCard key={lab.id} lab={lab} index={i} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                className="text-center py-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <FaSearch className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-2">
                  No labs found
                </h3>
                <p className="text-gray-400 dark:text-gray-500">
                  Try adjusting your search or filters
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ─────────── HOW IT WORKS ─────────── */}
      <section className="py-20 bg-gray-50/80 dark:bg-gray-800/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Get from zero to practicing in under 60 seconds
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Pick a Lab',
                description: 'Browse our catalog and choose a lab that matches your learning goals.',
                icon: '🧪',
                color: 'from-blue-500 to-cyan-500',
              },
              {
                step: '02',
                title: 'Start Session',
                description: 'Click "Start Lab" — we\'ll provision a real AWS environment just for you.',
                icon: '🚀',
                color: 'from-purple-500 to-pink-500',
              },
              {
                step: '03',
                title: 'Practice',
                description: 'Follow step-by-step instructions with a live terminal. All tools are pre-installed.',
                icon: '💻',
                color: 'from-emerald-500 to-teal-500',
              },
              {
                step: '04',
                title: 'Learn & Repeat',
                description: 'Your environment auto-terminates after 30 min. Start as many sessions as you want!',
                icon: '🎯',
                color: 'from-amber-500 to-orange-500',
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                className="relative text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                {/* Connector line */}
                {i < 3 && (
                  <div className="hidden md:block absolute top-10 left-[50%] w-[calc(100%+2rem)] h-[2px] bg-gray-200 dark:bg-gray-700 z-0 overflow-hidden">
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500"
                      initial={{ width: 0 }}
                      whileInView={{ width: '100%' }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.8, delay: i * 0.4 + 0.3 }}
                    />
                  </div>
                )}

                {/* Icon Container */}
                <motion.div 
                  className={`relative z-10 w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-3xl shadow-lg cursor-default`}
                  whileHover={{ scale: 1.1, rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {item.icon}
                </motion.div>

                <div className="text-xs font-bold text-primary-500 tracking-widest uppercase mb-2">
                  Step {item.step}
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── CTA ─────────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative p-12 rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)',
                }}
              />
            </div>

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Ready to Start Learning?
              </h2>
              <p className="text-lg text-primary-100 mb-8 max-w-xl mx-auto">
                No sign-up required. Pick any lab and get a fully provisioned environment in
                seconds. It&apos;s completely free.
              </p>
              <a href="#labs-catalog">
                <motion.button
                  className="px-8 py-4 bg-white text-primary-700 rounded-xl font-bold text-lg shadow-xl"
                  whileHover={{ scale: 1.05, boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  Explore Labs Now →
                </motion.button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
