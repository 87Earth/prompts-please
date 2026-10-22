window.PP = window.PP || {};

(function () {
  const KEY = 'pp_lang';
  const HAN = /[㐀-鿿豈-﫿\ud840-\ud87f]/;
  const cache = new Map();
  let conv = null;

  PP.zhMake = fix => {
    const O = window.OpenCC;
    const cfg = O.Locale.configs.tw2sp;
    const trie = group => {
      const t = new O.Trie();
      t.loadDictGroup(group);
      return t;
    };
    const norm = O.ConverterFactory(...cfg.normalizationChain);
    const seg = trie(cfg.segmentation);
    const chain = cfg.conversionChain.map((g, i) => trie(i === 0 && fix && fix.length ? [fix, ...g] : g));
    return s => seg.segment(norm(s)).map(x => chain.reduce((a, t) => t.convert(a), x)).join('');
  };

  PP.zhCN = s => {
    s = String(s);
    if (!HAN.test(s)) return s;
    let r = cache.get(s);
    if (r === undefined) {
      conv = conv || PP.zhMake(PP.ZH_FIX);
      r = conv(s);
      if (cache.size > 5000) cache.clear();
      cache.set(s, r);
    }
    return r;
  };

  const face = (code, mono) => (mono ? 'FPM' : 'FP') + (code === 'cn' ? 'S' : '');

  function store(code) {
    try { localStorage.setItem(KEY, code); } catch (e) {}
  }

  function detect() {
    const q = typeof location !== 'undefined' && /[?&]lang=(tw|cn)(&|$)/.exec(location.search);
    if (q) {
      store(q[1]);
      return q[1];
    }
    try {
      const v = localStorage.getItem(KEY);
      if (v === 'tw' || v === 'cn') return v;
    } catch (e) {}
    const nav = typeof navigator === 'undefined' ? [] : navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    const zh = nav.find(l => /^zh\b/i.test(l));
    return zh && !/^zh-(tw|hk|mo|hant)/i.test(zh) ? 'cn' : 'tw';
  }

  PP.lang = detect();
  PP.L = s => PP.lang === 'cn' ? PP.zhCN(s) : String(s);
  PP.font = mono => face(PP.lang, mono);
  PP.zhFlush = () => {};
  PP.setLang = code => Promise.resolve();

  if (typeof document === 'undefined') return;

  const seen = new WeakMap();

  function fixText(n) {
    const d = n.data;
    const was = seen.get(n);
    if (was && was[1] === d) return;
    const p = n.parentElement;
    if (!p || p.closest('.zh-keep, script, style')) return;
    const c = PP.zhCN(d);
    seen.set(n, [d, c]);
    if (c !== d) n.data = c;
  }

  function restore(n) {
    const was = seen.get(n);
    if (was && was[0] !== was[1] && n.data === was[1]) n.data = was[0];
  }

  function eachText(root, fn) {
    if (root.nodeType === 3) return fn(root);
    if (root.nodeType !== 1) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) fn(n);
  }

  function apply(records) {
    if (PP.lang !== 'cn') return;
    records.forEach(r => {
      if (r.type === 'characterData') fixText(r.target);
      else r.addedNodes.forEach(n => eachText(n, fixText));
    });
  }

  function mark() {
    document.documentElement.lang = PP.lang === 'cn' ? 'zh-Hans' : 'zh-Hant';
  }

  const mo = new MutationObserver(apply);
  PP.zhFlush = () => apply(mo.takeRecords());

  PP.setLang = code => {
    if ((code !== 'tw' && code !== 'cn') || code === PP.lang) return Promise.resolve();
    store(code);
    const load = document.fonts && document.fonts.load
      ? Promise.all([document.fonts.load('12px ' + face(code)), document.fonts.load('12px ' + face(code, true))]).catch(() => null)
      : Promise.resolve();
    return load.then(() => {
      PP.zhFlush();
      PP.lang = code;
      mark();
      eachText(document.body, code === 'cn' ? fixText : restore);
    });
  };

  mark();
  if (PP.lang === 'cn') eachText(document.body, fixText);
  mo.observe(document.body, { childList: true, subtree: true, characterData: true });
})();
