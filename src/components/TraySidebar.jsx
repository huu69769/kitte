import React, { useState } from 'react';
import theme from '../theme';

const TRAY_LIMIT = 20;

export default function TraySidebar({ tray, onRemove, onAddToAlbum }) {
  const [selected, setSelected] = useState({});
  const [viewing, setViewing] = useState(null);

  const selCount = Object.values(selected).filter(Boolean).length;
  const trayFull = tray.length >= TRAY_LIMIT;

  const toggleSel = (id) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const archiveSelected = () => {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (ids.length === 0) return;
    onAddToAlbum(ids);
    setSelected({});
  };

  return (
    <>
      {/* 暂存台面板 */}
      <div style={{ width: '100%', maxWidth: '100%', paddingLeft: 20, paddingRight: 20, marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: theme.dim, textTransform: 'uppercase', fontWeight: 600 }}>暂存台</div>
          <div style={{ fontSize: 11, color: trayFull ? theme.accent : theme.dim, fontWeight: 500 }}>
            {tray.length} / {TRAY_LIMIT}
          </div>
        </div>

        {tray.length === 0 ? (
          <div
            style={{
              border: `1.5px dashed ${theme.line}`,
              borderRadius: 8,
              padding: '28px 20px',
              textAlign: 'center',
              color: theme.dim,
              fontSize: 12,
              lineHeight: 1.8,
              background: theme.bgLight,
            }}
          >
            压印后邮票先落在这里<br />
            挑好的收进集邮册
          </div>
        ) : (
          <>
            {/* 邮票缩略图行 */}
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '6px 2px 12px' }}>
              {tray.map((stamp) => {
                const sel = !!selected[stamp.id];
                return (
                  <div key={stamp.id} style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={stamp.thumbUrl}
                        alt={`No.${stamp.no}`}
                        onClick={() => setViewing(stamp)}
                        style={{
                          height: 96,
                          width: 'auto',
                          borderRadius: 3,
                          cursor: 'zoom-in',
                          outline: sel ? `2px solid ${theme.gold}` : 'none',
                          outlineOffset: 2,
                          filter: 'drop-shadow(0 4px 10px rgba(0,0,0,.4))',
                        }}
                      />
                      {/* 勾选圆圈 */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSel(stamp.id);
                        }}
                        style={{
                          position: 'absolute',
                          top: -7,
                          right: -7,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: sel ? theme.accent : 'rgba(61, 43, 31, 0.3)',
                          color: sel ? '#faf7f1' : 'transparent',
                          border: `1.5px solid ${sel ? theme.accent : theme.line}`,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {sel ? '✓' : ''}
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: theme.dim, letterSpacing: 1 }}>No.{String(stamp.no).padStart(3, '0')}</div>
                  </div>
                );
              })}
            </div>

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
              <button
                onClick={archiveSelected}
                disabled={selCount === 0}
                style={{
                  background: selCount ? theme.accent : 'transparent',
                  color: selCount ? '#faf7f1' : theme.dim,
                  border: `1.5px solid ${selCount ? theme.accent : theme.line}`,
                  borderRadius: 6,
                  padding: '9px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: selCount ? 'pointer' : 'not-allowed',
                }}
              >
                {selCount ? `收进集邮册（${selCount}）` : '收进集邮册'}
              </button>
              {selCount > 0 && (
                <button
                  onClick={() => setSelected({})}
                  style={{
                    background: 'transparent',
                    color: theme.dim,
                    border: `1.5px solid ${theme.line}`,
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  清空
                </button>
              )}
              <span style={{ fontSize: 11, color: theme.dim, marginLeft: 'auto' }}>点邮票=放大 · 点右上角=勾选</span>
            </div>
          </>
        )}
      </div>

      {/* 放大查看模态 */}
      {viewing && (
        <div
          onClick={() => setViewing(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(61, 43, 31, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            zIndex: 60,
            cursor: 'zoom-out',
            backdropFilter: 'blur(2px)',
          }}
        >
          <img
            src={viewing.stampUrl}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '80vw',
              maxHeight: '66vh',
              borderRadius: 6,
              filter: 'drop-shadow(0 20px 40px rgba(61, 43, 31, 0.4))',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#faf7f1' }} onClick={(e) => e.stopPropagation()}>
            <span style={{ fontSize: 13, letterSpacing: 0.5 }}>
              No.{String(viewing.no).padStart(3, '0')} · {viewing.size}
            </span>
            <button
              onClick={() => {
                onAddToAlbum([viewing.id]);
                setViewing(null);
              }}
              style={{
                background: '#c9a24b',
                color: '#3d2b1f',
                border: 'none',
                borderRadius: 5,
                padding: '6px 12px',
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              直接收进
            </button>
            <button
              onClick={() => {
                onRemove(viewing.id);
                setViewing(null);
              }}
              style={{
                background: 'transparent',
                color: '#d4a574',
                border: '1px solid #d4a574',
                borderRadius: 5,
                padding: '6px 12px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              删除
            </button>
            <button
              onClick={() => setViewing(null)}
              style={{
                background: 'transparent',
                color: '#faf7f1',
                border: '1px solid #faf7f1',
                borderRadius: 5,
                padding: '6px 12px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </>
  );
}
