import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
const pkg = path.resolve(ROOT, args.dir || 'work/toy/pkg');
const DICT = 'src/vendor/opencc-js/t2cn.js';
const dictFile = path.join(pkg, DICT);
const rel = f => path.relative(pkg, f).split(path.sep).join('/');
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const texts = walk(pkg).filter(f => /\.(js|html|css)$/.test(f) && !rel(f).startsWith('src/vendor/')).map(f => fs.readFileSync(f, 'utf8'));

const loadOpenCC = src => {
  const g = {};
  vm.createContext(g);
  vm.runInContext(src, g);
  return g.OpenCC;
};
const fixCtx = {};
fixCtx.window = fixCtx;
vm.createContext(fixCtx);
vm.runInContext(fs.readFileSync(path.join(pkg, 'data/zh.js'), 'utf8'), fixCtx);
const fix = fixCtx.PP.ZH_FIX;

const make = O => {
  const cfg = O.Locale.configs.tw2sp;
  const trie = group => {
    const t = new O.Trie();
    t.loadDictGroup(group);
    return t;
  };
  const norm = O.ConverterFactory(...cfg.normalizationChain);
  const seg = trie(cfg.segmentation);
  const chain = cfg.conversionChain.map((g, i) => trie(i === 0 && fix && fix.length ? [fix, ...g] : g));
  return { norm, seg, chain, conv: s => seg.segment(norm(s)).map(x => chain.reduce((a, t) => t.convert(a), x)).join('') };
};

const src = fs.readFileSync(dictFile, 'utf8');
const full = make(loadOpenCC(src));
const stages = [];
for (const t of texts) {
  const n = full.norm(t);
  let cur = full.seg.segment(n);
  stages.push(t, n);
  for (const c of full.chain) {
    cur = cur.map(x => c.convert(x));
    stages.push(cur.join(''));
  }
}
const hay = [...new Set(stages.join('\n').match(/[^\s"'`|,;:(){}[\]<>=+*/\\]+/g).filter(w => /[^\x00-\x7f]/.test(w)))].join('\n');

const isDict = s => s.includes('|') && s.split('|').every(e => /^\S+ \S/.test(e));
const found = new Set();
const visit = x => {
  if (typeof x === 'string') {
    if (isDict(x)) found.add(x);
  } else if (Array.isArray(x)) x.forEach(visit);
  else if (x && typeof x === 'object') Object.values(x).forEach(visit);
};
visit(loadOpenCC(src).Locale);
let out = src;
let before = 0;
let after = 0;
for (const lit of found) {
  if (!out.includes('"' + lit + '"')) throw new Error('原檔裡找不到詞典字串：' + lit.slice(0, 40));
  const entries = lit.split('|');
  const keep = entries.filter(e => hay.includes(e.slice(0, e.indexOf(' '))));
  before += entries.length;
  after += keep.length;
  out = out.split('"' + lit + '"').join('"' + (keep.length ? keep.join('|') : ' ') + '"');
}
const dicts = found.size;

const small = make(loadOpenCC(out));
const diffs = texts.filter(t => full.conv(t) !== small.conv(t)).length;
if (diffs) {
  console.error(`精簡後有 ${diffs} 個檔案的簡體結果和完整字典不同，沒有寫入`);
  process.exit(1);
}
fs.writeFileSync(dictFile, out);
fs.writeFileSync(path.join(pkg, 'src/vendor/opencc-js/MODIFIED.md'), '# 修改說明\n\n這個版本的 `t2cn.js` 只保留遊戲文字用得到的詞條（由 `tools/toy_dict.mjs` 產生），程式碼沒有修改。原版是 opencc-js 的 `dist/umd/t2cn.js`，授權見同資料夾的 LICENSE 與 THIRD_PARTY_LICENSES.md。\n');
console.log(`${dicts} 個詞典：${before} 條 → ${after} 條；${DICT} ${src.length} → ${out.length} 字元；${texts.length} 個檔案的簡體結果和完整字典相同`);

if ('test' in args) {
  let failed = 0;
  for (const lang of ['cn', 'tw']) {
    try {
      execFileSync('node', [path.join(ROOT, 'tools', 'layout_check.mjs'), '--url=' + pathToFileURL(path.join(pkg, 'index.html')).href, '--lang=' + lang], { cwd: ROOT, stdio: 'pipe', maxBuffer: 1 << 28 });
      console.log('通過 layout_check', lang);
    } catch (e) {
      failed += 1;
      console.log('失敗 layout_check', lang);
      console.log(String(e.stdout).slice(-2000) + String(e.stderr).slice(-2000));
    }
  }
  if (failed) process.exit(1);
}
