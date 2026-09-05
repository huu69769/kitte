import React, { useState, useRef, useEffect, useCallback } from 'react';
import theme from '../theme';
import { ASSET } from '../assets';
import { t } from '../i18n';
import useViewport from '../useViewport';

/**
 * 工作台 · 集邮书桌（缪夏 / Art Nouveau）
 *
 * 工具从底部工具包露出上半截，拿起来用、随手搁桌上，「一键整理」吸回底部。
 *  - 笔     拖到邮票上落一个行内文字框，直接打字（禁用 prompt）
 *  - 日戳   拖到邮票上松手盖下，角度/浓淡随机，戳留手上可连盖，点戳撤销
 *  - 放大镜 搁桌上=开（镜片跟随），拖回底部=关
 *
 * 坐标一律归一化（相对 REF_W×REF_H 虚拟画布），预览与烘焙同一套排版规格，
 * 竖排在 DOM 和 Canvas 都按「逐字 + 固定字距」排，保证不错位。
 */

const STAMP_SIZES = {
  '40x30': { w: 40, h: 30 },
  '30x40': { w: 30, h: 40 },
  '35x35': { w: 35, h: 35 },
  '70x50': { w: 70, h: 50 },
};

const REF_W = 1000;            // 虚拟画布宽度，所有字号/尺寸以此为基准
const STAGE_MAX = 460;         // 舞台最长边
const HIT_PAD = 12;            // 命中判定容差（PRD §6）
const DOCK_H = 128;            // 底部工具包高度
const VERT_LINE = 1.14;        // 竖排逐字步进倍率（DOM 与 Canvas 共用）
const POSTMARK_D = 190;        // 日戳直径（REF 单位）

const HOME = { pen: 0.28, postmark: 0.5, loupe: 0.72 };

// 印泥（日戳油墨色）—— 先做朱红/墨黑/白，以后再加
const INKS = [
  { key: 'red', labelKey: 'inkRed', color: theme.stamp.red },
  { key: 'black', labelKey: 'inkBlack', color: '#22201d' },
  { key: 'white', labelKey: 'inkWhite', color: '#f7f3ea' },
];

// 文字角色预设（字号为 REF 单位）
const ROLE_PRESETS = {
  title: { size: 62, weight: 700, font: 'display', color: '#3b3026', letter: 2 },
  subtitle: { size: 38, weight: 600, font: 'serif', color: '#3b3026', letter: 1 },
  denom: { size: 74, weight: 700, font: 'display', color: '#a85a44', letter: 0 },
  country: { size: 30, weight: 600, font: 'mono', color: '#3b3026', letter: 6 },
  free: { size: 40, weight: 500, font: 'kai', color: '#3b3026', letter: 0 },
};
const ROLE_KEYS = ['title', 'subtitle', 'denom', 'country', 'free'];

const inRect = (r, x, y, pad = HIT_PAD) =>
  x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;


// ═══════════ 缪夏装饰（素材位未填时由 SVG 顶着）═══════════

function MuchaArch({ size }) {
  if (ASSET.muchaArch[0]) {
    return <img src={ASSET.muchaArch[0]} alt="" style={{ width: size, height: size }} draggable={false} />;
  }
  const dots = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    dots.push(<circle key={i} cx={250 + Math.cos(a) * 228} cy={250 + Math.sin(a) * 228} r={i % 3 === 0 ? 5 : 3} fill={theme.gold} opacity={0.5} />);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 500 500">
      <circle cx="250" cy="250" r="242" fill="none" stroke={theme.gold} strokeWidth="2" opacity=".5" />
      <circle cx="250" cy="250" r="212" fill="none" stroke={theme.sage} strokeWidth="10" opacity=".28" />
      <circle cx="250" cy="250" r="196" fill="none" stroke={theme.gold} strokeWidth="1.5" opacity=".45" />
      {dots}
    </svg>
  );
}

function MuchaCorner({ size, flipX, flipY }) {
  const src = ASSET.muchaCorner[0];
  const style = {
    width: size,
    height: size,
    transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
    pointerEvents: 'none',
  };
  if (src) return <img src={src} alt="" style={style} draggable={false} />;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={style}>
      <path d="M4 116 C4 62 22 24 74 8" fill="none" stroke={theme.gold} strokeWidth="2.4" opacity=".75" />
      <path d="M4 116 C10 74 30 42 70 28" fill="none" stroke={theme.sage} strokeWidth="1.6" opacity=".6" />
      <path d="M26 74 C34 62 34 48 24 40" fill="none" stroke={theme.sage} strokeWidth="1.5" opacity=".7" />
      <ellipse cx="22" cy="36" rx="8" ry="5" fill={theme.rose} opacity=".65" transform="rotate(-38 22 36)" />
      <ellipse cx="44" cy="52" rx="7" ry="4.5" fill={theme.sage} opacity=".6" transform="rotate(-20 44 52)" />
      <circle cx="74" cy="8" r="4.5" fill={theme.gold} opacity=".8" />
      <circle cx="4" cy="116" r="4" fill={theme.gold} opacity=".8" />
    </svg>
  );
}

function MuchaDivider({ width }) {
  return (
    <svg width={width} height="18" viewBox={`0 0 ${width} 18`} style={{ display: 'block' }}>
      <line x1="0" y1="9" x2={width / 2 - 26} y2="9" stroke={theme.gold} strokeWidth="1.2" opacity=".55" />
      <line x1={width / 2 + 26} y1="9" x2={width} y2="9" stroke={theme.gold} strokeWidth="1.2" opacity=".55" />
      <path d={`M${width / 2 - 20} 9 C${width / 2 - 12} 1 ${width / 2 + 12} 1 ${width / 2 + 20} 9 C${width / 2 + 12} 17 ${width / 2 - 12} 17 ${width / 2 - 20} 9 Z`}
        fill="none" stroke={theme.gold} strokeWidth="1.4" opacity=".8" />
      <circle cx={width / 2} cy="9" r="2.6" fill={theme.gold} opacity=".9" />
    </svg>
  );
}

// ═══════════ 工具造型（Art Nouveau，素材位未填时由 SVG 顶着）═══════════

function ToolArt({ name, ink }) {
  const slot = { pen: ASSET.toolPen, postmark: ASSET.toolStamp, loupe: ASSET.toolLoupe }[name];
  if (slot?.[0]) {
    return <img src={slot[0]} alt={name} style={{ height: 96, display: 'block' }} draggable={false} />;
  }
  if (name === 'pen') return <PenArt />;
  if (name === 'postmark') return <PostmarkArt ink={ink} />;
  return <LoupeArt />;
}

function PenArt() {
  return (
    <svg width="46" height="112" viewBox="0 0 46 112">
      <defs>
        <linearGradient id="penBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5b4530" /><stop offset=".45" stopColor="#8a6b47" /><stop offset="1" stopColor="#3e2e1f" />
        </linearGradient>
      </defs>
      <rect x="17" y="20" width="12" height="62" rx="5" fill="url(#penBody)" />
      <path d="M17 34 C25 40 21 48 29 54" fill="none" stroke={theme.gold} strokeWidth="1.6" opacity=".85" />
      <path d="M17 56 C25 62 21 70 29 76" fill="none" stroke={theme.gold} strokeWidth="1.6" opacity=".7" />
      <rect x="15" y="14" width="16" height="12" rx="6" fill={theme.gold} />
      <path d="M12 14 C8 6 20 0 23 7" fill="none" stroke={theme.gold} strokeWidth="2.2" />
      <circle cx="23" cy="6" r="3.4" fill={theme.rose} opacity=".9" />
      <polygon points="17,82 29,82 23,106" fill={theme.gold} />
      <polygon points="21,92 25,92 23,106" fill="#6b5320" opacity=".7" />
      <circle cx="23" cy="106" r="1.8" fill={theme.ink} />
    </svg>
  );
}

function PostmarkArt({ ink = theme.stamp.red }) {
  return (
    <svg width="66" height="96" viewBox="0 0 66 96">
      <defs>
        <linearGradient id="pmWood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8a6440" /><stop offset=".5" stopColor="#a37d52" /><stop offset="1" stopColor="#5b3f27" />
        </linearGradient>
      </defs>
      <path d="M27 10 C21 4 45 4 39 10 L39 20 L27 20 Z" fill={theme.gold} />
      <rect x="28" y="18" width="10" height="34" rx="4" fill="url(#pmWood)" />
      <path d="M28 26 C36 31 30 38 38 43" fill="none" stroke={theme.gold} strokeWidth="1.4" opacity=".8" />
      <ellipse cx="33" cy="52" rx="24" ry="7" fill={theme.gold} opacity=".85" />
      <rect x="9" y="52" width="48" height="24" rx="5" fill="url(#pmWood)" />
      <ellipse cx="33" cy="76" rx="24" ry="9" fill="#3f2b1b" />
      <circle cx="33" cy="76" r="14" fill="none" stroke={ink} strokeWidth="1.8" opacity=".9" />
      <circle cx="33" cy="76" r="9" fill="none" stroke={ink} strokeWidth="1.2" opacity=".75" />
    </svg>
  );
}

function LoupeArt() {
  return (
    <svg width="56" height="110" viewBox="0 0 56 110">
      <circle cx="28" cy="30" r="22" fill="rgba(214,228,222,.28)" stroke={theme.gold} strokeWidth="5" />
      <circle cx="28" cy="30" r="22" fill="none" stroke="#f2e9d2" strokeWidth="1" opacity=".55" />
      <path d="M6 30 C0 16 12 4 26 6" fill="none" stroke={theme.gold} strokeWidth="2" opacity=".85" />
      <ellipse cx="21" cy="21" rx="8" ry="5" fill="#fff" opacity=".32" transform="rotate(-28 21 21)" />
      <rect x="24" y="50" width="8" height="52" rx="4" fill="#7d5c37" />
      <path d="M24 60 C32 66 26 74 34 80" fill="none" stroke={theme.gold} strokeWidth="1.5" opacity=".8" />
      <rect x="22" y="48" width="12" height="7" rx="3" fill={theme.gold} />
      <circle cx="28" cy="103" r="4" fill={theme.gold} opacity=".9" />
    </svg>
  );
}

// ═══════════ 日戳 ═══════════

function PostmarkMark({ mark, stageW, stageH, onRemove, title }) {
  const k = stageW / REF_W;
  const d = POSTMARK_D * k;
  return (
    <div
      onPointerDown={(e) => { e.stopPropagation(); onRemove(); }}
      title={title}
      style={{
        position: 'absolute',
        left: mark.nx * stageW,
        top: mark.ny * stageH,
        width: d,
        height: d,
        marginLeft: -d / 2,
        marginTop: -d / 2,
        transform: `rotate(${mark.rot}deg)`,
        opacity: mark.opacity,
        cursor: 'pointer',
        touchAction: 'none',
      }}
    >
      <svg width={d} height={d} viewBox="0 0 190 190">
        <circle cx="95" cy="95" r="86" fill="none" stroke={mark.color} strokeWidth="6" />
        <circle cx="95" cy="95" r="68" fill="none" stroke={mark.color} strokeWidth="2.5" />
        <path d="M18 95 H60 M130 95 H172" stroke={mark.color} strokeWidth="4" />
        <text x="95" y="52" textAnchor="middle" fill={mark.color} fontSize="17" fontWeight="700" fontFamily="monospace" letterSpacing="1.5">STAMP WORKS</text>
        <text x="95" y="110" textAnchor="middle" fill={mark.color} fontSize="30" fontWeight="700" fontFamily="monospace">{mark.date}</text>
        <text x="95" y="146" textAnchor="middle" fill={mark.color} fontSize="15" fontFamily="monospace" letterSpacing="2">{mark.year}</text>
      </svg>
    </div>
  );
}

// ═══════════ 文字块 ═══════════

function TextBlock({ block, stageW, stageH, selected, editing, onStartDrag, onSelect, onEdit, onChange, onEndEdit }) {
  const k = stageW / REF_W;
  const preset = ROLE_PRESETS[block.role];
  const px = block.size * k;
  const family = theme.fonts[preset.font] || theme.fonts.body;

  const common = {
    position: 'absolute',
    left: 0,
    top: 0,
    // 同样用 transform 定位而非 left/top：拖动时 iOS 不会留残像（PRD §6-4）
    transform: `translate3d(${block.nx * stageW}px, ${block.ny * stageH}px, 0) translate(-50%,-50%) rotate(${block.rotate}deg)`,
    backfaceVisibility: 'hidden',
    fontFamily: family,
    fontSize: px,
    fontWeight: preset.weight,
    color: preset.color,
    letterSpacing: preset.letter * k,
    whiteSpace: 'nowrap',
    userSelect: 'none',
    touchAction: 'none',
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={block.content}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onEndEdit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        style={{
          ...common,
          minWidth: 140,
          width: `${Math.max(6, block.content.length + 2)}ch`,
          background: 'rgba(255,255,255,.82)',
          border: `1.5px dashed ${theme.stamp.red}`,
          borderRadius: 3,
          textAlign: 'center',
          outline: 'none',
          padding: '2px 4px',
        }}
      />
    );
  }

  // 竖排：逐字堆叠，步进与 Canvas 烘焙一致
  const body = block.vertical ? (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {Array.from(block.content).map((ch, i) => (
        <span key={i} style={{ height: px * VERT_LINE, lineHeight: `${px * VERT_LINE}px`, display: 'block' }}>{ch}</span>
      ))}
    </div>
  ) : (
    block.content
  );

  return (
    <div
      onPointerDown={(e) => { e.stopPropagation(); onSelect(); onStartDrag(e); }}
      onDoubleClick={(e) => { e.stopPropagation(); onEdit(); }}
      style={{
        ...common,
        cursor: 'move',
        textShadow: '0 1px 0 rgba(255,255,255,.28)',
        outline: selected ? `1.5px dashed ${theme.gold}` : 'none',
        outlineOffset: 6,
      }}
    >
      {body}
    </div>
  );
}

// ═══════════ 主组件 ═══════════

export default function StampDesk({ stamp, onFinish, onBack, lang = 'zh' }) {
  const [texts, setTexts] = useState([]);
  const [postmarks, setPostmarks] = useState([]);
  const [tools, setTools] = useState({
    pen: { docked: true, x: 0, y: 0 },
    postmark: { docked: true, x: 0, y: 0 },
    loupe: { docked: true, x: 0, y: 0 },
  });
  const [dragging, setDragging] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loupePos, setLoupePos] = useState(null);
  const [baking, setBaking] = useState(false);
  const [inkColor, setInkColor] = useState(INKS[0].color);

  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const textDrag = useRef(null);

  const vp = useViewport();
  const narrow = vp.w < 680;
  // 舞台随视口缩放，手机上不撑破屏幕
  const stageMax = Math.max(220, Math.min(STAGE_MAX, vp.w - 44, vp.h * 0.4));

  const size = STAMP_SIZES[stamp?.sizeKey] || { w: 40, h: 30 };
  const ar = size.w / size.h;
  let stageW = stageMax, stageH = stageMax / ar;
  if (stageH > stageMax) { stageH = stageMax; stageW = stageMax * ar; }

  const loupeOpen = !tools.loupe.docked;

  // ——— 工具拖拽（Pointer Events，坐标实时测量）———
  const startToolDrag = (name) => (e) => {
    e.preventDefault();
    const r = rootRef.current.getBoundingClientRect();
    setDragging(name);
    setTools((s) => ({ ...s, [name]: { docked: false, x: e.clientX - r.left, y: e.clientY - r.top } }));
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e) => {
      const r = rootRef.current.getBoundingClientRect();
      setTools((s) => ({ ...s, [dragging]: { docked: false, x: e.clientX - r.left, y: e.clientY - r.top } }));
      if (dragging === 'loupe') updateLoupe(e);
    };
    const up = (e) => {
      const stageR = stageRef.current?.getBoundingClientRect();
      const rootR = rootRef.current.getBoundingClientRect();
      const onStamp = stageR && inRect(stageR, e.clientX, e.clientY);
      const nearDock = e.clientY > rootR.bottom - DOCK_H - HIT_PAD;

      if (dragging === 'pen' && onStamp) {
        const id = `tx-${Date.now()}`;
        setTexts((a) => [...a, {
          id,
          content: '',
          role: 'free',
          nx: (e.clientX - stageR.left) / stageR.width,
          ny: (e.clientY - stageR.top) / stageR.height,
          size: ROLE_PRESETS.free.size,
          rotate: 0,
          vertical: false,
        }]);
        setEditingId(id);
        setSelectedId(id);
        dock('pen');                        // 笔写完这一下自动归位
      } else if (dragging === 'postmark' && onStamp) {
        const now = new Date();
        setPostmarks((a) => [...a, {
          id: `pm-${Date.now()}`,
          nx: (e.clientX - stageR.left) / stageR.width,
          ny: (e.clientY - stageR.top) / stageR.height,
          ar,
          rot: (Math.random() - 0.5) * 26,
          opacity: 0.58 + Math.random() * 0.36,
          color: inkColor,
          date: `${now.getMonth() + 1}.${now.getDate()}`,
          year: String(now.getFullYear()),
        }]);
        // 戳搁在旁边（不压住刚盖的印），随手可再拿起来连盖
        setTools((s) => ({
          ...s,
          postmark: { docked: false, x: e.clientX - rootR.left + 96, y: e.clientY - rootR.top - 16 },
        }));
      } else if (nearDock) {
        dock(dragging);
      }

      if (dragging === 'loupe' && nearDock) setLoupePos(null);
      setDragging(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [dragging, ar, inkColor]);

  const dock = (name) => setTools((s) => ({ ...s, [name]: { docked: true, x: 0, y: 0 } }));

  const tidyUp = () => {
    setTools({ pen: { docked: true, x: 0, y: 0 }, postmark: { docked: true, x: 0, y: 0 }, loupe: { docked: true, x: 0, y: 0 } });
    setLoupePos(null);
  };

  // ——— 放大镜 ———
  const updateLoupe = useCallback((e) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    setLoupePos(inRect(r, e.clientX, e.clientY, 0) ? { x: e.clientX - r.left, y: e.clientY - r.top } : null);
  }, []);

  useEffect(() => {
    if (!loupeOpen || dragging) { if (!loupeOpen) setLoupePos(null); return; }
    const mv = (e) => updateLoupe(e);
    window.addEventListener('pointermove', mv);
    return () => window.removeEventListener('pointermove', mv);
  }, [loupeOpen, dragging, updateLoupe]);

  // ——— 文字拖拽 ———
  const startTextDrag = (id) => (e) => {
    if (editingId === id) return;
    textDrag.current = id;
    const move = (ev) => {
      const r = stageRef.current.getBoundingClientRect();
      setTexts((a) => a.map((b) => b.id === id
        ? { ...b, nx: (ev.clientX - r.left) / r.width, ny: (ev.clientY - r.top) / r.height }
        : b));
    };
    const up = () => {
      textDrag.current = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  const patchText = (id, patch) => setTexts((a) => a.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const selected = texts.find((b) => b.id === selectedId);

  // ——— 烘焙：与预览同一套排版规格 ———
  const bake = async () => {
    setBaking(true);
    const img = new Image();
    await new Promise((res) => { img.onload = res; img.src = stamp.stampUrl; });

    const W = img.naturalWidth, H = img.naturalHeight;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const k = W / REF_W;

    // 日戳
    for (const m of postmarks) {
      ctx.save();
      ctx.translate(m.nx * W, m.ny * H);
      ctx.rotate((m.rot * Math.PI) / 180);
      ctx.globalAlpha = m.opacity;
      ctx.strokeStyle = m.color;
      ctx.fillStyle = m.color;
      const R = (POSTMARK_D / 2) * k;
      ctx.lineWidth = 6 * k * (POSTMARK_D / 190);
      ctx.beginPath(); ctx.arc(0, 0, R * (86 / 95), 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 2.5 * k * (POSTMARK_D / 190);
      ctx.beginPath(); ctx.arc(0, 0, R * (68 / 95), 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 4 * k * (POSTMARK_D / 190);
      ctx.beginPath();
      ctx.moveTo(-R * (77 / 95), 0); ctx.lineTo(-R * (35 / 95), 0);
      ctx.moveTo(R * (35 / 95), 0); ctx.lineTo(R * (77 / 95), 0);
      ctx.stroke();
      ctx.textAlign = 'center';
      const u = (POSTMARK_D / 190) * k;
      ctx.font = `700 ${17 * u}px monospace`;
      ctx.fillText('STAMP WORKS', 0, -43 * u);
      ctx.font = `700 ${30 * u}px monospace`;
      ctx.fillText(m.date, 0, 15 * u);
      ctx.font = `${15 * u}px monospace`;
      ctx.fillText(m.year, 0, 51 * u);
      ctx.restore();
    }

    // 文字
    for (const b of texts) {
      if (!b.content) continue;
      const preset = ROLE_PRESETS[b.role];
      const px = b.size * k;
      ctx.save();
      ctx.translate(b.nx * W, b.ny * H);
      ctx.rotate((b.rotate * Math.PI) / 180);
      ctx.fillStyle = preset.color;
      ctx.font = `${preset.weight} ${px}px ${theme.fonts[preset.font] || theme.fonts.body}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (b.vertical) {
        const chars = Array.from(b.content);
        const step = px * VERT_LINE;
        const total = chars.length * step;
        chars.forEach((ch, i) => ctx.fillText(ch, 0, -total / 2 + step * (i + 0.5)));
      } else {
        ctx.letterSpacing = `${preset.letter * k}px`;
        ctx.fillText(b.content, 0, 0);
      }
      ctx.restore();
    }

    const stampUrl = c.toDataURL('image/png');

    const th = document.createElement('canvas');
    th.width = 300;
    th.height = Math.round(300 * (H / W));
    th.getContext('2d').drawImage(c, 0, 0, th.width, th.height);

    setBaking(false);
    onFinish({
      ...stamp,
      stampUrl,
      thumbUrl: th.toDataURL('image/png'),
      texts: texts.map(({ id, content, role, nx, ny, size: s, rotate, vertical }) => ({ id, content, role, x: nx, y: ny, size: s, rotate, vertical })),
      postmarks: postmarks.map(({ nx, ny, rot, opacity, color }) => ({ x: nx, y: ny, rotate: rot, opacity, color })),
    });
  };

  const anyOut = Object.values(tools).some((s) => !s.docked);

  // 空态：主动从顶部进来但还没挑邮票
  if (!stamp) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 18, padding: 30,
        background: `radial-gradient(128% 100% at 50% 0%, ${theme.deskHi}, ${theme.desk} 70%)`,
        fontFamily: theme.fonts.body, color: theme.bgLight,
      }}>
        <MuchaArch size={220} />
        <div style={{ fontFamily: theme.fonts.display, fontSize: 20, letterSpacing: 3 }}>{t('deskEmpty', lang)}</div>
        <div style={{ fontSize: 12, color: theme.gold, letterSpacing: 1 }}>{t('deskEmptyHint', lang)}</div>
        <button onClick={onBack} style={{ ...ghostBtn, marginTop: 6 }}>← {t('backToPress', lang)}</button>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      style={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        backgroundColor: theme.desk,
        backgroundImage: ASSET.deskSurface[0]
          ? `url(${ASSET.deskSurface[0]}), radial-gradient(128% 100% at 50% 0%, ${theme.deskHi}, ${theme.desk} 70%)`
          : `radial-gradient(128% 100% at 50% 0%, ${theme.deskHi}, ${theme.desk} 70%)`,
        backgroundSize: ASSET.deskSurface[0] ? '420px, cover' : 'cover',
        fontFamily: theme.fonts.body,
        color: theme.bgLight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: `30px 16px ${DOCK_H + 84}px`,
        gap: 18,
        // 注意：根容器不能设 touch-action:none，否则整页在手机上划不动。
        // 只有真正要拖的元素（工具/文字/日戳）才设。
        cursor: dragging ? 'grabbing' : 'default',
      }}
    >
      {/* 呢面颗粒 */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.07, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(#fff .6px, transparent .6px)', backgroundSize: '3px 3px',
      }} />

      {/* 顶栏 */}
      <div style={{ width: '100%', maxWidth: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, zIndex: 2 }}>
        <button onClick={onBack} style={{ ...ghostBtn, padding: narrow ? '7px 10px' : '7px 13px', fontSize: narrow ? 11 : 12 }}>
          ← {t('backToPress', lang)}
        </button>
        <div style={{ textAlign: 'center', minWidth: 0 }}>
          <div style={{ fontFamily: theme.fonts.display, fontSize: narrow ? 16 : 20, letterSpacing: narrow ? 2 : 4, color: theme.bgLight, whiteSpace: 'nowrap' }}>
            {t('desk', lang)}
          </div>
          <div style={{ fontFamily: theme.fonts.mono, fontSize: 9, letterSpacing: narrow ? 2 : 4, color: theme.gold, opacity: .85, marginTop: 3, whiteSpace: 'nowrap' }}>
            {t('deskSub', lang)}
          </div>
        </div>
        <div style={{ width: narrow ? 52 : 96, textAlign: 'right', fontSize: narrow ? 10 : 11, color: theme.gold, letterSpacing: 1 }}>
          {stamp ? `No.${String(stamp.no).padStart(3, '0')}` : ''}
        </div>
      </div>
      <MuchaDivider width={Math.min(280, vp.w - 60)} />

      {/* 工作区 */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {/* 缪夏光环衬底 */}
        <div style={{ position: 'absolute', pointerEvents: 'none', opacity: .5 }}>
          <MuchaArch size={Math.max(stageW, stageH) * 1.5} />
        </div>

        <div
          ref={stageRef}
          onPointerDown={() => setSelectedId(null)}
          style={{
            position: 'relative',
            width: stageW,
            height: stageH,
            zIndex: 1,
            boxShadow: '0 24px 60px rgba(0,0,0,.45)',
            background: theme.stamp.paper,
            cursor: loupeOpen ? 'none' : 'default',
          }}
        >
          <img src={stamp?.stampUrl} alt="" draggable={false}
            style={{ width: '100%', height: '100%', display: 'block', userSelect: 'none', pointerEvents: 'none' }} />

          {postmarks.map((m) => (
            <PostmarkMark key={m.id} mark={m} stageW={stageW} stageH={stageH} title={t('removePostmark', lang)}
              onRemove={() => setPostmarks((a) => a.filter((z) => z.id !== m.id))} />
          ))}

          {texts.map((b) => (
            <TextBlock
              key={b.id}
              block={b}
              stageW={stageW}
              stageH={stageH}
              selected={selectedId === b.id}
              editing={editingId === b.id}
              onSelect={() => setSelectedId(b.id)}
              onStartDrag={startTextDrag(b.id)}
              onEdit={() => setEditingId(b.id)}
              onChange={(v) => patchText(b.id, { content: v })}
              onEndEdit={() => {
                setEditingId(null);
                setTexts((a) => a.filter((x) => x.content.trim() || x.id !== b.id));
              }}
            />
          ))}

          {loupePos && loupeOpen && (() => {
            const LO = narrow ? 108 : 150;
            return (
              <div style={{
                position: 'absolute', left: loupePos.x, top: loupePos.y, width: LO, height: LO,
                transform: 'translate(-50%,-50%)', borderRadius: '50%', pointerEvents: 'none',
                border: `${narrow ? 6 : 8}px solid ${theme.gold}`,
                boxShadow: '0 10px 24px rgba(0,0,0,.45), inset 0 0 26px rgba(0,0,0,.25)',
                backgroundImage: `url(${stamp?.stampUrl})`, backgroundRepeat: 'no-repeat',
                backgroundSize: `${stageW * 2.4}px ${stageH * 2.4}px`,
                backgroundPosition: `${-loupePos.x * 2.4 + LO / 2}px ${-loupePos.y * 2.4 + LO / 2}px`,
                overflow: 'hidden',
              }} />
            );
          })()}
        </div>

        {/* 四角藤蔓 */}
        {[[0, 0, false, false], [1, 0, true, false], [0, 1, false, true], [1, 1, true, true]].map(([cx, cy, fx, fy], i) => {
          const cs = narrow ? 56 : 86;
          const off = -Math.round(cs * 0.4);
          return (
            <div key={i} style={{
              position: 'absolute', pointerEvents: 'none',
              left: cx ? undefined : off, right: cx ? off : undefined,
              top: cy ? undefined : off, bottom: cy ? off : undefined,
            }}>
              <MuchaCorner size={cs} flipX={fx} flipY={fy} />
            </div>
          );
        })}
      </div>

      {/* 文字属性面板 */}
      {selected && (
        <div style={{
          zIndex: 3, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'center',
          background: 'rgba(59,48,38,.72)', border: `1px solid ${theme.gold}`, borderRadius: 10,
          padding: '10px 14px', backdropFilter: 'blur(4px)',
          maxWidth: Math.min(720, vp.w - 32),
        }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {ROLE_KEYS.map((r) => (
              <button key={r}
                onClick={() => patchText(selected.id, { role: r, size: ROLE_PRESETS[r].size })}
                style={{
                  background: selected.role === r ? theme.gold : 'transparent',
                  color: selected.role === r ? theme.ink : theme.bgLight,
                  border: `1px solid ${selected.role === r ? theme.gold : 'rgba(255,255,255,.3)'}`,
                  borderRadius: 4, padding: '5px 9px', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                {t({ title: 'roleTitle', subtitle: 'roleSubtitle', denom: 'roleDenom', country: 'roleCountry', free: 'roleFree' }[r], lang)}
              </button>
            ))}
          </div>

          <label style={ctrlLabel}>
            {t('textSize', lang)}
            <input type="range" min={16} max={140} step={1} value={selected.size}
              onChange={(e) => patchText(selected.id, { size: +e.target.value })}
              style={{ width: 90, accentColor: theme.gold }} />
          </label>

          <label style={ctrlLabel}>
            {t('textRotate', lang)}
            <input type="range" min={-45} max={45} step={1} value={selected.rotate}
              onChange={(e) => patchText(selected.id, { rotate: +e.target.value })}
              style={{ width: 90, accentColor: theme.gold }} />
          </label>

          <button onClick={() => patchText(selected.id, { vertical: !selected.vertical })}
            style={{ ...ghostBtn, borderColor: theme.gold, color: theme.bgLight }}>
            {selected.vertical ? t('textHorizontal', lang) : t('textVertical', lang)}
          </button>

          <button onClick={() => { setTexts((a) => a.filter((x) => x.id !== selected.id)); setSelectedId(null); }}
            style={{ ...ghostBtn, borderColor: theme.stamp.redHi, color: theme.stamp.redHi }}>
            {t('deleteText', lang)}
          </button>
        </div>
      )}

      {/* 一键整理 + 完成 */}
      <div style={{ display: 'flex', gap: 12, zIndex: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
        {anyOut && (
          <button onClick={tidyUp} style={{
            background: theme.wood, color: theme.bgLight, border: `1px solid ${theme.gold}`,
            borderRadius: 22, padding: '9px 20px', fontSize: 13, cursor: 'pointer', letterSpacing: 2,
            boxShadow: '0 6px 16px rgba(0,0,0,.3)',
          }}>⤵ {t('tidyUp', lang)}</button>
        )}
        <button onClick={bake} disabled={baking} style={{
          background: theme.gold, color: theme.ink, border: 'none', borderRadius: 22,
          padding: '9px 26px', fontSize: 13, fontWeight: 700, letterSpacing: 2,
          cursor: baking ? 'wait' : 'pointer', boxShadow: '0 6px 16px rgba(0,0,0,.3)',
        }}>{t('finishToAlbum', lang)}</button>
      </div>

      {/* 搁在桌上的工具 */}
      {Object.entries(tools).map(([name, s]) => {
        if (s.docked || dragging === name) return null;
        return (
          <div key={name} onPointerDown={startToolDrag(name)}
            style={{
              position: 'absolute', left: 0, top: 0,
              transform: `translate3d(${s.x}px, ${s.y}px, 0) translate(-50%,-50%)`,
              backfaceVisibility: 'hidden',
              zIndex: 20, cursor: 'grab', touchAction: 'none',
            }}>
            <div style={{ filter: 'drop-shadow(0 8px 12px rgba(0,0,0,.45))' }}>
              <ToolArt name={name} ink={inkColor} />
            </div>
          </div>
        );
      })}

      {/* 手上的工具（跟随指针）*/}
      {dragging && !tools[dragging].docked && (
        <div style={{
          position: 'absolute', left: 0, top: 0,
          // 跟随手指的工具：transform 移动 + 阴影下沉到内层，否则 iOS 上拖出一路残像
          transform: `translate3d(${tools[dragging].x}px, ${tools[dragging].y}px, 0) translate(-50%,-72%)`,
          willChange: 'transform', backfaceVisibility: 'hidden',
          zIndex: 50, pointerEvents: 'none',
        }}>
          <div style={{ filter: 'drop-shadow(0 12px 16px rgba(0,0,0,.5))' }}>
            <ToolArt name={dragging} ink={inkColor} />
          </div>
        </div>
      )}

      {/* 印泥（日戳油墨色）*/}
      <div style={{
        position: 'fixed', right: 20, bottom: DOCK_H + 12, zIndex: 12,
        display: 'flex', alignItems: 'center', gap: 9,
        background: 'rgba(59,48,38,.72)', border: `1px solid ${theme.gold}`,
        borderRadius: 22, padding: '7px 14px', backdropFilter: 'blur(4px)',
      }}>
        <span style={{ fontSize: 10, letterSpacing: 2, color: theme.gold }}>{t('ink', lang)}</span>
        {INKS.map((k) => {
          const on = inkColor === k.color;
          return (
            <button key={k.key} onClick={() => setInkColor(k.color)} title={t(k.labelKey, lang)}
              style={{
                width: 22, height: 22, borderRadius: '50%', padding: 0, cursor: 'pointer',
                background: k.color,
                border: on ? `2px solid ${theme.gold}` : '2px solid rgba(255,255,255,.22)',
                boxShadow: on ? '0 0 0 3px rgba(191,155,48,.3)' : 'inset 0 1px 3px rgba(0,0,0,.45)',
              }} />
          );
        })}
      </div>

      {/* 底部工具包 */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, height: DOCK_H, zIndex: 10,
        background: ASSET.toolKitLeather[0] ? `url(${ASSET.toolKitLeather[0]}) center/cover` : `linear-gradient(${theme.wood}, ${theme.woodDk})`,
        borderTop: `2px solid ${theme.gold}`,
        boxShadow: '0 -8px 26px rgba(0,0,0,.4), inset 0 2px 0 rgba(255,255,255,.08)',
        touchAction: 'none',
      }}>
        <div style={{
          position: 'absolute', top: 7, left: 0, right: 0, textAlign: 'center',
          fontFamily: theme.fonts.mono, fontSize: 9, letterSpacing: 5, color: 'rgba(255,255,255,.42)',
        }}>{t('toolKit', lang)} · TOOL KIT</div>

        {Object.keys(HOME).map((name) => (
          tools[name].docked ? (
            <div key={name} onPointerDown={startToolDrag(name)}
              style={{
                position: 'absolute', left: `${HOME[name] * 100}%`, bottom: -8,
                transform: 'translateX(-50%)', cursor: 'grab', touchAction: 'none',
                transition: 'transform .12s', filter: 'drop-shadow(0 4px 7px rgba(0,0,0,.45))',
              }}
              onPointerEnter={(e) => (e.currentTarget.style.transform = 'translateX(-50%) translateY(-9px)')}
              onPointerLeave={(e) => (e.currentTarget.style.transform = 'translateX(-50%)')}>
              <ToolArt name={name} ink={inkColor} />
            </div>
          ) : null
        ))}
      </div>

      <div style={{
        position: 'fixed', bottom: 5, left: 0, right: 0, textAlign: 'center',
        fontSize: 10, color: 'rgba(255,255,255,.42)', zIndex: 11, pointerEvents: 'none', padding: '0 16px',
      }}>{t('deskGuide', lang)}</div>
    </div>
  );
}

const ghostBtn = {
  background: 'transparent',
  color: theme.bgLight,
  border: `1px solid rgba(255,255,255,.35)`,
  borderRadius: 6,
  padding: '7px 13px',
  fontSize: 12,
  cursor: 'pointer',
  letterSpacing: 1,
  whiteSpace: 'nowrap',
};

const ctrlLabel = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  fontSize: 11,
  color: theme.bgLight,
  whiteSpace: 'nowrap',
};
