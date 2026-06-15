import { NextRequest, NextResponse } from 'next/server';
import reviews from './data.json';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = Math.min(parseInt(searchParams.get('per_page') || '20'), 50);
  const software = searchParams.get('software') || '';
  const sort = searchParams.get('sort') || 'latest';

  let filtered = [...reviews] as any[];
  if (software) {
    const q = software.toLowerCase();
    filtered = filtered.filter((r: any) => r.software?.toLowerCase().includes(q));
  }

  if (sort === 'helpful') filtered.sort((a: any, b: any) => b.helpful - a.helpful);
  else if (sort === 'rating_high') filtered.sort((a: any, b: any) => b.rating - a.rating);
  else filtered.sort((a: any, b: any) => b.date.localeCompare(a.date)).reverse();

  const total = filtered.length;
  const totalPages = Math.ceil(total / perPage);
  const items = filtered.slice((page - 1) * perPage, page * perPage);

  return NextResponse.json({ reviews: items, total, page, totalPages, perPage }, {
    headers: { 'Cache-Control': 'public, max-age=300' },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { user, software, rating, text } = body;
  if (!user || !text || !rating || user.length < 2 || text.length < 10) {
    return NextResponse.json({ error: 'Name (2+ chars), review text (10+ chars), and rating (1-5) are required.' }, { status: 400 });
  }
  const newReview = { id: Date.now(), user: String(user).slice(0,30), software: String(software||'Unknown').slice(0,50), rating: Math.min(5,Math.max(1,Number(rating))), date: new Date().toISOString().slice(0,10), text: String(text).slice(0,1000), helpful: 0, not_helpful: 0 };
  reviews.unshift(newReview);
  return NextResponse.json({ ok: true, review: newReview });
}
