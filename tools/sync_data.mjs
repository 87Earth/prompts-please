import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const START = '<!-- data -->';
const END = '<!-- /data -->';
const DIRS = { models: 'data/regions.js', tasks: 'data/titles.js', arcs: 'data/tasks/', events: 'data/events.js' };
const tag = f => `<script src="${f}"></script>`;

const htmlPath = path.join(ROOT, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const a = html.indexOf(START);
const b = html.indexOf(END);
if (a < 0 || b < a) {
  console.error('index.html 找不到 ' + START + ' 到 ' + END + ' 的區塊');
  process.exit(1);
}
const before = [...html.slice(a, b).matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
const exists = f => fs.existsSync(path.join(ROOT, f));
const list = before.filter(exists);
const removed = before.filter(f => !exists(f));
const added = [];
const insertAfter = (prefix, anchor, f) => {
  let i = -1;
  list.forEach((x, k) => { if (x.startsWith(prefix)) i = k; });
  if (i < 0) list.forEach((x, k) => { if (x === anchor || x.startsWith(anchor)) i = k; });
  list.splice(i + 1, 0, f);
};
for (const [dir, anchor] of Object.entries(DIRS)) {
  const d = path.join(ROOT, 'data', dir);
  if (!fs.existsSync(d)) continue;
  for (const name of fs.readdirSync(d).filter(n => n.endsWith('.js') && !n.startsWith('_')).sort()) {
    const f = `data/${dir}/${name}`;
    if (list.includes(f)) continue;
    insertAfter(`data/${dir}/`, anchor, f);
    added.push(f);
  }
}
for (const name of fs.readdirSync(path.join(ROOT, 'data')).filter(n => n.endsWith('.js') && !n.startsWith('_')).sort()) {
  const f = 'data/' + name;
  if (list.includes(f)) continue;
  list.push(f);
  added.push(f);
}

if (!added.length && !removed.length) {
  console.log(`index.html 的資料清單是最新的（${list.length} 個檔案）`);
  process.exit(0);
}
const report = [...added.map(f => '新增 ' + f), ...removed.map(f => '移除 ' + f)].join('\n');
if (check) {
  console.error('index.html 的資料清單和資料夾不一致，執行 node tools/sync_data.mjs：\n' + report);
  process.exit(1);
}
fs.writeFileSync(htmlPath, html.slice(0, a) + [START, ...list.map(tag)].join('\n') + '\n' + html.slice(b));
console.log(report + `\nindex.html 已更新（${list.length} 個檔案）`);
