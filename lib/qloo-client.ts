/**
 * TasteTrail Qloo Cultural Intelligence Client
 * 
 * Complies strictly with the official Qloo Hackathon developer guidelines:
 * - Base URL: https://hackathon.api.qloo.com
 * - Auth Header: X-Api-Key (server-side only, NEVER leaked to client)
 * - Supported endpoints: /search for entity resolution, /v2/insights for cultural recommendations
 * - Parameters validated against official docs: uses `types` for /search, `filter.type` & `signal.interests.entities` for /v2/insights
 * - Response parsing supports all official formats: `response.entities`, `entities`, `results`, `data`
 * - ZERO fabricated affinity scores or accessibility claims
 * - Honest error reporting: never silently hides live API errors behind sample data
 */

import { DisambiguationCandidate, QlooRawPlaceCandidate } from './types';
import { SAMPLE_CITIES_FIXTURES } from './sample-fixtures';

const OFFICIAL_QLOO_HOSTS = new Set([
  'hackathon.api.qloo.com',
  'api.qloo.com',
]);

/**
 * Validates and sanitizes QLOO_BASE_URL against an allowlist of official Qloo hosts.
 * - Strictly requires HTTPS protocol. Rejects HTTP, credentials, non-standard ports,
 *   paths, query strings, fragments, and untrusted hosts.
 * - Prevents credential leakage (X-Api-Key) to arbitrary or insecure external endpoints.
 * - Safely defaults to https://hackathon.api.qloo.com on any invalid value.
 * - Never includes API keys or secrets in logs or warning messages.
 */
export function getValidatedQlooBaseUrl(): string {
  const envUrl = process.env.QLOO_BASE_URL?.trim();
  if (!envUrl) {
    return 'https://hackathon.api.qloo.com';
  }

  try {
    const parsed = new URL(envUrl);

    // 1. Strictly require HTTPS
    if (parsed.protocol !== 'https:') {
      console.warn(
        `[Security Warning] Insecure protocol "${parsed.protocol}" in QLOO_BASE_URL. Only https: is permitted. Enforcing official endpoint https://hackathon.api.qloo.com.`
      );
      return 'https://hackathon.api.qloo.com';
    }

    // 2. Hostname must match official Qloo hosts exactly
    const hostname = parsed.hostname.toLowerCase();
    if (!OFFICIAL_QLOO_HOSTS.has(hostname)) {
      console.warn(
        `[Security Warning] Untrusted QLOO_BASE_URL hostname "${parsed.hostname}". Refusing to transmit X-Api-Key. Enforcing official endpoint https://hackathon.api.qloo.com.`
      );
      return 'https://hackathon.api.qloo.com';
    }

    // 3. Reject unexpected ports
    if (parsed.port !== '' && parsed.port !== '443') {
      console.warn(
        `[Security Warning] Unexpected port "${parsed.port}" in QLOO_BASE_URL. Enforcing official endpoint https://hackathon.api.qloo.com.`
      );
      return 'https://hackathon.api.qloo.com';
    }

    // 4. Reject credentials (username/password)
    if (parsed.username || parsed.password) {
      console.warn(
        '[Security Warning] Embedded credentials in QLOO_BASE_URL are rejected. Enforcing official endpoint https://hackathon.api.qloo.com.'
      );
      return 'https://hackathon.api.qloo.com';
    }

    // 5. Reject paths other than empty or root '/'
    if (parsed.pathname !== '' && parsed.pathname !== '/') {
      console.warn(
        `[Security Warning] Unexpected path "${parsed.pathname}" in QLOO_BASE_URL. Enforcing official endpoint https://hackathon.api.qloo.com.`
      );
      return 'https://hackathon.api.qloo.com';
    }

    // 6. Reject query strings
    if (parsed.search !== '') {
      console.warn(
        '[Security Warning] Query parameters in QLOO_BASE_URL are rejected. Enforcing official endpoint https://hackathon.api.qloo.com.'
      );
      return 'https://hackathon.api.qloo.com';
    }

    // 7. Reject fragments / hashes
    if (parsed.hash !== '') {
      console.warn(
        '[Security Warning] Hash fragments in QLOO_BASE_URL are rejected. Enforcing official endpoint https://hackathon.api.qloo.com.'
      );
      return 'https://hackathon.api.qloo.com';
    }

    return `https://${hostname}`;
  } catch {
    console.warn(
      '[Security Warning] Malformed QLOO_BASE_URL. Enforcing official endpoint https://hackathon.api.qloo.com.'
    );
    return 'https://hackathon.api.qloo.com';
  }
}

export function getQlooApiKey(): string {
  return process.env.QLOO_API_KEY?.trim() || '';
}

// In-memory server-side TTL cache (15 minutes)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 15 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T): void {
  if (cache.size > 300) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { data, timestamp: Date.now() });
}

export function isLiveQlooConfigured(): boolean {
  const key = getQlooApiKey();
  return Boolean(
    key &&
    key !== 'your_hackathon_api_key_here' &&
    key.length > 5
  );
}

/**
 * Pure parser for Qloo /search response conforming to official guide schemas.
 * STRICT INTEGRITY: Only returns candidates containing a real, non-empty ID supplied by Qloo.
 * Candidates without a real ID are discarded and never given fallback or placeholder IDs.
 */
export function parseQlooSearchItems(
  json: unknown,
  query: string,
  entityType?: string
): DisambiguationCandidate[] {
  const obj = json as Record<string, unknown> | null;
  let rawItems: Array<{
    id?: string;
    entity_id?: string;
    name?: string;
    title?: string;
    type?: string;
    entity_type?: string;
    category?: string;
    description?: string;
    score?: number;
    popularity?: number;
  }> = [];

  if (obj && typeof obj === 'object') {
    const resObj = obj.response as Record<string, unknown> | undefined;
    const resultsObj = obj.results as Record<string, unknown> | undefined;

    if (Array.isArray(obj.entities)) {
      rawItems = obj.entities;
    } else if (resObj && Array.isArray(resObj.entities)) {
      rawItems = resObj.entities as [];
    } else if (Array.isArray(obj.results)) {
      rawItems = obj.results;
    } else if (resultsObj && Array.isArray(resultsObj.entities)) {
      rawItems = resultsObj.entities as [];
    } else if (Array.isArray(obj.data)) {
      rawItems = obj.data;
    } else if (Array.isArray(obj.response)) {
      rawItems = obj.response;
    }
  } else if (Array.isArray(json)) {
    rawItems = json;
  }

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return [];
  }

  const candidates: DisambiguationCandidate[] = [];
  for (const item of rawItems) {
    if (!item || typeof item !== 'object') continue;

    // STRICT INTEGRITY: Only accept real, non-empty IDs from Qloo.
    // Discard any candidate without a real ID. NEVER invent placeholder IDs!
    const rawId = (typeof item.id === 'string' && item.id.trim()) ||
                  (typeof item.entity_id === 'string' && item.entity_id.trim());
    if (!rawId) {
      continue;
    }

    const name = (typeof item.name === 'string' && item.name.trim()) ||
                 (typeof item.title === 'string' && item.title.trim()) ||
                 query;

    candidates.push({
      id: rawId,
      name,
      type: item.type || item.entity_type || item.category || entityType || 'urn:entity',
      description: item.description,
      score: typeof item.score === 'number' ? item.score : null,
    });

    if (candidates.length >= 5) break;
  }

  return candidates;
}

/**
 * Entity search using official /search endpoint
 * Follows official Qloo docs: parameter `types` (plural), response in `response.entities` or `entities`
 */
export async function searchQlooEntities(
  query: string,
  entityType?: string,
  forceSampleMode?: boolean
): Promise<{ candidates: DisambiguationCandidate[]; isSampleData: boolean }> {
  const trimmed = query.trim();
  if (!trimmed) return { candidates: [], isSampleData: false };

  // Explicit sample mode requested or no live API key set
  if (forceSampleMode || !isLiveQlooConfigured()) {
    return {
      candidates: getSampleEntityMatches(trimmed, entityType),
      isSampleData: true,
    };
  }

  const cacheKey = `search:${trimmed}:${entityType || 'all'}`;
  const cached = getCached<DisambiguationCandidate[]>(cacheKey);
  if (cached) {
    return { candidates: cached, isSampleData: false };
  }

  const baseUrl = getValidatedQlooBaseUrl();
  const url = new URL(`${baseUrl}/search`);
  url.searchParams.set('query', trimmed);
  if (entityType) {
    // Official Qloo documentation strictly specifies 'types'
    url.searchParams.set('types', entityType);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': getQlooApiKey(),
      },
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    throw new Error(
      isTimeout
        ? 'Qloo /search request timed out after 9 seconds.'
        : `Network error connecting to Qloo API (${baseUrl}/search): ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        `Qloo API authentication failed (HTTP ${res.status}). Verify your QLOO_API_KEY in .env.local against the hackathon portal.`
      );
    }
    if (res.status === 429) {
      throw new Error('Qloo API rate limit reached (HTTP 429). Please wait a moment before trying again.');
    }
    throw new Error(`Qloo /search returned HTTP ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();
  const candidates = parseQlooSearchItems(json, trimmed, entityType);

  setCache(cacheKey, candidates);
  return { candidates, isSampleData: false };
}

/**
 * Recommendations / Cultural Places via official /v2/insights endpoint
 * Follows official Qloo docs:
 * filter.type=urn:entity:place
 * signal.interests.entities=<entity_id>
 * filter.location=POINT(lng lat)
 */
export async function fetchQlooPlaceInsights(params: {
  entityIds: string[];
  lat: number;
  lng: number;
  cityName: string;
  forceSampleMode?: boolean;
}): Promise<{ candidates: QlooRawPlaceCandidate[]; isSampleData: boolean }> {
  const { entityIds, lat, lng, cityName, forceSampleMode } = params;

  // Explicit sample mode requested or no live API key set
  if (forceSampleMode || !isLiveQlooConfigured()) {
    const fixtureCity = SAMPLE_CITIES_FIXTURES[cityName] || SAMPLE_CITIES_FIXTURES['New York'];
    return {
      candidates: fixtureCity.curatedCandidates,
      isSampleData: true,
    };
  }

  // Fail-closed validation: Require at least one valid, non-empty entity ID before live Qloo request
  const validEntityIds = Array.isArray(entityIds)
    ? entityIds
        .map(id => (typeof id === 'string' ? id.trim() : ''))
        .filter(id => id.length > 0)
    : [];

  if (validEntityIds.length === 0) {
    throw new Error(
      'At least one valid, non-empty Qloo entity ID is required to fetch live place insights.'
    );
  }

  const cacheKey = `insights:${cityName}:${lat.toFixed(2)},${lng.toFixed(2)}:${validEntityIds.slice().sort().join(',')}`;
  const cached = getCached<QlooRawPlaceCandidate[]>(cacheKey);
  if (cached) {
    return { candidates: cached, isSampleData: false };
  }

  const baseUrl = getValidatedQlooBaseUrl();
  const url = new URL(`${baseUrl}/v2/insights`);
  url.searchParams.set('filter.type', 'urn:entity:place');
  
  // WKT Point: POINT(longitude latitude)
  url.searchParams.set('filter.location', `POINT(${lng} ${lat})`);
  url.searchParams.set('filter.location.radius', '20000'); // 20 km radius
  
  // Add signal.interests.entities for each validated, trimmed entity ID
  for (const id of validEntityIds) {
    url.searchParams.append('signal.interests.entities', id);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': getQlooApiKey(),
      },
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    // In live mode, DO NOT swallow errors into sample data!
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    throw new Error(
      isTimeout
        ? 'Qloo /v2/insights request timed out after 10 seconds.'
        : `Network error connecting to Qloo Insights API (${baseUrl}/v2/insights): ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        `Qloo Insights authentication failed (HTTP ${res.status}). Verify your QLOO_API_KEY in .env.local.`
      );
    }
    if (res.status === 429) {
      throw new Error('Qloo Insights rate limit reached (HTTP 429). Please wait before retrying.');
    }
    throw new Error(`Qloo /v2/insights returned HTTP ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();
  const candidates = parseQlooInsightsItems(json, cityName);

  setCache(cacheKey, candidates);
  return { candidates, isSampleData: false };
}

/**
 * Pure parser for Qloo /v2/insights response conforming to official guide schemas
 */
export function parseQlooInsightsItems(
  json: unknown,
  cityName: string
): QlooRawPlaceCandidate[] {
  const obj = json as Record<string, unknown> | null;
  let rawResults: Array<Record<string, unknown>> = [];

  if (!obj || typeof obj !== 'object') {
    return [];
  }

  const resObj = obj.response as Record<string, unknown> | undefined;
  const resultsObj = obj.results as Record<string, unknown> | undefined;

  if (Array.isArray(obj.results)) {
    rawResults = obj.results as Array<Record<string, unknown>>;
  } else if (resultsObj && Array.isArray(resultsObj.entities)) {
    rawResults = resultsObj.entities as Array<Record<string, unknown>>;
  } else if (resObj && Array.isArray(resObj.results)) {
    rawResults = resObj.results as Array<Record<string, unknown>>;
  } else if (resObj && Array.isArray(resObj.entities)) {
    rawResults = resObj.entities as Array<Record<string, unknown>>;
  } else if (Array.isArray(obj.entities)) {
    rawResults = obj.entities as Array<Record<string, unknown>>;
  } else if (Array.isArray(obj.data)) {
    rawResults = obj.data as Array<Record<string, unknown>>;
  } else if (Array.isArray(obj.response)) {
    rawResults = obj.response as Array<Record<string, unknown>>;
  } else if (Array.isArray(json)) {
    rawResults = json as Array<Record<string, unknown>>;
  }

  if (!Array.isArray(rawResults) || rawResults.length === 0) {
    return [];
  }

  const places: QlooRawPlaceCandidate[] = [];

  for (const item of rawResults) {
    if (!item || typeof item !== 'object') continue;

    // STRICT INTEGRITY: Only accept real, non-empty IDs from Qloo.
    // Discard any candidate without a real ID. NEVER invent placeholder IDs!
    const rawId = (typeof item.entity_id === 'string' && item.entity_id.trim()) ||
                  (typeof item.id === 'string' && item.id.trim());
    if (!rawId) {
      continue;
    }

    // Only parse affinity score if provided by Qloo. NEVER invent fake random scores!
    const queryObj = item.query as Record<string, unknown> | undefined;
    const props = item.properties as Record<string, unknown> | undefined;
    const geocode = props?.geocode as Record<string, unknown> | undefined;
    const loc = item.location as Record<string, unknown> | undefined;

    const rawScore =
      (typeof queryObj?.affinity === 'number' ? queryObj.affinity : undefined) ??
      (typeof item.affinity === 'number' ? item.affinity : undefined) ??
      (typeof item.score === 'number' ? item.score : undefined);

    let affinityScore: number | null = null;
    if (typeof rawScore === 'number' && !isNaN(rawScore)) {
      affinityScore = Math.round(rawScore <= 1.0 ? rawScore * 100 : Math.min(100, Math.max(0, rawScore)));
    }

    const lat =
      typeof loc?.lat === 'number'
        ? loc.lat
        : typeof geocode?.latitude === 'number'
        ? geocode.latitude
        : undefined;

    const lng =
      typeof loc?.lng === 'number'
        ? loc.lng
        : typeof geocode?.longitude === 'number'
        ? geocode.longitude
        : undefined;

    const address =
      (typeof loc?.address === 'string' ? loc.address : undefined) ||
      (typeof props?.address === 'string' ? props.address : undefined) ||
      (typeof item.disambiguation === 'string' ? item.disambiguation : undefined);

    const neighborhood =
      (typeof loc?.neighborhood === 'string' ? loc.neighborhood : undefined) ||
      (typeof geocode?.name === 'string' ? geocode.name : undefined) ||
      (typeof geocode?.city === 'string' ? geocode.city : undefined) ||
      cityName;

    const attributes: string[] = [];
    if (Array.isArray(item.tags)) {
      for (const t of item.tags) {
        if (t && typeof (t as { name?: string }).name === 'string') {
          attributes.push((t as { name: string }).name);
        }
      }
    } else if (Array.isArray(item.attributes)) {
      attributes.push(...(item.attributes as string[]).filter(Boolean));
    }

    const priceCandidate =
      item.price_tier ||
      item.price ||
      props?.price_tier ||
      props?.price_level;

    let estimatedSpendTier: '$' | '$$' | '$$$' | 'Unknown' = 'Unknown';
    if (priceCandidate === '$' || priceCandidate === 1 || priceCandidate === '1') estimatedSpendTier = '$';
    else if (priceCandidate === '$$' || priceCandidate === 2 || priceCandidate === '2') estimatedSpendTier = '$$';
    else if (priceCandidate === '$$$' || priceCandidate === 3 || priceCandidate === '3') estimatedSpendTier = '$$$';

    const category =
      (typeof item.subtype === 'string' ? item.subtype : undefined) ||
      (typeof item.category === 'string' ? item.category : undefined) ||
      (typeof item.type === 'string' ? item.type : undefined) ||
      'Cultural Venue';

    const name =
      (typeof item.name === 'string' && item.name.trim()) ||
      (typeof item.title === 'string' && item.title.trim()) ||
      'Cultural Place';

    places.push({
      id: rawId,
      name,
      category,
      affinityScore, // Truthful: number if returned, null if unprovided
      location: {
        lat,
        lng,
        address,
        neighborhood,
      },
      attributes,
      estimatedSpendTier,
      typicalDwellMinutes: 60,
      isSampleData: false,
      qlooSignalEvidence: {
        connectedAnchor: 'Qloo Cultural Graph',
        sharedAffinities: attributes.length > 0 ? attributes.slice(0, 4) : ['Cultural Category Affinity'],
        affinityPercentile: affinityScore,
      },
    });

    if (places.length >= 10) break;
  }

  return places;
}

/**
 * Sample entity matcher strictly for explicit offline reference demo mode
 */
function getSampleEntityMatches(query: string, entityType?: string): DisambiguationCandidate[] {
  const q = query.toLowerCase();
  const known = [
    { id: 'ent-miles-davis', name: 'Miles Davis', type: 'urn:entity:artist', description: 'American jazz trumpeter, bandleader, and composer' },
    { id: 'ent-murakami', name: 'Haruki Murakami', type: 'urn:entity:book', description: 'Japanese writer of magical realism and contemporary fiction' },
    { id: 'ent-wes-anderson', name: 'Wes Anderson', type: 'urn:entity:movie', description: 'American filmmaker known for symmetry and eccentric visual style' },
    { id: 'ent-studio-ghibli', name: 'Studio Ghibli', type: 'urn:entity:movie', description: 'Acclaimed Japanese animation film studio founded by Hayao Miyazaki' },
    { id: 'ent-patti-smith', name: 'Patti Smith', type: 'urn:entity:artist', description: 'American singer, songwriter, poet, painter, and author' },
    { id: 'ent-blade-runner', name: 'Blade Runner', type: 'urn:entity:movie', description: 'Classic neo-noir cyberpunk science fiction film' },
    { id: 'ent-oaxaca', name: 'Oaxacan cuisine', type: 'urn:entity:brand', description: 'Traditional regional Mexican gastronomy noted for complex moles and artisanal agave' },
    { id: 'ent-david-lynch', name: 'David Lynch', type: 'urn:entity:movie', description: 'American filmmaker, visual artist, and musician' },
    { id: 'ent-bauhaus', name: 'Bauhaus Movement', type: 'urn:entity:brand', description: 'German art and design school bridging craft and fine arts' },
  ];

  const matched = known.filter(k => 
    k.name.toLowerCase().includes(q) || 
    q.includes(k.name.toLowerCase().split(' ')[0])
  );

  if (matched.length > 0) {
    return matched;
  }

  return [
    {
      id: `sample-custom-${encodeURIComponent(query)}`,
      name: query,
      type: entityType || 'urn:entity:artist',
      description: `Reference sample anchor: ${query}`,
      score: null,
    },
  ];
}

// Probe cache with 5-minute TTL to strictly protect Qloo API rate limits and quotas
const PROBE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedProbeResult: {
  configured: boolean;
  connected: boolean;
  latencyMs?: number;
  error?: string;
  timestamp: number;
} | null = null;
// In-flight singleflight promise to deduplicate concurrent cache-miss probe requests
let inFlightProbePromise: Promise<{
  configured: boolean;
  connected: boolean;
  latencyMs?: number;
  error?: string;
  cached?: boolean;
}> | null = null;

/**
 * Actively probes live Qloo API connectivity with a lightweight ping to /search
 * Used by /api/qloo/status to provide real verification rather than static key checking.
 * - In-flight deduplication prevents concurrent cache-miss thundering herds.
 * - Cached for 5 minutes server-side to protect upstream Qloo API quotas from being exhausted.
 * - For multi-region serverless clusters, an external distributed cache (e.g. Redis) can be bound.
 */
export async function verifyLiveQlooConnectivity(forceFresh = false): Promise<{
  configured: boolean;
  connected: boolean;
  latencyMs?: number;
  error?: string;
  cached?: boolean;
}> {
  if (!isLiveQlooConfigured()) {
    return { configured: false, connected: false };
  }

  // 1. Return cached result if within 5-minute window
  if (!forceFresh && cachedProbeResult && (Date.now() - cachedProbeResult.timestamp < PROBE_CACHE_TTL_MS)) {
    return {
      configured: cachedProbeResult.configured,
      connected: cachedProbeResult.connected,
      latencyMs: cachedProbeResult.latencyMs,
      error: cachedProbeResult.error,
      cached: true,
    };
  }

  // 2. Return active in-flight probe to deduplicate simultaneous concurrent requests
  if (!forceFresh && inFlightProbePromise) {
    return inFlightProbePromise;
  }

  inFlightProbePromise = (async () => {
    const start = Date.now();
    try {
      const res = await searchQlooEntities('Miles Davis', 'urn:entity:artist', false);
      const latency = Date.now() - start;
      const result = {
        configured: true,
        connected: res.candidates.length > 0 && !res.isSampleData,
        latencyMs: latency,
        timestamp: Date.now(),
      };
      cachedProbeResult = result;
      return {
        configured: result.configured,
        connected: result.connected,
        latencyMs: result.latencyMs,
        cached: false,
      };
    } catch (err: unknown) {
      const result = {
        configured: true,
        connected: false,
        error: err instanceof Error ? err.message : String(err),
        latencyMs: Date.now() - start,
        timestamp: Date.now(),
      };
      cachedProbeResult = result;
      return {
        configured: result.configured,
        connected: result.connected,
        latencyMs: result.latencyMs,
        error: result.error,
        cached: false,
      };
    } finally {
      inFlightProbePromise = null;
    }
  })();

  return inFlightProbePromise;
}

export function clearProbeCacheForTesting(): void {
  cachedProbeResult = null;
  inFlightProbePromise = null;
  cache.clear();
}
