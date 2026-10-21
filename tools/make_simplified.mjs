import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const OpenCC = require('opencc-js');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['data/clients.js', 'data/rules.js', 'data/cards.js', 'data/models.js', 'src/engine.js'];
const han = /[㐀-鿿豈-﫿]/;
const chars = new Set();
for (const f of files) for (const ch of fs.readFileSync(path.join(ROOT, f), 'utf8')) if (han.test(ch)) chars.add(ch);
const conv = OpenCC.Converter({ from: 'tw', to: 'cn' });
let pairs = '';
for (const ch of [...chars].sort()) {
  const s = conv(ch);
  if (s !== ch && [...s].length === 1 && s.length === 1) pairs += ch + s;
}
const phrases = [['計畫', '计划']];
const out = [
  'window.PP = window.PP || {};',
  '',
  "PP.T2S = '" + pairs + "';",
  '',
  'PP.T2S_PHRASES = ' + JSON.stringify(phrases) + ';',
  '',
  'PP.zhCN = (() => {',
  '  const m = {};',
  '  for (let i = 0; i < PP.T2S.length; i += 2) m[PP.T2S[i]] = PP.T2S[i + 1];',
  '  return s => PP.T2S_PHRASES.reduce((a, p) => a.split(p[0]).join(p[1]), String(s)).replace(/[\\u3400-\\u9fff\\uf900-\\ufaff]/g, ch => m[ch] || ch);',
  '})();',
  ''
].join('\n');
fs.writeFileSync(path.join(ROOT, 'data/simplified.js'), out);
console.log(chars.size + ' chars scanned, ' + pairs.length / 2 + ' mapped');
