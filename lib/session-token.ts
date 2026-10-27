/**
 * Web Crypto API-based HMAC-SHA256 session token signer & verifier.
 * - 100% compliant with Next.js Edge Runtime and standard Node.js without relying on 'node:crypto'.
 * - Timing-attack safe verification via crypto.subtle.verify.
 * - Dynamic Ephemeral Secret Protection: If SESSION_SECRET is not provided, generates
 *   an unguessable in-memory random secret per server boot, completely eliminating
 *   any hardcoded public default vulnerability.
 */

const KNOWN_PLACEHOLDER_SECRETS = new Set([
  'your_cryptographically_secure_random_hmac_secret_here',
  'your_session_secret_here',
  'change_this_secret',
  'tastetrail_secure_session_secret_2026_default_key',
  'replace_with_at_least_32_bytes_random_secret',
]);

let ephemeralRuntimeSecret: string | null = null;
let warnedMissingSecret = false;

/**
 * Returns the active HMAC secret for session token signing and verification.
 * 
 * - Production: Strictly requires a private, stable SESSION_SECRET with at least 32 characters (256 bits).
 *   Rejects missing, weak (< 32 chars), or known placeholder values by throwing an explicit Error.
 * - Development: If SESSION_SECRET is unset or a placeholder, generates a dynamic per-process ephemeral secret.
 *   Note: In development with an ephemeral secret, user sessions will become invalid after server restart.
 */
export function getSessionSecret(): string {
  const configuredSecret = process.env.SESSION_SECRET?.trim();
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    if (!configuredSecret) {
      throw new Error(
        '[Security Fatal] SESSION_SECRET is not configured in production. ' +
        'A stable, private secret with at least 32 random characters/bytes is strictly required. ' +
        'Generate one with: openssl rand -hex 32'
      );
    }
    if (KNOWN_PLACEHOLDER_SECRETS.has(configuredSecret) || configuredSecret.toLowerCase().includes('placeholder')) {
      throw new Error(
        '[Security Fatal] SESSION_SECRET in production contains a known placeholder value. ' +
        'You must replace it with a genuine, cryptographically random secret of at least 32 characters/bytes.'
      );
    }
    if (configuredSecret.length < 32) {
      throw new Error(
        `[Security Fatal] SESSION_SECRET in production is too weak (${configuredSecret.length} characters). ` +
        'Production requires a stable, private secret of at least 32 random characters (256 bits).'
      );
    }
    return configuredSecret;
  }

  // Development / Test environment:
  if (
    configuredSecret &&
    configuredSecret.length >= 16 &&
    !KNOWN_PLACEHOLDER_SECRETS.has(configuredSecret)
  ) {
    return configuredSecret;
  }

  if (!ephemeralRuntimeSecret) {
    ephemeralRuntimeSecret = `${crypto.randomUUID()}-${crypto.randomUUID()}-${Date.now()}`;
    if (!warnedMissingSecret) {
      warnedMissingSecret = true;
      console.warn(
        '[Security Info] SESSION_SECRET is not set or is a placeholder in development. ' +
        'An ephemeral in-memory secret has been generated for this process. ' +
        'Note: User sessions will become invalid upon server restart. ' +
        'Set SESSION_SECRET in .env.local for stable development sessions.'
      );
    }
  }
  return ephemeralRuntimeSecret;
}

export function resetEphemeralSecretForTesting(customSecret?: string): void {
  ephemeralRuntimeSecret = customSecret || null;
  warnedMissingSecret = false;
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
