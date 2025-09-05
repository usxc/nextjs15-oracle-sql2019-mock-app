import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'Silver SQL 2019模擬試験プログラム',
  description: 'Silver SQL 2019のCBT試験ライクの模擬試験を提供するアプリケーションです。',
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