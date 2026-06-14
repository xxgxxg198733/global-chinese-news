import type { MetadataRoute } from 'next';
import { getAllPostSlugs, getAllCategorySlugs } from '@/lib/wordpress';
import { SITE_URL } from '@/lib/constants';

/**
 * 動態生成 sitemap.xml
 *
 * Next.js App Router 約定：匯出 sitemap() 函數即可自動生成 /sitemap.xml
 *
 * 包含：
 *  - 首頁
 *  - 所有文章頁面
 *  - 所有分類頁面
 *  - 靜態頁面（搜尋、侵權刪除）
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemapEntries: MetadataRoute.Sitemap = [];

  // ============================================
  // 靜態頁面
  // ============================================

  sitemapEntries.push(
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/takedown`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.2,
    }
  );

  // ============================================
  // 文章頁面（從 WordPress 獲取）
  // ============================================

  try {
    const postSlugs = await getAllPostSlugs(500);

    for (const { slug, modified } of postSlugs) {
      sitemapEntries.push({
        url: `${SITE_URL}/posts/${slug}`,
        lastModified: new Date(modified),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      });
    }
  } catch (error) {
    console.error('生成文章 sitemap 失敗：', error);
  }

  // ============================================
  // 分類頁面
  // ============================================

  try {
    const categorySlugs = await getAllCategorySlugs();

    for (const { slug, count } of categorySlugs) {
      // 文章數量多的分類優先級更高
      const priority = count > 100 ? 0.7 : count > 10 ? 0.5 : 0.3;

      sitemapEntries.push({
        url: `${SITE_URL}/category/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority,
      });
    }
  } catch (error) {
    console.error('生成分類 sitemap 失敗：', error);
  }

  return sitemapEntries;
}
