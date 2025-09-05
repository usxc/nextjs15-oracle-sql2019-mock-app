import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// 公開してよいURL（ログイン不要）
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk',
  '/api/health',
]);

export default clerkMiddleware(async (auth, req) => {
  // 公開ルートは保護しない
  if (isPublicRoute(req)) return;

  // 保護が必要なURLのみ Clerk で保護
  await auth.protect();
});

export const config = {
  // middleware をどのURLに適用するか
  matcher: [
    '/((?!.*\\..*|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
