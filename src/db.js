import { openDB } from 'idb';

const DB_NAME = 'StampWorks';
const DB_VERSION = 1;

// 初始化数据库
async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Album 存储（集邮册）
      if (!db.objectStoreNames.contains('albums')) {
        const albumStore = db.createObjectStore('albums', { keyPath: 'id' });
        albumStore.createIndex('createdAt', 'createdAt');
      }

      // Stamp 存储（邮票元数据）
      if (!db.objectStoreNames.contains('stamps')) {
        const stampStore = db.createObjectStore('stamps', { keyPath: 'id' });
        stampStore.createIndex('albumId', 'albumId');
        stampStore.createIndex('createdAt', 'createdAt');
      }

      // 图片数据（二进制 Blob）
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images', { keyPath: 'id' });
      }
    },
  });
}

// 创建新集邮册
export async function createAlbum(title = '默认集邮册') {
  const db = await initDB();
  const album = {
    id: `album-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    coverStyle: 'kraft-brown',
    isPublic: false,
    createdAt: Date.now(),
    stampIds: [],
    nextNo: 1,
  };
  await db.add('albums', album);
  return album;
}

// 获取所有集邮册
export async function getAllAlbums() {
  const db = await initDB();
  return db.getAll('albums');
}

// 获取单个集邮册
export async function getAlbum(albumId) {
  const db = await initDB();
  return db.get('albums', albumId);
}

// 创建邮票元数据
export async function createStamp(albumId, {
  serialNo,
  mold,
  source,
  paper = 'plain',
  texts = [],
  postmarks = [],
  thumbRef,
  renderedRef,
} = {}) {
  const db = await initDB();
  const stamp = {
    id: `stamp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    albumId,
    serialNo,
    issuedAt: Date.now(),
    mold,
    source,
    paper,
    texts,
    postmarks,
    clipNotes: [],
    thumbRef,
    renderedRef,
  };
  await db.add('stamps', stamp);

  // 更新 album 的 stampIds 和 nextNo
  const album = await db.get('albums', albumId);
  album.stampIds.push(stamp.id);
  album.nextNo = serialNo + 1;
  await db.put('albums', album);

  return stamp;
}

// 获取单个邮票
export async function getStamp(stampId) {
  const db = await initDB();
  return db.get('stamps', stampId);
}

// 获取相册内所有邮票
export async function getStampsByAlbum(albumId) {
  const db = await initDB();
  return db.getAllFromIndex('stamps', 'albumId', albumId);
}

// 存储图片二进制数据
export async function saveImage(imageId, blob) {
  const db = await initDB();
  await db.put('images', { id: imageId, blob });
  return imageId;
}

// 获取图片二进制数据
export async function getImage(imageId) {
  const db = await initDB();
  const record = await db.get('images', imageId);
  return record?.blob;
}

// 更新邮票
export async function updateStamp(stampId, updates) {
  const db = await initDB();
  const stamp = await db.get('stamps', stampId);
  Object.assign(stamp, updates);
  await db.put('stamps', stamp);
  return stamp;
}

// 从相册删除邮票
export async function deleteStamp(stampId) {
  const db = await initDB();
  const stamp = await db.get('stamps', stampId);

  const album = await db.get('albums', stamp.albumId);
  album.stampIds = album.stampIds.filter(id => id !== stampId);
  await db.put('albums', album);

  await db.delete('stamps', stampId);
  if (stamp.thumbRef) await db.delete('images', stamp.thumbRef);
  if (stamp.renderedRef) await db.delete('images', stamp.renderedRef);
}

// 请求持久化存储权限
export async function requestPersistent() {
  if (navigator.storage?.persist) {
    return navigator.storage.persist();
  }
  return false;
}
