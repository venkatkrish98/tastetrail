import { NextRequest, NextResponse } from 'next/server';
import { searchQlooEntities } from '@/lib/qloo-client';
import { checkRateLimit, extractClientIp } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const clientIp = await extractClientIp(request.headers);
  const rateLimit = checkRateLimit(clientIp);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a moment.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.resetSeconds) },
      }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const entityType = searchParams.get('types') || undefined;
    const forceSample = searchParams.get('sample') === 'true';

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ candidates: [], isSampleData: false });
    }

    const sanitizedQuery = query.slice(0, 100).trim();
    const result = await searchQlooEntities(sanitizedQuery, entityType, forceSample);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error in /api/qloo/search:', error);
    const msg = error instanceof Error ? error.message : 'Entity search failed.';

    if (msg.includes('401') || msg.includes('403')) {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    if (msg.includes('429')) {
      return NextResponse.json({ error: msg }, { status: 429 });
    }

    return NextResponse.json(
      { error: msg },
      { status: 502 }
    );
  }
}
