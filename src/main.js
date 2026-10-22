window.PP = window.PP || {};

(function () {
  const stage = document.getElementById('stage');

  function fit() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    let s = Math.min(vw / 800, vh / 450);
    if (!PP.TOUCH) {
      const ds = Math.floor(s * dpr);
      if (ds >= 1) s = ds / dpr;
    }
    PP.scale = s;
    stage.style.transform = 'scale(' + s + ')';
    stage.style.left = Math.round((vw - 800 * s) / 2 * dpr) / dpr + 'px';
    stage.style.top = Math.round((vh - 450 * s) / 2 * dpr) / dpr + 'px';
    const rot = document.getElementById('rotate');
    if (rot) rot.classList.toggle('on', !!PP.TOUCH && vh > vw);
  }

  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => setTimeout(fit, 300));
  fit();

  const fonts = document.fonts && document.fonts.load
    ? Promise.all([document.fonts.load('12px ' + PP.font()), document.fonts.load('12px ' + PP.font(true))])
    : Promise.resolve();
  fonts.catch(() => null).then(() => PP.UI.init());
})();
