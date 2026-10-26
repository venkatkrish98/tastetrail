/**
 * Web Crypto API-based HMAC-SHA256 session token signer & verifier.
 * - 100% compliant with Next.js Edge Runtime and standard Node.js without relying on 'node:crypto'.
 * - Timing-attack safe verification via crypto.subtle.verify.
 * - Dynamic Ephemeral Secret Protection: If SESSION_SECRET is not provided, generates
 *   an unguessable in-memory random secret per server boot, completely eliminating
 *   any hardcoded public default vulnerability.
 */

let ephemeralRuntimeSecret: string | null = null;
let warnedMissingSecret = false;

export function getSessionSecret(): string {
  const configuredSecret = process.env.SESSION_SECRET?.trim();
  if (configuredSecret && configuredSecret.length >= 16) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV === 'production' && !configuredSecret && !warnedMissingSecret) {
    warnedMissingSecret = true;
    console.warn(
      '[Security Warning] SESSION_SECRET is not configured in production environment. ' +
      'Using dynamic per-process ephemeral secret. ' +
      'Please set a permanent SESSION_SECRET (32+ chars) in your production environment variables.'
    );
  }

  if (!ephemeralRuntimeSecret) {
    ephemeralRuntimeSecret = `${crypto.randomUUID()}-${crypto.randomUUID()}-${Date.now()}`;
  }
  return ephemeralRuntimeSecret;
}

export function resetEphemeralSecretForTesting(customSecret?: string): void {
  ephemeralRuntimeSecret = customSecret || null;
}

const encoder = new TextEncoder();

async function getHmacKey(): Promise<CryptoKey> {
  const secret = getSessionSecret();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function hexToArrayBuffer(hex: string): ArrayBuffer | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) return null;
  const buffer = new ArrayBuffer(hex.length / 2);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return buffer;
}

/**
 * Signs a session UUID with an HMAC-SHA256 signature using standard Web Crypto.
 * Format: `${sessionId}.${signature}`
 */
export async function signSessionId(sessionId: string): Promise<string> {
  const key = await getHmacKey();
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(sessionId)
  );
  return `${sessionId}.${bufferToHex(signatureBuffer)}`;
}

/**
 * Validates a signed session token.
 * Uses crypto.subtle.verify for constant-time comparison to prevent timing attacks.
 * Returns the verified sessionId if genuine, or null if tampered/forged.
 */
export async function verifySessionToken(token: string): Promise<string | null> {
  if (!token || typeof token !== 'string') return null;

  const dotIdx = token.indexOf('.');
  if (dotIdx === -1) return null;

  const sessionId = token.slice(0, dotIdx);
  const providedHmacHex = token.slice(dotIdx + 1);

  if (!sessionId || !providedHmacHex) return null;

  // Strict UUID format verification (must be valid v4 UUID string)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) return null;

  const providedBuffer = hexToArrayBuffer(providedHmacHex);
  if (!providedBuffer) return null;

  try {
    const key = await getHmacKey();
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      providedBuffer,
      encoder.encode(sessionId)
    );
    return isValid ? sessionId : null;
  } catch {
    return null;
  }
}
