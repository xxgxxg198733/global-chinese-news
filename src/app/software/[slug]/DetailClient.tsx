'use client';

import Link from 'next/link';
import { Download, Monitor, Apple, Globe, Shield, Calendar, Star, Tag, ChevronRight, ExternalLink, AlertTriangle } from 'lucide-react';
import type { Software } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

const pIcons: Record<string, any> = { windows: Monitor, mac: Apple, linux: Monitor, android: Monitor, ios: Monitor };
const pNames: Record<string, string> = { windows:'Windows', mac:'macOS', linux:'Linux', android:'Android', ios:'iOS' };

export function DetailClient({ sw }: { sw: Software }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-blue-600">首页</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/category/${sw.category}`} className="hover:text-blue-600">
          {sw.category === 'system' ? '系统工具' : sw.category === 'office' ? '办公软件' : sw.category === 'dev' ? '开发工具' : sw.category === 'security' ? '安全防护' : sw.category === 'media' ? '多媒体' : '网络工具'}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-600 truncate">{sw.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-6 mb-8 p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
        <span className="text-5xl shrink-0">{sw.icon}</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{sw.name}</h1>
          <p className="text-sm text-blue-600 font-medium mb-2">v{sw.version} · {sw.size} · {sw.license}</p>
          <p className="text-gray-600 mb-3">{sw.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />{sw.rating}</span>
            <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" />{formatNumber(sw.downloads)} 次下载</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{sw.updateDate}</span>
            <span className="flex gap-1">
              {sw.platform.map((p) => { const I = pIcons[p] || Monitor; return <I key={p} className="h-3.5 w-3.5" title={pNames[p] || p} />; })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* Main content */}
        <div>
          {/* Download button */}
          <a href={sw.downloadUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl transition-colors mb-6">
            <Download className="h-5 w-5" /> 立即下载 ({sw.size})
          </a>

          <div className="flex gap-3 mb-8">
            <a href={sw.officialSite} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600">
              <ExternalLink className="h-4 w-4" /> 官方网站
            </a>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-8">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700">
              <p className="font-medium mb-1">下载声明</p>
              <p>本站不存储任何文件，下载链接指向软件官方网站或可信镜像。如链接失效或有安全问题，请联系我们修正。软件版权归原作者所有。</p>
            </div>
          </div>

          {/* Description */}
          <h2 className="text-lg font-bold text-gray-900 mb-3">软件介绍</h2>
          <div className="text-gray-700 leading-relaxed space-y-3 mb-8">
            {sw.longDescription.split('\n').filter(Boolean).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg text-sm">
            <div><span className="text-gray-400">版本：</span><span className="text-gray-700">{sw.version}</span></div>
            <div><span className="text-gray-400">大小：</span><span className="text-gray-700">{sw.size}</span></div>
            <div><span className="text-gray-400">授权：</span><span className="text-gray-700">{sw.license}</span></div>
            <div><span className="text-gray-400">语言：</span><span className="text-gray-700">{sw.language.join(' / ')}</span></div>
            <div><span className="text-gray-400">平台：</span><span className="text-gray-700">{sw.platform.map(p => pNames[p] || p).join(' / ')}</span></div>
            <div><span className="text-gray-400">更新：</span><span className="text-gray-700">{sw.updateDate}</span></div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Tag className="h-4 w-4" /> 标签</h3>
            <div className="flex flex-wrap gap-2">
              {sw.tags.map((t) => (
                <Link key={t} href={`/search?q=${t}`}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 rounded-full transition-colors">
                  {t}
                </Link>
              ))}
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Shield className="h-4 w-4" /> 下载前须知</h3>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>• 下载前请核对文件大小和版本号</li>
              <li>• 建议从官方网站下载以获得最新版本</li>
              <li>• 如有疑问请查看软件官方网站</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
