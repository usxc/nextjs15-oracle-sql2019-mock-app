import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import Link from 'next/link';

// 受験履歴ページ（サーバーコンポーネント）
// - 認証済みユーザー本人の受験履歴を新しい順で取得
// - 各受験のスコア/合否/受験日時/所要時間をカード表示

export default async function HistoryPage() {
    // 認証: ログイン中のユーザーIDを取得
    //   未ログイン時は requireUser() 側で処理（リダイレクト/エラー）される想定
    const { userId } = await requireUser();

    // DB から受験履歴を取得（本人限定）
    //   - startedAt の降順（新しい受験が先頭）
    //   - template（試験名など）も同時に読み込む
    const attempts = await prisma.examAttempt.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        include: { template: true },
    });

    // 画面描画
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-4">
            <h1 className="text-xl font-semibold">受験履歴</h1>

            <div className="space-y-3">
                {attempts.map((attempt) => {
                    // スコア
                    const scorePercentage =
                        attempt.score != null ? Math.round(attempt.score * 100) : null;

                    // 受験日時
                    const startedAtText = attempt.startedAt.toLocaleString();

                    // 所要時間（秒→分、端数切り上げ）
                    const durationMinutes = attempt.durationSec
                        ? Math.ceil(attempt.durationSec / 60)
                        : null;

                    return (
                        <div key={attempt.id} className="p-4 border rounded-md bg-white">
                            <div className="flex items-center justify-between">
                                {/* 試験名 */}
                                <div className="font-medium">{attempt.template.name}</div>

                                {/* スコアと合否 */}
                                <div
                                    className={`text-sm ${attempt.isPassed ? 'text-green-700' : 'text-red-700'
                                        }`}
                                >
                                    {scorePercentage != null ? `${scorePercentage}%` : '-'} /{' '}
                                    {attempt.isPassed ? '合格' : '不合格'}
                                </div>
                            </div>

                            {/* 受験日時と所要時間 */}
                            <div className="text-sm text-gray-600">
                                受験日時: {startedAtText} / 所要:{' '}
                                {durationMinutes != null ? durationMinutes : '-'}分
                            </div>

                            {/* 詳細ページへのリンク */}
                            <div className="mt-2">
                                <Link className="underline" href={`/exam/${attempt.id}/result`}>
                                    結果を見る
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}