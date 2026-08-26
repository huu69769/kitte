import { useState, useEffect } from 'react';
import theme from './theme';
import { createAlbum, getAllAlbums, createStamp, requestPersistent } from './db';
import CropStage from './components/CropStage';
import TraySidebar from './components/TraySidebar';
import './App.css';

function App() {
  const [tray, setTray] = useState([]);
  const [album, setAlbum] = useState(null);
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

  const handlePress = ({ stampUrl, thumbUrl, size, sizeKey }) => {
    const stamp = {
      id: `stamp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      no: nextNo.current++,
      stampUrl,
      thumbUrl,
      size,
      sizeKey,
    };
    setTray((t) => [...t, stamp]);
  };

  const handleRemove = (stampId) => {
    setTray((t) => t.filter((s) => s.id !== stampId));
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
        padding: '32px 16px 80px',
        gap: 28,
      }}
    >
      {/* 标题 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: 620,
          alignItems: 'center',
          borderBottom: `1px solid ${theme.line}`,
          paddingBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 3,
            color: theme.ink,
            textTransform: 'uppercase',
          }}
        >
          切手工房
        </div>
        {album && (
          <div style={{ fontSize: 11, color: theme.dim, letterSpacing: 1 }}>
            {album.title}
          </div>
        )}
      </div>

      {/* 取景台 */}
      <CropStage onPress={handlePress} />

      {/* 暂存台 */}
      <TraySidebar tray={tray} onRemove={handleRemove} />
    </div>
  );
}

export default App;
