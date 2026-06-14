import Link from 'next/link';
import type { Metadata } from 'next';
import { Home } from 'lucide-react';

export const metadata: Metadata = {
  title: '頁面不存在',
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
      {/* 404 圖示 */}
      <h1 className="text-9xl font-black text-gray-100">404</h1>

      <div className="-mt-8 space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">頁面不存在</h2>
        <p className="text-gray-500">
          您要尋找的頁面可能已被移除、更名或暫時不可用。
        </p>
      </div>

      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          <Home className="h-4 w-4" />
          返回首頁
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          搜尋新聞
        </Link>
      </div>
    </div>
  );
}
