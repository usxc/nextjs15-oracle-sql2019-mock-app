import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canUpdateNow } from '@/lib/exam-service';
import { NextResponse } from 'next/server';

/**
 * 受験中の設問に対する解答の保存/更新を行う PUT ハンドラー
 * - 前提: ログイン済みユーザー
 * - 入力: { attemptQuestionId: string, selectedChoiceIds: string[] }
 * - 出力: 正常: { ok: true }
 *         異常: 404 Not found / 409 Time over/finished / 500 Error
 */
export async function PUT(req: Request) {
    try {
        // ユーザー認証（未認証なら requireUser 内で例外が投げられる想定）
        const { userId } = await requireUser();

        // リクエストボディの取得
        const { attemptQuestionId, selectedChoiceIds } = await req.json();

        // 該当の設問（attemptQuestion）が現在のユーザーに紐づくか確認
        const attemptQuestion = await prisma.attemptQuestion.findFirst({
            where: { id: attemptQuestionId, attempt: { userId } },
            include: { attempt: true },
        });
        if (!attemptQuestion) {
            // ユーザーに紐づく設問が見つからない
            return NextResponse.json({ message: 'Not found' }, { status: 404 });
        }

        // 回答可能な時間内か（試験終了/時間切れでないか）をチェック
        const canUpdate = await canUpdateNow(attemptQuestion.attempt);
        if (!canUpdate) {
            return NextResponse.json({ message: 'Time over/finished' }, { status: 409 });
        }

        // 回答の保存（存在しなければ作成、あれば選択肢を更新）
        await prisma.attemptAnswer.upsert({
            where: { attemptQuestionId },
            create: { attemptQuestionId, selectedChoiceIds },
            update: { selectedChoiceIds },
        });

        // 設問に「回答済み時刻」を記録
        await prisma.attemptQuestion.update({
            where: { id: attemptQuestion.id },
            data: { answeredAt: new Date() },
        });

        // 正常終了
        return NextResponse.json({ ok: true });
    } catch {
        // 予期せぬエラー
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}