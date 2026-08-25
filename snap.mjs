import { chromium } from '@playwright/test';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium'
});

const page = await browser.newPage({
  viewport: { width: 1024, height: 1200 }
});

try {
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/app.png' });
  console.log('✓ 截图已保存到 /tmp/app.png');
} catch (err) {
  console.error('❌ 错误:', err.message);
  process.exit(1);
}

await browser.close();
