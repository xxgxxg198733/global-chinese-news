import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostsByCategory, getAllCategorySlugs } from '@/lib/wordpress';
import { DEFAULT_REVALIDATE, SITE_URL, SITE_NAME } from '@/lib/constants';
import { stripHtml } from '@/lib/utils';
import { CategoryPageClient } from './CategoryPageClient';

// ISR：60 秒
export const revalidate = DEFAULT_REVALIDATE;

// ============================================
// 動態 Metadata
// ============================================
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { category } = await getPostsByCategory(params.slug, 1);

  if (!category) {
    return { title: '分類不存在' };
  }

  const title = `${category.name} | ${SITE_NAME}`;
  const description = category.description
    ? stripHtml(category.description)
    : `瀏覽 ${category.name} 相關新聞，共 ${category.count} 篇文章。`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/category/${params.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/category/${params.slug}`,
      type: 'website',
    },
  };
}

// ============================================
// 頁面
// ============================================
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const postsPerPage = 20;

  const { nodes: posts, pageInfo, category } = await getPostsByCategory(
    params.slug,
    postsPerPage
  );

  if (!category) {
    notFound();
  }

  return (
    <CategoryPageClient
      category={category}
      posts={posts}
      hasNextPage={pageInfo.hasNextPage}
    />
  );
}
