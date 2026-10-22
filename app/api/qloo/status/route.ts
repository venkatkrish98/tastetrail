import { NextRequest, NextResponse } from 'next/server';
import { verifyLiveQlooConnectivity } from '@/lib/qloo-client';
import { checkRateLimit, extractClientIp } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Rate limiting to prevent abuse or denial-of-service on the status probe
  const clientIp = await extractClientIp(req.headers);
  const rateCheck = checkRateLimit(clientIp);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: 'Too many status check requests. Please slow down.',
        resetSeconds: rateCheck.resetSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateCheck.resetSeconds),
        },
      }
    );
  }

  const check = await verifyLiveQlooConnectivity();

  if (check.configured) {
    return NextResponse.json({
      configured: true,
      liveVerified: check.connected,
      latencyMs: check.latencyMs,
      statusText: check.connected ? 'Live Connected & Verified' : 'Key Set (Connection Error)',
      cached: check.cached ?? false,
      mode: 'live_qloo',
      baseUrl: 'https://hackathon.api.qloo.com',
      endpoints: {
        search: '/search',
        insights: '/v2/insights',
      },
      error: check.error,
      message: check.connected
        ? `Live Qloo API connection verified against https://hackathon.api.qloo.com (${check.latencyMs}ms roundtrip).`
        : `Key configured but live probe failed: ${check.error}. Check network access or event key validity.`,
    });
  }

  return NextResponse.json({
    configured: false,
    liveVerified: false,
    statusText: 'Sample mode (No Key)',
    mode: 'sample_fixture',
    baseUrl: 'https://hackathon.api.qloo.com',
    endpoints: {
      search: '/search',
      insights: '/v2/insights',
    },
    message:
      'Operating in Transparent Sample Data Demo Mode (No QLOO_API_KEY set). Add your key to .env.local to activate live calls to https://hackathon.api.qloo.com.',
  });
}
