<?php
/**
 * Plugin Name:  人工上傳新聞
 * Plugin URI:   https://mynews.com
 * Description:  供編輯手動上傳新聞，內建版權風險檢查、站內去重檢測、待審核工作流。
 * Version:      1.1.0
 * Author:       GCN Dev Team
 * Author URI:   https://mynews.com
 * License:      GPL-2.0+
 * Text Domain:  manual-news-upload
 * Domain Path:  /languages
 *
 * 權限：管理員 (administrator) 與編輯 (editor) 可存取。
 */

// 防止直接存取
if (!defined('ABSPATH')) {
    exit('Direct access denied.');
}

// ============================================================
// 常數
// ============================================================

define('MNU_VERSION', '1.1.0');
define('MNU_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MNU_PLUGIN_URL', plugin_dir_url(__FILE__));
define('MNU_SLUG', 'manual-news-upload');
define('MNU_CAPABILITY', 'edit_others_posts');    // editor 以上

// ============================================================
// Hook 註冊
// ============================================================

add_action('admin_menu', 'mnu_register_admin_menu');
add_action('admin_enqueue_scripts', 'mnu_enqueue_assets');
add_action('wp_ajax_mnu_check_domain_risk', 'mnu_ajax_check_domain_risk');
add_action('wp_ajax_mnu_check_similarity', 'mnu_ajax_check_similarity');
add_action('admin_post_mnu_submit_news', 'mnu_handle_submission');
add_action('admin_notices', 'mnu_render_admin_notices');

// ============================================================
// 管理選單註冊
// ============================================================

function mnu_register_admin_menu(): void {
    add_menu_page(
        '人工上傳新聞',
        '人工上傳新聞',
        MNU_CAPABILITY,
        MNU_SLUG,
        'mnu_render_page',
        'dashicons-edit-page',
        10
    );
}

// ============================================================
// 載入 CSS / JS
// ============================================================

function mnu_enqueue_assets(string $hook_suffix): void {
    // 只在我們自己的頁面載入
    if (strpos($hook_suffix, MNU_SLUG) === false) {
        return;
    }

    // WordPress 內建媒體上傳
    wp_enqueue_media();

    // 自訂 JS
    wp_enqueue_script(
        'mnu-upload-js',
        MNU_PLUGIN_URL . 'assets/manual-news-upload.js',
        array('jquery', 'media-views'),
        MNU_VERSION,
        true
    );

    // 向 JS 傳遞變數
    wp_localize_script('mnu-upload-js', 'MNU_Ajax', array(
        'ajax_url'          => admin_url('admin-ajax.php'),
        'nonce_domain'      => wp_create_nonce('mnu_domain_check_nonce'),
        'nonce_similarity'  => wp_create_nonce('mnu_similarity_check_nonce'),
        'nonce_submit'      => wp_create_nonce('mnu_submit_nonce'),
        'risk_domains'      => mnu_get_risk_domains(),
        'text_risk_warning' => __('⚠ 該網站版權保護嚴格，請確認已獲授權或進行深度改寫。', MNU_SLUG),
        'text_checking'     => __('檢查中…', MNU_SLUG),
    ));

    // 精簡內聯樣式
    wp_add_inline_style('wp-admin', mnu_inline_css());
}

// ============================================================
// 風險域名清單
// ============================================================

function mnu_get_risk_domains(): array {
    return array(
        'bbc.com', 'bbc.co.uk',
        'reuters.com',
        'apnews.com',
        'bloomberg.com',
        'wsj.com',
        'caixin.com',
        'thepaper.cn',
        'nytimes.com',
        'washingtonpost.com',
        'ft.com',
        'economist.com',
        'dw.com',
        'france24.com',
        'aljazeera.com',
    );
}

// ============================================================
// 內聯 CSS
// ============================================================

function mnu_inline_css(): string {
    return '
        .mnu-wrap { max-width:860px; margin:20px 0; }
        .mnu-wrap h1 { font-size:1.5rem; margin-bottom:1rem; }
        .mnu-form-table { width:100%; }
        .mnu-form-table th { width:120px; padding:12px 10px 12px 0; vertical-align:top; text-align:right; font-weight:600; }
        .mnu-form-table td { padding:8px 0; }
        .mnu-form-table input[type="text"],
        .mnu-form-table input[type="url"] { width:100%; max-width:520px; }
        .mnu-form-table select { min-width:200px; }
        .mnu-field-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .mnu-btn { cursor:pointer; }
        .mnu-btn-secondary { margin-left:6px; }
        .mnu-thumb-preview { max-width:200px; margin-top:8px; border:1px solid #ddd; border-radius:4px; display:none; }
        .mnu-check-result { margin-top:6px; padding:8px 12px; border-radius:4px; font-size:13px; display:none; }
        .mnu-check-result.warning { background:#fff3cd; border:1px solid #ffc107; color:#856404; display:block; }
        .mnu-check-result.safe { background:#d4edda; border:1px solid #c3e6cb; color:#155724; display:block; }
        .mnu-check-result.error { background:#f8d7da; border:1px solid #f5c6cb; color:#721c24; display:block; }
        .mnu-disclaimer-preview { margin-top:8px; padding:10px 12px; background:#f8f9fa; border-left:4px solid #6c757d; font-size:12px; color:#555; display:none; }
        .mnu-submit-area { margin-top:24px; padding:16px 20px; background:#f8f9fa; border:1px solid #e2e8f0; border-radius:6px; }
        .mnu-submit-area label { font-weight:500; }
        .mnu-submit-btn:disabled { opacity:0.5; cursor:not-allowed; }
    ';
}

// ============================================================
// 渲染管理頁面
// ============================================================

function mnu_render_page(): void {
    // 權限二次確認
    if (!current_user_can(MNU_CAPABILITY)) {
        wp_die('你沒有權限存取此頁面。');
    }

    $categories = get_categories(array(
        'hide_empty' => false,
        'orderby'    => 'name',
        'order'      => 'ASC',
    ));

    ?>
    <div class="wrap mnu-wrap">
        <h1>人工上傳新聞</h1>
        <p class="description">填寫以下欄位後提交，文章將以 <strong>「待審核」</strong> 狀態存入後台。</p>

        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" id="mnu-upload-form">
            <?php wp_nonce_field('mnu_submit_action', 'mnu_submit_nonce'); ?>
            <input type="hidden" name="action" value="mnu_submit_news">

            <table class="mnu-form-table">
                <!-- 標題 -->
                <tr>
                    <th><label for="mnu-title">標題 <span style="color:red">*</span></label></th>
                    <td>
                        <input type="text" id="mnu-title" name="mnu_title" required
                               placeholder="輸入新聞標題" maxlength="200">
                        <p class="description" id="mnu-title-count">0 / 200</p>
                    </td>
                </tr>

                <!-- 正文 -->
                <tr>
                    <th><label for="mnu-content">正文 <span style="color:red">*</span></label></th>
                    <td>
                        <?php
                        wp_editor('', 'mnu_content', array(
                            'textarea_name' => 'mnu_content',
                            'media_buttons' => true,
                            'textarea_rows' => 15,
                            'teeny'         => false,
                            'tinymce'       => true,
                            'quicktags'     => true,
                        ));
                        ?>
                    </td>
                </tr>

                <!-- 分類 + 標籤 -->
                <tr>
                    <th><label for="mnu-category">分類</label></th>
                    <td>
                        <div class="mnu-field-row">
                            <select id="mnu-category" name="mnu_category">
                                <option value="">— 選擇分類 —</option>
                                <?php foreach ($categories as $cat): ?>
                                    <option value="<?php echo esc_attr($cat->term_id); ?>">
                                        <?php echo esc_html($cat->name); ?>
                                        (<?php echo intval($cat->count); ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <span class="description">選擇一個主要分類</span>
                        </div>
                    </td>
                </tr>
                <tr>
                    <th><label for="mnu-tags">標籤</label></th>
                    <td>
                        <input type="text" id="mnu-tags" name="mnu_tags"
                               placeholder="多個標籤以逗號分隔，例如：科技, AI, 矽谷">
                    </td>
                </tr>

                <!-- 特色圖片 -->
                <tr>
                    <th><label>特色圖片</label></th>
                    <td>
                        <div class="mnu-field-row">
                            <button type="button" class="button mnu-btn" id="mnu-upload-thumb">
                                選擇圖片
                            </button>
                            <button type="button" class="button mnu-btn mnu-btn-secondary"
                                    id="mnu-remove-thumb" style="display:none;">
                                移除圖片
                            </button>
                            <input type="hidden" id="mnu-thumb-id" name="mnu_thumb_id">
                        </div>
                        <img id="mnu-thumb-preview" class="mnu-thumb-preview" src="" alt="預覽">
                    </td>
                </tr>

                <!-- 來源連結 + 版權檢查 -->
                <tr>
                    <th><label for="mnu-source-url">來源連結</label></th>
                    <td>
                        <div class="mnu-field-row">
                            <input type="url" id="mnu-source-url" name="mnu_source_url"
                                   placeholder="https://example.com/original-article" style="flex:1;">
                            <button type="button" class="button mnu-btn mnu-btn-secondary"
                                    id="mnu-check-domain">
                                檢查版權風險
                            </button>
                        </div>
                        <div id="mnu-domain-result" class="mnu-check-result"></div>
                        <div id="mnu-disclaimer-preview" class="mnu-disclaimer-preview"></div>
                    </td>
                </tr>
            </table>

            <!-- 去重檢測 -->
            <div style="margin-top:16px;">
                <button type="button" class="button button-secondary" id="mnu-check-similarity">
                    檢查是否與站內文章重複
                </button>
                <span id="mnu-similarity-spinner" class="spinner" style="float:none;margin:0 0 0 8px;"></span>
                <div id="mnu-similarity-result" class="mnu-check-result"></div>
            </div>

            <!-- 提交區域 -->
            <div class="mnu-submit-area">
                <label>
                    <input type="checkbox" id="mnu-confirm" name="mnu_confirm" value="1">
                    我確認已獲得合理使用授權，或內容為原創摘要改寫
                </label>
                <br><br>
                <button type="submit" class="button button-primary button-large mnu-submit-btn"
                        id="mnu-submit-btn" disabled>
                    提交審核
                </button>
                <span class="description" style="margin-left:12px;">
                    文章將以「待審核」狀態提交，由管理員審核後發布。
                </span>
            </div>
        </form>
    </div>
    <?php
}

// ============================================================
// 風險域名清單（雙重來源：硬編碼 + 過濾器可擴充）
// ============================================================

function mnu_get_all_risk_domains(): array {
    return apply_filters('mnu_risk_domains', mnu_get_risk_domains());
}

// ============================================================
// AJAX：檢查域名版權風險
// ============================================================

function mnu_ajax_check_domain_risk(): void {
    // Nonce 驗證
    if (!check_ajax_referer('mnu_domain_check_nonce', 'nonce', false)) {
        wp_send_json_error(array('message' => '安全檢查失敗，請重新整理頁面。'));
    }

    if (!current_user_can(MNU_CAPABILITY)) {
        wp_send_json_error(array('message' => '權限不足。'));
    }

    $url = isset($_POST['url']) ? trim(sanitize_text_field(wp_unslash($_POST['url']))) : '';

    if (empty($url)) {
        wp_send_json_error(array('message' => '請先輸入來源連結。'));
    }

    // 提取域名
    $host = wp_parse_url($url, PHP_URL_HOST);
    if (!$host) {
        wp_send_json_error(array('message' => '無法解析該連結，請檢查格式。'));
    }

    // 去除 www 前綴進行比對
    $host_clean = preg_replace('/^www\./', '', strtolower($host));
    $risk_domains = mnu_get_all_risk_domains();

    $is_risky = false;
    $matched_domain = '';

    foreach ($risk_domains as $risk) {
        $risk_clean = strtolower(trim($risk));
        // 精確匹配 或 子域名匹配
        if ($host_clean === $risk_clean || str_ends_with($host_clean, '.' . $risk_clean)) {
            $is_risky = true;
            $matched_domain = $risk;
            break;
        }
    }

    if ($is_risky) {
        wp_send_json_success(array(
            'risk'    => true,
            'domain'  => $matched_domain,
            'message' => sprintf(
                '⚠ 「%s」屬於高版權保護媒體。請確認你已獲得轉載授權，或對原文進行了深度改寫（改寫幅度超過 60%%）。',
                esc_html($matched_domain)
            ),
        ));
    }

    wp_send_json_success(array(
        'risk'    => false,
        'domain'  => $host_clean,
        'message' => '✓ 該域名不在高風險名單中，但仍請確保內容符合合理使用原則。',
    ));
}

// ============================================================
// AJAX：站內去重檢測（TF-IDF + 餘弦相似度）
// ============================================================

function mnu_ajax_check_similarity(): void {
    if (!check_ajax_referer('mnu_similarity_check_nonce', 'nonce', false)) {
        wp_send_json_error(array('message' => '安全檢查失敗。'));
    }

    if (!current_user_can(MNU_CAPABILITY)) {
        wp_send_json_error(array('message' => '權限不足。'));
    }

    $title   = isset($_POST['title'])   ? trim(sanitize_text_field(wp_unslash($_POST['title'])))   : '';
    $content = isset($_POST['content']) ? trim(wp_kses_post(wp_unslash($_POST['content'])))       : '';

    if (empty($title) && empty($content)) {
        wp_send_json_error(array('message' => '請先填寫標題或正文。'));
    }

    // 合併目標文字
    $target_text = mnu_normalize_text($title . ' ' . $content);
    if (mb_strlen($target_text) < 20) {
        wp_send_json_error(array('message' => '內容過短，無法進行去重檢測。'));
    }

    // 取得最近 100 篇文章
    $recent_posts = get_posts(array(
        'post_type'      => 'post',
        'post_status'    => array('publish', 'pending', 'draft'),
        'posts_per_page' => 100,
        'orderby'        => 'date',
        'order'          => 'DESC',
        'fields'         => array('ID', 'post_title', 'post_content'),
    ));

    if (empty($recent_posts)) {
        wp_send_json_success(array(
            'matches'     => array(),
            'max_score'   => 0,
            'checked_ct'  => 0,
            'message'     => '✓ 站內暫無文章，可以提交。',
        ));
    }

    // 建立目標文本的詞頻向量
    $target_tokens = mnu_tokenize($target_text);
    $target_tf     = mnu_term_frequency($target_tokens);

    $matches = array();
    $max_score = 0;

    foreach ($recent_posts as $post) {
        $candidate_text  = $post->post_title . ' ' . wp_strip_all_tags($post->post_content);
        $candidate_tokens = mnu_tokenize(mnu_normalize_text($candidate_text));
        $candidate_tf     = mnu_term_frequency($candidate_tokens);

        // 餘弦相似度
        $similarity = mnu_cosine_similarity($target_tf, $candidate_tf);

        if ($similarity > $max_score) {
            $max_score = $similarity;
        }

        // 超過閾值 0.3 時記錄
        if ($similarity > 0.30) {
            $matches[] = array(
                'id'         => $post->ID,
                'title'      => $post->post_title,
                'score'      => round($similarity, 4),
                'edit_link'  => get_edit_post_link($post->ID, 'raw'),
            );
        }
    }

    // 按相似度降序排列
    usort($matches, function ($a, $b) {
        return $b['score'] <=> $a['score'];
    });

    // 構建回傳訊息
    if (!empty($matches)) {
        $top = $matches[0];
        $message = sprintf(
            '⚠ 檢測到相似內容！與《%s》相似度 %.1f%%，請修改後再提交。',
            esc_html($top['title']),
            $top['score'] * 100
        );
        if (count($matches) > 1) {
            $message .= sprintf('（共 %d 篇相似文章）', count($matches));
        }
    } else {
        $message = sprintf(
            '✓ 未檢測到明顯重複（最高相似度 %.1f%%，共比對 %d 篇文章），可以提交。',
            $max_score * 100,
            count($recent_posts)
        );
    }

    wp_send_json_success(array(
        'matches'    => $matches,
        'max_score'  => round($max_score, 4),
        'checked_ct' => count($recent_posts),
        'message'    => $message,
    ));
}

// ============================================================
// 文字處理輔助函數
// ============================================================

/**
 * 正規化文字：繁簡轉換（僅台灣常用異體字）、去除標點、轉小寫
 */
function mnu_normalize_text(string $text): string {
    // 去除 HTML
    $text = wp_strip_all_tags($text);
    // 去除 URL
    $text = preg_replace('/https?:\/\/\S+/', '', $text);
    // 全形轉半形（字母數字部分）
    $text = mb_convert_kana($text, 'as', 'UTF-8');
    // 轉小寫
    $text = mb_strtolower($text, 'UTF-8');
    // 去除標點符號，保留中文字符、字母、數字、空格
    $text = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $text);
    // 合併多個空白
    $text = preg_replace('/\s+/', ' ', $text);
    return trim($text);
}

/**
 * 中文分詞（簡易 bigram + 單字）
 * 對於中文使用二元語法 (bigram) 捕捉詞彙組合
 */
function mnu_tokenize(string $text): array {
    $tokens = array();
    $chars  = preg_split('//u', $text, -1, PREG_SPLIT_NO_EMPTY);
    $len    = count($chars);

    for ($i = 0; $i < $len; $i++) {
        $ch = $chars[$i];
        // 跳過空白
        if (trim($ch) === '') continue;

        // 單字 token（所有語言）
        $tokens[] = $ch;

        // 中文 bigram：連續兩個 CJK 字符
        if ($i + 1 < $len) {
            $next = $chars[$i + 1];
            if (trim($next) === '') continue;
            // CJK 統一表意文字範圍
            if (mnu_is_cjk($ch) && mnu_is_cjk($next)) {
                $tokens[] = $ch . $next;
            }
        }

        // 英文單詞（連續字母或數字，以空白或標點分隔時才收集）
        // 此處依賴前面的正規化已在字母之間保留了空格
    }

    // 提取英文單詞（連續 ASCII 字母/數字）
    preg_match_all('/[a-z0-9]{2,}/', $text, $word_matches);
    foreach ($word_matches[0] as $word) {
        $tokens[] = $word;
    }

    return $tokens;
}

/** 判斷字符是否為 CJK 範圍 */
function mnu_is_cjk(string $char): bool {
    $code = mb_ord($char, 'UTF-8');
    if ($code === null) return false;
    return ($code >= 0x4E00  && $code <= 0x9FFF)  // CJK 統一表意文字
        || ($code >= 0x3400  && $code <= 0x4DBF)  // CJK 擴展 A
        || ($code >= 0x20000 && $code <= 0x2A6DF) // CJK 擴展 B
        || ($code >= 0xF900  && $code <= 0xFAFF); // CJK 相容
}

/**
 * 詞頻 (Term Frequency)
 */
function mnu_term_frequency(array $tokens): array {
    $tf = array();
    $total = count($tokens);
    if ($total === 0) return $tf;

    $counts = array_count_values($tokens);
    foreach ($counts as $term => $count) {
        $tf[$term] = $count / $total;
    }
    return $tf;
}

/**
 * 餘弦相似度 (Cosine Similarity)
 */
function mnu_cosine_similarity(array $vec_a, array $vec_b): float {
    if (empty($vec_a) || empty($vec_b)) {
        return 0.0;
    }

    // 收集所有的鍵
    $all_keys = array_unique(array_merge(array_keys($vec_a), array_keys($vec_b)));

    $dot_product = 0.0;
    $mag_a = 0.0;
    $mag_b = 0.0;

    foreach ($all_keys as $key) {
        $a = $vec_a[$key] ?? 0.0;
        $b = $vec_b[$key] ?? 0.0;

        $dot_product += $a * $b;
        $mag_a += $a * $a;
        $mag_b += $b * $b;
    }

    $mag_a = sqrt($mag_a);
    $mag_b = sqrt($mag_b);

    if ($mag_a < 1e-10 || $mag_b < 1e-10) {
        return 0.0;
    }

    return $dot_product / ($mag_a * $mag_b);
}

// ============================================================
// 表單提交處理
// ============================================================

function mnu_handle_submission(): void {
    // Nonce
    if (!isset($_POST['mnu_submit_nonce']) ||
        !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['mnu_submit_nonce'])), 'mnu_submit_action')) {
        mnu_set_notice('error', '安全驗證失敗，請重新整理頁面後再試。');
        mnu_redirect_back();
    }

    // 權限
    if (!current_user_can(MNU_CAPABILITY)) {
        mnu_set_notice('error', '權限不足，無法提交。');
        mnu_redirect_back();
    }

    // 確認勾選
    if (empty($_POST['mnu_confirm'])) {
        mnu_set_notice('error', '請勾選「已獲得合理使用授權或內容為原創摘要」。');
        mnu_redirect_back();
    }

    // 必填欄位
    $title = isset($_POST['mnu_title']) ? trim(sanitize_text_field(wp_unslash($_POST['mnu_title']))) : '';
    $content = isset($_POST['mnu_content']) ? wp_kses_post(wp_unslash($_POST['mnu_content'])) : '';

    if (empty($title)) {
        mnu_set_notice('error', '標題為必填項。');
        mnu_redirect_back();
    }
    if (empty($content) || strlen(wp_strip_all_tags($content)) < 20) {
        mnu_set_notice('error', '正文內容過短，至少需要 20 個字符。');
        mnu_redirect_back();
    }

    // 可選欄位
    $category_id = isset($_POST['mnu_category']) ? intval($_POST['mnu_category']) : 0;
    $tags_input  = isset($_POST['mnu_tags']) ? sanitize_text_field(wp_unslash($_POST['mnu_tags'])) : '';
    $thumb_id    = isset($_POST['mnu_thumb_id']) ? intval($_POST['mnu_thumb_id']) : 0;
    $source_url  = isset($_POST['mnu_source_url']) ? esc_url_raw(wp_unslash($_POST['mnu_source_url'])) : '';

    // ---- 構建免責聲明（附加至正文末尾） ----
    $disclaimer = '';
    if (!empty($source_url)) {
        $disclaimer = sprintf(
            '<hr><p style="font-size:0.9em;color:#666;">本文為編撰整理，原始來源：<a href="%s" target="_blank" rel="noopener noreferrer nofollow">%s</a>，如涉侵權請聯繫刪除。</p>',
            esc_url($source_url),
            esc_html($source_url)
        );
    } else {
        $disclaimer = '<hr><p style="font-size:0.9em;color:#666;">本文為編撰整理，如涉侵權請聯繫刪除。</p>';
    }

    $content_with_disclaimer = $content . "\n\n" . $disclaimer;

    // ---- 建立文章 ----
    $post_data = array(
        'post_title'   => $title,
        'post_content' => $content_with_disclaimer,
        'post_status'  => 'pending',          // 草稿待審
        'post_type'    => 'post',
        'post_author'  => get_current_user_id(),
        'meta_input'   => array(
            'original_url'           => $source_url,
            '_mnu_manual_upload'     => true,
            '_mnu_upload_timestamp'  => current_time('mysql'),
            '_mnu_uploader_id'       => get_current_user_id(),
        ),
    );

    // 分類
    if ($category_id > 0) {
        $post_data['post_category'] = array($category_id);
    }

    // 標籤
    if (!empty($tags_input)) {
        $post_data['tags_input'] = $tags_input;
    }

    $post_id = wp_insert_post($post_data, true);

    if (is_wp_error($post_id)) {
        mnu_set_notice('error', '文章建立失敗：' . $post_id->get_error_message());
        mnu_redirect_back();
    }

    // ---- 設定特色圖片 ----
    if ($thumb_id > 0) {
        set_post_thumbnail($post_id, $thumb_id);
    }

    // ---- ACF 自定義欄位（若 ACF 啟用） ----
    if (function_exists('update_field')) {
        if (!empty($source_url)) {
            update_field('original_url', $source_url, $post_id);
        }
        $domain = $source_url ? wp_parse_url($source_url, PHP_URL_HOST) : '';
        if ($domain) {
            update_field('source_name', $domain, $post_id);
        }
    }

    // ---- 清理暫存 ----
    clean_post_cache($post_id);

    $edit_link = get_edit_post_link($post_id, 'raw');
    mnu_set_notice('success', sprintf(
        '文章「%s」已提交審核。<a href="%s">點此編輯</a>',
        esc_html($title),
        esc_url($edit_link)
    ));

    mnu_redirect_back();
}

// ============================================================
// Admin Notice 儲存 / 渲染
// ============================================================

function mnu_set_notice(string $type, string $message): void {
    // 使用 transient，避免 redirect 後丟失
    set_transient('mnu_admin_notice', array(
        'type'    => $type,
        'message' => $message,
    ), 60);
}

function mnu_render_admin_notices(): void {
    $notice = get_transient('mnu_admin_notice');
    if (!$notice || !is_array($notice)) {
        return;
    }

    $type    = esc_attr($notice['type']);
    $message = wp_kses_post($notice['message']);

    printf(
        '<div class="notice notice-%s is-dismissible"><p>%s</p></div>',
        $type,
        $message
    );

    delete_transient('mnu_admin_notice');
}

// ============================================================
// 輔助：重定向回上傳頁面
// ============================================================

function mnu_redirect_back(): void {
    $redirect_url = admin_url('admin.php?page=' . MNU_SLUG);
    wp_safe_redirect($redirect_url);
    exit;
}

// ============================================================
// 啟動時一次性操作
// ============================================================

register_activation_hook(__FILE__, 'mnu_activate');
function mnu_activate(): void {
    // 確保 editor 角色具備所需權限
    $editor = get_role('editor');
    if ($editor && !$editor->has_cap('edit_others_posts')) {
        $editor->add_cap('edit_others_posts');
    }
}
