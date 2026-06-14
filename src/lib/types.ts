// ============================================
// WordPress GraphQL 回應型別定義
// ============================================

/** 圖片尺寸 */
export interface MediaSize {
  name: string;
  sourceUrl: string;
  width: number;
  height: number;
}

/** 媒體詳情 */
export interface MediaDetails {
  width: number;
  height: number;
  sizes: MediaSize[];
}

/** 特色圖片節點 */
export interface FeaturedImageNode {
  sourceUrl: string;
  altText: string;
  caption: string | null;
  mediaDetails: MediaDetails;
}

/** 分類 */
export interface Category {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  description: string | null;
  count: number;
}

/** 標籤 */
export interface Tag {
  id: string;
  name: string;
  slug: string;
}

/** 作者 */
export interface Author {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  description: string | null;
  avatar: {
    url: string;
  };
}

/** ACF 自定義欄位 */
export interface AcfFields {
  originalUrl: string | null;
  sourceName: string | null;
  isTranslated: boolean;
  originalAuthor: string | null;
}

/** Yoast SEO 資料 */
export interface SeoData {
  title: string;
  metaDesc: string;
  metaKeywords: string;
  canonical: string;
  opengraphTitle: string;
  opengraphDescription: string;
  opengraphImage: {
    sourceUrl: string;
  } | null;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: {
    sourceUrl: string;
  } | null;
  schema: {
    raw: string;
  };
  readingTime: number;
  breadcrumbs: {
    text: string;
    url: string;
  }[];
}

/** 文章摘要（用於列表） */
export interface PostSummary {
  id: string;
  databaseId: number;
  title: string;
  excerpt: string;
  slug: string;
  uri: string;
  date: string;
  modified: string;
  featuredImage: {
    node: FeaturedImageNode;
  } | null;
  categories: {
    nodes: Category[];
  };
  acfFields: AcfFields | null;
  seo: SeoData | null;
}

/** 文章詳情（用於單篇文章頁） */
export interface PostDetail extends PostSummary {
  content: string;
  author: {
    node: Author;
  };
  tags: {
    nodes: Tag[];
  };
}

/** 分頁資訊 */
export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string;
  total: number;
}

/** 文章列表回應 */
export interface PostsResponse {
  posts: {
    pageInfo: PageInfo;
    nodes: PostSummary[];
  };
}

/** 搜尋回應 */
export interface SearchResponse {
  posts: {
    pageInfo: PageInfo;
    nodes: PostSummary[];
  };
}

/** 單篇文章回應 */
export interface SinglePostResponse {
  post: PostDetail | null;
}

/** 分類回應 */
export interface CategoryResponse {
  categories: {
    nodes: Category[];
  };
}

/** 熱門文章回應（按瀏覽量排序，若無瀏覽量則按評論數） */
export interface PopularPostsResponse {
  posts: {
    nodes: PostSummary[];
  };
}

/** 置頂文章 */
export interface StickyPost extends PostSummary {
  isSticky: boolean;
}

/** 時間顯示模式 */
export type TimezoneMode = 'local' | 'taipei';

/** 導航項目 */
export interface NavItem {
  label: string;
  href: string;
  slug?: string;
}
