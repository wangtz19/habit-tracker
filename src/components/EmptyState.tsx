"use client";

import Link from "next/link";
import { Sparkles, Plus } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="text-6xl mb-4">🌱</div>
      <h2 className="text-xl font-semibold mb-2">从一个微小的习惯开始</h2>
      <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm">
        《原子习惯》说：每天进步 1%，一年后你将强大 37 倍。
        <br />
        从这里开始你的复利成长。
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link href="/templates" className="btn-primary flex items-center justify-center gap-2">
          <Sparkles size={18} />
          从模板开始（推荐）
        </Link>
        <Link
          href="/habits/new"
          className="btn-secondary flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          自定义习惯
        </Link>
      </div>
    </div>
  );
}
