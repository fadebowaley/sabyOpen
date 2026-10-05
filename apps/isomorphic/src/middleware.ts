import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { rbacService } from '@/lib/services/rbac.service';
import { tokenService } from '@/lib/services/token.service';
import sessionConfig from '@/config/session.config.json';
import featuresConfig from '@/config/features.config.json';

const mapLegacyAuthPathToModalMode = (pathname: string) => {
  if (pathname.includes('/sign-up')) return 'signup';
  if (pathname.includes('/forgot-password')) return 'forgot';
  if (pathname.includes('/reset-password')) return 'reset';
  if (pathname.includes('/otp')) return 'otp';
  return 'login';
};

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const fullPath = `${pathname}${search || ''}`;

  console.log('🛡️ Middleware: Checking access for:', pathname);

  if (
    pathname === '/studio/onbarding' ||
    pathname.startsWith('/studio/onbarding/')
  ) {
    const normalizedUrl = request.nextUrl.clone();
    normalizedUrl.pathname = pathname.replace(
      '/studio/onbarding',
      '/studio/onboarding'
    );
    return NextResponse.redirect(normalizedUrl);
  }

  // Allow static assets (images, fonts, icons, etc.) - these should bypass all RBAC checks
  const staticAssetExtensions = [
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.webp',
    '.ico',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
    '.css',
    '.js',
    '.map',
    '.webmanifest',
  ];
  const isStaticAsset = staticAssetExtensions.some((ext) =>
    pathname.toLowerCase().endsWith(ext)
  );

  if (isStaticAsset) {
    console.log('✅ Middleware: Static asset, allowing access');
    return NextResponse.next();
  }

  // Allow public agenda, forms & smart short-link routes
  if (
    pathname.startsWith('/agenda/') ||
    pathname === '/agenda' ||
    pathname.startsWith('/a/') ||
    pathname === '/a' ||
    pathname.startsWith('/forms/') ||
    pathname === '/forms'
  ) {
    console.log('✅ Middleware: Public form/agenda route, allowing access');
    return NextResponse.next();
  }

  // Handle root path: keep chat landing public for both guests and authenticated users
  if (pathname === '/') {
    // Priority 1: Maintenance mode
    if (featuresConfig.features.maintenance.enabled) {
      console.log('🔀 Middleware: Redirecting to maintenance');
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }

    // Priority 2: Coming Soon
    if (featuresConfig.features.comingSoon.enabled) {
      console.log('🔀 Middleware: Redirecting to coming soon');
      return NextResponse.redirect(new URL('/coming-soon', request.url));
    }

    console.log('✅ Middleware: Public chat landing route, allowing access');
    return NextResponse.next();
  }

  if (pathname === '/welcome') {
    return NextResponse.redirect(new URL('/studio/onboarding', request.url));
  }

  // Decommission standalone auth pages; always use landing modal auth flow.
  if (pathname.startsWith('/auth/')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token && pathname.includes('/sign-in')) {
      const redirectUrl = rbacService.getLoginRedirectUrl(token.user);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    const landingUrl = new URL('/', request.url);
    landingUrl.searchParams.set('auth', mapLegacyAuthPathToModalMode(pathname));

    const cliCallback = request.nextUrl.searchParams.get('cli_callback');
    if (cliCallback) {
      landingUrl.searchParams.set('cli_callback', cliCallback);
    }

    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
    if (callbackUrl) {
      landingUrl.searchParams.set('callbackUrl', callbackUrl);
    }

    const sessionState = request.nextUrl.searchParams.get('session');
    if (sessionState) {
      landingUrl.searchParams.set('session', sessionState);
    }

    const authError = request.nextUrl.searchParams.get('error');
    if (authError) {
      landingUrl.searchParams.set('error', authError);
    }

    return NextResponse.redirect(landingUrl);
  }

  // Get token (if not already retrieved in root path check)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if route is public
  if (rbacService.isPublicRoute(pathname)) {
    console.log('✅ Middleware: Public route, allowing access');

    // Redirect to dashboard if already authenticated
    if (token && pathname.startsWith('/auth/sign-in')) {
      console.log(
        '🔍 Middleware: User logged in on sign-in page, getting redirect URL'
      );
      const redirectUrl = rbacService.getLoginRedirectUrl(token.user);
      console.log('🔍 Middleware: Redirecting to:', redirectUrl);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    return NextResponse.next();
  }

  // Check authentication
  if (!token) {
    console.log('❌ Middleware: No token found, redirecting to login');
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('auth', 'login');
    loginUrl.searchParams.set('callbackUrl', fullPath);
    const cliCallback = request.nextUrl.searchParams.get('cli_callback');
    if (cliCallback) {
      loginUrl.searchParams.set('cli_callback', cliCallback);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Check token expiry
  if (sessionConfig.security.enforceTokenExpiry) {
    const isExpired = tokenService.isTokenExpired(token.accessToken);

    if (isExpired) {
      console.log('❌ Middleware: Token expired, redirecting to login');
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('auth', 'login');
      loginUrl.searchParams.set('session', 'expired');
      loginUrl.searchParams.set('callbackUrl', fullPath);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Check route permissions
  const permissionCheck = rbacService.canAccessRoute(pathname, token.user);

  if (!permissionCheck.isAuthorized) {
    console.log('❌ Middleware: Access denied -', permissionCheck.reason);
    const deniedUrl = new URL('/access-denied', request.url);
    deniedUrl.searchParams.set(
      'reason',
      permissionCheck.reason || 'Access denied'
    );
    return NextResponse.redirect(deniedUrl);
  }

  console.log('✅ Middleware: Access granted');
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|site\\.webmanifest|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml|public).*)',
  ],
};

// export const config = {
//   // restricted routes
//   matcher: [
//     '/',
//     '/executive',
//     '/financial',
//     '/analytics',
//     '/users/list',
//     '/users/team',
//     '/users/roles',
//     '/users/permissions',
//     '/users/structure',
//     '/users/level',
//     '/users/onboarding',
//     '/logistics/:path*',
//     '/ecommerce/:path*',
//     '/support/:path*',
//     '/file/:path*',
//     '/file-manager',
//     '/invoice/:path*',
//     '/forms/profile-settings/:path*',
//     '/node/create',
//     'network/create',
//     '/studio/workspace/new',
//   ],
// };
