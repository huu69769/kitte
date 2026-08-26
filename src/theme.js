// 简约巴洛克风格 - 中世纪邮票美学
export const vintageLetterTheme = {
  // 背景色 - 旧纸张色系
  bg: "#f5f1e8",
  bgLight: "#faf7f1",

  // 面板 / 边框
  panel: "#efe7dc",
  line: "#d4cac0",

  // 文字
  ink: "#3d2b1f",
  dim: "#8b7d70",

  // 强调色
  accent: "#8b4513",     // 赭褐色（按钮）
  gold: "#c9a24b",       // 金色（装饰线）

  // 邮票相关颜色
  stamp: {
    red: "#a0522d",
    redHi: "#cd853f",
    redDk: "#704214",
    paper: "#faf7f1",    // 旧纸浅色
    paperDk: "#e8dcc8",  // 旧纸深色
    slot: "#3d2b1f",     // 深色槽
    brass: "#c9a24b",    // 黄铜色装饰
  },

  // 字体配置
  fonts: {
    body: '"PingFang SC", "Microsoft YaHei", system-ui, -apple-system, sans-serif',
    serif: '"Crimson Text", "Georgia", system-ui, serif',
    mono: '"JetBrains Mono", "Courier New", monospace',
    kai: 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", serif',
  },

  // 素材位
  asset: {
    kraftPaper: [
      "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%222400%22 height=%221200%22%3E%3Crect fill=%22%23f5f1e8%22 width=%222400%22 height=%221200%22/%3E%3C/svg%3E')",
    ],
    washiTapes: [
      "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22160%22%3E%3Crect fill=%22%23c9a24b%22 width=%22600%22 height=%22160%22 opacity=%220.5%22/%3E%3C/svg%3E')",
    ],
    pressBody: null,
    pressButton: null,
  },
};

export default vintageLetterTheme;
