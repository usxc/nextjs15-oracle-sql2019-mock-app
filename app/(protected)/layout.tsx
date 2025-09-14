// app/(protected)/layout.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in'); // 未ログインならサインインへ

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-white">
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur text-slate-900">
        <div className="max-w-6xl mx-auto h-14 flex items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold tracking-tight">Silver SQL 2019 模試</span>
          </Link>
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>
      <main className="flex-1 text-slate-900">{children}</main>
    </div>
  );
}
