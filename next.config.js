/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/api/tdx/:path*',
        destination: 'https://tdx.transportdata.tw/api/basic/v3/:path*'
      },
      {
        source: '/api/taiwanhelper/:path*', 
        destination: 'https://taiwanhelper.com/:path*'
      }
    ]
  },
}

module.exports = nextConfig 