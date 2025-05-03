/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['upload.wikimedia.org', 'images.pexels.com'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.ignoreWarnings = [
        { module: /node_modules\/punycode/ },
      ];
    }
    return config;
  },
}

module.exports = nextConfig 