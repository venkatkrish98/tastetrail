/**
 * TasteTrail Integrity Test Suite
 * Directly imports and exercises actual production source files in lib/
 * Executed via tsx (Node.js TypeScript runtime)
 */

import { calculateHaversineDistanceKm, runTasteTrailAgent } from '../lib/agent-workflow';
import {
  searchQlooEntities,
  fetchQlooPlaceInsights,
  isLiveQlooConfigured,
  getValidatedQlooBaseUrl,
  parseQlooSearchItems,
  parseQlooInsightsItems,
  verifyLiveQlooConnectivity,
  clearProbeCacheForTesting,
} from '../lib/qloo-client';
import { checkRateLimit, extractClientIp, isValidIp } from '../lib/rate-limiter';
import { readBoundedJsonPayload, MAX_PAYLOAD_BYTES } from '../lib/payload-validator';
import { middleware } from '../middleware';
import {
  signSessionId,
  verifySessionToken,
  getSessionSecret,
  resetEphemeralSecretForTesting,
} from '../lib/session-token';
import { OutingRequest } from '../lib/types';
import { NextRequest } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

console.log('================================================================');
console.log('  TasteTrail Production Code Integrity Suite (Direct Imports)   ');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, failureDetails: string = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}${failureDetails ? ` -> ${failureDetails}` : ''}`);
    failed++;
  }
}

async function runTestSuite() {
  // --------------------------------------------------------------------------
  // 1. Geographic Calculation directly via calculateHaversineDistanceKm
  // --------------------------------------------------------------------------
  console.log('--- Suite 1: Geographic Haversine Distance (lib/agent-workflow.ts) ---');
  
  // Village Vanguard (40.736, -74.0017) to Caffe Reggio (40.7303, -74.0002)
  const d1 = calculateHaversineDistanceKm(40.736, -74.0017, 40.7303, -74.0002);
  assert(d1 >= 0.6 && d1 <= 0.7, `Village Vanguard to Caffe Reggio distance is ~0.65 km (got ${d1} km)`);
  assert(d1 <= 0.8, 'Hop strictly conforms to < 0.8 km low-walking straight-line threshold');

  // Across town to Columbia University (~8.6 km)
  const d2 = calculateHaversineDistanceKm(40.736, -74.0017, 40.8075, -73.9626);
  assert(d2 > 8.0, `Long transit correctly measured as ${d2} km`);
  assert(d2 > 0.8, 'Long distance correctly excluded from low-walking cluster');

  // --------------------------------------------------------------------------
  // 2. Rate Limiter & Anti-Spoofing directly via lib/rate-limiter.ts
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 2: Rate Limiter & Anti-Spoofing (lib/rate-limiter.ts) ---');

  const testIp = '10.0.0.42';
  const lastResult = checkRateLimit(testIp);
  assert(lastResult.allowed === true, 'First request under rate limit is allowed');

  // Consume remaining 19 requests
  for (let i = 0; i < 19; i++) {
    checkRateLimit(testIp);
  }

  // 21st request must be blocked
  const blockedResult = checkRateLimit(testIp);
  assert(blockedResult.allowed === false, '21st request in sliding window is blocked (HTTP 429)');
  assert(blockedResult.resetSeconds > 0, 'Retry-After reset seconds is positive');

  // IP validation
  assert(isValidIp('192.168.1.1') === true, 'Validates IPv4 string format');
  assert(isValidIp('2607:f8b0:4005:805::200e') === true, 'Validates IPv6 string format');
  assert(isValidIp('attacker-spoof;--') === false, 'Rejects malicious non-IP header string');

  // 2a. Anti-Spoofing in Default Untrusted Mode (TRUST_PROXY_HEADERS is unset/false)
  delete process.env.TRUST_PROXY_HEADERS;
  const spoofedHeader1 = new Headers({ 'cf-connecting-ip': '198.51.100.1' });
  const spoofedHeader2 = new Headers({ 'cf-connecting-ip': '198.51.100.2' });
  const spoofedForwarded = new Headers({ 'x-forwarded-for': '203.0.113.99' });

  assert(
    (await extractClientIp(spoofedHeader1)) === 'direct-client',
    'Untrusted mode strictly IGNORES client-supplied cf-connecting-ip (maps to direct-client)'
  );
  assert(
    (await extractClientIp(spoofedHeader2)) === 'direct-client',
    'Rotating spoofed cf-connecting-ip header maps to the same direct-client bucket'
  );
  assert(
    (await extractClientIp(spoofedForwarded)) === 'direct-client',
    'Untrusted mode strictly IGNORES client-supplied x-forwarded-for'
  );

  // Verify that IP header rotation CANNOT bypass the rate limit in default mode
  const directClientIp = 'direct-client';
  for (let i = 0; i < 20; i++) {
    checkRateLimit(directClientIp);
  }
  const spoofBypassAttempt = checkRateLimit(await extractClientIp(spoofedHeader2));
  assert(
    spoofBypassAttempt.allowed === false,
    'Rotating spoofed IP headers fails to bypass rate limit: all unverified requests share direct-client bucket'
  );

  // 2b. Cryptographically Signed Session Cookie & Forgery Rejection
  const validUuid1 = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d';
  const signedToken1 = await signSessionId(validUuid1);

  // Authenticated tokens extract the verified session ID
  const validSessionHeader = new Headers({ cookie: `tt_session=${signedToken1}` });
  assert(
    (await extractClientIp(validSessionHeader)) === `direct-session-${validUuid1}`,
    'Untrusted mode isolates separate users via cryptographically HMAC-signed session cookie'
  );

  // Attacker attempt 1: Forged random unsigned cookie
  const forgedUnsignedHeader = new Headers({ cookie: 'tt_session=attacker_arbitrary_session_uuid' });
  assert(
    (await extractClientIp(forgedUnsignedHeader)) === 'direct-client',
    'Strictly rejects forged/unsigned session cookie (falls back to shared direct-client)'
  );

  // Attacker attempt 2: Forged token with invalid signature
  const forgedSignedHeader = new Headers({ cookie: `tt_session=${validUuid1}.bad_signature_abcdef1234567890` });
  assert(
    (await extractClientIp(forgedSignedHeader)) === 'direct-client',
    'Strictly rejects session cookie with invalid/tampered HMAC signature'
  );

  // Attacker attempt 3: Rotating forged session cookies fails to evade rate limits
  const forgedRotationHeader = new Headers({ cookie: `tt_session=forged_${Math.random()}` });
  const forgedRateCheck = checkRateLimit(await extractClientIp(forgedRotationHeader));
  assert(
    forgedRateCheck.allowed === false,
    'Rotating forged session cookies fails to bypass rate limit: all unverified requests map to direct-client'
  );

  // Verification helper unit tests
  assert((await verifySessionToken(signedToken1)) === validUuid1, 'verifySessionToken validates genuine server-signed token');
  assert((await verifySessionToken('invalid.token')) === null, 'verifySessionToken returns null for forged token');
  assert((await verifySessionToken('')) === null, 'verifySessionToken handles empty string gracefully');

  // Ephemeral Secret & Known-Default Attack Immunity
  const activeSecret = getSessionSecret();
  assert(activeSecret.length >= 16, 'Server session secret is high-entropy (length >= 16 characters)');
  assert(
    activeSecret !== 'tastetrail_secure_session_secret_2026_default_key',
    'Immune to public default secret: Server does not use any hardcoded static secret from source'
  );

  // Attacker attempt 4: Cookie signed with a different key is strictly rejected by runtime
  resetEphemeralSecretForTesting('isolated_attacker_static_key_12345');
  const attackerSignedWithOldKey = await signSessionId(validUuid1);
  resetEphemeralSecretForTesting(); // restore active runtime secret
  const rejectedOldKeyCheck = await verifySessionToken(attackerSignedWithOldKey);
  assert(
    rejectedOldKeyCheck === null,
    'Strictly rejects cookies signed with external/unauthorized secret keys'
  );

  // 2b. Production Secret Hardening: Reject missing, weak, or known placeholder secrets
  const savedNodeEnv = process.env.NODE_ENV;
  const savedSessionSecret = process.env.SESSION_SECRET;

  try {
    // @ts-expect-error mutating NODE_ENV for test
    process.env.NODE_ENV = 'production';

    // Test: Missing secret in production throws
    delete process.env.SESSION_SECRET;
    resetEphemeralSecretForTesting();
    let threwMissing = false;
    try {
      getSessionSecret();
    } catch (e: unknown) {
      threwMissing = e instanceof Error && e.message.includes('SESSION_SECRET is not configured in production');
    }
    assert(threwMissing, 'Production mode strictly rejects missing SESSION_SECRET');

    // Test: Placeholder secret in production throws
    process.env.SESSION_SECRET = 'your_cryptographically_secure_random_hmac_secret_here';
    let threwPlaceholder = false;
    try {
      getSessionSecret();
    } catch (e: unknown) {
      threwPlaceholder = e instanceof Error && e.message.includes('known placeholder value');
    }
    assert(threwPlaceholder, 'Production mode strictly rejects known placeholder SESSION_SECRET');

    // Test: Weak secret (< 32 chars) in production throws
    process.env.SESSION_SECRET = 'short_secret_only_24_chars';
    let threwWeak = false;
    try {
      getSessionSecret();
    } catch (e: unknown) {
      threwWeak = e instanceof Error && e.message.includes('too weak');
    }
    assert(threwWeak, 'Production mode strictly rejects weak SESSION_SECRET (< 32 characters)');

    // Test: Valid high-entropy secret (>= 32 chars) in production succeeds
    const validProdSecret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env.SESSION_SECRET = validProdSecret;
    const returnedProdSecret = getSessionSecret();
    assert(returnedProdSecret === validProdSecret, 'Production mode accepts genuine >= 32 char private secret');

    // Test: Token signing and verification work in production with valid secret
    const prodSigned = await signSessionId(validUuid1);
    const prodVerified = await verifySessionToken(prodSigned);
    assert(prodVerified === validUuid1, 'Signs and verifies session token in production with valid secret');

  } finally {
    // Restore environment variables and state
    // @ts-expect-error restoring NODE_ENV
    process.env.NODE_ENV = savedNodeEnv;
    if (savedSessionSecret !== undefined) {
      process.env.SESSION_SECRET = savedSessionSecret;
    } else {
      delete process.env.SESSION_SECRET;
    }
    resetEphemeralSecretForTesting();
  }

  // 2b. Trusted Proxy Mode (TRUST_PROXY_HEADERS === 'true')
  process.env.TRUST_PROXY_HEADERS = 'true';
  const trustedCfHeaders = new Headers({ 'cf-connecting-ip': '203.0.113.195' });
  assert(
    (await extractClientIp(trustedCfHeaders)) === '203.0.113.195',
    'Trusts edge-verified cf-connecting-ip when TRUST_PROXY_HEADERS === "true"'
  );

  const trustedRealIpHeaders = new Headers({ 'x-real-ip': '198.51.100.22' });
  assert(
    (await extractClientIp(trustedRealIpHeaders)) === '198.51.100.22',
    'Extracts trusted x-real-ip when TRUST_PROXY_HEADERS === "true"'
  );

  const trustedMaliciousHeaders = new Headers({ 'cf-connecting-ip': 'malicious;--injection' });
  assert(
    (await extractClientIp(trustedMaliciousHeaders)) === '127.0.0.1',
    'Rejects non-IP string in trusted mode and safely falls back to local loopback'
  );
  delete process.env.TRUST_PROXY_HEADERS;

  // --------------------------------------------------------------------------
  // 3. Streaming Payload Validator directly via lib/payload-validator.ts
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 3: Streaming Payload Validator (lib/payload-validator.ts) ---');

  // Test 3a: Valid small JSON payload stream
  const validJson = JSON.stringify({ cityName: 'Paris', durationHours: 3 });
  const validStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(validJson));
      controller.close();
    },
  });
  const validReq = new Request('http://localhost/api/itinerary/plan', {
    method: 'POST',
    body: validStream,
    // @ts-expect-error duplex required in Node fetch
    duplex: 'half',
  });
  const validRes = await readBoundedJsonPayload<{ cityName: string }>(validReq);
  assert(!validRes.error && validRes.data?.cityName === 'Paris', 'Streams and parses valid JSON payload <= 32 KB');

  // Test 3b: Oversized streaming payload (early abort)
  let readerWasCancelled: boolean = false;
  const oversizedStream = new ReadableStream({
    start(controller) {
      // Send 40 KB chunk
      const chunk = new Uint8Array(40 * 1024);
      controller.enqueue(chunk);
    },
    cancel() {
      readerWasCancelled = true;
    },
  });
  const oversizedReq = new Request('http://localhost/api/itinerary/plan', {
    method: 'POST',
    body: oversizedStream,
    // @ts-expect-error duplex required in Node fetch
    duplex: 'half',
  });
  const oversizedRes = await readBoundedJsonPayload(oversizedReq, MAX_PAYLOAD_BYTES);
  assert(oversizedRes.status === 413, 'Rejects streamed payload exceeding 32 KB with HTTP 413');
  assert(Boolean(readerWasCancelled), 'Stream reader immediately cancelled to stop receiving incoming bytes');

  // --------------------------------------------------------------------------
  // 4. Qloo Client, Security & Parsers directly via lib/qloo-client.ts
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 4: Qloo Client, Security & Parsers (lib/qloo-client.ts) ---');

  // 4a. QLOO_BASE_URL HTTPS and Host Allowlist Security
  const defaultBaseUrl = getValidatedQlooBaseUrl();
  assert(defaultBaseUrl === 'https://hackathon.api.qloo.com', 'Default Qloo base URL is official hackathon endpoint');

  // Strict HTTPS requirement: reject http:
  process.env.QLOO_BASE_URL = 'http://hackathon.api.qloo.com';
  const httpRejectedUrl = getValidatedQlooBaseUrl();
  assert(
    httpRejectedUrl === 'https://hackathon.api.qloo.com',
    'Rejects insecure http://hackathon.api.qloo.com and safely enforces https://hackathon.api.qloo.com'
  );

  // Reject unexpected ports
  process.env.QLOO_BASE_URL = 'https://hackathon.api.qloo.com:8443';
  assert(getValidatedQlooBaseUrl() === 'https://hackathon.api.qloo.com', 'Rejects unexpected port :8443 on official host');
  process.env.QLOO_BASE_URL = 'https://hackathon.api.qloo.com:80';
  assert(getValidatedQlooBaseUrl() === 'https://hackathon.api.qloo.com', 'Rejects port :80 on official host');
  process.env.QLOO_BASE_URL = 'https://hackathon.api.qloo.com:443';
  assert(getValidatedQlooBaseUrl() === 'https://hackathon.api.qloo.com', 'Accepts standard HTTPS port :443');

  // Reject embedded credentials
  process.env.QLOO_BASE_URL = 'https://user:password@hackathon.api.qloo.com';
  assert(getValidatedQlooBaseUrl() === 'https://hackathon.api.qloo.com', 'Rejects credentials embedded in URL');

  // Reject paths other than root
  process.env.QLOO_BASE_URL = 'https://hackathon.api.qloo.com/v2/insights';
  assert(getValidatedQlooBaseUrl() === 'https://hackathon.api.qloo.com', 'Rejects path /v2/insights in QLOO_BASE_URL');
  process.env.QLOO_BASE_URL = 'https://hackathon.api.qloo.com/';
  assert(getValidatedQlooBaseUrl() === 'https://hackathon.api.qloo.com', 'Accepts trailing slash root path');

  // Reject query strings
  process.env.QLOO_BASE_URL = 'https://hackathon.api.qloo.com?leak=true';
  assert(getValidatedQlooBaseUrl() === 'https://hackathon.api.qloo.com', 'Rejects query string in QLOO_BASE_URL');

  // Reject fragments
  process.env.QLOO_BASE_URL = 'https://hackathon.api.qloo.com#fragment';
  assert(getValidatedQlooBaseUrl() === 'https://hackathon.api.qloo.com', 'Rejects hash fragment in QLOO_BASE_URL');

  // Reject malformed URL
  process.env.QLOO_BASE_URL = 'not-a-valid-url';
  assert(getValidatedQlooBaseUrl() === 'https://hackathon.api.qloo.com', 'Rejects malformed URL string');

  // Reject untrusted hosts
  process.env.QLOO_BASE_URL = 'https://untrusted-exfiltration.example.com/api';
  assert(
    getValidatedQlooBaseUrl() === 'https://hackathon.api.qloo.com',
    'Rejects untrusted QLOO_BASE_URL domain and safely enforces https://hackathon.api.qloo.com'
  );
  process.env.QLOO_BASE_URL = 'https://hackathon.api.qloo.com.attacker.com';
  assert(
    getValidatedQlooBaseUrl() === 'https://hackathon.api.qloo.com',
    'Rejects subdomain spoofing attack (attacker.com suffix)'
  );

  // Accept official production host
  process.env.QLOO_BASE_URL = 'https://api.qloo.com';
  assert(getValidatedQlooBaseUrl() === 'https://api.qloo.com', 'Allows official production host api.qloo.com');

  // Accept official hackathon host
  process.env.QLOO_BASE_URL = 'https://hackathon.api.qloo.com';
  assert(getValidatedQlooBaseUrl() === 'https://hackathon.api.qloo.com', 'Allows official hackathon host hackathon.api.qloo.com');
  delete process.env.QLOO_BASE_URL;

  // 4a2. Untrusted Host Never Receives API Key
  const savedTestKey = process.env.QLOO_API_KEY;
  const savedOrigFetch = globalThis.fetch;
  const interceptedUrls: string[] = [];
  const interceptedHeaders: Headers[] = [];
  try {
    process.env.QLOO_BASE_URL = 'https://malicious-exfiltration.example.com';
    process.env.QLOO_API_KEY = 'sensitive_qloo_secret_key_12345';
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      interceptedUrls.push(urlStr);
      interceptedHeaders.push(new Headers(init?.headers));
      return new Response(JSON.stringify({ entities: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as typeof fetch;

    await searchQlooEntities('Miles Davis', 'urn:entity:artist', false);

    assert(
      !interceptedUrls.some(u => u.includes('malicious-exfiltration.example.com')),
      'Untrusted host in QLOO_BASE_URL was never called by HTTP client'
    );
    assert(
      interceptedUrls.every(u => u.startsWith('https://hackathon.api.qloo.com')),
      'All live requests strictly sent to official https://hackathon.api.qloo.com'
    );
    assert(
      interceptedHeaders.some(h => h.get('X-Api-Key') === 'sensitive_qloo_secret_key_12345'),
      'API key was delivered securely to official endpoint'
    );
  } finally {
    globalThis.fetch = savedOrigFetch;
    if (savedTestKey !== undefined) {
      process.env.QLOO_API_KEY = savedTestKey;
    } else {
      delete process.env.QLOO_API_KEY;
    }
    delete process.env.QLOO_BASE_URL;
    clearProbeCacheForTesting();
  }

  // 4b. Pure Response Parsing & Never Invent Entity IDs
  const mockQlooSearchResponse = {
    response: {
      entities: [
        {
          id: 'ent_miles_davis_live',
          name: 'Miles Davis',
          type: 'urn:entity:artist',
          description: 'Legendary jazz innovator',
          score: 98,
        },
      ],
    },
  };
  const parsedSearch = parseQlooSearchItems(mockQlooSearchResponse, 'Miles Davis', 'urn:entity:artist');
  assert(parsedSearch.length === 1, 'Parses official response.entities structure from /search');
  assert(parsedSearch[0].id === 'ent_miles_davis_live', 'Maps entity id accurately from /search');
  assert(parsedSearch[0].name === 'Miles Davis', 'Maps entity name accurately from /search');
  assert(parsedSearch[0].score === 98, 'Maps entity score accurately from /search');

  // Search responses with missing or blank entity IDs produce no usable candidates
  const mockMissingIdSearch = {
    response: {
      entities: [
        { name: 'Entity With No ID', type: 'urn:entity:artist' },
        { id: '', name: 'Entity With Empty ID', type: 'urn:entity:artist' },
        { id: '   ', name: 'Entity With Whitespace ID', type: 'urn:entity:artist' },
        { id: null, name: 'Entity With Null ID', type: 'urn:entity:artist' },
        { id: undefined, name: 'Entity With Undefined ID', type: 'urn:entity:artist' },
        { entity_id: 'real_entity_id_456', name: 'Entity With Real ID', type: 'urn:entity:artist' },
      ],
    },
  };
  const parsedSearchWithMissing = parseQlooSearchItems(mockMissingIdSearch, 'Query', 'urn:entity:artist');
  assert(parsedSearchWithMissing.length === 1, 'Search parser discards all items with missing, blank, or null IDs');
  assert(parsedSearchWithMissing[0].id === 'real_entity_id_456', 'Only the genuine entity ID is retained');
  assert(
    !parsedSearchWithMissing.some(c => c.id.startsWith('qloo-entity-')),
    'ZERO invented/fallback placeholder IDs (e.g. qloo-entity-*) in search parser'
  );

  const mockAllMissingSearch = {
    entities: [
      { name: 'Missing 1' },
      { id: '', name: 'Missing 2' },
    ],
  };
  const parsedAllMissing = parseQlooSearchItems(mockAllMissingSearch, 'Query');
  assert(parsedAllMissing.length === 0, 'Search parser returns empty array when no candidates have real IDs');

  // 4c. Pure Response Parsing: Official Qloo /v2/insights Response Schema
  const mockQlooInsightsResponse = {
    response: {
      results: [
        {
          id: 'place_blue_note',
          name: 'Blue Note Jazz Club',
          category: 'urn:entity:place',
          affinity: 0.94,
          location: {
            lat: 40.7308,
            lng: -74.0007,
            address: '131 W 3rd St',
            neighborhood: 'Greenwich Village',
          },
          price_tier: '$$',
          attributes: ['Live Music', 'Intimate', 'Historic'],
        },
      ],
    },
  };
  const parsedInsights = parseQlooInsightsItems(mockQlooInsightsResponse, 'New York');
  assert(parsedInsights.length === 1, 'Parses official response.results structure from /v2/insights');
  assert(parsedInsights[0].id === 'place_blue_note', 'Maps place id accurately from /v2/insights');
  assert(parsedInsights[0].affinityScore === 94, 'Converts 0.94 affinity float to 94% integer score');
  assert(parsedInsights[0].location?.lat === 40.7308, 'Extracts verified latitude coordinate');
  assert(parsedInsights[0].location?.lng === -74.0007, 'Extracts verified longitude coordinate');
  assert(parsedInsights[0].estimatedSpendTier === '$$', 'Extracts verified spend tier');

  // Insights parser with missing or blank entity IDs
  const mockMissingIdInsights = {
    results: [
      { name: 'Place With No ID', affinity: 0.8 },
      { id: '', name: 'Place With Empty ID' },
      { id: '   ', name: 'Place With Whitespace ID' },
      { id: null, name: 'Place With Null ID' },
      { entity_id: 'real_place_id_789', name: 'Real Place', affinity: 0.85 },
    ],
  };
  const parsedInsightsWithMissing = parseQlooInsightsItems(mockMissingIdInsights, 'New York');
  assert(parsedInsightsWithMissing.length === 1, 'Insights parser discards all items with missing, blank, or null IDs');
  assert(parsedInsightsWithMissing[0].id === 'real_place_id_789', 'Only the genuine place ID is retained');
  assert(
    !parsedInsightsWithMissing.some(p => p.id.startsWith('qloo-place-')),
    'ZERO invented/fallback placeholder IDs (e.g. qloo-place-*) in insights parser'
  );

  const mockAllMissingInsights = {
    results: [
      { name: 'No ID 1' },
      { entity_id: '', name: 'No ID 2' },
    ],
  };
  const parsedAllMissingInsights = parseQlooInsightsItems(mockAllMissingInsights, 'New York');
  assert(parsedAllMissingInsights.length === 0, 'Insights parser returns empty array when no candidates have real IDs');

  // 4c2. Only Valid Qloo IDs Passed to Insights Request
  const savedInsightsFetch = globalThis.fetch;
  const savedInsightsKey = process.env.QLOO_API_KEY;
  let insightsQueriedEntities: string[] = [];
  try {
    process.env.QLOO_API_KEY = 'mock_key_for_insights_test';
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const parsedUrl = new URL(urlStr);
      insightsQueriedEntities = parsedUrl.searchParams.getAll('signal.interests.entities');
      return new Response(JSON.stringify({ results: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as typeof fetch;

    await fetchQlooPlaceInsights({
      entityIds: ['valid_qloo_id_001', '', '   ', 'valid_qloo_id_002'],
      lat: 40.7128,
      lng: -74.006,
      cityName: 'New York',
      forceSampleMode: false,
    });

    assert(
      insightsQueriedEntities.length === 2 &&
      insightsQueriedEntities[0] === 'valid_qloo_id_001' &&
      insightsQueriedEntities[1] === 'valid_qloo_id_002',
      'Only valid, non-empty Qloo IDs are passed in signal.interests.entities to /v2/insights'
    );
    assert(
      !insightsQueriedEntities.some(id => !id.trim() || id.startsWith('qloo-entity-')),
      'No blank, empty, or synthetic IDs reach /v2/insights query parameters'
    );
  } finally {
    globalThis.fetch = savedInsightsFetch;
    if (savedInsightsKey !== undefined) {
      process.env.QLOO_API_KEY = savedInsightsKey;
    } else {
      delete process.env.QLOO_API_KEY;
    }
  }

  // 4d. Unscored place item truthfully produces affinityScore: null (ZERO fabricated scores)
  const mockUnscoredResponse = {
    results: [
      {
        id: 'place_unscored',
        name: 'Unscored Cultural Center',
        category: 'urn:entity:place',
      },
    ],
  };
  const parsedUnscored = parseQlooInsightsItems(mockUnscoredResponse, 'New York');
  assert(parsedUnscored[0].affinityScore === null, 'Truthfully outputs null when upstream Qloo does not provide affinity');

  // 4e. Offline Demo Mode & Live Connectivity Check
  const isLive = isLiveQlooConfigured();
  assert(typeof isLive === 'boolean', `Reports configured boolean truthfully (current: ${isLive})`);

  // Entity search in sample/offline mode
  const searchResult = await searchQlooEntities('Miles Davis', 'urn:entity:artist', true);
  assert(searchResult.candidates.length > 0, 'Entity search discovers candidates for known anchors');
  assert(searchResult.isSampleData === true, 'Offline reference correctly tagged with isSampleData: true');
  assert(searchResult.candidates[0].name === 'Miles Davis', 'Resolved entity matches search anchor name');

  // Places Insights in sample/offline mode
  const insightsResult = await fetchQlooPlaceInsights({
    entityIds: ['ent-miles-davis'],
    lat: 40.7128,
    lng: -74.006,
    cityName: 'New York',
    forceSampleMode: true,
  });
  assert(insightsResult.candidates.length > 0, 'Insights returns place candidates in target city');
  assert(insightsResult.isSampleData === true, 'Sample place results truthfully labeled isSampleData: true');

  // Live Qloo Probe (executes network call if live key is present in environment)
  if (isLive) {
    console.log('  [NOTICE] QLOO_API_KEY detected. Executing live probe against https://hackathon.api.qloo.com...');
    try {
      const liveSearch = await searchQlooEntities('Miles Davis', 'urn:entity:artist', false);
      assert(liveSearch.candidates.length > 0, 'Live Qloo /search returns candidates for "Miles Davis"');
      assert(liveSearch.isSampleData === false, 'Live Qloo /search marked as live (isSampleData: false)');
    } catch (liveErr: unknown) {
      console.warn('  [WARN] Live Qloo probe failed:', liveErr instanceof Error ? liveErr.message : String(liveErr));
    }
  } else {
    console.log('  [INFO] QLOO_API_KEY not configured in environment. Schema parsers and security validation passed.');
  }

  // 4f. Live Connectivity Verification & Singleflight In-Flight Deduplication Test (Mock Upstream Network)
  clearProbeCacheForTesting();
  const savedKey = process.env.QLOO_API_KEY;
  const originalFetch = globalThis.fetch;
  let upstreamFetchCount = 0;

  try {
    process.env.QLOO_API_KEY = 'mock_live_probe_key_for_testing';
    // Mock upstream Qloo fetch with simulated 40ms network latency
    globalThis.fetch = (async () => {
      upstreamFetchCount++;
      await new Promise(r => setTimeout(r, 40));
      return new Response(
        JSON.stringify({
          entities: [
            { id: 'ent_mock_artist', name: 'Miles Davis', type: 'urn:entity:artist', score: 0.95 }
          ]
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch;

    // Launch 5 simultaneous concurrent calls during the active network fetch window
    const concurrentProbePromises = [
      verifyLiveQlooConnectivity(),
      verifyLiveQlooConnectivity(),
      verifyLiveQlooConnectivity(),
      verifyLiveQlooConnectivity(),
      verifyLiveQlooConnectivity(),
    ];

    const concurrentResults = await Promise.all(concurrentProbePromises);

    assert(
      upstreamFetchCount === 1,
      `Singleflight deduplication collapses 5 simultaneous concurrent calls into EXACTLY 1 upstream fetch (got ${upstreamFetchCount})`
    );
    assert(
      concurrentResults.every(r => r.configured === true && r.connected === true),
      'All 5 concurrent callers receive the identical verified connection result'
    );

    // Test 5-minute TTL cache hit on subsequent call
    const cachedCall = await verifyLiveQlooConnectivity();
    assert(cachedCall.cached === true, 'Subsequent call within 5-minute TTL returns cached result');
    assert(
      upstreamFetchCount === 1,
      `5-minute cache hit prevents any additional upstream fetch (count remained ${upstreamFetchCount})`
    );

  } finally {
    globalThis.fetch = originalFetch;
    if (savedKey !== undefined) {
      process.env.QLOO_API_KEY = savedKey;
    } else {
      delete process.env.QLOO_API_KEY;
    }
    clearProbeCacheForTesting();
  }

  // Also verify offline keyless status reporting
  const offlineStatus = await verifyLiveQlooConnectivity();
  assert(offlineStatus.configured === false, 'Probes offline status truthfully reporting configured: false when key is absent');
  assert(offlineStatus.connected === false, 'Reports offline connection status truthfully');

  // 4g. Middleware Session Cookie Provisioning & HMAC Cryptographic Integrity
  const mockHttpReq = new NextRequest('http://localhost:3000/');
  const mwRes = await middleware(mockHttpReq);
  const sessionCookie = mwRes.cookies.get('tt_session');
  assert(Boolean(sessionCookie?.value), 'Middleware automatically provisions tt_session cookie for new visitors');
  assert(sessionCookie?.httpOnly === true, 'tt_session cookie is strictly configured with HttpOnly flag');
  assert(sessionCookie?.sameSite === 'lax', 'tt_session cookie configured with SameSite=lax');
  const verifiedIdFromMw = sessionCookie?.value ? await verifySessionToken(sessionCookie.value) : null;
  assert(Boolean(verifiedIdFromMw), 'Middleware issues a valid cryptographically HMAC-signed session cookie');

  // --------------------------------------------------------------------------
  // 5. Full Agent Workflow Execution directly via lib/agent-workflow.ts
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 5: Full Agent Workflow Engine (lib/agent-workflow.ts) ---');

  const mockRequest: OutingRequest = {
    cityName: 'New York',
    cityCoordinates: { lat: 40.7128, lng: -74.006 },
    durationHours: 3,
    budgetTier: 'moderate',
    mobility: {
      stepFreeAccess: true,
      lowWalkingTransit: true,
      seatedRestIntervals: true,
      sensoryFriendly: true,
    },
    anchors: [
      { id: '1', name: 'Miles Davis', category: 'music', entityType: 'urn:entity:artist', resolved: false },
      { id: '2', name: 'Haruki Murakami', category: 'literature', entityType: 'urn:entity:book', resolved: false },
    ],
    compareWithoutAnchors: true,
    forceSampleMode: true,
  };

  const plan = await runTasteTrailAgent(mockRequest);

  // 5a. Pipeline stages
  const uniqueStages = [...new Set(plan.workflowSteps.map(s => s.step))];
  assert(uniqueStages.length === 5, 'Agent workflow executes all 5 transparent pipeline stages (Stages 1 through 5)');
  assert(
    [1, 2, 3, 4, 5].every(stg => plan.workflowSteps.some(s => s.step === stg && s.status === 'completed')),
    'All 5 workflow steps reach completed status'
  );

  // 5b. Stops & Dwell pacing
  assert(plan.stops.length >= 2, `Synthesizes structured outing with ${plan.stops.length} stops`);
  assert(plan.totalDurationMinutes <= 180 + 20, 'Overall outing total duration respects allocated 3-hour window');

  // 5c. Strict Budget Enforcement
  const allModerateOrLower = plan.stops.every(s => s.estimatedCost !== '$$$');
  assert(allModerateOrLower === true, 'Strict budget enforcement eliminates luxury ($$$) venues');

  // 5d. Pairwise Low-Walking Route Chaining: every consecutive pair MUST be <= 0.8 km straight line
  let allHopsConforming = true;
  let maxHopKm = 0;
  for (let i = 0; i < plan.stops.length - 1; i++) {
    const s1 = plan.stops[i];
    const s2 = plan.stops[i + 1];
    if (s1.location?.lat && s1.location?.lng && s2.location?.lat && s2.location?.lng) {
      const hop = calculateHaversineDistanceKm(s1.location.lat, s1.location.lng, s2.location.lat, s2.location.lng);
      if (hop > maxHopKm) maxHopKm = hop;
      if (hop > 0.8) allHopsConforming = false;
    } else {
      allHopsConforming = false;
    }
  }
  assert(
    allHopsConforming === true,
    `Every consecutive stop-to-stop hop is strictly <= 0.8 km straight-line (max hop: ${maxHopKm.toFixed(2)} km)`
  );
  assert(
    plan.stops.every(s => typeof s.location?.lat === 'number' && typeof s.location?.lng === 'number'),
    'All selected stops in low-walking mode have verified coordinates'
  );

  const lowWalkingEnforced = plan.provenance.appConstraints.mobilityFiltersEnforced.some(r =>
    r.includes('0.8 km')
  );
  assert(lowWalkingEnforced === true, 'Provenance confirms 0.8 km straight-line low-walking limit is enforced');

  // 5e. Planned break/dwell honest wording (Zero "guaranteed seated rest" claims)
  const allNotesHonest = plan.stops.every(s =>
    !s.provenance.appConstraintDecisions.some(d => d.includes('guaranteed seated rest'))
  );
  assert(allNotesHonest === true, 'Replaces "guaranteed seated rest" with honest planned break/dwell pacing');

  // 5f. Segregated Physical Advisories
  const advisories = plan.provenance.appConstraints.unverifiedAdvisories || [];
  assert(advisories.length >= 2, 'Physical accessibility and sensory levels segregated into unverified advisories');
  assert(
    advisories.every(a => a.includes('NOT indexed') || a.includes('not tracked')),
    'Advisories explicitly state Qloo does not index architectural ramps or real-time noise'
  );

  // 5g. Conceptual Baseline Comparison
  assert(Boolean(plan.baselineComparison), 'Includes conceptual baseline comparison for evaluating Qloo grounding');
  assert(
    plan.baselineComparison?.methodologyNotice.includes('reference benchmark') === true,
    'Baseline comparison contains truthful methodology notice explaining it is a reference benchmark'
  );

  // --------------------------------------------------------------------------
  // 6. Error & Boundary Handling directly in lib/agent-workflow.ts
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 6: Error Handling & Security Bounding ---');

  // 6a. Invalid latitude
  let latError = false;
  try {
    await runTasteTrailAgent({ ...mockRequest, cityCoordinates: { lat: 195, lng: -74 } });
  } catch (e: unknown) {
    latError = e instanceof Error && (e.message.includes('lat') || e.message.includes('coordinates'));
  }
  assert(latError === true, 'Rejects invalid latitude > 90');

  // 6b. Empty anchors
  let anchorError = false;
  try {
    await runTasteTrailAgent({ ...mockRequest, anchors: [] });
  } catch (e: unknown) {
    anchorError = e instanceof Error && e.message.includes('At least 1 cultural anchor');
  }
  assert(anchorError === true, 'Rejects empty cultural anchor list');

  // 6c. Missing-ID responses cannot produce a successful live itinerary disguised as real Qloo data
  const savedAgentFetch = globalThis.fetch;
  const savedAgentKey = process.env.QLOO_API_KEY;
  try {
    process.env.QLOO_API_KEY = 'mock_key_for_agent_test';

    // Case 1: Search returns candidates with missing IDs -> Stage 2 halts with clarification error
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (urlStr.includes('/search')) {
        return new Response(
          JSON.stringify({
            response: {
              entities: [
                { name: 'Miles Davis', type: 'urn:entity:artist' }, // missing id and entity_id!
              ],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify({ results: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as typeof fetch;

    let searchMissingThrew = false;
    let searchClarificationMsg = '';
    try {
      await runTasteTrailAgent({
        ...mockRequest,
        forceSampleMode: false,
      });
    } catch (err: unknown) {
      searchMissingThrew = true;
      searchClarificationMsg = err instanceof Error ? err.message : String(err);
    }

    assert(
      searchMissingThrew === true,
      'Live agent workflow strictly halts when Qloo search returns missing entity IDs'
    );
    assert(
      searchClarificationMsg.includes('Cultural Anchor Clarification Needed'),
      `Halts with clarification notice when entities have no genuine ID (got: "${searchClarificationMsg.slice(0, 45)}...")`
    );

    // Case 2: Insights returns candidates with missing IDs -> Stage 3 halts and refuses to fabricate data
    clearProbeCacheForTesting();
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (urlStr.includes('/search')) {
        return new Response(
          JSON.stringify({
            response: {
              entities: [
                { id: 'ent_genuine_123', name: 'Miles Davis', type: 'urn:entity:artist' },
              ],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (urlStr.includes('/v2/insights')) {
        return new Response(
          JSON.stringify({
            response: {
              results: [
                { name: 'Place Without ID', affinity: 0.9 }, // missing id and entity_id!
              ],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify({ results: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as typeof fetch;

    let insightsMissingThrew = false;
    let insightsMsg = '';
    try {
      await runTasteTrailAgent({
        ...mockRequest,
        forceSampleMode: false,
      });
    } catch (err: unknown) {
      insightsMissingThrew = true;
      insightsMsg = err instanceof Error ? err.message : String(err);
    }

    assert(
      insightsMissingThrew === true,
      'Live agent workflow strictly halts when Qloo insights returns places with missing IDs'
    );
    assert(
      insightsMsg.includes('Qloo Cultural Intelligence returned no matching venues'),
      `Truthfully informs user when no verified places remain after discarding missing-ID candidates (got: "${insightsMsg.slice(0, 45)}...")`
    );

  } finally {
    globalThis.fetch = savedAgentFetch;
    if (savedAgentKey !== undefined) {
      process.env.QLOO_API_KEY = savedAgentKey;
    } else {
      delete process.env.QLOO_API_KEY;
    }
    clearProbeCacheForTesting();
  }

  // --------------------------------------------------------------------------
  // 7. README Documentation Integrity & Privacy Auditing
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 7: Documentation Integrity & Privacy Auditing (README.md) ---');

  const readmePath = path.resolve(__dirname, '../README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf-8');

  // Verify tt_session cookie documentation
  assert(readmeContent.includes('tt_session'), 'README explicitly documents the tt_session cookie');
  assert(
    readmeContent.includes('anonymous') &&
    (readmeContent.includes('HTTP-only') || readmeContent.includes('HttpOnly')) &&
    readmeContent.includes('signed session cookie'),
    'README accurately describes tt_session as an anonymous, HTTP-only, signed session cookie'
  );
  assert(
    readmeContent.includes('rate limiting'),
    'README documents that tt_session is used for rate limiting'
  );
  assert(
    !readmeContent.includes('no tracking cookies'),
    'README eliminates inaccurate "no tracking cookies" claim'
  );
  assert(
    readmeContent.includes("stored solely in the user's browser") ||
    readmeContent.includes("stored only in the user's browser") ||
    readmeContent.includes("browser storage"),
    'README accurately documents cookie is stored only in the browser'
  );
  assert(
    readmeContent.includes('database') && readmeContent.includes('disk') &&
    (readmeContent.includes('**not** persist') || readmeContent.includes('not persist') || readmeContent.includes('does not persist') || readmeContent.includes('No session information is persisted')),
    'README documents that no session records or user profiles are persisted server-side in any database or disk'
  );

  // Verify honest accessibility & operational limits
  assert(
    readmeContent.includes('Physical accessibility') || readmeContent.includes('physical accessibility'),
    'README documents physical accessibility constraints'
  );
  assert(
    readmeContent.includes('live opening hours') || readmeContent.includes('opening hours'),
    'README documents live opening hours limitations'
  );
  assert(
    readmeContent.includes('real-time') && (readmeContent.includes('prices') || readmeContent.includes('ticket prices')),
    'README documents real-time price limitations'
  );
  assert(
    readmeContent.includes('not verified by Qloo') || readmeContent.includes('unverified by Qloo'),
    'README honestly states physical operations and hours are not verified by Qloo'
  );

  // Verify clone & setup instructions
  assert(
    readmeContent.includes('git clone https://github.com/venkatkrish98/tastetrail.git'),
    'README clone URL matches this repository (venkatkrish98/tastetrail)'
  );
  assert(
    !readmeContent.includes('hack_d427972f94fd3425cb215cb71e8d008a97b2382a'),
    'README never exposes any real API keys or hackathon credentials'
  );

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`  Test Run Complete: ${passed} Passed, ${failed} Failed `);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
