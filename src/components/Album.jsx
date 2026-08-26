import React, { useState, useRef, useEffect } from 'react';
import theme from '../theme';

/**
 * 集邮册组件
 * 牛皮纸线装本 + 自由拼贴
 *
 * 核心交互：
 * - 邮票自由拖拽摆放
 * - 点击邮票放大查看
 * - 长按(~200ms) = 拖动，短按 = 放大
 * - 邮票贴上自动摆正（不带旋转）
 * - 性能：只让正在被碰的邮票跑动画
 */

const STAMP_WIDTH = 120;  // 缩略图宽度
const LONG_PRESS_MS = 200;
const MOVE_THRESHOLD = 6; // px

export default function Album({ stamps = [] }) {
  const [layout, setLayout] = useState({}); // stampId -> {x, y}
  const [selectedStamp, setSelectedStamp] = useState(null); // 放大查看
  const [draggingId, setDraggingId] = useState(null); // 正在拖动的邮票ID
  const containerRef = useRef(null);
  const dragRef = useRef({ id: null, startX: 0, startY: 0, ox: 0, oy: 0, moveStartTime: 0 });
  const longPressRef = useRef(null);

  // 容器尺寸
  const CONTAINER_WIDTH = typeof window !== 'undefined' ? window.innerWidth - 40 : 1200;
  const CONTAINER_HEIGHT = 600;

  // 初始化布局 - 新邮票随机摆放
  useEffect(() => {
    const newLayout = { ...layout };
    stamps.forEach((stamp) => {
      if (!newLayout[stamp.id]) {
        newLayout[stamp.id] = {
          x: Math.random() * (CONTAINER_WIDTH - STAMP_WIDTH),
          y: Math.random() * (CONTAINER_HEIGHT - STAMP_WIDTH),
        };
      }
    });
    setLayout(newLayout);
  }, [stamps.length]);

  // 鼠标/触摸按下
  const onPointerDown = (e, stampId) => {
    if (e.button === 2) return; // 右键忽略
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    dragRef.current = {
      id: stampId,
      startX: x,
      startY: y,
      ox: layout[stampId]?.x || 0,
      oy: layout[stampId]?.y || 0,
      moveStartTime: Date.now(),
    };

    // 长按检测
    longPressRef.current = setTimeout(() => {
      setDraggingId(stampId);
      // 触发触觉反馈
      if (navigator.vibrate) navigator.vibrate(50);
    }, LONG_PRESS_MS);

    containerRef.current?.setPointerCapture?.(e.pointerId);
  };

  // 鼠标/触摸移动
  const onPointerMove = (e) => {
    const { id, startX, startY, ox, oy } = dragRef.current;
    if (!id) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - startX;
    const dy = y - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 移动超过阈值 = 开始拖动
    if (dist > MOVE_THRESHOLD) {
      clearTimeout(longPressRef.current);

      // 立即启动拖动（无需等待长按）
      if (!draggingId) {
        setDraggingId(id);
        if (navigator.vibrate) navigator.vibrate(30);
      }

      // 更新邮票位置
      const newX = Math.max(0, Math.min(CONTAINER_WIDTH - STAMP_WIDTH, ox + dx));
      const newY = Math.max(0, Math.min(CONTAINER_HEIGHT - STAMP_WIDTH, oy + dy));
      setLayout((l) => ({ ...l, [id]: { x: newX, y: newY } }));
    }
  };

  // 鼠标/触摸释放
  const onPointerUp = (e) => {
    const { id, startX, startY } = dragRef.current;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !id) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - startX;
    const dy = y - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    clearTimeout(longPressRef.current);

    // 如果正在拖动，结束拖动
    if (draggingId === id) {
      setDraggingId(null);
    }
    // 短按且移动距离小 = 点击放大
    else if (dist < MOVE_THRESHOLD) {
      setSelectedStamp(id);
    }

    dragRef.current = { id: null, startX: 0, startY: 0, ox: 0, oy: 0, moveStartTime: 0 };
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 标题 */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.ink, margin: 0, letterSpacing: 2 }}>
          我的集邮册
        </h2>
        <p style={{ fontSize: 12, color: theme.dim, margin: '8px 0 0', letterSpacing: 1 }}>
          {stamps.length} 枚邮票
        </p>
      </div>

      {/* 牛皮纸页面 - 线装本视觉 */}
      <div
        ref={containerRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 1200,
          height: CONTAINER_HEIGHT,
          margin: '0 auto',
          background: theme.asset.kraftPaper?.[0] || theme.bg,
          backgroundColor: theme.bg,
          backgroundSize: 'cover',
          border: `1px solid ${theme.line}`,
          borderRadius: 4,
          boxShadow: `inset 0 0 20px rgba(0,0,0,0.05)`,
          // 中缝线装本视觉
          backgroundImage: `linear-gradient(90deg, transparent 49.5%, ${theme.line} 49.5%, ${theme.line} 50.5%, transparent 50.5%)`,
          overflow: 'hidden',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        {/* 邮票拖拽区域 */}
        {stamps.map((stamp) => {
          const pos = layout[stamp.id] || { x: 0, y: 0 };
          const isAnimating = draggingId === stamp.id;

          return (
            <div
              key={stamp.id}
              onPointerDown={(e) => onPointerDown(e, stamp.id)}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: STAMP_WIDTH,
                height: STAMP_WIDTH,
                cursor: draggingId === stamp.id ? 'grabbing' : 'grab',
                transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
                transition: isAnimating ? 'none' : 'transform 0.2s ease-out',
                filter: isAnimating ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                pointerEvents: 'auto',
              }}
            >
              <img
                src={stamp.thumbUrl}
                alt="stamp"
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 2,
                  userSelect: 'none',
                  pointerEvents: 'none',
                  touchAction: 'none',
                  WebkitUserDrag: 'none',
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
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>尚无邮票</div>
            <div style={{ fontSize: 12 }}>从暂存台添加邮票</div>
          </div>
        )}
      </div>

      {/* 放大查看模态 */}
      {selectedStamp && (
        <StampPreview
          stamp={stamps.find((s) => s.id === selectedStamp)}
          onClose={() => setSelectedStamp(null)}
        />
      )}
    </div>
  );
}

/**
 * 邮票放大查看模态
 */
function StampPreview({ stamp, onClose }) {
  if (!stamp) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: 600,
          maxHeight: '80vh',
          background: theme.bg,
          borderRadius: 8,
          padding: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* 高清邮票 */}
        <img
          src={stamp.stampUrl}
          alt="stamp-large"
          style={{
            width: '100%',
            maxHeight: 500,
            objectFit: 'contain',
            borderRadius: 4,
          }}
        />

        {/* 邮票信息 */}
        <div style={{ fontSize: 12, color: theme.dim, textAlign: 'center' }}>
          <div>{stamp.size}</div>
          <div style={{ marginTop: 4 }}>No. {stamp.no.toString().padStart(3, '0')}</div>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{
              border: `1.5px solid ${theme.line}`,
              borderRadius: 4,
              padding: '8px 16px',
              fontSize: 12,
              background: 'transparent',
              color: theme.ink,
              cursor: 'pointer',
            }}
          >
            关闭
          </button>
          <button
            style={{
              border: 'none',
              borderRadius: 4,
              padding: '8px 16px',
              fontSize: 12,
              background: theme.accent,
              color: '#faf7f1',
              cursor: 'pointer',
            }}
          >
            编辑（待实现）
          </button>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 28,
            height: 28,
            border: 'none',
            borderRadius: '50%',
            background: 'transparent',
            color: theme.dim,
            cursor: 'pointer',
            fontSize: 18,
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
