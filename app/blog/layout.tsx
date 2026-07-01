import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | DevOps Duoo Blog',
    default: 'DevOps Blog - Tutorials & Guides',
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
