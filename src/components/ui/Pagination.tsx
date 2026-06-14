'use client';

import { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      onPageChange(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [totalPages, onPageChange]
  );

  // 生成頁碼陣列（顯示當前頁附近的頁碼 + 首尾）
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const delta = 2; // 當前頁前後顯示的頁數

    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);

    if (rangeStart > 2) pages.push('ellipsis');

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    if (rangeEnd < totalPages - 1) pages.push('ellipsis');

    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="分頁導航">
      {/* 上一頁 */}
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
          currentPage <= 1
            ? 'cursor-not-allowed text-gray-300'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
        aria-label="上一頁"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* 頁碼 */}
      {pageNumbers.map((page, index) =>
        page === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            className="flex h-10 w-10 items-center justify-center text-gray-400"
          >
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={cn(
              'h-10 min-w-[2.5rem] rounded-lg px-3 text-sm font-medium transition-colors',
              page === currentPage
                ? 'bg-red-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
            aria-label={`第 ${page} 頁`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        )
      )}

      {/* 下一頁 */}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
          currentPage >= totalPages
            ? 'cursor-not-allowed text-gray-300'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
        aria-label="下一頁"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </nav>
  );
}
