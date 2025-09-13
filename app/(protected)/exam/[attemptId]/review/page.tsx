import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import Link from 'next/link';

export default async function ReviewList({ params:{ attemptId } }:{ params:{ attemptId:string } }) {
  const { userId } = await requireUser();
  const items = await prisma.attemptQuestion.findMany({
    where:{ attempt:{ id:attemptId, userId }, isMarked:true },
    select:{ id:true, orderIndex:true }, orderBy:{ orderIndex:'asc' },
  });

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">見直し一覧</h1>
      {items.length===0 ? <p>見直しフラグの付いた問題はありません。</p> : (
        <ul className="space-y-2">
          {items.map(i=>(
            <li key={i.id}><Link className="underline" href={`/exam/${attemptId}/question/${i.orderIndex}`}>問題 {i.orderIndex} へ移動</Link></li>
          ))}
        </ul>
      )}
    </div>
  );
}