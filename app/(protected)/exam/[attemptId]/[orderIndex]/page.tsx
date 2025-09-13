import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// 復習 詳細ページ（サーバーコンポーネント）
// - URL から attemptId（受験ID）と orderIndex（問題番号）を受け取り
// - ログインユーザー本人の回答データを DB から取得
// - 正解選択肢／ユーザーが選んだ選択肢を可視化して表示します

type ReviewDetailProps = {
  params: { attemptId: string; orderIndex: string };
};

export default async function ReviewDetail({ params }: ReviewDetailProps) {
  const { attemptId, orderIndex } = params;

  // 認証: ログイン中ユーザーの ID を取得
  //   未ログイン時は requireUser() 側で処理される想定
  const { userId } = await requireUser();

  // URL の問題番号を数値に変換
  const questionIndex = Number(orderIndex);

  // DB から対象の「受験×問題」の1件を取得（本人の受験に限定）
  //   - question と choices（選択肢）、answer（ユーザーの回答）を同時に読み込み
  const attemptQuestion = await prisma.attemptQuestion.findFirst({
    where: { attemptId, orderIndex: questionIndex, attempt: { userId } },
    include: {
      question: { include: { choices: true } },
      answer: true,
    },
  });

  // データが無い場合は404
  if (!attemptQuestion) return notFound();

  // 表示用の派生値を準備
  // 正解の選択肢ID一覧
  const correctChoiceIds = attemptQuestion.question.choices
    .filter((choice) => choice.isCorrect)
    .map((choice) => choice.id);

  // ユーザーが選んだ選択肢ID（無回答なら空配列）
  const selectedChoiceIds = attemptQuestion.answer?.selectedChoiceIds ?? [];

  // 画面描画
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* 見出し＆結果画面への戻りリンク */}
      <div className="flex justify-between">
        <h1 className="text-xl font-semibold">復習：問題 {questionIndex}</h1>
        <Link className="underline" href={`/exam/${attemptId}/result`}>
          結果へ戻る
        </Link>
      </div>

      <div className="space-y-4">
        {/* 問題文 */}
        <div className="text-lg font-medium whitespace-pre-wrap">
          {attemptQuestion.question.text}
        </div>

        {/* 選択肢一覧（正解/選択のラベル付き） */}
        <ul className="space-y-2">
          {attemptQuestion.question.choices.map((choice) => {
            const isCorrectChoice = correctChoiceIds.includes(choice.id);
            const isSelectedByUser = selectedChoiceIds.includes(choice.id);

            return (
              <li
                key={choice.id}
                className={`p-3 rounded-md border bg-white ${
                  isCorrectChoice ? 'border-green-300' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* 正解ラベル or 通常選択肢ラベル */}
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs rounded ${
                      isCorrectChoice ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                    }`}
                  >
                    {isCorrectChoice ? '正解' : '選択肢'}
                  </span>

                  {/* ユーザーが選んだかどうかの表示 */}
                  {isSelectedByUser && (
                    <span className="text-xs text-blue-700">（あなたの選択）</span>
                  )}
                </div>

                {/* 選択肢の本文 */}
                <div className="mt-1 whitespace-pre-wrap">{choice.text}</div>
              </li>
            );
          })}
        </ul>

        {/* 解説 */}
        <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200">
          <div className="font-semibold">解説</div>
          <div className="mt-1 whitespace-pre-wrap">
            {attemptQuestion.question.explanation}
          </div>
        </div>
      </div>
    </div>
  );
}