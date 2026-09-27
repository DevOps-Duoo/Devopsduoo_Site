'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  FaPrint, 
  FaEdit, 
  FaCheck, 
  FaUndo, 
  FaArrowLeft,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaGlobe,
} from 'react-icons/fa';

interface DeliverableItem {
  id: number;
  activity: string;
  workCompleted: string;
  hours: number;
}

const DEFAULT_DELIVERABLES: DeliverableItem[] = [
  {
    id: 1,
    activity: 'Requirement & Architecture',
    workCompleted: 'Application deployment requirements, environment planning, AKS architecture, networking and deployment strategy',
    hours: 4,
  },
  {
    id: 2,
    activity: 'Azure Resource Setup',
    workCompleted: 'Resource Group, VNet, subnets, NSGs, managed identities, ACR and supporting Azure resources',
    hours: 6,
  },
  {
    id: 3,
    activity: 'AKS Cluster Setup',
    workCompleted: 'AKS cluster creation, node pools, autoscaling, RBAC, networking and cluster configuration',
    hours: 8,
  },
  {
    id: 4,
    activity: 'ACR Setup',
    workCompleted: 'Azure Container Registry creation, repository structure, AKS-to-ACR authentication and image pull permissions',
    hours: 3,
  },
  {
    id: 5,
    activity: 'Application Containerization',
    workCompleted: 'Dockerfile preparation/optimization, application image build and local validation',
    hours: 6,
  },
  {
    id: 6,
    activity: 'Kubernetes Manifests',
    workCompleted: 'Deployment, Service, ConfigMap, Secret, Namespace and resource configuration',
    hours: 8,
  },
  {
    id: 7,
    activity: 'Helm Chart Setup',
    workCompleted: 'Helm chart creation/customization, values files and environment-specific configurations',
    hours: 6,
  },
  {
    id: 8,
    activity: 'Ingress & Networking',
    workCompleted: 'Ingress Controller, Load Balancer, DNS configuration, TLS/SSL and routing setup',
    hours: 6,
  },
  {
    id: 9,
    activity: 'CI Pipeline',
    workCompleted: 'Build pipeline, dependency installation, Docker image build, tagging and push to ACR',
    hours: 6,
  },
  {
    id: 10,
    activity: 'CD Pipeline',
    workCompleted: 'Automated deployment to AKS, Helm deployment, environment configuration and rollout strategy',
    hours: 8,
  },
  {
    id: 11,
    activity: 'Secrets & Configuration',
    workCompleted: 'Azure Key Vault / Kubernetes secrets, managed identity and secure configuration handling',
    hours: 5,
  },
  {
    id: 12,
    activity: 'Monitoring & Logging',
    workCompleted: 'Container/AKS monitoring, Log Analytics, alerts and basic dashboard configuration',
    hours: 5,
  },
  {
    id: 13,
    activity: 'Testing & Troubleshooting',
    workCompleted: 'End-to-end deployment testing, pod/service/ingress troubleshooting and pipeline fixes',
    hours: 8,
  },
  {
    id: 14,
    activity: 'Documentation',
    workCompleted: 'Deployment architecture, CI/CD flow, infrastructure details and operational runbook',
    hours: 4,
  },
  {
    id: 15,
    activity: 'Handover & KT',
    workCompleted: 'Knowledge transfer, deployment walkthrough and operational handover',
    hours: 3,
  },
];

const DEFAULT_TERMS = [
  'Cloud Infrastructure & Azure Subscriptions: All Microsoft Azure cloud subscription costs, resource usage billing (AKS cluster, Virtual Machines, VNets, Bandwidth, ACR, Key Vault, Public IPs/Load Balancers), domain names, and third-party software licenses are to be owned, maintained, and paid directly by the customer as per standard industry practice.',
  'Access & Permissions: The customer is responsible for providing timely administrative/RBAC access to Azure subscriptions, Git repositories, and required credentials/secrets to ensure uninterrupted milestone completion.',
  'Source Code & Application Dependencies: Application codebases, runtime dependencies, build parameters, and test credentials must be provided by the customer team as per the agreed project schedule.',
  'Industry Standards: All DevOps architecture, automation scripts, and container workflows are configured according to industry best practices, least-privilege security principles, and Azure Well-Architected standards.',
  'Scope of Engagement: The scope is strictly limited to the 15 deliverables outlined above. Any additional services, custom module development, or post-handover SLA support will be handled under a separate mutual agreement.'
];

export default function LetterheadPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [docTitle, setDocTitle] = useState('Azure AKS & CI/CD — DevOps Deliverables');
  const [planDuration, setPlanDuration] = useState('2-Month Deliverable Work Plan');
  const [hourlyRate, setHourlyRate] = useState(1900);
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [refNumber, setRefNumber] = useState('DOD/AKS-DEL/2025-26/01');
  const [issueDate, setIssueDate] = useState('September 19, 2025');
  const [clientName, setClientName] = useState('Enterprise Client / Partner');
  const [styleTheme, setStyleTheme] = useState<'corporate' | 'navy' | 'slate'>('corporate');

  const [engagementScope, setEngagementScope] = useState(
    'The following activities represent the completed DevOps deliverables for hosting the application on Microsoft Azure Kubernetes Service (AKS), including containerization, Kubernetes deployment, CI/CD automation, networking, security, monitoring, testing, documentation and handover. The work is planned and documented as a two-month delivery engagement.'
  );

  const [deliveryPeriodNote, setDeliveryPeriodNote] = useState(
    'Two months. The effort breakdown above covers the stated deliverable activities for the engagement.'
  );

  const [deliverables, setDeliverables] = useState<DeliverableItem[]>(DEFAULT_DELIVERABLES);
  const [terms, setTerms] = useState<string[]>(DEFAULT_TERMS);

  const totalHours = useMemo(() => {
    return deliverables.reduce((sum, item) => sum + (Number(item.hours) || 0), 0);
  }, [deliverables]);

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    if (confirm('Reset document to default content and settings?')) {
      setDocTitle('Azure AKS & CI/CD — DevOps Deliverables');
      setPlanDuration('2-Month Deliverable Work Plan');
      setHourlyRate(1900);
      setCurrencySymbol('₹');
      setRefNumber('DOD/AKS-DEL/2025-26/01');
      setIssueDate('September 19, 2025');
      setClientName('Enterprise Client / Partner');
      setEngagementScope(
        'The following activities represent the completed DevOps deliverables for hosting the application on Microsoft Azure Kubernetes Service (AKS), including containerization, Kubernetes deployment, CI/CD automation, networking, security, monitoring, testing, documentation and handover. The work is planned and documented as a two-month delivery engagement.'
      );
      setDeliveryPeriodNote(
        'Two months. The effort breakdown above covers the stated deliverable activities for the engagement.'
      );
      setDeliverables(DEFAULT_DELIVERABLES);
      setTerms(DEFAULT_TERMS);
      setIsEditing(false);
    }
  };

  const handleItemChange = (id: number, field: keyof DeliverableItem, value: any) => {
    setDeliverables((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            [field]: field === 'hours' ? Number(value) || 0 : value,
          };
        }
        return item;
      })
    );
  };

  const handleTermChange = (index: number, value: string) => {
    setTerms((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  // Theme color definitions
  const themeClasses = {
    corporate: {
      primary: '#0F7AE5',
      primaryDark: '#041E3D',
      accent: '#06B6D4',
      tableHeaderBg: 'bg-[#0f2e5a]',
      tableHeaderBorder: 'border-[#1e3a8a]',
      totalRowBg: 'bg-[#eef6ff]',
      accentBorder: 'from-cyan-500 via-blue-600 to-teal-500',
    },
    navy: {
      primary: '#1e3a8a',
      primaryDark: '#0f172a',
      accent: '#3b82f6',
      tableHeaderBg: 'bg-[#172554]',
      tableHeaderBorder: 'border-[#1e3a8a]',
      totalRowBg: 'bg-[#eff6ff]',
      accentBorder: 'from-blue-700 via-indigo-600 to-sky-500',
    },
    slate: {
      primary: '#334155',
      primaryDark: '#0f172a',
      accent: '#64748b',
      tableHeaderBg: 'bg-[#1e293b]',
      tableHeaderBorder: 'border-[#334155]',
      totalRowBg: 'bg-[#f1f5f9]',
      accentBorder: 'from-slate-600 via-gray-700 to-slate-800',
    },
  }[styleTheme];

  return (
    <div className="letterhead-container min-h-screen bg-slate-100 dark:bg-slate-950 py-3 px-2 sm:px-4 md:py-6">
      {/* Interactive Control Header (Hidden in Print) */}
      <div className="no-print max-w-[860px] mx-auto mb-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <FaArrowLeft className="text-xs" /> Back
            </Link>
            <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-white text-sm sm:text-base">
                  Official Letterhead & Work Plan
                </span>
                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <FaCheck className="text-[8px]" /> 1-Page A4 Print Fit
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Standard responsive text on mobile & screen • Formatted for 1-page A4 print.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Currency Selector */}
            <select
              aria-label="Currency Selector"
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="₹">₹ INR</option>
              <option value="$">$ USD</option>
              <option value="€">€ EUR</option>
              <option value="£">£ GBP</option>
            </select>

            {/* Theme Style */}
            <select
              aria-label="Theme Style Selector"
              value={styleTheme}
              onChange={(e) => setStyleTheme(e.target.value as any)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="corporate">Corporate (Teal/Blue)</option>
              <option value="navy">Executive Navy</option>
              <option value="slate">Minimal Slate</option>
            </select>

            {/* Edit Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                isEditing
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <FaEdit className="text-xs" />
              {isEditing ? 'Editing Active' : 'Edit Content'}
            </button>

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleReset}
              title="Reset to default content"
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors"
            >
              <FaUndo className="text-xs" />
            </button>

            {/* Primary Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <FaPrint className="text-xs" /> Print Letterhead
            </button>
          </div>
        </div>

        {isEditing && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-xl p-2.5 text-xs flex items-center justify-between">
            <span>✏️ <strong>Edit Mode On:</strong> You can modify activities, hours, billing rate, scope, and terms directly. Click &quot;Editing Active&quot; when finished.</span>
            <button 
              onClick={() => setIsEditing(false)}
              className="underline font-bold text-amber-900 dark:text-amber-100 ml-2"
            >
              Done Editing
            </button>
          </div>
        )}
      </div>

      {/* The Letterhead Sheet (Responsive on Mobile, Standard Print Sizing on Paper) */}
      <div 
        className="letterhead-page max-w-[860px] mx-auto bg-white text-slate-900 shadow-xl sm:shadow-2xl rounded-lg sm:rounded-sm transition-all duration-200 overflow-hidden p-4 sm:p-6 md:p-8"
      >
        {/* ===================== LETTERHEAD TOP HEADER ===================== */}
        <header className="border-b pb-3 mb-3 print:pb-1.5 print:mb-1.5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:flex-row print:items-start">
            {/* Company Brand Logo & Titles */}
            <div className="flex items-center gap-3">
              {/* High-res Scalable Brand SVG */}
              <svg width="46" height="46" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 print:w-[38px] print:h-[38px]">
                <defs>
                  <linearGradient id="lhLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0F7AE5" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
                <rect x="6" y="6" width="88" height="88" rx="18" fill="url(#lhLogoGrad)" />
                <path d="M 28 26 L 50 26 C 62 26 70 34 70 50 C 70 66 62 74 50 74 L 28 74 Z" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                <text x="50" y="66" fontFamily="'Inter', system-ui, -apple-system, sans-serif" fontSize="42" fontWeight="900" fill="#ffffff" textAnchor="middle" letterSpacing="-1">
                  DD
                </text>
              </svg>

              <div>
                <div className="letterhead-brand-title flex items-center gap-1.5 leading-none">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                    The DevOps
                  </span>
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-[#0F7AE5]">
                    Duoo
                  </span>
                </div>
                <p className="letterhead-brand-sub text-xs sm:text-sm font-semibold tracking-wide uppercase text-slate-600 mt-0.5">
                  Cloud Infrastructure & Enterprise DevOps Solutions
                </p>
                <p className="letterhead-brand-sub text-[11px] sm:text-xs text-slate-500 font-medium">
                  Kubernetes • CI/CD Automation • Cloud Architecture • SRE Consulting
                </p>
              </div>
            </div>

            {/* Contact Information Block */}
            <div className="letterhead-contact text-left sm:text-right text-xs sm:text-sm text-slate-600 space-y-1 print:text-right print:space-y-0.5">
              <div className="flex items-center sm:justify-end gap-1.5 font-medium">
                <span>Shivneri Plaza, Gujrat Colony, Kothrud, Pune, MH 411038</span>
                <FaMapMarkerAlt className="text-blue-600 text-xs flex-shrink-0" />
              </div>
              <div className="flex items-center sm:justify-end gap-1.5">
                <a href="mailto:devopsduoo@devopsduoo.in" className="hover:underline text-blue-600 sm:text-slate-700 font-medium">
                  devopsduoo@devopsduoo.in
                </a>
                <FaEnvelope className="text-blue-600 text-xs flex-shrink-0" />
              </div>
              <div className="flex items-center sm:justify-end gap-1.5">
                <span>+91 8788202975</span>
                <FaPhoneAlt className="text-blue-600 text-xs flex-shrink-0" />
              </div>
              <div className="flex items-center sm:justify-end gap-1.5">
                <span>www.devopsduoo.com</span>
                <FaGlobe className="text-blue-600 text-xs flex-shrink-0" />
              </div>
            </div>
          </div>

          {/* Decorative Modern Corporate Gradient Ribbon */}
          <div className={`h-[3px] w-full bg-gradient-to-r ${themeClasses.accentBorder} rounded-full mt-2.5 mb-2 print:mt-1.5 print:mb-1`} />

          {/* Document Reference Strip */}
          <div className="letterhead-ref flex flex-wrap justify-between items-center text-xs sm:text-sm text-slate-600 gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                <strong className="text-slate-800">Doc Ref:</strong>{' '}
                {isEditing ? (
                  <input
                    aria-label="Document Reference"
                    type="text"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    className="border border-slate-300 rounded px-1.5 py-0.5 text-xs w-44 font-mono"
                  />
                ) : (
                  <span className="font-mono text-slate-900 font-semibold">{refNumber}</span>
                )}
              </span>
              <span className="hidden sm:inline">•</span>
              <span>
                <strong className="text-slate-800">Client:</strong>{' '}
                {isEditing ? (
                  <input
                    aria-label="Client Name"
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="border border-slate-300 rounded px-1.5 py-0.5 text-xs w-44"
                  />
                ) : (
                  <span className="text-slate-900 font-medium">{clientName}</span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span>
                <strong className="text-slate-800">Date:</strong>{' '}
                {isEditing ? (
                  <input
                    aria-label="Issue Date"
                    type="text"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="border border-slate-300 rounded px-1.5 py-0.5 text-xs w-36"
                  />
                ) : (
                  <span className="text-slate-900 font-medium">{issueDate}</span>
                )}
              </span>
              <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-xs border border-blue-200">
                Official Deliverable
              </span>
            </div>
          </div>
        </header>

        {/* ===================== DOCUMENT TITLE & SUBTITLE ===================== */}
        <section className="text-center mb-3 print:mb-1.5">
          {isEditing ? (
            <input
              aria-label="Document Title"
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full text-center text-lg sm:text-xl md:text-2xl font-black text-slate-900 border border-slate-300 rounded px-2 py-1"
            />
          ) : (
            <h1 className="letterhead-title text-lg sm:text-xl md:text-2xl font-extrabold text-slate-950 tracking-tight">
              {docTitle}
            </h1>
          )}

          <div className="letterhead-subtitle flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            {isEditing ? (
              <div className="flex flex-wrap items-center gap-2 justify-center">
                <input
                  aria-label="Plan Duration"
                  type="text"
                  value={planDuration}
                  onChange={(e) => setPlanDuration(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-0.5 text-xs w-56 text-center"
                />
                <span>| Rate ({currencySymbol}):</span>
                <input
                  aria-label="Hourly Rate"
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
                  className="border border-slate-300 rounded px-2 py-0.5 text-xs w-24 text-center font-bold"
                />
              </div>
            ) : (
              <p>
                <span className="font-semibold text-slate-700">{planDuration}</span>
                <span className="mx-2 text-slate-300">|</span>
                <span>Billing Rate: <strong className="text-slate-950">{currencySymbol}{hourlyRate.toLocaleString()} per hour</strong></span>
              </p>
            )}
          </div>
        </section>

        {/* ===================== ENGAGEMENT SCOPE ===================== */}
        <section className="letterhead-scope mb-3 print:mb-1.5 bg-slate-50 border border-slate-200 rounded-lg p-3 print:p-1.5">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-blue-600 rounded-full inline-block" />
            Engagement Scope
          </h2>
          {isEditing ? (
            <textarea
              aria-label="Engagement Scope Text"
              value={engagementScope}
              onChange={(e) => setEngagementScope(e.target.value)}
              rows={3}
              className="w-full text-xs sm:text-sm text-slate-700 border border-slate-300 rounded p-1.5 leading-relaxed"
            />
          ) : (
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify">
              {engagementScope}
            </p>
          )}
        </section>

        {/* ===================== DELIVERABLES TABLE (15 ITEMS) ===================== */}
        <section className="mb-3 print:mb-1.5">
          <div className="overflow-x-auto print:overflow-visible rounded-lg border border-slate-300">
            <table className="letterhead-table w-full text-left border-collapse min-w-[620px] print:min-w-full">
              <thead>
                <tr className={`${themeClasses.tableHeaderBg} text-white text-xs sm:text-sm`}>
                  <th className="py-2 px-2.5 text-center font-bold border-r border-slate-600 w-[40px] print:w-[22px]">#</th>
                  <th className="py-2 px-3 font-bold border-r border-slate-600 w-[180px] print:w-[150px]">Activity</th>
                  <th className="py-2 px-3 font-bold border-r border-slate-600">Work Completed</th>
                  <th className="py-2 px-3 text-center font-bold w-[70px] print:w-[44px]">Hours</th>
                </tr>
              </thead>
              <tbody>
                {deliverables.map((item, idx) => (
                  <tr 
                    key={item.id}
                    className={`text-xs sm:text-sm leading-normal transition-colors border-b border-slate-200 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-[#fcfdfd]'
                    } hover:bg-blue-50/50`}
                  >
                    <td className="py-1.5 px-2.5 text-center text-slate-500 font-semibold border-r border-slate-200">
                      {item.id}
                    </td>
                    <td className="py-1.5 px-3 font-semibold text-slate-900 border-r border-slate-200">
                      {isEditing ? (
                        <input
                          aria-label={`Activity ${item.id}`}
                          type="text"
                          value={item.activity}
                          onChange={(e) => handleItemChange(item.id, 'activity', e.target.value)}
                          className="w-full text-xs sm:text-sm font-semibold border border-slate-300 rounded px-1.5 py-0.5"
                        />
                      ) : (
                        item.activity
                      )}
                    </td>
                    <td className="py-1.5 px-3 text-slate-600 border-r border-slate-200">
                      {isEditing ? (
                        <input
                          aria-label={`Work Completed ${item.id}`}
                          type="text"
                          value={item.workCompleted}
                          onChange={(e) => handleItemChange(item.id, 'workCompleted', e.target.value)}
                          className="w-full text-xs sm:text-sm border border-slate-300 rounded px-1.5 py-0.5"
                        />
                      ) : (
                        item.workCompleted
                      )}
                    </td>
                    <td className="py-1.5 px-3 text-center font-bold text-slate-800">
                      {isEditing ? (
                        <input
                          aria-label={`Hours ${item.id}`}
                          type="number"
                          value={item.hours}
                          onChange={(e) => handleItemChange(item.id, 'hours', e.target.value)}
                          className="w-12 text-xs sm:text-sm font-bold text-center border border-slate-300 rounded px-1 py-0.5"
                        />
                      ) : (
                        item.hours
                      )}
                    </td>
                  </tr>
                ))}

                {/* Total Hours Row */}
                <tr className={`${themeClasses.totalRowBg} font-bold text-xs sm:text-sm text-slate-950 border-t-2 border-slate-400`}>
                  <td colSpan={2} className="py-2 px-3 border-r border-slate-300">
                    <span className="font-extrabold tracking-wide uppercase text-slate-900">Total</span>
                  </td>
                  <td className="py-2 px-3 border-r border-slate-300 text-right text-xs text-slate-500 font-normal italic">
                    Cumulative Planned Hours
                  </td>
                  <td className="py-2 px-3 text-center text-slate-950 font-black">
                    {totalHours}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ===================== FINANCIAL & EFFORT SUMMARY ===================== */}
        <section className="letterhead-summary mb-3 print:mb-1.5 bg-slate-50 border border-slate-200 rounded-lg p-3 print:p-1.5 text-xs sm:text-sm leading-normal">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-slate-800">
            <span>
              <strong className="text-slate-950">Total Effort:</strong>{' '}
              <span className="font-bold text-blue-700">{totalHours} hours</span>
            </span>
            <span className="text-slate-300">|</span>
            <span>
              <strong className="text-slate-950">Billing Basis:</strong>{' '}
              <span className="font-semibold text-slate-900">{currencySymbol}{hourlyRate.toLocaleString()} per hour.</span>
            </span>
            <span className="text-slate-300">|</span>
            <span>
              <strong className="text-slate-950">Delivery Period:</strong>{' '}
              {isEditing ? (
                <input
                  aria-label="Delivery Period Note"
                  type="text"
                  value={deliveryPeriodNote}
                  onChange={(e) => setDeliveryPeriodNote(e.target.value)}
                  className="border border-slate-300 rounded px-1.5 py-0.5 text-xs w-72 ml-1"
                />
              ) : (
                <span>{deliveryPeriodNote}</span>
              )}
            </span>
          </div>
        </section>

        {/* ===================== TERMS & CONDITIONS / CUSTOMER PREREQUISITES ===================== */}
        <section className="letterhead-terms mb-3 print:mb-1.5 bg-slate-50/90 border border-slate-200 rounded-lg p-3 print:p-1.5 text-xs sm:text-sm leading-relaxed">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 bg-blue-600 rounded-full inline-block" />
              Terms & Conditions / Customer Obligations
            </h3>
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider hidden sm:inline">
              Standard DevOps Engagement Terms
            </span>
          </div>

          <ol className="list-decimal list-outside space-y-1.5 text-slate-600 pl-4">
            {terms.map((term, index) => (
              <li key={index} className="pl-1">
                {isEditing ? (
                  <textarea
                    aria-label={`Term ${index + 1}`}
                    value={term}
                    onChange={(e) => handleTermChange(index, e.target.value)}
                    rows={2}
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded p-1.5 leading-relaxed"
                  />
                ) : (
                  <span>{term}</span>
                )}
              </li>
            ))}
          </ol>
        </section>

        {/* ===================== OFFICIAL LETTERHEAD BOTTOM FOOTER ===================== */}
        <footer className="letterhead-footer border-t border-slate-200 pt-2 text-xs sm:text-sm text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex flex-wrap items-center gap-2 font-medium text-center sm:text-left">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
            <span className="text-slate-800 font-bold">The DevOps Duoo</span>
            <span>•</span>
            <span>Pune, Maharashtra, India</span>
            <span>•</span>
            <span className="text-blue-700 font-semibold">devopsduoo@devopsduoo.in</span>
          </div>

          <div className="flex items-center gap-2 font-medium text-slate-400">
            <span>Confidential & Proprietary</span>
            <span>•</span>
            <span className="font-bold text-slate-700">Page 1 of 1</span>
          </div>
        </footer>
      </div>

      {/* Screen Helper Tips (Hidden in Print) */}
      <div className="no-print max-w-[860px] mx-auto mt-4 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        <p>
          💡 <strong>Printing Advice:</strong> Click <strong>Print Letterhead</strong> and choose <strong>Save as PDF</strong> (Paper size: A4, Margins: Default or None, Background Graphics checked) to print out on exactly 1 single A4 page.
        </p>
      </div>
    </div>
  );
}
