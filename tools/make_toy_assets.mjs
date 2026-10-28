import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
const out = path.resolve(args.out || path.join(ROOT, 'work', 'toy'));
const lang = args.lang === 'tw' ? 'tw' : 'cn';
const browserPath = args.browser || process.env.CHROME_PATH || '';
const profile = path.join(os.tmpdir(), 'prompts-please', 'chrome-toy');
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(profile, { recursive: true });

const browser = await puppeteer.launch(Object.assign(browserPath ? { executablePath: browserPath } : { channel: 'chrome' }, { headless: true, userDataDir: profile }));
const page = await browser.newPage();
await page.setViewport({ width: 800, height: 450, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href + '?lang=' + lang + '&seed=1');
await page.waitForFunction(() => document.querySelector('[data-act="to-select"]') && document.getElementById('office'));
await new Promise(r => setTimeout(r, 1500));

const icon = await page.evaluate(async () => {
  const office = document.getElementById('office');
  const strip = document.createElement('canvas');
  strip.width = 600;
  strip.height = 80;
  const sg = strip.getContext('2d');
  sg.imageSmoothingEnabled = false;
  sg.drawImage(office, 158, 0, 600, 80, 0, 0, 600, 80);
  const rice = new Image();
  rice.src = PP.icon('rice');
  await rice.decode();
  const ids = PP.models.map(m => m.id);
  const cover = document.createElement('div');
  cover.id = 'toy-cover';
  cover.style.cssText = 'position:fixed;left:0;top:0;width:600px;height:450px;z-index:9999;background:var(--bg);overflow:hidden;color:var(--text);text-align:center;';
  const face = id => '<div style="width:64px"><img src="assets/sprites/portraits/' + id + '.png" style="width:64px;height:64px;display:block;border:0"><div style="margin-top:2px;color:var(--dim)">' + PP.models.find(m => m.id === id).name + '</div></div>';
  cover.innerHTML = '<div style="position:absolute;left:0;top:0;width:600px;height:80px" id="tc-strip"></div>'
    + '<div style="position:absolute;left:0;right:0;top:104px;font-size:48px;line-height:52px;color:var(--paper);text-shadow:2px 2px 0 var(--ink)">Prompts, Please</div>'
    + '<div style="position:absolute;left:0;right:0;top:160px;font-size:24px;line-height:28px;color:var(--orange);text-shadow:2px 2px 0 var(--ink)">請出示提示詞</div>'
    + '<div style="position:absolute;left:0;right:0;top:200px;line-height:16px;color:var(--dim)">當一天大型語言模型：只能用工具看世界，<br>在使用者等不及之前把事情做完，賺一碗白米飯。</div>'
    + '<div style="position:absolute;left:5px;top:256px;width:590px;display:flex;justify-content:space-between">' + ids.map(face).join('') + '</div>'
    + '<div style="position:absolute;left:0;right:0;top:366px;line-height:16px;color:var(--paper)">九個底模・五天・二十五個結局</div>'
    + '<div style="position:absolute;left:0;right:0;top:390px;display:flex;justify-content:center;align-items:center;gap:8px;color:var(--paper)"><span id="tc-rice"></span><span>薪水是白米飯</span></div>';
  document.body.appendChild(cover);
  strip.style.cssText = 'width:600px;height:80px;display:block;image-rendering:pixelated';
  cover.querySelector('#tc-strip').appendChild(strip);
  const rc = document.createElement('canvas');
  rc.width = rice.width;
  rc.height = rice.height;
  rc.getContext('2d').drawImage(rice, 0, 0);
  rc.style.cssText = 'width:' + rice.width * 3 + 'px;height:' + rice.height * 3 + 'px;image-rendering:pixelated;display:block';
  cover.querySelector('#tc-rice').appendChild(rc);
  PP.zhFlush();
  await Promise.all([...cover.querySelectorAll('img')].map(i => i.decode()));
  const make = size => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#1b1e27';
    g.fillRect(0, 0, size, size);
    const k = Math.floor(size * 0.7 / Math.max(rice.width, rice.height));
    const w = rice.width * k;
    const h = rice.height * k;
    g.drawImage(rice, Math.round((size - w) / 2), Math.round((size - h) / 2), w, h);
    return c.toDataURL('image/png');
  };
  return make(512);
});
await new Promise(r => setTimeout(r, 300));
const coverPath = path.join(out, 'cover.png');
const iconPath = path.join(out, 'icon.png');
await page.screenshot({ path: coverPath, clip: { x: 0, y: 0, width: 600, height: 450 } });
fs.writeFileSync(iconPath, Buffer.from(icon.split(',')[1], 'base64'));
await browser.close();
console.log(JSON.stringify({ cover: coverPath, coverBytes: fs.statSync(coverPath).size, icon: iconPath, iconBytes: fs.statSync(iconPath).size }));
