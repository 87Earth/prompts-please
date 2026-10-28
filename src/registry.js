window.PP = window.PP || {};

(function () {
  const pending = { model: [], task: [], event: [], arc: [], title: [] };
  const clone = o => JSON.parse(JSON.stringify(o));
  const swap = (o, pairs) => JSON.parse(pairs.reduce((t, [a, b]) => t.split(a).join(b), JSON.stringify(o)));
  const moveInject = (web, from, to) => {
    const w = clone(web);
    w[to].faint = w[from].faint;
    w[to].inject = w[from].inject;
    delete w[from].faint;
    delete w[from].inject;
    return w;
  };
  const LISTS = { client: () => PP.events.client, day: () => PP.events.day, rule: () => PP.userRules.list };

  PP.kit = { clone, swap, moveInject };
  PP.problems = [];
  PP.model = def => { pending.model.push(def); };
  PP.task = def => { pending.task.push(def); };
  PP.event = def => { pending.event.push(def); };
  PP.arc = def => { pending.arc.push(def); };
  PP.title = def => { pending.title.push(def); };

  PP.finalize = () => {
    const problem = s => PP.problems.push(s);
    PP.models = PP.models || [];
    PP.clients = PP.clients || {};
    PP.arcs = PP.arcs || {};
    PP.facts = PP.facts || {};
    PP.pools = PP.pools || {};
    PP.titles = PP.titles || [];
    PP.events = PP.events || { clientRate: 0, dayRate: 0, client: [], day: [] };
    PP.userRules = PP.userRules || { rate: 0, list: [] };
    pending.model.splice(0).forEach(m => {
      if (PP.models.some(x => x.id === m.id)) problem('模型 id 重複：' + m.id);
      PP.models.push(m);
    });
    pending.event.splice(0).forEach(def => {
      const { type, ...e } = def;
      if (!LISTS[type]) return problem('事件 ' + def.id + ' 的 type 要是 client、day 或 rule');
      const list = LISTS[type]();
      if (list.some(x => x.id === e.id)) problem('事件 id 重複：' + type + ' ' + e.id);
      list.push(e);
    });
    pending.task.splice(0).forEach(def => {
      const { id, facts, pool, userRules, titles, variants, ...c } = def;
      if (!id) return problem('有一個任務沒有 id');
      if (PP.clients[id]) problem('任務 id 重複：' + id);
      if (variants) c.variants = typeof variants === 'function' ? variants(c, PP.kit) : variants;
      PP.clients[id] = c;
      Object.entries(facts || {}).forEach(([k, v]) => {
        if (PP.facts[k]) problem(id + ' 的事實 id 重複：' + k);
        PP.facts[k] = v;
      });
      [].concat(pool || []).forEach(p => (PP.pools[p] = PP.pools[p] || []).push(id));
      [].concat(userRules || []).forEach(r => {
        const u = PP.userRules.list.find(x => x.id === r);
        if (!u) return problem(id + ' 要的使用者規定不存在：' + r);
        if (u.clients && !u.clients.includes(id)) u.clients.push(id);
      });
      (titles || []).forEach(t => PP.titles.push(t));
    });
    pending.arc.splice(0).forEach(({ id, ...a }) => {
      if (PP.arcs[id]) problem('劇情線 id 重複：' + id);
      PP.arcs[id] = a;
    });
    pending.title.splice(0).forEach(t => PP.titles.push(t));
  };
})();
