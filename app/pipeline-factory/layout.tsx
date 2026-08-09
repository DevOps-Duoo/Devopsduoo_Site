import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Pipeline Factory - CI/CD Simulator Game | DevOps Duoo',
  description:
    'Learn CI/CD concepts by building a software delivery pipeline. Assemble stages, run your code, and see if it reaches production securely. Free interactive game by DevOps Duoo.',
  keywords: [
    'CI/CD game',
    'devops simulator',
    'pipeline builder',
    'continuous integration game',
    'devops learning',
    'pipeline factory',
    'software delivery lifecycle',
    'learn devops interactively',
  ],
  openGraph: {
    title: 'The Pipeline Factory - CI/CD Simulator Game | DevOps Duoo',
    description:
      'Can you build the perfect CI/CD pipeline? Test your skills in this interactive DevOps simulation game.',
    url: '/pipeline-factory',
    type: 'website',
  },
};

export default function PipelineFactoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pipeline-factory-root">
      {children}
    </div>
  );
}
