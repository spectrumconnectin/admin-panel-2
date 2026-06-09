/**
 * Catch-all API proxy route.
 *
 * All requests to /api/* are forwarded to the Spectrum Connect backend.
 * Using a Next.js Route Handler instead of next.config rewrites because
 * rewrites to external HTTPS URLs are unreliable in standalone/containerised
 * deployments — the route handler runs at runtime and uses native fetch.
 *
 * Priority: SPECTRUM_API_URL env var → hardcoded tunnel fallback
 */
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.SPECTRUM_API_URL ||
  'https://standard-saved-streams-henry.trycloudflare.com';

async function proxy(
  req: NextRequest,
  { params }: { params: { path: string[] } },
): Promise<NextResponse> {
  const path = params.path.join('/');

  // Build target URL and forward query params
  const target = new URL(`/${path}`, BACKEND_URL);
  req.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  // Forward request headers — drop hop-by-hop headers
  const SKIP = new Set(['host', 'connection', 'transfer-encoding', 'keep-alive']);
  const fwdHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (!SKIP.has(key.toLowerCase())) fwdHeaders[key] = value;
  });

  // Forward body for non-idempotent methods
  const body =
    req.method !== 'GET' && req.method !== 'HEAD'
      ? await req.arrayBuffer()
      : undefined;

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(target.toString(), {
      method: req.method,
      headers: fwdHeaders,
      body,
    });
  } catch (err) {
    console.error('[proxy] fetch error →', target.toString(), err);
    return NextResponse.json(
      { detail: 'Backend unreachable' },
      { status: 502 },
    );
  }

  // Forward response headers (drop hop-by-hop)
  const resHeaders = new Headers();
  upstreamRes.headers.forEach((value, key) => {
    if (!SKIP.has(key.toLowerCase())) resHeaders.set(key, value);
  });

  return new NextResponse(upstreamRes.body, {
    status: upstreamRes.status,
    headers: resHeaders,
  });
}

export const GET     = proxy;
export const POST    = proxy;
export const PUT     = proxy;
export const PATCH   = proxy;
export const DELETE  = proxy;
export const OPTIONS = proxy;
