import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { REVALIDATE_SECRET } from '@/lib/constants';

/**
 * POST /api/revalidate
 *
 * Vercel ISR On-Demand Revalidation Webhook
 *
 * WordPress 文章發布 / 更新時，透過 Webhook 觸發此端點，
 * 使 Vercel 重新生成相關頁面的靜態緩存。
 *
 * 在 WordPress 的 functions.php 中設定：
 * add_action('post_updated', function($post_id, $post_after, $post_before) {
 *     if ($post_after->post_status === 'publish' && $post_after->post_type === 'post') {
 *         wp_remote_post('https://mynews.com/api/revalidate', [
 *             'headers' => [
 *                 'Content-Type' => 'application/json',
 *                 'Authorization' => 'Bearer YOUR_REVALIDATE_SECRET_KEY',
 *             ],
 *             'body' => json_encode([
 *                 'type' => 'post',
 *                 'slug' => $post_after->post_name,
 *                 'categories' => wp_get_post_categories($post_id, ['fields' => 'slugs']),
 *             ]),
 *         ]);
 *     }
 * }, 10, 3);
 */
export async function POST(request: NextRequest) {
  // ============================================
  // 安全驗證
  // ============================================
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  // 也支援 query parameter 驗證
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get('secret');

  const isValid =
    token === REVALIDATE_SECRET || querySecret === REVALIDATE_SECRET;

  if (!isValid || !REVALIDATE_SECRET) {
    console.warn('⚠️ Revalidation 請求：驗證失敗');
    return NextResponse.json(
      { error: '未授權的請求', success: false },
      { status: 401 }
    );
  }

  // ============================================
  // 解析請求
  // ============================================
  let body: {
    type?: string;
    slug?: string;
    categories?: string[];
    id?: number;
  } = {};

  try {
    body = await request.json();
  } catch {
    // 允許 GET 請求（用於除錯觸發）
    if (request.method === 'GET') {
      body = {
        type: searchParams.get('type') || 'post',
        slug: searchParams.get('slug') || undefined,
      };
    }
  }

  const { type = 'post', slug, categories = [] } = body;
  const revalidated: string[] = [];

  try {
    // ============================================
    // 1. 總是重新驗證首頁
    // ============================================
    revalidatePath('/', 'page');
    revalidated.push('/ (首頁)');

    // ============================================
    // 2. 文章相關重新驗證
    // ============================================
    if (type === 'post' || type === 'post_updated') {
      if (slug) {
        // 重新驗證該文章頁面
        revalidatePath(`/posts/${slug}`, 'page');
        revalidated.push(`/posts/${slug}`);
      }

      // 重新驗證相關分類頁面
      for (const catSlug of categories) {
        revalidatePath(`/category/${catSlug}`, 'page');
        revalidated.push(`/category/${catSlug}`);
      }
    }

    // ============================================
    // 3. 分類變更
    // ============================================
    if (type === 'category_updated') {
      if (slug) {
        revalidatePath(`/category/${slug}`, 'page');
        revalidated.push(`/category/${slug}`);
      }
    }

    // ============================================
    // 4. 通用標籤重新驗證（更高效）
    // ============================================
    // revalidateTag('posts'); // 如果使用了 unstable_cache + tags

    console.log(`✅ Revalidation 成功：${revalidated.join(', ')}`);

    return NextResponse.json({
      success: true,
      revalidated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Revalidation 失敗：', error);
    return NextResponse.json(
      {
        error: '重新驗證失敗',
        success: false,
        message: error instanceof Error ? error.message : '未知錯誤',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/revalidate?secret=xxx&type=post&slug=hello-world
 *
 * 支援 GET 請求（方便除錯 & WordPress 舊版 webhook）
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
