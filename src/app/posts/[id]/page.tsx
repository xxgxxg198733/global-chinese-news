import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostById, getRelatedPosts } from '@/lib/wordpress';
import { POST_REVALIDATE, SITE_URL, SITE_NAME } from '@/lib/constants';
import { stripHtml, generateNewsArticleSchema, extractSeoMeta } from '@/lib/utils';
import { PostDetailClient } from './PostDetailClient';

// ISR：文章頁緩存 1 小時
export const revalidate = POST_REVALIDATE;

// ============================================
// 靜態生成（可選：預先編譯熱門文章）
// ============================================
// export async function generateStaticParams() {
//   const slugs = await getAllPostSlugs(100);
//   return slugs.map(({ slug }) => ({ slug }));
// }

// ============================================
// 動態 Metadata（從 Yoast SEO + ACF 生成）
// ============================================
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const post = await getPostById(parseInt(params.id, 10));

  if (!post) {
    return { title: '文章不存在' };
  }

  const seoMeta = extractSeoMeta(post.seo);
  const imageUrl = post.featuredImage?.node?.sourceUrl || `${SITE_URL}/og-image.jpg`;
  const description = seoMeta?.description || stripHtml(post.excerpt).slice(0, 160);
  const postUrl = `${SITE_URL}/posts/${post.databaseId}`;

  return {
    title: seoMeta?.title || stripHtml(post.title),
    description,
    alternates: {
      canonical: seoMeta?.canonical || postUrl,
    },
    openGraph: {
      title: seoMeta?.ogTitle || stripHtml(post.title),
      description: seoMeta?.ogDescription || description,
      url: postUrl,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.modified,
      authors: [post.author.node.name],
      images: [
        {
          url: imageUrl,
          width: post.featuredImage?.node?.mediaDetails?.width || 1200,
          height: post.featuredImage?.node?.mediaDetails?.height || 630,
          alt: post.featuredImage?.node?.altText || stripHtml(post.title),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoMeta?.twitterTitle || stripHtml(post.title),
      description: seoMeta?.twitterDescription || description,
      images: [seoMeta?.twitterImage || imageUrl],
    },
    other: {
      'article:published_time': post.date,
      'article:modified_time': post.modified,
      'article:author': post.author.node.name,
    },
  };
}

// ============================================
// 頁面組件
// ============================================
export default async function PostPage({
  params,
}: {
  params: { id: string };
}) {
  const post = await getPostById(parseInt(params.id, 10));

  if (!post) {
    notFound();
  }

  // 獲取相關文章
  const categorySlugs = post.categories.nodes.map((c) => c.slug);
  const relatedPosts = await getRelatedPosts(post.slug, categorySlugs, 4);

  // 結構化資料
  const jsonLd = generateNewsArticleSchema({
    title: stripHtml(post.title),
    excerpt: stripHtml(post.excerpt),
    date: post.date,
    modified: post.modified,
    url: `${SITE_URL}/posts/${post.databaseId}`,
    imageUrl: post.featuredImage?.node?.sourceUrl || null,
    authorName: post.author.node.name,
    siteName: SITE_NAME,
  });

  // Yoast SEO schema
  const yoastSchema = post.seo?.schema?.raw;

  return (
    <>
      {/* 注入結構化資料 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {yoastSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: yoastSchema }}
        />
      )}

      <PostDetailClient
        post={post}
        relatedPosts={relatedPosts}
      />
    </>
  );
}
