'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, User, Tag, ChevronRight, Share2, Clock3 } from 'lucide-react';
import type { PostDetail, PostSummary } from '@/lib/types';
import { formatDateByTimezone, getRelativeTime, stripHtml } from '@/lib/utils';
import { useTimezone } from '@/hooks/useTimezone';
import { OriginalSource } from '@/components/post/OriginalSource';
import { RelatedPosts } from '@/components/post/RelatedPosts';
import { ViewTracker } from '@/components/post/ViewTracker';

interface PostDetailClientProps {
  post: PostDetail;
  relatedPosts: PostSummary[];
}

export function PostDetailClient({ post, relatedPosts }: PostDetailClientProps) {
  const { timezone } = useTimezone();
  const imageUrl = post.featuredImage?.node?.sourceUrl;
  const imageAlt = post.featuredImage?.node?.altText || stripHtml(post.title);
  const category = post.categories?.nodes?.[0];

  return (
    <article id="article-content" className="mx-auto max-w-4xl px-4 py-8">
      {/* 麵包屑導航 */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/" className="hover:text-red-600">
          首頁
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        {category && (
          <>
            <Link
              href={`/category/${category.slug}`}
              className="hover:text-red-600"
            >
              {category.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
          </>
        )}
        <span className="truncate text-gray-400">
          {stripHtml(post.title).slice(0, 40)}...
        </span>
      </nav>

      {/* 文章標題 */}
      <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-gray-900 md:text-4xl">
        {stripHtml(post.title)}
      </h1>

      {/* 文章元資訊 */}
      <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-gray-500">
        {/* 時間 */}
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          <time dateTime={post.date}>
            {formatDateByTimezone(post.date, timezone, 'yyyy 年 MM 月 dd 日 HH:mm')}
          </time>
          <span className="text-xs text-gray-400">({getRelativeTime(post.date)})</span>
        </div>

        {/* 閱讀時間 */}
        {post.seo?.readingTime && (
          <div className="flex items-center gap-1.5">
            <Clock3 className="h-4 w-4" />
            <span>閱讀約 {post.seo.readingTime} 分鐘</span>
          </div>
        )}

        {/* 作者 */}
        <div className="flex items-center gap-1.5">
          <User className="h-4 w-4" />
          <span>{post.author.node.name}</span>
        </div>

        {/* 分享按鈕 */}
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: stripHtml(post.title),
                url: window.location.href,
              });
            }
          }}
          className="ml-auto flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          <Share2 className="h-3.5 w-3.5" />
          分享
        </button>
      </div>

      {/* 分類 + 標籤 */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {post.categories.nodes.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
          >
            {cat.name}
          </Link>
        ))}
        {post.tags.nodes.map((tag) => (
          <Link
            key={tag.id}
            href={`/search?q=${encodeURIComponent(tag.name)}`}
            className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
          >
            <Tag className="h-3 w-3" />
            {tag.name}
          </Link>
        ))}
      </div>

      {/* 特色圖片 */}
      {imageUrl && (
        <figure className="mb-10 overflow-hidden rounded-xl">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
          {post.featuredImage?.node?.caption && (
            <figcaption
              className="mt-2 text-center text-sm text-gray-500"
              dangerouslySetInnerHTML={{
                __html: post.featuredImage.node.caption,
              }}
            />
          )}
        </figure>
      )}

      {/* 原文來源提示 */}
      <OriginalSource acfFields={post.acfFields} />

      {/* 文章正文 */}
      <div
        className="article-content mt-10"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* 文章底部：更新時間 */}
      {post.modified !== post.date && (
        <div className="mt-10 border-t border-gray-100 pt-4 text-center text-xs text-gray-400">
          最後更新於{' '}
          <time dateTime={post.modified}>
            {formatDateByTimezone(post.modified, timezone, 'yyyy 年 MM 月 dd 日 HH:mm')}
          </time>
        </div>
      )}

      {/* 原文出處（底部再次顯示） */}
      {post.acfFields?.originalUrl && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
          <p className="text-sm text-gray-600">
            原文出處：
            <a
              href={post.acfFields.originalUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="ml-1 font-medium text-red-600 underline underline-offset-2 hover:text-red-700"
            >
              {post.acfFields.sourceName || '查看原文'}
            </a>
          </p>
        </div>
      )}

      {/* 相關文章推薦 */}
      <RelatedPosts posts={relatedPosts} timezone={timezone} />

      {/* 瀏覽量追蹤（無 UI，僅記錄） */}
      <ViewTracker slug={post.slug} />
    </article>
  );
}
