import { sendAlert, buildCrawlerAlertHtml } from '@/lib/alert';

/**
 * Vercel Cron Job — 自動新聞抓取與摘要整理
 *
 * 觸發方式：vercel.json 中配置的 cron，每小時第 15 分鐘執行。
 * 手動觸發（開發/除錯）：
 *   curl -X GET "http://localhost:3000/api/crawler?secret=YOUR_CRON_SECRET"
 *
 * 流程：
 *   1. 驗證請求（cron secret）
 *   2. 從環境變數讀取 RSS 源列表
 *   3. 逐條解析 RSS 並過濾（黑名單 + 去重）
 *   4. 提取原文前 400 字，生成 5W1H 摘要
 *   5. 改寫標題（相似度 < 70%）
 *   6. 發布為 WordPress「草稿」
 *   7. 記錄抓取結果到 Upstash Redis（去重緩存）
 *
 * 侵權規避：
 *   - 不複製全文（僅前 400 字符用於摘要分析，不存入文章）
 *   - 標題改寫（同義詞替換、語序調整、首碼標記）
 *   - 摘要為原創重組文字（非原文片段拼接）
 *   - 文末強制標註原文連結與免責聲明
 *   - 僅發布為草稿，需人工審核後上線
 *   - 黑名單域名 + 敏感關鍵詞即時攔截
 *   - 自定義欄位記錄原文 URL、抓取時間、自動化標記
 */

// ============================================================
// 類型定義
// ============================================================

interface RSSFeedItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet?: string;
  content?: string;
  creator?: string;
  categories?: string[];
  guid?: string;
  isoDate?: string;
  /** RSS enclosure (image/media) */
  enclosure?: { url: string; type: string };
}

interface ParsedFeed {
  title: string;
  items: RSSFeedItem[];
}

interface CrawlerArticle {
  rewrittenTitle: string;
  summary: string;
  originalUrl: string;
  sourceDomain: string;
  publishedDate: string;
  author: string;
  originalTitle: string;
  /** 從原文提取的圖片 URL */
  imageUrl: string | null;
}

interface CrawlerReport {
  runAt: string;
  feedsChecked: number;
  itemsFound: number;
  itemsBlocked: number;
  itemsDuplicate: number;
  itemsPublished: number;
  itemsFailed: number;
  publishedTitles: string[];
  errors: string[];
}

// ============================================================
// 環境變數讀取
// ============================================================

function getEnv(key: string, fallback = ''): string {
  return process.env[key] || fallback;
}

function getEnvList(key: string): string[] {
  const raw = process.env[key] || '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const CONFIG = {
  CRON_SECRET: getEnv('CRON_SECRET'),
  WP_URL: getEnv('WORDPRESS_HOSTNAME')
    ? `https://${getEnv('WORDPRESS_HOSTNAME')}`
    : getEnv('NEXT_PUBLIC_WP_URL'),
  WP_USERNAME: getEnv('WP_USERNAME'),
  WP_PASSWORD: getEnv('WP_PASSWORD'),
  WP_APP_PASSWORD: getEnv('WP_APPLICATION_PASSWORD'),
  DEFAULT_CATEGORY_ID: parseInt(getEnv('DEFAULT_CATEGORY_ID', '1'), 10),
  RSS_FEEDS: getEnvList('CRAWLER_RSS_FEEDS'),
  BLACKLIST_DOMAINS: getEnvList('BLACKLIST_DOMAINS'),
  BLACKLIST_KEYWORDS: getEnvList('BLACKLIST_KEYWORDS'),
  MAX_ITEMS_PER_RUN: 10,
  CONTENT_EXTRACT_LIMIT: 400 as const,
  SUMMARY_MIN_LENGTH: 80 as const,
  SUMMARY_MAX_LENGTH: 120 as const,
  SAME_DOMAIN_DELAY_MS: 3000,
  DEDUP_TTL_SECONDS: 60 * 60 * 24 * 30, // 30 天
} as const;

// ============================================================
// 工具函數
// ============================================================

function log(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [CRAWLER:${level.toUpperCase()}]`;
  if (data !== undefined) {
    console[level](`${prefix} ${message}`, JSON.stringify(data, null, level === 'error' ? 2 : 0));
  } else {
    console[level](`${prefix} ${message}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** 生成 URL 的 SHA-256 前 16 位（用於去重鍵） */
async function urlFingerprint(url: string): Promise<string> {
  const normalized = url.trim().toLowerCase().replace(/\/$/, '');
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================================
// Upstash Redis 客戶端（去重存儲）
// ============================================================

let redisClient: {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, opts?: { ex?: number }) => Promise<unknown>;
} | null = null;

function getRedisClient() {
  if (redisClient) return redisClient;

  const url = getEnv('UPSTASH_REDIS_REST_URL');
  const token = getEnv('UPSTASH_REDIS_REST_TOKEN');

  if (!url || !token) {
    log('warn', 'Upstash Redis 未配置，去重功能以內存模擬執行（重啟後丟失）');
    // 內存 fallback（僅供開發測試，不持久化）
    const memoryStore = new Map<string, string>();
    redisClient = {
      get: async (key: string) => memoryStore.get(key) || null,
      set: async (key: string, value: string) => {
        memoryStore.set(key, value);
        return 'OK';
      },
    };
    return redisClient;
  }

  // 使用 Upstash Redis REST API（無需額外依賴，fetch 原生支持）
  redisClient = {
    async get(key: string): Promise<string | null> {
      const response = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await response.json()) as { result: string | null };
      return data.result;
    },
    async set(key: string, value: string, opts?: { ex?: number }): Promise<unknown> {
      const params = new URLSearchParams();
      if (opts?.ex) params.set('EX', String(opts.ex));
      const query = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(`${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.json();
    },
  };

  return redisClient;
}

/** 檢查 URL 是否已被抓取過，若無則標記 */
async function checkAndMarkDuplicate(url: string): Promise<boolean> {
  const redis = getRedisClient();
  const fingerprint = await urlFingerprint(url);
  const key = `crawler:dedup:${fingerprint}`;

  try {
    const existing = await redis.get(key);
    if (existing) {
      log('info', `去重命中，跳過：${url}`);
      return true; // 重複
    }
    // 標記為已抓取
    await redis.set(key, '1', { ex: CONFIG.DEDUP_TTL_SECONDS });
    return false;
  } catch (err) {
    log('error', `Redis 操作失敗，跳過去重檢查：${url}`, err);
    return false; // Redis 異常時不阻塞
  }
}

// ============================================================
// 黑名單檢查
// ============================================================

function isBlacklisted(url: string, title: string, content: string): { blocked: boolean; reason: string } {
  const domain = extractDomain(url);

  // 域名黑名單（精確匹配 + 子域名匹配）
  for (const blackDomain of CONFIG.BLACKLIST_DOMAINS) {
    if (domain === blackDomain || domain.endsWith(`.${blackDomain}`)) {
      return { blocked: true, reason: `域名黑名單：${blackDomain}` };
    }
  }

  // 敏感關鍵詞（標題）
  const combinedText = `${title} ${content}`.toLowerCase();
  for (const keyword of CONFIG.BLACKLIST_KEYWORDS) {
    if (combinedText.includes(keyword.toLowerCase())) {
      return { blocked: true, reason: `敏感關鍵詞：${keyword}` };
    }
  }

  return { blocked: false, reason: '' };
}

// ============================================================
// RSS 解析
// ============================================================

async function fetchAndParseRSS(feedUrl: string): Promise<ParsedFeed | null> {
  log('info', `解析 RSS：${feedUrl}`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/2.0; +https://mynews.com)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      log('warn', `RSS 源返回 ${response.status}：${feedUrl}`);
      return null;
    }

    const xmlText = await response.text();
    // 手動解析 XML，避免 rss-parser 在 Edge Runtime 的兼容問題
    const items = parseRSSItems(xmlText, feedUrl);

    log('info', `RSS 解析完成：${feedUrl}，獲取 ${items.length} 條`);
    return { title: feedUrl, items };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      log('error', `RSS 請求超時：${feedUrl}`);
    } else {
      log('error', `RSS 解析失敗：${feedUrl}`, err);
    }
    return null;
  }
}

/**
 * 輕量 XML RSS 解析器
 * 不依賴第三方庫，僅提取 RSS 2.0 標準欄位
 */
function parseRSSItems(xml: string, feedUrl: string): RSSFeedItem[] {
  const items: RSSFeedItem[] = [];

  // 匹配 <item>...</item> 區塊
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const getTag = (tag: string): string => {
      const re = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
      const cdataMatch = block.match(re);
      if (cdataMatch) return cdataMatch[1].trim();

      const plainRe = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
      const plainMatch = block.match(plainRe);
      return plainMatch ? plainMatch[1].replace(/<[^>]*>/g, '').trim() : '';
    };

    const title = getTag('title');
    const link = getTag('link');
    const pubDate = getTag('pubDate');
    const description = getTag('description');
    const creator = getTag('dc:creator') || getTag('author');
    const guid = getTag('guid');
    const category = getTag('category');

    // 提取 enclosure (圖片/媒體)
    const encUrlMatch = block.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*\/?>/i);
    const encTypeMatch = block.match(/<enclosure[^>]+type=["']([^"']+)["'][^>]*\/?>/i);
    let enclosure: { url: string; type: string } | undefined;
    if (encUrlMatch) {
      enclosure = {
        url: encUrlMatch[1],
        type: encTypeMatch ? encTypeMatch[1] : 'image/jpeg',
      };
    }
    // Also check media:content
    if (!enclosure) {
      const mediaMatch = block.match(/<media:content[^>]+url=["']([^"']+)["'][^>]*\/?>/i);
      if (mediaMatch) {
        enclosure = { url: mediaMatch[1], type: 'image/jpeg' };
      }
    }

    if (!title || !link) continue;

    items.push({
      title,
      link: link.replace(/&amp;/g, '&'),
      pubDate: pubDate || new Date().toISOString(),
      contentSnippet: description,
      content: description,
      creator,
      categories: category ? [category] : [],
      guid: guid || link,
      enclosure,
    });
  }

  return items;
}

// ============================================================
// 原文內容提取（cheerio 方案）
// ============================================================

async function extractContent(url: string): Promise<{ text: string; html: string } | null> {
  log('info', `提取內容：${url}`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/2.0)',
        Accept: 'text/html, */*',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      log('warn', `原文請求返回 ${response.status}：${url}`);
      return null;
    }

    const html = await response.text();

    // 使用正則提取正文區塊（避免引入 cheerio/jsdom 體積）
    // 優先提取 <article>、.article-content、.post-content 等常見容器
    const articleRegexes = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    ];

    let bodyHtml = '';
    for (const regex of articleRegexes) {
      const m = html.match(regex);
      if (m && m[1]) {
        bodyHtml = m[1];
        break;
      }
    }

    // 如果沒匹配到正文容器，使用整個 body
    if (!bodyHtml) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      bodyHtml = bodyMatch ? bodyMatch[1] : html;
    }

    // 去除 script、style、nav、header、footer、aside、iframe
    bodyHtml = bodyHtml
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[\s\S]*?<\/aside>/gi, '')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, '');

    // 去除所有 HTML 標籤，得到純文字
    const text = bodyHtml
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    if (!text || text.length < 50) {
      log('warn', `提取內容過短（${text.length} 字元）：${url}`);
      return null;
    }

    // 只取前 N 個字符用於摘要分析（不存儲全文）
    const limitedText = text.slice(0, CONFIG.CONTENT_EXTRACT_LIMIT);

    return { text: limitedText, html: bodyHtml.slice(0, 2000) };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      log('error', `內容提取超時：${url}`);
    } else {
      log('error', `內容提取失敗：${url}`, err);
    }
    return null;
  }
}

// ============================================================
// 標題改寫（目標：與原文相似度 < 70%）
// ============================================================

const TITLE_PREFIXES = ['速報', '快訊', '最新', '即時', '消息'] as const;

const SYNONYM_MAP: Record<string, string[]> = {
  表示: ['稱', '指出', '強調', '表明'],
  宣布: ['公布', '發布', '宣告', '公佈'],
  呼籲: ['敦促', '要求', '促請', '籲請'],
  警告: ['示警', '提醒', '警示'],
  暴漲: ['飆升', '大漲', '攀升', '強勁上揚'],
  暴跌: ['重挫', '大跌', '下滑', '大幅回落'],
  達成: ['簽署', '締結', '敲定', '談妥'],
  衝突: ['對峙', '摩擦', '對抗', '紛爭'],
  制裁: ['限制', '懲處', '封鎖', '遏制'],
  突破: ['進展', '創新高', '里程碑', '躍進'],
  '持續上升': ['不斷攀升', '節節走高', '維持增長'],
  嚴重: ['嚴峻', '重大', '劇烈', '深重'],
  影響: ['衝擊', '波及', '牽動', '震撼'],
};

function rewriteTitle(original: string): string {
  // 先清理：去掉已有的【】標記
  let cleaned = original.replace(/【[^】]*】/g, '').trim();
  // 去掉末尾的來源標記
  cleaned = cleaned.replace(/\s*[-–—|]\s*.+$/, '').trim();

  if (!cleaned || cleaned.length < 4) {
    return `【速報】${original}`;
  }

  // 策略選擇（循環嘗試直到成功改寫）
  const strategies = [
    tryAddPrefix,
    trySynonymReplace,
    tryReorder,
  ];

  for (const strategy of strategies) {
    const result = strategy(cleaned);
    const similarity = estimateSimilarity(original, result);
    if (similarity < 0.7 && result !== original) {
      return result;
    }
  }

  // 全部策略都無法充分改寫時，添加前綴作為兜底
  return `【速報】${cleaned}`;
}

function tryAddPrefix(title: string): string {
  const prefix = TITLE_PREFIXES[Math.floor(Math.random() * TITLE_PREFIXES.length)];
  // 有時將前綴放在中間而非開頭（增加變化）
  const midPoint = title.indexOf('：') > 0 ? title.indexOf('：') + 1 : Math.floor(title.length / 2);
  if (midPoint > 4 && Math.random() > 0.5) {
    return `${title.slice(0, midPoint)}【${prefix}】${title.slice(midPoint)}`;
  }
  return `【${prefix}】${title}`;
}

function trySynonymReplace(title: string): string {
  let result = title;

  for (const [original, synonyms] of Object.entries(SYNONYM_MAP)) {
    if (result.includes(original)) {
      const replacement = synonyms[Math.floor(Math.random() * synonyms.length)];
      result = result.replace(original, replacement);
      break; // 每次只替換一個詞，避免面目全非
    }
  }

  return result;
}

function tryReorder(title: string): string {
  // 分割成短句，嘗試前後調換
  const parts = title.split(/[，,、\s]+/).filter((p) => p.length > 0);
  if (parts.length < 2) return title;

  // 將第一個短句移到末尾
  const reordered = [...parts.slice(1), parts[0]].join('，');
  return reordered;
}

/** 簡單的編輯距離相似度估計 */
function estimateSimilarity(a: string, b: string): number {
  const lenA = a.length;
  const lenB = b.length;
  if (lenA === 0 && lenB === 0) return 1;
  if (lenA === 0 || lenB === 0) return 0;

  // 使用字符集重合度作為近似
  const setA = new Set(a.split(''));
  const setB = new Set(b.split(''));
  let intersection = 0;
  for (const ch of setA) {
    if (setB.has(ch)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

// ============================================================
// 5W1H 摘要生成（80–120 字原創摘要）
// ============================================================

interface FiveW1H {
  who: string;
  what: string;
  when: string;
  where: string;
  why: string;
  how: string;
}

function extract5W1H(text: string, title: string): FiveW1H {
  const result: FiveW1H = { who: '', what: '', when: '', where: '', why: '', how: '' };

  // Who：中文人名、組織名（簡單啟發式）
  const whoPatterns = [
    /([一-鿿]{2,3})(?:主席|總統|總理|部長|市長|省長|CEO|發言人)/g,
    /(?:據|根據|據悉)([一-鿿]{2,6}(?:政府|部門|公司|組織|協會|機構|媒體|報導|表示|稱))/g,
    /([A-Z][a-z]+ [A-Z][a-z]+)/g, // 英文名
  ];
  for (const pat of whoPatterns) {
    const m = pat.exec(text);
    if (m && m[1]) {
      result.who = m[1];
      break;
    }
  }
  if (!result.who) {
    // 從標題提取主語
    const titleWho = title.match(/^([一-鿿]{2,8})(?:：|表示|稱|宣布|發布)/);
    if (titleWho) result.who = titleWho[1];
  }

  // What：事件核心
  const whatPatterns = [
    /(?:表示|稱|宣布|公布|發布|指出|強調|表明)([一-鿿]{10,40})(?:，|。)/,
    /(?:發生|爆發|出現)([一-鿿]{8,30})(?:，|。)/,
  ];
  for (const pat of whatPatterns) {
    const m = pat.exec(text);
    if (m && m[1]) {
      result.what = m[1];
      break;
    }
  }
  if (!result.what) {
    result.what = text.slice(0, 30).trim();
  }

  // When：日期
  const whenPatterns = [
    /(\d{4}年\d{1,2}月\d{1,2}日)/,
    /(當地時間\s*\d{1,2}月\d{1,2}日)/,
    /(周[一二三四五六日])/,
    /(今天|昨天|本週|上週|本週[一二三四五六日])/,
  ];
  for (const pat of whenPatterns) {
    const m = pat.exec(text);
    if (m && m[1]) {
      result.when = m[1];
      break;
    }
  }

  // Where：地點
  const wherePatterns = [
    /(?:在|於|于)([一-鿿]{2,10}(?:市|省|州|國|地區|縣))/,
    /(?:在|位於)([A-Z][a-z]+(?: [A-Z][a-z]+)?)/,
    /([一-鿿]{2,6}(?:首都|城市|港口|機場))/,
  ];
  for (const pat of wherePatterns) {
    const m = pat.exec(text);
    if (m && m[1]) {
      result.where = m[1];
      break;
    }
  }

  // Why：原因
  const whyPatterns = /(?:因為|由於|因|原因是|背景是)([一-鿿]{8,30})(?:，|。)/;
  const whyMatch = whyPatterns.exec(text);
  if (whyMatch) result.why = whyMatch[1];

  // How：方式
  const howPatterns = /(?:通過|透過|經由|以|採取)([一-鿿]{8,30})(?:，|。)/;
  const howMatch = howPatterns.exec(text);
  if (howMatch) result.how = howMatch[1];

  return result;
}

function generateSummary(text: string, title: string, domain: string): string {
  const w = extract5W1H(text, title);

  // 構建摘要模板
  const parts: string[] = [];

  // 開頭：Who + What
  if (w.who && w.what) {
    parts.push(`${w.who}${w.what}`);
  } else if (w.what) {
    parts.push(w.what);
  } else {
    // 取原文前 30 字作為基礎
    parts.push(text.slice(0, 30).replace(/[，。、；！？\n]/g, '').trim());
  }

  // 中間：When + Where
  if (w.when) {
    parts.push(`${w.when}`);
  }
  if (w.where) {
    parts.push(`於${w.where}`);
  }
  // 如果已有 when/where 資訊，添加時間地點
  if ((w.when || w.where) && parts.length >= 1) {
    // 將時間地點插入第一個部分之後
    const timeLocation = [w.when, w.where ? `於${w.where}` : '']
      .filter(Boolean)
      .join('');
    if (timeLocation && !parts[0].includes(timeLocation)) {
      parts[0] = `${parts[0]}，${timeLocation}`;
    }
  }

  // Why
  if (w.why) {
    parts.push(`原因為${w.why}`);
  }

  // 末尾：來源 + 摘要聲明
  const suffix = `（資料來源：${domain}，內容經摘要整理）`;

  // 拼接並截斷至 80–120 字
  let summary = parts.join('，');
  // 清理重複標點
  summary = summary.replace(/[，,]{2,}/g, '，').replace(/[。.]{2,}/g, '。');

  // 計算不含後綴的可用長度
  const maxLen = CONFIG.SUMMARY_MAX_LENGTH - suffix.length - 3;
  if (summary.length > maxLen) {
    summary = summary.slice(0, maxLen).replace(/[，,。.]?\S*$/, '');
  }

  // 確保不低於最小長度
  if (summary.length < CONFIG.SUMMARY_MIN_LENGTH - suffix.length) {
    // 從原文補充
    const fill = text.slice(summary.length, maxLen - summary.length);
    summary += fill.replace(/[，。、；！？\n]/g, '').trim();
  }

  return `${summary}${suffix}`;
}

// ============================================================
// WordPress REST API 發布（草稿）
// ============================================================

/** WordPress 登入狀態快取（避免每次發文都重新登入） */
let wpCookie: string | null = null;
let wpNonce: string | null = null;
let wpCookieExpiry = 0;

/** 關鍵詞→分類 ID 映射 */
const CATEGORY_KEYWORDS: [string[], number][] = [
  [['世界盃', '世界杯', 'world cup', '足球', 'FIFA', '揭幕戰', '小組賽', '淘汰賽', '決賽'], 2],  // 世界盃
  [['川普', '普丁', '澤倫斯基', '美伊', '和平協議', '外交', '聯合國', '制裁', '軍事', '戰爭', '停火', 'NATO', '歐盟'], 4], // 國際
  [['中國', '台灣', '兩岸', '北京', '台北', '中共', '蔡英文', '習近平'], 5], // 兩岸
  [['移民', '留學', '簽證', '護照', '綠卡', 'H1B', '海外工作'], 7], // 移民留學
  [['華人', '唐人街', '僑胞', '華裔', '亞裔', '社區'], 6], // 華人生活
];

function detectCategory(text: string): number {
  const lower = text.toLowerCase();
  for (const [keywords, catId] of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return catId;
    }
  }
  return CONFIG.DEFAULT_CATEGORY_ID; // 默認即時新聞
}

/** 從 HTML 中提取第一張有意義的圖片 URL */
function extractImageFromHtml(html: string, baseUrl: string): string | null {
  // 匹配 <img src="...">
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (imgMatch) {
    let src = imgMatch[1];
    // 處理相對路徑
    if (src.startsWith('/')) {
      const base = new URL(baseUrl);
      src = `${base.protocol}//${base.host}${src}`;
    } else if (!src.startsWith('http')) {
      src = new URL(src, baseUrl).href;
    }
    // 過濾明顯的 icon/logo
    if (/logo|icon|avatar|pixel|1x1|spacer|tracking|analytics/i.test(src)) return null;
    if (src.length < 30) return null;
    return src;
  }
  return null;
}

async function wpEnsureAuth(): Promise<{ cookie: string; nonce: string } | null> {
  const now = Date.now();
  // Cookie 快取 10 分鐘
  if (wpCookie && wpNonce && now < wpCookieExpiry) {
    return { cookie: wpCookie, nonce: wpNonce };
  }

  if (!CONFIG.WP_URL || !CONFIG.WP_USERNAME || !CONFIG.WP_PASSWORD) {
    log('warn', 'WordPress 憑證未配置，跳過發布');
    return null;
  }

  try {
    // Step 1: 登入取得 cookie
    const loginResp = await fetch(`${CONFIG.WP_URL}/wp-login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        log: CONFIG.WP_USERNAME,
        pwd: CONFIG.WP_PASSWORD,
        'wp-submit': '登入',
        testcookie: '1',
      }).toString(),
      redirect: 'manual',
    });

    // 直接取 Set-Cookie header 原始值（手動串接多個）
    const rawSetCookie = loginResp.headers.get('set-cookie') || '';
    // 多個 Set-Cookie 在 HTTP spec 中是合併成一個字串，用逗號分隔
    // 但 cookie 值本身可能含逗號……這裡用簡單啟發式：找 wordpress_logged_in_
    const cookieParts = rawSetCookie.split(/,(?= wordpress_|wordpress_)/);
    const loggedInPart = cookieParts.find((c: string) => c.includes('wordpress_logged_in_'));
    if (!loggedInPart) {
      log('error', `WordPress 登入失敗：cookie 中找不到 wordpress_logged_in_（raw: ${rawSetCookie.slice(0, 100)}）`);
      return null;
    }
    // 只取 key=value（去掉 ; path=/ 等屬性）
    wpCookie = loggedInPart.split(';')[0].trim();

    // Step 2: 取得 REST nonce
    const nonceResp = await fetch(`${CONFIG.WP_URL}/wp-admin/admin-ajax.php?action=rest-nonce`, {
      headers: { Cookie: wpCookie },
    });
    wpNonce = (await nonceResp.text()).trim();

    if (!wpNonce || wpNonce.length < 5) {
      log('error', `WordPress REST nonce 取得失敗：${wpNonce}`);
      return null;
    }

    wpCookieExpiry = now + 10 * 60 * 1000; // 10 分鐘
    return { cookie: wpCookie, nonce: wpNonce };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log('error', `WordPress 認證失敗：${msg}`);
    return null;
  }
}

async function publishToWordPress(article: CrawlerArticle): Promise<number | null> {
  const auth = await wpEnsureAuth();
  if (!auth) return null;

  const apiUrl = `${CONFIG.WP_URL}/wp-json/wp/v2/posts`;

  // 確定分類
  const catId = detectCategory(article.rewrittenTitle + ' ' + article.summary);

  const disclaimer = `
<hr style="margin:24px 0;border:none;border-top:1px solid #e5e5e5;">
<div style="background:#f8f8f8;padding:16px;border-radius:6px;font-size:13px;color:#666;line-height:1.8;">
<p style="margin:0 0 8px;font-weight:600;color:#444;">📋 版權與免責聲明</p>
<p style="margin:0 0 4px;">• 本文為新聞資訊摘要整理，原文來源：<a href="${article.originalUrl}" target="_blank" rel="noopener noreferrer nofollow" style="color:#c41e3a;">${article.sourceDomain}</a></p>
<p style="margin:0 0 4px;">• 原文版權歸原作者及原發布機構所有。本網站僅在合理使用範圍內進行新聞摘要報導。</p>
<p style="margin:0 0 4px;">• 本網站不為使用者轉載、引用本文內容所引發的任何法律爭議承擔責任。</p>
<p style="margin:0;">• 如著作權人認為本文超出合理使用範圍，請通過<a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://globalchineaenews.com'}/takedown" style="color:#c41e3a;">侵權刪除頁面</a>聯繫我們，將在48小時內處理。</p>
</div>`.trim();

  const imageHtml = article.imageUrl
    ? `<figure class="wp-block-image size-large"><img src="${article.imageUrl}" alt="" style="width:100%;border-radius:8px;"/></figure>\n`
    : '';

  const content = `
${imageHtml}<p>${article.summary}</p>
${disclaimer}
`.trim();

  const body = {
    title: article.rewrittenTitle,
    content,
    status: 'draft',
    categories: [catId],
    meta: {
      _original_url: article.originalUrl,
      _original_title: article.originalTitle,
      _fetch_timestamp: new Date().toISOString(),
      _source_domain: article.sourceDomain,
      _is_automated_fetch: true,
    },
    acf: {
      original_url: article.originalUrl,
      source_name: article.sourceDomain,
      is_translated: false,
      original_author: article.author || '',
    },
  };

  log('info', `發布至 WordPress：${article.rewrittenTitle}`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(apiUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Cookie: auth.cookie,
        'X-WP-Nonce': auth.nonce,
      },
      body: JSON.stringify(body),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      log('error', `WordPress API 錯誤 ${response.status}：${errText.slice(0, 200)}`);
      return null;
    }

    const data = (await response.json()) as { id: number; link: string };
    log('info', `發布成功，WordPress ID：${data.id}`);
    return data.id;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      log('error', 'WordPress API 請求超時');
    } else {
      log('error', 'WordPress 發布失敗', err);
    }
    return null;
  }
}

// ============================================================
// 單條新聞處理流水線
// ============================================================

async function processItem(item: RSSFeedItem, lastDomain: string): Promise<{ published: boolean; title: string; domain: string; error?: string }> {
  const domain = extractDomain(item.link);

  // 同域名請求間隔至少 3 秒
  if (domain === lastDomain && lastDomain) {
    await sleep(CONFIG.SAME_DOMAIN_DELAY_MS);
  }

  // 步驟 1：黑名單檢查
  const { blocked, reason } = isBlacklisted(item.link, item.title, item.contentSnippet || '');
  if (blocked) {
    log('info', `黑名單攔截：${item.title} — ${reason}`);
    return { published: false, title: item.title, domain, error: reason };
  }

  // 步驟 2：去重檢查
  const isDup = await checkAndMarkDuplicate(item.link);
  if (isDup) {
    return { published: false, title: item.title, domain, error: '重複' };
  }

  // 步驟 3：提取原文內容
  const extracted = await extractContent(item.link);
  if (!extracted || extracted.text.length < 50) {
    log('warn', `內容提取不足，跳過：${item.title}`);
    return { published: false, title: item.title, domain, error: '內容提取不足' };
  }

  // 步驟 4：提取過程中再次做關鍵詞黑名單檢查（針對正文）
  const { blocked: contentBlocked, reason: contentReason } = isBlacklisted(
    item.link,
    item.title,
    extracted.text
  );
  if (contentBlocked) {
    log('info', `正文黑名單攔截：${item.title} — ${contentReason}`);
    return { published: false, title: item.title, domain, error: contentReason };
  }

  // 步驟 5：改寫標題
  const rewrittenTitle = rewriteTitle(item.title);

  // 步驟 6：生成摘要
  const summary = generateSummary(extracted.text, item.title, domain);

  // 步驟 7：提取圖片
  const articleImage =
    (extracted.html ? extractImageFromHtml(extracted.html, item.link) : null)
    || item.enclosure?.url
    || null;

  // 步驟 8：發布為 WordPress 草稿
  const article: CrawlerArticle = {
    rewrittenTitle,
    summary,
    originalUrl: item.link,
    sourceDomain: domain,
    publishedDate: item.pubDate || item.isoDate || new Date().toISOString(),
    author: item.creator || '',
    originalTitle: item.title,
    imageUrl: articleImage,
  };

  const wpId = await publishToWordPress(article);

  if (wpId) {
    log('info', `✅ 處理完成：${rewrittenTitle}  (WP ID: ${wpId})`);
    return { published: true, title: rewrittenTitle, domain };
  }

  log('warn', `發布失敗：${rewrittenTitle}`);
  return { published: false, title: rewrittenTitle, domain, error: 'WordPress 發布失敗' };
}

// ============================================================
// 主處理常式（Vercel Cron / HTTP 觸發）
// ============================================================

export async function GET(request: Request): Promise<Response> {
  const startTime = Date.now();
  const report: CrawlerReport = {
    runAt: new Date().toISOString(),
    feedsChecked: 0,
    itemsFound: 0,
    itemsBlocked: 0,
    itemsDuplicate: 0,
    itemsPublished: 0,
    itemsFailed: 0,
    publishedTitles: [],
    errors: [],
  };

  // ---- 驗證 ----
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (CONFIG.CRON_SECRET && secret !== CONFIG.CRON_SECRET) {
    // Vercel Cron 請求自帶 x-vercel-cron header，此處也兼容手動觸發
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    if (!isVercelCron) {
      return Response.json({ error: '未授權' }, { status: 401 });
    }
  }

  log('info', '===== 自動新聞抓取開始 =====');

  // ---- 檢查必要配置 ----
  if (CONFIG.RSS_FEEDS.length === 0) {
    log('error', '未配置 RSS 源（CRAWLER_RSS_FEEDS 為空）');
    return Response.json({ error: '未配置 RSS 源' }, { status: 500 });
  }

  // ---- 步驟 1：解析所有 RSS 源 ----
  const feeds = await Promise.all(
    CONFIG.RSS_FEEDS.map((url) => fetchAndParseRSS(url))
  );
  report.feedsChecked = CONFIG.RSS_FEEDS.length;

  // ---- 步驟 2：收集並合併所有 item ----
  const allItems: { item: RSSFeedItem; feedIndex: number }[] = [];
  const seenLinks = new Set<string>();

  for (let i = 0; i < feeds.length; i++) {
    const feed = feeds[i];
    if (!feed) continue;
    for (const item of feed.items) {
      // 跨 RSS 源去重（同一批次內）
      const normalized = item.link.trim().toLowerCase().replace(/\/$/, '');
      if (seenLinks.has(normalized)) continue;
      seenLinks.add(normalized);
      allItems.push({ item, feedIndex: i });
    }
  }

  report.itemsFound = allItems.length;
  log('info', `共取得 ${allItems.length} 條 RSS 項目`);

  // ---- 步驟 3：依序處理（最多 10 條） ----
  const itemsToProcess = allItems.slice(0, CONFIG.MAX_ITEMS_PER_RUN);
  let lastDomain = '';

  for (const { item } of itemsToProcess) {
    try {
      const result = await processItem(item, lastDomain);
      lastDomain = result.domain;

      if (result.published) {
        report.itemsPublished++;
        report.publishedTitles.push(result.title);
      } else if (result.error === '重複') {
        report.itemsDuplicate++;
      } else if (result.error?.includes('黑名單') || result.error?.includes('關鍵詞')) {
        report.itemsBlocked++;
      } else {
        report.itemsFailed++;
        report.errors.push(`${result.title}: ${result.error}`);
      }
    } catch (err) {
      report.itemsFailed++;
      const errMsg = err instanceof Error ? err.message : String(err);
      report.errors.push(`${item.title}: ${errMsg}`);
      log('error', `處理異常：${item.title}`, err);
      // 不中斷，繼續處理下一條
    }
  }

  // ---- 步驟 4：輸出報告 ----
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  log('info', `===== 抓取完成，耗時 ${elapsed}s =====`);
  log('info', `結果：${report.itemsPublished} 發布 / ${report.itemsBlocked} 攔截 / ${report.itemsDuplicate} 重複 / ${report.itemsFailed} 失敗`);

  // ---- 步驟 5：失敗告警（Resend 郵件） ----
  if (report.itemsFailed > 0 || report.itemsPublished === 0) {
    const htmlBody = buildCrawlerAlertHtml({
      runAt: report.runAt,
      itemsFailed: report.itemsFailed,
      itemsPublished: report.itemsPublished,
      itemsBlocked: report.itemsBlocked,
      errors: report.errors,
    });
    // 不阻塞主流程
    sendAlert({
      subject: report.itemsFailed > 0
        ? `抓取異常：${report.itemsFailed} 條失敗`
        : '抓取警告：本次無文章發布',
      htmlBody,
    }).catch(() => {});
  }

  return Response.json({
    ...report,
    elapsedSeconds: parseFloat(elapsed),
    remainingQuota: allItems.length - itemsToProcess.length,
  });
}

/** POST 處理（委派給 GET，兼容不同 webhook 平台） */
export async function POST(request: Request): Promise<Response> {
  return GET(request);
}

// Runtime 宣告（需 Node.js runtime，非 Edge，因為用到了 crypto.subtle 與 Buffer）
export const runtime = 'nodejs';
// 最大執行時間（秒），Pro plan 300s，Hobby 60s
export const maxDuration = 300;
