import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
const pkg = path.resolve(ROOT, args.dir || 'work/toy/pkg');
const DICT = 'src/vendor/opencc-js';
const rel = f => path.relative(pkg, f).split(path.sep).join('/');
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const guard = d => {
  for (const name of fs.readdirSync(d)) {
    const p = path.join(d, name);
    const st = fs.lstatSync(p);
    if (st.isSymbolicLink()) throw new Error('裡面有目錄連結，不刪：' + p);
    if (st.isDirectory()) guard(p);
  }
};
const clear = d => {
  if (!fs.existsSync(d)) return;
  guard(d);
  fs.rmSync(d, { recursive: true });
};

const CODE = [
  ['src/lang.js', '  PP.lang = detect();', "  PP.lang = 'cn';"],
  ['src/lang.js', '    if (!HAN.test(s)) return s;', '    return s;'],
  ['src/ui.js', '  function langHTML() {\n', "  function langHTML() {\n    return '';\n"],
  ['index.html', '<script src="data/zh.js"></script>\n', ''],
  ['index.html', '<script src="' + DICT + '/t2cn.js"></script>\n', '']
];

const test = 'test' in args;
const pre = path.join(ROOT, 'work', 'toy', 'pre-cn');
if (test) {
  clear(pre);
  fs.cpSync(pkg, pre, { recursive: true });
}

const loadOpenCC = src => {
  const g = {};
  vm.createContext(g);
  vm.runInContext(src, g);
  return g.OpenCC;
};
const O = loadOpenCC(fs.readFileSync(path.join(pkg, DICT, 't2cn.js'), 'utf8'));
const fixCtx = {};
fixCtx.window = fixCtx;
vm.createContext(fixCtx);
vm.runInContext(fs.readFileSync(path.join(pkg, 'data/zh.js'), 'utf8'), fixCtx);
const fix = fixCtx.PP.ZH_FIX;
const cfg = O.Locale.configs.tw2sp;
const trie = group => {
  const t = new O.Trie();
  t.loadDictGroup(group);
  return t;
};
const norm = O.ConverterFactory(...cfg.normalizationChain);
const seg = trie(cfg.segmentation);
const chain = cfg.conversionChain.map((g, i) => trie(i === 0 && fix && fix.length ? [fix, ...g] : g));
const conv = s => seg.segment(norm(s)).map(x => chain.reduce((a, t) => t.convert(a), x)).join('');

for (const [file, from, to] of CODE) {
  const p = path.join(pkg, file);
  const s = fs.readFileSync(p, 'utf8');
  const n = s.split(from).length - 1;
  if (n !== 1) throw new Error(`${file}：「${from.trim()}」出現 ${n} 次，應該是 1 次`);
  fs.writeFileSync(p, s.replace(from, to));
}
let changed = 0;
for (const f of walk(pkg).map(rel).filter(f => /\.(js|html|css)$/.test(f) && !f.startsWith(DICT + '/') && f !== 'data/zh.js' && f !== 'src/lang.js')) {
  const p = path.join(pkg, f);
  const s = fs.readFileSync(p, 'utf8');
  const c = conv(s);
  if (c !== s) {
    fs.writeFileSync(p, c);
    changed += 1;
  }
}
clear(path.join(pkg, DICT));
if (!fs.readdirSync(path.join(pkg, 'src/vendor')).length) fs.rmdirSync(path.join(pkg, 'src/vendor'));
fs.rmSync(path.join(pkg, 'data/zh.js'));
console.log(`轉成簡體：${changed} 個檔案；拿掉 ${DICT}/、data/zh.js 和語言切換`);

if (test) {
  const browser = await puppeteer.launch(Object.assign(args.browser || process.env.CHROME_PATH ? { executablePath: args.browser || process.env.CHROME_PATH } : { channel: 'chrome' }, { headless: true, userDataDir: path.join(os.tmpdir(), 'prompts-please', 'chrome-cn') }));
  const screens = async dir => {
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 450 });
    await page.goto(pathToFileURL(path.join(dir, 'index.html')).href + '?lang=cn');
    await page.waitForFunction(() => document.querySelector('[data-act="to-select"]'));
    const out = await page.evaluate(() => {
      const E = PP.E;
      const rows = [];
      const homeDay = id => {
        const i = PP.days.findIndex(d => d.slots.some(sl => sl === id || (sl && sl.image === id)));
        return i < 0 ? 2 : i + 1;
      };
      Object.keys(PP.clients).forEach(id => {
        ['claude', 'gpt', 'deepseek'].forEach(model => {
          E.newRun(model, 7, 'easy');
          E.devJump(id, homeDay(id));
          PP.UI.work();
          PP.zhFlush();
          rows.push(model + ':' + id + '\n' + document.getElementById('stage').innerText);
        });
      });
      return rows;
    });
    await page.close();
    return out;
  };
  const a = await screens(pre);
  const b = await screens(pkg);
  await browser.close();
  const diff = a.map((x, i) => x === b[i] ? null : x.split('\n')[0]).filter(Boolean);
  if (a.length !== b.length || diff.length) {
    console.log('失敗 畫面比對：' + (diff.slice(0, 5).join('、') || '數量不同'));
    process.exit(1);
  }
  console.log(`通過 畫面比對：${a.length} 個客人畫面和執行時轉換的結果相同`);

  const t = path.join(ROOT, 'work', 'toy', 'test-cn');
  clear(t);
  fs.cpSync(pkg, t, { recursive: true });
  const fuzz = fs.readFileSync(path.join(ROOT, 'tools', 'fuzz.mjs'), 'utf8');
  const cut = "'data/zh.js', '" + DICT + "/t2cn.js', ";
  if (!fuzz.includes(cut)) throw new Error('fuzz.mjs 的檔案清單和預期不同');
  fs.mkdirSync(path.join(t, 'tools'), { recursive: true });
  fs.writeFileSync(path.join(t, 'tools', 'fuzz.mjs'), fuzz.replace(cut, ''));
  let failed = 0;
  const run = (label, cmd, cwd) => {
    try {
      execFileSync('node', cmd, { cwd, stdio: 'pipe', maxBuffer: 1 << 28 });
      console.log('通過', label);
    } catch (e) {
      failed += 1;
      console.log('失敗', label);
      console.log(String(e.stdout).slice(-2000) + String(e.stderr).slice(-2000));
    }
  };
  for (const a2 of ['2700', 'aliases', 'save']) run('fuzz.mjs ' + a2, [path.join('tools', 'fuzz.mjs'), a2], t);
  run('layout_check cn', [path.join(ROOT, 'tools', 'layout_check.mjs'), '--url=' + pathToFileURL(path.join(pkg, 'index.html')).href, '--lang=cn'], ROOT);
  if (failed) process.exit(1);
}
