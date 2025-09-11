'use client';
import type { Choice, QuestionType } from '@prisma/client';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { saveAnswer, toggleMark } from '@/lib/client-actions';

type QuestionFormProps = {
  /** この試行中の特定の1問を識別するID */
  attemptQuestionId: string;
  /** 問題タイプ（単一選択 or 複数選択） */
  questionType: QuestionType;
  /** 表示順に並んだ選択肢ID */
  orderedChoiceIds: string[];
  /** 全選択肢のオブジェクト（id/textなど） */
  allChoices: Choice[];
  /** 初期の選択済み選択肢ID */
  initialSelectedChoiceIds: string[];
  /** 初期状態で見直しフラグが立っているか */
  initialIsMarked: boolean;
  /** ロック中（時間切れ等）かどうか */
  isLocked: boolean;
};

export default function QuestionForm(props: QuestionFormProps) {
  const {
    attemptQuestionId,
    questionType,
    orderedChoiceIds,
    allChoices,
    initialSelectedChoiceIds,
    initialIsMarked,
    isLocked,
  } = props;

  // UI 状態（選択、見直し、送信中）
  const [selectedChoiceIds, setSelectedChoiceIds] = useState<string[]>(initialSelectedChoiceIds);
  const [isMarked, setIsMarked] = useState<boolean>(initialIsMarked);
  const [isPending, startTransition] = useTransition();

  // 親（サーバー再描画など）から初期値が変わった場合に同期
  useEffect(() => setSelectedChoiceIds(initialSelectedChoiceIds), [initialSelectedChoiceIds]);
  useEffect(() => setIsMarked(initialIsMarked), [initialIsMarked]);

  // id→Choice の逆引き用に Map を作成
  const choiceMap = useMemo(() => new Map(allChoices.map(c => [c.id, c])), [allChoices]);

  // 画面に表示する順番の Choice 配列（存在しないIDは安全のため除外）
  const orderedChoices: Choice[] = useMemo(
    () => orderedChoiceIds.map(id => choiceMap.get(id)).filter((c): c is Choice => Boolean(c)),
    [orderedChoiceIds, choiceMap]
  );

  // 選択変更（単一選択なら置き換え、複数選択ならトグル）
  const handleToggleSelectChoice = (id: string) => {
    if (isLocked || isPending) return;
    if (questionType === 'SINGLE') {
      setSelectedChoiceIds([id]);
    } else {
      setSelectedChoiceIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    }
  };

  // 回答を保存（API 経由）
  const handleSaveAnswer = () =>
    startTransition(async () => {
      // 既存の API はレスポンスを返さず内部で warn を出す仕様
      await saveAnswer({ attemptQuestionId, selectedChoiceIds });
    });

  // 見直しフラグのトグル（API 成功時のみローカル状態反映）
  const handleToggleReviewMark = () =>
    startTransition(async () => {
      const next = !isMarked;
      const ok = await toggleMark({ attemptQuestionId, next });
      if (ok) setIsMarked(next);
      else console.warn('Failed to toggle mark');
    });

  const inputName = `choice-${attemptQuestionId}`; // ラジオのグルーピング名（他フォームと衝突しないように）

  return (
    <div className="space-y-4" aria-busy={isPending} aria-live="polite">
      <div className="space-y-2">
        {orderedChoices.map(choice => {
          const checked = selectedChoiceIds.includes(choice.id);
          const isSingle = questionType === 'SINGLE';
          return (
            <label
              key={choice.id}
              className={`flex items-start gap-3 p-3 border rounded-md bg-white ${
                isLocked ? 'opacity-60' : ''
              }`}
            >
              <input
                type={isSingle ? 'radio' : 'checkbox'}
                name={inputName}
                className="mt-1"
                checked={checked}
                onChange={() => handleToggleSelectChoice(choice.id)}
                disabled={isLocked || isPending}
              />
              <span className="whitespace-pre-wrap">{choice.text}</span>
            </label>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSaveAnswer}
          disabled={isLocked || isPending}
          className="px-3 py-2 bg-blue-600 text-white rounded-md"
        >
          回答を保存
        </button>

        <button
          type="button"
          onClick={handleToggleReviewMark}
          disabled={isLocked || isPending}
          className={`px-3 py-2 rounded-md border ${
            isMarked ? 'bg-yellow-100 border-yellow-300' : ''
          }`}
          aria-pressed={isMarked}
        >
          {isMarked ? '見直しから外す' : '見直しに追加'}
        </button>
      </div>
    </div>
  );
}
