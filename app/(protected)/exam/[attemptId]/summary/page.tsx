import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { canUpdateNow, finishAttempt } from '@/lib/exam-service';

// サマリーページ（サーバーコンポーネント）
// 受験（attempt）の設問一覧を表示し、回答済み/フラグ有りを見た目で区別。
// 「終了して採点」ボタンで受験を締めて結果ページへ遷移します。
export default async function SummaryPage(
    { params: { attemptId } }: { params: { attemptId: string } }
) {
    // ログインユーザーを取得（未ログインなら内部でエラー/リダイレクトの想定）
    const { userId } = await requireUser();

    // ログインユーザー自身の受験データを取得
    //   - 他人の attempt を読めないよう where で userId を絞る
    //   - 設問は orderIndex 昇順で並べる
    //   - answer を含めて取得（回答済みかの判定に使う）
    //   - template も取得（この画面では未使用だが付随情報として）
    const attempt = await prisma.examAttempt.findFirst({
        where: { id: attemptId, userId },
        include: {
            questions: {
                orderBy: { orderIndex: 'asc' },
                include: { answer: true }
            },
            template: true
        },
    });

    // 受験が見つからなければトップへリダイレクト
    if (!attempt) return redirect('/');

    // いま編集できる状態か（時間内か等）を判定
    const can = await canUpdateNow(attempt);

    // 画面をレンダリング
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* ヘッダー行：タイトル + 「終了して採点」ボタン */}
            <div className="flex justify-between items-center">
                <div className="font-semibold">サマリー</div>

                {/* フォーム送信時にサーバーアクションを実行
                    - 'use server' を関数内に置くことでサーバー側で実行される
                    - finishAttempt で受験を終了し、結果画面にリダイレクト */}
                <form action={async () => {
                    'use server';
                    await finishAttempt({ attemptId, end: 'USER_FINISH' });
                    redirect(`/exam/${attemptId}/result`);
                }}>
                    <button className="px-3 py-2 bg-red-600 text-white rounded-md">
                        終了して採点
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-12 gap-2">
                {attempt.questions.map(q => {
                    const answered = !!q.answer;   // 回答があれば true（回答済み）
                    const marked = q.isMarked;     // 見直し用フラグ

                    return (
                        <Link
                            key={q.id}
                            href={`/exam/${attemptId}/question/${q.orderIndex}`}
                            className={`text-center p-2 rounded-md border
                            ${answered ? 'bg-green-50 border-green-300' : 'bg-gray-50'}
                            ${marked ? 'ring-2 ring-yellow-400' : ''}
                            ${!can ? 'pointer-events-none opacity-60' : ''}`
                            }
                        >
                            {/* タイルの表示文字：設問の並び順番号 */}
                            {q.orderIndex}
                        </Link>
                    );
                })}
            </div>

            {/* 編集不可（時間切れ等）のときに注意文を表示 */}
            {!can && (
                <p className="text-sm text-amber-700">
                    時間切れのため、閲覧のみ可能です。
                </p>
            )}
        </div>
    );
}