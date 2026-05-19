"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Copy, Check, Link as LinkIcon, ShieldCheck } from "lucide-react";
import {
  buildSharePayload,
  buildShareUrl,
  encodePayload,
  getTokenSizeKb,
  type BuildShareOptions,
} from "@/lib/share-link";

interface Props {
  open: boolean;
  onClose: () => void;
  options: Omit<BuildShareOptions, "includeMood" | "userAlias">;
}

export function ShareLinkModal({ open, onClose, options }: Props) {
  const [alias, setAlias] = useState("");
  const [includeMood, setIncludeMood] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) setCopied(false);
  }, [open]);

  const { url, sizeKb, tooLarge } = useMemo(() => {
    if (!open) return { url: "", sizeKb: 0, tooLarge: false };
    const payload = buildSharePayload({
      ...options,
      includeMood,
      userAlias: alias,
    });
    const token = encodePayload(payload);
    const sizeKb = getTokenSizeKb(token);
    const url = buildShareUrl(payload);
    return { url, sizeKb, tooLarge: url.length > 6000 };
  }, [open, options, alias, includeMood]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleSystemShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: "我的习惯报告",
          text: alias ? `${alias} 的习惯报告` : "看看我最近的习惯坚持",
          url,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card p-6 w-full max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LinkIcon size={18} className="text-primary-500" />
            <h3 className="font-semibold">分享报告链接</h3>
          </div>
          <button onClick={onClose} className="btn-ghost p-1">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-zinc-500 mb-1.5">
            署名（可选）
          </label>
          <input
            className="input"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="对方看到你的名字"
            maxLength={20}
          />
        </div>

        <label className="flex items-center gap-3 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={includeMood}
            onChange={(e) => setIncludeMood(e.target.checked)}
            className="w-4 h-4 accent-primary-600"
          />
          <span className="text-sm">同时分享心情数据</span>
        </label>

        <div className="mb-4">
          <label className="block text-xs text-zinc-500 mb-1.5">
            分享链接
          </label>
          <div className="relative">
            <input
              className="input pr-20 text-xs font-mono"
              value={url}
              readOnly
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={handleCopy}
              className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 rounded-md bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 active:scale-95"
            >
              {copied ? (
                <span className="flex items-center gap-1">
                  <Check size={12} />
                  已复制
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Copy size={12} />
                  复制
                </span>
              )}
            </button>
          </div>
          <div className="text-[10px] text-zinc-400 mt-1.5 flex items-center justify-between">
            <span>链接体积 ~{sizeKb}KB</span>
            {tooLarge && (
              <span className="text-amber-500">
                ⚠️ 链接较长，建议截图分享
              </span>
            )}
          </div>
        </div>

        <div className="card p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 mb-4">
          <div className="flex items-start gap-2">
            <ShieldCheck
              size={14}
              className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
            />
            <div className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
              数据全部编码在链接里，<b>不经过任何服务器</b>。
              对方打开链接即可查看，无需账号。
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">
            关闭
          </button>
          <button onClick={handleSystemShare} className="btn-primary flex-1">
            系统分享
          </button>
        </div>
      </div>
    </div>
  );
}
