import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Official Letterhead & DevOps Deliverables | The DevOps Duoo',
  description:
    'Official corporate letterhead and Azure AKS & CI/CD DevOps deliverables work plan for The DevOps Duoo. Optimized for single-page printing and PDF export.',
};

export default function LetterheadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
