import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scripts, loadGame } from './lib/load.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIX = path.join(ROOT, 'tests', 'fixtures', 'v0.6.2');
const V062 = '2735b20';
const errors = [];

const playClient = E => {
  const enc = E.state().enc;
  for (let k = 0; k < 3 && !enc.result; k++) {
    const id = E.tools().find(x => x !== 'busy' && x !== 'astra' && x !== 'outsource' && E.check(x).ok);
    if (!id) break;
    const t = E.targets(id);
    if (t) {
      const o = t.find(x => !x.off);
      if (!o) break;
      E.use(id, id === 'agent' ? [o.key] : o.key);
    } else E.use(id);
  }
  if (!enc.result) E.deliver(enc.needs.filter(n => !n.hidden && E.needTrue(n)).map(n => n.id), []);
};
const playToEnd = E => {
  for (let g = 0; g < 400; g++) {
    const S = E.state();
    if (S.phase === 'end' || S.phase === 'gameover') return S.phase;
    if (S.phase === 'morning') {
      E.startClient();
      continue;
    }
    playClient(E);
    steps += 1;
    if (E.nextClient() === 'evening') {
      if (!E.isLastDay()) {
        E.takeReward(E.rewardChoices()[0] || null);
        E.saveMemory(E.memoryChoices().slice(0, 2));
      }
      E.nextDay();
    }
  }
  return 'stuck';
};
const outcomes = { end: 0, gameover: 0 };
let steps = 0;
const runAll = (PP, label, seeds) => {
  let runs = 0;
  PP.models.forEach(m => seeds.forEach(seed => {
    try {
      PP.E.newRun(m.id, seed, seed % 2 ? 'hard' : 'easy');
      const r = playToEnd(PP.E);
      if (r === 'stuck') errors.push(`${label}：${m.id} 種子 ${seed} 卡住`);
      else outcomes[r] += 1;
      runs += 1;
    } catch (e) {
      errors.push(`${label}：${m.id} 種子 ${seed} 出錯：${e.message}`);
    }
  }));
  return runs;
};

const ctx = { console, Math, JSON, Set, Array, Object, String, Number };
ctx.window = ctx;
vm.createContext(ctx);
const cur = f => ({ name: f, code: fs.readFileSync(path.join(ROOT, f), 'utf8') });
const old = f => {
  try {
    return { name: V062 + ':' + f, code: execFileSync('git', ['show', V062 + ':' + f], { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 26 }).toString() };
  } catch (e) {
    throw new Error(`讀不到 git 歷史裡 v0.6.2（提交 ${V062}）的 ${f}，這項測試要完整的 git 歷史`);
  }
};
let legacyRuns = 0;
try {
  const legacy = [cur('src/registry.js'), old('data/models.js'), cur('data/cards.js'), old('data/rules.js'), cur('data/titles.js'), old('data/clients.js'), cur('data/days.js'), old('data/events.js')]
    .concat(scripts(ROOT).filter(s => ['data/chatter.js', 'data/updates.js', 'data/zh.js', 'src/lang.js', 'src/engine.js'].includes(s) || s.startsWith('src/vendor/')).map(cur));
  legacy.forEach(f => vm.runInContext(f.code, ctx, { filename: f.name }));
  ctx.PP.problems.forEach(p => errors.push('v0.6.2 舊格式：' + p));
  legacyRuns = runAll(ctx.PP, 'v0.6.2 舊格式', [1, 2, 3, 4, 5, 6, 7, 8]);
} catch (e) {
  errors.push('v0.6.2 舊格式：' + e.message);
}

const { PP } = loadGame(ROOT);
const E = PP.E;
const saves = JSON.parse(fs.readFileSync(path.join(FIX, 'saves.json'), 'utf8'));
const restoreAndPlay = (label, str) => {
  try {
    if (!E.peekSave(str)) return errors.push(label + '：讀不到存檔');
    if (!E.restore(str)) return errors.push(label + '：還原失敗');
    if (E.state().plan.some(day => day.some(id => !PP.clients[id]))) errors.push(label + '：排程裡還有不存在的任務');
    if (playToEnd(E) === 'stuck') errors.push(label + '：還原後卡住');
  } catch (e) {
    errors.push(label + '：出錯：' + e.message);
  }
};
saves.forEach(s => restoreAndPlay(`v0.6.2 存檔（${s.model} 第 ${s.day} 天）`, s.save));
const broken = JSON.parse(saves[0].save);
broken.S.plan[4][0] = 'removed_task_demo';
restoreAndPlay('排程裡有已刪任務的存檔', JSON.stringify(broken));

if (errors.length) {
  console.error(errors.slice(0, 20).join('\n'));
  process.exit(1);
}
console.log(`v0.6.2 舊格式資料：${legacyRuns} 局都玩得完（撐完一週 ${outcomes.end}、中途失敗 ${outcomes.gameover}，共 ${steps} 位客人）；v0.6.2 存檔 ${saves.length} 個和有已刪任務的存檔都能讀、能玩完`);
