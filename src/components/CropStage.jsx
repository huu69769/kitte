import React, { useState, useRef, useEffect } from 'react';
import theme from '../theme';

const SIZES = [
  { key: '40x30', label: '横版', w: 40, h: 30 },
  { key: '30x40', label: '竖版', w: 30, h: 40 },
  { key: '35x35', label: '方形', w: 35, h: 35 },
  { key: '70x50', label: '大票幅', w: 70, h: 50 },
];

const DPI = 600;
const mmToPx = (mm) => Math.round((mm / 25.4) * DPI);
const STAGE = 380;
const PERF = { count: 0.5, depth: 1.0 };

function computeFrame(size) {
  const pad = 30;
  const avail = STAGE - pad * 2;
  const ar = size.w / size.h;
  let fw = avail,
    fh = fw / ar;
  if (fh > avail) {
    fh = avail;
    fw = fh * ar;
  }
  return { x: (STAGE - fw) / 2, y: (STAGE - fh) / 2, w: fw, h: fh };
}

// 在邮票边上打齿孔（destination-out）
function applyStampPerforations(ctx, W, H, toothSize = 40) {
  const margin = 5;
  const nx = Math.max(2, Math.round((W - margin * 2) / toothSize));
  const ny = Math.max(2, Math.round((H - margin * 2) / toothSize));
  const stepX = (W - margin * 2) / nx;
  const stepY = (H - margin * 2) / ny;
  const r = Math.min(stepX, stepY) * 0.35; // 孔半径稍小，确保有间距

  ctx.fillStyle = 'rgba(0,0,0,1)';
  ctx.globalCompositeOperation = 'destination-out';

  // 上边齿孔（跳过第一个和最后一个，保留圆形角）
  for (let i = 1; i < nx - 1; i++) {
    const x = margin + (i + 0.5) * stepX;
    ctx.beginPath();
    ctx.arc(x, margin, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 下边齿孔（跳过第一个和最后一个）
  for (let i = 1; i < nx - 1; i++) {
    const x = margin + (i + 0.5) * stepX;
    ctx.beginPath();
    ctx.arc(x, H - margin, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 左边齿孔（跳过第一个和最后一个）
  for (let i = 1; i < ny - 1; i++) {
    const y = margin + (i + 0.5) * stepY;
    ctx.beginPath();
    ctx.arc(margin, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 右边齿孔（跳过第一个和最后一个）
  for (let i = 1; i < ny - 1; i++) {
    const y = margin + (i + 0.5) * stepY;
    ctx.beginPath();
    ctx.arc(W - margin, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'source-over';
}

export default function CropStage({ onPress }) {
  const [sizeKey, setSizeKey] = useState('40x30');
  const [nat, setNat] = useState(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [view, setView] = useState({ tx: 0, ty: 0, scale: 1, base: 1 });

  const imgElRef = useRef(null);
  const stageRef = useRef(null);
  const fileRef = useRef(null);

  const size = SIZES.find((s) => s.key === sizeKey);
  const frame = computeFrame(size);
  const hasImg = !!nat;

  const coverScale = (f, n) => Math.max(f.w / n.w, f.h / n.h);
  const clamp = (v, f, n) => {
    const nw = n.w * v.scale,
      nh = n.h * v.scale;
    return {
      ...v,
      tx: Math.min(f.x, Math.max(f.x + f.w - nw, v.tx)),
      ty: Math.min(f.y, Math.max(f.y + f.h - nh, v.ty)),
    };
  };

  // EXIF 烤平 + 图片加载
  const onFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    let bitmap;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      bitmap = await createImageBitmap(file);
    }

    const w = bitmap.width,
      h = bitmap.height;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    const url = canvas.toDataURL('image/png');

    const cleanImg = new Image();
    await new Promise((res) => {
      cleanImg.onload = res;
      cleanImg.src = url;
    });

    imgElRef.current = cleanImg;

    const n = { w, h };
    const f = computeFrame(size);
    const base = coverScale(f, n);
    let v = {
      tx: f.x + f.w / 2 - (w * base) / 2,
      ty: f.y + f.h / 2 - (h * base) / 2,
      scale: base,
      base,
    };
    v = clamp(v, f, n);
    setNat(n);
    setImgUrl(url);
    setView(v);
  };

  // 尺寸切换时重新计算
  useEffect(() => {
    if (!nat) return;
    const f = computeFrame(size);
    const base = coverScale(f, nat);
    setView((v) => {
      const rel = v.scale / v.base;
      const scale = Math.max(base, base * rel);
      const cx = frame.x + frame.w / 2,
        cy = frame.y + frame.h / 2;
      const imgCX = (cx - v.tx) / v.scale,
        imgCY = (cy - v.ty) / v.scale;
      let nv = {
        base,
        scale,
        tx: f.x + f.w / 2 - imgCX * scale,
        ty: f.y + f.h / 2 - imgCY * scale,
      };
      return clamp(nv, f, nat);
    });
  }, [sizeKey]); // eslint-disable-line

  // 拖拽逻辑
  const drag = useRef({ on: false, x: 0, y: 0 });
  const onDown = (e) => {
    if (!hasImg) return;
    drag.current = { on: true, x: e.clientX, y: e.clientY };
    stageRef.current?.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!drag.current.on) return;
    const dx = e.clientX - drag.current.x,
      dy = e.clientY - drag.current.y;
    drag.current.x = e.clientX;
    drag.current.y = e.clientY;
    setView((v) => clamp({ ...v, tx: v.tx + dx, ty: v.ty + dy }, frame, nat));
  };
  const onUp = () => {
    drag.current.on = false;
  };

  // 滚轮缩放
  const zoomAround = (rel, cx, cy) => {
    setView((v) => {
      rel = Math.max(1, Math.min(4, rel));
      const newScale = v.base * rel,
        ratio = newScale / v.scale;
      let nv = {
        ...v,
        scale: newScale,
        tx: cx - (cx - v.tx) * ratio,
        ty: cy - (cy - v.ty) * ratio,
      };
      return clamp(nv, frame, nat);
    });
  };

  const onWheel = (e) => {
    if (!hasImg) return;
    e.preventDefault();
    const r = stageRef.current.getBoundingClientRect();
    zoomAround(
      (view.scale / view.base) * (e.deltaY < 0 ? 1.08 : 0.926),
      e.clientX - r.left,
      e.clientY - r.top
    );
  };

  const onZoomSlider = (e) => {
    zoomAround(parseFloat(e.target.value), frame.x + frame.w / 2, frame.y + frame.h / 2);
  };

  // 高清烘焙 + 回调
  const press = () => {
    if (!hasImg) return;

    const f = frame,
      v = view;
    const outW = mmToPx(size.w),
      outH = mmToPx(size.h);
    const k = outW / f.w;

    // 创建邮票（照片直接铺满 + 齿孔轮廓裁形）
    const stampCanvas = document.createElement('canvas');
    stampCanvas.width = outW;
    stampCanvas.height = outH;
    const sctx = stampCanvas.getContext('2d');

    // 1) 填照片
    sctx.drawImage(
      imgElRef.current,
      (v.tx - f.x) * k,
      (v.ty - f.y) * k,
      nat.w * v.scale * k,
      nat.h * v.scale * k
    );

    // 2) 在边上打齿孔孔（用 destination-out）
    applyStampPerforations(sctx, outW, outH, 40);

    const stampUrl = stampCanvas.toDataURL('image/png');

    // 生成缩略图（同样的逻辑）
    const thumb = document.createElement('canvas');
    const thumbSize = 300;
    thumb.width = thumbSize;
    thumb.height = Math.round(thumbSize * (outH / outW));
    const tctx = thumb.getContext('2d');

    tctx.drawImage(stampCanvas, 0, 0, thumb.width, thumb.height);

    const thumbUrl = thumb.toDataURL('image/png');

    onPress({ stampUrl, thumbUrl, size: size.label, sizeKey });
  };

  const zoomRel = view.base ? view.scale / view.base : 1;

  return (
    <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
      {/* 取景舞台 */}
      <div
        ref={stageRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onWheel={onWheel}
        style={{
          position: 'relative',
          width: STAGE,
          height: STAGE,
          background: theme.bgLight,
          border: `2px solid ${theme.line}`,
          borderRadius: 8,
          overflow: 'hidden',
          touchAction: 'none',
          cursor: hasImg ? 'grab' : 'default',
          flex: 'none',
          display: hasImg ? 'block' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `inset 0 2px 6px rgba(61, 43, 31, 0.08)`,
        }}
      >
        {!hasImg && (
          <div style={{ color: theme.dim, fontSize: 13, textAlign: 'center', lineHeight: 1.9, pointerEvents: 'none' }}>
            先上传一张照片<br />拖动 / 缩放取景
          </div>
        )}
        {hasImg && (
          <img
            src={imgUrl}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: nat.w + 'px',
              height: nat.h + 'px',
              maxWidth: 'none',
              maxHeight: 'none',
              minWidth: 0,
              minHeight: 0,
              transformOrigin: '0 0',
              transform: `translate(${view.tx}px,${view.ty}px) scale(${view.scale})`,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        )}
        {hasImg && (
          <div
            style={{
              position: 'absolute',
              left: frame.x,
              top: frame.y,
              width: frame.w,
              height: frame.h,
              border: '1.5px dashed rgba(255,255,255,.9)',
              boxShadow: '0 0 0 9999px rgba(20,21,23,.6)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* 右侧控制面板 */}
      <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 20, opacity: hasImg ? 1 : 0.8 }}>
        <button
          onClick={() => fileRef.current.click()}
          style={{
            border: `1.5px solid ${theme.gold}`,
            borderRadius: 6,
            padding: '11px 14px',
            fontSize: 13,
            cursor: 'pointer',
            background: 'transparent',
            color: theme.ink,
          }}
        >
          {hasImg ? '换一张照片' : '上传照片'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />

        {/* 尺寸选择 */}
        <div>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: theme.dim, textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>邮票尺寸</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {SIZES.map((s) => {
              const active = s.key === sizeKey;
              return (
                <button
                  key={s.key}
                  onClick={() => setSizeKey(s.key)}
                  style={{
                    background: active ? theme.panel : 'transparent',
                    color: active ? theme.accent : theme.dim,
                    border: `1.5px solid ${active ? theme.accent : theme.line}`,
                    borderRadius: 6,
                    padding: '9px 12px',
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{s.label}</span>
                  <small style={{ color: theme.dim, fontSize: 11 }}>
                    {s.w}×{s.h}
                  </small>
                </button>
              );
            })}
          </div>
        </div>

        {/* 缩放滑块 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, color: theme.dim, fontSize: 12 }}>
          <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>缩放</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoomRel}
            onChange={onZoomSlider}
            disabled={!hasImg}
            style={{ width: '100%', accentColor: theme.accent, opacity: hasImg ? 1 : 0.5 }}
          />
        </div>

        {/* 压印按钮 */}
        <button
          onClick={press}
          disabled={!hasImg}
          style={{
            border: 'none',
            borderRadius: 6,
            padding: '13px 16px',
            fontSize: 14,
            cursor: !hasImg ? 'not-allowed' : 'pointer',
            background: theme.accent,
            color: '#faf7f1',
            fontWeight: 600,
            letterSpacing: 2,
            opacity: !hasImg ? 0.5 : 1,
          }}
        >
          压印
        </button>
      </div>
    </div>
  );
}
