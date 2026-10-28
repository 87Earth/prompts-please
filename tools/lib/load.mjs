import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';

const BROWSER_ONLY = /^src\/(pixel|audio|ui|main)\.js$/;

export function scripts(root) {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  return [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
}

export function loadGame(root, { engine = true } = {}) {
  const ctx = { console, Math, JSON, Set, Array, Object, String, Number };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of scripts(root).filter(s => !BROWSER_ONLY.test(s) && (engine || s !== 'src/engine.js'))) {
    vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
  }
  if (ctx.PP.finalize) ctx.PP.finalize();
  return ctx;
}
