/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com', 'localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  trailingSlash: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  async redirects() {
    return [
      // Redirect old language routes to new ones
      {
        source: '/hebrew/:path*',
        destination: '/he/:path*',
        permanent: true,
      },
      {
        source: '/arabic/:path*',
        destination: '/ar/:path*',
        permanent: true,
      },
      {
        source: '/russian/:path*',
        destination: '/ru/:path*',
        permanent: true,
      },
      {
        source: '/german/:path*',
        destination: '/de/:path*',
        permanent: true,
      },
      {
        source: '/french/:path*',
        destination: '/fr/:path*',
        permanent: true,
      },
      {
        source: '/spanish/:path*',
        destination: '/es/:path*',
        permanent: true,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

module.exports = nextConfig;
