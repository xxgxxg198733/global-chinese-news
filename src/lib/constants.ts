import { NavItem } from './types';

// ============================================
// 環境變數
// ============================================

export const WP_URL = process.env.NEXT_PUBLIC_WP_URL || 'https://cms.mynews.com';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mynews.com';
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || '全球華人新聞網';
export const SITE_LOCALE = 'zh-Hant';
export const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET_KEY || '';

/** WordPress GraphQL 端點 */
export const WP_GRAPHQL_URL = `${WP_URL}/graphql`;

/** 預設 ISR 重新驗證時間（秒） */
export const DEFAULT_REVALIDATE = 60;
export const POST_REVALIDATE = 3600; // 文章頁面緩存 1 小時
export const INDEX_REVALIDATE = 300; // 首頁緩存 5 分鐘

/** 每頁文章數 */
export const POSTS_PER_PAGE = 20;

// ============================================
// 導航欄項目
// ============================================

export const NAV_ITEMS: NavItem[] = [
  { label: '首頁', href: '/' },
  { label: '世界盃', href: '/category/world-cup', slug: 'world-cup', highlight: true },
  { label: '即時新聞', href: '/category/breaking-news', slug: 'breaking-news' },
  { label: '國際', href: '/category/world', slug: 'world' },
  { label: '兩岸', href: '/category/cross-strait', slug: 'cross-strait' },
  { label: '華人生活', href: '/category/lifestyle', slug: 'lifestyle' },
  { label: '移民/留學', href: '/category/immigration-study', slug: 'immigration-study' },
];

// ============================================
// 頁尾資訊
// ============================================

export const FOOTER_LINKS = [
  { label: '關於我們', href: '/about' },
  { label: '聯繫我們', href: '/contact' },
  { label: '侵權刪除', href: '/takedown' },
  { label: '隱私政策', href: '/privacy' },
  { label: '服務條款', href: '/terms' },
];

// ============================================
// SEO 預設值
// ============================================

export const DEFAULT_SEO = {
  title: SITE_NAME,
  description: '全球華人新聞網 — 即時、客觀、全面的華人新聞報導。涵蓋國際要聞、兩岸關係、華人社區生活、移民留學資訊。',
  openGraph: {
    type: 'website' as const,
    locale: 'zh_Hant',
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    handle: '@globalchinesenews',
    site: '@globalchinesenews',
    cardType: 'summary_large_image' as const,
  },
};
