import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: '*.microlink.io' }, { protocol: 'https', hostname: '*.vercel.app' }] },
}
export default nextConfig
