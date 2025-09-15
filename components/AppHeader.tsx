'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

export default function AppHeader() {
  const pathname = usePathname();

  // Hide global header during an active exam session (after start)
  // Example paths to hide:
  // - /exam/:attemptId/question/1
  // - /exam/:attemptId/summary
  // - /exam/:attemptId/review
  // - /exam/:attemptId/result
  // - /exam/:attemptId/1 (review by order index)
  // Keep header on non-exam pages and on /exam/start
  const segments = pathname.split('/').filter(Boolean);
  const isExamRoute = segments[0] === 'exam';
  const isStartPage = isExamRoute && segments[1] === 'start';
  const isActiveExam = isExamRoute && !isStartPage && segments.length >= 2; // has attemptId

  if (isActiveExam) return null;

  return (
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
  );
}

