import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for the admin_token cookie
  const token = request.cookies.get('admin_token')?.value;

  // If the user is trying to access the enterprise dashboard without a token
  if (!token && request.nextUrl.pathname.startsWith('/enterprise')) {
    // Redirect to a mock login page
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Otherwise, let them proceed
  return NextResponse.next();
}

// Ensure middleware only runs on specific paths
export const config = {
  matcher: ['/enterprise/:path*'],
};
