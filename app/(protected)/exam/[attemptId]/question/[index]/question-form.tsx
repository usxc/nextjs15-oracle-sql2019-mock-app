'use client';
import type { Choice, QuestionType } from '@prisma/client';
import { useMemo } from 'react';

type QuestionFormProps = {
  /** 問題タイプ（単一選択 or 複数選択） */
  questionType: QuestionType;
  /** 表示順に並んだ選択肢ID */
  orderedChoiceIds: string[];
  /** 全選択肢のオブジェクト（id/textなど） */
  allChoices: Choice[];
  /** 現在選択されている選択肢ID */
  selectedChoiceIds: string[];
  /** 選択肢の変更ハンドラ */
  onChangeSelected: (ids: string[]) => void;
  /** ロック中（時間切れ等）かどうか */
  isLocked: boolean;
};

export default function QuestionForm({
  questionType,
  orderedChoiceIds,
  allChoices,
  selectedChoiceIds,
  onChangeSelected,
  isLocked,
}: QuestionFormProps) {
  // id→Choice の逆引き用に Map を作成
  const choiceMap = useMemo(() => new Map(allChoices.map((c) => [c.id, c])), [allChoices]);

  // 画面に表示する順番の Choice 配列（存在しないIDは安全のため除外）
  const orderedChoices: Choice[] = useMemo(
    () => orderedChoiceIds.map((id) => choiceMap.get(id)).filter((c): c is Choice => Boolean(c)),
    [orderedChoiceIds, choiceMap]
  );

  // 選択変更（単一選択なら置き換え、複数選択ならトグル）
  const handleToggleSelectChoice = (id: string) => {
    if (isLocked) return;
    if (questionType === 'SINGLE') {
      onChangeSelected([id]);
    } else {
      onChangeSelected(
        selectedChoiceIds.includes(id)
          ? selectedChoiceIds.filter((x) => x !== id)
          : [...selectedChoiceIds, id]
      );
    }
  };

  return (
    <div className="space-y-2">
      {orderedChoices.map((choice) => {
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
              name="choice"
              className="mt-1"
              checked={checked}
              onChange={() => handleToggleSelectChoice(choice.id)}
              disabled={isLocked}
            />
            <span className="whitespace-pre-wrap">{choice.text}</span>
          </label>
        );
      })}
    </div>
  );
}
