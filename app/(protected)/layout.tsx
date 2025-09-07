// app/(protected)/layout.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in'); // 未ログインならサインインへ

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b bg-white flex items-center justify-between px-4">
        <div className="font-semibold">Silver SQL 2019模擬試験プログラム</div>
        <UserButton afterSignOutUrl="/sign-in" />
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
