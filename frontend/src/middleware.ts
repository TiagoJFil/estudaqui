import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Allow all /api/auth/* requests without auth
const authBypassPrefixes = ['/api/auth/', "/api/v1/payment/stripe/webhook"];
const protectedApiPrefixes = ['/api/'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Allow all /api/auth/* requests without auth
  const isAuthBypass = authBypassPrefixes.some(prefix => pathname.startsWith(prefix));
  if (isAuthBypass) {
    return NextResponse.next();
  }
  // Only check for API routes
  const isApiRoute = protectedApiPrefixes.some(prefix => pathname.startsWith(prefix));
  if (!isApiRoute) {
    return NextResponse.next();
  }
  // Get the user session token (JWT)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  // User is authenticated
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
