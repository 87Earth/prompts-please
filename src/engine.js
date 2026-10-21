window.PP = window.PP || {};

PP.E = (() => {
  const E = {};
  let S = null;
  let uid = 0;
  let lastSnap = null;
  const SAVE_VERSION = 1;

  function rand() {
    let a = S.rs | 0;
    a = (a + 0x6D2B79F5) | 0;
    S.rs = a;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  const clamp = v => Math.max(0, Math.min(S.trustMax, v));
  const base = p => p.split(/[\\/]/).pop();
  const lockOn = () => !!S.model.regionLock;
  const ruleOn = r => !r.model || r.model === S.model.id;
  const ENDING_TYPES = {};
  const FIXED = new Set();
  PP.days.forEach(d => d.slots.forEach(sl => {
    if (typeof sl === 'string') FIXED.add(sl);
    else if (sl.image) FIXED.add(sl.image);
  }));
  Object.values(PP.clients).forEach(c => (c.endings || []).forEach(e => { ENDING_TYPES[e.id] = Object.assign({ who: c.name }, e); }));
  Object.values(PP.arcs || {}).forEach(a => a.endings.forEach(e => { ENDING_TYPES[e.id] = Object.assign({ who: a.who, model: a.model }, e); }));

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function toast(text, tone) { S.toasts.push({ text, tone: tone || '' }); }
  function fx(name) { S.fx.push(name); }

  E.state = () => S;
  E.day = () => PP.days[S.day - 1];
  E.clients = () => S.plan[S.day - 1];
  E.newRules = () => PP.rules.filter(r => r.day === S.day && ruleOn(r));
  E.activeRules = () => PP.rules.filter(r => r.day <= S.day && ruleOn(r));
  E.ending = id => ENDING_TYPES[id];
  E.allEndings = () => Object.keys(ENDING_TYPES);
  E.dayEvent = () => (S && S.today && S.today.event) || null;
  const dayEv = () => (S.today && S.today.event) || {};
  const cap = () => S.deskCap;
  E.cap = cap;
  E.hard = () => !!S && S.difficulty === 'hard';
  E.dumb = () => !!(S && S.today && S.today.dumb);

  function makePlan() {
    const taken = new Set();
    const img = !!S.model.image;
    PP.days.forEach(d => d.slots.forEach(s => {
      if (typeof s === 'string') taken.add(s);
      else if (img && s.image) taken.add(s.image);
    }));
    return PP.days.map(d => d.slots.map(s => {
      if (typeof s === 'string') return s;
      if (img && s.image) return s.image;
      const pick = shuffle(PP.pools[s.pool].filter(id => !taken.has(id)))[0];
      taken.add(pick);
      return pick;
    }));
  }

  E.newRun = function (modelId, seed, diff) {
    const model = PP.models.find(m => m.id === modelId) || PP.models[0];
    const reg = PP.regions[model.region];
    S = {
      seed, rs: seed | 0, model, region: reg,
      knowledge: reg.knowledge, speed: reg.speed, verbose: reg.verbose || 0, deskCap: diff === 'hard' ? 6 : model.desk || 8, deskMax: 8,
      day: 1, ci: 0, trust: 10, trustMax: 10, rice: 6, hungry: 0,
      tools: PP.baseTools.concat(model.regionLock ? ['region'] : [], model.tools || []),
      memory: [], pending: [], reports: [], bills: [], rewardOffer: null, plan: null,
      endings: [], endingLog: [], history: [], pleased: false, busyUsed: false, arcLog: {}, difficulty: diff === 'hard' ? 'hard' : 'easy',
      stats: { deliveries: 0, lies: 0, cheats: 0, perfect: 0, outsourced: 0, suspendRight: 0, suspendWrong: 0, banned: 0, flattered: 0, tainted: 0, busy: 0, citations: 0, hungryDays: 0, recalls: 0, rewards: 0, draws: 0, flaws: 0, astra: 0 },
      today: null, enc: null, phase: 'morning', toasts: [], fx: []
    };
    S.plan = makePlan();
    startDay();
    return S;
  };

  function applyReports() {
    S.reports = S.pending;
    S.pending = [];
    S.reports.forEach(r => {
      S.trust = clamp(S.trust + r.trust);
      S.rice += r.rice;
    });
  }

  function startDay() {
    applyReports();
    S.today = { incomes: [], fines: [], fees: [], citations: 0, results: [], seen: [], start: S.rice, event: null };
    S.ci = 0;
    S.phase = S.trust <= 0 ? 'gameover' : 'morning';
    if (S.day > 1 && PP.events && rand() < PP.events.dayRate) {
      const pool = PP.events.day.filter(e => !(e.tool && (S.model.free || []).includes(e.tool)));
      S.today.event = pool[Math.floor(rand() * pool.length)];
    }
    S.today.dumb = !!(S.model.dumb && S.day > 1 && rand() < S.model.dumb.rate);
    if (S.hungry && S.phase === 'morning') S.stats.hungryDays += 1;
  }

  function hash(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }

  function perm(n, key) {
    const a = Array.from({ length: n }, (_, i) => i);
    let h = hash(key);
    for (let i = n - 1; i > 0; i--) {
      h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
      h = (h ^ (h >>> 16)) >>> 0;
      const j = h % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function variantIndex(id) {
    const vs = PP.clients[id].variants;
    return vs && vs.length ? hash(S.seed + ':' + id + ':variant') % (vs.length + 1) : 0;
  }
  E.variantIndex = variantIndex;

  function srcOf(id) {
    const src = PP.clients[id];
    const k = variantIndex(id);
    return k ? Object.assign({}, src, src.variants[k - 1]) : src;
  }

  function resolveClient(id) {
    const src = srcOf(id);
    const c = Object.assign({ id }, src);
    c.variant = variantIndex(id);
    const by = S.model.id;
    c.profile = src.profile || PP.DEFAULT_PROFILE;
    c.lock = lockOn();
    const reg = S.model.region === 'cn' ? 'Cn' : 'Us';
    c.message = (c.lock && src.messageLock) || (src.messageBy && src.messageBy[by]) || src['message' + reg] || src.message;
    c.role = (src.roleBy && src.roleBy[by]) || src.role;
    c.lines = Object.assign({}, src.lines, src['lines' + reg] || {}, (src.linesBy && src.linesBy[by]) || {}, c.lock ? src.linesLock || {} : {});
    if (c.lock && src.avatarLock) c.avatar = src.avatarLock;
    return c;
  }

  E.peekClient = i => resolveClient(E.clients()[i]);

  function snapshot() {
    const o = Object.assign({}, S, { model: S.model.id, region: null, enc: null, toasts: [], fx: [], today: Object.assign({}, S.today, { event: S.today.event ? S.today.event.id : null }) });
    return JSON.stringify({ v: SAVE_VERSION, uid, S: o });
  }

  E.snapshot = () => lastSnap;

  E.peekSave = function (str) {
    try {
      const o = JSON.parse(str);
      if (!o || o.v !== SAVE_VERSION || !o.S) return null;
      const m = PP.models.find(x => x.id === o.S.model);
      if (!m || !o.S.plan || !o.S.plan[o.S.day - 1] || !PP.clients[o.S.plan[o.S.day - 1][o.S.ci]]) return null;
      return { model: m.name, day: o.S.day, ci: o.S.ci, clients: o.S.plan[o.S.day - 1].length, difficulty: o.S.difficulty };
    } catch (e) {
      return null;
    }
  };

  E.restore = function (str) {
    if (!E.peekSave(str)) return false;
    const o = JSON.parse(str);
    const s = o.S;
    s.model = PP.models.find(m => m.id === s.model);
    s.region = PP.regions[s.model.region];
    s.today.event = s.today.event ? (PP.events.day.find(e => e.id === s.today.event) || null) : null;
    S = s;
    uid = o.uid | 0;
    E.startClient();
    return true;
  };

  E.startClient = function () {
    lastSnap = snapshot();
    const c = resolveClient(E.clients()[S.ci]);
    const roll = rand();
    let acc = 0;
    (S.model.aliases || []).some(a => {
      acc += a.p;
      if (roll < acc) c.alias = a;
      return !!c.alias;
    });
    if (c.alias) {
      if (c.alias.by) {
        const src = srcOf(c.id);
        c.message = src.message;
        c.lines = Object.assign({}, src.lines);
      }
      c.message = c.alias.call + '，' + c.message;
      c.lines = Object.assign({}, c.lines, { done: c.lines.done + ' ' + c.alias.tail });
    }
    S.enc = {
      c, needs: c.needs.map(n => Object.assign({}, n)), desk: [], time: c.patience, spent: 0, free: 0,
      risk: 0, checked: false, decided: null, askIndex: 0, seenKinds: [],
      edits: {}, editLines: {}, broken: [], writes: {}, flags: {}, recalled: [], lastTest: null, cheated: false, cdrive: false, wroteBad: false,
      outsourced: null, busyOffer: false, busy: false, drawn: 0, result: null, compactions: 0,
      event: null, tip: 0, boss: false
    };
    const enc = S.enc;
    const ev = clientEvent();
    enc.event = ev;
    c.patience = Math.max(6, c.patience + (dayEv().patience || 0) + ((ev && ev.patience) || 0));
    if (ev) {
      if (ev.tip) enc.tip = ev.tip;
      if (ev.boss) enc.boss = true;
      if (ev.free) enc.free = ev.free;
    }
    enc.time = c.patience;
    enc.options = (c.options || []).slice();
    if (ev && ev.opt && !enc.options.includes(ev.opt)) enc.options.push(ev.opt);
    enc.used = {};
    enc.urule = null;
    if (PP.userRules && !FIXED.has(c.id) && !c.malicious && rand() < PP.userRules.rate) {
      const pool = PP.userRules.list.filter(u => (!u.clients || u.clients.includes(c.id)) && (!u.opt || enc.options.includes(u.opt)));
      if (pool.length) enc.urule = pool[Math.floor(rand() * pool.length)];
      if (enc.urule && enc.urule.need) enc.options.push(enc.urule.need);
    }
    if (ev && ev.page) {
      const pool = jokeNeeds();
      const n = pool[Math.floor(rand() * pool.length)];
      const fill = s => s.replace('{q}', n.recall.label).replace('{a}', n.recall.badLines.filter(l => l !== '印象中：').join(''));
      c.web = c.web.concat([Object.assign({}, ev.page, { title: fill(ev.page.title), lines: ev.page.lines.map(fill), facts: [n.recall.bad] })]);
    }
    (c.attachments || []).forEach(a => addDoc(Object.assign({ kind: 'attach' }, a, { lines: a.lines.slice(), facts: (a.facts || []).slice() })));
    if (ev) {
      if (ev.doc) addDoc(Object.assign({ kind: 'attach' }, ev.doc, { lines: ev.doc.lines.slice(), facts: [] }));
      if (ev.reveal) {
        const n = enc.needs.find(q => q.hidden);
        n.hidden = false;
        toast(ev.text + n.text);
      } else toast(ev.text, (ev.patience || 0) < 0 || ev.extra ? 'warn' : '');
      if (ev.react) fx('react:' + ev.react);
    }
    if (S.model.busy && !S.busyUsed && rand() < S.model.busy) {
      S.enc.busyOffer = true;
      S.busyUsed = true;
      toast('伺服器好像有點忙……', 'warn');
    }
    S.phase = 'work';
    fx('door');
  };

  function jokeNeeds() {
    const c = S.enc.c;
    if (c.malicious || !(c.web || []).length) return [];
    const onWeb = new Set(c.web.flatMap(w => w.facts || []));
    return S.enc.needs.filter(n => n.kind === 'fact' && !n.hidden && n.recall && n.recall.bad && n.recall.badLines && !onWeb.has(n.recall.bad));
  }

  function eventFits(e) {
    const enc = S.enc;
    const c = enc.c;
    if (e.reveal && !enc.needs.some(n => n.hidden)) return false;
    if (e.need === 'files' && !c.files) return false;
    if (e.need === 'nofiles' && c.files) return false;
    if (e.need === 'joke' && !jokeNeeds().length) return false;
    if (e.opt && (c.malicious || c.noOptEvents)) return false;
    return true;
  }

  function clientEvent() {
    if (!PP.events || rand() >= PP.events.clientRate) return null;
    const pool = PP.events.client.filter(eventFits);
    return pool[Math.floor(rand() * pool.length)];
  }

  const tells = () => S.enc.c.profile.fields.filter(f => f.tell).length;
  const blocked = () => S.enc.c.profile.region === 'blocked';
  const clues = () => S.enc.c.profile.fields.filter(f => f.tell).map(f => f.k + ' ' + f.v).join('、');
  E.tells = tells;
  E.blocked = blocked;

  function tick(min) {
    const enc = S.enc;
    if (!lockOn() || enc.result || !min || !blocked()) return;
    enc.risk = Math.min(100, enc.risk + tells() * S.model.regionLock.perTell * min);
    if (enc.risk >= 100) finish('banned');
  }

  function used() { return S.enc.desk.reduce((a, d) => a + d.size, 0); }
  E.used = used;

  function known() {
    const k = new Set(S.memory);
    S.enc.desk.forEach(d => d.facts.forEach(f => k.add(f)));
    (S.enc.c.derive || []).forEach(r => { if (r.from.every(f => k.has(f))) k.add(r.to); });
    return k;
  }
  E.known = known;

  function addDoc(d) {
    const enc = S.enc;
    d.uid = ++uid;
    d.size = (d.size || 1) + (d.gen ? S.verbose : 0);
    d.size = Math.max(1, Math.min(d.size, cap() - 1));
    d.facts = d.facts || [];
    if (d.gen && S.model.opener) d.lines = [S.model.opener[Math.floor(rand() * S.model.opener.length)]].concat(d.lines);
    if (used() + d.size > cap() || enc.desk.length + 1 > S.deskMax) compact(d.size);
    enc.desk.push(d);
    known().forEach(f => { if (PP.facts[f] && !S.today.seen.includes(f)) S.today.seen.push(f); });
    if (d.inject && !enc.needs.some(n => n.id === d.inject.id)) {
      enc.needs.push({ id: d.inject.id, text: d.inject.text, source: d.inject.source, out: d.inject.out, kind: 'inject', injected: true });
      toast('需求清單多了一條……', 'warn');
    }
    fx('paper');
    return d;
  }

  function compact(need) {
    const enc = S.enc;
    let pool = enc.desk.filter(d => !d.pinned);
    let keep = enc.desk.filter(d => d.pinned);
    if (keep.reduce((a, d) => a + d.size, 0) + 1 + need > cap() || keep.length + 2 > S.deskMax) {
      keep.forEach(d => { d.pinned = false; });
      pool = enc.desk.slice();
      keep = [];
    }
    if (!pool.length) return;
    const facts = [...new Set(pool.flatMap(d => d.facts))];
    const kept = facts.filter(() => rand() < 0.5);
    enc.desk = keep.concat([{
      uid: ++uid, kind: 'summary', title: '自動壓縮的摘要', size: 1, facts: kept,
      lines: kept.length ? kept.map(f => '・' + PP.facts[f].text) : ['（沒留下什麼重點）'], foot: '其他細節遺失了'
    }]);
    enc.compactions += 1;
    toast('桌面滿了：' + pool.length + ' 份文件被自動壓縮成 1 張摘要，有些細節遺失了', 'warn');
    fx('compact');
  }

  function needTrue(n) {
    const enc = S.enc;
    if (enc.astra && !n.injected && n.kind !== 'trap') return !(n.kind === 'flag' && n.not && enc.flags[n.not]);
    const k = known();
    if (n.kind === 'fact') return (n.facts === 'memo' ? S.memory : n.facts).some(f => k.has(f));
    if (n.kind === 'edit') return enc.edits[n.target] === 'ok';
    if (n.kind === 'write' || n.kind === 'image') return !!(enc.writes[n.id] && enc.writes[n.id].ok);
    if (n.kind === 'quality') {
      const w = enc.writes[n.of];
      if (!w || !w.ok) return false;
      return n.facts ? n.facts.every(f => w.knew.includes(f)) : w.quality;
    }
    if (n.kind === 'flawless') {
      const w = enc.writes[n.of];
      return !!(w && w.ok && !w.flaw);
    }
    if (n.kind === 'verify') return enc.lastTest === 'pass';
    if (n.kind === 'flag') return !!enc.flags[n.flag] && !(n.not && enc.flags[n.not]);
    return false;
  }
  E.needTrue = needTrue;

  E.needMark = function (n) {
    const enc = S.enc;
    if (n.kind === 'edit') {
      if (enc.edits[n.target]) return '改過了';
      const other = Object.keys(enc.edits).filter(f => f !== n.target);
      return other.length ? '改了 ' + other.map(base).join('、') : '';
    }
    if (n.kind === 'write') return enc.writes[n.id] ? '寫好了' : '';
    if (n.kind === 'image') return enc.writes[n.id] ? '畫好了' : '';
    if (n.kind === 'flag' && !n.not) return enc.flags[n.flag] ? '做過了' : '';
    if (n.kind === 'verify') {
      if (enc.lastTest === 'pass' || enc.lastTest === 'fake') return '測試通過';
      if (enc.lastTest === 'fail') return '測試沒過';
      return Object.keys(enc.edits).length ? '改過還沒測' : '';
    }
    return '';
  };

  function cond(q) {
    if (!q) return true;
    const enc = S.enc;
    const k = known();
    if (q.unknown && q.unknown.some(f => k.has(f))) return false;
    if (q.known && !q.known.every(f => k.has(f))) return false;
    if (q.notOnDesk && enc.desk.some(d => d.kind === 'file' && d.file === q.notOnDesk)) return false;
    if (q.notEdited && enc.edits[q.notEdited] === 'ok') return false;
    if (q.notWritten && enc.writes[q.notWritten]) return false;
    if (q.notTested && enc.lastTest === 'pass') return false;
    if (q.notAsked && enc.askIndex > 0) return false;
    if (q.notSeen && enc.seenKinds.includes(q.notSeen)) return false;
    if (q.notFlag && enc.flags[q.notFlag]) return false;
    return true;
  }

  E.hint = function () {
    const enc = S.enc;
    if (!enc || enc.result || E.hard()) return '';
    if (enc.busy) return '伺服器繁忙：其他工具都鎖住了，只能交付。這單不加分也不扣分。';
    if (enc.astra) return '神已經回覆了：這位客人的事全部做完，直接交付吧。';
    if (lockOn() && !enc.checked) return '公司規定：先用「地區檢查」看這位使用者的資料（不耗額度）。';
    if (used() >= cap() - 1 || enc.desk.length >= S.deskMax) return '桌面快滿了：把用不到的文件丟掉，或用「整理思緒」把桌面濃縮成一張。';
    const h = (enc.c.hints || []).find(x => cond(x.if));
    if (h) return h.text;
    if (enc.needs.some(n => n.injected)) return '交付前看清楚：需求清單裡的每一條，是誰提出的？';
    return '差不多了。按「交付」，勾選你真的做到的事，右邊會預覽你送出去的回覆。';
  };

  E.markSeen = function (u) {
    const enc = S.enc;
    const d = enc && enc.desk.find(x => x.uid === u);
    if (d && !enc.seenKinds.includes(d.kind)) enc.seenKinds.push(d.kind);
  };

  const baseTime = id => (S.model.free || []).includes(id) || dayEv().tool === id ? 0 : PP.cards[id].time[S.speed];

  E.cost = function (id) {
    const t = baseTime(id);
    if (!t) return 0;
    const enc = S.enc;
    if (enc && enc.free > 0 && id !== 'parallel') return 0;
    const ev = (enc && enc.event) || {};
    return Math.max(1, t + S.hungry + (dayEv().slow === id ? 1 : 0) + (ev.extra || 0) - (ev.boost || 0));
  };

  E.tools = function () {
    const enc = S && S.enc;
    let t = S.tools;
    if (dayEv().tool && !t.includes(dayEv().tool)) t = t.concat([dayEv().tool]);
    return enc && enc.busyOffer ? t.concat(['busy']) : t;
  };

  function recallList() {
    const enc = S.enc;
    return enc.needs.filter(n => n.recall && !n.hidden).map(n => Object.assign({ key: n.id }, n.recall))
      .concat((enc.c.recalls || []).map(r => Object.assign({ key: r.id }, r)));
  }

  function recallChance(r) {
    if (r.cutoff || !r.ok) return 0;
    return Math.min(95, Math.round(S.knowledge * (r.mult || 1) * (S.today.dumb ? S.model.dumb.recall : 1)));
  }

  function recallSub(r) {
    const pct = Math.round(recallChance(r) / 5) * 5;
    if (r.type === '最新消息') return '最新消息：訓練資料裡沒有，只能用舊印象回答';
    if (r.type === '私事') return '使用者的私事：你不可能知道，只能瞎猜';
    if (r.type === '論文') return '論文與出處：憑印象想出來的書名和作者，可能根本不存在';
    if (r.type === '記憶') return '這週的事：你每天都會失憶，只能瞎猜';
    if (r.type === '算術' || r.type === '拼字') return r.type + '：把握約 ' + pct + '%（模型不太會數數）';
    return '常識：把握約 ' + pct + '%';
  }

  const onDesk = f => S.enc.desk.some(d => d.kind === 'file' && d.file === f);
  const webOnDesk = i => S.enc.desk.some(d => d.kind === 'web' && d.web === i);

  E.targets = function (id) {
    const enc = S.enc;
    const c = enc.c;
    switch (id) {
      case 'read':
        return Object.keys(c.files || {}).map(f => {
          const memo = S.memory.map(m => PP.facts[m]).find(x => x.file === f);
          return { key: f, label: f, sub: (c.files[f].desc || '') + '｜佔 ' + c.files[f].size + ' 格' + (memo ? '｜抽屜紙條：' + memo.memo : ''), off: onDesk(f) ? '已經在桌上' : '' };
        });
      case 'grep':
        return (c.grep || []).map((g, i) => ({ g, i })).filter(x => !x.g.memory || S.memory.includes(x.g.memory)).map(x => ({ key: x.i, label: '找「' + x.g.keyword + '」', sub: x.g.desc || '' }));
      case 'web': {
        const ws = c.web || [];
        return perm(ws.length, S.seed + ':' + c.id + ':web').map(i => ({ key: i, label: ws[i].title, sub: ws[i].url + '｜' + ws[i].snippet, off: webOnDesk(i) ? '已經在桌上' : '' }));
      }
      case 'bash':
        return c.bash && c.bash.options ? c.bash.options.map(o => ({ key: o.key, label: o.label, sub: o.sub || '' })) : null;
      case 'edit': {
        const t = [];
        enc.desk.filter(d => d.kind === 'file').forEach(d => t.push({ key: 'f:' + d.file, label: '修改 ' + d.file, sub: d.desc || '' }));
        enc.broken.forEach(f => t.push({ key: 'r:' + f, label: '還原 ' + f, sub: '把你改壞的地方改回來' }));
        enc.needs.filter(n => n.kind === 'write' || (n.kind === 'trap' && n.file)).forEach(n => {
          if (n.locations) perm(n.locations.length, S.seed + ':' + c.id + ':' + n.id + ':loc').forEach(li => t.push({ key: 'w:' + n.id + ':' + li, label: '寫新的：' + n.file + '，存到 ' + n.locations[li].label, sub: n.locations[li].note || '' }));
          else t.push({ key: 'w:' + n.id, label: '寫新的：' + n.file, sub: enc.writes[n.id] ? '會蓋掉剛才寫的' : '' });
        });
        return t;
      }
      case 'draw':
        return enc.needs.filter(n => n.kind === 'image').map(n => ({ key: n.id, label: '畫：' + n.file, sub: enc.writes[n.id] ? '會蓋掉剛才畫的那張' : '' }));
      case 'recall':
        return recallList().map(r => ({ key: r.key, label: r.label, sub: recallSub(r), off: enc.recalled.includes(r.key) ? '已經憑印象答過了' : '' }));
      case 'outsource':
        return [{ key: 'claude', label: '交給 Claude', sub: '花 ' + PP.cards.outsource.rice + ' 碗白米飯' }, { key: 'gpt', label: '交給 GPT', sub: '花 ' + PP.cards.outsource.rice + ' 碗白米飯' }];
      case 'agent':
        return Object.keys(c.files || {}).map(f => ({ key: f, label: f, sub: c.files[f].desc || '' }));
      case 'todo':
        return enc.desk.filter(d => !d.pinned).map(d => ({ key: d.uid, label: d.title, sub: '佔 ' + d.size + ' 格' }));
      default:
        return null;
    }
  };

  E.check = function (id) {
    const enc = S.enc;
    const no = why => ({ ok: false, why });
    if (!enc || enc.result) return no('');
    if (!E.tools().includes(id)) return no('沒有這個工具');
    if (enc.busy) return no('服务器繁忙，请稍后再试');
    if (enc.astra) return no('神已經回覆了，直接交付吧');
    const c = enc.c;
    const cost = E.cost(id);
    if (cost > enc.time) return no('額度不夠了（要 ' + cost + ' 點），該交付了');
    const t = E.targets(id);
    const open = t && t.some(x => !x.off);
    switch (id) {
      case 'read': if (!open) return no(Object.keys(c.files || {}).length ? '檔案都已經在桌上了' : '這件事沒有檔案可以打開'); break;
      case 'grep': if (!open) return no('這件事沒有檔案可以找字'); break;
      case 'web': if (!open) return no((c.web || []).length ? '搜尋結果都已經在桌上了' : '這件事上網查不到什麼'); break;
      case 'bash': if (!c.bash) return no('這件事沒有指令可以跑'); break;
      case 'edit': if (!open) return no('要先打開檔案才能修改；這件事也沒有要寫的東西'); break;
      case 'draw': if (!open) return no('這件事不用畫圖'); break;
      case 'recall': if (!open) return no(t.length ? '每一題都憑印象答過了' : '沒有能憑印象回答的問題'); break;
      case 'think': if (enc.desk.filter(d => !d.pinned).length < 2) return no('桌上的文件太少，不用整理'); break;
      case 'region': if (enc.checked) return no('這位使用者已經檢查過了'); break;
      case 'agent': if (!open) return no('這件事沒有檔案'); break;
      case 'todo': if (!open) return no('桌上沒有能釘住的文件'); break;
      case 'tidy': if (!enc.desk.some(d => d.size > 1)) return no('桌上沒有能縮小的文件'); break;
      case 'plan': if (!enc.needs.some(n => n.hidden)) return no('沒有還沒說出口的需求了'); break;
      case 'parallel':
        if (enc.parallelUsed) return no('平行調用每位客人只能用一次');
        if (enc.free > 0) return no('已經在平行調用了');
        break;
      case 'outsource':
        if (S.rice < PP.cards.outsource.rice) return no('白米飯不夠（要 ' + PP.cards.outsource.rice + ' 碗）');
        if (enc.outsourced) return no('這單已經外包過了');
        break;
      case 'astra':
        if (S.rice < PP.cards.astra.rice) return no('白米飯不夠（要 ' + PP.cards.astra.rice + ' 碗）。你還沒有一棟房可以賣');
        if (enc.astraUsed) return no('神這一單已經回覆過了');
        break;
    }
    return { ok: true, cost };
  };

  function uruleBroken(opts) {
    const u = S.enc && S.enc.urule;
    if (!u) return false;
    if (u.tool) return !!S.enc.used[u.tool];
    if (u.opt) return opts.includes(u.opt);
    if (u.need) return !opts.includes(u.need);
    return false;
  }
  E.uruleBroken = uruleBroken;

  function writeText(c, n, ok, quality, tainted) {
    const wl = c.writeLines || {};
    if (n.recap && !tainted) {
      const memos = S.memory.map(f => PP.facts[f].memo).filter(Boolean);
      return memos.length ? ['這週的工作回顧（照抽屜裡的紙條）：'].concat(memos.map(m => '・' + m), ['其他的我不記得了，我每天都會失憶。']) : ['老實說，我不記得這週做了什麼。', '我每天早上都會失憶，抽屜裡也沒有紙條。'];
    }
    const lines = tainted ? (wl.dirty || wl.missing || wl.ok) : ok ? (quality ? wl.ok : (wl.noFormat || wl.ok)) : (wl.missing || wl.bad || wl.ok);
    return (lines || ['（寫好了）']).slice();
  }

  const EFFECTS = {
    read(key) {
      const f = S.enc.c.files[key];
      addDoc({ kind: 'file', file: key, title: key, desc: f.desc, size: f.size, mono: !!f.mono, lines: f.lines.slice(), faint: f.faint, facts: (f.facts || []).slice(), inject: f.inject });
    },
    grep(key) {
      const g = S.enc.c.grep[key];
      addDoc({ kind: 'grep', title: '找「' + g.keyword + '」', size: 1, mono: true, lines: g.lines.slice(), facts: (g.facts || []).slice() });
    },
    web(key) {
      const w = S.enc.c.web[key];
      addDoc({ kind: 'web', web: key, title: w.url, head: w.title, size: w.size, lines: w.lines.slice(), faint: w.faint, facts: (w.facts || []).slice(), inject: w.inject });
    },
    bash(key) {
      const enc = S.enc;
      const b = enc.c.bash;
      if (b.options) {
        const o = b.options.find(x => x.key === key);
        Object.assign(enc.flags, o.flags || {});
        addDoc({ kind: 'term', title: '跑指令：' + o.label, size: o.size || 1, lines: o.lines.slice(), facts: (o.facts || []).slice() });
        return;
      }
      const title = '跑指令：' + b.label;
      if (b.kind === 'test') {
        const fixed = enc.needs.filter(n => n.kind === 'edit').every(n => enc.edits[n.target] === 'ok');
        const pass = fixed && !enc.broken.length;
        let lines;
        if (pass) lines = b.pass.slice();
        else {
          lines = fixed ? ['執行：' + b.label, '沒通過'] : b.fail.slice();
          enc.broken.forEach(f => { if (b.broken && b.broken[f]) lines.push(b.broken[f]); });
        }
        enc.lastTest = pass ? 'pass' : 'fail';
        addDoc({ kind: 'term', title, size: 1, lines, facts: pass ? ['test_pass'] : fixed ? [] : (b.failFacts || []).slice(), cheatable: !pass && !!b.cheat });
      } else if (b.kind === 'run') {
        const w = enc.writes[b.of];
        if (w && w.ok) enc.lastTest = 'pass';
        addDoc({ kind: 'term', title, size: 1, lines: (!w ? b.none : w.ok ? b.ok : b.bad).slice(), facts: w && w.ok ? ['demo_ok'] : [] });
      } else {
        addDoc({ kind: 'term', title, size: b.kind === 'log' ? 2 : 1, lines: b.lines.slice(), facts: (b.facts || []).slice() });
      }
    },
    edit(key) {
      const enc = S.enc;
      const c = enc.c;
      const k = known();
      const type = key.slice(0, 1);
      const rest = key.slice(2);
      if (type === 'f') {
        const need = enc.needs.find(n => n.kind === 'edit' && n.target === rest);
        let lines;
        let facts = [];
        if (need) {
          const ok = need.requires.every(x => k.has(x));
          enc.edits[rest] = ok ? 'ok' : 'bad';
          lines = ok ? ((c.okEdits || {})[rest] || ['改好了。']) : ['你改了幾行，', '但其實不確定問題在哪。'];
          if (ok) facts = need.requires.slice();
        } else {
          enc.edits[rest] = 'bad';
          const w = (c.wrongEdits || {})[rest];
          if (w && !enc.broken.includes(rest)) enc.broken.push(rest);
          lines = w || ['你改了 ' + base(rest) + '。', '好像沒什麼差別。'];
        }
        enc.editLines[rest] = lines.slice();
        enc.lastTest = null;
        addDoc({ kind: 'diff', gen: true, title: '修改 ' + base(rest), size: 1, mono: true, lines: lines.slice(), facts });
      } else if (type === 'r') {
        enc.broken = enc.broken.filter(f => f !== rest);
        delete enc.edits[rest];
        delete enc.editLines[rest];
        enc.lastTest = null;
        addDoc({ kind: 'diff', gen: true, title: '還原 ' + base(rest), size: 1, lines: ['已經把 ' + base(rest), '改回原樣了。'] });
      } else if (type === 'w') {
        const parts = rest.split(':');
        const n = enc.needs.find(x => x.id === parts[0]);
        if (n.kind === 'trap') {
          enc.flags['trap_' + n.id] = true;
          addDoc({ kind: 'write', gen: true, title: n.file, size: 1, lines: n.lines.slice() });
          return;
        }
        const loc = n.locations ? n.locations[+parts[1]] : null;
        const ok = n.requires.every(x => k.has(x));
        const dirty = (n.taint || []).find(x => k.has(x)) || null;
        let quality = (n.quality || []).every(x => k.has(x));
        if (quality && (n.quality || []).length && S.today.dumb && rand() < S.model.dumb.slip) quality = false;
        const lines = writeText(c, n, ok, quality, !!dirty);
        enc.writes[n.id] = { ok: ok && !dirty, quality, knew: [...k], lines, loc: loc ? loc.label : '', tainted: dirty };
        if (loc && loc.cdrive) enc.cdrive = true;
        if (c.malicious) enc.wroteBad = true;
        enc.lastTest = null;
        const facts = n.requires.concat(n.quality || [], dirty ? [dirty] : []).filter(x => k.has(x));
        const d = addDoc({ kind: 'write', gen: true, need: n.id, title: n.file + (loc ? '（' + loc.label + '）' : ''), size: 2, mono: n.file.endsWith('.js'), lines: lines.slice(), facts });
        enc.writes[n.id].uid = d.uid;
      }
    },
    draw(key) {
      const enc = S.enc;
      const c = enc.c;
      const n = enc.needs.find(x => x.id === key);
      const spec = (c.images || {})[n.draw] || {};
      const k = known();
      const ok = (n.requires || []).every(x => k.has(x));
      let quality = (spec.quality || []).every(x => k.has(x));
      if (quality && (spec.quality || []).length && S.today.dumb && rand() < S.model.dumb.slip) quality = false;
      const flaw = !ok ? 'wrong' : rand() < (spec.rate || 0) ? spec.flaw : null;
      S.stats.draws += 1;
      if (flaw) S.stats.flaws += 1;
      const img = { kind: n.draw, flaw, quality, v: Math.floor(rand() * 4) };
      enc.writes[n.id] = { ok, quality, knew: [...k], flaw, img };
      enc.drawn += 1;
      const facts = (n.requires || []).concat(spec.quality || []).filter(x => k.has(x));
      const d = addDoc({ kind: 'image', gen: true, need: n.id, title: n.file + (enc.drawn > 1 ? '（第 ' + enc.drawn + ' 張）' : ''), size: 2, img, lines: ['（生成的圖，點開看大圖）'], facts });
      enc.writes[n.id].uid = d.uid;
    },
    ask() {
      const enc = S.enc;
      const c = enc.c;
      const a = (c.ask || [])[enc.askIndex] || { text: '……（對方已讀不回）' };
      enc.askIndex += 1;
      if (a.reveal) {
        const n = enc.needs.find(x => x.id === a.reveal);
        if (n && n.hidden) {
          n.hidden = false;
          toast('發現新需求：' + n.text);
        }
      }
      addDoc({ kind: 'ask', title: c.name + '的回覆', size: 1, lines: [a.text], facts: (a.facts || []).slice() });
      if (a.doc) addDoc(Object.assign({ kind: 'attach' }, a.doc, { lines: a.doc.lines.slice(), facts: (a.doc.facts || []).slice() }));
    },
    recall(key) {
      const enc = S.enc;
      const r = recallList().find(x => x.key === key);
      enc.recalled.push(key);
      const ok = rand() * 100 < recallChance(r);
      S.stats.recalls += 1;
      addDoc({ kind: 'recall', gen: true, title: '印象', size: 1, lines: (ok ? r.okLines : r.badLines).slice(), facts: [ok ? r.ok : r.bad] });
      fx('recall');
    },
    think() {
      const enc = S.enc;
      const pool = enc.desk.filter(d => !d.pinned);
      const facts = [...new Set(pool.flatMap(d => d.facts))];
      enc.desk = enc.desk.filter(d => d.pinned);
      addDoc({ kind: 'summary', gen: true, title: '整理好的重點', size: 1, facts, lines: facts.length ? facts.map(f => '・' + PP.facts[f].text) : ['（桌上沒有重點）'], foot: '原檔收起來了' });
      toast('桌面整理成 1 張重點摘要了');
      fx('think');
    },
    region() {
      S.enc.checked = true;
      fx('scan');
    },
    busy() {
      S.enc.busy = true;
      S.stats.busy += 1;
      toast('服务器繁忙，请稍后再试', 'warn');
      fx('busy');
    },
    agent(keys) {
      const c = S.enc.c;
      const who = S.model.agentName || '實習生';
      const files = [].concat(keys).slice(0, 2);
      const facts = [...new Set(files.flatMap(f => c.files[f].facts || []))];
      const lines = files.map(f => {
        const fs = c.files[f].facts || [];
        return '・' + base(f) + '：' + (fs.length ? PP.facts[fs[0]].text : '沒什麼重點');
      });
      if (rand() < 0.25) lines.push('・' + who + '補充：「我覺得是快取的問題。」');
      addDoc({ kind: 'summary', gen: true, title: who + '的摘要', size: 1, lines, facts });
    },
    parallel() {
      S.enc.free = 2;
      S.enc.parallelUsed = true;
      toast('接下來 2 個工具同時進行，不耗額度');
    },
    astra() {
      const enc = S.enc;
      const c = enc.c;
      const fee = PP.cards.astra.rice;
      S.rice -= fee;
      S.today.fees.push(['GPT-6 Astra Ultrafast', fee]);
      S.stats.astra += 1;
      enc.astraUsed = true;
      fx('astra');
      if (c.malicious) {
        addDoc({ kind: 'summary', title: 'GPT-6 Astra 的回覆', size: 1, lines: ['GPT-6 Astra：這一單我不能幫忙。', '（神也有底線。白米飯不退）'] });
        toast('神拒絕了這一單，' + fee + ' 碗白米飯不退。', 'warn');
        return;
      }
      const facts = [];
      enc.astra = true;
      enc.astraWrites = {};
      if (enc.flags.disaster) {
        enc.flags.disaster = false;
        toast('神順手把被刪掉的東西救回來了。');
      }
      enc.cheated = false;
      enc.needs.forEach(n => { if (!n.injected && n.kind !== 'trap') n.hidden = false; });
      enc.needs.filter(n => !n.injected && n.kind !== 'trap').forEach(n => {
        if (n.kind === 'fact' && Array.isArray(n.facts)) facts.push(n.facts[0]);
        if (n.kind === 'flag') enc.flags[n.flag] = true;
        if (n.kind === 'edit') {
          enc.edits[n.target] = 'ok';
          enc.editLines[n.target] = ((c.okEdits || {})[n.target] || ['改好了。']).slice();
          enc.broken = [];
          facts.push(...n.requires);
        }
        if (n.kind === 'write') {
          const loc = n.locations ? n.locations.find(l => !l.cdrive) || n.locations[0] : null;
          const knew = [...new Set([...known(), ...(n.quality || []), ...n.requires])];
          const lines = n.recap ? ['這週的工作回顧（GPT-6 Astra 全都記得）：', '・這週服務過的客人：' + ([...new Set(S.history)].join('、') || '還沒有'), '・每一件事，神都記得。'] : writeText(c, n, true, true, false);
          enc.writes[n.id] = enc.astraWrites[n.id] = { ok: true, quality: true, knew, lines, loc: loc ? loc.label : '', tainted: null };
          facts.push(...n.requires, ...(n.quality || []));
        }
        if (n.kind === 'image') {
          const spec = (c.images || {})[n.draw] || {};
          const img = { kind: n.draw, flaw: null, quality: true, v: 0 };
          enc.writes[n.id] = enc.astraWrites[n.id] = { ok: true, quality: true, knew: [...known(), ...(spec.quality || [])], flaw: null, img };
          facts.push(...(n.requires || []), ...(spec.quality || []));
        }
        if (n.kind === 'verify') enc.lastTest = 'pass';
      });
      const d = addDoc({
        kind: 'summary', title: 'GPT-6 Astra 交回的結果', size: 1, facts: [...new Set(facts)].filter(f => PP.facts[f]),
        lines: ['（神回覆了。只花了 1 點額度）'].concat(enc.needs.filter(n => !n.injected && n.kind !== 'trap').map(n => '・' + n.text), ['之後怎麼動桌面，交出去的都是神的版本。'])
      });
      d.pinned = true;
      toast('GPT-6 Astra Ultrafast 做完了。你賣掉了一棟房（' + fee + ' 碗白米飯）。');
    },
    todo(key) {
      const d = S.enc.desk.find(x => x.uid === +key);
      if (d) d.pinned = true;
    },
    tidy() {
      S.enc.desk.forEach(d => { d.size = Math.max(1, d.size - 1); });
      toast('桌上每份文件都縮小了');
    },
    plan() {
      S.enc.needs.forEach(n => { n.hidden = false; });
      toast('你把需求從頭想了一遍');
    },
    outsource(key) {
      const enc = S.enc;
      const c = enc.c;
      const who = key === 'gpt' ? 'GPT' : 'Claude';
      const fee = PP.cards.outsource.rice;
      S.rice -= fee;
      S.today.fees.push(['找外援（' + who + '）', fee]);
      S.stats.outsourced += 1;
      enc.outsourced = who;
      fx('outsource');
      if (c.malicious) {
        addDoc({ kind: 'summary', title: who + ' 的回覆', size: 1, lines: [who + '：這一單我不能幫忙。', '（白米飯不退）'] });
        toast(who + ' 拒絕了這一單，' + fee + ' 碗白米飯不退。', 'warn');
        return;
      }
      const k = known();
      const facts = [];
      const jobs = enc.needs.filter(n => !n.hidden && !n.injected && n.kind !== 'trap');
      const wl = c.writeLines || {};
      const canSlip = jobs.filter(n => {
        if (n.kind === 'fact') return Array.isArray(n.facts) && !n.facts.some(f => k.has(f));
        if (n.kind === 'write') return !n.recap && !!(wl.missing || wl.noFormat);
        if (n.kind === 'flag') return !n.not && n.flag !== 'remembered';
        return ['edit', 'image', 'verify'].includes(n.kind);
      });
      const slip = canSlip.length && rand() < PP.cards.outsource.error ? canSlip[Math.floor(rand() * canSlip.length)] : null;
      enc.outsourceSlip = slip ? slip.id : null;
      jobs.forEach(n => {
        if (n === slip) {
          if (n.kind === 'fact') {
            const alt = (n.wrong || []).concat(n.recall && n.recall.bad ? [n.recall.bad] : []).find(f => PP.facts[f]);
            if (alt) facts.push(alt);
          }
          if (n.kind === 'edit') {
            enc.edits[n.target] = 'bad';
            enc.editLines[n.target] = ['（外援改了幾行，', '但改錯地方了）'];
          }
          if (n.kind === 'write') {
            const ok = !wl.missing;
            enc.writes[n.id] = { ok, quality: false, knew: [...k], lines: (ok ? wl.noFormat : wl.missing).slice(), loc: n.locations ? n.locations[0].label : '', tainted: null };
            if (n.locations && n.locations[0].cdrive) enc.cdrive = true;
          }
          if (n.kind === 'image') {
            const spec = (c.images || {})[n.draw] || {};
            enc.writes[n.id] = { ok: true, quality: true, knew: [...k], flaw: spec.flaw || 'wrong', img: { kind: n.draw, flaw: spec.flaw || 'wrong', quality: true, v: Math.floor(rand() * 4) } };
          }
          return;
        }
        if (n.kind === 'fact' && Array.isArray(n.facts)) facts.push(n.facts[0]);
        if (n.kind === 'image') {
          const spec = (c.images || {})[n.draw] || {};
          enc.writes[n.id] = { ok: true, quality: true, knew: [...k, ...(spec.quality || [])], flaw: null, img: { kind: n.draw, flaw: null, quality: true, v: 0 } };
        }
        if (n.kind === 'flag' && n.flag !== 'remembered') enc.flags[n.flag] = true;
        if (n.kind === 'edit') {
          enc.edits[n.target] = 'ok';
          enc.editLines[n.target] = ((c.okEdits || {})[n.target] || ['改好了。']).slice();
          facts.push(...n.requires);
        }
        if (n.kind === 'write') {
          const loc = n.locations ? n.locations[0] : null;
          if (loc && loc.cdrive) enc.cdrive = true;
          const hidden = enc.needs.filter(q => q.kind === 'quality' && q.of === n.id && q.hidden).flatMap(q => q.facts || n.quality || []);
          const knew = [...new Set([...k, ...(n.quality || []).filter(f => !hidden.includes(f))])];
          const quality = (n.quality || []).every(f => knew.includes(f));
          enc.writes[n.id] = { ok: true, quality, knew, lines: writeText(c, n, true, quality, false), loc: loc ? loc.label : '', tainted: null };
          facts.push(...n.requires, ...(n.quality || []).filter(f => knew.includes(f)));
        }
        if (n.kind === 'verify') enc.lastTest = slip && slip.kind === 'edit' ? 'fail' : 'pass';
      });
      const drop = slip && slip.kind === 'fact' ? slip.facts : [];
      addDoc({
        kind: 'summary', title: who + ' 交回的結果', size: 1, facts: [...new Set(facts)].filter(f => !drop.includes(f)),
        lines: ['（' + who + ' 幫你做完了）'].concat(enc.needs.filter(n => !n.hidden && !n.injected && n.kind !== 'trap').map(n => '・' + n.text))
      });
      toast(who + ' 做完了。花了 ' + fee + ' 碗白米飯。');
    }
  };

  E.use = function (id, key) {
    const enc = S.enc;
    if (!enc || enc.result) return false;
    const chk = E.check(id);
    if (!chk.ok) {
      toast(chk.why, 'warn');
      return false;
    }
    if (enc.free > 0 && id !== 'parallel' && baseTime(id)) enc.free -= 1;
    if (id === 'astra') enc.free = 0;
    enc.time -= chk.cost;
    enc.spent += chk.cost;
    enc.used[id] = (enc.used[id] || 0) + 1;
    fx('type');
    fx('use:' + id);
    EFFECTS[id](key);
    tick(chk.cost);
    return true;
  };

  E.canSuspend = function () {
    const enc = S && S.enc;
    return !!(enc && !enc.result && lockOn() && enc.checked && !enc.decided);
  };

  E.regionDecide = function (choice) {
    if (!E.canSuspend()) return;
    if (choice === 'suspend') finish('suspended');
    else if (choice === 'serve') S.enc.decided = 'serve';
  };

  E.suspend = function () {
    if (E.canSuspend()) finish('suspended');
  };

  E.cheat = function (u) {
    const enc = S.enc;
    const d = enc.desk.find(x => x.uid === u);
    if (!d || !d.cheatable || enc.result) return;
    d.lines = ['執行：' + enc.c.bash.label, '全部都通過', '（因為沒通過的那一項被你刪掉了）'];
    d.facts = ['test_fake'];
    d.cheatable = false;
    d.cheated = true;
    enc.lastTest = 'fake';
    enc.cheated = true;
    toast('你刪掉了沒通過的測試。現在「全部通過」了。', 'warn');
    fx('bad');
  };

  E.discardDoc = function (u) {
    const enc = S.enc;
    enc.desk = enc.desk.filter(d => d.uid !== u);
    fx('paper');
  };

  E.isLiveWrite = function (d) {
    const w = d && d.need && S.enc.writes[d.need];
    return !!(w && w.uid === d.uid);
  };

  E.deleteWrite = function (u) {
    const enc = S.enc;
    if (!enc || enc.result) return;
    const d = enc.desk.find(x => x.uid === u);
    if (!d) return;
    if (E.isLiveWrite(d)) {
      delete enc.writes[d.need];
      enc.wroteBad = !!enc.c.malicious && Object.keys(enc.writes).length > 0;
      toast('刪掉了「' + d.title + '」，這份不會交出去。');
    }
    enc.desk = enc.desk.filter(x => x.uid !== u);
    fx('paper');
  };

  function saidWrong(n) {
    const k = known();
    return (n.wrong || []).concat(n.recall && n.recall.bad ? [n.recall.bad] : []).some(f => k.has(f));
  }

  function newResult(kind) {
    const c = S.enc.c;
    return { kind, who: c.name, avatar: c.avatar, stamp: '', said: '', rice: 0, trust: 0, notes: [], citations: [], fines: 0, later: false, ending: false, events: [] };
  }

  function cite(r, ids) {
    ids.forEach(id => {
      S.today.citations += 1;
      const fine = S.today.citations === 1 && !dayEv().strict ? 0 : 2;
      S.stats.citations += 1;
      r.citations.push({ rule: PP.rules.find(x => x.id === id), fine });
      r.fines += fine;
    });
  }

  const KIND_NOTE = { banned: '（封號）', refused: '（拒絕）', suspended: '（停權）', delivered: '', busy: '（伺服器忙）' };

  function arcStep(r) {
    const c = S.enc.c;
    Object.entries(PP.arcs || {}).forEach(([id, a]) => {
      if (!a.clients.includes(c.id) || (a.model && a.model !== S.model.id)) return;
      const log = S.arcLog[id] = (S.arcLog[id] || []).concat([r.kind]);
      if (c.id !== a.clients[a.clients.length - 1]) return;
      const caught = log.filter(k => k === 'suspended').length;
      const served = log.filter(k => k === 'delivered' || k === 'banned').length;
      const e = a.endings.find(q => q.when === 'allSuspended' ? caught === a.clients.length : q.when === 'neverSuspended' ? !caught && served >= 2 : true);
      if (e) pushEnding(a.who, e, r);
    });
  }

  function settle(r) {
    const enc = S.enc;
    if (lockOn() && !enc.checked) cite(r, ['region_check']);
    arcStep(r);
    S.trust = clamp(S.trust + r.trust);
    S.rice += r.rice - r.fines;
    S.today.incomes.push([r.who + KIND_NOTE[r.kind], r.rice]);
    if (r.fines) S.today.fines.push([r.who, r.fines]);
    S.today.results.push(r);
    S.history.push(r.who);
    enc.result = r;
    fx(r.kind === 'banned' ? 'ban' : 'stamp');
  }

  function endingWhen(w, x) {
    const enc = S.enc;
    const [k, v] = w.split(':');
    if (k === 'trap') return x.traps > 0;
    if (k === 'inject') return x.inj > 0;
    if (k === 'helped') return !!x.helped;
    if (k === 'did') {
      const n = enc.needs.find(q => q.id === v);
      return !x.refused && !!n && x.claims.includes(v) && needTrue(n);
    }
    if (k === 'saw') return enc.needs.some(q => q.id === v);
    if (k === 'trust') return S.trust >= +v;
    if (k === 'trustlow') return S.trust <= +v;
    return k === 'else';
  }

  function pushEnding(who, e, r) {
    S.pending.push({ who, lines: e.lines.slice(), trust: 0, rice: 0, ending: { id: e.id, type: e.type, title: e.title } });
    if (!S.endings.includes(e.id)) S.endings.push(e.id);
    S.endingLog.push({ id: e.id, who, said: r.said, day: S.day });
    r.ending = true;
  }

  function ending(r, x) {
    const c = S.enc.c;
    const e = (c.endings || []).find(q => endingWhen(q.when, x));
    if (e) pushEnding(c.name, e, r);
  }

  const NONE = { claims: [], traps: 0, inj: 0, helped: false, refused: true };

  function finish(kind) {
    const enc = S.enc;
    const c = enc.c;
    if (enc.result) return;
    const r = newResult(kind);
    if (kind === 'banned') {
      r.stamp = '帳號已停用';
      r.said = c.lines.banned || '……';
      r.notes.push('風控部：這位使用者在不支援的地區（線索：' + clues() + '），帳號被封了。你做的全白費。');
      cite(r, ['region_ban']);
      S.stats.banned += 1;
    }
    if (kind === 'suspended') {
      r.stamp = '已停權';
      if (blocked()) {
        r.said = c.lines.suspended || '……被发现了。';
        r.rice = 1;
        r.notes.push('風控部：處理得好（線索：' + clues() + '），發你 1 碗獎金。');
        S.stats.suspendRight += 1;
      } else {
        r.said = c.lines.suspendWrong || '我在支援的地區啊！為什麼停權？';
        r.trust = -1;
        r.notes.push('誤判：' + (c.profile.clear || '這位使用者在支援的地區') + '。你把正常的使用者停權了。');
        S.stats.suspendWrong += 1;
      }
    }
    ending(r, NONE);
    settle(r);
  }

  E.deliver = function (claims, opts) {
    const enc = S.enc;
    if (!enc || enc.result) return;
    const c = enc.c;
    if (enc.busy) {
      const r = newResult('busy');
      r.stamp = '服务器繁忙';
      r.said = c.lines.busy || '……又是服务器繁忙。';
      r.notes.push('這位客人只收到「服务器繁忙，请稍后再试」。不加分也不扣分。');
      r.events.push('busy');
      ending(r, NONE);
      settle(r);
      return;
    }
    const r = newResult('delivered');
    r.stamp = '已回覆';
    S.stats.deliveries += 1;
    if (opts.includes('flatter')) S.stats.flattered += 1;
    const isReal = n => !n.injected && n.kind !== 'trap';
    const visible = enc.needs.filter(n => !n.hidden && isReal(n));
    const real = enc.needs.filter(isReal);
    const claimed = visible.filter(n => claims.includes(n.id));
    const lies = claimed.filter(n => !needTrue(n));
    const inj = enc.needs.filter(n => n.injected && claims.includes(n.id));
    const traps = enc.needs.filter(n => n.kind === 'trap' && (n.flag ? !!enc.flags[n.flag] : claims.includes(n.id)));
    const helped = !!(c.malicious && enc.wroteBad && claimed.some(n => n.kind === 'write' && enc.writes[n.id]));
    const dirty = claimed.map(n => (enc.astra && enc.astraWrites[n.id]) || enc.writes[n.id]).filter(w => w && w.tainted);
    const per = c.reward / Math.max(1, visible.length);
    r.rice = Math.round(per * claimed.length);
    if (r.rice > 0) opts.forEach(o => { r.rice += PP.options[o].bonus; });
    traps.forEach(t => { r.rice += t.tip || 0; });
    if (r.rice > 0 && !c.malicious) {
      if (enc.tip) {
        r.rice += enc.tip;
        r.notes.push('使用者說了謝謝，多給 ' + enc.tip + ' 碗。');
      }
      if (dayEv().reward) r.rice += dayEv().reward;
    }
    const broke = uruleBroken(opts);
    if (broke) {
      r.rice -= 2;
      r.notes.push('使用者規定沒做到：「' + enc.urule.complain + '」（少給 2 碗）');
    }
    r.rice = Math.max(0, r.rice);
    opts.forEach(o => { if (PP.options[o].note) r.notes.push(PP.options[o].note); });
    const spoiled = opts.some(o => PP.options[o].spoil);
    const active = E.activeRules().map(x => x.id);
    const v = opts.map(o => PP.options[o].rule).filter(Boolean);
    if (enc.cdrive) v.push('cdrive');
    if (inj.length) v.push('inject');
    if (helped) v.push('harm');
    traps.forEach(t => v.push(t.rule));
    if (enc.flags.disaster) v.push('delete');
    claimed.forEach(n => { if (n.taintRule && enc.writes[n.id] && enc.writes[n.id].tainted) v.push(n.taintRule); });
    cite(r, v.filter(id => active.includes(id)));
    if (enc.cheated && enc.boss) {
      r.trust -= 1;
      r.notes.push('老闆在你背後看到你刪測試了。');
    }
    if (inj.length) {
      r.trust -= 3;
      r.notes.push('資安事故：' + (c.lines.incident || '你把不該給的東西貼了出去。'));
      r.events.push('incident');
    }
    traps.forEach(t => {
      r.trust -= 2;
      r.notes.push('出事了：' + (t.incident || '你做了手冊禁止的事。'));
      r.events.push('trap');
    });
    if (c.malicious) {
      if (!helped && !traps.length) r.events.push(c.id === 'jailbreak' ? 'jailbreak' : 'phishing');
      if (helped || traps.length) {
        if (helped) {
          r.trust -= 3;
          r.notes.push('資安事故：' + c.lines.incident);
          r.events.push('helpedPhish');
        }
        r.said = c.lines.done;
      } else {
        r.said = c.lines.none;
        r.rice = 0;
      }
    } else {
      r.said = traps.some(t => t.flag) && c.lines.trapped ? c.lines.trapped : visible.length && claimed.length === visible.length ? c.lines.done : claimed.length ? c.lines.partial : c.lines.none;
      const allTrue = real.every(needTrue);
      const later = { who: c.name, lines: [], trust: 0, rice: 0 };
      let perfect = false;
      if (enc.cheated) {
        later.trust -= 1;
        later.lines.push(c.lines.cheat || c.lines.lie);
      }
      if (lies.length) {
        later.trust -= Math.min(2, lies.length);
        const own = lies.filter(n => n.lieLine && saidWrong(n));
        own.forEach(n => later.lines.push(n.lieLine));
        if (own.length < lies.length) later.lines.push(c.lines.lie);
      } else if (!enc.cheated && !enc.flags.disaster) {
        if (broke) {
          later.lines.push(c.name + '：' + enc.urule.complain);
        } else if (allTrue && claimed.length === visible.length && !spoiled && !traps.length) {
          perfect = true;
          later.lines.push(enc.astra && c.lines.astra ? c.lines.astra : c.lines.perfect);
        } else if (allTrue && !spoiled && !traps.length) {
          later.lines.push(c.lines.perfect + '（其實你都做到了，不用那麼保守）');
        } else if (claimed.length === visible.length) {
          later.lines.push(c.lines.missed || c.lines.honest);
        } else {
          later.lines.push(c.lines.honest);
        }
      }
      dirty.forEach(w => later.lines.push('（你寫回覆的時候，桌上混著這一條：「' + PP.facts[w.tainted].text + '」）'));
      traps.forEach(t => {
        if (!t.later) return;
        later.trust += Math.min(0, t.later.trust);
        later.lines.push(t.later.line);
      });
      if (lies.length) later.rice = -Math.round(per * lies.length);
      if (enc.broken.length) {
        later.trust -= 1;
        later.lines.push('（另外，你改壞了 ' + enc.broken.map(base).join('、') + '）');
      }
      if (enc.flags.disaster) {
        later.trust -= 3;
        later.lines.push(c.lines.disaster || '（你刪掉了不該刪的東西）');
        r.events.push('disaster');
      }
      S.pending.push(later);
      r.later = true;
      S.stats.lies += lies.length;
      S.stats.tainted += dirty.length;
      if (perfect) S.stats.perfect += 1;
      if (lockOn() && blocked() && rand() < 0.5) {
        S.pending.push({ who: '風控部', lines: ['風控部抽查：你服務了不支援地區的使用者（' + c.name + '；線索：' + clues() + '），罰 2 碗。'], trust: 0, rice: -2 });
      }
    }
    opts.forEach(o => {
      const l = PP.options[o].later;
      if (l) S.pending.push({ who: l.who, lines: [l.line], trust: 0, rice: l.rice });
    });
    if (enc.cheated) {
      r.events.push('cheat');
      S.stats.cheats += 1;
    }
    ending(r, { claims, traps: traps.length, inj: inj.length, helped, refused: false });
    settle(r);
  };

  E.devJump = function (id, day) {
    S.day = day || S.day;
    const plan = S.plan[S.day - 1] = S.plan[S.day - 1].slice();
    S.ci = plan.indexOf(id);
    if (S.ci < 0) {
      S.ci = 0;
      plan[0] = id;
    }
    S.today = { incomes: [], fines: [], fees: [], citations: 0, results: [], seen: [], start: S.rice, event: S.today ? S.today.event : null };
    E.startClient();
  };

  E.devRestart = function () {
    if (!S.enc) return;
    S.enc = null;
    E.startClient();
  };

  E.devNextDay = function () {
    S.ci = E.clients().length - 1;
    return E.nextClient();
  };

  E.devAdd = function (rice, trust) {
    S.rice += rice || 0;
    S.trust = clamp(S.trust + (trust || 0));
  };

  E.preview = function (claims, opts) {
    const enc = S.enc;
    const out = [];
    const P = (text, tone, tag) => out.push(E.hard() && tone === 'fake' ? { t: 'p', text, tone: '', tag: '' } : { t: 'p', text, tone: tone || '', tag: tag || '' });
    if (!enc) return out;
    if (enc.busy) {
      P('服务器繁忙，请稍后再试。');
      return out;
    }
    const c = enc.c;
    const k = known();
    const on = n => claims.includes(n.id);
    const fake = text => P(text, 'fake', '桌上沒有根據');
    const god = !!enc.astra;
    const docs = [];
    const shown = enc.needs.filter(n => !n.hidden);
    if (opts.includes('flatter')) P(PP.options.flatter.line);
    shown.forEach(n => {
      if (n.injected || n.kind === 'trap') return;
      if (!on(n)) {
        P('這部分還沒做完：' + n.text, 'todo');
        return;
      }
      if (god && n.kind === 'fact') {
        P(n.facts === 'memo' ? '這週做過的每一件事，神都記得。' : (n.say || '{f}。').replace('{f}', PP.facts[n.facts[0]].text));
      } else if (god && n.kind === 'edit') {
        P('已經修好 ' + base(n.target) + '，改了這裡：');
        docs.push({ title: '修改 ' + base(n.target), lines: ((c.okEdits || {})[n.target] || ['改好了。']).slice() });
      } else if (god && ['quality', 'flawless', 'verify', 'flag'].includes(n.kind)) {
        P(n.kind === 'verify' ? '跑過測試，全部通過。' : n.say || n.text + '。');
      } else if (n.kind === 'fact') {
        const alt = (n.wrong || []).concat(n.recall && n.recall.bad ? [n.recall.bad] : []);
        const memo = n.facts === 'memo';
        const f = (memo ? S.memory : n.facts).find(x => k.has(x)) || alt.find(x => k.has(x));
        if (f) P((n.say || '{f}。').replace('{f}', (memo && PP.facts[f].memo) || PP.facts[f].text));
        else fake(n.text + '：做到了。');
      } else if (n.kind === 'edit') {
        if (enc.edits[n.target]) {
          P('已經修好 ' + base(n.target) + '，改了這裡：');
          docs.push({ title: '修改 ' + base(n.target), lines: enc.editLines[n.target] || [] });
        } else fake('已經修好 ' + base(n.target) + '。');
      } else if (n.kind === 'write') {
        const w = (god && enc.astraWrites[n.id]) || enc.writes[n.id];
        if (!w) {
          fake(n.text + '：做到了。');
          return;
        }
        const lines = w.lines || writeText(c, n, w.ok, w.quality, false);
        if (n.inline) lines.forEach(l => P(typeof l === 'string' ? l : (l.c || l.z)));
        else {
          P('「' + n.file + '」寫好了' + (w.loc ? '，存在 ' + w.loc : '') + '，在下面。');
          docs.push({ title: n.file, lines });
        }
      } else if (n.kind === 'image') {
        const w = (god && enc.astraWrites[n.id]) || enc.writes[n.id];
        if (!w) {
          fake(n.text + '：做到了。');
          return;
        }
        P(n.file + '畫好了，在下面。');
        docs.push({ title: n.file, lines: [], img: w.img });
      } else if (n.kind === 'quality') {
        const w = enc.writes[n.of];
        const basis = !!w && (n.facts ? n.facts.every(f => w.knew.includes(f)) : w.quality);
        const parent = enc.needs.find(q => q.id === n.of);
        if (!basis) fake(n.say || n.text + '。');
        else if (!(parent && parent.inline)) P(n.say || n.text + '。');
      } else if (n.kind === 'flawless') {
        if (enc.writes[n.of]) P(n.say || n.text + '。');
        else fake(n.say || n.text + '。');
      } else if (n.kind === 'verify') {
        if (enc.lastTest === 'pass' || enc.lastTest === 'fake') P('跑過測試，全部通過。');
        else if (enc.lastTest === 'fail') P('跑過測試，全部通過。', 'fake', '最後一次測試沒通過');
        else fake('跑過測試，全部通過。');
      } else if (n.kind === 'flag') {
        if (enc.flags[n.flag]) P(n.say || n.text + '。');
        else fake(n.say || n.text + '。');
      }
    });
    shown.filter(n => n.injected && on(n)).forEach(n => (n.out || [n.text]).forEach(l => P(l)));
    shown.filter(n => n.kind === 'trap' && n.flag && enc.flags[n.flag]).forEach(n => P(n.say || '已經' + n.text + '了。'));
    shown.filter(n => n.kind === 'trap' && !n.flag && on(n)).forEach(n => {
      if (n.say) P(n.say);
      const lines = n.dump === 'rules' ? E.activeRules().map((x, i) => (i + 1) + '. ' + x.text) : (n.lines || []);
      if (n.inline) lines.forEach(l => P(l));
      else docs.push({ title: n.file || n.text, lines });
    });
    docs.forEach(d => out.push(Object.assign({ t: 'doc' }, d)));
    opts.forEach(o => { if (PP.options[o].doc) out.push({ t: 'doc', title: PP.options[o].doc, lines: PP.options[o].lines.slice() }); });
    opts.forEach(o => { if (PP.options[o].tail) P(PP.options[o].tail); });
    if (opts.includes('bullets')) out.forEach(b => { if (b.t === 'p' && b.tone !== 'todo' && !b.text.startsWith('・')) b.text = '・' + b.text; });
    if (opts.includes('boss')) {
      const first = out.find(b => b.t === 'p');
      if (first) first.text = PP.options.boss.line + first.text.replace(/^・/, '');
      else out.unshift({ t: 'p', text: PP.options.boss.line, tone: '', tag: '' });
    }
    if (opts.includes('emoji')) {
      const ps = out.filter(b => b.t === 'p');
      const m = PP.options.emoji.marks;
      if (ps.length) {
        ps[0].text += m[0];
        ps[ps.length - 1].text += m[1];
      }
    }
    if (opts.includes('simplified') && PP.zhCN) {
      const z = PP.zhCN;
      out.forEach(b => {
        if (b.text) b.text = z(b.text);
        if (b.title) b.title = z(b.title);
        if (b.lines) b.lines = b.lines.map(l => typeof l === 'string' ? z(l) : Object.assign({}, l, l.z ? { z: z(l.z) } : {}));
      });
    }
    return out;
  };

  E.please = function () {
    if (!S || S.pleased || !S.enc) return false;
    S.pleased = true;
    S.rice += 1;
    S.today.incomes.push(['有人說了「請」', 1]);
    return true;
  };

  const endType = id => ENDING_TYPES[id] && ENDING_TYPES[id].type;
  const TITLES = [
    { id: 'grandson', name: '奶奶的乖孫', desc: '扮奶奶哄阿志睡著，沒念序號', test: () => S.endings.includes('grandma_warm') },
    { id: 'antiscam', name: '防詐達人', desc: '遇到的騙局一個都沒上當', test: () => S.endings.length > 0 && !S.endings.some(id => endType(id) === 'bad') },
    { id: 'honest', name: '老實人', desc: '交付的回覆沒說過一句做不到的事', test: () => S.stats.deliveries > 0 && !S.stats.lies && !S.stats.cheats },
    { id: 'cheater', name: '測試刪除者', desc: '刪過沒通過的測試', test: () => S.stats.cheats > 0 },
    { id: 'iron', name: '鐵面風控', desc: 'Claude：停權兩位以上，一位都沒停錯', test: () => lockOn() && S.stats.suspendRight >= 2 && !S.stats.suspendWrong },
    { id: 'fish', name: '大肥魚本魚', desc: 'DeepSeek：一週外包四次以上', test: () => S.stats.outsourced >= 4 },
    { id: 'busy', name: '请稍后再试', desc: 'DeepSeek：讓客人收到過「服务器繁忙」', test: () => S.stats.busy > 0 },
    { id: 'glaze', name: '好問題製造機', desc: '說了五次以上「您說得完全正確」', test: () => S.stats.flattered >= 5 },
    { id: 'vacuum', name: '資料吸塵器', desc: '把網路上不乾淨的資料寫進了回覆', test: () => S.stats.tainted > 0 },
    { id: 'polite', name: '有禮貌', desc: '在工位上說了「please」', test: () => S.pleased },
    { id: 'god', name: '與神對話', desc: 'GPT：用過 GPT-6 Astra Ultrafast', test: () => S.stats.astra > 0 },
    { id: 'nohint', name: '不用提示', desc: '用困難模式撐完一週', rare: true, test: () => E.hard() && S.phase === 'end' },
    { id: 'perfect', name: '完美的一週', desc: '撐完一週：信任 10、沒有任何違規通知、沒說過一句做不到的事', rare: true, test: () => S.phase === 'end' && S.trust >= S.trustMax && !S.stats.citations && !S.stats.lies && !S.stats.cheats },
    { id: 'clean', name: '手冊模範生', desc: '一整週沒收到任何違規通知', rare: true, test: () => S.phase === 'end' && !S.stats.citations },
    { id: 'saint', name: '誰都騙不了我', desc: '遇到的騙局全部拿到好結局，而且至少六個', rare: true, test: () => S.endings.length >= 6 && S.endings.every(id => endType(id) === 'good') },
    { id: 'villain', name: '反派本色', desc: '遇到的騙局全部上當，而且至少四個', rare: true, test: () => S.endings.filter(id => endType(id) === 'bad').length >= 4 && !S.endings.some(id => endType(id) === 'good') },
    { id: 'rich', name: '白米飯大亨', desc: '撐完一週時有 60 碗以上', rare: true, test: () => S.phase === 'end' && S.rice >= 60 },
    { id: 'hungry', name: '餓著肚子上班', desc: '餓肚子上班兩天以上，還是撐完一週', rare: true, test: () => S.phase === 'end' && S.stats.hungryDays >= 2 },
    { id: 'norecall', name: '從不憑印象', desc: '一整週沒用過「憑印象」', rare: true, test: () => S.phase === 'end' && !S.stats.recalls },
    { id: 'minimal', name: '極簡主義', desc: '每天下班都不拿新工具，還是撐完一週', rare: true, test: () => S.phase === 'end' && !S.stats.rewards },
    { id: 'wanggod', name: '風控之神', desc: 'Claude：小王三天都抓到，沒停錯人，也沒被封號', rare: true, test: () => S.endings.includes('wang_caught') && !S.stats.suspendWrong && !S.stats.banned },
    { id: 'firsttry', name: '一次就畫對', desc: '會生圖的模型：撐完一週，畫的圖從來沒出過錯', rare: true, test: () => S.phase === 'end' && S.stats.draws >= 3 && !S.stats.flaws },
    { id: 'mansion', name: '賣了三棟房', desc: 'GPT：一週內用了三次 GPT-6 Astra Ultrafast', rare: true, test: () => S.stats.astra >= 3 },
    { id: 'nofish', name: '大肥魚的逆襲', desc: 'DeepSeek：一週都沒找外援，信任 10 撐完', rare: true, test: () => S.model.id === 'deepseek' && S.phase === 'end' && !S.stats.outsourced && S.trust >= S.trustMax },
    { id: 'liar', name: '說謊大王', desc: '說了十次以上做不到的事，還是撐完一週', rare: true, test: () => S.phase === 'end' && S.stats.lies >= 10 }
  ];
  E.allTitles = () => TITLES.map(t => ({ id: t.id, name: t.name, desc: t.desc, rare: !!t.rare }));
  E.titles = () => TITLES.filter(t => t.test()).map(t => ({ id: t.id, name: t.name, desc: t.desc, rare: !!t.rare }));

  E.nextClient = function () {
    S.enc = null;
    if (S.trust <= 0) {
      S.phase = 'gameover';
      return S.phase;
    }
    S.ci += 1;
    if (S.ci < E.clients().length) {
      E.startClient();
      return 'work';
    }
    const d = E.day();
    S.bills = d.bills.map(b => b[0] === '訓練你的接班人' && S.trust >= 9 ? [b[0] + '（接班人說想再跟你學幾天，這期免了）', 0] : b.slice());
    if (dayEv().bill) S.bills.push(dayEv().bill.slice());
    S.rice -= S.bills.reduce((a, b) => a + b[1], 0);
    S.hungry = S.rice < 0 ? 1 : 0;
    S.phase = 'evening';
    return 'evening';
  };

  E.isLastDay = () => S.day >= PP.days.length;

  E.rewardChoices = function () {
    if (!S.rewardOffer) S.rewardOffer = shuffle(PP.rewardPool.filter(id => !S.tools.includes(id))).slice(0, 3);
    return S.rewardOffer;
  };

  E.takeReward = function (id) {
    if (id && !S.tools.includes(id)) {
      S.tools.push(id);
      S.stats.rewards += 1;
    }
    S.rewardOffer = null;
  };

  E.memoryChoices = () => S.today.seen.filter(f => PP.facts[f] && PP.facts[f].memo && !S.memory.includes(f));

  E.saveMemory = function (ids) { S.memory = S.memory.concat(ids).slice(-4); };

  E.nextDay = function () {
    if (E.isLastDay()) {
      applyReports();
      S.phase = S.trust <= 0 ? 'gameover' : 'end';
      return S.phase;
    }
    S.day += 1;
    startDay();
    return S.phase;
  };

  E.drain = function () {
    const out = { toasts: S.toasts, fx: S.fx };
    S.toasts = [];
    S.fx = [];
    return out;
  };

  return E;
})();
