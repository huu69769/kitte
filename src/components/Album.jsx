import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import theme from '../theme';
import { t } from '../i18n';

/**
 * 集邮册组件
 * 牛皮纸线装本 + 自由拼贴
 *
 * 核心交互：
 * - 邮票自由拖拽摆放
 * - 点击邮票放大查看
 * - 长按(~200ms) = 拖动，短按 = 放大
 * - 邮票贴上自动摆正（不带旋转）
 *
 * 坐标一律归一化（0~1，相对"可摆放区域"= 容器减去邮票自身尺寸），
 * 所以任何屏宽下邮票都完整可见，换屏/旋转也不会跑到框外（PRD §4、§6）。
 */

const LONG_PRESS_MS = 200;
const MOVE_THRESHOLD = 6; // px

const STAMP_SIZES = {
  '40x30': { w: 40, h: 30 },
  '30x40': { w: 30, h: 40 },
  '35x35': { w: 35, h: 35 },
  '70x50': { w: 70, h: 50 },
};

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// 镊子（切手ピンセット）—— 集邮者从册子上夹起邮票的工具，Art Nouveau 黄铜
function TweezersArt({ h = 110 }) {
  const ARM_L = "M25 20 C11 46 14 78 28 99";
  const ARM_R = "M31 20 C45 46 42 78 28 99";
  return (
    <svg width={h * 0.54} height={h} viewBox="0 0 56 104" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="tzBrass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6b5520" />
          <stop offset=".3" stopColor="#efdb96" />
          <stop offset=".62" stopColor={theme.gold} />
          <stop offset="1" stopColor="#4f3d15" />
        </linearGradient>
      </defs>
      {/* 深色打底描边：牛皮纸上也看得清 */}
      <path d={ARM_L} fill="none" stroke="#4a3a18" strokeWidth="9.5" strokeLinecap="round" />
      <path d={ARM_R} fill="none" stroke="#4a3a18" strokeWidth="9.5" strokeLinecap="round" />
      {/* 两条臂：中间留出明显空隙，到尖端才合拢 */}
      <path d={ARM_L} fill="none" stroke="url(#tzBrass)" strokeWidth="7" strokeLinecap="round" />
      <path d={ARM_R} fill="none" stroke="url(#tzBrass)" strokeWidth="7" strokeLinecap="round" />
      {/* 顶端铰接 */}
      <path d="M28 4 C17 4 13 12 18 21 L38 21 C43 12 39 4 28 4 Z"
        fill={theme.gold} stroke="#4a3a18" strokeWidth="1" />
      {/* 新艺术卷草 */}
      <path d="M15 12 C4 5 13 -5 26 3" fill="none" stroke={theme.gold} strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="27" cy="3" r="3.6" fill={theme.rose} stroke="#4a3a18" strokeWidth=".8" />
    </svg>
  );
}

// layout（stampId -> {nx,ny} 归一化）由 App 保管：进工作台时本组件会卸载，
// 状态放这儿会导致回来后整册重新随机摆位。
export default function Album({ stamps = [], lang = 'zh', onEdit, onRemove, layout = {}, setLayout }) {
  const [tweezers, setTweezers] = useState(false);   // 镊子拿在手上=取下模式
  const [selectedStamp, setSelectedStamp] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [box, setBox] = useState({ w: 0, h: 0 });    // 实测容器尺寸
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const longPressRef = useRef(null);

  // 实测容器宽度（绝不用写死常量参与定位/命中判定，PRD §6-1）
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      setBox({ w, h: Math.round(Math.max(320, Math.min(600, w * 0.5))) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 单枚邮票的显示尺寸（随容器宽度缩放）
  const dimsOf = (stamp) => {
    const s = STAMP_SIZES[stamp.sizeKey] || { w: 40, h: 30 };
    const h = Math.max(70, Math.min(120, box.w * 0.11));
    return { w: h * (s.w / s.h), h };
  };

  // 新邮票随机摆放（归一化，容器量出来之后才放）
  useEffect(() => {
    if (!box.w) return;
    setLayout((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const stamp of stamps) {
        if (!next[stamp.id]) {
          next[stamp.id] = { nx: Math.random(), ny: Math.random() };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [stamps, box.w]);

  // ——— 拖拽：指针捕获 + 实时测量，长按/移动阈值区分点击与拖动 ———
  const onPointerDown = (e, stamp) => {
    if (e.button === 2) return;
    const rect = containerRef.current.getBoundingClientRect();
    const d = dimsOf(stamp);
    const pos = layout[stamp.id] || { nx: 0, ny: 0 };
    dragRef.current = {
      id: stamp.id,
      startX: e.clientX,
      startY: e.clientY,
      onx: pos.nx,
      ony: pos.ny,
      freeW: Math.max(1, rect.width - d.w),
      freeH: Math.max(1, rect.height - d.h),
      moved: false,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    longPressRef.current = setTimeout(() => {
      setDraggingId(stamp.id);
      if (navigator.vibrate) navigator.vibrate(50);
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) <= MOVE_THRESHOLD) return;

    if (!d.moved) {
      d.moved = true;
      clearTimeout(longPressRef.current);
      if (draggingId !== d.id) {
        setDraggingId(d.id);
        if (navigator.vibrate) navigator.vibrate(30);
      }
    }
    setLayout((l) => ({
      ...l,
      [d.id]: { nx: clamp01(d.onx + dx / d.freeW), ny: clamp01(d.ony + dy / d.freeH) },
    }));
  };

  const onPointerUp = (e) => {
    const d = dragRef.current;
    clearTimeout(longPressRef.current);
    if (!d) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (!d.moved) {
      // 没怎么动 = 一次点击：拿着镊子就夹走，否则放大查看
      if (tweezers) onRemove?.(stamps.find((s) => s.id === d.id));
      else setSelectedStamp(d.id);
    }
    dragRef.current = null;
    setDraggingId(null);
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 标题 */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: theme.fonts.display, fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 600, color: theme.ink, margin: 0, letterSpacing: 2 }}>
          {t('myAlbum', lang)}
        </h2>
        <p style={{ fontSize: 12, color: theme.dim, margin: '8px 0 0', letterSpacing: 1 }}>
          {t('stampCountText', lang, stamps.length)}
        </p>
      </div>

      {/* 牛皮纸页面 */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 1200,
          height: box.h || 400,
          margin: '0 auto',
          backgroundImage: `url(${theme.asset.kraftPaper[0]})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          overflow: 'hidden',
          userSelect: 'none',
        }}
      >
        {box.w > 0 && stamps.map((stamp) => {
          const pos = layout[stamp.id];
          if (!pos) return null;
          const d = dimsOf(stamp);
          const isAnimating = draggingId === stamp.id;
          return (
            <div
              key={stamp.id}
              onPointerDown={(e) => onPointerDown(e, stamp)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: d.w,
                height: d.h,
                cursor: isAnimating ? 'grabbing' : 'grab',
                // 用 transform 移动（GPU 合成），不改 left/top：
                // iOS Safari 下改 left/top 会留残像——drop-shadow 让绘制范围
                // 超出布局盒，旧位置的阴影像素不会被失效重绘（PRD §6-4）
                transform: `translate3d(${pos.nx * Math.max(0, box.w - d.w)}px, ${pos.ny * Math.max(0, box.h - d.h)}px, 0) scale(${isAnimating ? 1.05 : 1})`,
                transition: isAnimating ? 'none' : 'transform 0.2s ease-out',
                willChange: isAnimating ? 'transform' : 'auto',
                backfaceVisibility: 'hidden',
                touchAction: 'none',   // 只有邮票本身吃触摸，空白处照常滚页面
                outline: tweezers ? `1.5px dashed ${theme.gold}` : 'none',
                outlineOffset: 3,
              }}
            >
              <img
                src={stamp.thumbUrl}
                alt="stamp"
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  userSelect: 'none',
                  pointerEvents: 'none',
                  // 阴影挂在内层图上，和"会动的那层"分开，避免绘制范围溢出合成层
                  filter: isAnimating
                    ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))'
                    : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                }}
              />
            </div>
          );
        })}

        {/* 镊子：搁在页面上的一件工具，点一下拿起来进入取下模式 */}
        <div style={{
          position: 'absolute', right: '7%', bottom: '6%', zIndex: 5,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        }}>
          {tweezers && (
            <div style={{
              background: 'rgba(59,48,38,.82)', color: theme.bgLight,
              borderRadius: 14, padding: '5px 11px', fontSize: 11, letterSpacing: 1,
              whiteSpace: 'nowrap', pointerEvents: 'none',
            }}>
              {t('tweezersHint', lang)}
            </div>
          )}
          <button
            onClick={() => setTweezers((v) => !v)}
            title={t('tweezers', lang)}
            style={{
              background: 'transparent', border: 'none', padding: 8, cursor: 'pointer',
              lineHeight: 0,
              transform: tweezers ? 'translateY(-10px) rotate(-9deg)' : 'rotate(6deg)',
              transition: 'transform .16s ease-out',
              filter: tweezers
                ? `drop-shadow(0 8px 12px rgba(0,0,0,.45)) drop-shadow(0 0 7px ${theme.gold})`
                : 'drop-shadow(0 3px 6px rgba(0,0,0,.35))',
            }}
          >
            <TweezersArt />
          </button>
        </div>

        {/* 空状态 */}
        {stamps.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: theme.dim,
              fontSize: 13,
              lineHeight: 1.8,
              pointerEvents: 'none',
              padding: '0 20px',
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>{t('noStampsAlbum', lang)}</div>
            <div style={{ fontSize: 12 }}>{t('addFromTray', lang)}</div>
          </div>
        )}
      </div>

      {/* 放大查看模态 */}
      {selectedStamp && (
        <StampPreview
          stamp={stamps.find((s) => s.id === selectedStamp)}
          onClose={() => setSelectedStamp(null)}
          onEdit={onEdit}
          lang={lang}
        />
      )}
    </div>
  );
}

/**
 * 邮票放大查看模态
 */
function StampPreview({ stamp, onClose, onEdit, lang = 'zh' }) {
  if (!stamp) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 600,
          maxHeight: '85vh',
          background: theme.bg,
          borderRadius: 8,
          padding: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflowY: 'auto',
        }}
      >
        <img
          src={stamp.stampUrl}
          alt="stamp-large"
          style={{ width: '100%', maxHeight: '55vh', objectFit: 'contain', borderRadius: 4 }}
        />

        <div style={{ fontSize: 12, color: theme.dim, textAlign: 'center' }}>
          <div>{stamp.size}</div>
          <div style={{ marginTop: 4 }}>No. {stamp.no.toString().padStart(3, '0')}</div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onClose}
            style={{
              border: `1.5px solid ${theme.line}`,
              borderRadius: 4,
              padding: '9px 18px',
              fontSize: 12,
              background: 'transparent',
              color: theme.ink,
              cursor: 'pointer',
            }}
          >
            {t('close', lang)}
          </button>
          <button
            onClick={() => { onClose(); onEdit?.(stamp); }}
            style={{
              border: `1px solid ${theme.gold}`,
              borderRadius: 4,
              padding: '9px 18px',
              fontSize: 12,
              fontWeight: 600,
              background: theme.accent,
              color: '#f6f0e0',
              cursor: 'pointer',
            }}
          >
            ✎ {t('continueEdit', lang)}
          </button>
        </div>

        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            border: 'none',
            borderRadius: '50%',
            background: 'transparent',
            color: theme.dim,
            cursor: 'pointer',
            fontSize: 20,
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
