import { ASSET, FONTS, PAPER_TYPES } from './assets';

// 缪夏 / Art Nouveau — 新艺术运动装饰风格
// 配色取自缪夏海报：陈旧象牙底、鼠尾草绿、金赭、陈玫瑰、藤蔓深褐
export const muchaTheme = {
  // 背景 - 陈旧象牙/奶油纸
  bg: "#ece3ce",
  bgLight: "#f6f0e0",

  // 面板 / 边框
  panel: "#e0d5b8",
  line: "#c2b490",

  // 文字
  ink: "#3b3026",        // 藤蔓深褐（缪夏的描线色）
  dim: "#8a7b62",

  // 强调色
  accent: "#6f8560",     // 鼠尾草绿（主强调）
  gold: "#bf9b30",       // 金赭（装饰线、边框）

  // ——— 缪夏扩展色板 ———
  sage: "#7d8c6a",       // 鼠尾草绿（叶饰）
  sageDeep: "#55654a",   // 深叶绿
  rose: "#c88b76",       // 陈玫瑰（花饰、肌理）
  roseLight: "#dcae9b",
  mauve: "#8d7f97",      // 柔紫（缪夏常用的雾感色）
  teal: "#4e6f6b",       // 孔雀绿
  desk: "#4a5c46",       // 工作台桌面（深呢绿）
  deskHi: "#5c7156",     // 桌面高光
  wood: "#7a5a3c",       // 木质工具区
  woodDk: "#4e3826",

  // 邮票相关颜色
  stamp: {
    red: "#a85a44",
    redHi: "#c88b76",
    redDk: "#7a3f2e",
    paper: "#f6f0e0",
    paperDk: "#e0d5b8",
    slot: "#3b3026",
    brass: "#bf9b30",
  },

  // 字体配置
  fonts: {
    body: '"PingFang SC", "Microsoft YaHei", system-ui, -apple-system, sans-serif',
    serif: '"Cormorant Garamond", "Crimson Text", Georgia, serif',
    display: '"Italiana", "Cormorant Garamond", Georgia, serif',  // 新艺术标题字
    mono: '"Special Elite", "Courier New", monospace',
    kai: '"Noto Serif SC", "KaiTi", serif',
  },

  // 素材位（从 assets.js 导入，可随时替换）
  asset: ASSET,

  // 字体定义（从 assets.js 导入）
  fontFamilies: FONTS,

  // 纸质类型（从 assets.js 导入）
  paperTypes: PAPER_TYPES,
};

// 兼容旧引用名
export const vintageLetterTheme = muchaTheme;

export default muchaTheme;
