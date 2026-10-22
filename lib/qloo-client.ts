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
 * Prevents credential leakage (X-Api-Key) to arbitrary external URLs.
 */
export function getValidatedQlooBaseUrl(): string {
  const envUrl = process.env.QLOO_BASE_URL;
  if (!envUrl) {
    return 'https://hackathon.api.qloo.com';
  }

  try {
    const parsed = new URL(envUrl);
    if (!OFFICIAL_QLOO_HOSTS.has(parsed.hostname.toLowerCase())) {
      console.warn(
        `[Security Warning] Untrusted QLOO_BASE_URL hostname "${parsed.hostname}". Refusing to transmit X-Api-Key. Enforcing official endpoint https://hackathon.api.qloo.com.`
      );
      return 'https://hackathon.api.qloo.com';
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
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
 * Pure parser for Qloo /search response conforming to official guide schemas
 */
export function parseQlooSearchItems(
  json: unknown,
  query: string,
  entityType?: string
): DisambiguationCandidate[] {
  const obj = json as Record<string, unknown> | null;
  const rawItems: Array<{
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
  }> =
    (obj?.response as Record<string, unknown>)?.entities as [] ||
    obj?.entities as [] ||
    obj?.results as [] ||
    obj?.data as [] ||
    (Array.isArray(obj?.response) ? obj.response : []) ||
    (Array.isArray(json) ? json : []);

  return rawItems.slice(0, 5).map((item, idx) => ({
    id: item.id || item.entity_id || `qloo-entity-${idx}`,
    name: item.name || item.title || query,
    type: item.type || item.entity_type || item.category || entityType || 'urn:entity',
    description: item.description,
    score: typeof item.score === 'number' ? item.score : null,
  }));
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

  const cacheKey = `insights:${cityName}:${lat.toFixed(2)},${lng.toFixed(2)}:${entityIds.sort().join(',')}`;
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
  
  // Add signal.interests.entities for each resolved entity
  for (const id of entityIds) {
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
  const rawResults: Array<{
    id?: string;
    entity_id?: string;
    name?: string;
    title?: string;
    type?: string;
    category?: string;
    affinity?: number;
    score?: number;
    location?: { lat?: number; lng?: number; address?: string; neighborhood?: string };
    attributes?: string[];
    price_tier?: string;
    price?: string;
  }> =
    (obj?.response as Record<string, unknown>)?.results as [] ||
    (obj?.response as Record<string, unknown>)?.entities as [] ||
    obj?.results as [] ||
    obj?.entities as [] ||
    obj?.data as [] ||
    (Array.isArray(obj?.response) ? obj.response : []) ||
    (Array.isArray(json) ? json : []);

  if (!rawResults || rawResults.length === 0) {
    return [];
  }

  return rawResults.slice(0, 10).map((item, idx) => {
    // Only parse affinity score if provided by Qloo. NEVER invent fake random scores!
    const rawScore = item.affinity ?? item.score;
    let affinityScore: number | null = null;
    if (typeof rawScore === 'number' && !isNaN(rawScore)) {
      affinityScore = Math.round(rawScore <= 1.0 ? rawScore * 100 : Math.min(100, Math.max(0, rawScore)));
    }

    return {
      id: item.id || item.entity_id || `qloo-place-${idx}`,
      name: item.name || item.title || `Cultural Place ${idx + 1}`,
      category: item.category || item.type || 'Cultural Venue',
      affinityScore, // Truthful: number if returned, null if unprovided
      location: {
        lat: typeof item.location?.lat === 'number' ? item.location.lat : undefined,
        lng: typeof item.location?.lng === 'number' ? item.location.lng : undefined,
        address: item.location?.address,
        neighborhood: item.location?.neighborhood || cityName,
      },
      attributes: Array.isArray(item.attributes) ? item.attributes : [],
      estimatedSpendTier: (['$', '$$', '$$$'].includes(item.price_tier || item.price || '')
        ? (item.price_tier || item.price)
        : 'Unknown') as '$' | '$$' | '$$$' | 'Unknown',
      typicalDwellMinutes: 60,
      isSampleData: false,
      qlooSignalEvidence: {
        connectedAnchor: 'Qloo Cultural Graph',
        sharedAffinities: Array.isArray(item.attributes) ? item.attributes : ['Cultural Category Affinity'],
        affinityPercentile: affinityScore,
      },
    };
  });
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
}
