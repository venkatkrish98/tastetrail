import { NextRequest, NextResponse } from 'next/server';
import { runTasteTrailAgent } from '@/lib/agent-workflow';
import { OutingRequest } from '@/lib/types';
import { checkRateLimit, extractClientIp } from '@/lib/rate-limiter';
import { readBoundedJsonPayload, MAX_PAYLOAD_BYTES } from '@/lib/payload-validator';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // 1. Rate Limiting Check
  const clientIp = await extractClientIp(request.headers);
  const rateLimit = checkRateLimit(clientIp);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a few moments before submitting another request.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetSeconds),
        },
      }
    );
  }

  // 2. Stream-Bounded Body Size Enforcement (Early Abort on stream chunks > 32 KB)
  const { data: body, error: payloadError, status: payloadStatus } =
    await readBoundedJsonPayload<OutingRequest>(request, MAX_PAYLOAD_BYTES);

  if (payloadError || !body) {
    return NextResponse.json(
      { error: payloadError || 'Invalid request body.' },
      { status: payloadStatus || 400 }
    );
  }

  // 3. Strict Input Validation
  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { error: 'Invalid request body format.' },
      { status: 400 }
    );
  }

  const cityName = String(body.cityName || '').slice(0, 50).trim();
  if (!cityName) {
    return NextResponse.json(
      { error: 'A valid city name is required.' },
      { status: 400 }
    );
  }

  const lat = Number(body.cityCoordinates?.lat);
  const lng = Number(body.cityCoordinates?.lng);

  if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
    return NextResponse.json(
      { error: 'Invalid geographic coordinates: lat must be between -90 and 90, lng between -180 and 180.' },
      { status: 400 }
    );
  }

  const durationHours = Number(body.durationHours);
  if (isNaN(durationHours) || durationHours < 1.5 || durationHours > 6.0) {
    return NextResponse.json(
      { error: 'Duration must be between 1.5 and 6.0 hours.' },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.anchors) || body.anchors.length === 0) {
    return NextResponse.json(
      { error: 'Please specify at least 1 cultural anchor (and ideally 2–3).' },
      { status: 400 }
    );
  }

  if (body.anchors.length > 5) {
    return NextResponse.json(
      { error: 'A maximum of 5 cultural anchors can be submitted per outing.' },
      { status: 400 }
    );
  }

  const boundedAnchors = body.anchors
    .map(a => ({
      ...a,
      name: String(a?.name || '').slice(0, 80).trim(),
    }))
    .filter(a => a.name.length > 0);

  if (boundedAnchors.length === 0) {
    return NextResponse.json(
      { error: 'Cultural anchors must contain non-empty text strings.' },
      { status: 400 }
    );
  }

  const boundedRequest: OutingRequest = {
    cityName,
    cityCoordinates: { lat, lng },
    durationHours,
    budgetTier: ['free_or_low', 'moderate', 'treat'].includes(body.budgetTier)
      ? body.budgetTier
      : 'moderate',
    mobility: {
      stepFreeAccess: Boolean(body.mobility?.stepFreeAccess),
      lowWalkingTransit: Boolean(body.mobility?.lowWalkingTransit),
      seatedRestIntervals: Boolean(body.mobility?.seatedRestIntervals),
      sensoryFriendly: Boolean(body.mobility?.sensoryFriendly),
    },
    anchors: boundedAnchors,
    compareWithoutAnchors: Boolean(body.compareWithoutAnchors),
    forceSampleMode: Boolean(body.forceSampleMode),
  };

  try {
    const plan = await runTasteTrailAgent(boundedRequest);
    return NextResponse.json(plan);
  } catch (error: unknown) {
    console.error('Error in /api/itinerary/plan:', error);
    const msg = error instanceof Error ? error.message : 'Failed to generate outing itinerary.';

    // Check if error is upstream auth failure
    if (msg.includes('401') || msg.includes('403') || msg.includes('authentication failed')) {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    // Check if rate limited upstream
    if (msg.includes('429') || msg.includes('rate limit')) {
      return NextResponse.json({ error: msg }, { status: 429 });
    }
    // Check if upstream timeout or network failure
    if (msg.includes('timed out') || msg.includes('Network error')) {
      return NextResponse.json({ error: msg }, { status: 504 });
    }

    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
