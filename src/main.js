window.PP = window.PP || {};

(function () {
  const stage = document.getElementById('stage');
  const root = document.documentElement;
  let shape = '';
  let size = '';
  let timer = null;
  let full = false;

  function fit() {
    const vw = root.clientWidth;
    const vh = root.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    const portrait = vh > vw;
    const compact = !portrait && PP.TOUCH && vh < 500;
    let w;
    let h;
    let s;
    if (portrait) {
      w = Math.max(360, Math.min(600, vw * 0.75));
      s = vw / w;
      h = vh / s;
      if (h < 520) {
        s = vh / 520;
        w = Math.max(360, Math.min(600, vw / s));
        h = 520;
      }
    } else {
      const minH = compact ? 410 : 450;
      s = Math.min(vw / 800, vh / minH);
      const k = Math.floor(s * dpr);
      if (!PP.TOUCH && k >= 1 && k / dpr >= s * 0.9) s = k / dpr;
      w = Math.max(800, Math.min(960, vw / s));
      h = Math.max(minH, Math.min(600, vh / s));
    }
    w = Math.floor(w);
    h = Math.floor(h);
    PP.scale = s;
    PP.W = w;
    PP.H = h;
    PP.portrait = portrait;
    PP.compact = compact;
    root.classList.toggle('portrait', portrait);
    root.classList.toggle('compact', compact);
    root.classList.toggle('short', portrait && h < 600);
    stage.style.width = w + 'px';
    stage.style.height = h + 'px';
    stage.style.setProperty('--w', w + 'px');
    stage.style.setProperty('--h', h + 'px');
    stage.style.transform = 'scale(' + s + ')';
    stage.style.left = Math.round((vw - w * s) / 2 * dpr) / dpr + 'px';
    stage.style.top = Math.round((vh - h * s) / 2 * dpr) / dpr + 'px';
    const nextShape = portrait ? 'portrait' : compact ? 'compact' : 'landscape';
    const nextSize = w + 'x' + h;
    if (shape && (nextShape !== shape || nextSize !== size) && PP.UI && PP.UI.relayout) {
      full = full || nextShape !== shape;
      clearTimeout(timer);
      timer = setTimeout(() => {
        const f = full;
        full = false;
        PP.UI.relayout(f);
      }, nextShape !== shape ? 0 : 120);
    }
    shape = nextShape;
    size = nextSize;
  }

  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => setTimeout(fit, 300));
  fit();

  const fonts = document.fonts && document.fonts.load
    ? Promise.all([document.fonts.load('12px ' + PP.font()), document.fonts.load('12px ' + PP.font(true))])
    : Promise.resolve();
  fonts.catch(() => null).then(() => PP.UI.init());
})();
