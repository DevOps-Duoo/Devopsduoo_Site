import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard Detective - DevOps Incident Response Game | DevOps Duoo',
  description:
    'Test your DevOps skills in this real-time incident response simulation. Triage CPU spikes, memory leaks, DDoS attacks, and bad deployments before production crashes. Free interactive game by DevOps Duoo.',
  keywords: [
    'devops game',
    'incident response simulator',
    'SRE training game',
    'devops incident management',
    'cloud monitoring game',
    'dashboard detective',
    'site reliability engineering',
    'devops skills test',
    'production incident simulator',
    'on-call training',
  ],
  openGraph: {
    title: 'Dashboard Detective - DevOps Incident Response Game | DevOps Duoo',
    description:
      'Can you keep production alive? Triage real-time incidents in this interactive DevOps simulation game.',
    url: '/dashboard-detective',
    type: 'website',
  },
};

export default function DashboardDetectiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-detective-root">
      {children}
    </div>
  );
}
