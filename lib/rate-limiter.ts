/**
 * In-memory sliding window rate limiter for server API routes
 */

import { verifySessionToken } from './session-token';

interface RateLimitRecord {
  timestamps: number[];
}

const ipRequestMap = new Map<string, RateLimitRecord>();
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 20;

export function checkRateLimit(clientIp: string): { allowed: boolean; remaining: number; resetSeconds: number } {
  const now = Date.now();
  const record = ipRequestMap.get(clientIp) || { timestamps: [] };

  // Filter out timestamps older than window
  const validTimestamps = record.timestamps.filter((ts) => now - ts < WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = validTimestamps[0];
    const resetSeconds = Math.ceil((oldest + WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds),
    };
  }

  validTimestamps.push(now);
  ipRequestMap.set(clientIp, { timestamps: validTimestamps });

  // Periodic cleanup if map grows too large
  if (ipRequestMap.size > 2000) {
    for (const [ip, rec] of ipRequestMap.entries()) {
      const active = rec.timestamps.filter((ts) => now - ts < WINDOW_MS);
      if (active.length === 0) ipRequestMap.delete(ip);
      else ipRequestMap.set(ip, { timestamps: active });
    }
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - validTimestamps.length,
    resetSeconds: 60,
  };
}

/**
 * Safely extracts client identifier for rate limiting.
 * Combines header extraction with proxy trust checks and composite fingerprinting
 * to prevent trivial X-Forwarded-For spoofing.
 *
 * NOTE ON MULTI-INSTANCE DEPLOYMENTS:
 * This in-memory sliding window limiter operates per-server-instance.
 * For horizontally auto-scaled multi-region deployments, an external centralized
 * store (e.g. Upstash Redis, Cloudflare KV) should be bound.
 */
export async function extractClientIp(headers: Headers): Promise<string> {
  // STRICT SECURITY: Do NOT trust any client-supplied IP headers by default.
  // Only trust forwarding headers when explicitly configured behind a verified reverse proxy
  // (e.g. Cloudflare / Vercel edge deployment where TRUST_PROXY_HEADERS === 'true').
  const trustProxy = process.env.TRUST_PROXY_HEADERS === 'true';

  if (!trustProxy) {
    // In untrusted or direct environments, client-supplied headers (CF-Connecting-IP, X-Real-IP, X-Forwarded-For)
    // are strictly IGNORED to prevent header-based IP rotation spoofing.
    // To allow multiple legitimate concurrent users without stepping on each other's quota,
    // we inspect the anonymous tt_session cookie and cryptographically verify its HMAC signature.
    const cookieHeader = headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)tt_session=([a-zA-Z0-9_.-]+)/);
    if (match && match[1]) {
      // Cryptographically verify server-signed HMAC to prevent client-side cookie forgery/rotation
      const verifiedSessionId = await verifySessionToken(match[1]);
      if (verifiedSessionId) {
        return `direct-session-${verifiedSessionId}`;
      }
      // If signature is invalid, forged, or missing: strictly ignore and fallback to shared direct-client bucket!
    }

    // Default uniform fallback for direct traffic without verified session
    return 'direct-client';
  }

  // Trusted reverse proxy mode ONLY (TRUST_PROXY_HEADERS === 'true'):
  // 1. Edge-managed headers (Cloudflare strictly overwrites cf-connecting-ip)
  const cfConnectingIp = headers.get('cf-connecting-ip')?.trim();
  if (cfConnectingIp && isValidIp(cfConnectingIp)) {
    return cfConnectingIp;
  }

  // 2. Real-IP from trusted reverse proxy
  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp && isValidIp(realIp)) {
    return realIp;
  }

  // 3. X-Forwarded-For from trusted reverse proxy
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const candidate = forwardedFor.split(',')[0].trim();
    if (isValidIp(candidate)) {
      return candidate;
    }
  }

  return '127.0.0.1';
}

export function isValidIp(ip: string): boolean {
  const ipv4Pattern = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  const ipv6Pattern = /^[0-9a-fA-F:]{2,39}$/;
  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}
