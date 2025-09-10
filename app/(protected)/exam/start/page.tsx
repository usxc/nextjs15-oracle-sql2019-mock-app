import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/db";
import { createAttempt } from "@/lib/exam-service";
import { redirect } from "next/navigation";
import Link from "next/link";


export default async function ExamStartPage() {
    const { userId } = await requireUser();

    // アクティブな試験テンプレートを1件取得（１件だけなら findFirst でOK）
    const activeExamTemplate = await prisma.examTemplate.findFirst({ where: { isActive: true } });

    if (!activeExamTemplate) {
        return (
            <div className="p-6">
                アクティブなテンプレートがありません。SupabaseのSQLエディタからデータを追加してください。
            </div>
        )
    }

    async function startExam(formData: FormData) {
        'use server'
        const templateId = formData.get('templateId');
        if (typeof templateId !== 'string' || !templateId) {
            throw new Error('Invalid templateId');
        }
        const attempt = await createAttempt({ userId, templateId });
        redirect(`/exam/${attempt.id}/question/1`); // 出題順1の問題へリダイレクト
    }

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <h1 className="text-xl font-semibold">模試を開始</h1>

            <div className="rounded-md border p-4 bg-white">
                <div className="font-medium mb-2">{activeExamTemplate.name}</div>
                <ul className="text-sm text-gray-700 space-y-1">
                    <li>問題数: {activeExamTemplate.questionCount} 問</li>
                    <li>制限時間: {Math.floor(activeExamTemplate.durationSec / 60)} 分</li>
                    <li>合格基準: {(activeExamTemplate.passThreshold * 100).toFixed(0)}%</li>
                </ul>
            </div>

            <form action={startExam} className="flex items-center gap-3">
                <input type="hidden" name="templateId" value={activeExamTemplate.id} />
                <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                    受験を開始する
                </button>
                <Link href="/" className="px-4 py-2 border rounded-md">戻る</Link>
            </form>
        </div>
    );
}
