import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

/**
 * 動態生成 robots.txt
 *
 * Next.js App Router 約定：匯出 robots() 函數即可自動生成 /robots.txt
 *
 * 策略：
 *   - 允許 Google、Bing 等主流搜尋引擎完整抓取
 *   - 對所有爬蟲設定 10 秒抓取延遲，降低對 WordPress 後端壓力
 *   - 封鎖不必要的路徑（API、管理頁面）
 *   - 指向 sitemap.xml
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/',
          '/search?',          // 搜尋結果頁面不索引
        ],
        crawlDelay: 10,
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',         // 不讓 OpenAI 爬蟲消耗頻寬
      },
      {
        userAgent: 'CCBot',
        disallow: '/',         // Common Crawl 也用於 AI 訓練
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
