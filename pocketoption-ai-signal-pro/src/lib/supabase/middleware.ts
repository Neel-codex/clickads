import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/offline',
  '/terms',
  '/privacy',
  '/support',
];

const ADMIN_PREFIX = '/admin';

/** Refresh the Supabase session and enforce route protection. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic =
    PUBLIC_PATHS.includes(path) ||
    path.startsWith('/_next') ||
    path.startsWith('/api/public') ||
    path.startsWith('/icons') ||
    path === '/manifest.webmanifest' ||
    path === '/sw.js';

  // Unauthenticated users hitting a private route -> login.
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  // Admin area requires an admin/super_admin role.
  if (user && path.startsWith(ADMIN_PREFIX)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      const url = request.nextUrl.clone();
      url.pathname = '/app';
      return NextResponse.redirect(url);
    }
  }

  // Signed-in users shouldn't see auth screens.
  if (user && ['/login', '/register'].includes(path)) {
    const url = request.nextUrl.clone();
    url.pathname = '/app';
    return NextResponse.redirect(url);
  }

  return response;
}
