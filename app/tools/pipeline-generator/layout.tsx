import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CI/CD Pipeline Generator - Free DevOps Tool | DevOps Duoo',
  description:
    'Generate production-ready CI/CD pipeline YAML files for GitHub Actions, GitLab CI, and Jenkins in seconds. Supports Node.js, Python, Go, Java and more. Free DevOps tool by DevOps Duoo.',
  keywords: [
    'ci cd pipeline generator',
    'github actions generator',
    'gitlab ci generator',
    'jenkins pipeline generator',
    'devops tool',
    'pipeline yaml generator',
    'kubernetes deployment pipeline',
    'docker pipeline generator',
  ],
  openGraph: {
    title: 'CI/CD Pipeline Generator - Free DevOps Tool | DevOps Duoo',
    description:
      'Generate production-ready CI/CD pipeline configuration files for GitHub Actions, GitLab CI, and Jenkins in seconds.',
    url: '/tools/pipeline-generator',
    type: 'website',
  },
};

export default function PipelineGeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
