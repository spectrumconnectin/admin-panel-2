/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Standalone output — required for Railway / containerised deployments.
   * Creates .next/standalone/server.js which is a self-contained Node server
   * that reads PORT and HOSTNAME from the environment automatically.
   *
   * API proxying is handled by src/app/api/[...path]/route.ts at RUNTIME
   * (reads SPECTRUM_API_URL from env, falls back to the cloudflare tunnel).
   */
  output: 'standalone',
};

module.exports = nextConfig;
