import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dockerfile Generator - Free DevOps Tool | DevOps Duoo',
  description:
    'Generate production-ready, optimized, and multi-stage Dockerfiles for Node.js, Python, Go, Java, and more in seconds. Free DevOps tool by DevOps Duoo.',
  keywords: [
    'dockerfile generator',
    'docker generator',
    'docker build generator',
    'multi-stage dockerfile',
    'devops tool',
    'nodejs dockerfile',
    'python dockerfile',
    'go dockerfile',
  ],
  openGraph: {
    title: 'Dockerfile Generator - Free DevOps Tool | DevOps Duoo',
    description:
      'Generate production-ready, optimized, and multi-stage Dockerfiles for your applications in seconds.',
    url: '/tools/dockerfile-generator',
    type: 'website',
  },
};

export default function DockerfileGeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
