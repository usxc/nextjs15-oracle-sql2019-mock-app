import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth"
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
    const { userId } = await requireUser();
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    const name = profile?.displayName ?? 'User';
    const imageUrl = profile?.imageUrl;

    const tmpl = await prisma.examTemplate.findFirst({ where: { isActive: true } });

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <section className="flex items-center gap-4">
                {imageUrl && (
                    <Image
                        src={imageUrl}
                        alt="avatar"
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full"
                        unoptimized
                    />
                )}
                <div>
                    <div className="text-lg font-semibold">{name}</div>
                    <p className="text-sm text-gray-600">OM Silver SQL 2019 模試 / 78問 / 120分 / 合格63%</p>
                </div>
            </section>

            <div className="flex gap-4">
                <Link
                    href={tmpl ? "/exam/start" : "#"}
                    className={`px-4 py-2 rounded-md ${tmpl ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                    aria-disabled={!tmpl}
                >
                    {tmpl ? '模試を始める' : 'テンプレ未設定'}
                </Link>
                <Link href="/history" className="px-4 py-2 border rounded-md">受験履歴</Link>
            </div>
        </div>
    );
}
