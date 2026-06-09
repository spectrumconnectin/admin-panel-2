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

  // Build target URL — strip trailing slash from base then append path.
  // NOTE: do NOT use `new URL('/path', base)` when base has a sub-path like
  // '/backend', because the URL constructor treats a leading '/' as absolute
  // and silently drops the base path.  String concatenation is correct here.
  const base = BACKEND_URL.replace(/\/+$/, '');
  const target = new URL(`${base}/${path}`);
  req.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  // Forward request headers — drop hop-by-hop headers AND compression
  // negotiation headers.  Node's fetch() auto-decompresses responses, so if
  // we forward Accept-Encoding the upstream returns a compressed body that
  // Node already decoded — but the Content-Encoding header we'd then forward
  // would tell the browser to decompress again, producing an empty result.
  const SKIP = new Set([
    'host', 'connection', 'transfer-encoding', 'keep-alive',
    'accept-encoding',   // don't ask upstream to compress
  ]);
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

  // Forward response headers — drop hop-by-hop AND content-encoding.
  // Node's fetch already decompressed the body; forwarding Content-Encoding
  // would tell the browser to decompress a second time → empty response.
  const RES_SKIP = new Set([
    'host', 'connection', 'transfer-encoding', 'keep-alive',
    'content-encoding',  // body is already decoded by Node fetch
    'content-length',    // length changed after decompression
  ]);
  const resHeaders = new Headers();
  upstreamRes.headers.forEach((value, key) => {
    if (!RES_SKIP.has(key.toLowerCase())) resHeaders.set(key, value);
  });

  resHeaders.set('x-proxy-version', 'v3-api-route');

  // Read the full body as an ArrayBuffer before handing to NextResponse.
  // Streaming upstreamRes.body directly can produce an empty response when
  // Railway/Vercel's edge has already partially consumed the stream or when
  // Node's fetch decompressed a gzip body and the stream state is stale.
  const responseBody = await upstreamRes.arrayBuffer();

  return new NextResponse(responseBody, {
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
