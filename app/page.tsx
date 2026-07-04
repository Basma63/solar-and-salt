'use client';

import Link from 'next/link';
import { Fuel, Droplets, BarChart3 } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 safe-top safe-bottom">
      <div className="max-w-lg mx-auto">
        <header className="text-center mb-8 pt-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            نظام الإدارة
          </h1>
          <p className="text-slate-500">إدارة السولار ومغسلة الملح</p>
        </header>

        <div className="space-y-4 mt-12">
          <Link
            href="/diesel"
            className="block group"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 shadow-lg shadow-blue-500/25 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-500/30 group-active:scale-[0.98]">
              <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Fuel className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      إدارة السولار
                    </h2>
                    <p className="text-blue-100 text-sm">
                      إدارة حركة السولار اليومية
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </div>
          </Link>

          <Link
            href="/salt"
            className="block group"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 to-teal-700 p-6 shadow-lg shadow-teal-500/25 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-teal-500/30 group-active:scale-[0.98]">
              <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Droplets className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      إدارة مغسلة الملح
                    </h2>
                    <p className="text-teal-100 text-sm">
                      إدارة إنتاج وتوزيع الملح
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </div>
          </Link>

          <Link
            href="/reports"
            className="block group"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-600 to-slate-800 p-6 shadow-lg shadow-slate-500/25 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-slate-500/30 group-active:scale-[0.98]">
              <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      التقارير
                    </h2>
                    <p className="text-slate-100 text-sm">
                      تقارير شاملة وتصدير البيانات
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </div>
          </Link>
        </div>

        <footer className="text-center mt-16 pb-4">
          <p className="text-slate-400 text-sm">
            {new Date().toLocaleDateString('ar-EG', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </footer>
      </div>
    </main>
  );
}
