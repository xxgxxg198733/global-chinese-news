import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';
import { SearchPageClient } from './SearchPageClient';

export const metadata: Metadata = {
  title: `搜尋新聞 | ${SITE_NAME}`,
  description: '搜尋全球華人新聞網的所有新聞文章',
};

// 搜尋頁面不緩存（每次請求即時結果）
export const dynamic = 'force-dynamic';

export default function SearchPage() {
  return <SearchPageClient />;
}
