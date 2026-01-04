/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: [
      'getnote.oss-cn-hangzhou.aliyuncs.com',
      'localhost',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.myqcloud.com',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@tiptap/react'],
  },
};

module.exports = nextConfig;
