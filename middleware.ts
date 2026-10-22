import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { signSessionId, verifySessionToken } from '@/lib/session-token';

/**
 * TasteTrail Edge Middleware
 * 1. Automatically provisions an anonymous, HTTP-only, HMAC-signed session cookie (`tt_session`)
 *    for every browser visitor if missing or tampered.
 * 2. Allows individual legitimate client rate-limit isolation in untrusted proxy mode
 *    while cryptographically preventing forged cookie rotation attacks.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const existingCookie = request.cookies.get('tt_session')?.value;
  const verifiedId = existingCookie ? await verifySessionToken(existingCookie) : null;

  // If tt_session cookie is missing or has an invalid/tampered HMAC signature,
  // generate a fresh UUID and sign it with the server's private secret.
  if (!verifiedId) {
    const rawUuid = crypto.randomUUID();
    const signedToken = await signSessionId(rawUuid);

    // Set secure, HTTP-only signed session cookie on the outgoing response
    response.cookies.set({
      name: 'tt_session',
      value: signedToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Match all request paths except static files, images, and favicon
    '/((?!_next/static|_next/image|icon.svg|favicon.ico).*)',
  ],
};
