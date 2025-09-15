'use client';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import ExamTimer from '@/components/ExamTimer';
import QuestionForm from './question-form';
import type { Choice, QuestionType } from '@prisma/client';
import { saveAnswer, toggleMark } from '@/lib/client-actions';
import { ReactNode } from 'react';

type Props = {
  attemptId: string;
  attemptQuestionId: string;
  orderIndex: number;
  totalQuestions: number;
  expiresAt: string;
  templateName: string;
  questionText: string;
  questionType: QuestionType;
  orderedChoiceIds: string[];
  allChoices: Choice[];
  initialSelectedChoiceIds: string[];
  initialIsMarked: boolean;
  isLocked: boolean;
  finishButton: ReactNode;
};

export default function QuestionPageClient({
  attemptId,
  attemptQuestionId,
  orderIndex,
  totalQuestions,
  expiresAt,
  templateName,
  questionText,
  questionType,
  orderedChoiceIds,
  allChoices,
  initialSelectedChoiceIds,
  initialIsMarked,
  isLocked,
  finishButton,
}: Props) {
  const [selectedChoiceIds, setSelectedChoiceIds] = useState<string[]>(initialSelectedChoiceIds);
  const [isMarked, setIsMarked] = useState<boolean>(initialIsMarked);
  const [isPending, startTransition] = useTransition();

  const handleSaveAnswer = () =>
    startTransition(async () => {
      await saveAnswer({ attemptQuestionId, selectedChoiceIds });
    });

  const handleToggleReviewMark = () =>
    startTransition(async () => {
      const next = !isMarked;
      const ok = await toggleMark({ attemptQuestionId, next });
      if (ok) setIsMarked(next);
    });

  const handleReset = () => {
    if (isLocked || isPending) return;
    setSelectedChoiceIds([]);
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Top header */}
      <header className="flex items-center justify-between bg-blue-800 px-4 py-2 text-white">
        <div className="font-semibold">{templateName}</div>
        <Link href="#" className="underline text-sm">
          Instructions
        </Link>
      </header>

      {/* Sub header */}
      <div className="flex items-center justify-between bg-blue-100 px-4 py-2 text-sm">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={isMarked}
              onChange={handleToggleReviewMark}
              disabled={isLocked || isPending}
            />
            Mark
          </label>
          <span>
            Question {orderIndex} / {totalQuestions}
          </span>
        </div>
        <ExamTimer expiresAt={expiresAt} />
      </div>

      {/* Question body */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
        <div className="mx-auto max-w-4xl rounded-md border bg-white p-6">
          <div className="mb-4 whitespace-pre-wrap text-lg font-medium">{questionText}</div>
          <QuestionForm
            questionType={questionType}
            orderedChoiceIds={orderedChoiceIds}
            allChoices={allChoices}
            selectedChoiceIds={selectedChoiceIds}
            onChangeSelected={setSelectedChoiceIds}
            isLocked={isLocked}
          />
        </div>
      </main>

      {/* Bottom actions */}
      <footer className="flex flex-wrap items-center gap-2 border-t bg-gray-100 px-4 py-3">
        {orderIndex > 1 && (
          <Link
            className="rounded-md bg-gray-200 px-4 py-2"
            href={`/exam/${attemptId}/question/${orderIndex - 1}`}
          >
            前へ
          </Link>
        )}
        <button
          type="button"
          onClick={handleReset}
          disabled={isLocked || isPending}
          className="rounded-md bg-gray-200 px-4 py-2"
        >
          リセット
        </button>
        <button
          type="button"
          onClick={handleToggleReviewMark}
          disabled={isLocked || isPending}
          className={`rounded-md px-4 py-2 ${isMarked ? 'bg-yellow-400 text-white' : 'bg-yellow-200'}`}
        >
          {isMarked ? '見直し解除' : '見直し'}
        </button>
        <button
          type="button"
          onClick={handleSaveAnswer}
          disabled={isLocked || isPending}
          className="rounded-md border bg-white px-4 py-2"
        >
          回答を保存
        </button>
        {orderIndex < totalQuestions && (
          <Link
            className="rounded-md bg-blue-600 px-4 py-2 text-white"
            href={`/exam/${attemptId}/question/${orderIndex + 1}`}
          >
            次へ
          </Link>
        )}
        <Link
          className="ml-auto rounded-md px-4 py-2 border"
          href={`/exam/${attemptId}/summary`}
        >
          サマリー
        </Link>
        <Link
          className="rounded-md px-4 py-2 border"
          href={`/exam/${attemptId}/review`}
        >
          見直し一覧
        </Link>
        {finishButton}
      </footer>
      {isLocked && (
        <div className="border-t bg-amber-100 px-4 py-3 text-sm text-amber-800">
          時間切れです。回答や見直しはできません。「終了して採点」を押してください。
        </div>
      )}
    </div>
  );
}
