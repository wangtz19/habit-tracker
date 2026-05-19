export const QUOTES: Array<{ text: string; author: string }> = [
  { text: "每天进步 1%，一年后强大 37 倍。", author: "James Clear" },
  { text: "你不是上升到目标的高度，而是下降到系统的水平。", author: "James Clear" },
  { text: "我们都是自己习惯的产物。", author: "亚里士多德" },
  { text: "习惯起初只是蛛丝，最后变成绳索。", author: "西班牙谚语" },
  { text: "种一棵树最好的时间是十年前，其次是现在。", author: "中国谚语" },
  { text: "千里之行，始于足下。", author: "老子" },
  { text: "不积跬步无以至千里。", author: "荀子" },
  { text: "复利是世界第八大奇迹。", author: "爱因斯坦" },
  { text: "成功不是终点，失败不是终结，唯有勇气永恒。", author: "丘吉尔" },
  { text: "微小的努力，重复的积累，造就非凡的人生。", author: "佚名" },
  { text: "你以为你在塑造习惯，其实习惯也在塑造你。", author: "佚名" },
  { text: "习惯是第二天性，强于第一天性。", author: "蒙田" },
  { text: "我们重复做的事情决定了我们。卓越不是行为，而是习惯。", author: "亚里士多德" },
  { text: "持续比强度更重要。", author: "Cal Newport" },
  { text: "动机是开始的火花，习惯是燃烧的柴。", author: "佚名" },
  { text: "如果你想要不一样的结果，就需要不一样的行动。", author: "佚名" },
  { text: "环境塑造行为。", author: "BJ Fogg" },
  { text: "从 2 分钟开始。", author: "James Clear" },
  { text: "完成比完美更重要。", author: "Sheryl Sandberg" },
  { text: "你不需要变得伟大才能开始，但你需要开始才能变得伟大。", author: "Zig Ziglar" },
];

export function getQuoteOfDay(dateKey: string): { text: string; author: string } {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) % 2147483647;
  }
  return QUOTES[hash % QUOTES.length];
}
