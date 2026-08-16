import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hands-On DevOps Labs — Free Interactive Learning',
  description:
    'Practice DevOps skills in real AWS environments. Free interactive labs covering Docker, Kubernetes, Terraform, CI/CD, and more. 30-minute sessions with zero setup required.',
  keywords: [
    'DevOps labs',
    'hands-on DevOps training',
    'free DevOps practice',
    'Docker lab',
    'Kubernetes lab',
    'Terraform practice',
    'CI/CD lab',
    'interactive terminal',
    'DevOps learning platform',
    'KillerCoda alternative',
  ],
  openGraph: {
    title: 'DevOps Duoo — Free Hands-On Labs',
    description:
      'Practice DevOps in real AWS environments. Interactive labs with Docker, Kubernetes, Terraform, and more.',
    type: 'website',
  },
};

export default function LabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
