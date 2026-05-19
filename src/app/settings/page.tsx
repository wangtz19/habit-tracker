"use client";

import { useEffect, useRef, useState } from "react";

import {
  Download,
  Upload,
  Sun,
  Moon,
  Monitor,
  Trash2,
  Heart,
  Info,
  Bell,
  Archive,
  Trophy,
  FileBarChart2,
  ChevronRight,
  Keyboard,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useHabitStore } from "@/store/habits";
import { useTheme } from "@/components/ThemeProvider";
import type { ExportData } from "@/types";
import { cn } from "@/lib/utils";
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
} from "@/lib/notifications";

export default function SettingsPage() {
  const habits = useHabitStore((s) => s.habits);
  const checkins = useHabitStore((s) => s.checkins);
  const load = useHabitStore((s) => s.load);
  const loaded = useHabitStore((s) => s.loaded);
  const importData = useHabitStore((s) => s.importData);
  const clearAll = useHabitStore((s) => s.clearAll);
  const { theme, setTheme } = useTheme();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>("default");

  useEffect(() => {
    setNotifPerm(getNotificationPermission());
  }, []);

  const handleEnableNotification = async () => {
    const perm = await requestNotificationPermission();
    setNotifPerm(perm);
    if (perm === "granted") {
      showMessage("通知已开启 ✓");
    } else {
      showMessage("通知权限被拒绝");
    }
  };

  useEffect(() => {
    if (!loaded) load();
  }, [load, loaded]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2500);
  };

  const handleExport = () => {
    const data: ExportData = {
      version: 1,
      exportedAt: Date.now(),
      habits,
      checkins,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habits-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showMessage("数据已导出 ✓");
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as ExportData;
      if (!data.habits || !data.checkins) throw new Error("文件格式无效");
      if (!confirm(`将导入 ${data.habits.length} 个习惯和 ${data.checkins.length} 条打卡记录，并覆盖现有数据。继续？`)) {
        e.target.value = "";
        return;
      }
      await importData({ habits: data.habits, checkins: data.checkins });
      showMessage("数据已导入 ✓");
    } catch (err) {
      showMessage("导入失败：文件格式错误");
    }
    e.target.value = "";
  };

  return (
    <div className="animate-fade-in pb-6">
      <h1 className="text-2xl font-bold mb-5">设置</h1>

      <Section title="探索">
        <div className="space-y-2">
          <NavRow
            icon={<Sparkles size={18} className="text-fuchsia-500" />}
            label="关联洞察"
            description="发现你的隐藏行为模式"
            href="/insights"
          />
          <NavRow
            icon={<Trophy size={18} className="text-amber-500" />}
            label="成就徽章"
            description="解锁你的坚持勋章"
            href="/achievements"
          />
          <NavRow
            icon={<FileBarChart2 size={18} className="text-primary-500" />}
            label="回顾报告"
            description="周报与月报，可分享链接 / 图片"
            href="/reports"
          />
          <NavRow
            icon={<Archive size={18} className="text-zinc-500" />}
            label="已归档习惯"
            description="恢复或永久删除"
            href="/archive"
          />
        </div>
      </Section>

      <Section title="通知">
        {!isNotificationSupported() ? (
          <div className="card p-4 text-sm text-zinc-500">
            当前浏览器不支持通知
          </div>
        ) : notifPerm === "granted" ? (
          <div className="card p-4 flex items-center gap-3">
            <Bell size={18} className="text-emerald-500" />
            <div className="flex-1 text-sm">
              <div className="font-medium">通知已开启</div>
              <div className="text-xs text-zinc-500 mt-0.5">
                在习惯设置中可配置提醒时间
              </div>
            </div>
          </div>
        ) : notifPerm === "denied" ? (
          <div className="card p-4 text-sm">
            <div className="font-medium mb-1">通知被拒绝</div>
            <div className="text-xs text-zinc-500">
              请在浏览器设置中手动开启通知权限
            </div>
          </div>
        ) : (
          <button
            onClick={handleEnableNotification}
            className="card w-full p-4 flex items-center gap-3 text-left hover:shadow-md transition-all"
          >
            <Bell size={18} className="text-primary-500" />
            <div className="flex-1">
              <div className="font-medium text-sm">开启通知</div>
              <div className="text-xs text-zinc-500 mt-0.5">
                到点提醒你打卡（PWA 装机后效果最佳）
              </div>
            </div>
          </button>
        )}
      </Section>

      <Section title="主题">
        <div className="flex gap-2">
          <ThemeButton
            active={theme === "light"}
            onClick={() => setTheme("light")}
            icon={<Sun size={16} />}
            label="浅色"
          />
          <ThemeButton
            active={theme === "dark"}
            onClick={() => setTheme("dark")}
            icon={<Moon size={16} />}
            label="深色"
          />
          <ThemeButton
            active={theme === "system"}
            onClick={() => setTheme("system")}
            icon={<Monitor size={16} />}
            label="跟随系统"
          />
        </div>
      </Section>

      <Section title="数据">
        <div className="space-y-2">
          <ActionRow
            icon={<Download size={18} />}
            label="导出数据（JSON）"
            description="备份你的所有习惯和打卡记录"
            onClick={handleExport}
          />
          <ActionRow
            icon={<Upload size={18} />}
            label="导入数据（JSON）"
            description="从备份文件恢复，会覆盖现有数据"
            onClick={handleImportClick}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImport}
          />
          <ActionRow
            icon={<Trash2 size={18} />}
            label="清空所有数据"
            description="删除全部习惯和打卡记录，不可恢复"
            onClick={() => setConfirmClear(true)}
            danger
          />
        </div>
      </Section>

      <Section title="数据统计">
        <div className="card p-4 text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
          <div>📌 习惯数：{habits.length}</div>
          <div>✅ 打卡记录：{checkins.length} 条</div>
          <div>💾 数据存储：本地浏览器（IndexedDB）</div>
        </div>
      </Section>

      <Section title="提示">
        <div className="card p-4 text-sm space-y-2">
          <div className="flex items-start gap-2">
            <Keyboard size={16} className="text-zinc-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium text-xs">键盘快捷键</div>
              <div className="text-xs text-zinc-500 mt-0.5">
                桌面端按 <kbd className="px-1 font-mono">?</kbd> 查看快捷键列表
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="text-xs text-zinc-500 pl-6">
              💡 长按习惯卡片可记录心情和备注
            </div>
          </div>
        </div>
      </Section>

      <Section title="关于">
        <div className="card p-4 space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-primary-500 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">原子习惯 · Atomic Habits</div>
              <div className="text-xs text-zinc-500 mt-0.5">
                基于《原子习惯》方法论的极简打卡工具
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 text-zinc-600 dark:text-zinc-400">
            <Heart size={16} className="text-red-500 mt-0.5 shrink-0" />
            <div className="text-xs leading-relaxed">
              所有数据仅保存在你自己的设备本地，不会上传任何服务器。
              <br />
              请定期导出备份，避免清理浏览器数据时丢失。
            </div>
          </div>
        </div>
      </Section>

      {message && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-full text-sm shadow-lg animate-fade-in z-50">
          {message}
        </div>
      )}

      {confirmClear && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setConfirmClear(false)}
        >
          <div
            className="card p-6 w-full max-w-sm animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-2">清空所有数据？</h3>
            <p className="text-sm text-zinc-500 mb-4">
              所有习惯和打卡记录将永久删除，不可恢复。建议先导出备份。
            </p>
            <div className="flex gap-2">
              <button
                className="btn-secondary flex-1"
                onClick={() => setConfirmClear(false)}
              >
                取消
              </button>
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-all"
                onClick={async () => {
                  await clearAll();
                  setConfirmClear(false);
                  showMessage("已清空");
                }}
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavRow({
  icon,
  label,
  description,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="card w-full p-4 flex items-center gap-3 text-left hover:shadow-md transition-all active:scale-[0.99]"
    >
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-zinc-500 mt-0.5">{description}</div>
      </div>
      <ChevronRight size={16} className="text-zinc-400 shrink-0" />
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3 px-1">
        {title}
      </h2>
      {children}
    </div>
  );
}

function ThemeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center gap-1 py-3 rounded-lg border transition-all",
        active
          ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400"
          : "border-zinc-200 dark:border-zinc-800"
      )}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}

function ActionRow({
  icon,
  label,
  description,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "card w-full p-4 flex items-center gap-3 text-left hover:shadow-md transition-all active:scale-[0.99]",
        danger && "text-red-500"
      )}
    >
      <div className={cn("shrink-0", danger ? "text-red-500" : "text-primary-500")}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{label}</div>
        <div className={cn("text-xs mt-0.5", danger ? "text-red-400" : "text-zinc-500")}>
          {description}
        </div>
      </div>
    </button>
  );
}
