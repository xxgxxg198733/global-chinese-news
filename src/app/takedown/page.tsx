import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';
import { AlertTriangle, Mail, Clock, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: `侵權刪除 | ${SITE_NAME}`,
  description:
    '如認為本站內容侵犯您的權利，請通過本頁面聯繫我們進行刪除處理。',
};

export default function TakedownPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* 頁面標題 */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <Shield className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">侵權刪除申請</h1>
        <p className="mt-2 text-gray-500">DMCA / 版權侵權內容移除請求</p>
      </div>

      {/* 說明 */}
      <div className="mb-10 space-y-6 text-sm leading-relaxed text-gray-700">
        <p>
          {SITE_NAME}（以下簡稱「本站」）尊重智慧財產權。本站的內容主要來自以下來源：
        </p>

        <ul className="ml-6 list-disc space-y-1.5 text-gray-600">
          <li>合作媒體授權轉載的內容</li>
          <li>本站編輯團隊原創報導</li>
          <li>網友投稿與讀者來信</li>
          <li>合理使用的引用內容（附原文連結與來源標註）</li>
        </ul>

        <p>
          如果您認為本站的某些內容侵犯了您的版權或其他權利，您可以通過以下方式向我們提出刪除請求。
          我們承諾在接到有效通知後的 <strong className="text-red-600">48 小時內</strong> 進行核實與處理。
        </p>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <h3 className="text-sm font-semibold text-amber-800">⚠️ 重要提示</h3>
              <p className="mt-1 text-sm text-amber-700">
                請確保您的請求是真實且善意的。提交虛假的侵權聲明可能會承擔法律責任。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 申請所需資訊 */}
      <div className="mb-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          申請刪除時請提供以下資訊：
        </h2>

        <ol className="space-y-4 text-sm text-gray-600">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
              1
            </span>
            <div>
              <strong className="text-gray-800">權利人身份證明：</strong>
              您的姓名/公司名稱、聯絡方式（電子郵件、電話）。
            </div>
          </li>

          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
              2
            </span>
            <div>
              <strong className="text-gray-800">侵權內容的具體 URL：</strong>
              請提供本站中包含涉嫌侵權內容的完整網頁連結。
            </div>
          </li>

          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
              3
            </span>
            <div>
              <strong className="text-gray-800">原創作品的證明：</strong>
              提供您的原創作品的連結或其他證明，以確認您的權利。
            </div>
          </li>

          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
              4
            </span>
            <div>
              <strong className="text-gray-800">善意聲明：</strong>
              聲明您真誠地認為該內容的使用未經您或版權持有人的授權。
            </div>
          </li>

          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
              5
            </span>
            <div>
              <strong className="text-gray-800">準確性聲明：</strong>
              聲明您提供的資訊是準確的，且您是權利人或被授權代表權利人。
            </div>
          </li>
        </ol>
      </div>

      {/* 聯絡方式 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4">
          <Mail className="mt-0.5 h-5 w-5 text-red-500" />
          <div>
            <h3 className="text-sm font-semibold text-gray-800">電子郵件</h3>
            <p className="mt-0.5 text-sm text-gray-600">
              copyright@mynews.com
            </p>
            <p className="mt-1 text-xs text-gray-400">
              請在郵件主旨中標註「侵權刪除申請」
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4">
          <Clock className="mt-0.5 h-5 w-5 text-red-500" />
          <div>
            <h3 className="text-sm font-semibold text-gray-800">處理時效</h3>
            <p className="mt-0.5 text-sm text-gray-600">
              收到完整申請後 <strong className="text-red-600">48 小時內</strong> 處理
            </p>
            <p className="mt-1 text-xs text-gray-400">
              工作日內通常更快回應
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center text-xs text-gray-400">
        <p>
          本頁面最後更新於 2024 年 1 月。本站保留對本政策的最终解釋權。
        </p>
      </div>
    </div>
  );
}
