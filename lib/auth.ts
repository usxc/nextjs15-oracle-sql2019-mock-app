import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export async function requireUser() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in?redirect_url=/');
  const user = await currentUser();
  return { userId, user };
}
