import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { canUpdateNow, finishAttempt } from '@/lib/exam-service';
import QuestionPageClient from './QuestionPageClient';

/**
 * 問題ページ（サーバーコンポーネント）
 * - URL: /exam/:attemptId/question/:index
 * - :index は 1 始まり（1-based）の出題番号
 */
type PageProps = {
    params: {
        attemptId: string;
        index: string; // URL パラメータは文字列として渡ってくる
    };
};

export default async function Page({ params: { attemptId, index } }: PageProps) {
    // 認証: ログインしているユーザー ID を取得（未ログインなら内部でリダイレクト/エラー）
    const { userId: currentUserId } = await requireUser();

    // URL から問題番号を数値化。1 未満や数値でない場合は 404
    const orderIndex = Number.parseInt(index, 10);
    if (!Number.isInteger(orderIndex) || orderIndex < 1) return notFound();

    // 受験中の試行（attempt）を取得。自分の attempt でなければ 404
    const attempt = await prisma.examAttempt.findUnique({
        where: { id: attemptId },
        include: { template: true },
    });
    if (!attempt || attempt.userId !== currentUserId) return notFound();

    // 表示対象の AttemptQuestion を取得
    const attemptQuestion = await prisma.attemptQuestion.findUnique({
        where: { attemptId_orderIndex: { attemptId, orderIndex } }, // ← @@unique([attemptId, orderIndex])
        include: {
            question: { include: { choices: true } },
            answer: true,
        },
    });
    if (!attemptQuestion) return notFound();

    const totalQuestions = attempt.template.questionCount; // 全問題数
    const canUpdate = await canUpdateNow(attempt); // まだ回答変更が許されるか（時間内か）

    const finishButton = (
        <form
            action={async () => {
                'use server';
                await finishAttempt({ attemptId, end: 'USER_FINISH' });
                redirect(`/exam/${attemptId}/result`);
            }}
        >
            <button className="rounded-md bg-red-600 px-4 py-2 text-white">終了して採点</button>
        </form>
    );

    return (
        <QuestionPageClient
            attemptId={attemptId}
            attemptQuestionId={attemptQuestion.id}
            orderIndex={orderIndex}
            totalQuestions={totalQuestions}
            expiresAt={attempt.expiresAt.toISOString()}
            templateName={attempt.template.name}
            questionText={attemptQuestion.question.text}
            questionType={attemptQuestion.question.type}
            orderedChoiceIds={attemptQuestion.shuffledChoiceIds}
            allChoices={attemptQuestion.question.choices}
            initialSelectedChoiceIds={attemptQuestion.answer?.selectedChoiceIds ?? []}
            initialIsMarked={attemptQuestion.isMarked}
            isLocked={!canUpdate}
            finishButton={finishButton}
        />
    );
}
