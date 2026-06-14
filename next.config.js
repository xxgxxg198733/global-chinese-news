/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 允許 WordPress 上傳目錄及外部圖片域名
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.WORDPRESS_HOSTNAME || 'cms.mynews.com',
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
    // 使用 @nextwp/core 的圖片優化時需要的格式
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
