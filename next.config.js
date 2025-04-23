/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['upload.wikimedia.org', 'images.pexels.com'],
  },
}

module.exports = nextConfig 