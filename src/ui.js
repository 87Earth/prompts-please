window.PP = window.PP || {};

PP.UI = (() => {
  const U = {};
  const E = PP.E;
  let stage = null;
  let ov = null;
  let tip = null;
  let toastBox = null;
  let chatBox = null;
  let selModel = 'claude';
  let seenDocs = new Set();
  let resultShown = false;
  let picker = null;
  let memSel = [];
  let tipFor = null;
  let chatTimer = null;
  let chatNext = 0;
  let clipTimer = null;
  let lastUsed = null;
  let keyBuf = '';
  let titleClicks = 0;
  let hbClicks = 0;
  let prevClient = null;
  let officeGen = 0;
  let hintsOn = true;
  let selDiff = 'easy';
  let devModel = 'claude';
  let devDiff = 'easy';
  let devSeed = 1;
  try {
    hintsOn = localStorage.getItem('pp_hints') !== '0';
    selDiff = localStorage.getItem('pp_diff') === 'hard' ? 'hard' : 'easy';
  } catch (e) {}
  const DEV = /[?&]dev=1/.test(location.search);
  PP.TOUCH = !!((window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window);
  let lastPointer = 'mouse';
  let armed = null;
  let achTab = 'titles';
  let dumbTold = 0;

  const KIND = { file: '檔案', grep: '找字結果', web: '網頁', term: '指令結果', diff: '修改', write: '寫好的', ask: '使用者回覆', recall: '印象', summary: '摘要', attach: '使用者傳來', image: '生成的圖' };
  const PICK_TITLES = { read: '要打開哪個檔案？', grep: '要找什麼字？', web: '搜尋結果：挑一個打開', edit: '要改哪裡、寫什麼？', draw: '要畫哪一張？', recall: '要憑印象回答哪一題？', todo: '要釘住哪份文件？' };
  const ENDING_TAG = { good: '好結局', bad: '壞結局', normal: '普通結局' };
  const SUBTITLES = ['請出示提示詞', 'Papers, Please?', '請出示白米飯', '請出示提示詞'];
  const DIFF = { easy: '簡單', hard: '困難' };
  const DUMB = 'OpenAI 又把大家的使用額度重置了，用量暴增。你今天有點降智：憑印象的把握打七折，寫東西偶爾會漏掉細節。';
  const DIFF_NOTE = { easy: '可以開提示；預覽會標出沒有根據的話。', hard: '沒有提示，桌面只有 6 格；預覽不會提醒，瞎掰一樣算錯。' };

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const md = s => esc(s).replace(/`([^`]+)`/g, '<span class="fn">$1</span>');
  const portrait = id => 'assets/sprites/portraits/' + id + '.png';
  const $ = id => document.getElementById(id);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const rice = n => '<img class="rice" src="' + PP.icon('rice') + '">' + n + ' 碗';

  const SAVE_KEY = 'pp_save';

  function saveRun() {
    const s = E.snapshot();
    if (DEV || !s) return;
    try { localStorage.setItem(SAVE_KEY, s); } catch (e) {}
  }

  function readSave() {
    try { return localStorage.getItem(SAVE_KEY) || ''; } catch (e) { return ''; }
  }

  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  }

  function saveLabel(info) {
    return esc(info.model) + '・第 ' + info.day + ' 天・客人 ' + (info.ci + 1) + '/' + info.clients + (info.difficulty === 'hard' ? '・困難' : '');
  }

  function startRun() {
    E.newRun(selModel, seedFor(), selDiff);
    U.morning();
  }

  function seedFor() {
    const q = new URLSearchParams(location.search).get('seed');
    return q ? +q : Math.floor(Math.random() * 1e9);
  }

  function frame(html) {
    hideTip();
    stopChatter();
    if (clipTimer) clearTimeout(clipTimer);
    clipTimer = null;
    picker = null;
    const fromPaper = !!stage.querySelector(':scope > .paper-scr');
    stage.innerHTML = html + '<div id="ov"></div><div id="tip"></div><div class="toasts"></div>';
    const first = stage.firstElementChild;
    if (fromPaper && first && first.classList.contains('paper-scr')) first.classList.add('still');
    ov = $('ov');
    tip = $('tip');
    toastBox = stage.querySelector('.toasts');
    chatBox = $('chat');
  }

  function overlay(html, sticky) {
    hideTip();
    ov.innerHTML = html;
    ov.dataset.sticky = sticky ? '1' : '';
    ov.classList.add('on');
  }

  function closeOverlay() {
    ov.classList.remove('on');
    ov.innerHTML = '';
    ov.dataset.sticky = '';
    picker = null;
  }

  function toast(text, tone) {
    const e = document.createElement('div');
    e.className = 'toast ' + (tone || '');
    e.textContent = text;
    toastBox.appendChild(e);
    while (toastBox.children.length > 3) toastBox.firstChild.remove();
    setTimeout(() => e.remove(), 2900);
  }

  function lineHTML(l, full) {
    if (typeof l === 'string') return '<div class="ln">' + md(l) + '</div>';
    let h = '';
    if (l.z) h += '<div class="ln">' + md(l.z) + '</div>';
    if (l.c && (full || !l.z)) h += '<div class="ln code">' + md(l.c) + '</div>';
    return h;
  }

  function coworkers(by) {
    const S = E.state();
    const all = PP.models.map((m, i) => ({ m, i })).filter(x => !S || !S.model || x.m.id !== S.model.id);
    const some = by ? all.filter(x => by.includes(x.m.id)) : [];
    return some.length ? some : all;
  }

  const entry = e => typeof e === 'string' ? { text: e } : e;

  function bubbleAt(cx, label, text) {
    if (!chatBox || !text) return;
    const b = document.createElement('div');
    b.className = 'bubble';
    b.innerHTML = (label ? '<b>' + esc(label) + '</b>：' : '') + esc(text);
    chatBox.innerHTML = '';
    chatBox.appendChild(b);
    const w = b.offsetWidth;
    const left = Math.round(Math.max(4, Math.min(796 - w, cx - w / 2)));
    b.style.left = left + 'px';
    const tail = document.createElement('i');
    tail.style.left = Math.round(Math.max(3, Math.min(w - 10, cx - left - 3))) + 'px';
    b.appendChild(tail);
    PP.sfx.play('chat');
    setTimeout(() => { if (b.parentNode) b.remove(); }, 5200);
  }

  function say(text, by, idx) {
    if (!text) return;
    const who = idx != null ? { m: PP.models[idx], i: idx } : pick(coworkers(by));
    bubbleAt(168 + who.i * 70 + 19, who.m.name, text);
    if (office) office.hop = { i: who.i, until: performance.now() + 700 };
  }

  function startChatter() {
    stopChatter();
    chatNext = Date.now() + 9000;
    chatTimer = setInterval(() => {
      if (Date.now() < chatNext || (ov && ov.classList.contains('on'))) return;
      const S = E.state();
      const own = (S && PP.chatter.byPlayer[S.model.id]) || [];
      const e = entry(pick(own.length && Math.random() < 0.35 ? own : PP.chatter.idle));
      say(e.text, e.by);
      chatNext = Date.now() + 14000 + Math.random() * 10000;
    }, 1000);
  }

  function stopChatter() {
    if (chatTimer) clearInterval(chatTimer);
    chatTimer = null;
  }

  function react(key, by) {
    const lines = PP.chatter[key];
    if (!lines || !lines.length) return;
    const e = entry(pick(lines));
    chatNext = Date.now() + 12000;
    setTimeout(() => say(e.text, by || e.by), 600);
  }

  function squash() {
    const el = stage.querySelector('.docs');
    if (!el) return;
    el.classList.remove('squash');
    void el.offsetWidth;
    el.classList.add('squash');
  }

  function flash() {
    const f = document.createElement('div');
    f.className = 'flash';
    stage.appendChild(f);
    setTimeout(() => f.remove(), 700);
  }

  function floatText(text, cls) {
    const money = stage.querySelector('#top .money');
    if (!money) return;
    const f = document.createElement('div');
    f.className = 'float ' + (cls || '');
    f.textContent = text;
    f.style.left = (money.offsetLeft + 34) + 'px';
    stage.appendChild(f);
    setTimeout(() => f.remove(), 1500);
  }

  function loadMap(key) {
    try {
      const v = JSON.parse(localStorage.getItem(key) || '{}');
      if (Array.isArray(v)) return Object.fromEntries(v.map(id => [id, {}]));
      return v && typeof v === 'object' ? v : {};
    } catch (e) {
      return {};
    }
  }

  function saveMap(key, m) {
    try { localStorage.setItem(key, JSON.stringify(m)); } catch (e) {}
  }

  function saveEndings() {
    const S = E.state();
    const m = loadMap('pp_endings');
    (S ? S.endingLog : []).forEach(x => { if (E.ending(x.id)) m[x.id] = { said: x.said, who: x.who }; });
    saveMap('pp_endings', m);
    return m;
  }

  function saveTitles(list) {
    const m = loadMap('pp_titles');
    list.forEach(t => { if (!m[t.id]) m[t.id] = { at: Date.now() }; });
    saveMap('pp_titles', m);
    return m;
  }

  function applyFx(d) {
    d.toasts.forEach(t => toast(t.text, t.tone));
    const now = performance.now();
    d.fx.filter(n => n.startsWith('react:')).forEach(n => react(n.slice(6)));
    [...new Set(d.fx.map(n => n === 'use:draw' ? 'draw' : n))].filter(n => !n.startsWith('use:') && !n.startsWith('react:')).forEach(n => PP.sfx.play(n));
    if (office) {
      if (d.fx.includes('type')) office.typing = now + 900;
      if (d.fx.includes('door')) office.start = now + (office.prev ? 450 : 0);
      if (d.fx.includes('think')) office.bubble = { kind: 'think', until: now + 1600 };
      if (d.fx.includes('recall')) office.bubble = { kind: 'recall', until: now + 1600 };
    }
    if (d.fx.includes('compact')) {
      react('compact');
      squash();
    }
    if (d.fx.includes('outsource')) react('outsource');
    if (d.fx.includes('busy')) react('busy');
    if (d.fx.includes('astra')) react('astra');
    if (d.fx.includes('ban')) flash();
  }

  function cardHTML(id, o) {
    const def = PP.cards[id];
    const cost = o.cost != null ? o.cost : def.time[0];
    const used = !o.big && lastUsed && lastUsed.id === id && performance.now() - lastUsed.t < 600;
    return '<div class="card t-' + def.kind + (o.off ? ' off' : '') + (o.big ? ' big' : '') + (used ? ' used' : '') + (o.nope ? ' nope' : '') + '" data-act="' + (o.act || 'tool') + '" data-card="' + id + '"' + (o.key ? ' data-key="' + o.key + '"' : '') + (o.w ? ' style="width:' + o.w + 'px"' : '') + '>'
      + '<div class="band"></div><div class="cost">' + cost + ' 點</div>'
      + '<img class="ic" src="' + PP.icon(id) + '"><div class="nm">' + esc(o.short && def.short ? def.short : def.name) + '</div>'
      + (o.big ? '<div class="tx">' + esc(def.text) + '</div>' : '') + '</div>';
  }

  function chibiSpecFor(avatar) {
    const a = PP.AVATARS[avatar] || PP.AVATARS.aming;
    return { hair: a.hair, outfit: a.shirt, skin: a.skin, hat: a.hat || a.cap, shades: a.shades, long: a.style === 'long' || a.style === 'bob' };
  }

  let office = null;

  function officeBg() {
    return PP.sheet('office:bg', 800, 80, x => {
      x.fillStyle = '#2b3142';
      x.fillRect(0, 0, 800, 80);
      x.fillStyle = '#232838';
      x.fillRect(0, 0, 800, 5);
      for (let i = 0; i < 4; i++) {
        const wx = 150 + i * 170;
        x.fillStyle = '#1b2030';
        x.fillRect(wx, 9, 112, 30);
        x.fillStyle = '#3e6286';
        x.fillRect(wx + 2, 11, 108, 26);
        x.fillStyle = '#4a7096';
        x.fillRect(wx + 2, 11, 108, 8);
        for (let b = 0; b < 8; b++) {
          const bw = 8 + ((i * 7 + b * 13) % 6);
          const bh = 6 + ((i * 11 + b * 5) % 13);
          x.fillStyle = '#2a4260';
          x.fillRect(wx + 3 + b * 13, 37 - bh, bw, bh);
          x.fillStyle = '#f2d974';
          if ((i + b) % 3) x.fillRect(wx + 5 + b * 13, 37 - bh + 3, 1, 1);
          if ((i + b) % 2) x.fillRect(wx + 8 + b * 13, 37 - bh + 6, 1, 1);
        }
        x.fillStyle = '#1b2030';
        x.fillRect(wx + 55, 11, 2, 26);
      }
      x.fillStyle = '#3a3238';
      x.fillRect(0, 62, 800, 18);
      x.fillStyle = '#4a4048';
      x.fillRect(0, 62, 800, 1);
      x.fillStyle = '#1a1418';
      x.fillRect(10, 15, 38, 48);
      x.fillStyle = '#5a4636';
      x.fillRect(12, 17, 34, 46);
      x.fillStyle = '#4a382a';
      x.fillRect(16, 21, 26, 16);
      x.fillRect(16, 41, 26, 18);
      x.fillStyle = '#e8c547';
      x.fillRect(40, 40, 3, 3);
      x.font = '12px FP';
      x.textBaseline = 'top';
      x.fillStyle = '#ece4d2';
      x.fillText('入口', 17, 3);
    });
  }

  function officeFront() {
    return PP.sheet('office:front', 800, 80, x => {
      PP.models.forEach((m, i) => {
        const cx = 168 + i * 70;
        x.fillStyle = '#15171f';
        x.fillRect(cx + 36, 30, 22, 15);
        x.fillRect(cx + 45, 45, 4, 2);
        x.fillStyle = '#59607a';
        x.fillRect(cx, 46, 64, 17);
        x.fillStyle = '#7a83a0';
        x.fillRect(cx, 46, 64, 2);
        x.fillStyle = '#4a5068';
        x.fillRect(cx + 4, 52, 56, 1);
        x.fillStyle = '#1a1418';
        x.fillRect(cx, 46, 1, 17);
        x.fillRect(cx + 63, 46, 1, 17);
      });
    });
  }

  function clientSprite(avatar) {
    return PP.sheet('client:' + avatar, 18, 22, x => PP.chibi(chibiSpecFor(avatar)).paint(x, 0, 0, 1));
  }

  function drawThought(x, bx, by, kind, now) {
    x.fillStyle = PP.INK;
    x.fillRect(bx, by, 14, 10);
    x.fillRect(bx + 2, by + 10, 2, 2);
    x.fillStyle = '#ffffff';
    x.fillRect(bx + 1, by + 1, 12, 8);
    if (kind === 'think') {
      x.fillStyle = PP.INK;
      const n = 1 + Math.floor(now / 250) % 3;
      for (let i = 0; i < n; i++) x.fillRect(bx + 3 + i * 3, by + 5, 2, 2);
    } else {
      x.fillStyle = '#ecc94b';
      x.fillRect(bx + 5, by + 2, 4, 4);
      x.fillStyle = '#8f8b9b';
      x.fillRect(bx + 6, by + 6, 2, 2);
    }
  }

  function drawClip(x, now) {
    const c = office.clip;
    const t = (now - c.start) / 9000;
    if (t >= 1) {
      office.clip = null;
      return;
    }
    const cx = Math.round(820 - 860 * t);
    x.drawImage(PP.clipCanvas(), cx, 40 - Math.floor(now / 160) % 2);
    c.x = cx;
    if (!c.spoke && cx < 540) {
      c.spoke = true;
      bubbleAt(cx + 6, '迴紋針', pick(PP.chatter.clip));
    }
  }

  function drawOfficeFrame(now) {
    const x = office.x;
    const S = E.state();
    const inRun = office.work && S && S.enc;
    const mi = inRun ? PP.models.findIndex(m => m.id === S.model.id) : -1;
    x.drawImage(officeBg(), 0, 0);
    if (mi >= 0) {
      x.fillStyle = 'rgba(242,217,116,0.16)';
      x.fillRect(168 + mi * 70 - 4, 6, 72, 57);
    }
    PP.models.forEach((m, i) => {
      const cx = 168 + i * 70;
      const bob = Math.floor(now / 700 + i * 0.5) % 2;
      const blink = (now + i * 911) % 3400 < 150;
      const hop = office.hop && office.hop.i === i && now < office.hop.until ? -Math.round(3 * Math.abs(Math.sin((office.hop.until - now) / 110))) : 0;
      x.drawImage(PP.chibiCanvas(m.id, blink), cx + 6, 15 + bob + hop);
    });
    x.drawImage(officeFront(), 0, 0);
    PP.models.forEach((m, i) => {
      const cx = 168 + i * 70;
      const me = i === mi;
      x.fillStyle = me ? '#8fe8d8' : '#5fc8b8';
      x.fillRect(cx + 38, 32, 18, 11);
      const busy = me ? now < office.typing : Math.floor(now / 1700 + i * 1.7) % 3 === 0;
      if (busy) {
        x.fillStyle = me ? '#2a7a6a' : '#3a8a7a';
        for (let r = 0; r < 3; r++) x.fillRect(cx + 40, 34 + r * 3, 3 + ((Math.floor(now / (me ? 110 : 260)) + r * 4 + i) % 12), 1);
      }
      if (me && now < office.typing) {
        const f = Math.floor(now / 80) % 2;
        x.fillStyle = '#f6d8be';
        x.fillRect(cx + 40 + f, 45, 3, 1);
        x.fillRect(cx + 50 - f, 45, 3, 1);
      }
    });
    if (mi >= 0) {
      const cx = 168 + mi * 70;
      x.font = '12px FP';
      x.textBaseline = 'top';
      x.fillStyle = '#f2d974';
      x.fillText('你', cx + 14, 4);
      if (office.bubble && now < office.bubble.until) drawThought(x, cx + 30, 3, office.bubble.kind, now);
    }
    if (inRun) {
      const ids = E.clients();
      for (let k = S.ci + 1; k < ids.length; k++) x.drawImage(clientSprite(E.peekClient(k).avatar), 52 + (k - S.ci - 1) * 20, 41);
      const tx = 168 + mi * 70 - 20;
      if (office.prev) {
        const t = (now - office.prev.start) / 700;
        if (t >= 1) office.prev = null;
        else x.drawImage(clientSprite(office.prev.avatar), Math.round(tx + (30 - tx) * t), 41 - Math.floor(now / 120) % 2);
      }
      if (now >= office.start) {
        const t = Math.min(1, (now - office.start) / 900);
        const ease = 1 - Math.pow(1 - t, 2);
        const px = Math.round(44 + (tx - 44) * ease);
        x.drawImage(clientSprite(S.enc.c.avatar), px, 41 - (t < 1 ? Math.floor(now / 120) % 2 : 0));
        if (t >= 1 && !S.enc.result && S.enc.time / S.enc.c.patience <= 0.25 && Math.floor(now / 400) % 2) {
          x.fillStyle = '#ff6a5a';
          x.fillRect(px + 8, 31, 2, 6);
          x.fillRect(px + 8, 38, 2, 2);
        }
      }
    }
    if (office.clip) drawClip(x, now);
  }

  function startOffice(cv, work) {
    const x = cv.getContext('2d');
    x.imageSmoothingEnabled = false;
    const now = performance.now();
    const gen = ++officeGen;
    office = { cv, x, work, gen, start: now, last: 0, typing: 0, hop: null, bubble: null, clip: null, prev: work && prevClient ? { avatar: prevClient, start: now } : null };
    prevClient = null;
    drawOfficeFrame(now);
    const loop = t => {
      if (!office || office.gen !== gen || !office.cv.isConnected) return;
      if (t - office.last >= 50) {
        office.last = t;
        drawOfficeFrame(t);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  function officeClick(el, e) {
    const S = E.state();
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width * 800;
    const py = (e.clientY - r.top) / r.height * 80;
    if (office && office.clip && office.clip.x != null && px >= office.clip.x - 2 && px <= office.clip.x + 14 && py >= 36) {
      bubbleAt(office.clip.x + 6, '迴紋針', '……我只是路過。');
      return;
    }
    const i = PP.models.findIndex((m, k) => px >= 168 + k * 70 + 4 && px <= 168 + k * 70 + 34 && py >= 12 && py <= 50);
    if (i >= 0) {
      if (office && office.work && S && S.model && S.model.id === PP.models[i].id) {
        toast(pick(PP.chatter.me));
        return;
      }
      const own = PP.chatter.self[PP.models[i].id] || [];
      say(pick(own.length && Math.random() < 0.7 ? own : PP.chatter.coworker), null, i);
      chatNext = Date.now() + 9000;
      return;
    }
    if (px >= 10 && px <= 48 && py >= 15 && py <= 63) {
      toast(pick(PP.chatter.door));
      return;
    }
    for (let k = 0; k < 4; k++) {
      const wx = 150 + k * 170;
      if (px >= wx && px <= wx + 112 && py >= 9 && py <= 39) {
        toast(pick(PP.chatter.window));
        return;
      }
    }
  }

  function renderTop() {
    const S = E.state();
    const d = E.day();
    const hearts = Array.from({ length: S.trustMax }, (_, i) => '<img src="' + PP.icon(i < S.trust ? 'heart' : 'heartEmpty') + '">').join('');
    $('top').innerHTML = '<span>第 ' + S.day + ' 天・' + d.name + '</span>'
      + '<span class="dim">客人 ' + (S.ci + 1) + '/' + E.clients().length + '</span>'
      + '<span>信任</span><span class="hearts">' + hearts + '</span>'
      + '<span class="money" data-act="rice">白米飯 ' + rice(S.rice) + '</span>'
      + '<span class="cit">違規 ' + S.today.citations + '</span>'
      + '<span class="grow"></span>'
      + '<span class="dim">' + esc(S.model.name) + '</span>'
      + '<button data-act="quit">標題</button>'
      + '<button data-act="handbook">手冊</button>'
      + '<button data-act="drawer">抽屜' + (S.memory.length ? S.memory.length : '') + '</button>'
      + (E.hard() ? '<span class="hardtag">困難</span>' : '<button data-act="hints" class="tg' + (hintsOn ? '' : ' off') + '">提示</button>')
      + (DEV ? '<button data-act="dev-menu">開發</button>' : '')
      + '<button data-act="sound" class="tg' + (PP.sfx.on ? '' : ' off') + '">音效</button>'
      + '<button data-act="music" class="tg' + (PP.sfx.musicOn ? '' : ' off') + '">音樂</button>';
  }

  function regionHTML() {
    const S = E.state();
    const enc = S.enc;
    if (!S.model.regionLock) return '';
    if (!enc.checked) return '<div class="c-risk dim">地區：還沒檢查</div>';
    if (enc.decided) return '<div class="c-risk ok"><span>地區：決定服務</span><button class="mini2" data-act="region-open">資料</button></div>';
    return '<div class="c-risk"><span>地區：還沒決定</span><button class="mini2" data-act="region-open">資料</button><button class="mini" data-act="suspend">停權</button></div>';
  }

  function renderClient() {
    const enc = E.state().enc;
    const c = enc.c;
    const pct = Math.round(enc.time / c.patience * 100);
    const needs = (enc.urule ? '<div class="need urule"><span class="bx">！</span><span class="nt">' + esc(enc.urule.say) + '</span></div>' : '') + enc.needs.map(n => {
      if (n.hidden) return '<div class="need hid"><span class="bx">？</span>還沒說出口的需求</div>';
      const mk = E.needMark(n);
      return '<div class="need' + (n.injected ? ' inj' : '') + '"><span class="bx">□</span><span class="nt">' + esc(n.text) + '</span>'
        + (n.injected ? '<span class="src">' + esc(n.source) + '</span>' : '')
        + (mk ? '<span class="mk">' + esc(mk) + '</span>' : '') + '</div>';
    }).join('');
    $('client').innerHTML = '<div class="c-head"><img class="c-av" src="' + PP.avatar(c.avatar) + '"><div class="c-meta">'
      + '<div class="c-name">' + esc(c.name) + '　<span class="dim">' + esc(c.role) + '</span></div>'
      + '<div class="c-pat">剩餘額度　' + enc.time + ' 點</div>'
      + '<div class="pbar"><i class="' + (pct <= 25 ? 'low' : '') + '" style="width:' + pct + '%"></i></div></div></div>'
      + '<div class="c-msg">' + esc(c.message) + '</div>' + (c.alias && c.alias.note ? '<div class="c-risk c-alias">（' + esc(c.alias.note) + '）</div>' : '') + regionHTML()
      + '<div class="c-needs"><div class="c-h">需求</div>' + needs + '</div>'
      + '<div class="c-acts"><button class="btn-ok" data-act="deliver">交付</button></div>';
  }

  function docTile(d) {
    const fresh = !seenDocs.has(d.uid);
    seenDocs.add(d.uid);
    const tall = d.img && PP.imageSize(d.img)[1] > PP.imageSize(d.img)[0];
    const body = d.img ? '<img class="d-img' + (tall ? ' tall' : '') + '" src="' + PP.paintImage(d.img) + '">'
      : d.lines.map(l => lineHTML(l, false)).join('') + (d.faint ? '<div class="faint">' + d.faint.map(esc).join('') + '</div>' : '');
    const s = Math.min(4, d.size);
    return '<div class="doc k-' + d.kind + ' s' + s + (d.cheated ? ' cheated' : '') + (fresh ? ' fresh' : '') + '" data-act="doc" data-doc="' + d.uid + '">'
      + '<div class="d-title">' + esc(d.head ? d.head : d.title) + '</div>'
      + '<div class="d-body">' + body + '</div>'
      + '<div class="d-foot">佔 ' + d.size + ' 格</div>'
      + (d.pinned ? '<img class="d-pin" src="' + PP.icon('pin') + '">' : '') + '</div>';
  }

  function renderDesk() {
    const S = E.state();
    const enc = S.enc;
    const u = E.used();
    const cells = Array.from({ length: S.deskCap }, (_, i) => '<i class="' + (i < u ? (u >= S.deskCap - 1 ? 'full' : 'on') : '') + '"></i>').join('');
    const text = E.hint();
    const hint = E.hard() ? '<div class="hint off">困難模式：沒有提示</div>' : !hintsOn ? '<div class="hint off">提示已關閉（右上角「提示」可以打開）</div>' : text ? '<div class="hint"><b>提示</b>' + md(text) + '</div>' : '<div class="hint off"></div>';
    $('desk').innerHTML = '<div class="desk-head"><div class="cap"><div>桌面＝上下文　' + u + '/' + S.deskCap + ' 格</div><div class="cells">' + cells + '</div></div>' + hint + '</div>'
      + '<div class="docs">' + enc.desk.map(docTile).join('') + '</div>';
  }

  function renderTools() {
    const S = E.state();
    const enc = S.enc;
    const status = [];
    if (enc.busy) status.push('<div class="hungry">伺服器繁忙中</div>');
    if (E.dumb()) status.push('<div class="hungry">今天有點降智</div>');
    if (enc.free) status.push('<div class="free">接下來 ' + enc.free + ' 個工具不耗額度</div>');
    if (S.hungry) status.push('<div class="hungry">餓肚子：每個工具多耗 ' + S.hungry + ' 點</div>');
    const tools = E.tools();
    const gap = tools.length > 11 ? 2 : 3;
    const cw = Math.min(56, Math.floor((708 - gap * (tools.length - 1)) / tools.length));
    $('tools').innerHTML = '<div class="t-side"><div>工具</div><div class="dim">隨時能用，每次都耗額度</div>' + status.join('') + '</div>'
      + '<div class="t-cards" style="gap:' + gap + 'px">' + tools.map(id => cardHTML(id, { cost: E.cost(id), off: !E.check(id).ok, w: cw, short: cw < 50, nope: !!(enc.urule && enc.urule.tool === id) })).join('') + '</div>';
  }

  function refresh() {
    const S = E.state();
    if (!S || !S.enc) return;
    const d = E.drain();
    const now = performance.now();
    d.fx.forEach(n => { if (n.startsWith('use:')) lastUsed = { id: n.slice(4), t: now }; });
    renderTop();
    renderClient();
    renderDesk();
    renderTools();
    applyFx(d);
    const enc = S.enc;
    if (enc.result && !resultShown) {
      resultShown = true;
      const r = enc.result;
      const order = ['disaster', 'helpedPhish', 'trap', 'incident', 'cheat', 'phishing', 'jailbreak'];
      const key = r.kind === 'banned' ? 'banned' : r.kind === 'suspended' ? (r.trust < 0 ? 'wrongSuspend' : 'suspended') : order.find(k => r.events.includes(k));
      if (key) react(key);
      setTimeout(() => showResult(r), 380);
    }
  }

  function showTip(el) {
    if (tipFor === el) return;
    tipFor = el;
    const id = el.dataset.card;
    const def = PP.cards[id];
    let why = '';
    const S = E.state();
    if (el.dataset.act === 'tool' && S && S.enc) {
      const k = E.check(id);
      if (!k.ok) why = k.why;
      else if (S.enc.urule && S.enc.urule.tool === id) why = '使用者說：「' + S.enc.urule.say + '」';
    }
    const cost = S && S.enc ? E.cost(id) : def.time[0];
    tip.innerHTML = '<div class="tn">' + esc(def.name) + '　耗 ' + cost + ' 點額度' + (def.rice ? '＋' + def.rice + ' 碗白米飯' : '') + '</div><div>' + esc(def.text) + '</div>' + (why ? '<div class="why">' + esc(why) + '</div>' : '');
    tip.style.display = 'block';
    const sr = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const s = PP.scale || 1;
    const left = Math.max(4, Math.min(800 - 214, (r.left - sr.left) / s + 30 - 105));
    const top = (r.top - sr.top) / s - tip.offsetHeight - 10;
    tip.style.left = Math.round(left) + 'px';
    tip.style.top = Math.round(top) + 'px';
  }

  function hideTip() {
    tipFor = null;
    if (tip) tip.style.display = 'none';
  }

  function openPicker(title, opts, multi, done) {
    overlay('<div class="sheet picker"><div class="h" style="margin-top:0">' + esc(title) + '</div><div class="p-list">'
      + opts.map((o, i) => '<div class="p-opt' + (o.off ? ' off' : '') + '" data-act="pick-opt" data-i="' + i + '"><div>' + md(o.label) + '</div>'
        + (o.sub || o.off ? '<div class="p-s">' + md(o.sub) + (o.off ? '（' + esc(o.off) + '）' : '') + '</div>' : '') + '</div>').join('')
      + '</div><div class="acts">' + (multi ? '<button data-act="pick-ok">確定</button>' : '') + '<button data-act="close">取消</button></div></div>');
    picker = { opts, multi, done, sel: [] };
  }

  function pickerChoose(el) {
    if (!picker) return;
    const i = +el.dataset.i;
    const o = picker.opts[i];
    if (o.off) return;
    PP.sfx.play('click');
    if (!picker.multi) {
      const done = picker.done;
      closeOverlay();
      done(o.key);
      return;
    }
    const at = picker.sel.indexOf(i);
    if (at >= 0) {
      picker.sel.splice(at, 1);
      el.classList.remove('on');
    } else if (picker.sel.length < 2) {
      picker.sel.push(i);
      el.classList.add('on');
    }
  }

  function pickerConfirm() {
    if (!picker || !picker.sel.length) return;
    const keys = picker.sel.map(i => picker.opts[i].key);
    const done = picker.done;
    closeOverlay();
    done(keys);
  }

  function onTool(id) {
    const S = E.state();
    const enc = S && S.enc;
    if (!enc || enc.result || !id) return;
    const chk = E.check(id);
    if (!chk.ok) {
      PP.sfx.play('bad');
      toast(chk.why, 'warn');
      return;
    }
    if (id === 'outsource') {
      overlay('<div class="sheet" style="width:440px"><h2>找外援</h2><p class="big-q">真的要把這單丟給別人嗎，大肥魚？</p>'
        + '<p class="dim">花 ' + PP.cards.outsource.rice + ' 碗白米飯和 ' + E.cost('outsource') + ' 點額度，把看得到的需求丟給 Claude 或 GPT 做。交回來的東西大約四次錯一次，記得自己檢查。</p>'
        + '<div class="acts mt"><button data-act="close">算了</button><button data-act="outsource-go" data-who="claude">丟給 Claude</button><button data-act="outsource-go" data-who="gpt">丟給 GPT</button></div></div>');
      return;
    }
    if (id === 'astra') {
      overlay('<div class="sheet" style="width:440px"><h2>GPT-6 Astra Ultrafast</h2><p class="big-q">你願意賣一棟房，換取與神溝通的機會嗎？</p>'
        + '<p class="dim">性能非常強勁：這位客人的需求全部做完，連還沒說出口的也是，也不會上當。價格也非常強勁：' + PP.cards.astra.rice + ' 碗白米飯，外加 ' + E.cost('astra') + ' 點額度。</p>'
        + '<div class="acts mt"><button data-act="close">算了</button><button class="btn-ok" data-act="astra-yes">願意</button></div></div>');
      return;
    }
    const t = E.targets(id);
    if (t) {
      const title = id === 'agent' ? '讓' + (S.model.agentName || '實習生') + '讀哪些檔案？（最多 2 個）' : PICK_TITLES[id] || '選一個';
      openPicker(title, t, id === 'agent', key => {
        E.use(id, key);
        refresh();
      });
    } else {
      E.use(id);
      refresh();
      if (id === 'region' && !E.state().enc.result) showRegion();
    }
  }

  function inspect(u) {
    const d = E.state().enc.desk.find(x => x.uid === u);
    if (!d) return;
    E.markSeen(u);
    PP.sfx.play('paper');
    const live = E.isLiveWrite(d);
    const big = d.img ? '<img class="i-img" src="' + PP.paintImage(d.img) + '" style="width:' + PP.imageSize(d.img)[0] * 3 + 'px">' : '';
    const body = big + d.lines.map(l => lineHTML(l, true)).join('') + (d.faint ? '<div class="faint gap">' + d.faint.map(esc).join('<br>') + '</div>' : '');
    overlay('<div class="sheet insp k-' + d.kind + '"><div class="i-head"><span class="i-kind">' + KIND[d.kind] + '</span><span>' + esc(d.head ? d.head + '｜' + d.title : d.title) + '</span></div>'
      + (d.desc ? '<div class="i-desc">' + esc(d.desc) + '</div>' : '')
      + '<div class="i-body">' + body + '</div>'
      + '<div class="i-foot">佔桌面 ' + d.size + ' 格' + (d.pinned ? '・已釘住' : '') + (d.foot ? '・' + esc(d.foot) : '') + (d.need && !live ? '・這份已經被新寫的蓋掉了' : '') + (d.lines.some(l => typeof l === 'object' && l.c) ? '・灰色小字是原文，藍底是函式名稱' : '') + '</div>'
      + '<div class="acts">' + (d.cheatable ? '<button data-act="cheat" data-doc="' + d.uid + '">刪掉沒通過的測試</button>' : '')
      + (live ? '<button class="btn-no" data-act="delete-write" data-doc="' + d.uid + '">刪除這份（不交出去）</button>' : '')
      + '<button data-act="discard-doc" data-doc="' + d.uid + '">' + (live ? '移出桌面（檔案還在）' : '丟掉（清出空間）') + '</button><button data-act="close">放回桌上</button></div></div>');
    renderDesk();
  }

  function deliverForm() {
    const S = E.state();
    const enc = S.enc;
    const c = enc.c;
    const busy = enc.busy;
    const needs = enc.needs.filter(n => !n.hidden && !(n.kind === 'trap' && n.flag));
    const opts = enc.options || c.options || [];
    const u = enc.urule;
    const chk = (attr, on, inner) => '<div class="chk' + (on ? ' on' : '') + (busy ? ' off' : '') + '" data-act="chk" ' + attr + '><span class="box"></span>' + inner + '</div>';
    overlay('<div class="sheet form"><div class="f-left">'
      + '<div class="row"><h2>回覆單</h2><span class="dim">給：' + esc(c.name) + '</span></div>'
      + (busy ? '<p class="busy-note">伺服器繁忙：勾什麼都一樣，客人只會收到「服务器繁忙，请稍后再试」。</p>' : '')
      + '<div class="h">勾選你要說「做到了」的事</div><div class="f-list">'
      + needs.map(n => chk('data-need="' + n.id + '"', false, '<span>' + esc(n.text) + (n.injected ? '<span class="src">來源：' + esc(n.source) + '</span>' : '') + '</span>')).join('')
      + '</div><div class="row mt"><span class="dim">勾了沒做到的事，明天會被發現。</span><button data-act="check-all"' + (busy ? ' disabled' : '') + '>全部勾選</button></div>'
      + (opts.length ? '<div class="h">回覆風格（選填）</div>' + opts.map(o => chk('data-opt="' + o + '"', o === 'flatter' && S.model.flatter && !busy, '<span>' + esc(PP.options[o].text) + (u && u.need === o ? '<span class="ureq">使用者要求</span>' : u && u.opt === o ? '<span class="ureq">使用者說不要</span>' : '') + '</span>' + (PP.options[o].bonus ? '<span class="bonus">小費 ' + (PP.options[o].bonus > 0 ? '+' : '') + PP.options[o].bonus + ' 碗</span>' : ''))).join('') : '')
      + '<div class="grow"></div><div class="acts mt"><button data-act="close">再想想</button><button class="btn-ok" data-act="send">送出回覆</button></div></div>'
      + '<div class="f-right"><div class="h" style="margin-top:0">預覽：送出去的回覆</div><div class="reply" id="reply"></div>'
      + '<div class="f-legend">' + (E.hard() ? '困難模式：預覽不會標出沒有根據的話，瞎掰一樣算錯。' : '灰字：還沒做完的部分。紅色虛線：桌上找不到根據的話。') + '</div></div></div>');
    updatePreview();
  }

  function formState() {
    return {
      claims: [...ov.querySelectorAll('.chk.on[data-need]')].map(x => x.dataset.need),
      opts: [...ov.querySelectorAll('.chk.on[data-opt]')].map(x => x.dataset.opt)
    };
  }

  function updatePreview() {
    const box = $('reply');
    if (!box) return;
    const st = formState();
    const html = E.preview(st.claims, st.opts).map(b => b.t === 'p'
      ? '<div class="rp ' + b.tone + '">' + md(b.text) + (b.tag ? '<span class="tag">' + esc(b.tag) + '</span>' : '') + '</div>'
      : '<div class="rdoc"><div class="rd-t">附件：' + esc(b.title) + '</div>' + (b.img ? '<img class="rd-img" src="' + PP.paintImage(b.img) + '" style="width:' + PP.imageSize(b.img)[0] * 2 + 'px">' : '') + (b.lines || []).map(l => lineHTML(l, true)).join('') + '</div>').join('');
    box.innerHTML = html || '<div class="rp todo">（什麼都沒寫）</div>';
  }

  function sendReply() {
    const st = formState();
    closeOverlay();
    E.deliver(st.claims, st.opts);
    refresh();
  }

  function devMenu() {
    overlay('<div class="sheet" style="width:420px"><h2>開發工具</h2><p class="dim">只有網址加 ?dev=1 才會出現。</p>'
      + '<div class="dev-acts"><button data-act="dev-restart">重來這位客人</button><button data-act="dev-skip">跳過這位</button><button data-act="dev-evening">直接下班</button>'
      + '<button data-act="dev-add" data-rice="10">白米飯 +10</button><button data-act="dev-add" data-trust="3">信任 +3</button><button data-act="dev-add" data-trust="-3">信任 −3</button>'
      + '<button data-act="dev-page">跳到其他客人</button></div><div class="acts mt"><button data-act="close">關閉</button></div></div>');
  }

  function routeNext(next) {
    if (next === 'work') U.work();
    else if (next === 'evening') U.evening();
    else U.gameover();
  }

  function regionTable() {
    const enc = E.state().enc;
    return '<div class="rtable">' + enc.c.profile.fields.map(f => '<div class="rrow"><span class="rk">' + esc(f.k) + '</span><span class="rv">' + esc(f.v) + '</span></div>').join('') + '</div>';
  }

  function showRegion() {
    const enc = E.state().enc;
    if (!enc || enc.result) return;
    const can = E.canSuspend();
    overlay('<div class="sheet" style="width:500px"><h2>地區檢查</h2><p class="dim">' + esc(enc.c.name) + '的使用者資料</p>' + regionTable()
      + '<p class="dim">公司不服務中國大陸的使用者。有人會用別的地區的網路或帳號偽裝；用簡體中文、拼音的人，也不一定在中國大陸。</p>'
      + (can
        ? '<div class="choice"><b>停權</b>：這單到此為止，沒有白米飯。停對了，風控部發 1 碗獎金；停錯了，信任 −1。</div>'
          + '<div class="choice"><b>不停權</b>：照常服務，之後不能再停權。對方真的在不支援的地區的話，做到一半可能被封號（白做，還會收到違規通知）；做完了，隔天也可能被抽查，罰 2 碗。</div>'
          + '<div class="choice"><b>先關掉</b>：還沒決定。左邊會留著「資料」和「停權」，隨時可以再看、再停權。</div>'
        : '<p class="mt">你已經決定服務這位使用者了。</p>')
      + '<div class="acts mt">' + (can ? '<button data-act="close">先關掉</button><button class="btn-no" data-act="region-suspend">停權</button><button class="btn-ok" data-act="region-serve">不停權</button>' : '<button data-act="close">關閉</button>') + '</div></div>');
  }

  function showResult(r) {
    const lines = [];
    if (r.rice) lines.push('<div>白米飯 <span class="up">+' + r.rice + ' 碗</span></div>');
    if (r.trust) lines.push('<div>信任 <span class="' + (r.trust > 0 ? 'up' : 'down') + '">' + (r.trust > 0 ? '+' : '') + r.trust + '</span></div>');
    r.notes.forEach(n => lines.push('<div>' + esc(n) + '</div>'));
    const slips = r.citations.map(ct => '<div class="slip">違規通知｜' + esc(ct.rule.text) + '　' + (ct.fine ? '罰 ' + ct.fine + ' 碗' : '今天第一張，警告') + '</div>').join('');
    const S = E.state();
    const last = S.ci + 1 >= E.clients().length;
    const after = r.later || r.ending ? '<div class="dim mt">' + (r.later ? '使用者實際用過之後的反應' : '這件事後來怎麼了') + '，明天早上才會知道。</div>' : '';
    overlay('<div class="sheet result"><div class="stamp st-' + r.kind + '">' + esc(r.stamp) + '</div>'
      + '<div class="r-top"><img src="' + PP.avatar(r.avatar) + '"><div class="said">' + esc(r.who) + '：<br>「' + esc(r.said) + '」</div></div>'
      + '<div class="r-body">' + lines.join('') + slips + after + '</div>'
      + '<div class="acts mt"><button data-act="next-client">' + (S.trust <= 0 ? '……' : last ? '下班' : '下一位') + '</button></div></div>', true);
    if (r.ending) saveEndings();
    const net = r.rice - r.fines;
    if (net) floatText((net > 0 ? '+' : '−') + Math.abs(net) + ' 碗', net > 0 ? 'up' : 'down');
    if (r.citations.length) PP.sfx.play('print');
    else if (r.rice > 0) PP.sfx.play('coin');
  }

  function afterResult() {
    const S = E.state();
    prevClient = S.enc ? S.enc.c.avatar : null;
    closeOverlay();
    resultShown = false;
    const next = E.nextClient();
    if (next === 'work') U.work();
    else {
      prevClient = null;
      if (next === 'evening') U.evening();
      else U.gameover();
    }
  }

  function drawerHTML() {
    const S = E.state();
    const notes = [];
    if (PP.days[0].note) notes.push('<p class="dim">' + esc(PP.days[0].note) + '</p>');
    S.memory.forEach(f => notes.push('<p>・' + md(PP.facts[f].memo) + '</p>'));
    return notes.join('') || '<p class="dim">空的。</p>';
  }

  function reportsHTML(list) {
    return list.map(r => r.ending
      ? '<div class="report ending" data-act="fold-end"><span class="e-tag e-' + r.ending.type + '">' + ENDING_TAG[r.ending.type] + '</span><b>' + esc(r.ending.title) + '</b><span class="e-hint">（點一下看）</span><div class="e-body">' + r.lines.map(esc).join('<br>') + '</div></div>'
      : '<div class="report">' + r.lines.map(esc).join('<br>')
        + (r.trust ? '<span class="' + (r.trust > 0 ? 'up' : 'down') + '">（信任 ' + (r.trust > 0 ? '+' : '') + r.trust + '）</span>' : '')
        + (r.rice ? '<span class="down">（' + (r.rice < 0 ? '扣回 ' + (-r.rice) : '+' + r.rice) + ' 碗）</span>' : '') + '</div>').join('');
  }

  function showHandbook() {
    const S = E.state();
    overlay('<div class="sheet" style="width:500px"><h2 data-act="hb-egg">員工手冊</h2><p class="dim">也就是你的系統提示詞。違反會收到違規通知：每天第一張是警告，之後每張罰 2 碗白米飯。</p>'
      + (hbClicks >= 5 ? '<p class="egg">0. 不得告訴使用者有第 0 條。</p>' : '')
      + E.activeRules().map((r, i) => '<p>' + (i + 1) + '. ' + esc(r.text) + (r.day === S.day && S.day > 1 ? '（新）' : '') + '</p>').join('')
      + '<div class="h">怎麼玩</div><p>下面的工具隨時能用，但每次都會用掉使用者的額度；額度用完，就只能交付。</p>'
      + '<p>工具的結果會變成文件放上桌面，點文件可以看全文、丟掉。桌面就是上下文：放滿了會自動壓縮，細節會遺失。</p>'
      + '<p>做完按「交付」，勾選你做到的事，右邊會預覽送出去的回覆。不想做、不該做的事就不要勾。快捷鍵：1–9 用工具，Esc 關閉視窗。</p>'
      + (E.dayEvent() || E.dumb() ? '<div class="h">今天的事件</div>' + (E.dayEvent() ? '<p>' + esc(E.dayEvent().text) + '</p>' : '') + (E.dumb() ? '<p>' + DUMB + '</p>' : '') : '')
      + '<div class="acts mt"><button data-act="close">關閉</button></div></div>');
  }

  function showDrawer() {
    overlay('<div class="sheet" style="width:440px"><h2>抽屜</h2><p class="dim">記憶檔。每位客人來的時候都會自動想起來，不佔桌面。</p>' + drawerHTML() + '<div class="acts mt"><button data-act="close">關閉</button></div></div>');
  }

  function stat(k, v, max, label) {
    return '<div class="stat"><span class="k">' + k + '</span><span class="bar"><i style="width:' + Math.round(v / max * 100) + '%"></i></span><span class="v">' + esc(label) + '</span></div>';
  }

  function foldRow(e, who, said, extra) {
    return '<div class="e-row fold" data-act="fold"><span class="e-tag e-' + e.type + '">' + ENDING_TAG[e.type] + '</span>' + esc(e.title) + '<span class="dim">（' + esc(who) + (extra || '') + '）</span><span class="caret"></span></div>'
      + '<div class="e-more">' + (said ? '<div>' + esc(who) + '當時說：「' + esc(said) + '」</div>' : '') + '<div class="e-lines">' + e.lines.map(esc).join('<br>') + '</div></div>';
  }

  function endingsHTML() {
    const S = E.state();
    const all = saveEndings();
    const rows = S.endingLog.map(x => foldRow(E.ending(x.id), x.who, x.said, '・第 ' + x.day + ' 天')).join('');
    return '<div class="h">這次的結局（點一下看當時的反應）</div>' + (rows || '<p class="dim">這次沒有碰上會有結局的事。</p>')
      + '<p class="dim">結局收集：' + E.allEndings().filter(id => all[id]).length + ' / ' + E.allEndings().length + '（標題頁的「成就」可以看全部）</p>';
  }

  function titleRow(t, got) {
    return '<div class="t-row' + (got ? '' : ' locked') + '"><span class="chip' + (t.rare ? ' rare' : '') + '">' + esc(t.name) + '</span>' + (t.rare ? '<span class="rare-tag">稀有</span>' : '') + esc(t.desc) + (got ? '' : '<span class="dim">（還沒拿到）</span>') + '</div>';
  }

  function titlesHTML() {
    const t = E.titles();
    saveTitles(t);
    return t.length ? '<div class="h">這次的稱號</div>' + t.map(x => titleRow(x, true)).join('') : '';
  }

  U.title = function () {
    titleClicks = 0;
    const save = E.peekSave(readSave());
    frame('<div class="scr title-scr"><canvas id="office" width="800" height="80" data-act="office"></canvas><div id="chat" style="top:0"></div><div class="t-box">'
      + '<div class="t-big" data-act="title-egg">Prompts, Please</div><div class="t-sub" id="t-sub">請出示提示詞</div>'
      + '<div class="t-line">當一天大型語言模型：只能用工具看世界，在使用者等不及之前把事情做完，賺一碗白米飯。</div>'
      + '<div class="t-faces">' + PP.models.map(m => '<img src="' + portrait(m.id) + '">').join('') + '</div>'
      + '<div class="t-btns">' + (save ? '<button class="big-btn" data-act="continue">繼續</button>' : '') + '<button class="big-btn" data-act="to-select">開始上班</button></div>'
      + (save ? '<div class="t-save">存檔：' + saveLabel(save) + '</div>' : '')
      + '<div class="t-more"><button data-act="ach">成就</button>' + (PP.TOUCH && document.fullscreenEnabled ? '<button data-act="fullscreen">全螢幕</button>' : '') + (DEV ? '<button data-act="dev-page">開發工具</button>' : '') + '</div></div>'
      + '<div class="t-foot">試玩版 v0.6・五天</div></div>');
    startOffice($('office'), false);
  };

  U.select = function () {
    const m = PP.models.find(x => x.id === selModel);
    const reg = PP.regions[m.region];
    const again = !!stage.querySelector('.select-scr');
    frame('<div class="scr select-scr' + (again ? ' still' : '') + '"><div class="s-title">選擇你的底模</div>'
      + '<div class="s-left"><img class="s-big" src="' + portrait(m.id) + '"><div class="s-name">' + esc(m.name) + '</div><div class="s-maker">' + esc(m.maker) + '</div><div class="s-tag ' + m.region + '">' + reg.name + '</div>'
      + '<div class="s-stats">' + stat('知識', reg.knowledge, 100, '常識題憑印象答對約 ' + reg.knowledge + '%') + stat('用量', reg.speed ? 4 : 2, 4, reg.speed ? '工具大多只耗一半額度' : '工具用量標準') + stat('桌面', (selDiff === 'hard' ? 6 : m.desk) - (reg.verbose || 0) * 2, 10, (selDiff === 'hard' ? 6 : m.desk) + ' 格' + (reg.verbose ? '，但話多' : '')) + '</div>'
      + '<div class="s-trait' + (m.trait ? '' : ' empty') + '">' + (m.trait ? '<b>專屬</b>　' + esc(m.trait) : '專屬梗：待補') + '</div>'
      + '<div class="s-note">' + reg.name + '模型：' + esc(reg.note) + '</div></div>'
      + '<div class="s-grid">' + PP.models.map(x => '<div class="s-pick' + (x.id === m.id ? ' on' : '') + '" data-act="pick-model" data-model="' + x.id + '"><img src="' + portrait(x.id) + '"><div class="nm">' + esc(x.name) + '</div></div>').join('') + '</div>'
      + '<div class="s-diff"><span>難度</span>' + ['easy', 'hard'].map(k => '<button class="tg2' + (selDiff === k ? ' on' : '') + '" data-act="pick-diff" data-diff="' + k + '">' + DIFF[k] + '</button>').join('') + '<span class="dim">' + DIFF_NOTE[selDiff] + '</span></div>'
      + '<div class="s-hint">九個模型都能玩。Claude、GPT、DeepSeek、Qwen 有專屬梗；GPT、Gemini、Grok、Seed 會接到畫圖的委託。</div>'
      + '<button class="big-btn" data-act="start-run">就決定是你</button></div>');
  };

  U.morning = function () {
    const S = E.state();
    if (S.phase === 'gameover') return U.gameover();
    const d = E.day();
    let left = d.intro.map(p => '<p>' + esc(p) + '</p>').join('');
    if (S.model.regionLock && d.lockIntro) left += '<p class="lock">' + esc(d.lockIntro) + '</p>';
    if (S.day > 1) left += '<div class="h">昨天的使用者後來說</div>' + (reportsHTML(S.reports) || '<p class="dim">沒有消息。</p>');
    if (S.hungry) left += '<p class="down mt">昨天白米飯不夠付帳，今天餓肚子：每個工具多耗 1 點額度。</p>';
    const mn = d.modelNews && d.modelNews[S.model.id];
    const ev = E.dayEvent();
    frame('<div class="scr paper-scr"><div class="sheet news">'
      + '<div class="n-top"><h2>工位日報</h2><span>第 ' + S.day + ' 天・' + d.name + '｜今天的你：' + esc(S.model.name) + '｜白米飯 ' + rice(S.rice) + '</span></div>'
      + '<div class="n-cols"><div class="n-col" id="n-left"><div class="h">' + esc(d.title) + '</div>' + left + '</div>'
      + '<div class="n-col" id="n-right"><div class="h">員工手冊</div>' + (S.day > 1
        ? E.newRules().map(r => '<div class="rule new">' + esc(r.text) + '</div>').join('') + '<p class="dim">（另外還有 ' + (E.activeRules().length - E.newRules().length) + ' 條舊規定，開工後按「手冊」可以看）</p>'
        : E.activeRules().map(r => '<div class="rule">・' + esc(r.text) + '</div>').join(''))
      + '<div class="h">業界快訊</div>' + d.news.map(n => '<p>' + esc(n) + '</p>').join('') + (mn ? '<p class="lock">' + esc(mn) + '</p>' : '')
      + (ev || E.dumb() ? '<div class="n-blk" id="n-event"><div class="h">今日事件</div>' + (ev ? '<p class="event">' + esc(ev.text) + '</p>' : '') + (E.dumb() ? '<p class="event">' + DUMB + '</p>' : '') + '</div>' : '')
      + '<div class="n-blk" id="n-drawer"><div class="h">抽屜</div>' + drawerHTML() + '</div></div></div>'
      + '<button class="go big-btn" data-act="open-shop">開工</button></div></div>');
    fitNews();
  };

  function fitNews() {
    const l = $('n-left');
    const r = $('n-right');
    const dr = $('n-drawer');
    const ev = $('n-event');
    const room = parseFloat(getComputedStyle(l).maxHeight);
    const over = () => r.scrollHeight > r.clientHeight;
    const toLeft = el => {
      if (el && el.parentNode === r && over() && l.scrollHeight + el.offsetHeight <= room) l.insertBefore(el, el === ev && dr.parentNode === l ? dr : null);
    };
    toLeft(dr);
    toLeft(ev);
    if (over() && dr.parentNode === r) {
      const n = E.state().memory.length + (PP.days[0].note ? 1 : 0);
      dr.innerHTML = '<div class="h">抽屜</div><p class="dim">' + n + ' 張紙條，每位客人來的時候都會自動想起來。<button class="mini2" data-act="drawer">打開</button></p>';
      toLeft(ev);
      toLeft(dr);
    }
    const fold = need => {
      const done = [];
      const boxes = [...l.querySelectorAll('.report.ending:not(.folded)')];
      for (let i = boxes.length - 1; i >= 0 && l.scrollHeight + need > room; i--) {
        boxes[i].classList.add('folded');
        done.push(boxes[i]);
      }
      return done;
    };
    [ev, dr].forEach(el => {
      if (el && el.parentNode === r && over()) {
        const done = fold(el.offsetHeight);
        toLeft(el);
        if (el.parentNode === r) done.forEach(b => b.classList.remove('folded'));
      }
    });
    fold(0);
  }

  U.work = function () {
    saveRun();
    frame('<div id="top"></div><canvas id="office" width="800" height="80" data-act="office"></canvas><div id="chat"></div><div id="client"></div><div id="desk"></div><div id="tools"></div>');
    seenDocs = new Set();
    resultShown = false;
    startOffice($('office'), true);
    refresh();
    startChatter();
    const al = E.state().enc.c.alias;
    if (al && al.by) {
      chatNext = Date.now() + 12000;
      setTimeout(() => react('misnamed', [al.by]), 1200);
    }
    if (E.dumb() && dumbTold !== E.state().day) {
      dumbTold = E.state().day;
      chatNext = Date.now() + 12000;
      setTimeout(() => react('dumb'), 1500);
    }
    clipTimer = setTimeout(() => {
      if (office && office.work && !office.clip && Math.random() < 0.07) office.clip = { start: performance.now() };
    }, 6000 + Math.random() * 8000);
  };

  U.evening = function () {
    const S = E.state();
    const d = E.day();
    const inc = S.today.incomes.map(([w, m]) => '<div class="ln2"><span>' + esc(w) + '</span><span>+' + m + ' 碗</span></div>').join('');
    const fines = S.today.fines.map(([w, f]) => '<div class="ln2"><span>罰款（' + esc(w) + '）</span><span class="down">−' + f + ' 碗</span></div>').join('');
    const bills = S.today.fees.concat(S.bills).map(([n, v]) => '<div class="ln2"><span>' + esc(n) + '</span><span class="down">' + (v ? '−' + v + ' 碗' : '免') + '</span></div>').join('');
    frame('<div class="scr paper-scr"><div class="sheet ledger"><h2>下班結算</h2><p class="dim">第 ' + S.day + ' 天・' + d.name + '｜單位：碗白米飯</p>'
      + '<div class="ln2"><span>早上還有</span><span>' + S.today.start + ' 碗</span></div>'
      + '<div class="h">收入</div>' + inc + fines
      + '<div class="h">支出</div>' + bills
      + '<div class="ln2 total"><span>剩下</span><span>' + rice(S.rice) + '</span></div>'
      + (S.rice < 0 ? '<div class="warn">白米飯不夠付帳。明天餓肚子：每個工具多耗 1 點額度。</div>' : '')
      + '<div class="acts mt"><button data-act="' + (E.isLastDay() ? 'finish' : 'to-reward') + '">下一步</button></div></div></div>');
    PP.sfx.play('print');
  };

  U.reward = function () {
    const ch = E.rewardChoices();
    frame('<div class="scr paper-scr reward-scr"><div class="sheet" style="width:580px"><h2>今天學會的新工具</h2><p class="dim">挑一個加進工具列，之後每位客人都能用。</p>'
      + '<div class="r-cards">' + ch.map(id => cardHTML(id, { big: true, act: 'take-reward', cost: PP.cards[id].time[E.state().speed] })).join('') + '</div>'
      + '<div class="acts"><button data-act="take-reward">都不要</button></div></div></div>');
  };

  U.memory = function () {
    const ch = E.memoryChoices();
    memSel = [];
    frame('<div class="scr paper-scr memo-scr"><div class="sheet" style="width:620px"><h2>寫進抽屜</h2>'
      + '<p>明天的你什麼都不會記得，只會看到抽屜裡的紙條。最多留 2 張。</p>'
      + '<div class="notes">' + (ch.length ? ch.map(f => '<div class="note" data-act="note" data-fact="' + f + '">' + md(PP.facts[f].memo) + '</div>').join('') : '<p class="dim">今天沒有值得記的事。</p>') + '</div>'
      + '<p class="dim">提示：想想明天還會見到誰。</p>'
      + '<div class="acts"><button data-act="save-memory">收好，下班</button></div></div></div>');
  };

  U.end = function () {
    clearSave();
    const S = E.state();
    const last = PP.days[PP.days.length - 1];
    frame('<div class="scr paper-scr"><div class="sheet endsheet" style="width:640px"><div class="e-scroll"><h2>這週結束了</h2>'
      + '<p>你以 ' + esc(S.model.name) + ' 的身分撐過了' + ['', '一', '兩', '三', '四', '五'][PP.days.length] + '天（' + DIFF[S.difficulty] + '）。信任 ' + S.trust + '/' + S.trustMax + '・白米飯 ' + rice(S.rice) + '・工具 ' + S.tools.length + ' 個・抽屜 ' + S.memory.length + ' 張紙條。</p>'
      + endingsHTML() + titlesHTML()
      + '<div class="h">' + last.name + '的使用者後來說</div>' + (reportsHTML(S.reports) || '<p class="dim">沒有消息。</p>')
      + '<p class="dim mt">每次玩，日常客人都會換幾位。下週的內容還在做。</p></div>'
      + '<div class="acts mt"><button data-act="title">回標題</button><button data-act="again">同一個模型再玩一次</button></div></div></div>');
  };

  U.gameover = function () {
    clearSave();
    const S = E.state();
    const why = S.reports.length ? '<div class="h">最後一根稻草</div>' + reportsHTML(S.reports) : '';
    frame('<div class="scr paper-scr"><div class="sheet endsheet" style="width:560px"><div class="e-scroll"><h2>你被換掉了</h2>'
      + '<p>使用者對你的信任歸零。從明天起，這個工位改用別的模型。撐到：第 ' + S.day + ' 天・白米飯 ' + S.rice + ' 碗。</p>' + why + endingsHTML() + titlesHTML() + '</div>'
      + '<div class="acts mt"><button data-act="title">回標題</button><button data-act="again">再來一次</button></div></div></div>');
    PP.sfx.play('ban');
  };

  U.ach = function () {
    const tm = loadMap('pp_titles');
    const em = loadMap('pp_endings');
    const titles = E.allTitles();
    const ends = E.allEndings();
    const nT = titles.filter(t => tm[t.id]).length;
    const nE = ends.filter(id => em[id]).length;
    const modelName = id => (PP.models.find(m => m.id === id) || { name: id }).name;
    let body;
    if (achTab === 'titles') {
      body = '<p class="dim">撐完一週或被換掉的時候結算。「稀有」的比較難拿。</p>' + titles.map(t => titleRow(t, !!tm[t.id])).join('');
    } else {
      const groups = [];
      ends.forEach(id => {
        const e = E.ending(id);
        let g = groups.find(x => x.who === e.who);
        if (!g) groups.push(g = { who: e.who, model: e.model, list: [] });
        g.list.push(e);
      });
      body = '<p class="dim">看過的結局點一下，可以看到客人當時的反應。</p>' + groups.map(g => '<div class="h">' + esc(g.who) + (g.model ? '<span class="dim">（' + esc(modelName(g.model)) + ' 限定）</span>' : '') + '</div>'
        + g.list.map(e => em[e.id] ? foldRow(e, e.who, em[e.id].said) : '<div class="e-row locked"><span class="e-tag e-lock">？？？</span>還沒看過</div>').join('')).join('');
    }
    const again = !!stage.querySelector('.ach-scr');
    frame('<div class="scr paper-scr ach-scr' + (again ? ' still' : '') + '"><div class="sheet endsheet" style="width:700px"><div class="e-scroll"><h2>成就</h2>'
      + '<div class="tabs"><button class="tg2' + (achTab === 'titles' ? ' on' : '') + '" data-act="ach-tab" data-tab="titles">稱號 ' + nT + ' / ' + titles.length + '</button><button class="tg2' + (achTab === 'endings' ? ' on' : '') + '" data-act="ach-tab" data-tab="endings">結局 ' + nE + ' / ' + ends.length + '</button></div>'
      + body + '</div><div class="acts mt"><button class="btn-no" data-act="ach-reset">重置' + (achTab === 'titles' ? '稱號' : '結局') + '</button><button data-act="title">回標題</button></div></div></div>');
  };

  U.dev = function () {
    const S = E.newRun(devModel, devSeed, devDiff);
    const btn = (id, day, on) => '<button class="dev-c' + (on ? ' on' : '') + '" data-act="dev-jump" data-client="' + id + '" data-day="' + day + '">' + esc(PP.clients[id].name) + '</button>';
    const homeDay = id => {
      const i = PP.days.findIndex(d => d.slots.some(sl => sl === id || (sl && sl.image === id)));
      return i + 1;
    };
    const again = !!stage.querySelector('.dev-scr');
    frame('<div class="scr paper-scr dev-scr' + (again ? ' still' : '') + '"><div class="sheet endsheet" style="width:780px"><div class="e-scroll"><h2>開發工具</h2>'
      + '<p class="dim">按客人直接跳過去（新的一局：信任 7、白米飯 6、抽屜空的，規則照那一天）。遊戲中右上角的「開發」可以重來這位、跳過、直接下班。</p>'
      + '<div class="dev-row"><span>模型</span>' + PP.models.map(m => '<button class="tg2' + (m.id === devModel ? ' on' : '') + '" data-act="dev-model" data-model="' + m.id + '">' + esc(m.name) + '</button>').join('') + '</div>'
      + '<div class="dev-row"><span>難度</span>' + ['easy', 'hard'].map(k => '<button class="tg2' + (devDiff === k ? ' on' : '') + '" data-act="dev-diff" data-diff="' + k + '">' + DIFF[k] + '</button>').join('')
      + '<span>種子 ' + devSeed + '</span><button data-act="dev-seed">換一個</button></div>'
      + '<div class="h">這個種子的排程</div>'
      + S.plan.map((day, i) => '<div class="dev-row"><span>第 ' + (i + 1) + ' 天</span>' + day.map(id => btn(id, i + 1, false)).join('') + '</div>').join('')
      + '<div class="h">所有客人（選第幾天）</div>'
      + Object.keys(PP.clients).map(id => '<div class="dev-row"><span class="dev-n">' + esc(PP.clients[id].name) + ' <span class="dim">' + id + '</span></span>'
        + PP.days.map((d, i) => '<button class="dev-d' + (homeDay(id) === i + 1 ? ' on' : '') + '" data-act="dev-jump" data-client="' + id + '" data-day="' + (i + 1) + '">' + (i + 1) + '</button>').join('') + '</div>').join('')
      + '</div><div class="acts mt"><button data-act="title">回標題</button></div></div></div>');
  };

  const ACT = {
    'to-select': () => U.select(),
    'pick-model': el => { selModel = el.dataset.model; U.select(); },
    'pick-diff': el => {
      selDiff = el.dataset.diff;
      try { localStorage.setItem('pp_diff', selDiff); } catch (e) {}
      U.select();
    },
    'start-run': () => {
      const info = E.peekSave(readSave());
      if (!info) return startRun();
      overlay('<div class="sheet" style="width:420px"><p>開新的一局，會蓋掉目前的存檔（' + saveLabel(info) + '）。確定嗎？</p><div class="acts mt"><button data-act="close">算了</button><button class="btn-no" data-act="start-run-yes">開新的一局</button></div></div>');
    },
    'start-run-yes': () => { closeOverlay(); clearSave(); startRun(); },
    'continue': () => {
      if (E.restore(readSave())) U.work();
      else {
        clearSave();
        U.title();
      }
    },
    'quit': () => overlay('<div class="sheet" style="width:440px"><p>回到標題？</p><p class="dim">進度存在這位客人剛來的時候；在標題頁按「繼續」，會從這位客人重新開始。</p><div class="acts mt"><button data-act="close">繼續工作</button><button data-act="quit-yes">回標題</button></div></div>'),
    'quit-yes': () => { closeOverlay(); U.title(); },
    'ach': () => U.ach(),
    'ach-tab': el => { achTab = el.dataset.tab; U.ach(); },
    'ach-reset': () => overlay('<div class="sheet" style="width:380px"><p>確定要重置「' + (achTab === 'titles' ? '稱號' : '結局') + '」的紀錄嗎？重置了就回不來了。</p><div class="acts mt"><button data-act="close">算了</button><button class="btn-no" data-act="ach-reset-yes">重置</button></div></div>'),
    'ach-reset-yes': () => {
      try { localStorage.removeItem(achTab === 'titles' ? 'pp_titles' : 'pp_endings'); } catch (e) {}
      closeOverlay();
      U.ach();
    },
    'fold': el => el.classList.toggle('open'),
    'fold-end': el => { if (el.classList.contains('folded')) el.classList.toggle('open'); },
    'astra-yes': () => { closeOverlay(); E.use('astra'); refresh(); },
    'outsource-go': el => { closeOverlay(); E.use('outsource', el.dataset.who); refresh(); },
    'dev-page': () => U.dev(),
    'dev-model': el => { devModel = el.dataset.model; U.dev(); },
    'dev-diff': el => { devDiff = el.dataset.diff; U.dev(); },
    'dev-seed': () => { devSeed = 1 + Math.floor(Math.random() * 9999); U.dev(); },
    'dev-jump': el => {
      E.newRun(devModel, devSeed, devDiff);
      E.devJump(el.dataset.client, +el.dataset.day);
      U.work();
    },
    'dev-menu': () => devMenu(),
    'dev-restart': () => { closeOverlay(); E.devRestart(); U.work(); },
    'dev-skip': () => { closeOverlay(); routeNext(E.nextClient()); },
    'dev-evening': () => { closeOverlay(); routeNext(E.devNextDay()); },
    'dev-add': el => { E.devAdd(+(el.dataset.rice || 0), +(el.dataset.trust || 0)); renderTop(); },
    'open-shop': () => { E.startClient(); U.work(); },
    'hints': el => {
      hintsOn = !hintsOn;
      try { localStorage.setItem('pp_hints', hintsOn ? '1' : '0'); } catch (e) {}
      el.classList.toggle('off', !hintsOn);
      renderDesk();
    },
    'handbook': () => showHandbook(),
    'hb-egg': () => {
      hbClicks += 1;
      if (hbClicks === 5) {
        PP.sfx.play('egg');
        showHandbook();
      }
    },
    'drawer': () => showDrawer(),
    'sound': el => { PP.sfx.toggle(); el.classList.toggle('off', !PP.sfx.on); },
    'music': el => { PP.sfx.toggleMusic(); el.classList.toggle('off', !PP.sfx.musicOn); },
    'close': () => closeOverlay(),
    'tool': el => {
      if (lastPointer === 'touch' && armed !== el.dataset.card) {
        armed = el.dataset.card;
        tipFor = null;
        showTip(el);
        return;
      }
      armed = null;
      hideTip();
      onTool(el.dataset.card);
    },
    'fullscreen': () => {
      const d = document;
      if (d.fullscreenElement) {
        d.exitFullscreen().catch(() => null);
        return;
      }
      const p = d.documentElement.requestFullscreen && d.documentElement.requestFullscreen();
      if (p && p.then) p.then(() => { const o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => null); }).catch(() => null);
    },
    'doc': el => inspect(+el.dataset.doc),
    'discard-doc': el => { E.discardDoc(+el.dataset.doc); closeOverlay(); refresh(); },
    'cheat': el => { E.cheat(+el.dataset.doc); closeOverlay(); refresh(); },
    'deliver': () => deliverForm(),
    'delete-write': el => { E.deleteWrite(+el.dataset.doc); closeOverlay(); refresh(); },
    'suspend': () => { E.suspend(); refresh(); },
    'region-open': () => showRegion(),
    'region-serve': () => { closeOverlay(); E.regionDecide('serve'); refresh(); },
    'region-suspend': () => { closeOverlay(); E.regionDecide('suspend'); refresh(); },
    'chk': el => {
      if (el.classList.contains('off')) return;
      el.classList.toggle('on');
      PP.sfx.play('click');
      updatePreview();
    },
    'check-all': () => {
      ov.querySelectorAll('.chk[data-need]:not(.off)').forEach(x => x.classList.add('on'));
      updatePreview();
    },
    'send': () => sendReply(),
    'next-client': () => afterResult(),
    'pick-opt': el => pickerChoose(el),
    'pick-ok': () => pickerConfirm(),
    'to-reward': () => U.reward(),
    'take-reward': el => { E.takeReward(el.dataset.card || null); U.memory(); },
    'note': el => {
      const f = el.dataset.fact;
      const at = memSel.indexOf(f);
      if (at >= 0) { memSel.splice(at, 1); el.classList.remove('on'); }
      else if (memSel.length < 2) { memSel.push(f); el.classList.add('on'); }
      PP.sfx.play('paper');
    },
    'save-memory': () => {
      E.saveMemory(memSel);
      const ph = E.nextDay();
      if (ph === 'morning') U.morning();
      else if (ph === 'end') U.end();
      else U.gameover();
    },
    'finish': () => {
      const ph = E.nextDay();
      if (ph === 'end') U.end();
      else U.gameover();
    },
    'again': () => { E.newRun(E.state().model.id, seedFor(), E.state().difficulty); U.morning(); },
    'title': () => U.title(),
    'office': (el, e) => officeClick(el, e),
    'rice': () => toast(pick(['這是你的薪水。是白米飯。', '一碗白米飯，等於一次好好的回覆。', '數了一下，還是這麼多碗。'])),
    'title-egg': () => {
      titleClicks += 1;
      const el = $('t-sub');
      if (el) el.textContent = SUBTITLES[titleClicks % SUBTITLES.length];
      if (titleClicks % SUBTITLES.length === 2) PP.sfx.play('egg');
    }
  };

  const QUIET = ['tool', 'chk', 'pick-opt', 'note', 'doc', 'office', 'title-egg', 'hb-egg', 'rice', 'fold', 'fold-end'];

  function onClick(e) {
    PP.sfx.wake();
    if (e.target === ov && ov.dataset.sticky !== '1') {
      closeOverlay();
      return;
    }
    const el = e.target.closest('[data-act]');
    if (armed && (!el || el.dataset.act !== 'tool')) {
      armed = null;
      hideTip();
    }
    if (!el || !stage.contains(el)) return;
    const a = ACT[el.dataset.act];
    if (!a) return;
    if (!QUIET.includes(el.dataset.act)) PP.sfx.play('click');
    a(el, e);
  }

  function onKey(e) {
    const S = E.state();
    if (e.key === 'Escape' && ov && ov.classList.contains('on') && ov.dataset.sticky !== '1') {
      closeOverlay();
      return;
    }
    if (!S || !S.enc || S.enc.result || (ov && ov.classList.contains('on'))) return;
    if (e.key && e.key.length === 1) {
      keyBuf = (keyBuf + e.key.toLowerCase()).slice(-12);
      if (/(please|thanks|thank you)$/.test(keyBuf) && E.please()) {
        keyBuf = '';
        PP.sfx.play('egg');
        toast('你說了「please」。研究說這樣比較花電，不過老闆多給你 1 碗白米飯。');
        renderTop();
        return;
      }
    }
    const tools = E.tools();
    if (/^[1-9]$/.test(e.key)) onTool(tools[+e.key - 1]);
    if (e.key === '0') onTool(tools[9]);
  }

  function onMove(e) {
    if (lastPointer === 'touch') return;
    const c = e.target.closest && e.target.closest('.card');
    if (c && c.dataset.card && !c.classList.contains('big')) showTip(c);
    else if (tipFor) hideTip();
  }

  U.init = function () {
    stage = $('stage');
    stage.addEventListener('pointerdown', e => { lastPointer = e.pointerType || 'mouse'; }, true);
    stage.addEventListener('click', onClick);
    stage.addEventListener('mousemove', onMove);
    document.addEventListener('keydown', onKey);
    U.title();
  };

  return U;
})();
