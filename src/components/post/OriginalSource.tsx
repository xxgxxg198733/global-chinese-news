import { ExternalLink, AlertTriangle, Globe } from 'lucide-react';
import { sanitizeExternalUrl } from '@/lib/utils';
import type { AcfFields } from '@/lib/types';

interface OriginalSourceProps {
  acfFields: AcfFields | null;
}

export function OriginalSource({ acfFields }: OriginalSourceProps) {
  if (!acfFields) return null;

  const hasSource = acfFields.originalUrl || acfFields.sourceName;

  if (!hasSource) return null;

  const safeUrl = sanitizeExternalUrl(acfFields.originalUrl);

  return (
    <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <Globe className="h-4 w-4 text-amber-600" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-amber-800">內容來源</h3>
            {acfFields.isTranslated && (
              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-700">
                翻譯內容
              </span>
            )}
          </div>

          <div className="mt-1.5 space-y-1">
            {acfFields.sourceName && (
              <p className="text-sm text-amber-700">
                來源：<span className="font-medium">{acfFields.sourceName}</span>
              </p>
            )}

            {acfFields.originalAuthor && (
              <p className="text-sm text-amber-700">
                原文作者：{acfFields.originalAuthor}
              </p>
            )}

            {safeUrl && (
              <a
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                查看原文
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 侵權提示 */}
      <div className="mt-3 flex items-start gap-2 border-t border-amber-200 pt-3">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
        <p className="text-xs leading-relaxed text-amber-600">
          如認為本文侵犯您的權利，請通過
          <a href="/takedown" className="mx-0.5 font-medium text-amber-700 underline underline-offset-2 hover:text-amber-800">
            侵權刪除頁面
          </a>
          聯繫我們，我們將在 48 小時內核實處理。
        </p>
      </div>
    </div>
  );
}
