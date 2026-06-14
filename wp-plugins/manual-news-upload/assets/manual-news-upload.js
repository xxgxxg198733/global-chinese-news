/**
 * 人工上傳新聞 - 前端互動腳本
 *
 * 功能：
 *   - 來源域名版權風險檢查（AJAX）
 *   - 站內去重相似度檢測（AJAX）
 *   - WordPress 媒體庫圖片上傳
 *   - 確認勾選控制提交按鈕狀態
 *   - 來源連結變更時預覽免責聲明
 */

(function ($, win) {
  'use strict';

  // ---- DOM 快取 ----
  var $form          = $('#mnu-upload-form');
  var $titleInput    = $('#mnu-title');
  var $titleCount    = $('#mnu-title-count');
  var $sourceInput   = $('#mnu-source-url');
  var $checkDomain   = $('#mnu-check-domain');
  var $domainResult  = $('#mnu-domain-result');
  var $disclaimer    = $('#mnu-disclaimer-preview');
  var $checkSim      = $('#mnu-check-similarity');
  var $simResult     = $('#mnu-similarity-result');
  var $simSpinner    = $('#mnu-similarity-spinner');
  var $confirmBox    = $('#mnu-confirm');
  var $submitBtn     = $('#mnu-submit-btn');
  var $uploadThumb   = $('#mnu-upload-thumb');
  var $removeThumb   = $('#mnu-remove-thumb');
  var $thumbId       = $('#mnu-thumb-id');
  var $thumbPreview  = $('#mnu-thumb-preview');

  var mediaFrame = null;
  var lastDomainCheck = '';    // 避免重複請求同一域名
  var lastSimCheck    = '';    // 避免重複請求同一內容

  // ---- 字數統計 ----
  $titleInput.on('input', function () {
    var len = this.value.length;
    $titleCount.text(len + ' / 200');
    $titleCount.toggleClass('text-warning', len > 180);
  });

  // ---- 確認勾選 → 啟用提交按鈕 ----
  $confirmBox.on('change', function () {
    $submitBtn.prop('disabled', !this.checked);
  });

  // ---- 媒體上傳（特色圖片） ----
  $uploadThumb.on('click', function (e) {
    e.preventDefault();

    if (mediaFrame) {
      mediaFrame.open();
      return;
    }

    mediaFrame = wp.media({
      title:    '選擇或上傳特色圖片',
      button:   { text: '設為特色圖片' },
      library:  { type: 'image' },
      multiple: false,
    });

    mediaFrame.on('select', function () {
      var attachment = mediaFrame.state().get('selection').first().toJSON();
      $thumbId.val(attachment.id);
      $thumbPreview.attr('src', attachment.sizes && attachment.sizes.medium
        ? attachment.sizes.medium.url
        : attachment.url
      ).show();
      $removeThumb.show();
    });

    mediaFrame.open();
  });

  $removeThumb.on('click', function (e) {
    e.preventDefault();
    $thumbId.val('');
    $thumbPreview.attr('src', '').hide();
    $removeThumb.hide();
  });

  // ---- 版權風險檢查 ----
  $checkDomain.on('click', function () {
    var url = $.trim($sourceInput.val());
    if (!url) {
      showDomainResult('warning', '請先輸入來源連結。');
      return;
    }

    // 簡單 URL 格式校驗
    if (!/^https?:\/\/.+/.test(url)) {
      showDomainResult('error', '連結格式不正確，請以 http:// 或 https:// 開頭。');
      return;
    }

    // 避免同一 URL 重複檢查
    if (url === lastDomainCheck) {
      return;
    }
    lastDomainCheck = url;

    $checkDomain.prop('disabled', true).text(MNU_Ajax.text_checking);

    $.post(MNU_Ajax.ajax_url, {
      action: 'mnu_check_domain_risk',
      nonce:  MNU_Ajax.nonce_domain,
      url:    url,
    })
      .done(function (resp) {
        if (resp.success) {
          var data = resp.data;
          if (data.risk) {
            showDomainResult('warning', data.message);
          } else {
            showDomainResult('safe', data.message);
          }
        } else {
          showDomainResult('error', resp.data.message || '檢查失敗。');
        }
      })
      .fail(function () {
        showDomainResult('error', '伺服器通訊異常，請稍後再試。');
      })
      .always(function () {
        $checkDomain.prop('disabled', false).text('檢查版權風險');
      });
  });

  function showDomainResult(klass, msg) {
    $domainResult
      .removeClass('warning safe error')
      .addClass(klass)
      .html(msg);
  }

  // ---- 來源連結變更 → 預覽免責聲明 ----
  $sourceInput.on('input', function () {
    var url = $.trim(this.value);
    if (url && /^https?:\/\/.+/.test(url)) {
      $disclaimer.html(
        '<strong>文章末尾將自動附加：</strong><br>' +
        '本文為編撰整理，原始來源：<a href="' +
        escapeHtml(url) +
        '" target="_blank" rel="noopener noreferrer nofollow">' +
        escapeHtml(url) +
        '</a>，如涉侵權請聯繫刪除。'
      ).show();
    } else {
      $disclaimer.html(
        '<strong>文章末尾將自動附加：</strong><br>' +
        '本文為編撰整理，如涉侵權請聯繫刪除。'
      ).show();
    }
  });

  // ---- 去重檢測 ----
  $checkSim.on('click', function () {
    // 收集內容
    var title   = $.trim($titleInput.val());
    var content = '';

    // 嘗試從 TinyMCE 或 Quicktags 獲取正文
    if (typeof tinyMCE !== 'undefined' && tinyMCE.get('mnu_content')) {
      content = tinyMCE.get('mnu_content').getContent({ format: 'text' });
    } else {
      content = $('#mnu_content').val() || '';
    }

    if (!title && !content) {
      showSimResult('warning', '請先填寫標題或正文。');
      return;
    }

    // 避免相同內容重複檢查
    var fingerprint = title + '|' + content.slice(0, 200);
    if (fingerprint === lastSimCheck) {
      return;
    }
    lastSimCheck = fingerprint;

    $simSpinner.addClass('is-active');
    $checkSim.prop('disabled', true);
    showSimResult('', '');

    $.post(MNU_Ajax.ajax_url, {
      action:  'mnu_check_similarity',
      nonce:   MNU_Ajax.nonce_similarity,
      title:   title,
      content: content,
    })
      .done(function (resp) {
        if (resp.success) {
          var data = resp.data;
          var klass = (data.matches && data.matches.length > 0) ? 'warning' : 'safe';

          var msg = '<p>' + data.message + '</p>';

          // 列出所有相似文章
          if (data.matches && data.matches.length > 0) {
            msg += '<ul style="margin:6px 0 0 16px;list-style:disc;">';
            $.each(data.matches, function (i, m) {
              msg += '<li>';
              msg += '<strong>' + escapeHtml(m.title) + '</strong>';
              msg += ' — 相似度 ' + (m.score * 100).toFixed(1) + '%';
              if (m.edit_link) {
                msg += ' <a href="' + m.edit_link + '" target="_blank">編輯</a>';
              }
              msg += '</li>';
            });
            msg += '</ul>';
          }

          msg += '<p style="margin-top:4px;font-size:11px;color:#888;">';
          msg += '共比對 ' + data.checked_ct + ' 篇文章，最高相似度 ' + (data.max_score * 100).toFixed(1) + '%';
          msg += '</p>';

          showSimResult(klass, msg);
        } else {
          showSimResult('error', resp.data.message || '檢測失敗。');
        }
      })
      .fail(function () {
        showSimResult('error', '伺服器通訊異常，請稍後再試。');
      })
      .always(function () {
        $simSpinner.removeClass('is-active');
        $checkSim.prop('disabled', false);
      });
  });

  function showSimResult(klass, msg) {
    $simResult
      .removeClass('warning safe error')
      .addClass(klass)
      .html(msg || '');
    if (!klass) {
      $simResult.hide();
    }
  }

  // ---- 提交前最終檢查 ----
  $form.on('submit', function (e) {
    var title   = $.trim($titleInput.val());
    var content = '';

    if (typeof tinyMCE !== 'undefined' && tinyMCE.get('mnu_content')) {
      content = tinyMCE.get('mnu_content').getContent({ format: 'text' });
    } else {
      content = $('#mnu_content').val() || '';
    }

    if (!title) {
      alert('標題為必填項。');
      e.preventDefault();
      return false;
    }

    if (!content || content.length < 20) {
      alert('正文內容過短，至少需要 20 個字符。');
      e.preventDefault();
      return false;
    }

    if (!$confirmBox.is(':checked')) {
      alert('請勾選版權確認聲明。');
      e.preventDefault();
      return false;
    }

    // 允許提交
    return true;
  });

  // ---- 輔助函數 ----
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

})(jQuery, window);
