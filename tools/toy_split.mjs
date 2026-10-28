import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
const pkg = path.resolve(ROOT, args.dir || 'work/toy/pkg');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/toy_patch.json'), 'utf8')).split;
const htmlPath = path.join(pkg, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const scriptsOf = h => [...h.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);

const load = list => {
  const ctx = {};
  ctx.window = ctx;
  vm.createContext(ctx);
  const owners = {};
  for (const f of list.filter(s => s.startsWith('data/'))) {
    const before = new Set(Object.keys(ctx.PP || {}));
    vm.runInContext(fs.readFileSync(path.join(pkg, f), 'utf8'), ctx, { filename: f });
    for (const k of Object.keys(ctx.PP)) if (!before.has(k)) owners[k] = f;
  }
  return { PP: ctx.PP, owners };
};

const before = load(scriptsOf(html));
for (const [k, ids] of Object.entries(cfg.drop || {})) {
  for (const id of ids) {
    if (!before.PP[k] || !(id in before.PP[k])) throw new Error(`要拿掉的 PP.${k}.${id} 不存在`);
    delete before.PP[k][id];
  }
  console.log(`拿掉 PP.${k}：${ids.join('、')}`);
}
const isObj = v => v !== null && typeof v === 'object';
const prop = (expr, k) => /^[A-Za-z_$][\w$]*$/.test(k) ? `${expr}.${k}` : `${expr}[${JSON.stringify(k)}]`;
let newHtml = html;
let total = 0;

for (const file of cfg.files) {
  if (!scriptsOf(newHtml).includes(file)) throw new Error('index.html 沒有載入 ' + file);
  const base = path.basename(file, '.js');
  const chunks = [];
  let prefix = [];
  const emit = (name, line) => {
    chunks.push({ name, code: ['window.PP = window.PP || {};', ...prefix, line].filter(Boolean).join('\n') + '\n' });
    prefix = [];
  };
  const split = (expr, name, value, depth) => {
    if (depth <= 0 || !isObj(value) || JSON.stringify(value).length < cfg.min) return emit(name, `${expr} = ${JSON.stringify(value)};`);
    const arr = Array.isArray(value);
    const entries = Object.entries(value);
    const own = entries.map(([, v]) => arr || isObj(v));
    const shell = arr ? [] : Object.fromEntries(entries.map(([k, v], i) => [k, own[i] ? (Array.isArray(v) ? [] : {}) : v]));
    prefix.push(`${expr} = ${JSON.stringify(shell)};`);
    entries.forEach(([k, v], i) => {
      if (!own[i]) return;
      const label = arr ? String(i).padStart(2, '0') + (isObj(v) && typeof v.id === 'string' ? '-' + v.id : '') : k;
      split(arr ? `${expr}[${i}]` : prop(expr, k), `${name}.${label}`, v, depth - 1);
    });
    if (prefix.length) emit(name, '');
  };
  for (const k of Object.keys(before.owners).filter(k => before.owners[k] === file)) split('PP.' + k, k, before.PP[k], cfg.depthBy[k] ?? cfg.depth);
  const names = chunks.map(c => `data/${base}/${c.name.replace(/[^A-Za-z0-9_.-]/g, '_')}.js`);
  if (new Set(names).size !== names.length) throw new Error(file + ' 拆出的檔名重複');
  fs.mkdirSync(path.join(pkg, 'data', base), { recursive: true });
  chunks.forEach((c, i) => fs.writeFileSync(path.join(pkg, names[i]), c.code));
  fs.rmSync(path.join(pkg, file));
  newHtml = newHtml.replace(`<script src="${file}"></script>`, names.map(n => `<script src="${n}"></script>`).join('\n'));
  total += names.length;
  console.log(`${file} → ${names.length} 個檔案`);
}
fs.writeFileSync(htmlPath, newHtml);

const after = load(scriptsOf(newHtml));
const diff = Object.keys(before.PP).filter(k => JSON.stringify(before.PP[k]) !== JSON.stringify(after.PP[k]));
if (diff.length || Object.keys(before.PP).join() !== Object.keys(after.PP).join()) {
  console.error('拆完資料不一致：' + (diff.join('、') || 'PP 的鍵順序不同'));
  process.exit(1);
}
console.log(`共 ${total} 個小檔，資料與拆之前完全相同`);

if ('test' in args) {
  let failed = 0;
  for (const lang of ['cn', 'tw']) {
    try {
      execFileSync('node', [path.join(ROOT, 'tools', 'layout_check.mjs'), '--url=' + pathToFileURL(htmlPath).href, '--lang=' + lang], { cwd: ROOT, stdio: 'pipe', maxBuffer: 1 << 28 });
      console.log('通過 layout_check', lang);
    } catch (e) {
      failed += 1;
      console.log('失敗 layout_check', lang);
      console.log(String(e.stdout).slice(-2000) + String(e.stderr).slice(-2000));
    }
  }
  if (failed) process.exit(1);
}
