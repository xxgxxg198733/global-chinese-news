<?php
/**
 * Plugin Name:  Vercel ISR 自動重驗證
 * Description:  文章狀態變更為「已發布」時自動通知 Vercel 重新生成靜態頁面。
 *               支援：文章頁、首頁、分類頁、作者頁。
 * Version:      1.2.0
 * Author:       GCN Dev Team
 *
 * 設定方式：
 *   在 wp-config.php 中或透過環境變數設定以下常數：
 *     define('VERCEL_REVALIDATE_URL', 'https://mynews.com/api/revalidate');
 *     define('VERCEL_REVALIDATE_SECRET', '你的 REVALIDATE_SECRET_KEY');
 *
 *   或直接在下方 VERCEL_DEFAULTS 中寫入。
 */

if (!defined('ABSPATH')) exit;

// ============================================================
// 預設值（若未在 wp-config.php 中定義）
// ============================================================

$vercel_defaults = array(
    'VERCEL_REVALIDATE_URL'    => '',
    'VERCEL_REVALIDATE_SECRET' => '',
);

foreach ($vercel_defaults as $key => $default) {
    if (!defined($key)) {
        define($key, $default);
    }
}

// ============================================================
// 核心邏輯：文章狀態變更時觸發
// ============================================================

add_action('transition_post_status', 'vrop_on_status_change', 10, 3);

/**
 * @param string  $new_status 新狀態
 * @param string  $old_status 舊狀態
 * @param WP_Post $post       文章物件
 */
function vrop_on_status_change(string $new_status, string $old_status, WP_Post $post): void {
    // 只處理「文章」類型
    if ($post->post_type !== 'post') return;

    // 不是變更為「已發布」就略過
    if ($new_status !== 'publish') return;

    // 從其他狀態發布（draft→publish, pending→publish, future→publish）
    // 若已經是 publish→publish（單純更新），也要更新
    $revalidate_url    = VERCEL_REVALIDATE_URL;
    $revalidate_secret = VERCEL_REVALIDATE_SECRET;

    if (empty($revalidate_url) || empty($revalidate_secret)) {
        error_log('[Vercel ISR] 未設定 VERCEL_REVALIDATE_URL 或 VERCEL_REVALIDATE_SECRET，略過。');
        return;
    }

    $slug       = $post->post_name;
    $categories = wp_get_post_terms($post->ID, 'category', array('fields' => 'slugs'));

    if (is_wp_error($categories)) {
        $categories = array();
    }

    $payload = array(
        'type'       => 'post_updated',
        'slug'       => $slug,
        'id'         => $post->ID,
        'categories' => $categories,
    );

    $response = wp_remote_post($revalidate_url, array(
        'headers'     => array(
            'Content-Type'  => 'application/json',
            'Authorization' => 'Bearer ' . $revalidate_secret,
        ),
        'body'        => wp_json_encode($payload),
        'timeout'     => 15,
        'data_format' => 'body',
    ));

    if (is_wp_error($response)) {
        error_log('[Vercel ISR] 請求失敗 — slug: ' . $slug . ' — ' . $response->get_error_message());
        return;
    }

    $code = wp_remote_retrieve_response_code($response);
    $body = wp_remote_retrieve_body($response);

    error_log('[Vercel ISR] slug: ' . $slug . ' — HTTP ' . $code . ' — ' . $body);
}

// ============================================================
// 批量重驗證所有頁面（管理員手動觸發）
// ============================================================

add_action('admin_post_vrop_revalidate_all', 'vrop_handle_bulk_revalidate');

function vrop_handle_bulk_revalidate(): void {
    if (!current_user_can('manage_options')) {
        wp_die('權限不足。');
    }

    $revalidate_url    = VERCEL_REVALIDATE_URL;
    $revalidate_secret = VERCEL_REVALIDATE_SECRET;

    if (empty($revalidate_url) || empty($revalidate_secret)) {
        wp_die('未設定 VERCEL_REVALIDATE_URL 或 VERCEL_REVALIDATE_SECRET。');
    }

    $all_posts = get_posts(array(
        'post_type'      => 'post',
        'post_status'    => 'publish',
        'posts_per_page' => 500,
        'orderby'        => 'date',
        'order'          => 'DESC',
        'fields'         => array('post_name', 'ID'),
    ));

    $all_categories = get_terms(array(
        'taxonomy'   => 'category',
        'hide_empty' => true,
        'fields'     => 'slugs',
    ));

    $results = array();
    $total   = 0;

    // 首頁
    $resp = vrop_send_revalidate($revalidate_url, $revalidate_secret, array(
        'type' => 'all',
    ));
    $results[] = array('path' => '/ (首頁)', 'code' => $resp['code']);
    $total++;

    // 所有文章
    foreach ($all_posts as $p) {
        $resp = vrop_send_revalidate($revalidate_url, $revalidate_secret, array(
            'type' => 'post_updated',
            'slug' => $p->post_name,
            'id'   => $p->ID,
        ));
        $results[] = array('path' => '/posts/' . $p->post_name, 'code' => $resp['code']);
        $total++;
    }

    // 所有分類
    foreach ($all_categories as $slug) {
        $resp = vrop_send_revalidate($revalidate_url, $revalidate_secret, array(
            'type' => 'category_updated',
            'slug' => $slug,
        ));
        $results[] = array('path' => '/category/' . $slug, 'code' => $resp['code']);
        $total++;
    }

    // 轉回設定頁（這裡只作簡單輸出）
    echo '<h1>Vercel ISR 批量重驗證結果</h1>';
    echo '<p>共處理 ' . $total . ' 個路徑。</p>';
    echo '<table border="1" cellpadding="6" cellspacing="0">';
    echo '<tr><th>路徑</th><th>HTTP</th></tr>';
    foreach ($results as $r) {
        $color = ($r['code'] >= 200 && $r['code'] < 300) ? 'green' : 'red';
        echo '<tr><td>' . esc_html($r['path']) . '</td><td style="color:' . $color . ';">' . intval($r['code']) . '</td></tr>';
    }
    echo '</table>';
    exit;
}

function vrop_send_revalidate(string $url, string $secret, array $payload): array {
    $response = wp_remote_post($url, array(
        'headers'     => array(
            'Content-Type'  => 'application/json',
            'Authorization' => 'Bearer ' . $secret,
        ),
        'body'    => wp_json_encode($payload),
        'timeout' => 15,
    ));

    if (is_wp_error($response)) {
        return array('code' => 0, 'error' => $response->get_error_message());
    }

    return array('code' => wp_remote_retrieve_response_code($response));
}

// ============================================================
// 在後台文章列表顯示重驗證狀態欄
// ============================================================

add_filter('manage_posts_columns', 'vrop_add_column');
add_action('manage_posts_custom_column', 'vrop_render_column', 10, 2);

function vrop_add_column(array $columns): array {
    $new = array();
    foreach ($columns as $key => $val) {
        $new[$key] = $val;
        if ($key === 'title') {
            $new['vercel_isr'] = 'Vercel ISR';
        }
    }
    return $new;
}

function vrop_render_column(string $column, int $post_id): void {
    if ($column !== 'vercel_isr') return;

    $secret = VERCEL_REVALIDATE_SECRET;
    $url    = VERCEL_REVALIDATE_URL;

    if (empty($secret) || empty($url)) {
        echo '<span style="color:#999;">未設定</span>';
        return;
    }

    $post = get_post($post_id);
    if (!$post || $post->post_status !== 'publish') {
        echo '<span style="color:#999;">—</span>';
        return;
    }

    // 提供手動重驗證連結（GET 方式，簡化版）
    $manual_url = add_query_arg(array(
        'secret' => urlencode($secret),
        'type'   => 'post_updated',
        'slug'   => urlencode($post->post_name),
    ), $url);

    printf(
        '<a href="%s" target="_blank" style="color:#0073aa;" title="手動觸發 Vercel 重驗證此文章">重新驗證</a>',
        esc_url($manual_url)
    );
}
