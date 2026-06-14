# Vercel 部署指南 — 全球華人新聞網

---

## 0. 前置檢查清單

在開始部署之前，確認以下項目已完成：

- [ ] WordPress 後台已安裝並設定以下外掛：
  - WPGraphQL（/graphql 端點可存取）
  - WPGraphQL for ACF（自訂欄位已暴露至 GraphQL）
  - Yoast SEO + WPGraphQL Yoast SEO Addon
  - 已建立 Application Password（用於 crawler 發布）
- [ ] 已建立 Upstash Redis 資料庫（免費 256MB，用於去重）
- [ ] 已準備一個 Vercel 帳號（可用 GitHub 登入）
- [ ] 已準備 GitHub 倉庫，程式碼已推送到 `main` 分支

---

## 1. 推送程式碼到 GitHub

```bash
cd news-frontend

# 初始化 Git（如果尚未）
git init
git checkout -b main

# 確認 .gitignore 包含必要項目
cat .gitignore
# 應含：.env, .env.local, .env*.local, node_modules, .next

# 提交並推送
git add .
git commit -m "feat: 全球華人新聞網 — Headless WP + Next.js 初始化

- Next.js 14 App Router + TypeScript + Tailwind
- WPGraphQL 整合（文章、分類、搜尋、ACF、Yoast SEO）
- Vercel Cron 自動新聞抓取（含侵權規避機制）
- ISR 增量靜態再生 + Webhook 重驗證
- 時區切換（當地 / 台北時間）
- 繁體中文介面

Co-Authored-By: Claude <noreply@anthropic.com>"

git remote add origin git@github.com:你的帳號/global-chinese-news.git
git push -u origin main
```

---

## 2. 在 Vercel 中匯入專案

1. 前往 [vercel.com/new](https://vercel.com/new)
2. 點擊 **Import** → 選擇你的 GitHub 倉庫 `global-chinese-news`
3. Vercel 自動識別為 Next.js 專案，**不需要修改**任何建置設定
4. 點擊 **Deploy**

第一次部署會失敗（因為缺少環境變數）—— 這是正常的。

---

## 3. 設定環境變數

在 Vercel Dashboard 中：

**Settings → Environment Variables**

逐一新增以下變數（勾選所有環境：Production, Preview, Development）：

### 3.1 站點基本資訊（3 個）

| Key | Value 範例 |
|-----|-----------|
| `NEXT_PUBLIC_SITE_URL` | `https://mynews.com` |
| `NEXT_PUBLIC_SITE_NAME` | `全球華人新聞網` |
| `NEXT_PUBLIC_SITE_LOCALE` | `zh-Hant` |

### 3.2 WordPress 連接（2 個）

| Key | Value 範例 |
|-----|-----------|
| `NEXT_PUBLIC_WP_URL` | `https://cms.mynews.com` |
| `WORDPRESS_HOSTNAME` | `cms.mynews.com` |

### 3.3 ISR 重驗證（1 個）

| Key | Value 範例 |
|-----|-----------|
| `REVALIDATE_SECRET_KEY` | `隨機生成 32 位元字串，例如 openssl rand -hex 16` |

### 3.4 Cron 安全（1 個）

| Key | Value 範例 |
|-----|-----------|
| `CRON_SECRET` | `另一組隨機 32 位元字串` |

### 3.5 WordPress 認證 — Crawler（3 個）

| Key | Value 範例 |
|-----|-----------|
| `WP_USERNAME` | `crawler-bot` |
| `WP_APPLICATION_PASSWORD` | `abcd EFGH 1234 ijkl MNOP 5678`（含空格） |
| `DEFAULT_CATEGORY_ID` | `3` |

### 3.6 Crawler — RSS 與黑名單（3 個）

| Key | Value |
|-----|-------|
| `CRAWLER_RSS_FEEDS` | `https://feeds.bbc.co.uk/news/world/rss.xml,https://rss.nytimes.com/services/xml/rss/nyt/World.xml,https://www.theguardian.com/world/rss` |
| `BLACKLIST_DOMAINS` | `reuters.com,bloomberg.com,caixin.com,wsj.com,ft.com` |
| `BLACKLIST_KEYWORDS` | `獨家,嚴禁轉載,付費內容,會員專享,訂閱解鎖` |

### 3.7 Upstash Redis — 去重（2 個）

| Key | Value |
|-----|-------|
| `UPSTASH_REDIS_REST_URL` | `https://us1-fresh-mastodon-12345.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | `從 Upstash Console 複製的 Token` |

### 3.8 設定完成後

點擊 **Save** → 回到 **Deployments** → 點擊最新部署右側的 **…** → **Redeploy**

---

## 4. 設定自訂域名

1. Vercel Dashboard → 你的專案 → **Settings** → **Domains**
2. 輸入你的域名，例如 `mynews.com`
3. Vercel 會顯示需要的 DNS 記錄：

   | 類型 | 名稱 | 值 |
   |------|------|-----|
   | A | `@` | `76.76.21.21` |
   | CNAME | `www` | `cname.vercel-dns.com` |

4. 在你的域名註冊商（Cloudflare、Namecheap 等）的 DNS 設定頁面中添加以上記錄
5. 返回 Vercel，等待 DNS 傳播（1–10 分鐘），狀態變為綠色 ✓ 即生效
6. Vercel 自動為你的域名申請並續約 Let's Encrypt SSL 憑證

### 如果使用 Cloudflare 作為 DNS

注意：**不要**開啟 Cloudflare 的 Proxy（橙色雲朵）來代理 Vercel。切換為 **DNS only**（灰色雲朵）。Vercel 有自己的 CDN。

---

## 5. 驗證部署

### 5.1 站點可存取

```bash
curl -I https://mynews.com
# 預期：HTTP/2 200 + strict-transport-security header
```

### 5.2 GraphQL 連通

```bash
curl -X POST https://cms.mynews.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ posts(first:1) { nodes { title } } }"}'
# 預期：回傳 JSON，包含文章標題
```

### 5.3 ISR 重驗證功能

```bash
curl -X POST "https://mynews.com/api/revalidate?secret=你的REVALIDATE_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"post","slug":"test-post"}'
# 預期：{ "success": true, "revalidated": ["/ (首頁)", "/posts/test-post"] }
```

### 5.4 Crawler 手動觸發

```bash
curl -s "https://mynews.com/api/crawler?secret=你的CRON_SECRET" | jq .
# 預期：{
#   "feedsChecked": 3,
#   "itemsFound": 15,
#   "itemsPublished": 5,
#   ...
# }
```

### 5.5 Sitemap

```bash
curl -s "https://mynews.com/sitemap.xml" | head -20
# 預期：XML sitemap，包含所有文章和分類的 URL
```

---

## 6. 驗證 Cron Jobs

### 6.1 Vercel 內建 Cron（若使用 Pro plan）

1. Vercel Dashboard → 專案 → **Settings** → **Cron Jobs**
2. 每小時應出現一次執行記錄
3. 點擊任一記錄可查看執行結果的 HTTP 狀態碼與回應

### 6.2 查看函數日誌

1. Vercel Dashboard → 專案 → **Observability** → **Runtime Logs**
2. 篩選 `Function: /api/crawler` 或 `Function: /api/revalidate`
3. 每次執行會輸出類似：
   ```
   [2026-06-14T08:15:00.000Z] [CRAWLER:INFO] ===== 自動新聞抓取開始 =====
   [2026-06-14T08:15:02.000Z] [CRAWLER:INFO] 解析 RSS：https://feeds.bbc.co.uk/...
   [2026-06-14T08:15:34.000Z] [CRAWLER:INFO] 結果：5 發布 / 2 攔截 / 3 重複 / 0 失敗
   ```

### 6.3 如果 Cron 沒有執行

檢查：
- `vercel.json` 中 `crons[].path` 是否指向正確的路由
- `crons[].schedule` 格式是否正確（5 欄位 cron 表達式）
- **Hobby plan 每天只執行 1 次** — 如果這個限制不滿足需求，改用下方「方案 B」

---

## 7. Vercel Hobby 免費版限制

| 限制項目 | Hobby | Pro ($20/月) |
|----------|-------|-------------|
| Cron Jobs 頻率 | **每天 1 次** | 每分鐘 |
| 函數執行時長上限 | **10 秒** | 60 秒（可調至 300 秒） |
| 函數記憶體上限 | 1024 MB | 3008 MB |
| 構建時間 | 100 小時/月 | 400 小時/月 |
| 頻寬 | 100 GB/月 | 1 TB/月 |
| ISR 重驗證 | 200 次/月（實際更寬鬆） | 無限制 |
| Serverless 函數呼叫 | 100K/月 | 1M/月 |

### 這些限制對本專案的影響

1. **Cron 每天 1 次不夠用** → 建議啟用 GitHub Actions 方案（下方第 8 節）
2. **函數 10 秒逾時**對 crawler 是瓶頸 — RSS 解析 + 內容提取 + WordPress 發布，10 秒內最多處理 1–2 篇文章。兩個解決方案：
   - 升級到 Pro（函數上限變 60 秒，可處理 10 篇文章）
   - 使用 GitHub Actions 觸發 + 增加 `maxDuration` 參數（雖然 Hobby 仍受限 10s，但 GitHub Actions 本身不消耗 Vercel 函數配額）
3. **100 小時構建** — 對於一個新聞網站，如果設定 ISR 得當（文章頁 1 小時、首頁 5 分鐘），每天構建次數不會很多，100 小時足夠

---

## 8. GitHub Actions — 免費定時觸發替代方案

如果 Hobby plan 的每天 1 次 cron 不滿足需求，以下是用 GitHub Actions 實現每小時 1 次抓取的方法。

### 8.1 工作原理

```
GitHub Actions (排程觸發)
  │ cron: '15 * * * *'（每小時第 15 分鐘）
  │
  └─→ curl GET https://mynews.com/api/crawler?secret=xxx
        │
        └─→ Vercel Serverless Function 執行抓取
             （函數執行在 Vercel 端，不消耗 Actions 運算額度）
```

### 8.2 設定步驟

**步驟 1**：在 GitHub Actions 中設定 Secrets

GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**：

| Secret Name | Value |
|-------------|-------|
| `VERCEL_CRAWLER_URL` | `https://mynews.com/api/crawler` |
| `VERCEL_CRON_SECRET` | 與 Vercel 環境變數中的 `CRON_SECRET` 相同 |

**步驟 2**：將 `.github/workflows/cron-crawler.yml` 推送到倉庫

檔案已在專案中，確認已 commit：
```bash
git add .github/workflows/cron-crawler.yml
git commit -m "add GitHub Actions cron crawler as Hobby plan workaround"
git push
```

**步驟 3**：驗證

GitHub repo → **Actions** → 找到 **定時新聞抓取** → **Run workflow** → 手動觸發一次測試。

### 8.3 GitHub Actions 配額（免費）

| 項目 | 配額 |
|------|------|
| 執行分鐘數 | 2000 分鐘/月（公開倉庫無限） |
| 並行執行數 | 20 |
| 排程觸發 | 無限制 |

每次 curl 觸發只需約 1 秒 Actions 時間，每月 24×30=720 次執行 ≈ 12 分鐘，遠在免費配額內。

---

## 9. WordPress Webhook → Vercel ISR 重驗證

在 WordPress 的 `functions.php` 中加入以下程式碼，使文章發布/更新時自動觸發 Vercel 重建緩存：

```php
/**
 * 文章更新時通知 Vercel 重驗證 ISR 緩存
 */
add_action('post_updated', function ($post_id, $post_after, $post_before) {
    if (
        $post_after->post_status !== 'publish'
        || $post_after->post_type !== 'post'
        || (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE)
    ) {
        return;
    }

    $categories = wp_get_post_terms($post_id, 'category', ['fields' => 'slugs']);

    $secret = '你的_REVALIDATE_SECRET_KEY';

    wp_remote_post('https://mynews.com/api/revalidate', [
        'headers' => [
            'Content-Type'  => 'application/json',
            'Authorization' => 'Bearer ' . $secret,
        ],
        'body' => json_encode([
            'type'       => 'post_updated',
            'slug'       => $post_after->post_name,
            'id'         => $post_id,
            'categories' => is_array($categories) ? $categories : [],
        ]),
        'timeout' => 10,
    ]);
}, 10, 3);
```

---

## 10. 常用除錯指令

```bash
# 查看 Vercel 部署日誌
vercel logs --follow

# 查看特定函數日誌
vercel logs --follow --filter "FUNCTION_NAME=/api/crawler"

# 觸發手動重新部署（不 push 新程式碼）
vercel deploy --prod

# 查看環境變數
vercel env ls

# 拉取遠端環境變數到本機
vercel env pull .env.local
```

---

## 附錄：完整的部署後檢查清單

- [ ] 首頁載入正常，顯示最新文章
- [ ] `/posts/任意slug` 顯示文章正文 + 原文來源框
- [ ] `/category/任意slug` 顯示分類文章列表
- [ ] `/search` 可輸入關鍵字搜尋
- [ ] `/takedown` 顯示侵權刪除頁面
- [ ] `/sitemap.xml` 回傳 XML（非 404）
- [ ] 導航欄的「當地時間/台北時間」切換正常
- [ ] 行動版版面正常（在手機瀏覽器開啟）
- [ ] WordPress 文章發布後，Vercel 首頁在 5 分鐘內更新
- [ ] `/api/crawler?secret=xxx` 手動觸發後 WordPress 出現新的草稿文章
- [ ] GitHub Actions workflow 至少成功執行過一次
