import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scripts } from './lib/load.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const words = s => new Set(s.split(' '));
const TASK = words('id facts pool userRules titles variants name role avatar patience reward message needs ask hints options lines askLoop attachments avatarLock bash derive endings files grep images linesBy linesCn linesLock linesUs malicious messageBy messageCn messageLock messageUs noAlias noDocEvents noOptEvents noTalkEvents noUserRules okEdits profile recalls refuseChatter roleBy web writeLines wrongEdits');
const REQUIRED = ['name', 'role', 'avatar', 'patience', 'reward', 'message', 'needs', 'ask', 'hints', 'options', 'lines'];
const NEED = words('id text kind bestStyle draw dump facts file flag hidden incident inline later lieLine lines locations mark not of quality recall recap requires rule say styles taint taintRule target tip wrong');
const KINDS = words('edit fact flag flawless image quality trap verify write');
const EVENT = { client: words('type id text talk patience need doc react tip extra boost boss reveal free opt page'), day: words('type id text bill reward patience tool strict slow'), rule: words('type id say tool clients complain opt need') };
const FACT_KEYS = words('facts requires quality wrong taint failFacts unknown from to memory');
const SPECIAL_FACTS = words('memo');

const ctx = { console, Math, JSON, Set, Array, Object, String, Number };
ctx.window = ctx;
vm.createContext(ctx);
const defs = { task: [], event: [], arc: [], model: [], title: [] };
let current = null;
for (const f of scripts(ROOT).filter(s => s.startsWith('data/') || s === 'src/registry.js')) {
  current = f;
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  if (f === 'src/registry.js') {
    for (const k of Object.keys(defs)) {
      const orig = ctx.PP[k];
      ctx.PP[k] = def => {
        defs[k].push([current, def]);
        orig(def);
      };
    }
  }
}
const { PP } = ctx;
const ownerOf = {};
defs.task.forEach(([f, d]) => { if (d && d.id) ownerOf[d.id] = f; });
PP.finalize();

const errors = [];
const err = (f, msg) => errors.push(f + '：' + msg);
PP.problems.forEach(p => err('data', p));

defs.task.forEach(([f, d]) => {
  Object.keys(d).filter(k => !TASK.has(k)).forEach(k => err(f, '不認得的欄位「' + k + '」（拼錯了？新欄位要加進 tools/task_check.mjs）'));
  REQUIRED.filter(k => !(k in d)).forEach(k => err(f, '少了必填欄位「' + k + '」'));
  if (d.facts && (typeof d.facts !== 'object' || Array.isArray(d.facts))) err(f, 'facts 要寫成 { 事實id: { text } }');
  if (d.pool && ![].concat(d.pool).every(p => PP.pools[p])) err(f, 'pool 指到不存在的題庫：' + d.pool);
  if (d.variants && typeof d.variants !== 'function' && !Array.isArray(d.variants)) err(f, 'variants 要是陣列或函式');
});

const checkRefs = (f, x, where) => {
  if (Array.isArray(x)) return x.forEach(v => checkRefs(f, v, where));
  if (!x || typeof x !== 'object') return;
  for (const [k, v] of Object.entries(x)) {
    if (FACT_KEYS.has(k) || ((k === 'ok' || k === 'bad') && where.endsWith('recall'))) {
      [].concat(v).filter(s => typeof s === 'string' && !SPECIAL_FACTS.has(s) && !PP.facts[s]).forEach(s => err(f, where + '.' + k + ' 指到不存在的事實「' + s + '」'));
    }
    if (k !== 'facts' || typeof v === 'object') checkRefs(f, v, where + '.' + k);
  }
};
for (const [id, c] of Object.entries(PP.clients)) {
  const f = ownerOf[id] || 'data（舊寫法）';
  if (!Array.isArray(c.needs) || !c.needs.length) {
    err(f, 'needs 要是至少一項的陣列');
    continue;
  }
  c.needs.forEach((n, i) => {
    Object.keys(n).filter(k => !NEED.has(k)).forEach(k => err(f, `needs[${i}] 不認得的欄位「${k}」`));
    ['id', 'text', 'kind'].filter(k => !(k in n)).forEach(k => err(f, `needs[${i}] 少了「${k}」`));
    if (n.kind && !KINDS.has(n.kind)) err(f, `needs[${i}] 的 kind「${n.kind}」不存在`);
  });
  (c.variants || []).forEach((v, i) => Object.keys(v).filter(k => !TASK.has(k)).forEach(k => err(f, `variants[${i}] 不認得的欄位「${k}」`)));
  checkRefs(f, c, id);
}

defs.event.forEach(([f, d]) => {
  const allowed = EVENT[d.type];
  if (allowed) Object.keys(d).filter(k => !allowed.has(k)).forEach(k => err(f, '不認得的欄位「' + k + '」'));
});
Object.entries(PP.pools).forEach(([p, ids]) => ids.filter(id => !PP.clients[id]).forEach(id => err('data/days.js', `題庫 ${p} 的 ${id} 不存在`)));
PP.days.forEach(d => d.slots.forEach(s => {
  const id = typeof s === 'string' ? s : s.image;
  if (id && !PP.clients[id]) err('data/days.js', `第 ${d.day} 天的 ${id} 不存在`);
  if (typeof s !== 'string' && !PP.pools[s.pool]) err('data/days.js', `第 ${d.day} 天的題庫 ${s.pool} 不存在`);
}));
PP.userRules.list.forEach(u => (u.clients || []).filter(id => !PP.clients[id]).forEach(id => err('data/events', `使用者規定 ${u.id} 的 ${id} 不存在`)));
Object.entries(PP.arcs).forEach(([id, a]) => (a.clients || []).filter(c => !PP.clients[c]).forEach(c => err('data/arcs', `劇情線 ${id} 的 ${c} 不存在`)));
PP.titles.forEach(t => { if (!t.mark && typeof t.test !== 'function') err('data/titles.js', `稱號 ${t.id} 要有 mark 或 test`); });

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`任務 ${Object.keys(PP.clients).length}、事件 ${defs.event.length}、模型 ${PP.models.length}、劇情線 ${Object.keys(PP.arcs).length}、稱號 ${PP.titles.length}、事實 ${Object.keys(PP.facts).length}：沒有問題`);
