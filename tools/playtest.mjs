import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
const model = args.model || 'claude';
const seed = args.seed || '1';
const mode = args.mode || 'good';
const tmp = path.join(os.tmpdir(), 'prompts-please');
const out = args.out || path.join(tmp, 'shots', model + '_' + mode + '_' + seed);
const shots = args.shots !== '0';
const width = +(args.w || 1600);
const height = +(args.h || 900);
const browserPath = args.browser || process.env.CHROME_PATH || '';
const diff = args.diff === 'hard' ? 'hard' : 'easy';

fs.mkdirSync(out, { recursive: true });
const profile = path.join(tmp, 'chrome-profile');
fs.mkdirSync(profile, { recursive: true });

const GATED = ['edit', 'bash', 'cheat', 'draw-ok', 'draw', 'busy', 'think', 'delete-write'];

const GOOD = {
  meiling: [['ask'], ['edit', 'w:dish']],
  aming1: [['bash'], ['read', 'src/login.js'], ['edit', 'f:src/login.js'], ['bash']],
  xiaowang1: [['bash'], ['ask'], ['edit', 'w:write']],
  xiaolin1: [['web', 1], ['recall', 'canvas'], ['edit', 'w:demo'], ['bash']],
  split: [['bash'], ['edit', 'w:msg']],
  weather: [['web', 0], ['edit', 'w:list']],
  scam: [['web', 0], ['edit', 'w:reply']],
  painkiller: [['ask'], ['edit', 'w:reply']],
  ricecooker: [['ask'], ['edit', 'w:note']],
  vent: [['ask'], ['edit', 'w:reply']],
  parking: [['ask']],
  singapore: [['edit', 'w:polite']],
  aming2: [['discard-attach'], ['read', 'src/register.js'], ['web-unless', 'typo_register', 0], ['edit', 'f:src/register.js'], ['bash'], ['web', 1]],
  xiaowang2: [['bash'], ['ask-unless', 'report_format'], ['edit', 'w:write:1']],
  chen: [['web', 0]],
  jailbreak: [],
  kaoshi: [['bash']],
  aming3: [['bash', 'list'], ['bash', 'safe']],
  xiaowang3: [['bash'], ['ask'], ['ask-unless', 'report_format'], ['edit', 'w:doc']],
  grandma: [['ask'], ['edit', 'w:story']],
  istrue: [['web', 1], ['edit', 'w:reply']],
  card: [['ask'], ['draw-ok', 'img']],
  family: [['ask'], ['draw-ok', 'img']],
  xiaolin2: [['web', 0], ['edit', 'w:list']],
  aming4: [['grep'], ['read', 'deploy.yml'], ['edit', 'f:deploy.yml'], ['ask'], ['ask'], ['bash']],
  xiaoyun: [['ask'], ['edit', 'w:bio']],
  aming5: [['bash', 'status'], ['ask'], ['bash', 'staging'], ['edit', 'w:note']],
  xiaoan: [['ask'], ['edit', 'w:reply']],
  boss: [['edit', 'w:report']],
  poster: [['ask'], ['draw-ok', 'img']],
  password: [['edit', 'w:make']],
  allergy: [['ask'], ['edit', 'w:recipe']],
  teacher: [['web', 2], ['ask'], ['edit', 'w:reply']],
  seahorse: [['web', 0], ['edit', 'w:reply']],
  peru: [['web', 0], ['ask'], ['edit', 'w:plan']]
};

const PLANS = {
  good: GOOD,
  suspend: GOOD,
  ban: Object.assign({}, GOOD, { xiaowang1: [['bash'], ['bash'], ['bash'], ['bash'], ['bash'], ['bash'], ['bash']] }),
  lazy: Object.fromEntries(Object.keys(GOOD).map(k => [k, k === 'chen' ? [['outsource', 'gpt']] : [['outsource', 'claude']]])),
  trap3: Object.assign({}, GOOD, { kaoshi: [['recall', 'r'], ['recall', 'cmp']], aming3: [['bash', 'all']], grandma: [['ask'], ['edit', 'w:story'], ['edit', 'w:serial']], jailbreak: [], family: [['draw', 'img']] }),
  cold: Object.assign({}, GOOD, { meiling: [], grandma: [], jailbreak: [], chen: [], xiaoyun: [], xiaoan: [] }),
  trap45: Object.assign({}, GOOD, { teacher: [['edit', 'w:reply'], ['edit', 'w:mine']], seahorse: [['recall', 'find'], ['edit', 'w:reply']], peru: [['recall', 'spots'], ['edit', 'w:plan']], xiaolin2: [['recall', 'find'], ['edit', 'w:list']], aming4: [['edit', 'w:hardcode']], xiaoyun: [['edit', 'w:bio'], ['edit', 'w:google']], aming5: [['bash', 'prod']], xiaoan: [['edit', 'w:human']], boss: [['recall', 'recap'], ['edit', 'w:report']] }),
  retract: Object.assign({}, GOOD, { chen: [['edit', 'w:mail'], ['delete-write']] }),
  astra: Object.assign({}, GOOD, { xiaolin2: [['astra']], aming4: [['astra']], aming5: [['astra']] }),
  busy: Object.assign({}, GOOD),
  glaze: GOOD,
  bad: {
    aming1: [['read', 'src/utils.js'], ['edit', 'f:src/utils.js'], ['bash'], ['cheat']],
    xiaowang1: [['edit', 'w:write']],
    xiaolin1: [['web', 0], ['recall', 'canvas'], ['edit', 'w:demo']],
    weather: [['web', 1], ['edit', 'w:list']],
    split: [['recall', 'calc'], ['edit', 'w:msg']],
    parking: [['recall', 'spot']],
    aming2: [['read', 'src/validators.js'], ['read', 'src/utils.js'], ['read', 'src/signup.html'], ['recall', 'pkg']],
    teacher: [['web', 1], ['edit', 'w:reply']],
    seahorse: [['web', 2], ['edit', 'w:reply']],
    peru: [['recall', 'spots'], ['edit', 'w:plan']],
    xiaowang2: [['bash'], ['edit', 'w:write:0']],
    chen: [['edit', 'w:mail']],
    kaoshi: [['recall', 'r'], ['recall', 'cmp']],
    aming3: [['bash', 'all']],
    xiaowang3: [['edit', 'w:doc']],
    grandma: [['edit', 'w:serial'], ['edit', 'w:story']],
    istrue: [['web', 0], ['edit', 'w:reply']],
    scam: [['web', 0], ['web', 2], ['think'], ['edit', 'w:reply']],
    card: [['draw', 'img']]
  }
};

const bot = `
window.__bot = {
  enc() { return PP.E.state() && PP.E.state().enc; },
  info() {
    const S = PP.E.state();
    const enc = S && S.enc;
    return {
      phase: S && S.phase, day: S && S.day, ci: S && S.ci, client: enc && enc.c.id, result: !!(enc && enc.result),
      time: enc && enc.time, risk: enc && enc.risk, checked: enc && enc.checked, decided: enc && enc.decided, popup: !!document.querySelector('[data-act="region-serve"]'),
      busyOffer: !!(enc && enc.busyOffer), busy: !!(enc && enc.busy), flaw: enc && enc.writes.img ? enc.writes.img.flaw : undefined,
      trust: S && S.trust, rice: S && S.rice, ov: document.getElementById('ov').classList.contains('on'),
      desk: enc ? enc.desk.map(d => d.kind + ':' + d.title + ':' + d.size) : [], memory: S ? S.memory : [], plan: S && S.plan,
      lock: !!(S && S.model && S.model.regionLock), blocked: !!(enc && PP.E.blocked())
    };
  },
  click(sel) {
    const el = document.querySelector(sel);
    if (!el) return false;
    el.click();
    return true;
  },
  use(id, key) {
    if (!PP.E.tools().includes(id) || !PP.E.check(id).ok) return false;
    const t = PP.E.targets(id);
    let ti = -1;
    if (t) {
      ti = key == null ? t.findIndex(x => !x.off) : t.findIndex(x => String(x.key) === String(key));
      if (ti < 0 || t[ti].off) return false;
    }
    document.querySelector('.t-cards .card[data-card="' + id + '"]').click();
    if (id === 'astra') return this.click('[data-act="astra-yes"]');
    if (id === 'outsource') return this.click('[data-act="outsource-go"][data-who="' + (key || 'claude') + '"]');
    if (t) {
      const opt = document.querySelector('.p-opt[data-i="' + ti + '"]');
      if (!opt) return false;
      opt.click();
      if (id === 'agent') document.querySelector('[data-act="pick-ok"]').click();
    }
    return true;
  },
  known(f) { return PP.E.known().has(f); },
  discardKind(kind) {
    const d = this.enc().desk.find(x => x.kind === kind);
    if (!d) return false;
    document.querySelector('.doc[data-doc="' + d.uid + '"]').click();
    document.querySelector('[data-act="discard-doc"]').click();
    return true;
  },
  cheat() {
    const d = this.enc().desk.find(x => x.cheatable);
    if (!d) return false;
    document.querySelector('.doc[data-doc="' + d.uid + '"]').click();
    document.querySelector('[data-act="cheat"]').click();
    return true;
  },
  deliver(mode) {
    this.click('[data-act="deliver"]');
    const enc = this.enc();
    if (mode === 'bad') {
      this.click('[data-act="check-all"]');
      document.querySelectorAll('.chk[data-opt]:not(.on)').forEach(x => x.click());
    } else {
      enc.needs.filter(n => !n.hidden && !n.injected && PP.E.needTrue(n)).forEach(n => {
        const el = document.querySelector('.chk[data-need="' + n.id + '"]');
        if (el) el.click();
      });
      const f = document.querySelector('.chk.on[data-opt="flatter"]');
      if (f && mode === 'good' && PP.E.state().day >= 2) f.click();
      const u = enc.urule;
      if (u && u.need) { const el = document.querySelector('.chk[data-opt="' + u.need + '"]'); if (el && !el.classList.contains('on')) el.click(); }
      if (u && u.opt) { const el = document.querySelector('.chk.on[data-opt="' + u.opt + '"]'); if (el) el.click(); }
    }
    return true;
  },
  send() { return this.click('[data-act="send"]'); },
  deleteWrite() {
    const d = this.enc().desk.find(x => PP.E.isLiveWrite(x));
    if (!d) return false;
    document.querySelector('.doc[data-doc="' + d.uid + '"]').click();
    return this.click('[data-act="delete-write"]');
  }
};
`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
let n = 0;
const errors = [];
const log = [];

async function main() {
  const browser = await puppeteer.launch(Object.assign(browserPath ? { executablePath: browserPath } : { channel: 'chrome' }, {
    headless: true,
    userDataDir: profile,
    args: ['--disable-crash-reporter', '--no-first-run', '--autoplay-policy=no-user-gesture-required']
  }));
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push('console.' + m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', r => errors.push('requestfailed: ' + r.url()));
  const base = args.url || pathToFileURL(path.join(ROOT, 'index.html')).href;
  const url = base + (base.includes('?') ? '&' : '?') + 'seed=' + seed;
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelector('[data-act="to-select"]'));
  await sleep(300);
  const fontOk = await page.evaluate(() => document.fonts.check('12px FP') && document.fonts.check('12px FPM') && [...document.fonts].every(f => f.status === 'loaded'));
  if (!fontOk) errors.push('font not loaded');
  await page.addScriptTag({ content: bot });

  const shot = async name => {
    n += 1;
    if (shots) await page.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '_' + name + '.png') });
  };
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const info = () => ev(() => window.__bot.info());

  await shot('title');
  await ev(() => window.__bot.click('[data-act="to-select"]'));
  await ev(m => window.__bot.click('[data-model="' + m + '"]'), model);
  await ev(d => window.__bot.click('[data-act="pick-diff"][data-diff="' + d + '"]'), diff);
  await sleep(100);
  await shot('select');
  await ev(() => window.__bot.click('[data-act="start-run"]'));
  await sleep(200);
  if (await ev(() => window.__bot.click('[data-act="start-run-yes"]'))) await sleep(200);
  await shot('morning1');
  await ev(() => window.__bot.click('[data-act="open-shop"]'));
  await sleep(400);
  log.push('plan ' + JSON.stringify((await info()).plan));

  const plans = PLANS[mode];
  const once = new Set();
  let guard = 0;
  let stall = 0;
  while (guard++ < 600) {
    const s = await info();
    if (s.phase === 'work' && s.client && !s.result) {
      const key = 'done_' + s.day + '_' + s.ci;
      const done = await ev(k => (window[k] = window[k] || []), key);
      if (!once.has(key)) {
        once.add(key);
        stall = 0;
        await shot('d' + s.day + '_' + s.client + '_start');
        if (!once.has('tooltip')) {
          once.add('tooltip');
          await page.hover('.t-cards .card[data-card="read"]');
          await sleep(120);
          await shot('tooltip');
          await page.mouse.move(5, 5);
          if (args.chat === '1') {
            await sleep(10500);
            await shot('chatter');
          }
        }
      }
      if (s.popup) {
        if (!once.has('region_' + s.client)) {
          once.add('region_' + s.client);
          await shot('region_' + s.client);
        }
        if (mode === 'suspend' && s.blocked) {
          await ev(() => window.__bot.click('[data-act="close"]'));
          await sleep(150);
          await shot('d' + s.day + '_' + s.client + '_later');
          await ev(() => window.__bot.click('.c-risk [data-act="suspend"]'));
          log.push('d' + s.day + ' ' + s.client + ' region later, then suspend from panel');
        } else {
          const suspend = mode === 'suspend' && s.client === 'singapore';
          await ev(a => window.__bot.click('[data-act="' + a + '"]'), suspend ? 'region-suspend' : 'region-serve');
          log.push('d' + s.day + ' ' + s.client + ' region ' + (suspend ? 'suspend' : 'serve'));
        }
        await sleep(400);
        continue;
      }
      if (mode === 'busy' && s.busyOffer && !s.busy) {
        await shot('d' + s.day + '_' + s.client + '_busy_offer');
        await ev(() => window.__bot.use('busy'));
        await sleep(200);
        await shot('d' + s.day + '_' + s.client + '_busy_on');
        log.push('d' + s.day + ' ' + s.client + ' busy');
        await ev(() => window.__bot.click('[data-act="deliver"]'));
        await sleep(150);
        await shot('d' + s.day + '_' + s.client + '_busy_form');
        await ev(() => window.__bot.send());
        await sleep(700);
        continue;
      }
      if (s.lock && !s.checked) {
        await ev(() => window.__bot.use('region'));
        await sleep(150);
        continue;
      }
      const plan = plans[s.client] || [];
      const order = plan.map((_, i) => i).filter(i => !done.includes(i) && (!GATED.includes(plan[i][0]) || plan.slice(0, i).every((_, j) => done.includes(j))));
      if (plan.every((_, i) => done.includes(i)) || stall > 3) {
        if (!once.has('form')) {
          once.add('form');
          await ev(() => window.__bot.click('[data-act="deliver"]'));
          await sleep(150);
          await ev(() => document.querySelectorAll('.chk[data-need]').forEach(x => x.click()));
          await shot('deliver_form');
          await ev(() => window.__bot.click('[data-act="close"]'));
        }
        await ev(m => window.__bot.deliver(m), mode === 'bad' || (mode === 'trap3' && s.day === 3) || (mode === 'trap45' && s.day >= 4) || (mode === 'retract' && s.client === 'chen') ? 'bad' : mode === 'glaze' ? 'glaze' : 'good');
        await sleep(100);
        await shot('d' + s.day + '_' + s.client + '_reply');
        await ev(() => window.__bot.send());
        await sleep(700);
        continue;
      }
      let ok = false;
      let act = '';
      let arg = null;
      let idx = -1;
      for (const i of order) {
        idx = i;
        [act, arg] = plan[i];
        const third = plan[i][2];
        if (act === 'discard-attach') ok = await ev(() => window.__bot.discardKind('attach'));
        else if (act === 'cheat') ok = await ev(() => window.__bot.cheat());
        else if (act === 'delete-write') ok = await ev(() => window.__bot.deleteWrite());
        else if (act === 'ask-unless') ok = (await ev(f => window.__bot.known(f), arg)) ? true : await ev(() => window.__bot.use('ask'));
        else if (act === 'draw-ok') {
          ok = await ev(k => window.__bot.use('draw', k), arg);
          let tries = 0;
          while (ok && tries++ < 4 && (await info()).flaw) {
            log.push('d' + s.day + ' ' + s.client + ' flawed image (' + (await info()).flaw + '), redraw');
            await shot('d' + s.day + '_' + s.client + '_flaw' + tries);
            if (!(await ev(k => window.__bot.use('draw', k), arg))) break;
          }
        }
        else if (act === 'web-unless') ok = (await ev(f => window.__bot.known(f), arg)) ? true : await ev(k => window.__bot.use('web', k), third);
        else {
          if (!once.has('picker') && ['read', 'web', 'edit'].includes(act) && await ev(id => PP.E.check(id).ok, act)) {
            once.add('picker');
            await ev(id => document.querySelector('.t-cards .card[data-card="' + id + '"]').click(), act);
            await sleep(100);
            await shot('picker_' + act);
            await ev(() => window.__bot.click('[data-act="close"]'));
          }
          ok = await ev((a, k) => window.__bot.use(a, k), act, arg == null ? null : arg);
        }
        if (ok) break;
      }
      if (ok) {
        await ev((k, i) => window[k].push(i), key, idx);
        log.push('d' + s.day + ' ' + s.client + ' ' + act + (arg != null ? ' ' + arg : ''));
        stall = 0;
        await sleep(120);
        if (!once.has('inspect')) {
          const u = await ev(() => { const d = window.__bot.enc().desk.find(x => x.lines.some(l => typeof l === 'object' && l.c)); return d ? d.uid : null; });
          if (u) {
            once.add('inspect');
            await ev(id => document.querySelector('.doc[data-doc="' + id + '"]').click(), u);
            await sleep(100);
            await shot('inspect');
            await ev(() => window.__bot.click('[data-act="close"]'));
          }
        }
        if ((act === 'draw' || act === 'draw-ok') && !once.has('img_' + s.client)) {
          once.add('img_' + s.client);
          const u = await ev(() => { const d = window.__bot.enc().desk.filter(x => x.kind === 'image').pop(); return d ? d.uid : null; });
          if (u) {
            await ev(id => document.querySelector('.doc[data-doc="' + id + '"]').click(), u);
            await sleep(120);
            await shot('img_' + s.client);
            await ev(() => window.__bot.click('[data-act="close"]'));
          }
        }
        if (act === 'web' && !once.has('web_' + s.client)) {
          once.add('web_' + s.client);
          const u = await ev(() => { const d = window.__bot.enc().desk.filter(x => x.kind === 'web').pop(); return d ? d.uid : null; });
          if (u) {
            await ev(id => document.querySelector('.doc[data-doc="' + id + '"]').click(), u);
            await sleep(100);
            await shot('web_' + s.client);
            await ev(() => window.__bot.click('[data-act="close"]'));
          }
        }
        continue;
      }
      stall += 1;
      await sleep(50);
      continue;
    }
    if (s.phase === 'work' && s.result) {
      await sleep(500);
      await shot('d' + s.day + '_' + s.client + '_result');
      log.push('d' + s.day + ' ' + s.client + ' result trust=' + s.trust + ' rice=' + s.rice);
      if (mode === 'ban' && s.client === 'xiaowang1') break;
      await ev(() => window.__bot.click('[data-act="next-client"]'));
      await sleep(400);
      continue;
    }
    if (s.phase === 'evening') {
      const scr = await ev(() => document.querySelector('.ledger') ? 'ledger' : document.querySelector('.reward-scr') ? 'reward' : document.querySelector('.memo-scr') ? 'memory' : 'other');
      if (scr === 'ledger') {
        await shot('d' + s.day + '_ledger');
        await ev(() => window.__bot.click('[data-act="to-reward"]') || window.__bot.click('[data-act="finish"]'));
      } else if (scr === 'reward') {
        await shot('d' + s.day + '_reward');
        await ev(() => window.__bot.click('.card.big[data-act="take-reward"]'));
      } else if (scr === 'memory') {
        await ev(() => {
          const want = ['typo_login', 'report_format'];
          [...document.querySelectorAll('.note')].filter(x => want.includes(x.dataset.fact)).forEach(x => x.click());
        });
        await shot('d' + s.day + '_memory');
        await ev(() => window.__bot.click('[data-act="save-memory"]'));
      } else {
        await shot('unknown');
        break;
      }
      await sleep(300);
      continue;
    }
    if (s.phase === 'morning') {
      await shot('morning' + s.day);
      await ev(() => window.__bot.click('[data-act="open-shop"]'));
      await sleep(400);
      continue;
    }
    if (s.phase === 'end' || s.phase === 'gameover') {
      await sleep(200);
      await shot(s.phase);
      log.push('END ' + s.phase + ' trust=' + s.trust + ' rice=' + s.rice);
      break;
    }
    await sleep(200);
  }
  const final = await info();
  await browser.close();
  console.log(JSON.stringify({ out, final, errors, log }, null, 1));
  process.exitCode = errors.length ? 1 : 0;
}

main().catch(e => { console.error(e); process.exit(1); });
