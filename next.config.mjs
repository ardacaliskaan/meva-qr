/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/meva',
  assetPrefix: '/meva',
  
  // Image optimization için
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ardacaliskan.com',
      },
    ],
  },

  // Trailing slash
  trailingSlash: false,

  // 🔥 Body size limiti (upload için)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
}

export default nextConfig