/**
 * GET /api/crawler-data?secret=xxx
 *
 * 僅解析 RSS 並回傳文章資料（不發布到 WordPress）。
 * 由 GitHub Actions 定時調用，取得文章列表後由 Actions 發布。
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ArticleData {
  title: string;
  summary: string;
  sourceUrl: string;
  domain: string;
  pubDate: string;
  category: string;
}

const FEEDS = (process.env.CRAWLER_RSS_FEEDS || '').split(',').map(s => s.trim()).filter(Boolean);
const BLACKLIST_DOMAINS = (process.env.BLACKLIST_DOMAINS || '').split(',').map(s => s.trim()).filter(Boolean);
const BLACKLIST_KEYWORDS = (process.env.BLACKLIST_KEYWORDS || '').split(',').map(s => s.trim()).filter(Boolean);

// --- Category detection ---
const CAT_MAP: [string[], string][] = [
  [['world cup','worldcup','fifa','football','soccer','世界盃','世界杯','足球'], 'world-cup'],
  [['trump','putin','zelensky','war','peace','military','nato','un','diplomat','ceasefire','sanction'], 'world'],
  [['china','taiwan','beijing','两岸','中国','台湾','xi jinping','tsai'], 'cross-strait'],
  [['immigration','visa','study abroad','移民','留学','h1b','green card','护照'], 'immigration-study'],
  [['community','chinatown','asian','华裔','华人','唐人街','lunar new year'], 'lifestyle'],
];
function detectCat(title: string, text: string): string {
  const t = (title + ' ' + text).toLowerCase();
  for (const [keywords, cat] of CAT_MAP) {
    if (keywords.some(k => t.includes(k))) return cat;
  }
  return 'breaking-news';
}

export async function GET(request: NextRequest) {
  const secret = new URL(request.url).searchParams.get('secret');
  if (secret !== (process.env.CRON_SECRET || 'mynews2026')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const articles: ArticleData[] = [];
  const seen = new Set<string>();

  for (const feedUrl of FEEDS) {
    if (!feedUrl) continue;
    try {
      const resp = await fetch(feedUrl, {
        headers: { 'User-Agent': 'NewsBot/2.0' },
        signal: AbortSignal.timeout(10000),
      });
      if (!resp.ok) continue;
      const xml = await resp.text();

      // Parse RSS items
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      let match: RegExpExecArray | null;
      while ((match = itemRegex.exec(xml)) !== null) {
        const block = match[1];

        const getTag = (tag: string): string => {
          const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
          const cm = block.match(cdataRe);
          if (cm) return cm[1].trim();
          const plainRe = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
          const pm = block.match(plainRe);
          return pm ? pm[1].replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim() : '';
        };

        const title = getTag('title');
        const link = getTag('link');
        const desc = getTag('description');
        const pubDate = getTag('pubDate') || new Date().toISOString();

        if (!title || !link) continue;
        if (desc.length < 40) continue;

        const domain = (() => { try { return new URL(link).hostname.replace('www.', ''); } catch { return ''; } })();
        if (!domain) continue;

        // Blacklist
        if (BLACKLIST_DOMAINS.some(d => domain.includes(d))) continue;
        const checkText = (title + ' ' + desc).toLowerCase();
        if (BLACKLIST_KEYWORDS.some(k => checkText.includes(k.toLowerCase()))) continue;

        // Dedup within this batch
        const key = link.toLowerCase().replace(/\/$/, '');
        if (seen.has(key)) continue;
        seen.add(key);

        // Title rewrite: add prefix
        const prefixes = ['速報','快訊','最新','即時'];
        const newTitle = `【${prefixes[title.length % 4]}】${title.slice(0, 100).trim()}`;

        const cat = detectCat(title, desc);
        const summary = desc.slice(0, 300).replace(/\s+/g, ' ').trim();

        articles.push({
          title: newTitle,
          summary,
          sourceUrl: link,
          domain,
          pubDate,
          category: cat,
        });
      }
    } catch {
      // One feed failure doesn't stop others
    }
  }

  return NextResponse.json({
    articles: articles.slice(0, 20),
    total: articles.length,
  });
}
