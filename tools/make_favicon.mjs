import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
const browserPath = args.browser || process.env.CHROME_PATH || '';
const profile = path.join(os.tmpdir(), 'prompts-please', 'chrome-favicon');
fs.mkdirSync(profile, { recursive: true });

const browser = await puppeteer.launch(Object.assign(browserPath ? { executablePath: browserPath } : { channel: 'chrome' }, { headless: true, userDataDir: profile }));
const page = await browser.newPage();
await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
await page.waitForFunction(() => window.PP && PP.icon && document.querySelector('[data-act="to-select"]'));
const out = await page.evaluate(async () => {
  const img = new Image();
  img.src = PP.icon('rice');
  await img.decode();
  const make = (size, scale, bg) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    if (bg) {
      g.fillStyle = bg;
      g.fillRect(0, 0, size, size);
    }
    const w = img.width * scale;
    const h = img.height * scale;
    g.drawImage(img, Math.round((size - w) / 2), Math.round((size - h) / 2), w, h);
    return c.toDataURL('image/png');
  };
  return { w: img.width, h: img.height, f16: make(16, 1, null), f32: make(32, 2, null), f180: make(180, 12, '#1b1e27') };
});
await browser.close();
const save = (name, url) => fs.writeFileSync(path.join(ROOT, 'assets', name), Buffer.from(url.split(',')[1], 'base64'));
save('favicon-16.png', out.f16);
save('favicon-32.png', out.f32);
save('apple-touch-icon.png', out.f180);
console.log('白米飯圖示 ' + out.w + '×' + out.h + ' → assets/favicon-16.png、favicon-32.png、apple-touch-icon.png');
