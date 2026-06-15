'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PostCard } from '@/components/post/PostCard';
import { useTimezone } from '@/hooks/useTimezone';
import type { PostSummary, Category } from '@/lib/types';
import { stripHtml } from '@/lib/utils';

interface CategoryPageClientProps {
  category: Category;
  posts: PostSummary[];
  hasNextPage: boolean;
}

export function CategoryPageClient({
  category,
  posts,
  hasNextPage,
}: CategoryPageClientProps) {
  const { timezone } = useTimezone();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/" className="hover:text-red-600">首頁</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-gray-900">{category.name}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-gray-500">{stripHtml(category.description)}</p>
        )}
        <p className="mt-1 text-sm text-gray-400">共 {category.count} 篇文章</p>
      </div>

      {posts.length > 0 ? (
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
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-sm">此分類暫無文章</p>
          <Link href="/" className="mt-4 text-sm font-medium text-red-600 hover:text-red-700">返回首頁</Link>
        </div>
      )}

      {hasNextPage && (
        <div className="mt-8 text-center">
          <Link
            href={`/category/${category.slug}?page=2`}
            className="rounded-full bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            載入更多
          </Link>
        </div>
      )}
    </div>
  );
}
