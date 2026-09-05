import { useState, useEffect } from 'react';

/**
 * 视口尺寸（手机适配用，含横竖屏切换）
 * 只测量，不做任何布局判断——尺寸怎么用交给调用方。
 */
export default function useViewport() {
  const [vp, setVp] = useState(() => ({
    w: typeof window === 'undefined' ? 1024 : window.innerWidth,
    h: typeof window === 'undefined' ? 768 : window.innerHeight,
  }));

  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
    };
  }, []);

  return vp;
}
