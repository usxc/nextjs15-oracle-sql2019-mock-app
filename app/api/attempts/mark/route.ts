import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canUpdateNow } from '@/lib/exam-service';
import { NextResponse } from 'next/server';

/**
 * PUT: 受験中の設問に「見直しフラグ（isMarked）」を付与/解除する
 * 入力(JSON): { attemptQuestionId: string, next: any }
 *  - next が truthy -> isMarked=true、falsy -> isMarked=false
 * 成功: 200 { ok: true }
 * 失敗: 404 Not found / 409 Time over/finished / 500 Error
 */
export async function PUT(req: Request) {
    try {
        // 認証ユーザーの取得
        const { userId } = await requireUser();

        // リクエストボディの取得（外部仕様はそのまま: next を受け取る）
        const { attemptQuestionId, next: mark } = await req.json();

        // 該当の設問（attemptQuestion）が現在のユーザーに紐づくか確認
        const attemptQuestion = await prisma.attemptQuestion.findFirst({
            where: { id: attemptQuestionId, attempt: { userId } },
            include: { attempt: true },
        });
        if (!attemptQuestion) {
            return NextResponse.json({ message: 'Not found' }, { status: 404 });
        }

        // 回答可能な時間内か（試験終了/時間切れでないか）をチェック
        const canUpdate = await canUpdateNow(attemptQuestion.attempt);
        if (!canUpdate) {
            return NextResponse.json({ message: 'Time over/finished' }, { status: 409 });
        }

        // isMarked を更新
        const isMarked = Boolean(mark);
        await prisma.attemptQuestion.update({
            where: { id: attemptQuestion.id },
            data: { isMarked },
        });

        // 正常応答
        return NextResponse.json({ ok: true });
    } catch {
        // 予期せぬエラー
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}