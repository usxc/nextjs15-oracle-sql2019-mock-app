import { prisma } from './db';
import { ExamAttempt, QuestionType } from '@prisma/client';

function shuffle<T>(a: T[]) { const x=[...a]; for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];} return x; }

export async function createAttempt({
  userId,
  // 受け取るのは「ExamTemplate の id」なので、あえてエイリアスして分かりやすく
  templateId: examTemplateId,
}: { userId: string; templateId: string }) {
  // 試験テンプレートを取得（出題数・制限時間・合格基準の単一情報源）
  const template = await prisma.examTemplate.findUnique({ where: { id: examTemplateId } });
  if (!template) throw new Error('Template not found');

  // テンプレに紐づく問題＋選択肢を取得
  const questions = await prisma.question.findMany({
    where: { templateId: examTemplateId },
    include: { choices: true },
  });

  // 出題数を満たしているか確認し、ランダム抽選
  if (questions.length < template.questionCount) {
    throw new Error(`問題数不足 (${questions.length}/${template.questionCount})`);
  }
  const selectedQuestions = shuffle(questions).slice(0, template.questionCount);

  // 受験の開始・締切時刻を決定
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + template.durationSec * 1000);

  // 受験レコードを作成（子レコードに問題と「選択肢の表示順」を格納）
  return prisma.examAttempt.create({
        data: {
            // ExamAttempt を1件 INSERT
            userId, templateId: examTemplateId, startedAt, expiresAt, status: 'IN_PROGRESS',

            // その attempt にぶら下がる AttemptQuestion を複数 INSERT
            questions: {
            create: selectedQuestions.map((q, i) => ({
                questionId: q.id,       // 既存 Question を参照
                orderIndex: i + 1,      // 出題順
                shuffledChoiceIds: shuffle(q.choices.map(c => c.id)), // 選択肢の表示順
            })),
            },
        },
        include: { template: true },  // 返り値に ExamTemplate を“同梱して返すだけ”
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