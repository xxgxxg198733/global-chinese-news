import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, toZonedTime } from 'date-fns-tz';
import { zhTW } from 'date-fns/locale';
import type { TimezoneMode } from './types';

// ============================================
// Tailwind CSS 類別合併工具（shadcn/ui 風格）
// ============================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// 時間格式化（支援台北/當地時間切換）
// ============================================

const TAIPEI_TIMEZONE = 'Asia/Taipei';

/**
 * 根據時區模式格式化日期
 * @param dateString - ISO 日期字串
 * @param mode - 'local' | 'taipei'
 * @param formatStr - date-fns 格式字串
 */
export function formatDateByTimezone(
  dateString: string,
  mode: TimezoneMode,
  formatStr: string = 'yyyy 年 MM 月 dd 日 HH:mm'
): string {
  const date = new Date(dateString);

  if (mode === 'taipei') {
    // 轉換為台北時間
    const taipeiDate = toZonedTime(date, TAIPEI_TIMEZONE);
    return format(taipeiDate, formatStr, { locale: zhTW, timeZone: TAIPEI_TIMEZONE });
  }

  // 使用瀏覽器當地時區
  return format(date, formatStr, { locale: zhTW });
}

/**
 * 獲取相對時間描述（如「3 小時前」、「2 天前」）
 */
export function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return '剛剛';
  if (diffMinutes < 60) return `${diffMinutes} 分鐘前`;
  if (diffHours < 24) return `${diffHours} 小時前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} 週前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} 個月前`;
  return `${Math.floor(diffDays / 365)} 年前`;
}

// ============================================
// HTML 處理
// ============================================

/**
 * 安全地去除 HTML 標籤，取得純文字摘要
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * 截取文字，保留完整中文字符
 */
export function truncateText(text: string, maxLength: number): string {
  const stripped = stripHtml(text);
  if (stripped.length <= maxLength) return stripped;
  // 在中文字符邊界截斷
  return stripped.slice(0, maxLength).replace(/\s+\S*$/, '') + '……';
}

// ============================================
// URL 處理
// ============================================

/**
 * 建立 WordPress 媒體完整 URL
 */
export function wpMediaUrl(path: string | null | undefined): string {
  if (!path) return '/images/placeholder.jpg';
  if (path.startsWith('http')) return path;
  const WP_URL = process.env.NEXT_PUBLIC_WP_URL || '';
  return `${WP_URL}${path}`;
}

/**
 * 驗證並清理外部 URL（防 XSS）
 */
export function sanitizeExternalUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================
// SEO 輔助
// ============================================

/**
 * 生成結構化資料（JSON-LD）— 新聞文章
 */
export function generateNewsArticleSchema(post: {
  title: string;
  excerpt: string;
  date: string;
  modified: string;
  url: string;
  imageUrl: string | null;
  authorName: string;
  siteName: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: stripHtml(post.title),
    description: stripHtml(post.excerpt),
    datePublished: post.date,
    dateModified: post.modified,
    author: {
      '@type': 'Person',
      name: post.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: post.siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
      },
    },
    image: post.imageUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/og-image.jpg`,
    url: post.url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': post.url,
    },
  };
}

/**
 * 從 Yoast SEO schema 中提取有用資訊
 */
export function extractSeoMeta(seo: unknown) {
  if (!seo) return null;
  const s = seo as Record<string, unknown>;
  return {
    title: (s.title as string) || '',
    description: (s.metaDesc as string) || '',
    canonical: (s.canonical as string) || '',
    ogTitle: (s.opengraphTitle as string) || '',
    ogDescription: (s.opengraphDescription as string) || '',
    ogImage: (s.opengraphImage as { sourceUrl: string } | null)?.sourceUrl || null,
    twitterTitle: (s.twitterTitle as string) || '',
    twitterDescription: (s.twitterDescription as string) || '',
    twitterImage: (s.twitterImage as { sourceUrl: string } | null)?.sourceUrl || null,
    readingTime: (s.readingTime as number) || 0,
    schema: (s.schema as { raw: string } | null)?.raw || null,
    breadcrumbs: (s.breadcrumbs as { text: string; url: string }[]) || [],
  };
}
