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

export default function Album({ stamps = [], lang = 'zh' }) {
  const [layout, setLayout] = useState({});          // stampId -> {nx, ny} 归一化
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
    if (!d.moved) setSelectedStamp(d.id);   // 没怎么动 = 点击放大
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
          lang={lang}
        />
      )}
    </div>
  );
}

/**
 * 邮票放大查看模态
 */
function StampPreview({ stamp, onClose, lang = 'zh' }) {
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
            style={{
              border: 'none',
              borderRadius: 4,
              padding: '9px 18px',
              fontSize: 12,
              background: theme.accent,
              color: '#f6f0e0',
              cursor: 'pointer',
            }}
          >
            {t('editPending', lang)}
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
