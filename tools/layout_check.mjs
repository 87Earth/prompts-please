import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
const runs = +(args.runs || 12);
const url = args.url || pathToFileURL(path.join(ROOT, 'index.html')).href;
const browserPath = args.browser || process.env.CHROME_PATH || '';
const profile = path.join(os.tmpdir(), 'prompts-please', 'chrome-layout');
fs.mkdirSync(profile, { recursive: true });

const browser = await puppeteer.launch(Object.assign(browserPath ? { executablePath: browserPath } : { channel: 'chrome' }, { headless: true, userDataDir: profile }));
const page = await browser.newPage();
await page.setViewport({ width: 800, height: 450, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto(url);
await page.waitForFunction(() => document.querySelector('[data-act="to-select"]'));

const panels = await page.evaluate(() => {
  const E = PP.E;
  const out = [];
  const homeDay = id => {
    const i = PP.days.findIndex(d => d.slots.some(sl => sl === id || (sl && sl.image === id)));
    return i < 0 ? 2 : i + 1;
  };
  const measure = (model, id) => {
    const m = document.querySelector('.c-msg');
    const n = document.querySelector('.c-needs');
    const al = document.querySelector('.c-alias');
    const over = [];
    if (m.scrollHeight - m.clientHeight > 1) over.push('訊息 +' + (m.scrollHeight - m.clientHeight));
    if (n.scrollHeight - n.clientHeight > 1) over.push('需求 +' + (n.scrollHeight - n.clientHeight));
    if (al && al.scrollWidth - al.clientWidth > 1) over.push('稱呼 +' + (al.scrollWidth - al.clientWidth));
    out.push({ model, id, over });
  };
  Object.keys(PP.clients).forEach(id => {
    ['claude', 'gpt'].forEach(model => {
      E.newRun(model, 7, 'easy');
      E.devJump(id, homeDay(id));
      PP.UI.work();
      measure(model, id);
    });
    for (let seed = 1; seed < 300; seed++) {
      E.newRun('deepseek', seed, 'easy');
      E.devJump(id, homeDay(id));
      const a = E.state().enc.c.alias;
      if (a && a.by) {
        PP.UI.work();
        measure('deepseek（被叫成 ' + a.call + '）', id);
        break;
      }
    }
  });
  return out;
});

const mornings = await page.evaluate(runs => {
  const E = PP.E;
  const mulberry32 = a => () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = (rng, a) => a[Math.floor(rng() * a.length)];
  const rows = [];
  PP.models.forEach((m, mi) => {
    for (let r = 0; r < runs; r++) {
      const rng = mulberry32(mi * 1000 + r * 17 + 3);
      const seed = 100 + mi * 50 + r;
      const S = E.newRun(m.id, seed, 'easy');
      let steps = 0;
      while (steps++ < 4000) {
        E.drain();
        if (S.phase === 'morning') {
          PP.UI.morning();
          const cols = [...document.querySelectorAll('.news .n-col')];
          rows.push({ model: m.id, seed, day: S.day, left: cols[0].scrollHeight - cols[0].clientHeight, right: cols[1].scrollHeight - cols[1].clientHeight });
          E.startClient();
          continue;
        }
        if (S.phase === 'work') {
          const enc = S.enc;
          if (enc.result) {
            E.nextClient();
            continue;
          }
          if (S.model.regionLock && enc.checked && !enc.decided) {
            E.regionDecide('serve');
            continue;
          }
          const usable = E.tools().filter(id => E.check(id).ok && id !== 'astra' && id !== 'outsource' && id !== 'busy');
          if (rng() < 0.12 || !usable.length) {
            E.deliver(enc.needs.filter(n => !n.hidden && E.needTrue(n)).map(n => n.id), (enc.options || []).filter(o => PP.options[o].later && rng() < 0.8));
            continue;
          }
          const id = pick(rng, usable);
          const t = E.targets(id);
          if (t) {
            const open = t.filter(x => !x.off);
            if (open.length) E.use(id, id === 'agent' ? [open[0].key] : pick(rng, open).key);
          } else E.use(id);
          continue;
        }
        if (S.phase === 'evening') {
          if (!E.isLastDay()) {
            E.takeReward(pick(rng, E.rewardChoices()));
            E.saveMemory(E.memoryChoices().slice(0, 2));
          }
          E.nextDay();
          continue;
        }
        break;
      }
    }
  });
  return rows;
}, runs);

await browser.close();
const badPanels = panels.filter(p => p.over.length);
const badMornings = mornings.filter(x => x.left > 1 || x.right > 1);
const result = {
  客人畫面: { 檢查: panels.length, 溢出: badPanels.map(p => p.model + '：' + p.id + '（' + p.over.join('、') + '）') },
  日報: {
    檢查: mornings.length,
    左欄溢出: mornings.filter(x => x.left > 1).length,
    右欄溢出: mornings.filter(x => x.right > 1).length,
    例子: badMornings.slice(0, 10).map(x => x.model + ' 種子 ' + x.seed + ' 第 ' + x.day + ' 天（左 +' + Math.max(0, x.left) + '、右 +' + Math.max(0, x.right) + '）')
  },
  頁面錯誤: errors
};
console.log(JSON.stringify(result, null, 1));
process.exitCode = badPanels.length || badMornings.length || errors.length ? 1 : 0;
