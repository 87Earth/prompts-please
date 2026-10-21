import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
const ref = args.ref || 'HEAD';
const prefix = '/' + (args.base || 'prompts-please') + '/';
const browserPath = args.browser || process.env.CHROME_PATH || '';
const RUNS = [
  ['claude', '15', 'good', 'easy'],
  ['deepseek', '7', 'good', 'hard'],
  ['gpt', '15', 'trap45', 'easy']
];
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.woff2': 'font/woff2' };

const git = (...a) => execFileSync('git', a, { cwd: ROOT, maxBuffer: 256 * 1024 * 1024 });
const files = new Map();
let missing = [];
const requested = new Set();
let server = null;
let site = args.url || '';

if (!site) {
  git('ls-tree', '-r', '--name-only', '-z', ref).toString().split('\0').filter(Boolean).forEach(f => files.set(f, null));
  server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let rel = p.startsWith(prefix) ? p.slice(prefix.length) : null;
    if (rel === '' || (rel && rel.endsWith('/'))) rel += 'index.html';
    if (rel === null || !files.has(rel)) {
      if (p !== '/favicon.ico') missing.push(p);
      res.writeHead(404);
      res.end();
      return;
    }
    if (files.get(rel) === null) files.set(rel, git('show', ref + ':' + rel));
    requested.add(rel);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(rel)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(files.get(rel));
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  site = 'http://127.0.0.1:' + server.address().port + prefix;
}

function playtest(model, seed, mode, diff) {
  const a = [path.join(ROOT, 'tools', 'playtest.mjs'), '--url=' + site, '--model=' + model, '--seed=' + seed, '--mode=' + mode, '--diff=' + diff, '--shots=0'];
  if (browserPath) a.push('--browser=' + browserPath);
  return new Promise(resolve => {
    const p = spawn(process.execPath, a, { cwd: ROOT });
    let out = '';
    let err = '';
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { err += d; });
    p.on('close', code => {
      let j = null;
      try {
        j = JSON.parse(out.slice(out.indexOf('{')));
      } catch (e) {
        j = null;
      }
      resolve({ run: model + ' 種子 ' + seed + ' ' + mode + (diff === 'hard' ? '（困難）' : ''), code, phase: j && j.final && j.final.phase, trust: j && j.final && j.final.trust, errors: j ? j.errors : [err.trim() || out.trim()] });
    });
  });
}

async function phone() {
  const profile = path.join(os.tmpdir(), 'prompts-please', 'chrome-pages-phone');
  fs.mkdirSync(profile, { recursive: true });
  const browser = await puppeteer.launch(Object.assign(browserPath ? { executablePath: browserPath } : { channel: 'chrome' }, { headless: true, userDataDir: profile }));
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('requestfailed', r => errors.push('requestfailed: ' + r.url()));
  await page.emulate({ viewport: { width: 844, height: 390, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' });
  await page.goto(site + '?seed=15', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.querySelector('[data-act="to-select"]'));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const info = await page.evaluate(() => ({
    fonts: document.fonts.check('12px FP') && document.fonts.check('12px FPM') && [...document.fonts].every(f => f.status === 'loaded'),
    portraits: [...document.querySelectorAll('.t-faces img')].every(i => i.naturalWidth > 0),
    touch: PP.TOUCH
  }));
  await page.evaluate(() => document.querySelector('[data-act="to-select"]').click());
  await sleep(200);
  await page.evaluate(() => document.querySelector('[data-act="start-run"]').click());
  await sleep(300);
  await page.evaluate(() => { const b = document.querySelector('[data-act="start-run-yes"]'); if (b) b.click(); });
  await sleep(300);
  await page.evaluate(() => document.querySelector('[data-act="open-shop"]').click());
  await sleep(600);
  const card = '.t-cards .card[data-card="ask"]';
  const usedAsk = () => page.evaluate(() => PP.E.state().enc.used.ask || 0);
  await page.tap(card);
  await sleep(250);
  const firstTap = await usedAsk();
  await page.tap(card);
  await sleep(350);
  const secondTap = await usedAsk();
  await browser.close();
  return Object.assign(info, { firstTapOnlyShowsTip: firstTap === 0, secondTapUsesTool: secondTap === 1, errors });
}

const results = [];
for (const r of RUNS) results.push(await playtest(...r));
const mobile = await phone();
if (server) server.close();

const unused = [...files.keys()].filter(f => f.startsWith('assets/') && !requested.has(f) && !/\.txt$|favicon|apple-touch-icon/.test(f));
const failedRuns = results.filter(r => r.code !== 0 || r.phase !== 'end' && r.phase !== 'gameover' || r.errors.length);
const mobileBad = !mobile.fonts || !mobile.portraits || !mobile.touch || !mobile.firstTapOnlyShowsTip || !mobile.secondTapUsesTool || mobile.errors.length;
missing = [...new Set(missing)];
console.log(JSON.stringify({
  網站: site,
  版本: server ? ref : '（指定網址）',
  上傳檔案: server ? files.size : undefined,
  不存在或大小寫不符的請求: server ? missing : undefined,
  沒被用到的素材: server ? unused : undefined,
  自動試玩: results,
  手機: mobile
}, null, 1));
process.exitCode = failedRuns.length || mobileBad || missing.length ? 1 : 0;
