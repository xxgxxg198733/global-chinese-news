import { NextRequest, NextResponse } from 'next/server';
import { searchPosts } from '@/lib/wordpress';

/**
 * GET /api/search?q=關鍵字&first=20
 *
 * 搜尋 WordPress 文章
 * 用於客戶端搜尋，避免直接暴露 GraphQL 端點
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const first = parseInt(searchParams.get('first') || '20', 10);

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: '請提供搜尋關鍵字 (q 參數)' },
      { status: 400 }
    );
  }

  // 限制最大返回數量
  const limit = Math.min(first, 50);

  try {
    const result = await searchPosts(query.trim(), limit);

    return NextResponse.json(
      { posts: result },
      {
        headers: {
          // 允許跨域（限於你自己的前端域名）
          'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL || '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          // 搜尋結果短期緩存
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('搜尋 API 錯誤：', error);
    return NextResponse.json(
      { error: '搜尋服務暫時不可用，請稍後再試' },
      { status: 500 }
    );
  }
}
