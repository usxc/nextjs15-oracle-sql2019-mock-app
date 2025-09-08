import { prisma } from './db';

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