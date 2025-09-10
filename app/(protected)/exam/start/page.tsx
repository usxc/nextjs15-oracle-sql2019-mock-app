import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/db";
import { createAttempt } from "@/lib/exam-service";
import { redirect } from "next/navigation";


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
        <div></div>
    );
}
