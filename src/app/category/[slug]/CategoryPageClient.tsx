'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PostCard } from '@/components/post/PostCard';
import { Pagination } from '@/components/ui/Pagination';
import { useTimezone } from '@/hooks/useTimezone';
import type { PostSummary, Category } from '@/lib/types';
import { stripHtml } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface CategoryPageClientProps {
  category: Category;
  posts: PostSummary[];
  currentPage: number;
  totalPages: number;
  totalPosts: number;
}

export function CategoryPageClient({
  category,
  posts,
  currentPage,
  totalPages,
  totalPosts,
}: CategoryPageClientProps) {
  const { timezone } = useTimezone();
  const router = useRouter();

  const handlePageChange = (page: number) => {
    router.push(`/category/${category.slug}?page=${page}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* 麵包屑 */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/" className="hover:text-red-600">
          首頁
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-gray-900">{category.name}</span>
      </nav>

      {/* 分類標題 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-gray-500">{stripHtml(category.description)}</p>
        )}
        <p className="mt-1 text-sm text-gray-400">
          共 {totalPosts.toLocaleString()} 篇文章
        </p>
      </div>

      {/* 文章列表 */}
      {posts.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                timezone={timezone}
                variant="default"
                priority={index < 3}
              />
            ))}
          </div>

          {/* 分頁 */}
          {totalPages > 1 && (
            <div className="mt-10">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <svg
            className="mb-4 h-16 w-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
          <p className="text-sm">此分類暫無文章</p>
          <Link
            href="/"
            className="mt-4 text-sm font-medium text-red-600 hover:text-red-700"
          >
            返回首頁
          </Link>
        </div>
      )}
    </div>
  );
}
