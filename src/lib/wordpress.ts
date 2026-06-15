// ============================================
// WordPress GraphQL 客戶端 & 資料查詢層
// 整合 @nextwp/core + graphql-request
// ============================================

import { GraphQLClient } from 'graphql-request';
import { WP_GRAPHQL_URL, POSTS_PER_PAGE } from './constants';
import type {
  PostSummary,
  PostDetail,
  Category,
  PageInfo,
  PostsResponse,
  SinglePostResponse,
  SearchResponse,
  CategoryResponse,
  PopularPostsResponse,
} from './types';

// ============================================
// GraphQL 客戶端（單例）
// ============================================

let client: GraphQLClient | null = null;

function getClient(): GraphQLClient {
  if (!client) {
    client = new GraphQLClient(WP_GRAPHQL_URL, {
      headers: {
        'Content-Type': 'application/json',
        // 如果有 JWT 認證需求，在此添加 Authorization header
        // Authorization: `Bearer ${process.env.WP_JWT_TOKEN}`,
      },
      // 設定請求超時
      fetch: (url, options) =>
        fetch(url, { ...options, next: { revalidate: 0 } }).then((res) => {
          if (!res.ok) {
            throw new Error(`GraphQL 請求失敗：${res.status} ${res.statusText}`);
          }
          return res;
        }),
    });
  }
  return client;
}

// ============================================
// GraphQL 片段（復用欄位選擇）
// ============================================

/** 文章列表通用欄位 */
const POST_SUMMARY_FIELDS = `
  id
  databaseId
  title(format: RENDERED)
  excerpt(format: RENDERED)
  slug
  uri
  date
  modified
  featuredImage {
    node {
      sourceUrl(size: LARGE)
      altText
      caption(format: RENDERED)
      mediaDetails {
        width
        height
        sizes {
          name
          sourceUrl
          width
          height
        }
      }
    }
  }
  categories(first: 10) {
    nodes {
      id
      databaseId
      name
      slug
    }
  }
`;

/** 文章詳情通用欄位（包含完整內容 + 作者 + 標籤） */
const POST_DETAIL_FIELDS = `
  ${POST_SUMMARY_FIELDS}
  content(format: RENDERED)
  author {
    node {
      id
      name
      firstName
      lastName
      description
      avatar {
        url
      }
    }
  }
  tags(first: 20) {
    nodes {
      id
      name
      slug
    }
  }
`;

// ============================================
// 查詢函數
// ============================================

/**
 * 獲取最新文章列表（首頁用，支援分頁）
 */
export async function getLatestPosts(
  first: number = POSTS_PER_PAGE,
  after?: string
): Promise<{ nodes: PostSummary[]; pageInfo: PageInfo }> {
  const query = `
    query LatestPosts($first: Int!, $after: String) {
      posts(
        first: $first
        after: $after
        where: {
          status: PUBLISH
          orderby: { field: DATE, order: DESC }
        }
      ) {
        pageInfo {
          hasNextPage
          endCursor

        }
        nodes {
          ${POST_SUMMARY_FIELDS}
        }
      }
    }
  `;

  try {
    const data = await getClient().request<PostsResponse>(query, { first, after });
    return data.posts;
  } catch (error) {
    console.error('獲取文章列表失敗：', error);
    return { nodes: [], pageInfo: { hasNextPage: false, endCursor: ''
 } };
  }
}

/**
 * 根據 slug 獲取單篇文章詳情
 */
export async function getPostBySlug(slug: string): Promise<PostDetail | null> {
  const query = `
    query SinglePost($slug: ID!) {
      post(id: $slug, idType: SLUG) {
        ${POST_DETAIL_FIELDS}
      }
    }
  `;

  try {
    const data = await getClient().request<SinglePostResponse>(query, { slug });
    return data.post;
  } catch {
    return null;
  }
}

/**
 * 根據資料庫 ID 獲取單篇文章
 */
export async function getPostById(databaseId: number): Promise<PostDetail | null> {
  const query = `
    query SinglePost($id: ID!) {
      post(id: $id, idType: DATABASE_ID) {
        ${POST_DETAIL_FIELDS}
      }
    }
  `;

  try {
    const data = await getClient().request<SinglePostResponse>(query, { id: databaseId });
    return data.post;
  } catch {
    return null;
  }
}

/**
 * 按分類 slug 獲取文章列表
 */
export async function getPostsByCategory(
  categorySlug: string,
  first: number = POSTS_PER_PAGE,
  after?: string
): Promise<{ nodes: PostSummary[]; pageInfo: PageInfo; category: Category | null }> {
  const query = `
    query PostsByCategory($categorySlug: String!, $first: Int!, $after: String) {
      posts(
        first: $first
        after: $after
        where: {
          status: PUBLISH
          categoryName: $categorySlug
          orderby: { field: DATE, order: DESC }
        }
      ) {
        pageInfo {
          hasNextPage
          endCursor

        }
        nodes {
          ${POST_SUMMARY_FIELDS}
        }
      }
      categories(where: { slug: [$categorySlug] }) {
        nodes {
          id
          databaseId
          name
          slug
          description
          count
        }
      }
    }
  `;

  try {
    const data = await getClient().request<PostsResponse & CategoryResponse>(query, {
      categorySlug: categorySlug,
      first,
      after,
    });

    return {
      nodes: data.posts.nodes,
      pageInfo: data.posts.pageInfo,
      category: data.categories?.nodes?.[0] || null,
    };
  } catch (error) {
    console.error('獲取分類文章失敗：', error);
    return {
      nodes: [],
      pageInfo: { hasNextPage: false, endCursor: ''
 },
      category: null,
    };
  }
}

/**
 * 關鍵字搜尋文章
 */
export async function searchPosts(
  searchTerm: string,
  first: number = POSTS_PER_PAGE,
  after?: string
): Promise<{ nodes: PostSummary[]; pageInfo: PageInfo }> {
  const query = `
    query SearchPosts($search: String!, $first: Int!, $after: String) {
      posts(
        first: $first
        after: $after
        where: {
          status: PUBLISH
          search: $search
          orderby: { field: RELEVANCE, order: DESC }
        }
      ) {
        pageInfo {
          hasNextPage
          endCursor

        }
        nodes {
          ${POST_SUMMARY_FIELDS}
        }
      }
    }
  `;

  try {
    const data = await getClient().request<SearchResponse>(query, {
      search: searchTerm,
      first,
      after,
    });
    return data.posts;
  } catch {
    return { nodes: [], pageInfo: { hasNextPage: false, endCursor: ''
 } };
  }
}

/**
 * 獲取所有分類
 */
export async function getAllCategories(): Promise<Category[]> {
  const query = `
    query AllCategories {
      categories(first: 100, where: { hideEmpty: true }) {
        nodes {
          id
          databaseId
          name
          slug
          description
          count
        }
      }
    }
  `;

  try {
    const data = await getClient().request<CategoryResponse>(query);
    return data.categories.nodes;
  } catch {
    return [];
  }
}

/**
 * 獲取特定 slug 列表的所有文章（用於 sitemap）
 */
export async function getAllPostSlugs(first: number = 500): Promise<{ slug: string; modified: string }[]> {
  const query = `
    query AllPostSlugs($first: Int!) {
      posts(first: $first, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
        nodes {
          slug
          modified
        }
      }
    }
  `;

  try {
    const data = await getClient().request<{
      posts: { nodes: { slug: string; modified: string }[] };
    }>(query, { first });
    return data.posts.nodes;
  } catch {
    return [];
  }
}

/**
 * 獲取所有分類 slug（用於 sitemap）
 */
export async function getAllCategorySlugs(): Promise<{ slug: string; count: number }[]> {
  const query = `
    query AllCategorySlugs {
      categories(first: 100, where: { hideEmpty: true }) {
        nodes {
          slug
          count
        }
      }
    }
  `;

  try {
    const data = await getClient().request<{ categories: { nodes: { slug: string; count: number }[] } }>(query);
    return data.categories.nodes;
  } catch {
    return [];
  }
}

/**
 * 獲取熱門文章（按評論數排序，也可擴展為按自訂瀏覽量）
 */
export async function getPopularPosts(
  first: number = 10,
  daysAgo: number = 7
): Promise<PostSummary[]> {
  // WordPress 本身不含瀏覽量統計，此處按評論數 + 近期文章作為「熱門」指標
  const query = `
    query PopularPosts($first: Int!) {
      posts(
        first: $first
        where: {
          status: PUBLISH
          orderby: { field: COMMENT_COUNT, order: DESC }
        }
      ) {
        nodes {
          ${POST_SUMMARY_FIELDS}
        }
      }
    }
  `;

  try {
    const data = await getClient().request<PopularPostsResponse>(query, { first });
    return data.posts.nodes;
  } catch {
    return [];
  }
}

/**
 * 獲取置頂文章（用於首頁輪播）
 * 如果沒有置頂文章，返回最新文章作為替代
 */
export async function getStickyOrLatestPosts(count: number = 5): Promise<PostSummary[]> {
  // WPGraphQL 沒有直接的 sticky 查詢參數，先用最新文章
  const query = `
    query FeaturedPosts($first: Int!) {
      posts(
        first: $first
        where: {
          status: PUBLISH
          orderby: { field: DATE, order: DESC }
        }
      ) {
        nodes {
          ${POST_SUMMARY_FIELDS}
        }
      }
    }
  `;

  try {
    const data = await getClient().request<{ posts: { nodes: PostSummary[] } }>(query, { first: count });
    return data.posts.nodes;
  } catch {
    return [];
  }
}

/**
 * 獲取相關文章（同分類下的其他文章）
 */
export async function getRelatedPosts(
  currentSlug: string,
  categorySlugs: string[],
  first: number = 4
): Promise<PostSummary[]> {
  if (categorySlugs.length === 0) return [];

  const query = `
    query RelatedPosts($categorySlug: String!, $first: Int!, $excludeSlug: [String]!) {
      posts(
        first: $first
        where: {
          status: PUBLISH
          categoryName: $categorySlug
          notIn: { slug: $excludeSlug }
          orderby: { field: DATE, order: DESC }
        }
      ) {
        nodes {
          ${POST_SUMMARY_FIELDS}
        }
      }
    }
  `;

  try {
    const data = await getClient().request<{
      posts: { nodes: PostSummary[] };
    }>(query, {
      categorySlug: categorySlugs[0] || '',
      first,
      excludeSlug: [currentSlug],
    });
    return data.posts.nodes;
  } catch {
    return [];
  }
}

// ============================================
// @nextwp/core 配置輔助
// ============================================

/**
 * @nextwp/core NextWP 設定
 * 在 layout.tsx 中使用 <NextWP config={nextWpConfig}>
 */
export const nextWpConfig = {
  wpUrl: process.env.NEXT_PUBLIC_WP_URL || 'https://cms.mynews.com',
  graphqlEndpoint: '/graphql',
  // 圖片域名映射，用於 next/image 優化
  imageDomains: [
    (process.env.WORDPRESS_HOSTNAME || 'cms.mynews.com'),
    'secure.gravatar.com',
    '0.gravatar.com',
    '1.gravatar.com',
    '2.gravatar.com',
  ],
};
