import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-9xl font-black text-gray-100">404</h1>
      <h2 className="text-xl font-bold text-gray-800 -mt-6 mb-2">页面不存在</h2>
      <p className="text-gray-500 mb-8">您访问的页面可能已被移除或链接有误</p>
      <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-blue-600 text-white px-6 py-2.5 hover:bg-blue-700 transition-colors">
        <Home className="h-4 w-4" /> 返回首页
      </Link>
    </div>
  );
}
