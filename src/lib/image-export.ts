import { domToPng, domToBlob } from "modern-screenshot";

export interface CaptureOptions {
  scale?: number;
  backgroundColor?: string;
  filename?: string;
}

const COMMON_OPTIONS = {
  scale: 2,
  features: {
    removeControlCharacter: false,
  },
  fetch: {
    bypassingCache: true,
  },
};

function detectBackground(el: HTMLElement): string {
  const isDark = document.documentElement.classList.contains("dark");
  return isDark ? "#0a0a0a" : "#ffffff";
}

export async function captureToDataUrl(
  el: HTMLElement,
  options: CaptureOptions = {}
): Promise<string> {
  return domToPng(el, {
    ...COMMON_OPTIONS,
    scale: options.scale ?? 2,
    backgroundColor: options.backgroundColor ?? detectBackground(el),
  });
}

export async function downloadAsImage(
  el: HTMLElement,
  options: CaptureOptions = {}
): Promise<void> {
  const dataUrl = await captureToDataUrl(el, options);
  const link = document.createElement("a");
  link.download = options.filename ?? `habit-${new Date().toISOString().slice(0, 10)}.png`;
  link.href = dataUrl;
  link.click();
}

export async function captureToBlob(
  el: HTMLElement,
  options: CaptureOptions = {}
): Promise<Blob | null> {
  return domToBlob(el, {
    ...COMMON_OPTIONS,
    scale: options.scale ?? 2,
    backgroundColor: options.backgroundColor ?? detectBackground(el),
  });
}

export async function shareImage(
  el: HTMLElement,
  options: CaptureOptions & { title?: string; text?: string } = {}
): Promise<"shared" | "downloaded" | "failed"> {
  try {
    const blob = await captureToBlob(el, options);
    if (!blob) throw new Error("Failed to capture");

    const filename = options.filename ?? `habit-report-${new Date().toISOString().slice(0, 10)}.png`;
    const file = new File([blob], filename, { type: "image/png" });

    if (
      typeof navigator !== "undefined" &&
      "share" in navigator &&
      "canShare" in navigator &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: options.title ?? "我的习惯报告",
        text: options.text,
      });
      return "shared";
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return "downloaded";
  } catch (err) {
    console.error("shareImage failed:", err);
    return "failed";
  }
}
