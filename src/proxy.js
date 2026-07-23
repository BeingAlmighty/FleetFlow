import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';
export async function proxy(request) {
  const { supabase, supabaseResponse } = createClient(request);
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  const url = request.nextUrl.clone();
  const path = url.pathname;
  let role = null;
  if (user?.app_metadata?.role) {
    role = user.app_metadata.role;
  }
  const adminRoutes = ['/dashboard', '/fleet', '/drivers', '/hubmanagers', '/payments'];
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route));
  if (isAdminRoute) {
    if (!user) {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    if (role && role !== 'ADMIN') {
      url.pathname = '/hubmanager/home';
      return NextResponse.redirect(url);
    }
  }
  if (path.startsWith('/hubmanager/home') || path.startsWith('/hubmanager/checkout')) {
    if (!user) {
      url.pathname = '/hubmanager/login';
      return NextResponse.redirect(url);
    }
    if (role && role !== 'hubmanager' && role !== 'GUARD') {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }
  if ((path === '/' || path === '/hubmanager/login') && user) {
    url.pathname = role === 'ADMIN' ? '/dashboard' : '/hubmanager/home';
    return NextResponse.redirect(url);
  }
  return supabaseResponse;
}
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
