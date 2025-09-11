import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import ExamTimer from '@/components/ExamTimer';
import QuestionForm from './question-form';
import { canUpdateNow, finishAttempt } from '@/lib/exam-service';

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

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* ヘッダー: 進捗と残り時間 */}
            <div className="flex items-center justify-between">
                <div className="font-semibold">
                    問題 {orderIndex} / {totalQuestions}
                </div>
                {/* タイマーには ISO 文字列を渡す */}
                <ExamTimer expiresAt={attempt.expiresAt.toISOString()} />
            </div>

            {/* 問題本文と回答フォーム */}
            <div className="space-y-4">
                <div className="text-lg font-medium whitespace-pre-wrap">
                    {attemptQuestion.question.text}
                </div>
                <QuestionForm
                    attemptQuestionId={attemptQuestion.id}
                    questionType={attemptQuestion.question.type}
                    orderedChoiceIds={attemptQuestion.shuffledChoiceIds}
                    allChoices={attemptQuestion.question.choices}
                    initialSelectedChoiceIds={attemptQuestion.answer?.selectedChoiceIds ?? []}
                    initialIsMarked={attemptQuestion.isMarked}
                    isLocked={!canUpdate} // 時間切れなら編集不可
                />
            </div>

            {/* ナビゲーションとアクション */}
            <div className="flex gap-3">
                {orderIndex > 1 && (
                    <Link
                        className="px-3 py-2 border rounded-md"
                        href={`/exam/${attemptId}/question/${orderIndex - 1}`}
                    >
                        前へ
                    </Link>
                )}

                {orderIndex < totalQuestions && (
                    <Link
                        className="px-3 py-2 border rounded-md"
                        href={`/exam/${attemptId}/question/${orderIndex + 1}`}
                    >
                        次へ
                    </Link>
                )}

                <Link
                    className="ml-auto px-3 py-2 border rounded-md"
                    href={`/exam/${attemptId}/summary`}
                >
                    サマリー
                </Link>

                <Link
                    className="px-3 py-2 border rounded-md"
                    href={`/exam/${attemptId}/review`}
                >
                    見直し一覧
                </Link>

                {/* サーバーアクション: 終了して採点 → 結果ページへリダイレクト */}
                <form
                    action={async () => {
                        'use server';
                        await finishAttempt({ attemptId, end: 'USER_FINISH' });
                        redirect(`/exam/${attemptId}/result`);
                    }}
                >
                    <button className="px-3 py-2 bg-red-600 text-white rounded-md">
                        終了して採点
                    </button>
                </form>
            </div>

            {/* 時間切れの案内 */}
            {!canUpdate && (
                <div className="p-3 rounded-md bg-amber-100 border border-amber-300">
                    時間切れです。回答や見直しはできません。「終了して採点」を押してください。
                </div>
            )}
        </div>
    );
}
