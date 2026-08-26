import { ASSET, FONTS, PAPER_TYPES } from './assets';

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

  // 素材位（从 assets.js 导入，可随时替换）
  asset: ASSET,

  // 字体定义（从 assets.js 导入）
  fontFamilies: FONTS,

  // 纸质类型（从 assets.js 导入）
  paperTypes: PAPER_TYPES,
};

export default vintageLetterTheme;
