import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { FiltersEngine, Request } from '@ghostery/adblocker';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
const ref = args.ref || 'HEAD';
const browserPath = args.browser || process.env.CHROME_PATH || '';
const cache = path.join(os.tmpdir(), 'prompts-please', 'adblock-lists');
const LISTS = {
  'EasyList': 'https://easylist.to/easylist/easylist.txt',
  'EasyPrivacy': 'https://easylist.to/easylist/easyprivacy.txt',
  'uBlock filters': 'https://ublockorigin.github.io/uAssets/filters/filters.txt',
  'uBlock privacy': 'https://ublockorigin.github.io/uAssets/filters/privacy.txt',
  'AdGuard Base': 'https://filters.adtidy.org/extension/ublock/filters/2.txt',
  'EasyList China': 'https://easylist-downloads.adblockplus.org/easylistchina.txt',
  'AdGuard Chinese': 'https://filters.adtidy.org/extension/ublock/filters/224.txt'
};
const SITES = [
  { name: 'GitHub Pages', base: 'https://87earth.github.io/prompts-please/' },
  { name: 'B 站 Toy', base: 'https://www.bilibilitoy.com/toy/prompts-please/48894884973568-v1/' }
];

fs.mkdirSync(cache, { recursive: true });
const engines = [];
for (const [name, url] of Object.entries(LISTS)) {
  const file = path.join(cache, name.replace(/\W+/g, '_') + '.txt');
  const fresh = fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < 24 * 3600 * 1000 && !('refresh' in args);
  if (!fresh) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('下載失敗：' + name + ' ' + res.status);
    fs.writeFileSync(file, await res.text());
  }
  engines.push({ name, engine: FiltersEngine.parse(fs.readFileSync(file, 'utf8'), { loadCosmeticFilters: true, loadGenericCosmeticsFilters: true }) });
}

const typeOf = f => /\.js$/.test(f) ? 'script' : /\.css$/.test(f) ? 'stylesheet' : /\.(png|gif|jpe?g|webp|svg)$/.test(f) ? 'image' : /\.(woff2?|ttf|otf)$/.test(f) ? 'font' : '';
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const sets = [{ label: ref, files: execFileSync('git', ['ls-tree', '-r', '--name-only', ref, 'index.html', 'src', 'data', 'assets'], { cwd: ROOT }).toString().split('\n').filter(Boolean) }];
if (args.pkg) {
  const dir = path.resolve(ROOT, args.pkg);
  sets.push({ label: path.relative(ROOT, dir), files: walk(dir).map(f => path.relative(dir, f).split(path.sep).join('/')) });
}
const blocked = [];
let checked = 0;
for (const set of sets) {
  for (const f of set.files) {
    const type = typeOf(f);
    if (!type) continue;
    for (const site of SITES) {
      checked++;
      const req = Request.fromRawDetails({ url: site.base + f, sourceUrl: site.base + 'index.html', type });
      for (const { name, engine } of engines) {
        const m = engine.match(req);
        if (m.match && !m.exception) blocked.push(set.label + '：' + f + '（' + site.name + '）← ' + name + '：' + (m.filter ? m.filter.toString() : ''));
      }
    }
  }
}

const profile = path.join(os.tmpdir(), 'prompts-please', 'chrome-adblock');
fs.mkdirSync(profile, { recursive: true });
const browser = await puppeteer.launch(Object.assign(browserPath ? { executablePath: browserPath } : { channel: 'chrome' }, { headless: true, userDataDir: profile }));
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900 });
await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href + '?lang=tw&seed=15');
await page.waitForFunction(() => document.querySelector('[data-act="to-select"]'));
const SCREENS = {
  標題: () => PP.UI.title(),
  選模型: () => { PP.UI.title(); document.querySelector('[data-act="to-select"]').click(); },
  日報: () => { PP.E.newRun('gpt', 15, 'easy'); PP.UI.morning(); },
  上班: () => { PP.E.newRun('claude', 15, 'easy'); PP.E.devJump('teacher', 3); PP.UI.work(); },
  回覆單: () => { PP.E.newRun('gpt', 15, 'easy'); PP.E.devJump('dinner', 2); PP.UI.work(); document.querySelector('[data-act="deliver"]').click(); },
  更新紀錄: () => PP.UI.updates(),
  成就: () => PP.UI.ach(),
  這週結束: () => { PP.E.newRun('gpt', 15, 'easy'); PP.UI.end(); }
};
const hidden = [];
for (const [label, fn] of Object.entries(SCREENS)) {
  await page.evaluate(fn);
  await new Promise(r => setTimeout(r, 300));
  const dom = await page.evaluate(() => {
    const ids = new Set();
    const classes = new Set();
    document.querySelectorAll('#stage *').forEach(el => {
      if (el.id) ids.add(el.id);
      el.classList.forEach(c => classes.add(c));
    });
    return { ids: [...ids], classes: [...classes] };
  });
  for (const site of SITES) {
    const u = new URL(site.base);
    for (const { name, engine } of engines) {
      const css = engine.getCosmeticsFilters({ url: site.base, hostname: u.hostname, domain: u.hostname.split('.').slice(-2).join('.'), classes: dom.classes, ids: dom.ids, hrefs: [], getBaseRules: true, getInjectionRules: false, getExtendedRules: false, getRulesFromDOM: true, getRulesFromHostname: true }).styles || '';
      if (!css.trim()) continue;
      const gone = await page.evaluate(css => {
        const els = [...document.querySelectorAll('#stage *')];
        const shown = () => els.map(el => getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden');
        const before = shown();
        const st = document.createElement('style');
        st.textContent = css;
        document.head.appendChild(st);
        const after = shown();
        st.remove();
        const name = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).join('.') : '');
        return [...new Set(els.filter((el, i) => before[i] && !after[i]).map(name))].slice(0, 8);
      }, css);
      if (gone.length) hidden.push(label + '（' + site.name + '）← ' + name + '：' + gone.join('、'));
    }
  }
}
await browser.close();

console.log(JSON.stringify({ 清單: Object.keys(LISTS), 檢查的請求: checked, 會被擋的檔案: blocked, 會被藏起來的元素: hidden }, null, 1));
process.exitCode = blocked.length || hidden.length ? 1 : 0;
