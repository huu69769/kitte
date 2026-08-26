/**
 * 素材位定义（可替换）
 * 暖调复古套首版占位，对接设计素材时只需替换路径
 */

export const ASSET = {
  // 集邮册内页 - 做旧牛皮纸（2-3张，横图双页比例）
  // 使用：集邮册背景
  kraftPaper: [
    '/kitte/niupizhi.png',     // 暖调复古 - 已生成
    null,                      // 清新明亮 - 待生成
    null,                      // 其他皮肤 - 待生成
  ],

  // washi 胶带（4-5条不同花色，透明PNG）
  // 使用：集邮册装饰、工作台装饰
  washiTapes: [
    '/assets/washi-postal.png',
    '/assets/washi-floral.png',
    '/assets/washi-stripe.png',
    null,
    null,
  ],

  // 便利贴（2-3色，透明PNG）
  // 使用：工作台、集邮册装饰
  stickyNotes: [
    '/assets/sticky-yellow.png',
    '/assets/sticky-pink.png',
    null,
  ],

  // 相框（透明PNG中间镂空）
  // 使用：邮票外框装饰（P1）
  polaroidFrame: [
    '/assets/polaroid-frame.png',
    null,
    null,
  ],

  // 圆邮戳（透明PNG，可接日戳工具）
  // 使用：工作台日戳工具
  postmark: [
    '/assets/postmark-round.png',
    null,
    null,
  ],

  // 回形针/角贴（透明PNG）
  // 使用：集邮册邮票固定装饰（P1）
  paperclip: [
    '/assets/paperclip.png',
    null,
    null,
  ],

  // 书桌工具素材（升级质感用）
  // 使用：工作台工具包
  toolStamp: [
    '/assets/tool-stamp.png',
    null,
    null,
  ],
  toolPen: [
    '/assets/tool-pen.png',
    null,
    null,
  ],
  toolLoupe: [
    '/assets/tool-loupe.png',
    null,
    null,
  ],

  // 册子封面（多本用）
  // 使用：不同风格的集邮册封面
  albumCovers: [
    '/assets/cover-classic.png',
    '/assets/cover-modern.png',
    null,
  ],

  // 剪报字条底纸（毛边泛黄）
  // 使用：M5 剪报字条素材
  notebg: [
    '/assets/notebg-worn.png',
    null,
    null,
  ],

  // 压印机外观（视觉核心，暖调复古）
  // 使用：压印台机器外观
  pressBody: [
    '/assets/press-body.png',
    null,
    null,
  ],
  pressButton: [
    '/assets/press-button.png',
    null,
    null,
  ],
};

/**
 * 字体定义（可替换）
 */
export const FONTS = {
  // 中文做旧风 - 楷体风格
  zhOldStyle: '"FZKaiS", "KaiTi", serif',

  // 英文打字机风格
  enTypewriter: '"Courier New", "Courier", monospace',

  // 衬线正文
  serifBody: '"Times New Roman", "Times", serif',
};

/**
 * 纸质类型与光效映射
 * 既决定烘焙进PNG的纸张底纹，又决定运行时全息/烫金光效层
 */
export const PAPER_TYPES = {
  plain: {
    label: '纯白',
    texture: '/assets/texture-plain.png',
    lightEffect: 'none',
  },
  fluorescent: {
    label: '荧光',
    texture: '/assets/texture-fluorescent.png',
    lightEffect: 'glow',
  },
  foil: {
    label: '烫金',
    texture: '/assets/texture-foil.png',
    lightEffect: 'metallic',
  },
  holo: {
    label: '全息',
    texture: '/assets/texture-holo.png',
    lightEffect: 'holographic',
  },
};
