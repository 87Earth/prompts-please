window.PP = window.PP || {};

PP.sfx = (() => {
  let ctx = null;
  let master = null;
  let sfxBus = null;
  let on = true;
  let musicOn = true;
  let musicBus = null;
  let musicTimer = null;
  try {
    on = localStorage.getItem('pp_sound') !== '0';
    musicOn = localStorage.getItem('pp_music') !== '0';
  } catch (e) {}

  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
      sfxBus = ctx.createGain();
      sfxBus.gain.value = 1;
      sfxBus.connect(master);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, slide, delay, bus) {
    const a = ac();
    if (!a) return;
    const t = a.currentTime + (delay || 0);
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.05, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus || sfxBus);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  function noise(dur, vol, freq, delay, type, to, bus) {
    const a = ac();
    if (!a) return;
    const t = a.currentTime + (delay || 0);
    const len = Math.max(1, Math.floor(a.sampleRate * dur));
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource();
    src.buffer = buf;
    const f = a.createBiquadFilter();
    f.type = type || 'bandpass';
    f.frequency.setValueAtTime(freq || 1500, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = a.createGain();
    g.gain.setValueAtTime(vol || 0.06, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(bus || sfxBus);
    src.start(t);
  }

  const SOUNDS = {
    click() {
      noise(0.015, 0.05, 5200, 0, 'highpass');
      tone(1250, 0.03, 'triangle', 0.03);
    },
    type() {
      let d = 0;
      for (let i = 0; i < 5; i++) {
        noise(0.02, 0.06, 3200 + Math.random() * 1800, d, 'bandpass');
        tone(1700 + Math.random() * 500, 0.015, 'square', 0.006, 0, d);
        d += 0.035 + Math.random() * 0.035;
      }
    },
    paper() { noise(0.13, 0.07, 1600, 0, 'bandpass', 3800); },
    stamp() {
      tone(80, 0.24, 'sine', 0.4, -40);
      noise(0.06, 0.18, 380, 0, 'lowpass');
      noise(0.1, 0.03, 2600, 0.03, 'bandpass');
    },
    coin() {
      tone(1568, 0.5, 'sine', 0.08);
      tone(2093, 0.6, 'sine', 0.06, 0, 0.08);
      tone(3136, 0.3, 'sine', 0.02, 0, 0.08);
    },
    print() {
      for (let i = 0; i < 10; i++) {
        tone(110 + (i % 2) * 35, 0.035, 'square', 0.025, 0, i * 0.05);
        noise(0.02, 0.035, 4200, i * 0.05, 'highpass');
      }
    },
    alarm() {
      tone(988, 0.09, 'square', 0.035);
      tone(740, 0.09, 'square', 0.035, 0, 0.1);
    },
    ban() {
      tone(440, 0.6, 'sawtooth', 0.05, -380);
      tone(70, 0.35, 'sine', 0.35, -30, 0.05);
      noise(0.14, 0.1, 300, 0.05, 'lowpass');
    },
    compact() {
      noise(0.38, 0.09, 4000, 0, 'lowpass', 250);
      tone(520, 0.3, 'triangle', 0.03, -400);
    },
    bad() {
      tone(150, 0.18, 'square', 0.05);
      tone(141, 0.18, 'square', 0.04, 0, 0.02);
    },
    door() {
      tone(659, 0.5, 'sine', 0.07);
      tone(523, 0.7, 'sine', 0.07, 0, 0.3);
    },
    chat() {
      for (let i = 0; i < 3; i++) tone(520 + Math.random() * 520, 0.04, 'triangle', 0.02, 0, i * 0.065);
    },
    scan() {
      tone(1320, 0.06, 'square', 0.03);
      tone(1760, 0.08, 'square', 0.03, 0, 0.09);
    },
    outsource() {
      noise(0.3, 0.07, 500, 0, 'bandpass', 3200);
      tone(1568, 0.35, 'sine', 0.05, 0, 0.28);
    },
    busy() {
      tone(880, 0.1, 'square', 0.035);
      tone(880, 0.1, 'square', 0.035, 0, 0.15);
      tone(440, 0.32, 'square', 0.03, -200, 0.3);
    },
    think() {
      tone(392, 0.25, 'triangle', 0.03, 120);
      tone(523, 0.3, 'triangle', 0.025, 0, 0.15);
    },
    recall() {
      tone(1047, 0.12, 'sine', 0.05);
      tone(1568, 0.25, 'sine', 0.04, 0, 0.08);
    },
    draw() {
      noise(0.25, 0.06, 900, 0, 'bandpass', 2800);
      noise(0.2, 0.05, 2400, 0.18, 'bandpass', 900);
    },
    egg() {
      [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.12, 'square', 0.03, 0, i * 0.07));
    },
    astra() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 1.2, 'sine', 0.035, 0, i * 0.06));
      noise(0.6, 0.03, 6000, 0.1, 'highpass');
    },
    leave() {
      tone(523, 0.35, 'sine', 0.05);
      tone(392, 0.5, 'sine', 0.05, 0, 0.2);
    }
  };

  const midi = m => 440 * Math.pow(2, (m - 69) / 12);
  const BAR = [
    { bass: 36, chord: [60, 64, 67], mel: [[76, 0, 1], [79, 2, 1.5]] },
    { bass: 45, chord: [57, 60, 64], mel: [[81, 0, 1], [79, 2, 0.5], [76, 3, 0.8]] },
    { bass: 41, chord: [57, 60, 65], mel: [[77, 0, 1], [81, 2, 1.5]] },
    { bass: 43, chord: [55, 59, 62], mel: [[79, 0, 3]] },
    { bass: 36, chord: [60, 64, 67], mel: [[76, 0, 0.8], [79, 1, 0.8], [84, 2, 1.5]] },
    { bass: 45, chord: [57, 60, 64], mel: [[83, 0, 0.8], [81, 1, 0.8], [79, 2, 1.5]] },
    { bass: 38, chord: [57, 62, 65], mel: [[77, 0, 0.8], [76, 1, 0.8], [74, 2, 1.5]] },
    { bass: 43, chord: [55, 59, 62], mel: [[74, 0, 1.5], [67, 2, 1.5]] }
  ];

  function scheduleLoop(t0) {
    const a = ac();
    if (!a || !musicOn) return;
    const bus = a.createGain();
    bus.gain.value = 0.06;
    const lp = a.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2400;
    bus.connect(lp).connect(master);
    musicBus = bus;
    const beat = 60 / 84;
    BAR.forEach((b, bi) => {
      const bt = t0 + bi * 4 * beat;
      [0, 2].forEach(k => {
        const o = a.createOscillator();
        const g = a.createGain();
        o.type = 'triangle';
        o.frequency.value = midi(b.bass);
        g.gain.setValueAtTime(0.0001, bt + k * beat);
        g.gain.exponentialRampToValueAtTime(0.5, bt + k * beat + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, bt + k * beat + beat * 1.8);
        o.connect(g).connect(bus);
        o.start(bt + k * beat);
        o.stop(bt + k * beat + beat * 1.9);
      });
      for (let s = 0; s < 8; s++) {
        const st = bt + s * beat / 2;
        const o = a.createOscillator();
        const g = a.createGain();
        o.type = 'square';
        o.frequency.value = midi(b.chord[s % 3] + 12);
        g.gain.setValueAtTime(0.0001, st);
        g.gain.exponentialRampToValueAtTime(0.06, st + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, st + beat * 0.45);
        o.connect(g).connect(bus);
        o.start(st);
        o.stop(st + beat * 0.5);
        if (s % 2) {
          const len = Math.floor(a.sampleRate * 0.03);
          const buf = a.createBuffer(1, len, a.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
          const n = a.createBufferSource();
          n.buffer = buf;
          const hp = a.createBiquadFilter();
          hp.type = 'highpass';
          hp.frequency.value = 7000;
          const ng = a.createGain();
          ng.gain.setValueAtTime(0.08, st);
          ng.gain.exponentialRampToValueAtTime(0.0001, st + 0.03);
          n.connect(hp).connect(ng).connect(bus);
          n.start(st);
        }
      }
      b.mel.forEach(([m, at, len]) => {
        const mt = bt + at * beat;
        const o = a.createOscillator();
        const g = a.createGain();
        o.type = 'square';
        o.frequency.value = midi(m);
        g.gain.setValueAtTime(0.0001, mt);
        g.gain.exponentialRampToValueAtTime(0.12, mt + 0.02);
        g.gain.setValueAtTime(0.1, mt + len * beat * 0.7);
        g.gain.exponentialRampToValueAtTime(0.0001, mt + len * beat);
        o.connect(g).connect(bus);
        o.start(mt);
        o.stop(mt + len * beat + 0.05);
      });
    });
    const total = BAR.length * 4 * beat;
    musicTimer = setTimeout(() => scheduleLoop(t0 + total), Math.max(0, (t0 + total - a.currentTime - 1) * 1000));
  }

  function startMusic() {
    if (!musicOn || musicTimer) return;
    const a = ac();
    if (!a) return;
    scheduleLoop(a.currentTime + 0.1);
  }

  function stopMusic() {
    if (musicTimer) clearTimeout(musicTimer);
    musicTimer = null;
    if (musicBus) {
      try { musicBus.disconnect(); } catch (e) {}
      musicBus = null;
    }
  }

  return {
    play(name) {
      if (!on || !SOUNDS[name]) return;
      try { SOUNDS[name](); } catch (e) {}
    },
    wake() {
      if (!ac()) return;
      startMusic();
    },
    toggle() {
      on = !on;
      try { localStorage.setItem('pp_sound', on ? '1' : '0'); } catch (e) {}
      return on;
    },
    toggleMusic() {
      musicOn = !musicOn;
      try { localStorage.setItem('pp_music', musicOn ? '1' : '0'); } catch (e) {}
      if (musicOn) startMusic();
      else stopMusic();
      return musicOn;
    },
    get on() { return on; },
    get musicOn() { return musicOn; }
  };
})();
