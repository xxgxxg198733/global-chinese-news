/**
 * POST /api/views  — 記錄瀏覽量（客戶端觸發）
 * GET  /api/views?slug=xxx           — 查詢單篇文章瀏覽量
 * GET  /api/views?top=20              — 查詢瀏覽量最高 N 篇
 *
 * 存儲：Upstash Redis
 *   - pageviews:{slug}:2026-06-14  → 當日計數器
 *   - pageviews:{slug}:total       → 全時計數器
 *   - pageviews:ranking             → Sorted Set（用於排行）
 */

import { NextRequest, NextResponse } from 'next/server';

// ---- Redis REST 輔助 ----

function redisHeaders() {
  return {
    Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN || ''}`,
  };
}

function redisUrl() {
  return process.env.UPSTASH_REDIS_REST_URL || '';
}

async function redisIncr(key: string): Promise<number> {
  const u = redisUrl();
  if (!u) return 0;
  const resp = await fetch(`${u}/incr/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: redisHeaders(),
  });
  const data = (await resp.json()) as { result: number };
  return data.result || 0;
}

async function redisGet(key: string): Promise<string | null> {
  const u = redisUrl();
  if (!u) return null;
  const resp = await fetch(`${u}/get/${encodeURIComponent(key)}`, { headers: redisHeaders() });
  const data = (await resp.json()) as { result: string | null };
  return data.result;
}

// 使用 Sorted Set 追蹤熱門文章
async function redisZincrby(key: string, increment: number, member: string): Promise<void> {
  const u = redisUrl();
  if (!u) return;
  // Upstash REST 命令路徑
  await fetch(`${u}/zincrby/${encodeURIComponent(key)}/${increment}/${encodeURIComponent(member)}`, {
    method: 'POST',
    headers: redisHeaders(),
  });
}

async function redisZrevrange(key: string, start: number, stop: number): Promise<string[]> {
  const u = redisUrl();
  if (!u) return [];
  const resp = await fetch(
    `${u}/zrevrange/${encodeURIComponent(key)}/${start}/${stop}`,
    { headers: redisHeaders() }
  );
  const data = (await resp.json()) as { result: string[] };
  return data.result || [];
}

// ---- POST: 記錄瀏覽 ----

export async function POST(request: NextRequest) {
  let slug = '';
  try {
    const body = await request.json();
    slug = (body.slug || '').trim();
  } catch { /* 略 */ }

  if (!slug || slug.length > 200) {
    return NextResponse.json({ error: '缺少有效的 slug' }, { status: 400 });
  }

  if (!redisUrl()) {
    return NextResponse.json({ ok: true, cached: false });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);

    await redisIncr(`pageviews:${slug}:${today}`);
    await redisIncr(`pageviews:${slug}:total`);
    await redisZincrby('pageviews:ranking', 1, slug);

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('[views] 記錄失敗:', err);
    return NextResponse.json({ ok: true, cached: false });
  }
}

// ---- GET: 查詢瀏覽量 ----

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug')?.trim();
  const topN = parseInt(searchParams.get('top') || '0', 10);

  if (!redisUrl()) {
    return NextResponse.json({ error: 'Redis 未配置' }, { status: 500 });
  }

  try {
    // 單篇查詢
    if (slug) {
      const views = parseInt((await redisGet(`pageviews:${slug}:total`)) || '0', 10);
      const todayViews = parseInt(
        (await redisGet(`pageviews:${new Date().toISOString().slice(0, 10)}`)) || '0',
        10
      );
      return NextResponse.json({ slug, views, todayViews });
    }

    // 熱門排行
    if (topN > 0 && topN <= 50) {
      const members = await redisZrevrange('pageviews:ranking', 0, topN - 1);
      return NextResponse.json({ top: members });
    }

    return NextResponse.json({ error: '請提供 slug 或 top 參數 (1-50)' }, { status: 400 });
  } catch (err) {
    console.error('[views] 查詢失敗:', err);
    return NextResponse.json({ error: '查詢失敗' }, { status: 500 });
  }
}
