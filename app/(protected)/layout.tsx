// app/(protected)/layout.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import AppHeader from '@/components/AppHeader';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in'); // 未ログインならサインインへ

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-white">
      <AppHeader />
      <main className="flex-1 text-slate-900">{children}</main>
    </div>
  );
}
