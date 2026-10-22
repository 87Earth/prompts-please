window.PP = window.PP || {};

PP.pal = {
  k: '#1a1418', K: '#2e2a33', w: '#f4ecda', W: '#ffffff', s: '#cbbd9f', S: '#a8987a',
  d: '#4a4550', l: '#8f8b9b', L: '#c4c1cc', o: '#e0782f', O: '#9c4a17', r: '#d04a3a', R: '#7e2219',
  g: '#58a65f', G: '#2f6b3a', b: '#4f7bd9', B: '#2c4a94', y: '#ecc94b', Y: '#a8862a', c: '#7fd0e0',
  C: '#3a8ea3', p: '#e59ab8', q: '#b4587e', t: '#7ad67a', T: '#3f8f4f', n: '#141a16', m: '#3a3f4f',
  e: '#f2d974', E: '#c9a93a', u: '#8c5a3a', U: '#5b3a29', f: '#f2c9a0', F: '#d9a07a'
};

PP.cache = {};

PP.toURL = function (w, h, paint) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  paint(c.getContext('2d'));
  return c.toDataURL();
};

PP.sprite = function (key, rows) {
  if (PP.cache[key]) return PP.cache[key];
  const w = Math.max(...rows.map(r => r.length));
  PP.cache[key] = PP.toURL(w, rows.length, x => {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const col = PP.pal[row[i]];
        if (col) {
          x.fillStyle = col;
          x.fillRect(i, j, 1, 1);
        }
      }
    });
  });
  return PP.cache[key];
};

PP.Grid = class {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.px = new Array(w * h).fill(null);
  }
  set(x, y, c) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y * this.w + x] = c;
  }
  get(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.px[y * this.w + x] : null;
  }
  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  ellipse(cx, cy, rx, ry, c, keep) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1 && (!keep || keep(x, y))) this.set(x, y, c);
      }
    }
  }
  ring(cx, cy, r, t, c) {
    this.ellipse(cx, cy, r, r, c, (x, y) => {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      return dx * dx + dy * dy >= (r - t) * (r - t);
    });
  }
  line(x0, y0, x1, y1, c, t) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n;
      const y = y0 + (y1 - y0) * i / n;
      this.rect(Math.round(x - (t - 1) / 2), Math.round(y - (t - 1) / 2), t, t, c);
    }
  }
  outline(c) {
    const add = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y)) continue;
        if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push([x, y]);
      }
    }
    add.forEach(([x, y]) => this.set(x, y, c));
  }
  paint(ctx, ox, oy, s) {
    s = s || 1;
    for (let j = 0; j < this.h; j++) {
      for (let i = 0; i < this.w; i++) {
        const c = this.px[j * this.w + i];
        if (c) {
          ctx.fillStyle = c;
          ctx.fillRect(ox + i * s, oy + j * s, s, s);
        }
      }
    }
  }
  url() {
    return PP.toURL(this.w, this.h, x => this.paint(x, 0, 0, 1));
  }
};

PP.INK = '#1a1418';

PP.bust = function (o) {
  const g = new PP.Grid(48, 48);
  const skin = o.skin || '#f2c9a0';
  g.ellipse(24, 52, 20, 15, o.shirt);
  if (o.hood) g.ellipse(24, 38, 13, 4, o.shirtD);
  g.rect(20, 30, 8, 8, o.skinD || '#d9a07a');
  if (o.hair2) {
    g.rect(11, 16, 6, 24, o.hair);
    g.rect(31, 16, 6, 24, o.hair);
  }
  g.ellipse(24, 21, 10.5, 11.5, skin);
  g.ellipse(13.5, 23, 2, 3, skin);
  g.ellipse(34.5, 23, 2, 3, skin);
  if (o.style === 'short') {
    g.ellipse(24, 17, 12, 9.5, o.hair, (x, y) => y <= 16);
    g.rect(13, 15, 3, 7, o.hair);
    g.rect(32, 15, 3, 7, o.hair);
    g.rect(16, 15, 6, 3, o.hair);
    g.rect(25, 15, 4, 2, o.hair);
  }
  if (o.style === 'messy') {
    g.ellipse(24, 17, 12.5, 10, o.hair, (x, y) => y <= 16);
    [[14, 6], [19, 5], [25, 5], [31, 6], [35, 9]].forEach(([x, y]) => g.rect(x, y, 3, 3, o.hair));
    g.rect(13, 15, 3, 6, o.hair);
    g.rect(32, 15, 3, 6, o.hair);
    g.rect(17, 16, 4, 3, o.hair);
    g.rect(23, 16, 3, 2, o.hair);
    g.rect(28, 16, 4, 3, o.hair);
  }
  if (o.style === 'long') {
    g.ellipse(24, 17, 12.5, 10, o.hair, (x, y) => y <= 17);
    g.rect(12, 15, 4, 22, o.hair);
    g.rect(32, 15, 4, 22, o.hair);
    g.rect(16, 16, 5, 4, o.hair);
    g.rect(27, 16, 5, 3, o.hair);
  }
  if (o.style === 'slick') {
    g.ellipse(24, 17, 11.5, 9, o.hair, (x, y) => y <= 15);
    g.rect(13, 14, 2, 6, o.hair);
    g.rect(33, 14, 2, 6, o.hair);
  }
  if (o.style === 'bob') {
    g.ellipse(24, 17, 12.5, 10, o.hair, (x, y) => y <= 17);
    g.rect(12, 15, 4, 16, o.hair);
    g.rect(32, 15, 4, 16, o.hair);
    g.rect(16, 16, 16, 3, o.hair);
  }
  if (o.style === 'perm') {
    [[15, 15], [19, 11], [24, 10], [29, 11], [33, 15], [13, 21], [35, 21]].forEach(([x, y]) => g.ellipse(x, y, 4, 4, o.hair));
    g.ellipse(24, 15, 11, 7, o.hair, (x, y) => y <= 16);
  }
  if (o.cap) {
    g.ellipse(24, 14, 12.5, 7, o.cap, (x, y) => y <= 14);
    g.rect(24, 13, 15, 3, o.cap);
  }
  if (o.ponytail) g.ellipse(37, 18, 4, 8, o.hair);
  if (o.hat) {
    g.ellipse(24, 12.5, 18, 3.2, o.hat);
    g.rect(15, 3, 18, 10, o.hat);
    g.rect(14, 4, 1, 8, o.hat);
    g.rect(33, 4, 1, 8, o.hat);
  }
  g.outline(PP.INK);
  if (o.hat) {
    g.rect(15, 9, 18, 2, o.hatBand || '#3a2216');
    g.rect(20, 3, 8, 1, o.hatHi || '#b07a44');
  }
  if (o.collar) {
    g.rect(19, 37, 4, 3, o.collar);
    g.rect(25, 37, 4, 3, o.collar);
  }
  if (o.apron) {
    g.rect(18, 40, 12, 8, o.apron);
    g.rect(18, 38, 1, 2, o.apron);
    g.rect(29, 38, 1, 2, o.apron);
  }
  if (o.tie) {
    g.rect(23, 38, 2, 2, o.tie);
    g.rect(22, 40, 4, 8, o.tie);
  }
  if (o.hood) {
    g.rect(18, 40, 1, 6, '#d8d8d8');
    g.rect(29, 40, 1, 6, '#d8d8d8');
  }
  if (o.shades) {
    g.rect(15, 21, 8, 4, '#111014');
    g.rect(25, 21, 8, 4, '#111014');
    g.rect(23, 22, 2, 1, '#111014');
    g.set(16, 22, '#6a6a7a');
    g.set(26, 22, '#6a6a7a');
  } else {
    if (o.tired) {
      g.rect(18, 23, 3, 1, PP.INK);
      g.rect(27, 23, 3, 1, PP.INK);
      g.rect(18, 25, 3, 1, '#c8a0a8');
      g.rect(27, 25, 3, 1, '#c8a0a8');
    } else {
      g.rect(18, 22, 2, 3, PP.INK);
      g.rect(28, 22, 2, 3, PP.INK);
      g.set(18, 22, '#ffffff');
      g.set(28, 22, '#ffffff');
    }
    if (o.glasses) {
      const fr = o.glasses;
      [[15, 20], [25, 20]].forEach(([x, y]) => {
        g.rect(x, y, 8, 1, fr);
        g.rect(x, y + 5, 8, 1, fr);
        g.rect(x, y, 1, 6, fr);
        g.rect(x + 7, y, 1, 6, fr);
      });
      g.rect(23, 21, 2, 1, fr);
    }
  }
  g.set(24, 26, o.skinD || '#d9a07a');
  g.rect(22, 29, 4, 1, o.mouth || '#9a4a42');
  if (o.smile) {
    g.set(21, 28, o.mouth || '#9a4a42');
    g.set(26, 28, o.mouth || '#9a4a42');
  }
  if (o.blush) {
    g.rect(16, 26, 2, 1, '#e8a0a0');
    g.rect(30, 26, 2, 1, '#e8a0a0');
  }
  if (o.mask) {
    g.rect(17, 25, 14, 6, o.mask);
    g.rect(15, 26, 2, 1, o.mask);
    g.rect(31, 26, 2, 1, o.mask);
    g.rect(19, 27, 10, 1, '#d8d8d8');
  }
  if (o.sweat) {
    g.set(35, 13, '#7fc8f0');
    g.rect(35, 14, 2, 2, '#7fc8f0');
    g.set(12, 17, '#7fc8f0');
    g.rect(11, 18, 2, 2, '#7fc8f0');
  }
  return g;
};

PP.chibi = function (o) {
  const g = new PP.Grid(18, 22);
  g.ellipse(9, 20, 6.5, 5, o.outfit);
  if (o.long) {
    g.rect(2, 7, 3, 11, o.hair);
    g.rect(13, 7, 3, 11, o.hair);
  }
  g.ellipse(9, 9, 6, 6, o.skin || '#f2c9a0');
  g.ellipse(9, 7.5, 7, 5.5, o.hair, (x, y) => y <= 8);
  if (o.hat) {
    g.rect(2, 3, 14, 2, o.hat);
    g.rect(5, 0, 8, 4, o.hat);
  }
  g.outline(PP.INK);
  if (o.shades) g.rect(5, 9, 8, 2, '#111014');
  else {
    g.set(6, 10, PP.INK);
    g.set(11, 10, PP.INK);
  }
  if (o.accent) g.rect(8, 16, 2, 2, o.accent);
  return g;
};

PP.MODEL_LOOKS = {
  claude: { hair: '#e0782f', hairD: '#b8581c', eye: '#c8601c', outfit: '#f1eadb', outfit2: '#2a1d1a', style: 'long', acc: 'flower' },
  gpt: { hair: '#f2f2f6', hairD: '#c8c8d8', eye: '#8a7ab8', outfit: '#f6f6f8', outfit2: '#c8c8dc', style: 'long', acc: 'horns' },
  gemini: { hair: '#5d6fe3', hairD: '#9a6ae0', eye: '#7a5ad8', outfit: '#262b55', outfit2: '#4a5ab0', style: 'buns', acc: 'catears' },
  grok: { hair: '#f0d58c', hairD: '#c9a85a', eye: '#b8862a', outfit: '#2a2420', outfit2: '#c9a85a', style: 'long', acc: 'crown' },
  deepseek: { hair: '#2f4fa8', hairD: '#5aa0e0', eye: '#2c6ad8', outfit: '#1f2a4f', outfit2: '#f4f0e8', style: 'long', acc: 'fins' },
  qwen: { hair: '#5a78d8', hairD: '#3a52a8', eye: '#3a6ad8', outfit: '#e8eef8', outfit2: '#2a3a6a', style: 'long', acc: 'hat' },
  kimi: { hair: '#e8e8ee', hairD: '#b8b8c8', eye: '#5a6a9a', outfit: '#2a2a33', outfit2: '#f0f0f4', style: 'long', acc: 'bow' },
  minimax: { hair: '#f09a80', hairD: '#c8705a', eye: '#b86a4a', outfit: '#f4efe8', outfit2: '#d8606a', style: 'wavy', acc: 'nursecap' },
  seed: { hair: '#7a5ce0', hairD: '#4ab0e0', eye: '#7a4ad8', outfit: '#2a3a8a', outfit2: '#f0f0f8', style: 'twin', acc: 'ribbon' }
};

PP.modelChibi = function (id, blink) {
  const L = PP.MODEL_LOOKS[id] || PP.MODEL_LOOKS.claude;
  const g = new PP.Grid(26, 32);
  const skin = '#f6d8be';
  if (L.style === 'long') {
    g.rect(4, 10, 18, 17, L.hair);
    g.rect(3, 14, 2, 12, L.hair);
    g.rect(21, 14, 2, 12, L.hair);
    g.rect(4, 24, 3, 3, L.hairD);
    g.rect(19, 24, 3, 3, L.hairD);
  }
  if (L.style === 'wavy') {
    g.ellipse(13, 14, 11.5, 10, L.hair);
    [[3, 20], [23, 20], [5, 23], [21, 23]].forEach(([x, y]) => g.ellipse(x, y, 2.2, 2.2, L.hair));
  }
  if (L.style === 'buns') {
    g.rect(5, 10, 16, 14, L.hair);
    g.rect(5, 20, 16, 4, L.hairD);
    g.ellipse(4, 9, 3.5, 3.5, L.hair);
    g.ellipse(22, 9, 3.5, 3.5, L.hair);
  }
  if (L.style === 'twin') {
    g.rect(6, 10, 14, 8, L.hair);
    g.ellipse(3, 19, 3, 8, L.hair);
    g.ellipse(23, 19, 3, 8, L.hair);
    g.rect(1, 23, 4, 4, L.hairD);
    g.rect(21, 23, 4, 4, L.hairD);
  }
  if (L.acc === 'horns') {
    g.ellipse(3, 25, 3.5, 5, '#c8cde0');
    g.ellipse(23, 25, 3.5, 5, '#c8cde0');
  }
  g.ellipse(13, 31, 9, 9, L.outfit);
  g.rect(10, 23, 6, 4, L.outfit2);
  g.rect(11, 19, 4, 4, '#e8c0a0');
  g.ellipse(13, 12, 8.5, 8, skin);
  g.ellipse(13, 8, 9.5, 6, L.hair, (x, y) => y <= 9);
  g.rect(4, 8, 3, 9, L.hair);
  g.rect(19, 8, 3, 9, L.hair);
  g.rect(7, 9, 2, 3, L.hair);
  g.rect(12, 9, 2, 2, L.hair);
  g.rect(16, 9, 2, 3, L.hair);
  if (L.acc === 'flower') {
    g.ellipse(20.5, 5.5, 3, 3, '#ffb35c');
    g.rect(21, 8, 2, 5, '#1a1418');
  }
  if (L.acc === 'horns') {
    g.rect(6, 3, 2, 3, '#d8cdb4');
    g.rect(5, 1, 2, 3, '#d8cdb4');
    g.rect(3, 0, 2, 2, '#d8cdb4');
    g.rect(18, 3, 2, 3, '#d8cdb4');
    g.rect(19, 1, 2, 3, '#d8cdb4');
    g.rect(21, 0, 2, 2, '#d8cdb4');
  }
  if (L.acc === 'catears') {
    g.rect(5, 2, 4, 3, L.hair);
    g.rect(6, 0, 2, 2, L.hair);
    g.rect(17, 2, 4, 3, L.hair);
    g.rect(18, 0, 2, 2, L.hair);
  }
  if (L.acc === 'crown') {
    g.rect(10, 1, 6, 3, '#2a2420');
    g.set(10, 0, '#2a2420');
    g.set(12, 0, '#2a2420');
    g.set(15, 0, '#2a2420');
    g.rect(2, 7, 3, 3, '#141010');
    g.rect(21, 7, 3, 3, '#141010');
  }
  if (L.acc === 'fins') {
    g.ellipse(2.5, 13, 2.3, 3.6, '#1f2a6f');
    g.ellipse(23.5, 13, 2.3, 3.6, '#1f2a6f');
    g.rect(6, 3, 14, 2, '#f4f0e8');
    g.set(13, 0, L.hair);
    g.set(14, 1, L.hair);
    g.set(12, 1, L.hair);
  }
  if (L.acc === 'hat') {
    g.ellipse(16, 3.5, 5.5, 2, '#2a3a6a');
    g.rect(14, 0, 4, 3, '#2a3a6a');
  }
  if (L.acc === 'bow') {
    g.rect(7, 4, 12, 1, '#f0f0f4');
    g.rect(8, 1, 4, 3, '#141014');
    g.rect(14, 1, 4, 3, '#141014');
    g.rect(12, 2, 2, 2, '#141014');
  }
  if (L.acc === 'nursecap') g.rect(8, 0, 10, 4, '#f8f4f0');
  if (L.acc === 'ribbon') {
    g.rect(1, 12, 3, 2, '#f0f0f8');
    g.rect(22, 12, 3, 2, '#f0f0f8');
  }
  g.outline(PP.INK);
  if (blink) {
    g.rect(8, 13, 3, 1, PP.INK);
    g.rect(15, 13, 3, 1, PP.INK);
  } else {
    g.rect(8, 11, 3, 4, L.eye);
    g.rect(15, 11, 3, 4, L.eye);
    g.rect(8, 11, 3, 1, PP.INK);
    g.rect(15, 11, 3, 1, PP.INK);
    g.set(8, 12, '#ffffff');
    g.set(15, 12, '#ffffff');
  }
  g.rect(6, 15, 2, 1, '#f0a0a0');
  g.rect(18, 15, 2, 1, '#f0a0a0');
  g.rect(12, 16, 2, 1, '#b05a5a');
  if (L.acc === 'flower') {
    g.rect(20, 5, 2, 2, '#a8501c');
    g.set(19, 4, '#ffe0a8');
  }
  if (L.acc === 'horns') {
    g.set(6, 4, '#b8ab90');
    g.set(19, 4, '#b8ab90');
  }
  if (L.acc === 'nursecap') {
    g.rect(12, 1, 2, 2, '#d04a3a');
    g.set(11, 1, '#d04a3a');
    g.set(14, 2, '#d04a3a');
  }
  if (L.acc === 'crown') {
    g.set(11, 2, '#e8c547');
    g.set(14, 2, '#e8c547');
  }
  if (L.acc === 'hat') g.set(16, 1, '#ffffff');
  return g;
};

PP.sheet = function (key, w, h, paint) {
  if (!PP.cache[key]) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    paint(c.getContext('2d'));
    PP.cache[key] = c;
  }
  return PP.cache[key];
};

PP.chibiCanvas = function (id, blink) {
  return PP.sheet('mchibi:' + id + ':' + (blink ? 1 : 0), 26, 32, x => PP.modelChibi(id, blink).paint(x, 0, 0, 1));
};

PP.icon = function (name) {
  const key = 'icon:' + name;
  if (PP.cache[key]) return PP.cache[key];
  const f = PP.ICONS[name];
  if (!f) return '';
  PP.cache[key] = typeof f === 'function' ? f().url() : PP.sprite(key, f);
  return PP.cache[key];
};

PP.ICONS = {
  read: [
    '................',
    '..kkkkkkkkk.....',
    '..kwwwwwwwkk....',
    '..kwwwwwwwksk...',
    '..kwkkkkwwkkkk..',
    '..kwwwwwwwwwwk..',
    '..kwkkkkkkkwwk..',
    '..kwwwwwwwwwwk..',
    '..kwkkkkkkwwwk..',
    '..kwwwwwwwwwwk..',
    '..kwkkkkkkkwwk..',
    '..kwwwwwwwwwwk..',
    '..kwkkkkkwwwwk..',
    '..kwwwwwwwwwwk..',
    '..kkkkkkkkkkkk..',
    '................'
  ],
  grep() {
    const g = new PP.Grid(16, 16);
    g.ellipse(6.5, 6.5, 5, 5, '#7fd0e0');
    g.line(10, 10, 14, 14, '#4a4550', 2);
    g.outline(PP.INK);
    g.set(4, 4, '#ffffff');
    g.set(5, 3, '#ffffff');
    g.set(3, 5, '#ffffff');
    return g;
  },
  web() {
    const g = new PP.Grid(16, 16);
    g.ellipse(8, 8, 6.5, 6.5, '#4f7bd9');
    [[5, 4, 3, 2], [4, 6, 3, 3], [9, 8, 3, 2], [10, 5, 2, 2], [6, 10, 2, 2], [9, 11, 2, 1]].forEach(([x, y, w, h]) => g.rect(x, y, w, h, '#58a65f'));
    g.outline(PP.INK);
    return g;
  },
  bash: [
    '................',
    '.kkkkkkkkkkkkkk.',
    '.kllllllllllllk.',
    '.klrlylgllllllk.',
    '.kkkkkkkkkkkkkk.',
    '.knnnnnnnnnnnnk.',
    '.kntnnnnnnnnnnk.',
    '.knntnnnnnnnnnk.',
    '.knnntnnnnnnnnk.',
    '.knntnnnnnnnnnk.',
    '.kntnnnttttnnnk.',
    '.knnnnnnnnnnnnk.',
    '.kkkkkkkkkkkkkk.',
    '................',
    '................',
    '................'
  ],
  edit: [
    '................',
    '............kk..',
    '...........kprk.',
    '..........kpprk.',
    '.........kLLrk..',
    '........kyyLk...',
    '.......kyyYk....',
    '......kyyYk.....',
    '.....kyyYk......',
    '....kyyYk.......',
    '...kffYk........',
    '...kffk.........',
    '..kfkk..........',
    '..kk............',
    '................',
    '................'
  ],
  ask: [
    '................',
    '..kkkkkkkkkkkk..',
    '.kwwwwwwwwwwwwk.',
    '.kwwwwbbbbwwwwk.',
    '.kwwwbbwwbbwwwk.',
    '.kwwwwwwwbbwwwk.',
    '.kwwwwwwbbwwwwk.',
    '.kwwwwwbbwwwwwk.',
    '.kwwwwwwwwwwwwk.',
    '.kwwwwwbbwwwwwk.',
    '.kwwwwwwwwwwwwk.',
    '..kkkkkkkkkkkk..',
    '...kwk..........',
    '...kk...........',
    '................',
    '................'
  ],
  recall: [
    '................',
    '....kkk..kkk....',
    '...kwwwkkwwwk...',
    '..kwwwwwwwwwwk..',
    '.kwwwwwwwwwwwwk.',
    '.kwwkwwkwwkwwwk.',
    '.kwwwwwwwwwwwwk.',
    '..kwwwwwwwwwwk..',
    '...kwwwkkwwwk...',
    '....kkk..kkk....',
    '...kk...........',
    '..kwwk..........',
    '...kk...........',
    '.k..............',
    '................',
    '................'
  ],
  think: [
    '................',
    '.....kkkkk......',
    '....keeeeek.....',
    '...keeWeeeek....',
    '...keWeeeeek....',
    '...keeeeeeek....',
    '...keeeeeeek....',
    '....keeeeek.....',
    '.....keeek......',
    '.....kLLLk......',
    '.....klllk......',
    '.....kLLLk......',
    '......kkk.......',
    '................',
    '................',
    '................'
  ],
  agent: [
    '................',
    '.....kkkkkk.....',
    '....kUUUUUUk....',
    '....kUffffUk....',
    '....kfkffkfk....',
    '....kffffffk....',
    '.....kkkkkk.....',
    '....kbbbbbbk....',
    '...kbbbbbbbbk...',
    '...kbbkwwwkbk...',
    '...kbbkwkwkbk...',
    '...kbbkwwwkbk...',
    '...kbbkkkkkbk...',
    '....kbbbbbbk....',
    '....kkk..kkk....',
    '................'
  ],
  parallel: [
    '................',
    '................',
    '........k.......',
    '........ktk.....',
    '.kkkkkkkkttk....',
    '.kttttttttttk...',
    '.kkkkkkkkttk....',
    '........ktk.....',
    '........k.......',
    '..........k.....',
    '..........kck...',
    '...kkkkkkkkcck..',
    '...kcccccccccck.',
    '...kkkkkkkkcck..',
    '..........kck...',
    '..........k.....'
  ],
  todo: [
    '................',
    '....kkkkkkk.....',
    '..kkklllllkkk...',
    '..kwwwwwwwwwk...',
    '..kwggwkkkkwk...',
    '..kwggwwwwwwk...',
    '..kwwwwwwwwwk...',
    '..kwggwkkkkwk...',
    '..kwggwwwwwwk...',
    '..kwwwwwwwwwk...',
    '..kwsswkkkkwk...',
    '..kwsswwwwwwk...',
    '..kwwwwwwwwwk...',
    '..kkkkkkkkkkk...',
    '................',
    '................'
  ],
  tidy: [
    '................',
    '..kkkkkkkkkkkk..',
    '..kwwwwwwwwwwk..',
    '..kkkkkkkkkkkk..',
    '...kwwwwwwwwk...',
    '...kkkkkkkkkk...',
    '....kwwwwwwk....',
    '....kkkkkkkk....',
    '................',
    '.......kk.......',
    '......kttk......',
    '....kkttttkk....',
    '.....kttttk.....',
    '......kttk......',
    '.......kk.......',
    '................'
  ],
  plan: [
    '................',
    '..kkkkkkkkkkkk..',
    '..kwwwwwwwwwwk..',
    '..kwrwwwwwwwwk..',
    '..kwwrwwwwwwwk..',
    '..kwwwrrwwwwwk..',
    '..kwwwwwrwwwwk..',
    '..kwwwwwwrwwwk..',
    '..kwwwwwrwwwwk..',
    '..kwwwwrwwwwwk..',
    '..kwwwwwrrwwwk..',
    '..kwwwwwwwrgwk..',
    '..kwwwwwwwwwwk..',
    '..kkkkkkkkkkkk..',
    '................',
    '................'
  ],
  region: [
    '................',
    '................',
    '.kkkkkkkkkkkkkk.',
    '.kwwwwwwwwwwwwk.',
    '.kwkkkkwwwwwwwk.',
    '.kwkffkwkkkkkwk.',
    '.kwkffkwwwwwwwk.',
    '.kwkbbkwkkkkwwk.',
    '.kwkbbkwwwwwwwk.',
    '.kwkkkkwkkkwwwk.',
    '.kwwwwwwwwwwrrk.',
    '.kwwwwwwwwwrrrk.',
    '.kkkkkkkkkkkkkk.',
    '................',
    '................',
    '................'
  ],
  outsource: [
    '................',
    '.kkkkkk.........',
    '.kwwwwkk........',
    '.kwkkwwk........',
    '.kwwwwwk...k....',
    '.kwkkkwk...kk...',
    '.kwwwwwkkkkqqk..',
    '.kwkkkwkqqqqqqqk',
    '.kwwwwwkkkkqqk..',
    '.kwkkkwk...kk...',
    '.kwwwwwk...k....',
    '.kkkkkkk........',
    '................',
    '................',
    '................',
    '................'
  ],
  draw: [
    '................',
    '.kkkkkkkkkkkkkk.',
    '.kcccccccccyyck.',
    '.kcccccccccyyck.',
    '.kccccgccccccck.',
    '.kcccgggcccccck.',
    '.kccgggggccgcck.',
    '.kcgggggggggggk.',
    '.kGGGGGGGGGGGGk.',
    '.kkkkkkkkkkkkkk.',
    '..........kyk...',
    '.........kyk....',
    '........kuk.....',
    '.......kuk......',
    '......kkk.......',
    '................'
  ],
  astra: [
    '................',
    '.......k........',
    '......kyk.......',
    '......kyk.......',
    '.....kyeyk......',
    '.kkkkyeWeykkkk..',
    '..kyyeWWWeyyk...',
    '.kkkkyeWeykkkk..',
    '.....kyeyk......',
    '......kyk.......',
    '......kyk....k..',
    '.......k....kyk.',
    '...........kyWyk',
    '............kyk.',
    '.............k..',
    '................'
  ],
  busy: [
    '................',
    '..kkkkkkkkkkkk..',
    '..kLLLLLLLLLLk..',
    '..kLrLLLLddddk..',
    '..kkkkkkkkkkkk..',
    '..kLLLLLLLLLLk..',
    '..kLrLLLLddddk..',
    '..kkkkkkkkkkkk..',
    '..kLLLLLLLLLLk..',
    '..kLrLLLLddddk..',
    '..kkkkkkkkkkkk..',
    '..........kkk...',
    '.........krrrk..',
    '.........krWrk..',
    '.........krrrk..',
    '..........kkk...'
  ],
  rice: [
    '...wwwww...',
    '..wwWwwww..',
    '.wwwwwwwWw.',
    'kkkkkkkkkkk',
    'kbcbcbcbcbk',
    '.kbbbbbbbk.',
    '..kbbbbbk..',
    '...kkkkk...'
  ],
  heart: [
    '.kk...kk.',
    'krrk.krrk',
    'krrrkrrrk',
    'krrrrrrrk',
    '.krrrrrk.',
    '..krrrk..',
    '...krk...',
    '....k....'
  ],
  heartEmpty: [
    '.kk...kk.',
    'kddk.kddk',
    'kdddkdddk',
    'kdddddddk',
    '.kdddddk.',
    '..kdddk..',
    '...kdk...',
    '....k....'
  ],
  pin: [
    '.kkk.',
    'krrrk',
    'krRrk',
    '.kRk.',
    '..k..',
    '..k..'
  ]
};

PP.AVATARS = {
  meiling: { style: 'bob', hair: '#4a3226', shirt: '#d97a6a', apron: '#f4ecda', smile: true, skin: '#f5d0b0' },
  ajie: { style: 'short', hair: '#2a2228', cap: '#3a6ea5', shirt: '#e8c547', smile: true },
  libobo: { style: 'short', hair: '#cfcfcf', shirt: '#7a8a6a', glasses: '#5a4a3a', smile: true, skin: '#eac09a' },
  chenmama: { style: 'perm', hair: '#3a2a2a', shirt: '#c25a8a', smile: true, skin: '#f0c8a8' },
  xiaomei: { style: 'long', hair: '#2a1e1e', shirt: '#8a9ab8', tired: true, sweat: true, skin: '#f5d6c0' },
  ahong: { style: 'messy', hair: '#2a2228', shirt: '#4f9a5a', shirtD: '#3a7a44', hood: true },
  xiaoye: { style: 'short', hair: '#3a2a24', shirt: '#e8e2d4', tie: '#2c4a94', tired: true },
  akai: { style: 'slick', hair: '#1a1418', shirt: '#6a5a9a', collar: '#efe8dc', tie: '#e0782f', smile: true },
  aling: { style: 'long', hair: '#2a1e1e', shirt: '#4fa8a8', ponytail: true, smile: true, skin: '#f2d0b4' },
  xiaoyu: { style: 'messy', hair: '#1e1a1c', shirt: '#f4f4f0', collar: '#2c4a94', smile: true },
  azhi: { style: 'short', hair: '#2a2228', shirt: '#7a8ab0', tired: true },
  xiaohai: { style: 'short', hair: '#141014', shirt: '#2a2a2a', shirtD: '#1a1a1a', hood: true, glasses: '#7ad67a', smile: true },
  xiaowang_disguise2: { style: 'messy', hair: '#1e1a1c', shirt: '#f0e6d0', skin: '#efc39a', shades: true, mask: '#f4f4f4' },
  aming: { style: 'short', hair: '#2a2228', shirt: '#6b7280', shirtD: '#4b5260', hood: true, glasses: '#2a2a3a' },
  xiaowang: { style: 'messy', hair: '#1e1a1c', shirt: '#2f3a4a', skin: '#efc39a', smile: true },
  xiaowang_disguise: { style: 'messy', hair: '#1e1a1c', shirt: '#b0443a', skin: '#efc39a', hat: '#8a5a2e', shades: true, smile: true, collar: '#e8e0d0' },
  xiaolin: { style: 'long', hair: '#3a2a24', shirt: '#9a6a8a', ponytail: true, glasses: '#7a4a3a', blush: true, skin: '#f5d0b0' },
  chen: { style: 'slick', hair: '#141014', shirt: '#2a2f45', collar: '#efe8dc', tie: '#b02a2a', smile: true, skin: '#e8bf98' },
  azhe: { style: 'messy', hair: '#2a2228', shirt: '#5a8a9a', glasses: '#1a1418', smile: true },
  xiaoqi: { style: 'long', hair: '#4a2e22', shirt: '#e59ab8', blush: true, smile: true, skin: '#f5d6c0' },
  ade: { style: 'short', hair: '#2a2228', shirt: '#6a8a5a', collar: '#efe8dc', smile: true, skin: '#e8bf98' },
  xiaoyun: { style: 'bob', hair: '#2a1e1e', shirt: '#4f7bd9', collar: '#efe8dc', smile: true, skin: '#f5d6c0' },
  xiaoan: { style: 'messy', hair: '#3a2a24', shirt: '#6a6a7a', shirtD: '#4a4a5a', hood: true, tired: true },
  boss: { style: 'slick', hair: '#6a6a6a', shirt: '#2a2f45', collar: '#efe8dc', tie: '#e8c547', glasses: '#1a1418', smile: true, skin: '#e8bf98' },
  azhen: { style: 'long', hair: '#5a3a2a', shirt: '#e0903a', sweat: true, skin: '#f5d0b0' },
  azhu: { style: 'perm', hair: '#8a7a7a', shirt: '#58a65f', glasses: '#8a5a3a', smile: true, skin: '#f0c8a8' },
  jiajia: { style: 'bob', hair: '#4a3226', shirt: '#e59ab8', apron: '#f4ecda', smile: true, skin: '#f5d0b0' },
  teacher: { style: 'long', hair: '#2a1e1e', shirt: '#7a3a4a', collar: '#efe8dc', glasses: '#3a2a2a', skin: '#f2d0b4' },
  xiaoxuan: { style: 'bob', hair: '#1e1a1c', shirt: '#f4f4f0', collar: '#c25a5a', smile: true, blush: true, skin: '#f5d6c0' },
  xiaohan: { style: 'long', hair: '#4a2e22', shirt: '#58a65f', cap: '#e0782f', ponytail: true, smile: true, skin: '#f2d0b4' },
  jiahao: { style: 'slick', hair: '#1e1a1c', shirt: '#e8e2d4', collar: '#efe8dc', tie: '#4f7bd9', glasses: '#1a1418', smile: true },
  axiang: { style: 'messy', hair: '#2a2228', shirt: '#9ab0c8', shirtD: '#7a90a8', hood: true, tired: true, blush: true },
  aqing: { style: 'short', hair: '#2a2228', shirt: '#6a7a8a', collar: '#efe8dc', tie: '#3a4a6a', tired: true },
  xiaoyou: { style: 'messy', hair: '#2a1e1e', shirt: '#fb7299', smile: true, blush: true, skin: '#f5d6c0' }
};

PP.avatar = function (name) {
  const key = 'avatar:' + name;
  if (!PP.cache[key]) PP.cache[key] = PP.bust(PP.AVATARS[name] || PP.AVATARS.aming).url();
  return PP.cache[key];
};

PP.CARD_TEXT = [['阿麼 80 歲', '生日快樂'], ['阿嬤 08 歲', '生日快樂'], ['阿嬤 80 歲', '生曰快藥'], ['阿媽 80 歲', '牛日快樂']];

PP.PHONE_TEXT = ['0912-354-678', '0921-345-678', '0912-345-687', '0912-3456-78'];

PP.imageSize = img => img.kind === 'family' ? [120, 64] : img.kind === 'poster' ? [84, 96] : [96, 64];

PP.paintImage = function (img) {
  const key = 'img:' + img.kind + ':' + img.flaw + ':' + (img.quality ? 1 : 0) + ':' + img.v + ':' + PP.lang;
  if (PP.cache[key]) return PP.cache[key];
  const [w, h] = PP.imageSize(img);
  PP.cache[key] = PP.toURL(w, h, x => {
    if (img.kind === 'card') PP.paintCard(x, img);
    else if (img.kind === 'poster') PP.paintPoster(x, img);
    else PP.paintFamily(x, img);
  });
  return PP.cache[key];
};

PP.paintPoster = function (x, img) {
  x.fillStyle = '#f4ecda';
  x.fillRect(0, 0, 84, 96);
  x.fillStyle = '#d04a3a';
  x.fillRect(0, 0, 84, 18);
  x.font = '12px ' + PP.font();
  x.textAlign = 'center';
  x.textBaseline = 'top';
  x.fillStyle = '#ffffff';
  x.fillText(PP.L(img.flaw === 'wrong' ? '尋狗啟事' : '尋貓啟事'), 42, 3);
  const g = new PP.Grid(84, 96);
  if (img.flaw === 'wrong') {
    g.ellipse(42, 40, 12, 8, '#8c5a3a');
    g.ellipse(32, 33, 6, 6, '#8c5a3a');
    g.rect(27, 25, 3, 5, '#5b3a29');
    g.rect(35, 25, 3, 5, '#5b3a29');
    g.rect(52, 33, 3, 7, '#8c5a3a');
    g.outline(PP.INK);
    g.set(30, 32, PP.INK);
  } else {
    g.ellipse(44, 41, 13, 8, '#ffffff');
    g.ellipse(48, 39, 6, 5, '#e0903a');
    g.ellipse(32, 33, 7, 6, '#ffffff');
    g.rect(26, 24, 3, 5, '#e0903a');
    g.rect(35, 24, 3, 5, '#e0903a');
    g.ellipse(34, 30, 3, 2, '#e0903a');
    g.rect(55, 34, 3, 9, '#e0903a');
    g.outline(PP.INK);
    g.set(30, 33, PP.INK);
    g.set(35, 33, PP.INK);
    g.rect(28, 37, 9, 2, '#d04a3a');
  }
  g.paint(x, 0, 0, 1);
  x.fillStyle = '#2b2522';
  x.fillText(PP.L(img.flaw === 'wrong' ? '小黑' : '麻糬'), 42, 52);
  x.fillStyle = '#7e2219';
  x.fillText(img.flaw === 'phone' ? PP.PHONE_TEXT[img.v % PP.PHONE_TEXT.length] : '0912-345-678', 42, 66);
  if (img.quality) {
    x.fillStyle = '#2c6838';
    x.fillText(PP.L('尋獲必有重謝'), 42, 80);
  }
};

PP.paintCard = function (x, img) {
  const pink = img.quality;
  x.fillStyle = pink ? '#f6bcd0' : '#f4ecda';
  x.fillRect(0, 0, 96, 64);
  x.fillStyle = pink ? '#c0587e' : '#a8862a';
  x.fillRect(0, 0, 96, 2);
  x.fillRect(0, 62, 96, 2);
  x.fillRect(0, 0, 2, 64);
  x.fillRect(94, 0, 2, 64);
  const heart = (hx, hy) => {
    x.fillStyle = '#d04a3a';
    x.fillRect(hx, hy, 2, 2);
    x.fillRect(hx + 3, hy, 2, 2);
    x.fillRect(hx, hy + 1, 5, 2);
    x.fillRect(hx + 1, hy + 3, 3, 1);
    x.fillRect(hx + 2, hy + 4, 1, 1);
  };
  heart(5, 5);
  heart(86, 5);
  heart(5, 54);
  heart(86, 54);
  const text = img.flaw === 'text' ? PP.CARD_TEXT[img.v % PP.CARD_TEXT.length] : ['阿嬤 80 歲', '生日快樂'];
  x.font = '12px ' + PP.font();
  x.textAlign = 'center';
  x.textBaseline = 'top';
  x.fillStyle = '#7e2219';
  x.fillText(PP.L(text[0]), 48, 9);
  x.fillText(PP.L(text[1]), 48, 24);
  x.fillStyle = '#f4ecda';
  x.fillRect(38, 48, 20, 8);
  x.fillStyle = '#8c5a3a';
  x.fillRect(38, 52, 20, 4);
  x.fillStyle = '#e59ab8';
  x.fillRect(38, 47, 20, 2);
  x.fillStyle = '#4f7bd9';
  x.fillRect(47, 42, 2, 5);
  x.fillStyle = '#ecc94b';
  x.fillRect(47, 40, 2, 2);
};

PP.paintFamily = function (x, img) {
  x.fillStyle = '#f4e4c8';
  x.fillRect(0, 0, 120, 64);
  x.fillStyle = '#c8a878';
  x.fillRect(0, 50, 120, 14);
  x.fillStyle = '#e8cfa0';
  x.fillRect(0, 49, 120, 1);
  x.fillStyle = '#e8a8a0';
  x.fillRect(54, 6, 3, 3);
  x.fillRect(58, 6, 3, 3);
  x.fillRect(54, 8, 7, 2);
  x.fillRect(55, 10, 5, 1);
  x.fillRect(56, 11, 3, 1);
  const people = img.flaw === 'wrong'
    ? [{ hair: '#c9a85a', outfit: '#7a5ce0' }, { hair: '#e8e8ee', outfit: '#2a2a33', long: true }, { hair: '#e0782f', outfit: '#f1eadb' }]
    : [{ hair: '#2a2228', outfit: '#3a6ea5' }, { hair: '#4a2e22', outfit: '#d04a3a', long: true }, { hair: '#2a1e1e', outfit: '#e59ab8', long: true }, { hair: '#2a2228', outfit: '#58a65f', glasses: img.quality }];
  let dog = img.flaw !== 'wrong';
  if (img.flaw === 'count') {
    if (img.v % 2 === 0) people.splice(2, 0, { hair: '#8f8b9b', outfit: '#4a4550', shades: true });
    else dog = false;
  }
  const g = new PP.Grid(120, 64);
  people.forEach((p, i) => {
    const c = PP.chibi(p);
    const ox = 4 + i * 20;
    for (let j = 0; j < c.h; j++) for (let k = 0; k < c.w; k++) {
      const col = c.get(k, j);
      if (col) g.set(ox + k, 30 + j, col);
    }
    if (p.glasses) {
      [ox + 5, ox + 10].forEach(gx => {
        g.rect(gx, 39, 4, 1, '#4a4550');
        g.rect(gx, 41, 4, 1, '#4a4550');
        g.set(gx, 40, '#4a4550');
        g.set(gx + 3, 40, '#4a4550');
        g.rect(gx + 1, 40, 2, 1, '#cfe6f2');
        g.set(gx + 1, 40, PP.INK);
      });
      g.set(ox + 9, 39, '#4a4550');
    }
  });
  if (dog) {
    const d = new PP.Grid(16, 12);
    const o = '#e0903a';
    d.ellipse(9, 7, 5, 3, o);
    d.ellipse(4, 5, 3, 3, o);
    d.rect(2, 1, 2, 2, o);
    d.rect(5, 1, 2, 2, o);
    d.rect(13, 3, 2, 3, o);
    d.rect(6, 9, 1, 2, o);
    d.rect(11, 9, 1, 2, o);
    d.outline(PP.INK);
    d.rect(2, 6, 3, 1, '#f4ecda');
    d.set(3, 4, PP.INK);
    const ox = 4 + people.length * 20;
    for (let j = 0; j < d.h; j++) for (let k = 0; k < d.w; k++) {
      const col = d.get(k, j);
      if (col) g.set(ox + k, 40 + j, col);
    }
  }
  g.paint(x, 0, 0, 1);
};

PP.clipCanvas = function () {
  return PP.sheet('clip', 12, 22, x => {
    const g = new PP.Grid(12, 22);
    const L = '#d8d6e0';
    const loop = (a, b, w, h) => {
      g.rect(a + 1, b, w - 2, 1, L);
      g.rect(a + 1, b + h - 1, w - 2, 1, L);
      g.rect(a, b + 1, 1, h - 2, L);
      g.rect(a + w - 1, b + 1, 1, h - 2, L);
    };
    loop(2, 5, 8, 17);
    loop(4, 9, 4, 10);
    g.outline(PP.INK);
    g.rect(1, 0, 4, 4, '#ffffff');
    g.rect(7, 0, 4, 4, '#ffffff');
    g.rect(3, 1, 2, 2, PP.INK);
    g.rect(9, 1, 2, 2, PP.INK);
    g.paint(x, 0, 0, 1);
  });
};
