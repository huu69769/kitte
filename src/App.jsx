import { useState, useEffect, useRef } from 'react';
import theme from './theme';
import { createAlbum, getAllAlbums, createStamp, requestPersistent } from './db';
import CropStage from './components/CropStage';
import StampPressMachine from './components/StampPressMachine';
import TraySidebar from './components/TraySidebar';
import Album from './components/Album';
import { t } from './i18n';
import './App.css';

function App() {
  const [tray, setTray] = useState([]);
  const [album, setAlbum] = useState(null);
  const [stamps, setStamps] = useState([]); // 已收进集邮册的邮票
  const [toast, setToast] = useState(null);
  const [lang, setLang] = useState('zh');
  const cropRef = useRef(null);
  const fileInputRef = useRef(null);
  const nextNo = { current: 1 };

  useEffect(() => {
    const init = async () => {
      try {
        await requestPersistent();
        const albums = await getAllAlbums();
        if (albums.length === 0) {
          const newAlbum = await createAlbum();
          setAlbum(newAlbum);
        } else {
          setAlbum(albums[0]);
        }
      } catch (err) {
        console.error('初始化失败:', err);
        // 降级方案：不依赖 IndexedDB，全用内存
        setAlbum({ id: 'temp', title: '默认集邮册', stampIds: [] });
      }
    };
    init();
  }, []);

  const handleMachinePress = ({ stampUrl, thumbUrl, size, sizeKey }) => {
    const stamp = {
      id: `stamp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      no: nextNo.current++,
      stampUrl,
      thumbUrl,
      size,
      sizeKey,
    };
    setTray((t) => [...t, stamp]);
    setToast(t('pressNotification', lang));
    setTimeout(() => setToast(null), 2000);
  };

  const handleRemove = (stampId) => {
    setTray((t) => t.filter((s) => s.id !== stampId));
  };

  const handleAddToAlbum = (stampIds) => {
    const toAdd = tray.filter((s) => stampIds.includes(s.id));
    setStamps((prev) => [...prev, ...toAdd]);
    setTray((t) => t.filter((s) => !stampIds.includes(s.id)));
  };

  return (
    <div
      style={{
        background: theme.bg,
        color: theme.ink,
        minHeight: '100vh',
        fontFamily: theme.fonts.body,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 20px 100px',
        gap: 48,
      }}
    >
      {/* 标题 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '100%',
          alignItems: 'center',
          paddingBottom: 24,
          borderBottom: `1px solid ${theme.line}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 2,
          }}
        >
          <div
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 2,
              color: '#3a2a1a',
              textShadow: '0.5px 0.5px 0 rgba(58,42,26,0.25), -0.3px 0.3px 0 rgba(58,42,26,0.15)',
              transform: 'rotate(-1.5deg)',
              display: 'inline-block',
            }}
          >
            {t('title', lang)}
          </div>
          <div
            style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: 10,
              fontWeight: 400,
              letterSpacing: 4,
              color: '#3a2a1a',
              opacity: 0.75,
              textShadow: '0.3px 0.3px 0 rgba(58,42,26,0.2)',
              textTransform: 'uppercase',
            }}
          >
            Stamp Works
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {album && (
            <div style={{ fontSize: 11, color: theme.dim, letterSpacing: 1 }}>
              {album.title}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setLang('zh')}
              style={{
                background: lang === 'zh' ? theme.accent : 'transparent',
                color: lang === 'zh' ? '#fff' : theme.dim,
                border: `1px solid ${lang === 'zh' ? theme.accent : theme.line}`,
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              中文
            </button>
            <button
              onClick={() => setLang('ja')}
              style={{
                background: lang === 'ja' ? theme.accent : 'transparent',
                color: lang === 'ja' ? '#fff' : theme.dim,
                border: `1px solid ${lang === 'ja' ? theme.accent : theme.line}`,
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              日本語
            </button>
          </div>
        </div>
      </div>

      {/* 压印台 - 控制面板 + 取景 + 压印机 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          gap: 60,
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}
      >
        {/* 左侧控制面板 */}
        <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <button
            onClick={() => fileInputRef.current?.click()}
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
            {cropRef.current?.hasImg ? t('changePhoto', lang) : t('uploadPhoto', lang)}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => cropRef.current?.onFile(e)}
            style={{ display: 'none' }}
          />

          {/* 尺寸选择 */}
          <div>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: theme.dim, textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>{t('stampSize', lang)}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { key: '40x30', label: t('horizontal', lang), w: 40, h: 30 },
                { key: '30x40', label: t('vertical', lang), w: 30, h: 40 },
                { key: '35x35', label: t('square', lang), w: 35, h: 35 },
                { key: '70x50', label: t('large', lang), w: 70, h: 50 },
              ].map((s) => {
                const active = s.key === cropRef.current?.sizeKey;
                return (
                  <button
                    key={s.key}
                    onClick={() => cropRef.current?.setSizeKey(s.key)}
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
            <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>{t('zoom', lang)}</span>
            <input
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={cropRef.current?.zoomRel || 1}
              onChange={(e) => cropRef.current?.onZoomSlider(e)}
              disabled={!cropRef.current?.hasImg}
              style={{ width: '100%', accentColor: theme.accent, opacity: cropRef.current?.hasImg ? 1 : 0.5 }}
            />
          </div>
        </div>

        <CropStage ref={cropRef} onPress={handleMachinePress} hideControls lang={lang} />
        <StampPressMachine cropRef={cropRef} onPress={handleMachinePress} />
      </div>

      {/* 暂存台 */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <TraySidebar
          tray={tray}
          onRemove={handleRemove}
          onAddToAlbum={handleAddToAlbum}
          lang={lang}
        />
      </div>

      {/* 集邮册 */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1200 }}>
          <Album stamps={stamps} lang={lang} />
        </div>
      </div>

      {/* Toast 提示 */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            background: theme.accent,
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            zIndex: 1000,
            animation: 'fadeInOut 2s ease-in-out forwards',
          }}
        >
          {toast}
          <style>{`
            @keyframes fadeInOut {
              0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
              10% { opacity: 1; transform: translateX(-50%) translateY(0); }
              90% { opacity: 1; transform: translateX(-50%) translateY(0); }
              100% { opacity: 0; transform: translateX(-50%) translateY(20px); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

export default App;
