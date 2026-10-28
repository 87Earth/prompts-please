import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
const out = path.resolve(ROOT, args.out || 'work/toy/pkg');
const spec = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/toy_patch.json'), 'utf8'));
const git = (...a) => execFileSync('git', a, { cwd: ROOT, maxBuffer: 1 << 28 });

if (!out.startsWith(path.join(ROOT, 'work') + path.sep)) throw new Error('輸出資料夾要在 work/ 裡：' + out);
const walk = d => {
  for (const name of fs.readdirSync(d)) {
    const p = path.join(d, name);
    const st = fs.lstatSync(p);
    if (st.isSymbolicLink()) throw new Error('裡面有目錄連結，不刪：' + p);
    if (st.isDirectory()) walk(p);
  }
};
const clear = d => {
  if (!fs.existsSync(d)) return;
  walk(d);
  fs.rmSync(d, { recursive: true });
};
clear(out);

const files = git('ls-tree', '-r', '--name-only', 'HEAD', 'index.html', 'src', 'data', 'assets').toString().split('\n').filter(Boolean);
for (const f of files) {
  const p = path.join(out, f);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, git('show', 'HEAD:' + f));
}

const errors = [];
for (const { file, from, to, n = 1 } of spec.patches) {
  const p = path.join(out, file);
  const s = fs.readFileSync(p, 'utf8');
  const count = s.split(from).length - 1;
  if (count !== n) {
    errors.push(`${file}：「${from}」出現 ${count} 次，應該是 ${n} 次`);
    continue;
  }
  fs.writeFileSync(p, s.split(from).join(to));
}
for (const f of files.filter(f => /\.(js|html|css|json)$/.test(f) && !f.startsWith('src/vendor/'))) {
  const s = fs.readFileSync(path.join(out, f), 'utf8');
  for (const w of spec.forbid) if (s.includes(w)) errors.push(`${f}：還有「${w}」`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
const head = git('rev-parse', '--short', 'HEAD').toString().trim();
console.log(`${head} 的 ${files.length} 個檔案 → ${path.relative(ROOT, out)}，改了 ${spec.patches.length} 處`);

if ('test' in args) {
  const test = path.join(ROOT, 'work', 'toy', 'test');
  clear(test);
  fs.cpSync(out, test, { recursive: true });
  for (const f of ['fuzz.mjs', 'zh_check.mjs', 'layout_check.mjs']) fs.cpSync(path.join(ROOT, 'tools', f), path.join(test, 'tools', f));
  const t2cn = 'node_modules/opencc-js/dist/umd/t2cn.js';
  fs.cpSync(path.join(ROOT, t2cn), path.join(test, t2cn));
  let failed = 0;
  for (const [tool, ...a] of [['fuzz.mjs', '2700'], ['fuzz.mjs', 'aliases'], ['fuzz.mjs', 'save'], ['zh_check.mjs'], ['layout_check.mjs', '--lang=cn'], ['layout_check.mjs', '--lang=tw']]) {
    try {
      execFileSync('node', [path.join('tools', tool), ...a], { cwd: test, stdio: 'pipe', maxBuffer: 1 << 28 });
      console.log('通過', tool, ...a);
    } catch (e) {
      failed += 1;
      console.log('失敗', tool, ...a);
      console.log(String(e.stdout).slice(-2000) + String(e.stderr).slice(-2000));
    }
  }
  if (failed) process.exit(1);
}
