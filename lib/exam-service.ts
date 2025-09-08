import { prisma } from './db';
import { ExamAttempt, QuestionType } from '@prisma/client';

function shuffle<T>(a: T[]) { const x=[...a]; for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];} return x; }

export async function createAttempt({ userId, templateId }:{userId:string; templateId:string;}) {
  const t = await prisma.examTemplate.findUnique({ where: { id: templateId } });
  if (!t) throw new Error('Template not found');

  const qs = await prisma.question.findMany({ where: { templateId }, include: { choices: true } });
  if (qs.length < t.questionCount) throw new Error(`問題数不足 (${qs.length}/${t.questionCount})`);
  const picked = shuffle(qs).slice(0, t.questionCount);

  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + t.durationSec * 1000);

  return prisma.examAttempt.create({
    data: {
      userId, templateId, startedAt, expiresAt, status: 'IN_PROGRESS',
      questions: { create: picked.map((q,i)=>({questionId:q.id,orderIndex:i+1,shuffledChoiceIds:shuffle(q.choices.map(c=>c.id))})) },
    },
    include: { template: true }
  });
}

export async function canUpdateNow(attempt: ExamAttempt | string) {
  const a = typeof attempt==='string' ? await prisma.examAttempt.findUnique({ where: { id: attempt } }) : attempt;
  if (!a) return false;
  if (a.status!=='IN_PROGRESS') return false;
  return new Date() <= a.expiresAt;
}

function isCorrect(type: QuestionType, selected: string[], correct: string[]) {
  if (type==='SINGLE') return selected.length===1 && correct.length===1 && selected[0]===correct[0];
  if (selected.length!==correct.length) return false;
  const s = new Set(selected);
  return correct.every(id=>s.has(id));
}