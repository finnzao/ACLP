import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  // Configurações de produção
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Otimizações
  swcMinify: true,
  compress: true,

  // Variáveis públicas (apenas NEXT_PUBLIC_*)
  env: {
    NEXT_PUBLIC_APP_NAME: 'Sistema de Controle de Comparecimento',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

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
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
    ];
  },
};

export default nextConfig;