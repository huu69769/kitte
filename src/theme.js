// 暖调复古主题
export const warmRetroTheme = {
  // 背景色
  bg: "#2b2d31",
  bgLight: "#3a3d42",

  // 面板 / 边框
  panel: "#3a3d42",
  line: "#4a4e54",

  // 文字
  ink: "#e8e6e1",
  dim: "#9a9ea5",

  // 强调色
  accent: "#b5482f",     // 红棕色（PRESS 按钮）
  gold: "#c9a24b",       // 黄铜色

  // 邮票相关颜色
  stamp: {
    red: "#a83a2e",
    redHi: "#c04a3a",
    redDk: "#7a2a20",
    paper: "#f6f1e6",    // 牛皮纸浅色
    paperDk: "#d4ccc0",  // 牛皮纸深色
    slot: "#1a1718",     // 暗槽
    brass: "#c9a24b",    // 铆钉黄铜色
  },

  // 字体配置
  fonts: {
    body: '"PingFang SC", "Microsoft YaHei", system-ui, -apple-system, sans-serif',
    serif: '"Crimson Text", "Georgia", system-ui, serif',
    mono: '"JetBrains Mono", "Courier New", monospace',
    kai: 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", serif', // 楷体
  },

  // 素材位（现在都是占位，后续替换）
  asset: {
    kraftPaper: [
      "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%222400%22 height=%221200%22%3E%3Crect fill=%22%23d4ccc0%22 width=%222400%22 height=%221200%22/%3E%3C/svg%3E')",
    ],
    washiTapes: [
      "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22160%22%3E%3Crect fill=%22%23c9a24b%22 width=%22600%22 height=%22160%22 opacity=%220.7%22/%3E%3C/svg%3E')",
    ],
    pressBody: null,      // 压印机机身
    pressButton: null,    // 红色按钮
  },
};

export default warmRetroTheme;
