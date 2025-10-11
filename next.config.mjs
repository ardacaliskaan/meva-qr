/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/meva',
  assetPrefix: '/meva',
  
  // Image optimization için
  images: {
    unoptimized: true,  // ← false'dan true'ya değiştir!
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ardacaliskan.com',
      },
    ],
  },

  // Trailing slash
  trailingSlash: false,
}

export default nextConfig