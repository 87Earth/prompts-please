import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
const runs = +(args.runs || 12);
const lang = args.lang === 'cn' ? 'cn' : 'tw';
const portrait = 'portrait' in args;
const view = args.size ? args.size.split('x').map(Number) : portrait ? [390, 664] : [800, 450];
const touch = portrait || 'touch' in args;
const extra = portrait || !!args.size;
const deskMin = 100;
const base = args.url || pathToFileURL(path.join(ROOT, 'index.html')).href;
const url = base + (base.includes('?') ? '&' : '?') + 'lang=' + lang;
const browserPath = args.browser || process.env.CHROME_PATH || '';
const profile = path.join(os.tmpdir(), 'prompts-please', 'chrome-layout');
fs.mkdirSync(profile, { recursive: true });

const browser = await puppeteer.launch(Object.assign(browserPath ? { executablePath: browserPath } : { channel: 'chrome' }, { headless: true, userDataDir: profile }));
const page = await browser.newPage();
await page.setViewport({ width: view[0], height: view[1], deviceScaleFactor: 1, isMobile: touch, hasTouch: touch });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto(url);
await page.waitForFunction(() => document.querySelector('[data-act="to-select"]'));
const stageInfo = await page.evaluate(() => (PP.portrait ? '直式' : PP.compact ? '橫式精簡' : '橫式') + ' ' + PP.W + '×' + PP.H + '，倍數 ' + Math.round(PP.scale * 1000) / 1000);

await page.evaluate(() => {
  window.__leak = () => {
    if (PP.lang !== 'cn') return [];
    PP.zhFlush();
    const out = [];
    const han = ch => ch.charCodeAt(0) >= 0x3400 && ch.charCodeAt(0) <= 0x9fff;
    const w = document.createTreeWalker(document.getElementById('stage'), NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (n.parentElement.closest('.zh-keep')) continue;
      if ([...n.data].some(ch => ch !== '么' && han(ch) && PP.zhCN(ch) !== ch)) out.push(n.data.trim().slice(0, 40));
    }
    return out;
  };
  window.__bounds = () => {
    const stage = document.getElementById('stage');
    const st = stage.getBoundingClientRect();
    const out = [];
    const clipped = el => {
      for (let p = el.parentElement; p && p !== stage; p = p.parentElement) {
        if (getComputedStyle(p).overflowX !== 'visible') return true;
      }
      return false;
    };
    stage.querySelectorAll('*').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const name = (el.id ? '#' + el.id : el.tagName.toLowerCase()) + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).join('.') : '');
      if (!clipped(el) && (r.right > st.right + 1 || r.left < st.left - 1)) out.push(name + ' 超出左右 ' + Math.round(Math.max(r.right - st.right, st.left - r.left)));
      if (/auto|scroll/.test(cs.overflowX) && el.scrollWidth - el.clientWidth > 1) out.push(name + ' 橫向溢出 ' + (el.scrollWidth - el.clientWidth));
    });
    stage.querySelectorAll('#ov.on > .sheet, .paper-scr > .sheet').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < st.top - 1 || r.bottom > st.bottom + 1) out.push('.' + el.className.split(' ').join('.') + ' 超出上下');
    });
    return [...new Set(out)];
  };
});

const panels = await page.evaluate((deskMin, extra) => {
  const E = PP.E;
  const out = [];
  const leak = window.__leak;
  const homeDay = id => {
    const i = PP.days.findIndex(d => d.slots.some(sl => sl === id || (sl && sl.image === id)));
    return i < 0 ? 2 : i + 1;
  };
  const measure = (model, id) => {
    const miss = leak();
    const m = document.querySelector('.c-msg');
    const n = document.querySelector('.c-needs');
    const al = document.querySelector('.c-alias');
    const over = [];
    if (m.scrollHeight - m.clientHeight > 1) over.push('訊息 +' + (m.scrollHeight - m.clientHeight));
    if (n.scrollHeight - n.clientHeight > 1) over.push('需求 +' + (n.scrollHeight - n.clientHeight));
    if (al && al.scrollWidth - al.clientWidth > 1) over.push('稱呼 +' + (al.scrollWidth - al.clientWidth));
    if (miss.length) over.push('漏轉：' + miss.join('／'));
    let desk = null;
    if (extra) {
      const top = document.getElementById('top');
      const tools = document.getElementById('tools');
      const st = document.getElementById('stage').getBoundingClientRect();
      desk = document.getElementById('desk').clientHeight;
      if (PP.portrait && top.offsetHeight > 44) over.push('頂欄 ' + top.offsetHeight);
      if (tools.getBoundingClientRect().bottom > st.bottom + 1) over.push('工具列超出畫面');
      if (desk < deskMin) over.push('桌面只剩 ' + desk);
      over.push(...window.__bounds());
    }
    out.push({ model, id, over, desk });
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
}, deskMin, extra);

const mornings = await page.evaluate((runs, extra) => {
  const E = PP.E;
  const leak = window.__leak;
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
          const miss = leak();
          const cols = [...document.querySelectorAll('.news .n-col')];
          if (PP.portrait || PP.compact) rows.push({ model: m.id, seed, day: S.day, left: 0, right: 0, wide: window.__bounds(), miss });
          else if (extra) rows.push({ model: m.id, seed, day: S.day, left: cols[0].scrollHeight - cols[0].clientHeight, right: cols[1].scrollHeight - cols[1].clientHeight, wide: window.__bounds(), miss });
          else rows.push({ model: m.id, seed, day: S.day, left: cols[0].scrollHeight - cols[0].clientHeight, right: cols[1].scrollHeight - cols[1].clientHeight, wide: [], miss });
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
}, runs, extra);

const screens = extra ? await page.evaluate(async () => {
  const E = PP.E;
  const U = PP.UI;
  const out = [];
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const click = sel => {
    const el = document.querySelector(sel);
    if (el) el.click();
    return !!el;
  };
  const check = label => {
    const miss = window.__leak();
    out.push({ label, bad: window.__bounds().concat(miss.length ? ['漏轉：' + miss.join('／')] : []) });
  };
  const run = (model, id, day) => {
    E.newRun(model, 3, 'easy');
    E.devJump(id, day);
    U.work();
  };
  U.title();
  check('標題');
  PP.models.forEach(m => {
    U.select();
    click('[data-act="pick-model"][data-model="' + m.id + '"]');
    check('選模型：' + m.name);
  });
  run('claude', 'teacher', 3);
  click('[data-act="handbook"]');
  check('手冊');
  click('[data-act="close"]');
  click('[data-act="drawer"]');
  check('抽屜');
  click('[data-act="close"]');
  click('[data-act="quit"]');
  check('回標題確認');
  click('[data-act="close"]');
  click('.t-cards .card[data-card="region"]');
  check('地區檢查');
  click('[data-act="region-serve"]');
  click('.t-cards .card[data-card="web"]');
  check('搜尋結果');
  click('.p-opt[data-act="pick-opt"]:not(.off)');
  click('.doc');
  check('文件');
  click('[data-act="close"]');
  click('[data-act="deliver"]');
  click('[data-act="check-all"]');
  check('回覆單');
  click('[data-act="send"]');
  await wait(1000);
  check('交付結果');
  run('deepseek', 'meiling', 1);
  click('.t-cards .card[data-card="outsource"]');
  check('找外援');
  click('[data-act="close"]');
  run('gpt', 'card', 1);
  click('.t-cards .card[data-card="astra"]');
  check('Astra');
  click('[data-act="close"]');
  const t = E.targets('draw');
  if (t && t.length) {
    E.use('draw', t[0].key);
    U.relayout();
    click('.doc.k-image');
    check('生成的圖');
    click('[data-act="close"]');
  }
  E.devNextDay();
  U.evening();
  check('下班結算');
  U.reward();
  check('新工具');
  U.memory();
  check('寫進抽屜');
  U.end();
  check('這週結束');
  U.gameover();
  check('被換掉');
  U.updates();
  check('更新紀錄');
  U.ach();
  check('成就：稱號');
  click('[data-act="ach-tab"][data-tab="endings"]');
  check('成就：結局');
  return out;
}) : [];

await browser.close();
const badPanels = panels.filter(p => p.over.length);
const badMornings = mornings.filter(x => x.left > 1 || x.right > 1 || x.wide.length);
const badScreens = screens.filter(s => s.bad.length);
const desks = panels.filter(p => p.desk != null).map(p => p.desk).sort((a, b) => a - b);
const leaks = [...new Set(mornings.flatMap(x => x.miss))];
const result = {
  語言: lang === 'cn' ? '簡體' : '繁體',
  版面: view.join('×') + (touch ? '（觸控）' : '') + ' → ' + stageInfo,
  客人畫面: { 檢查: panels.length, 溢出: badPanels.map(p => p.model + '：' + p.id + '（' + p.over.join('、') + '）') },
  日報: {
    檢查: mornings.length,
    左欄溢出: mornings.filter(x => x.left > 1).length,
    右欄溢出: mornings.filter(x => x.right > 1).length,
    例子: badMornings.slice(0, 10).map(x => x.model + ' 種子 ' + x.seed + ' 第 ' + x.day + ' 天（' + (x.wide.length ? x.wide.join('、') : '左 +' + Math.max(0, x.left) + '、右 +' + Math.max(0, x.right)) + '）')
  },
  日報漏轉簡體: leaks,
  頁面錯誤: errors
};
if (extra) {
  result.桌面高度 = { 最小: desks[0], 中位數: desks[Math.floor(desks.length / 2)], 最大: desks[desks.length - 1] };
  result.其他畫面 = { 檢查: screens.length, 問題: badScreens.map(s => s.label + '（' + s.bad.join('、') + '）') };
}
console.log(JSON.stringify(result, null, 1));
process.exitCode = badPanels.length || badMornings.length || badScreens.length || leaks.length || errors.length ? 1 : 0;
