import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// 受験結果ページ（サーバーコンポーネント）
// - 認証済みユーザーの特定の受験ID(attemptId)を受け取り
// - DBから受験結果を取得
// - スコアなどを計算して表示します

type ResultPageProps = {
    params: { attemptId: string };
};

export default async function ResultPage({ params }: ResultPageProps) {
    const { attemptId } = params;

    // 認証: ログイン中のユーザー情報を取得
    //   - 未ログインの場合は requireUser() 内でリダイレクト/エラー処理される想定
    const { userId } = await requireUser();

    // DB から受験データを取得（本人のデータに限定）
    //   - include でテンプレート情報(問題数)と、各設問の正誤だけを読み込み
    const attempt = await prisma.examAttempt.findFirst({
        where: { id: attemptId, userId },
        include: {
            template: true,
            questions: {
                select: { orderIndex: true, isCorrect: true },
            },
        },
    });

    // 受験データが見つからない場合は 404
    if (!attempt) return notFound();

    // 表示用の派生値を計算
    const totalQuestions = attempt.template.questionCount; // 総問題数
    const correctCount = attempt.questions.filter((q) => q.isCorrect).length; // 正解数
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100); // スコア(%)

    // 誤答の問題番号（orderIndex をそのまま表示に利用）
    const wrongOrderIndices = attempt.questions
        .filter((q) => q.isCorrect === false)
        .map((q) => q.orderIndex);

    // 所要時間（秒→分、端数は切り上げ）
    const durationMinutes = attempt.durationSec
        ? Math.ceil(attempt.durationSec / 60)
        : null;

    // 画面描画
    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <h1 className="text-xl font-semibold">結果</h1>

            {/* 基本情報のカード */}
            <div className="p-4 border rounded-md bg-white">
                <div className="text-lg">
                    スコア: <span className="font-semibold">{scorePercentage}%</span>
                </div>

                <div>
                    合否:{' '}
                    <span
                        className={`font-semibold ${attempt.isPassed ? 'text-green-700' : 'text-red-700'
                            }`}
                    >
                        {attempt.isPassed ? '合格' : '不合格'}
                    </span>
                </div>

                <div>
                    所要時間: {durationMinutes !== null ? durationMinutes : '-'} 分
                </div>
            </div>

            {/* 誤答リスト */}
            <div>
                <div className="font-semibold mb-2">誤答の問題番号</div>
                {wrongOrderIndices.length === 0 ? (
                    <div>誤答なし</div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {wrongOrderIndices.map((index) => (
                            <Link
                                key={index}
                                className="px-2 py-1 border rounded-md"
                                href={`/review/${attemptId}/${index}`}
                            >
                                {index}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* ナビゲーション */}
            <div className="flex gap-3">
                <Link href="/history" className="px-3 py-2 border rounded-md">
                    受験履歴へ
                </Link>
                <Link
                    href="/exam/start"
                    className="px-3 py-2 bg-blue-600 text-white rounded-md"
                >
                    もう一度受ける
                </Link>
            </div>
        </div>
    );
}