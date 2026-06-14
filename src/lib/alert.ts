/**
 * Resend 郵件告警
 *
 * 使用 Resend API 發送通知郵件到管理員信箱。
 * 用於 crawler 失敗、系統異常等場景。
 *
 * Resend 免費額度：100 封/天。對告警場景完全夠用。
 *
 * 設定：
 *   1. https://resend.com → 註冊 → API Keys → 建立 key
 *   2. 在 Vercel 環境變數中設定：
 *      RESEND_API_KEY=re_xxxxx
 *      ALERT_EMAIL_FROM=alert@mynews.com
 *      ALERT_EMAIL_TO=admin@mynews.com
 */

import { Resend } from 'resend';

interface AlertPayload {
  subject: string;
  htmlBody: string;
}

/** 發送告警郵件。失敗時只 log，不拋出。 */
export async function sendAlert(payload: AlertPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERT_EMAIL_FROM;
  const to = process.env.ALERT_EMAIL_TO;

  if (!apiKey || !from || !to) {
    console.warn('[ALERT] Resend 未配置，略過郵件發送');
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      subject: `[GCN 告警] ${payload.subject}`,
      html: payload.htmlBody,
    });
    console.log(`[ALERT] 郵件已發送: ${payload.subject}`);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ALERT] 郵件發送失敗: ${msg}`);
    return false;
  }
}

/**
 * 建構 crawler 失敗的 HTML 郵件內容
 */
export function buildCrawlerAlertHtml(report: {
  runAt: string;
  itemsFailed: number;
  itemsPublished: number;
  itemsBlocked: number;
  errors: string[];
}): string {
  const errorRows =
    report.errors.length > 0
      ? report.errors.map((e) => `<tr><td style="color:#721c24;padding:4px 8px;">${escapeHtml(e)}</td></tr>`).join('')
      : '<tr><td style="color:#888;">無明細錯誤</td></tr>';

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#c41e3a;">新聞抓取異常通知</h2>
      <p>執行時間：<strong>${report.runAt}</strong></p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0;">
        <tr style="background:#f5f5f5;">
          <td style="padding:8px;">成功發布</td><td style="padding:8px;font-weight:bold;color:#155724;">${report.itemsPublished}</td>
        </tr>
        <tr>
          <td style="padding:8px;">黑名單攔截</td><td style="padding:8px;font-weight:bold;color:#856404;">${report.itemsBlocked}</td>
        </tr>
        <tr style="background:#fff5f5;">
          <td style="padding:8px;">失敗數量</td><td style="padding:8px;font-weight:bold;color:#c41e3a;">${report.itemsFailed}</td>
        </tr>
      </table>
      <h3 style="color:#333;">錯誤明細</h3>
      <table style="border-collapse:collapse;width:100%;">${errorRows}</table>
      <p style="color:#888;font-size:12px;margin-top:24px;">此郵件由 GCN 監控系統自動發送。</p>
    </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
