import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { isMaintenanceMode, getAllowedPaths } from '@/utils/maintenance';

export function middleware(request: NextRequest) {
  // メンテナンスモードでない場合は通常処理
  if (!isMaintenanceMode()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const allowedPaths = getAllowedPaths();

  // allowedPaths（maintenance.jsonで管理）とメンテナンスページは表示を許可
  if (allowedPaths.includes(pathname) || pathname.startsWith('/maintenance')) {
    return NextResponse.next();
  }

  // 静的ファイル（画像、CSS、JSなど）は通す（メンテナンスページ表示に必要）
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    /\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // その他のページはメンテナンスページにリダイレクト（元のパスをクエリパラメータreturnToに保存）
  const maintenanceUrl = new URL('/maintenance', request.url);
  maintenanceUrl.searchParams.set('returnTo', pathname);
  return NextResponse.redirect(maintenanceUrl);
}

export const config = {
  matcher: [
    /*
     * 以下で始まるパス以外のすべてのリクエストパスにマッチ:
     * - api (APIルート)
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico (ファビコンファイル)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
