import type { NextConfig } from 'next';

/**
 * Cross-origin isolation for project pages, where GitHub projects boot in a
 * StackBlitz WebContainer (it needs SharedArrayBuffer, which needs isolation).
 *
 * COEP is "credentialless", not "require-corp": require-corp blocks every
 * cross-origin image or video that doesn't send a Cross-Origin-Resource-Policy
 * header, which includes Supabase Storage (our covers, posters, and videos).
 * credentialless keeps isolation but loads those without cookies instead.
 *
 * Only project pages and the hosted-app files they frame get these headers;
 * an isolated page's iframes must opt in too, and the rest of the site
 * doesn't need isolation at all.
 */
const isolationHeaders = [
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: '/projects/:id', headers: isolationHeaders },
      { source: '/hosted/:path*', headers: isolationHeaders },
    ];
  },
};

export default nextConfig;
