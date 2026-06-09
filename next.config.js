/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Proxy all /api/* requests to the Spectrum Connect backend.
   * This eliminates CORS configuration on the main backend — the browser
   * only ever talks to this Next.js server, which then forwards to FastAPI.
   *
   * Set SPECTRUM_API_URL in .env.local (dev) or Railway env vars (prod).
   */
  async rewrites() {
    const apiUrl = process.env.SPECTRUM_API_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
