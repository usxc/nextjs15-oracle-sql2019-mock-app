import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'Oracle Mock Exam',
  description: 'CBT-like mock exam for OM Silver SQL 2019',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="ja">
        <body className="min-h-screen bg-gray-50 text-gray-900">{children}</body>
      </html>
    </ClerkProvider>
  );
}