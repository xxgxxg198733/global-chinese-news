/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.WORDPRESS_HOSTNAME || 'cms.mynews.com',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'http',
        hostname: process.env.WORDPRESS_HOSTNAME || '43.172.68.14',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.wp.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: '*.gravatar.com',
        port: '',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // 多語言 SEO：繁體中文
  i18n: undefined, // App Router 不使用 i18n 配置

  // 編譯時排除 WordPress 管理路徑
  experimental: {
    // 可選：啟用 typedRoutes 以獲得型別安全的路由
    // typedRoutes: true,
  },

  // 轉發 WordPress 上傳目錄的請求（可選，用於開發環境）
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
