import { Suspense } from 'react';
import { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';
import { SearchClient } from './SearchClient';

export const metadata: Metadata = { title: `搜索软件 | ${SITE_NAME}` };

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-8 text-center text-gray-400">加载中...</div>}>
      <SearchClient />
    </Suspense>
  );
}
