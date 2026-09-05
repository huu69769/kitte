/**
 * 素材位定义（可替换）
 *
 * 规则：槽位为 null 时，组件用内置 SVG / 纯色顶着，界面照常能用。
 *       AI 图生成好后，把图放进 public/assets/，再把下面的 null 换成路径即可，逻辑不动。
 *
 * 数组三个位置 = 三套皮肤：[缪夏, 备用, 备用]
 */

export const ASSET = {
  // 集邮册内页 - 做旧牛皮纸（横图双页比例）
  // 使用：集邮册背景
  kraftPaper: [
    '/kitte/niupizhi.png',     // ✅ 已有
    null,
    null,
  ],

  // washi 胶带（4-5条不同花色，透明PNG）
  // 使用：集邮册装饰、工作台装饰
  // 建议：各 600×160，新艺术卷草/邮政条纹花色
  washiTapes: [
    null,   // washi-postal.png
    null,   // washi-floral.png
    null,   // washi-stripe.png
    null,
    null,
  ],

  // 便利贴（2-3色，透明PNG）
  // 建议：500×500，微微卷边
  stickyNotes: [
    null,   // sticky-sage.png
    null,   // sticky-rose.png
    null,
  ],

  // 相框（透明PNG中间镂空）
  // 建议：800×1000，新艺术描金框，中间完全透明
  polaroidFrame: [
    null,   // frame-nouveau.png
    null,
    null,
  ],

  // 圆邮戳（透明PNG）
  // 使用：工作台日戳工具（未填时由 SVG 画）
  // 建议：600×600，红褐油墨、边缘不匀
  postmark: [
    null,   // postmark-round.png
    null,
    null,
  ],

  // 回形针/角贴（透明PNG）
  // 建议：300×300，黄铜质感
  paperclip: [
    null,   // paperclip-brass.png
    null,
    null,
  ],

  // 书桌工具（未填时由 Art Nouveau SVG 画）
  // 使用：工作台工具包
  // 建议：透明PNG，高 360，俯视平光，黄铜+木质+藤蔓曲线
  toolStamp: [
    null,   // tool-stamp.png
    null,
    null,
  ],
  toolPen: [
    null,   // tool-pen.png
    null,
    null,
  ],
  toolLoupe: [
    null,   // tool-loupe.png
    null,
    null,
  ],

  // 册子封面（多本用）
  // 建议：1000×1400
  albumCovers: [
    null,   // cover-nouveau.png
    null,
    null,
  ],

  // 剪报字条底纸（毛边泛黄）
  // 使用：M5 剪报字条
  // 建议：800×300，四边毛边、透明外圈
  notebg: [
    null,   // notebg-worn.png
    null,
    null,
  ],

  // 压印机外观（压印台目前直接 import src/assets/press-machine/*.png）
  pressBody: [
    null,   // press-body.png
    null,
    null,
  ],
  pressButton: [
    null,   // press-button.png
    null,
    null,
  ],

  // ═══════════════════════════════════════════════════════
  // 工作台（集邮书桌）素材位 — 缪夏 / Art Nouveau 风
  // 现在全部由代码 SVG 顶着
  // ═══════════════════════════════════════════════════════

  // 桌面材质（深呢绿台面，可无缝平铺）
  // 建议：1024×1024 无缝平铺，深鼠尾草绿呢面，轻微绒毛颗粒
  deskSurface: [
    null,   // desk-felt-mucha.png
    null,
    null,
  ],

  // 邮票工作区外框（缪夏装饰边框，中间镂空）
  // 建议：透明PNG，1200×900，藤蔓卷草+金线，四角花饰，中间完全透明
  muchaFrame: [
    null,   // mucha-frame.png
    null,
    null,
  ],

  // 拱门光环（缪夏标志性圆形光环，衬在工作区后面）
  // 建议：透明PNG，1000×1000，同心圆+马赛克镶嵌纹，金赭+鼠尾草绿
  muchaArch: [
    null,   // mucha-arch.png
    null,
    null,
  ],

  // 角落藤蔓装饰（四角用，代码会自动镜像复用）
  // 建议：透明PNG，400×400，鞭线曲线藤蔓+花苞，只画左上角那一个
  muchaCorner: [
    null,   // mucha-corner.png
    null,
    null,
  ],

  // 工具包皮套（底部工具条背景）
  // 建议：透明PNG，1600×260，压花皮革+黄铜铆钉，上缘新艺术卷草
  toolKitLeather: [
    null,   // toolkit-leather.png
    null,
    null,
  ],
};

/**
 * 字体定义（可替换）
 */
export const FONTS = {
  // 中文做旧风 - 宋体/楷体
  zhOldStyle: '"Noto Serif SC", "KaiTi", serif',

  // 英文打字机风格
  enTypewriter: '"Special Elite", "Courier New", monospace',

  // 新艺术标题字
  nouveauDisplay: '"Italiana", "Cormorant Garamond", Georgia, serif',

  // 衬线正文
  serifBody: '"Cormorant Garamond", "Times New Roman", serif',
};

/**
 * 纸质类型与光效映射
 * 既决定烘焙进PNG的纸张底纹，又决定运行时全息/烫金光效层
 */
export const PAPER_TYPES = {
  plain: { label: '纯白', texture: null, lightEffect: 'none' },
  fluorescent: { label: '荧光', texture: null, lightEffect: 'glow' },
  foil: { label: '烫金', texture: null, lightEffect: 'metallic' },
  holo: { label: '全息', texture: null, lightEffect: 'holographic' },
};
