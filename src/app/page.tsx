import Link from 'next/link';
import { Download, Star, Monitor, Apple, Smartphone, Shield, Wrench, Code, Globe } from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';
import type { Software } from '@/lib/types';

const FEATURED: Software[] = [
  { id:'1', name:'CCleaner', slug:'ccleaner', version:'6.28', size:'28.5 MB', platform:['windows','mac'], category:'system', description:'世界知名的系统清理优化工具，清除垃圾文件、修复注册表、管理启动项。', longDescription:'', icon:'🧹', screenshots:[], downloadUrl:'#', officialSite:'https://ccleaner.com', license:'免费/付费', language:['简体中文'], updateDate:'2026-06-10', downloads:2850000, rating:4.7, tags:['清理','优化'] },
  { id:'2', name:'VS Code', slug:'vscode', version:'1.95', size:'98.2 MB', platform:['windows','mac','linux'], category:'dev', description:'微软推出的免费开源代码编辑器，支持海量插件，前端后端开发首选。', longDescription:'', icon:'📝', screenshots:[], downloadUrl:'#', officialSite:'https://code.visualstudio.com', license:'免费', language:['简体中文'], updateDate:'2026-06-12', downloads:8900000, rating:4.9, tags:['编辑器','IDE'] },
  { id:'3', name:'7-Zip', slug:'7zip', version:'24.08', size:'1.6 MB', platform:['windows'], category:'system', description:'开源免费的压缩解压工具，支持7z/ZIP/RAR等格式，压缩率极高。', longDescription:'', icon:'📦', screenshots:[], downloadUrl:'#', officialSite:'https://7-zip.org', license:'免费开源', language:['简体中文'], updateDate:'2026-05-20', downloads:5600000, rating:4.8, tags:['压缩','解压'] },
  { id:'4', name:'火绒安全', slug:'huorong', version:'6.0', size:'22.1 MB', platform:['windows'], category:'security', description:'国产轻量级安全软件，无广告无捆绑，弹窗拦截功能深受好评。', longDescription:'', icon:'🛡️', screenshots:[], downloadUrl:'#', officialSite:'https://huorong.cn', license:'免费', language:['简体中文'], updateDate:'2026-06-08', downloads:1200000, rating:4.6, tags:['杀毒','安全'] },
  { id:'5', name:'WPS Office', slug:'wps', version:'12.8', size:'256 MB', platform:['windows','mac','android','ios'], category:'office', description:'国产办公套件，兼容 Word/Excel/PPT，个人版免费，轻量流畅。', longDescription:'', icon:'📊', screenshots:[], downloadUrl:'#', officialSite:'https://wps.cn', license:'免费/付费', language:['简体中文'], updateDate:'2026-06-01', downloads:4500000, rating:4.5, tags:['办公','文档'] },
  { id:'6', name:'PotPlayer', slug:'potplayer', version:'1.7.22230', size:'32.6 MB', platform:['windows'], category:'media', description:'韩国出品的全能视频播放器，支持几乎所有格式，解码能力极强。', longDescription:'', icon:'🎬', screenshots:[], downloadUrl:'#', officialSite:'https://potplayer.tv', license:'免费', language:['简体中文'], updateDate:'2026-06-05', downloads:3200000, rating:4.8, tags:['播放器','视频'] },
];

const platIcons: Record<string, any> = { windows: Monitor, mac: Apple, linux: Monitor, android: Smartphone, ios: Smartphone };

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">安全下载，极速体验</h1>
        <p className="text-gray-500 text-lg">收录精品软件，拒绝捆绑和广告</p>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-12">
        {CATEGORIES.map((cat) => (
          <Link key={cat.id} href={`/category/${cat.slug}`}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
            <span className="text-2xl">{cat.icon}</span>
            <span className="text-sm font-medium text-gray-700">{cat.name}</span>
            <span className="text-xs text-gray-400">{cat.count}款</span>
          </Link>
        ))}
      </div>

      {/* Featured */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
          <h2 className="text-2xl font-bold text-gray-900">热门推荐</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURED.map((sw) => (
            <Link key={sw.id} href={`/software/${sw.slug}`}
              className="group p-5 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <span className="text-3xl">{sw.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 truncate">{sw.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{sw.description}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />{sw.downloads >= 10000 ? (sw.downloads / 10000).toFixed(0) + '万' : sw.downloads}
                    </span>
                    <span>⭐ {sw.rating}</span>
                    <span>{sw.size}</span>
                    <span className="flex gap-0.5">
                      {sw.platform.map((p) => { const I = platIcons[p] || Monitor; return <I key={p} className="h-3 w-3" />; })}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent updates */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Download className="h-5 w-5 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">最近更新</h2>
        </div>
        <div className="space-y-2">
          {FEATURED.map((sw, i) => (
            <Link key={sw.id} href={`/software/${sw.slug}`}
              className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 bg-white hover:border-blue-100 hover:bg-blue-50/30 transition-all">
              <span className="text-xs text-gray-400 w-6 text-right">{i + 1}</span>
              <span className="text-2xl">{sw.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-900 hover:text-blue-600">{sw.name}</span>
                <span className="ml-2 text-xs text-gray-400">v{sw.version}</span>
              </div>
              <span className="text-xs text-gray-400 hidden sm:block">{sw.updateDate}</span>
              <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">下载</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
