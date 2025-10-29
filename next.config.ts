import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Garantir que está em produção
  env: {
    NODE_ENV: process.env.NODE_ENV || 'production',
  },

  // Configurações de produção
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Otimizações
  swcMinify: true,
  compress: true,

  // Redirecionamentos (se necessário)
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
    ];
  },

  // Headers de segurança
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
        ],
      },
    ];
  },
};

export default nextConfig;