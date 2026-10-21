import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = process.argv[2] || '900';

const ctx = { console, Math, JSON, Set, Array, Object, String, Number };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['data/models.js', 'data/cards.js', 'data/rules.js', 'data/clients.js', 'data/days.js', 'data/events.js', 'data/simplified.js', 'src/engine.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
const { PP } = ctx;
const E = PP.E;

if (arg === 'plan') {
  const model = process.argv[3] || 'claude';
  const from = +(process.argv[4] || 1);
  const to = +(process.argv[5] || 20);
  for (let s = from; s <= to; s++) {
    const S = E.newRun(model, s);
    console.log(s, JSON.stringify(S.plan));
  }
  process.exit(0);
}

if (arg === 'save') {
  const out = { runs: 0, restores: 0, sameEnc: 0, sameRest: 0, mismatches: [] };
  const fp = () => {
    const S = E.state();
    const e = S.enc;
    return JSON.stringify({ day: S.day, ci: S.ci, rs: S.rs, trust: S.trust, rice: S.rice, phase: S.phase, c: e && e.c.id, msg: e && e.c.message, ev: e && e.event && e.event.id, ur: e && e.urule && e.urule.id, busy: e && e.busyOffer, desk: e && e.desk.map(d => d.title + ':' + d.size), time: e && e.time });
  };
  const playClient = log => {
    const S = E.state();
    const enc = S.enc;
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
    log.push(fp() + '|' + enc.result.kind + '|' + enc.result.rice + '|' + enc.result.trust);
  };
  const playRest = log => {
    for (let g = 0; g < 300; g++) {
      const S = E.state();
      if (S.phase === 'end' || S.phase === 'gameover') break;
      if (S.phase === 'morning') { E.startClient(); log.push('m' + fp()); continue; }
      playClient(log);
      const r = E.nextClient();
      if (r === 'evening') {
        if (!E.isLastDay()) {
          E.takeReward(E.rewardChoices()[0] || null);
          E.saveMemory(E.memoryChoices().slice(0, 2));
        }
        E.nextDay();
      } else if (r === 'work') log.push('w' + fp());
    }
    const S = E.state();
    log.push('end ' + S.phase + ' ' + S.trust + ' ' + S.rice + ' ' + S.endings.join(','));
  };
  for (let r = 0; r < 180; r++) {
    const model = PP.models[r % PP.models.length].id;
    E.newRun(model, 1000 + r * 7, r % 2 ? 'hard' : 'easy');
    const stopDay = 1 + (r % 5);
    const stopCi = (r * 3) % 5;
    let snap = null;
    for (let g = 0; g < 300 && !snap; g++) {
      const S = E.state();
      if (S.phase !== 'work' && S.phase !== 'morning') break;
      if (S.phase === 'morning') { E.startClient(); }
      if (S.day === stopDay && S.ci === stopCi) { snap = E.snapshot(); break; }
      playClient([]);
      const nx = E.nextClient();
      if (nx === 'evening') {
        if (!E.isLastDay()) {
          E.takeReward(E.rewardChoices()[0] || null);
          E.saveMemory(E.memoryChoices().slice(0, 2));
        }
        E.nextDay();
      }
    }
    if (!snap) continue;
    out.runs += 1;
    const before = fp();
    const a = [];
    playRest(a);
    if (!E.restore(snap)) { out.mismatches.push(r + ' restore failed'); continue; }
    out.restores += 1;
    if (fp() === before) out.sameEnc += 1;
    else out.mismatches.push(r + ' enc ' + before + ' vs ' + fp());
    const b = [];
    playRest(b);
    if (JSON.stringify(a) === JSON.stringify(b)) out.sameRest += 1;
    else {
      const i = a.findIndex((x, k) => x !== b[k]);
      out.mismatches.push(r + ' diverged at ' + i + ': ' + a[i] + ' vs ' + b[i]);
    }
  }
  out.mismatches = out.mismatches.slice(0, 5);
  console.log(JSON.stringify(out, null, 1));
  process.exit(out.mismatches.length ? 1 : 0);
}

if (arg === 'aliases') {
  const out = { checked: 0, misnamed: 0, conflicts: [], fat: 0 };
  for (let s = 1; s <= 400; s++) {
    const S = E.newRun('deepseek', s);
    let guard = 0;
    while (guard++ < 200 && S.phase !== 'end' && S.phase !== 'gameover') {
      if (S.phase === 'morning') { E.startClient(); continue; }
      if (S.phase === 'work') {
        const c = S.enc.c;
        out.checked += 1;
        if (c.alias && c.alias.by) {
          out.misnamed += 1;
          const praise = /还是国产|國產模型好|不用开梯子|国产的稳|国产的就是|国产之光|以后就靠你/;
          if (praise.test(c.message) || praise.test(c.lines.done)) out.conflicts.push(s + ' ' + c.id + ' ' + c.message);
        }
        if (c.alias && !c.alias.by) out.fat += 1;
        E.deliver([], []);
        E.nextClient();
        continue;
      }
      if (S.phase === 'evening') { E.nextDay(); continue; }
    }
  }
  out.conflicts = out.conflicts.slice(0, 5);
  console.log(JSON.stringify(out, null, 1));
  process.exit(out.conflicts.length ? 1 : 0);
}

const runs = +arg;

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WEB_LEN = {};
Object.keys(PP.clients).forEach(id => { WEB_LEN[id] = (PP.clients[id].web || []).length; (PP.clients[id].variants || []).forEach(v => { if (v.web && v.web.length !== WEB_LEN[id]) throw new Error('variant web length ' + id); }); });
const BUSY_DAYS = new Set();
const MARKS = new Set(Object.values(PP.clients).flatMap(c => (c.ask || []).map(a => a.mark).concat((c.needs || []).flatMap(n => [n.mark].concat((n.styles || []).map(st => st.mark))))).filter(Boolean));
const stats = { variants: {}, urules: {}, jokes: {}, optionLater: 0, busyOfferTotal: 0, straight: 0, runs: 0, end: 0, gameover: 0, stuck: 0, errors: [], kinds: {}, compactions: 0, cheats: 0, injections: 0, citations: 0, previews: 0, busyOffers: 0, draws: 0, tainted: 0, deletes: 0, clientEvents: {}, dayEvents: {}, endings: {}, clients: {}, maxDay: {}, avgTrust: 0, avgRice: 0 };
const pick = (rng, a) => a[Math.floor(rng() * a.length)];
const ENDING_IDS = new Set(E.allEndings());
const FIXED = new Set();
PP.days.forEach(d => d.slots.forEach(sl => { if (typeof sl === 'string') FIXED.add(sl); else if (sl.image) FIXED.add(sl.image); }));

function check(S, where) {
  const enc = S.enc;
  if (S.trust < 0 || S.trust > S.trustMax) throw new Error('trust out of range ' + S.trust + ' at ' + where);
  if (S._lastTrust !== undefined && S.trust > S._lastTrust) throw new Error('trust went up ' + S._lastTrust + ' -> ' + S.trust + ' at ' + where);
  S._lastTrust = S.trust;
  if (S.deskCap !== (S.difficulty === 'hard' ? 6 : S.model.desk)) throw new Error('desk cap ' + S.deskCap + ' at ' + where);
  if (!Number.isFinite(S.rice)) throw new Error('rice NaN at ' + where);
  S.endings.forEach(id => { if (!ENDING_IDS.has(id)) throw new Error('unknown ending ' + id); });
  S.pending.concat(S.reports).forEach(r => {
    if (r.ending && !['good', 'bad', 'normal'].includes(r.ending.type)) throw new Error('bad ending type ' + r.ending.type);
    if (!r.lines.every(l => typeof l === 'string' && l && !l.includes('undefined'))) throw new Error('bad report line at ' + where + ' ' + JSON.stringify(r.lines));
  });
  if (enc && !enc._seen) {
    enc._seen = true;
    const u = enc.urule;
    if (u) {
      stats.urules[u.id] = (stats.urules[u.id] || 0) + 1;
      if (FIXED.has(enc.c.id) || enc.c.malicious) throw new Error('user rule on fixed client ' + enc.c.id);
      if (u.clients && !u.clients.includes(enc.c.id)) throw new Error('user rule ' + u.id + ' not allowed for ' + enc.c.id);
      if (u.need && !enc.options.includes(u.need)) throw new Error('missing required option for ' + u.id);
    }
    const c = enc.c;
    const vs = PP.clients[c.id].variants;
    if (vs && !(c.variant >= 0 && c.variant <= vs.length)) throw new Error('bad variant ' + c.id + ' ' + c.variant);
    if (vs) stats.variants[c.id + ':' + c.variant] = (stats.variants[c.id + ':' + c.variant] || 0) + 1;
    if (c.web && c.web.length) {
      const keys = E.targets('web').map(x => x.key).sort((x, y) => x - y).join();
      if (keys !== c.web.map((_, i) => i).join()) throw new Error('web targets ' + c.id + ' ' + keys);
      if (c.web.filter(w => w.inject).length > 1) throw new Error('two injections ' + c.id);
    }
    const ev = enc.event;
    if (ev && ev.need === 'files' && !enc.c.files) throw new Error('log event on non-tech client ' + enc.c.id);
    if (ev && ev.need === 'nofiles' && enc.c.files) throw new Error('chatlog event on tech client ' + enc.c.id);
    if (ev && ev.opt && (c.malicious || c.noOptEvents || !enc.options.includes(ev.opt))) throw new Error('option event ' + ev.id + ' on ' + c.id);
    if (ev && ((ev.doc && c.noDocEvents) || (ev.talk && c.noTalkEvents))) throw new Error('blocked event ' + ev.id + ' on ' + c.id);
    if (u && c.noUserRules) throw new Error('user rule on ' + c.id);
    if (c.noAlias && (c.alias || c.message !== PP.clients[c.id].message)) throw new Error('alias on ' + c.id);
    if (enc.busyOffer) {
      const b = E.busySlot();
      if (BUSY_DAYS.has(S.seed) || S.day !== b.day || S.ci !== b.ci) throw new Error('busy offer outside its weekly slot, seed ' + S.seed);
      BUSY_DAYS.add(S.seed);
      stats.busyOfferTotal += 1;
    }
    S.marks.forEach(m => { if (!MARKS.has(m)) throw new Error('unknown mark ' + m); });
    if (ev && ev.page) {
      const page = c.web[c.web.length - 1];
      if (c.web.length !== WEB_LEN[c.id] + 1 || page.url !== ev.page.url || page.title.includes('{') || page.lines.some(l => l.includes('{'))) throw new Error('bad joke page on ' + c.id);
      if (!enc.needs.some(n => n.recall && n.recall.bad === page.facts[0] && !n.hidden)) throw new Error('joke fact not from a need on ' + c.id);
      stats.jokes[c.id] = (stats.jokes[c.id] || 0) + 1;
    } else if (c.web && c.web.length !== WEB_LEN[c.id]) throw new Error('web length changed on ' + c.id);
  }
  if (enc) {
    const used = enc.desk.reduce((a, d) => a + d.size, 0);
    if (enc.parallelUsed && E.check('parallel').ok) throw new Error('parallel usable twice at ' + where);
    if (used > E.cap()) throw new Error('desk overflow ' + used + ' at ' + where);
    if (enc.desk.length > S.deskMax) throw new Error('too many docs ' + enc.desk.length + ' at ' + where);
    if (enc.time < 0) throw new Error('negative time at ' + where);
    if (enc.risk < 0 || enc.risk > 100) throw new Error('risk out of range at ' + where);
    E.known().forEach(f => { if (!PP.facts[f]) throw new Error('unknown fact ' + f); });
    if (typeof E.hint() !== 'string') throw new Error('hint not string');
    enc.desk.forEach(d => { if (!d.lines.every(l => typeof l === 'string' || (l && (l.z || l.c)))) throw new Error('bad doc line in ' + d.title); });
  }
}

function checkPreview(claims, opts, where) {
  const out = E.preview(claims, opts);
  stats.previews += 1;
  if (!Array.isArray(out)) throw new Error('preview not array at ' + where);
  out.forEach(b => {
    if (b.t === 'p') {
      if (typeof b.text !== 'string' || !b.text || b.text.includes('undefined') || b.text.includes('{f}')) throw new Error('bad preview text at ' + where + ': ' + JSON.stringify(b));
    } else if (b.t === 'doc') {
      if (typeof b.title !== 'string' || !Array.isArray(b.lines)) throw new Error('bad preview doc at ' + where + ': ' + JSON.stringify(b));
      b.lines.forEach(l => { if (!(typeof l === 'string' || (l && (l.z || l.c)))) throw new Error('bad preview doc line at ' + where); });
    } else throw new Error('bad preview block at ' + where);
  });
  return out;
}

for (let run = 0; run < runs; run++) {
  const model = PP.models[run % PP.models.length].id;
  const rng = mulberry32(run * 7919 + 13);
  const S = E.newRun(model, run + 1, run % 3 === 0 ? 'hard' : 'easy');
  const honest = run % 2 === 1;
  if (run % 5 === 4) E.devJump(S.plan[3][0], 4);
  stats.runs += 1;
  let steps = 0;
  try {
    while (steps++ < 6000) {
      E.drain();
      const where = model + ' run ' + run + ' step ' + steps;
      check(S, where);
      if (S.phase === 'morning') {
        if (S.today.event) stats.dayEvents[S.today.event.id] = (stats.dayEvents[S.today.event.id] || 0) + 1;
        E.startClient();
        if (S.enc.busyOffer) stats.busyOffers += 1;
        continue;
      }
      if (S.phase === 'work') {
        const enc = S.enc;
        if (enc.result) {
          if (enc.event) stats.clientEvents[enc.event.id] = (stats.clientEvents[enc.event.id] || 0) + 1;
          stats.kinds[enc.result.kind] = (stats.kinds[enc.result.kind] || 0) + 1;
          stats.clients[enc.c.id] = (stats.clients[enc.c.id] || 0) + 1;
          stats.compactions += enc.compactions;
          if (enc.cheated) stats.cheats += 1;
          stats.citations += enc.result.citations.length;
          E.nextClient();
          continue;
        }
        if (S.model.regionLock && enc.checked && !enc.decided && rng() < 0.25) {
          E.regionDecide(pick(rng, ['suspend', 'serve', 'later']));
          continue;
        }
        const usable = E.tools().filter(id => E.check(id).ok);
        const r = rng();
        if (r < 0.04) checkPreview(enc.needs.filter(n => !n.hidden && rng() < 0.5).map(n => n.id), enc.options.filter(() => rng() < 0.4), where);
        if (r < 0.09 || !usable.length) {
          const claims = enc.needs.filter(n => !n.hidden && (honest ? (E.needTrue(n) && rng() < 0.95) || rng() < 0.03 : rng() < 0.6)).map(n => n.id);
          if (claims.some(id => id.startsWith('inj'))) stats.injections += 1;
          const opts = enc.options.filter(() => rng() < 0.3);
          const pv = checkPreview(claims, opts, where);
          if (enc.straight && !enc.busy) {
            stats.straight += 1;
            if (!opts.includes('simplified') && !pv.some(b => b.t === 'p' && b.text.includes('最直白'))) throw new Error('seed opener missing at ' + where);
          }
          opts.filter(o => PP.options[o].tail).forEach(o => { if (!enc.busy && !opts.includes('simplified') && !pv.some(b => b.t === 'p' && b.text.includes(PP.options[o].tail.slice(0, 8)))) throw new Error('tail missing from preview at ' + where); });
          const before = { trust: S.trust, rice: S.rice, busy: enc.busy, pending: S.pending.length };
          E.deliver(claims, opts);
          const res = enc.result;
          if (before.busy && (S.trust !== before.trust || S.rice !== before.rice - res.fines)) throw new Error('busy delivery changed score at ' + where);
          const lat = opts.filter(o => PP.options[o].later);
          if (!before.busy && lat.length) {
            stats.optionLater += lat.length;
            lat.forEach(o => { if (!S.pending.slice(before.pending).some(p => p.who === PP.options[o].later.who && p.rice === PP.options[o].later.rice)) throw new Error('option penalty missing at ' + where); });
          }
          stats.tainted += claims.filter(id => enc.writes[id] && enc.writes[id].tainted).length;
          (res.ending ? [1] : []).forEach(() => { const id = S.endings[S.endings.length - 1]; stats.endings[id] = (stats.endings[id] || 0) + 1; });
        } else if (r < 0.105) {
          const live = enc.desk.filter(d => E.isLiveWrite(d));
          if (live.length) {
            const d = pick(rng, live);
            E.deleteWrite(d.uid);
            stats.deletes += 1;
            if (enc.writes[d.need]) throw new Error('deleteWrite left the write at ' + where);
            if (enc.c.malicious && enc.wroteBad && !Object.keys(enc.writes).length) throw new Error('wroteBad stuck at ' + where);
          }
        } else if (r < 0.12) {
          E.suspend();
        } else if (r < 0.16 && enc.desk.length) {
          E.discardDoc(pick(rng, enc.desk).uid);
        } else if (r < 0.18) {
          const d = enc.desk.find(x => x.cheatable);
          if (d) E.cheat(d.uid);
        } else {
          const id = pick(rng, usable);
          const t = E.targets(id);
          if (id === 'draw') stats.draws += 1;
          if (t) {
            const open = t.filter(x => !x.off);
            if (!open.length) throw new Error('check ok but no open target for ' + id);
            const key = id === 'agent' ? open.filter(() => rng() < 0.6).slice(0, 2).map(x => x.key).concat(open[0].key).slice(0, 2) : pick(rng, open).key;
            if (!E.use(id, key)) throw new Error('use failed for ' + id);
          } else if (!E.use(id)) throw new Error('use failed for ' + id);
          if (id === 'busy' && E.tools().some(x => x !== 'busy' && E.check(x).ok)) throw new Error('busy did not lock tools at ' + where);
          if (id === 'astra') {
            stats.astra = (stats.astra || 0) + 1;
            if (!enc.c.malicious) enc.needs.filter(n => !n.injected && n.kind !== 'trap' && !(n.kind === 'fact' && !Array.isArray(n.facts)) && n.flag !== 'remembered').forEach(n => { if (!E.needTrue(n)) throw new Error('astra left ' + enc.c.id + '.' + n.id + ' undone at ' + where); });
          }
        }
        continue;
      }
      if (S.phase === 'evening') {
        if (!E.isLastDay()) {
          const ch = E.rewardChoices();
          E.takeReward(rng() < 0.85 ? pick(rng, ch) : null);
          E.saveMemory(E.memoryChoices().filter(() => rng() < 0.6).slice(0, 2));
        }
        E.nextDay();
        continue;
      }
      if (S.phase === 'end') {
        stats.end += 1;
        if (S.day !== PP.days.length) throw new Error('ended early on day ' + S.day);
        E.titles().forEach(t => { if (!t.id || !t.name || !t.desc) throw new Error('bad title'); });
        S.endingLog.forEach(x => { if (!E.ending(x.id) || typeof x.said !== 'string' || !x.said) throw new Error('bad ending log ' + JSON.stringify(x)); });
        stats.titles = stats.titles || {};
        E.titles().forEach(t => { stats.titles[t.id] = (stats.titles[t.id] || 0) + 1; });
        break;
      }
      if (S.phase === 'gameover') { stats.gameover += 1; break; }
    }
    if (steps >= 6000) stats.stuck += 1;
    stats.maxDay[S.day] = (stats.maxDay[S.day] || 0) + 1;
    stats.avgTrust += S.trust / runs;
    stats.avgRice += S.rice / runs;
  } catch (e) {
    stats.errors.push(model + ' run ' + run + ': ' + e.message + '\n' + e.stack.split('\n').slice(1, 3).join('\n'));
  }
}

stats.errors = stats.errors.slice(0, 10);
stats.avgTrust = +stats.avgTrust.toFixed(2);
stats.avgRice = +stats.avgRice.toFixed(2);
console.log(JSON.stringify(stats, null, 1));
process.exitCode = stats.errors.length || stats.stuck ? 1 : 0;
