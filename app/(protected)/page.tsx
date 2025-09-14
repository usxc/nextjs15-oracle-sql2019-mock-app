import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const { userId, user } = await requireUser();
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const name = profile?.displayName ?? user?.fullName ?? user?.firstName ?? 'User';
  const imageUrl = profile?.imageUrl ?? user?.imageUrl ?? undefined;

  const tmpl = await prisma.examTemplate.findFirst({ where: { isActive: true } });
  const disabled = !tmpl;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <section className="relative overflow-hidden rounded-2xl border bg-white shadow-sm text-slate-900">
        <div className="absolute inset-0 -z-10 opacity-60 bg-gradient-to-r from-indigo-500/20 via-sky-500/20 to-emerald-500/20" />

        <div className="p-6 sm:p-8 flex items-center gap-6">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt="avatar"
              width={64}
              height={64}
              className="w-16 h-16 rounded-full ring-2 ring-indigo-500/40"
              unoptimized
            />
          ) : (
            <div className="w-16 h-16 min-w-16 min-h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-500" aria-hidden />
          )}

          <div className="flex-1 min-w-0">
            <div className="text-2xl font-semibold tracking-tight text-slate-800">ようこそ、{name} さん</div>
            <p className="mt-1 text-sm text-gray-600">これは Silver SQL 2019 の模擬試験を受験できるサービスです。</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 ring-1 ring-gray-200">78問</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 ring-1 ring-gray-200">120分</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 ring-1 ring-gray-200">合格 63%</span>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-6 sm:pb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={disabled ? "#" : "/exam/start"}
              aria-disabled={disabled}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md shadow-sm transition-colors ${
                disabled
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'text-white bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500'
              }`}
            >
              <svg
                aria-hidden
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M8 5.14v13.72c0 .79.87 1.27 1.53.85l9.02-6.86a1 1 0 0 0 0-1.64L9.53 4.29A1 1 0 0 0 8 5.14Z" />
              </svg>
              {disabled ? 'テンプレ未設定' : '模試を始める'}
            </Link>
            <Link
              href="/history"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-gray-50"
            >
              <svg
                aria-hidden
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-4 w-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              受験履歴
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
