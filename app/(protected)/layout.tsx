import { UserButton } from '@clerk/nextjs';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
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