import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = { console, Math, JSON, Set, Array, Object, String, Number };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['data/models.js', 'data/cards.js', 'data/rules.js', 'data/clients.js', 'data/days.js', 'data/events.js', 'data/chatter.js', 'data/zh.js', 'src/vendor/opencc-js/t2cn.js', 'src/lang.js', 'src/engine.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
const { PP } = ctx;
const E = PP.E;
E.newRun(PP.models[0].id, 1, 'easy');

const clients = Object.values(PP.clients);
const fixed = PP.days.flatMap(d => d.slots.filter(s => typeof s === 'string'));
const randomSlots = PP.days.flatMap(d => d.slots.filter(s => typeof s !== 'string'));
const imageSlots = randomSlots.filter(s => s.image);
const poolIds = new Set(Object.values(PP.pools).flat());
const modelTools = new Set(PP.models.flatMap(m => (m.tools || []).concat(m.regionLock ? ['region'] : [], m.busy ? ['busy'] : [])).filter(t => !PP.rewardPool.includes(t)));
const titles = E.allTitles();
const rows = [
  ['可選的底模', PP.models.length, PP.models.map(m => m.name).join('、')],
  ['工具卡', Object.keys(PP.cards).length, '基本 ' + PP.baseTools.length + '、模型專屬 ' + modelTools.size + '、下班可選 ' + PP.rewardPool.length],
  ['員工手冊規則', PP.rules.length, '通用 ' + PP.rules.filter(r => !r.model).length + '、只限特定模型 ' + PP.rules.filter(r => r.model).length + '；每天新增 ' + PP.days.map(d => PP.rules.filter(r => r.day === d.day && !r.model).length).join('／')],
  ['客人的委託', clients.length, '來自 ' + new Set(clients.map(c => c.name)).size + ' 位客人'],
  ['每局的客人', fixed.length + randomSlots.length, '固定 ' + fixed.length + '、隨機 ' + randomSlots.length + '（會生圖的模型：隨機 ' + (randomSlots.length - imageSlots.length) + '＋畫圖委託 ' + imageSlots.length + '）'],
  ['隨機客人題庫', poolIds.size, Object.entries(PP.pools).map(([k, v]) => k + ' ' + v.length).join('、')],
  ['有多個版本的客人', clients.filter(c => c.variants).length, Object.keys(PP.clients).filter(id => PP.clients[id].variants).map(id => id + ' ' + (PP.clients[id].variants.length + 1)).join('、')],
  ['客人事件', PP.events.client.length, '每位客人機率 ' + PP.events.clientRate],
  ['當日事件', PP.events.day.length, '第二天起每天機率 ' + PP.events.dayRate],
  ['使用者規定', PP.userRules.list.length, '隨機客人機率 ' + PP.userRules.rate],
  ['回覆風格選項', Object.keys(PP.options).length, Object.keys(PP.options).join('、')],
  ['結局', E.allEndings().length, clients.filter(c => (c.endings || []).length).length + ' 位客人＋跨天的 ' + Object.values(PP.arcs || {}).reduce((a, x) => a + x.endings.length, 0) + ' 個'],
  ['稱號', titles.length, '一般 ' + titles.filter(t => !t.rare).length + '、稀有 ' + titles.filter(t => t.rare).length],
  ['業界快訊', PP.days.reduce((a, d) => a + d.news.length, 0), '每天 ' + PP.days.map(d => d.news.length).join('／')],
  ['同事閒聊（一般）', PP.chatter.idle.length, '另有對事件、對模型的專屬台詞'],
  ['事實', Object.keys(PP.facts).length, '可以寫進抽屜的 ' + Object.values(PP.facts).filter(f => f.memo).length]
];
rows.forEach(([k, n, note]) => console.log(k + '：' + n + (note ? '（' + note + '）' : '')));
console.log('客人事件：' + PP.events.client.map(e => e.id).join('、'));
console.log('當日事件：' + PP.events.day.map(e => e.id).join('、'));
console.log('使用者規定：' + PP.userRules.list.map(u => u.id).join('、'));
