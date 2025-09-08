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

export async function scoreAttempt(attemptId: string) {
  const a = await prisma.examAttempt.findUnique({
    where:{ id: attemptId },
    include:{ template:true, questions:{ include:{ question:{ include:{ choices:true } }, answer:true } } }
  });
  if(!a) throw new Error('Attempt not found');

  let correctCount=0;
  for(const q of a.questions){
    const correctIds = q.question.choices.filter(c=>c.isCorrect).map(c=>c.id);
    const selected = q.answer?.selectedChoiceIds ?? [];
    const ok = isCorrect(q.question.type, selected, correctIds);
    if(ok) correctCount++;
    await prisma.attemptQuestion.update({ where:{ id:q.id }, data:{ isCorrect: ok, answeredAt: q.answer ? q.answer.updatedAt : q.answeredAt }});
  }

  const score = correctCount / a.template.questionCount;
  const isPassed = score >= a.template.passThreshold;
  const finishedAt = new Date();
  const durationSec = Math.max(1, Math.round((finishedAt.getTime()-a.startedAt.getTime())/1000));

  return prisma.examAttempt.update({
    where:{ id: attemptId },
    data:{ score, isPassed, finishedAt, durationSec, status: new Date()>a.expiresAt ? 'EXPIRED':'FINISHED' }
  });
}

export async function finishAttempt({ attemptId, end }:{attemptId:string; end:'USER_FINISH'|'TIMEOUT'}) {
  await prisma.examAttempt.update({ where:{ id: attemptId }, data:{ endReason: end } });
  return scoreAttempt(attemptId);
}