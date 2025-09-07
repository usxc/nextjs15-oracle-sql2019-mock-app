import { NextResponse } from 'next/server';
import { Webhook, type WebhookRequiredHeaders } from 'svix';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ message: 'Missing CLERK_WEBHOOK_SECRET' }, { status: 500 });
  }
  const payload = await req.text(); // 生ボディを取得

  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ message: 'Missing svix headers' }, { status: 400 });
  }

  let evt: WebhookEvent;
  try {
    const wh = new Webhook(secret);
    const headers: WebhookRequiredHeaders = {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    };
    // 署名検証 + パース
    evt = wh.verify(payload, headers) as WebhookEvent;
  } catch {
    return NextResponse.json({ message: 'Invalid signature' }, { status: 400 });
  }

  // user.created / user.updated
  if (evt.type === 'user.created' || evt.type === 'user.updated') {
    const { data } = evt as Extract<WebhookEvent, { type: 'user.created' | 'user.updated' }>;
    const display =
      data.first_name && data.last_name
        ? `${data.first_name} ${data.last_name}`
        : data.username ?? data.email_addresses[0]?.email_address ?? 'User';

    await prisma.userProfile.upsert({
      where: { userId: data.id },
      update: { displayName: display, imageUrl: data.image_url ?? '' },
      create: { userId: data.id, displayName: display, imageUrl: data.image_url ?? '' },
    });
  }

  // user.deleted
  if (evt.type === 'user.deleted') {
    const { data } = evt as Extract<WebhookEvent, { type: 'user.deleted' }>;
    const userId = data.id;
    if (!userId) {
      return NextResponse.json({ message: 'Missing user id' }, { status: 400 });
    }
    await prisma.userProfile.deleteMany({ where: { userId } });
  }

  return NextResponse.json({ ok: true });
}
