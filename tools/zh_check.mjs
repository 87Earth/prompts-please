import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { loadGame } from './lib/load.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const show = (process.argv.find(a => a.startsWith('--show=')) || '').slice(7);

let OpenCC;
let fontkit;
try {
  OpenCC = require('opencc-js');
  fontkit = await import('fontkit');
} catch (e) {
  console.error('需要先 npm install（opencc-js、fontkit）');
  process.exit(2);
}

const { PP } = loadGame(ROOT);

const HAN = /[㐀-鿿]/;
const walk = d => fs.readdirSync(path.join(ROOT, d), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(d + '/' + e.name) : [d + '/' + e.name]);
const SOURCES = ['index.html', ...walk('data').filter(f => f.endsWith('.js') && f !== 'data/zh.js'), ...fs.readdirSync(path.join(ROOT, 'src')).filter(f => f.endsWith('.js') && f !== 'lang.js').map(f => 'src/' + f)];
const LIT = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`|>([^<>{}]*[㐀-鿿][^<>{}]*)</g;
const texts = [];
for (const f of SOURCES) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const m of src.matchAll(LIT)) {
    const s = m[1] ?? m[2] ?? m[3] ?? m[4];
    if (s && HAN.test(s)) texts.push(s);
  }
}
const uniq = [...new Set(texts)];
const plain = OpenCC.Converter({ from: 'twp', to: 'cn' });
const t2s = OpenCC.Converter({ from: 't', to: 'cn' });
const raw = PP.zhMake([]);
const errors = [];
const base = uniq.map(s => raw(s));
const out = uniq.map(s => PP.zhCN(s));

if (show) {
  let list = [];
  if (show === 'fixes') list = uniq.map((s, i) => [s, out[i], base[i]]).filter(x => x[1] !== x[2]);
  else if (PP.clients[show]) {
    const seen = new Set();
    const walk = v => {
      if (typeof v === 'string') { if (HAN.test(v) && !seen.has(v)) { seen.add(v); list.push([v, PP.zhCN(v)]); } }
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    };
    walk(PP.clients[show]);
  } else list = uniq.map((s, i) => [s, out[i]]).filter(x => show === 'all' || x[0].includes(show) || x[1].includes(show));
  list.forEach(([tw, cn, before]) => console.log('繁 ' + tw + '\n简 ' + cn + (before !== undefined ? '\n原 ' + before : '') + '\n'));
  console.log(list.length + ' 筆');
  process.exit(0);
}

const vendored = fs.readFileSync(path.join(ROOT, 'src/vendor/opencc-js/t2cn.js'));
const upstream = fs.readFileSync(require.resolve('opencc-js/t2cn'));
if (!vendored.equals(upstream)) errors.push('src/vendor/opencc-js/t2cn.js 跟 node_modules 裡的 opencc-js 不一樣');

uniq.forEach((s, i) => {
  if (base[i] !== plain(s)) errors.push('轉換流程跟 OpenCC 不一致：' + s);
});

const keys = new Set();
PP.ZH_FIX.forEach((fix, k) => {
  const [from, to] = fix;
  if (keys.has(from)) errors.push('對照表重複：' + from);
  keys.add(from);
  if (!HAN.test(from)) errors.push('對照表的繁體寫法沒有漢字：' + from);
  if (t2s(to) !== to) errors.push('對照表的簡體寫法會被繁轉簡再改一次：' + from + ' → ' + to);
  const without = PP.zhMake(PP.ZH_FIX.filter((x, j) => j !== k));
  if (!uniq.some((s, i) => s.includes(from) && without(s) !== out[i])) errors.push('對照表這條沒有作用（遊戲裡沒有這個詞，或 OpenCC 已經這樣轉）：' + from + ' → ' + to);
});

const css = fs.readFileSync(path.join(ROOT, 'src/style.css'), 'utf8');
for (const m of css.matchAll(/content:\s*(['"])(.*?)\1/g)) if (HAN.test(m[2]) && PP.zhCN(m[2]) !== m[2]) errors.push('style.css 的 content 有簡體會不同的中文（畫面轉換轉不到，改成頁面上的文字）：' + m[2]);
for (const f of SOURCES) {
  for (const m of fs.readFileSync(path.join(ROOT, f), 'utf8').matchAll(/\b(title|alt|placeholder|aria-label)="([^"]*)"/g)) if (HAN.test(m[2]) && PP.zhCN(m[2]) !== m[2]) errors.push(f + ' 的 ' + m[1] + ' 屬性有簡體會不同的中文（屬性不會被轉換）：' + m[2]);
}

const font = f => fontkit.openSync(path.join(ROOT, 'assets/fonts', f));
const FONTS = {
  tw: [font('fusion-pixel-12px-proportional-tc.woff2'), font('fusion-pixel-12px-monospaced-tc.woff2')],
  cn: [font('fusion-pixel-12px-proportional-sc.woff2'), font('fusion-pixel-12px-monospaced-sc.woff2')]
};
const SYSTEM = /[−☀-➿️‍]|[\u{1f000}-\u{1ffff}]/u;
const missing = (fonts, list) => [...new Set(list.join(''))].filter(ch => ch.codePointAt(0) > 32 && !SYSTEM.test(ch) && fonts.some(f => !f.hasGlyphForCodePoint(ch.codePointAt(0))));
const missTw = missing(FONTS.tw, uniq);
const missCn = missing(FONTS.cn, out);
if (missTw.length) errors.push('繁中字型缺字：' + missTw.join(''));
if (missCn.length) errors.push('簡中字型缺字：' + missCn.join(''));

console.log(JSON.stringify({ texts: uniq.length, fixes: PP.ZH_FIX.length, changedByFixes: out.filter((c, i) => c !== base[i]).length, errors }, null, 1));
process.exit(errors.length ? 1 : 0);
