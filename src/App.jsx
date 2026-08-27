import { useState, useEffect } from 'react';
import theme from './theme';
import { createAlbum, getAllAlbums, createStamp, requestPersistent } from './db';
import CropStage from './components/CropStage';
import StampPressMachine from './components/StampPressMachine';
import TraySidebar from './components/TraySidebar';
import Album from './components/Album';
import './App.css';

function App() {
  const [tray, setTray] = useState([]);
  const [album, setAlbum] = useState(null);
  const [stamps, setStamps] = useState([]); // 已收进集邮册的邮票
  const [pendingStamp, setPendingStamp] = useState(null); // 等待压印的邮票
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
    setPendingStamp(stamp);
  };

  const handleMachinePress = () => {
    if (pendingStamp) {
      setTray((t) => [...t, pendingStamp]);
      setPendingStamp(null);
    }
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
            fontSize: 14,
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

      {/* 压印台 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          gap: 60,
          flexWrap: 'wrap',
        }}
      >
        <CropStage onPress={handlePress} />
      </div>

      {/* 压印机 - 仅在有待压印邮票时显示 */}
      {pendingStamp && (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <StampPressMachine onPress={handleMachinePress} />
        </div>
      )}

      {/* 暂存台 */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <TraySidebar
          tray={tray}
          onRemove={handleRemove}
          onAddToAlbum={handleAddToAlbum}
        />
      </div>

      {/* 集邮册 */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1200 }}>
          <Album stamps={stamps} />
        </div>
      </div>
    </div>
  );
}

export default App;
