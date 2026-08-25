import React, { useState } from 'react';
import theme from '../theme';

const TRAY_LIMIT = 20;

export default function TraySidebar({ tray, onRemove, onSelect }) {
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
    ids.forEach((id) => onRemove(id));
    setSelected({});
  };

  return (
    <>
      {/* 暂存台面板 */}
      <div style={{ width: '100%', maxWidth: 620, marginTop: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: theme.dim, textTransform: 'uppercase' }}>暂存台</div>
          <div style={{ fontSize: 11, color: trayFull ? theme.accent : theme.dim }}>
            {tray.length} / {TRAY_LIMIT}
          </div>
        </div>

        {tray.length === 0 ? (
          <div
            style={{
              border: `1px dashed ${theme.line}`,
              borderRadius: 10,
              padding: '26px 20px',
              textAlign: 'center',
              color: theme.dim,
              fontSize: 12,
              lineHeight: 1.8,
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
                          top: -6,
                          right: -6,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: sel ? theme.gold : 'rgba(0,0,0,.5)',
                          color: sel ? '#2b2d31' : '#fff',
                          border: `1px solid ${sel ? theme.gold : theme.line}`,
                          fontSize: 11,
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
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
              <button
                onClick={archiveSelected}
                disabled={selCount === 0}
                style={{
                  background: selCount ? theme.gold : theme.panel,
                  color: selCount ? '#2b2d31' : theme.dim,
                  border: `1px solid ${selCount ? theme.gold : theme.line}`,
                  borderRadius: 8,
                  padding: '9px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: selCount ? 'pointer' : 'not-allowed',
                }}
              >
                收进集邮册{selCount ? `（${selCount}）` : ''}
              </button>
              {selCount > 0 && (
                <button
                  onClick={() => setSelected({})}
                  style={{
                    background: 'transparent',
                    color: theme.dim,
                    border: `1px solid ${theme.line}`,
                    borderRadius: 8,
                    padding: '9px 14px',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  取消选择
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
            background: 'rgba(15,16,18,.82)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
            zIndex: 60,
            cursor: 'zoom-out',
          }}
        >
          <img
            src={viewing.stampUrl}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '80vw',
              maxHeight: '66vh',
              borderRadius: 4,
              filter: 'drop-shadow(0 18px 40px rgba(0,0,0,.6))',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }} onClick={(e) => e.stopPropagation()}>
            <span style={{ fontSize: 13, letterSpacing: 1 }}>
              No.{String(viewing.no).padStart(3, '0')} · {viewing.size}
            </span>
            <button
              onClick={() => {
                onRemove(viewing.id);
                setViewing(null);
              }}
              style={{
                background: 'transparent',
                color: '#d98',
                border: '1px solid #a55',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              删除
            </button>
            <button
              onClick={() => setViewing(null)}
              style={{
                background: theme.panel,
                color: theme.ink,
                border: `1px solid ${theme.line}`,
                borderRadius: 6,
                padding: '6px 14px',
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
