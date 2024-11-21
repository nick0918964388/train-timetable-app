/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://taiwanhelper.com/:path*',
      },
    ]
  },
}

module.exports = nextConfig 