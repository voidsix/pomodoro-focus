{
  // ---------- Almacenamiento seguro ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('pf:' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('pf:' + k, JSON.stringify(v)); } catch {} }
  };

  const PRESETS = [
    { id: 'clasico', name: 'Clásico', focus: 25, short: 5, long: 15, every: 4 },
    { id: 'suave', name: 'Arranque suave', focus: 15, short: 3, long: 10, every: 4 },
    { id: 'profundo', name: 'Profundo', focus: 50, short: 10, long: 30, every: 3 },
    { id: 'flow', name: 'Flow', focus: 90, short: 20, long: 30, every: 2 }
  ];
  const LABELS = { focus: 'Tiempo de foco', short: 'Descanso corto', long: 'Descanso largo' };
  const DEFAULTS = {
    focus: 25, short: 5, long: 15, every: 4, autoStart: false, sound: true, notify: false,
    ambient: 'none', ambientVol: 50, ambientBreaks: false, freq: 'none', freqVol: 40, alarm: 'bell', skin: 'mar'
  };
  const SKINS = [
    { id: 'mar', name: 'Mar', desc: 'verde agua', bg: '#04141a', a: ['#1fcab5', '#2a9fd8'] },
    { id: 'noche', name: 'Noche', desc: 'azul violeta', bg: '#0a0b10', a: ['#5b7cfa', '#9b6cf6'] },
    { id: 'bosque', name: 'Bosque', desc: 'verdes suaves', bg: '#08120c', a: ['#4fc27c', '#2aa89a'] }
  ];

  const settings = Object.assign({}, DEFAULTS, store.get('settings', {}));
  let log = store.get('log', []);       // [{ts, min, task}]
  let notes = store.get('notes', []);   // [{ts, t}]
  let subjects = store.get('subjects', []); // [{id, name, exam: 'YYYY-MM-DD' | ''}]
  let currentSub = store.get('subject', '');
  if (!subjects.some((s) => s.id === currentSub)) currentSub = '';
  const SUB_COLORS = ['#5b8bd6', '#4fa387', '#9a82d6', '#d0a05a', '#5aaec0', '#cf7f9f', '#8aab58', '#9a8f86'];
  const saved = store.get('state', {});
  let mode = saved.mode || 'focus';
  let cycle = saved.cycle || 0;         // pomodoros completados en el ciclo actual
  let remaining = saved.remaining ?? settings[mode] * 60000;
  let endAt = null;
  let timer = null;

  const $ = (s) => document.querySelector(s);
  const el = {
    time: $('#time'), label: $('#label'), dots: $('#dots'), prog: $('#prog'), progGlow: $('#prog-glow'),
    toggle: $('#toggle'), reset: $('#reset'), skip: $('#skip'), task: $('#task'),
    presets: $('#presets'), form: $('#settings'), notes: $('#notes'), noteForm: $('#note-form'),
    note: $('#note'), history: $('#history'), week: $('#week'), ticks: $('#ticks'),
    subject: $('#subject'), countdown: $('#countdown'), subForm: $('#subject-form'),
    subName: $('#subject-name'), subDate: $('#subject-date'), subjects: $('#subjects'), bySubject: $('#by-subject')
  };
  const CIRC = 2 * Math.PI * 88;
  el.task.value = store.get('task', '');

  // ---------- Esfera ----------
  el.ticks.innerHTML = Array.from({ length: 60 }, (_, i) => {
    const a = (i / 60) * Math.PI * 2, big = i % 5 === 0;
    const r1 = big ? 70 : 74, r2 = 79;
    const f = (r) => [100 + r * Math.cos(a), 100 + r * Math.sin(a)].map((n) => n.toFixed(2));
    const [x1, y1] = f(r1), [x2, y2] = f(r2);
    return `<line class="${big ? 'big' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }).join('');

  const fmt = (ms) => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  };
  const total = () => settings[mode] * 60000;

  function render() {
    const t = fmt(remaining);
    el.time.textContent = t;
    el.label.textContent = LABELS[mode];
    const frac = Math.min(1, Math.max(0, remaining / total()));
    for (const ring of [el.prog, el.progGlow]) {
      ring.style.strokeDasharray = CIRC;
      ring.style.strokeDashoffset = CIRC * (1 - frac);
    }
    el.toggle.textContent = timer ? 'Pausar' : (remaining < total() ? 'Seguir' : 'Empezar');
    document.title = timer ? `${t} · ${mode === 'focus' ? 'Foco' : 'Descanso'}` : 'Foco Pomodoro';
    document.body.dataset.mode = mode;
    document.body.classList.toggle('running', !!timer);
    const zs = subById(currentSub);
    $('#zen-caption').textContent = [zs ? zs.name : '', el.task.value.trim()].filter(Boolean).join(' · ');
    document.querySelectorAll('[data-mode-btn]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.modeBtn === mode));
    el.dots.innerHTML = Array.from({ length: settings.every }, (_, i) => `<i class="${i < cycle ? 'on' : ''}"></i>`).join('');
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = (SKINS.find((s) => s.id === settings.skin) || SKINS[0]).bg;
  }

  function persist() {
    store.set('state', { mode, cycle, remaining });
  }

  // ---------- Temporizador (basado en hora de fin, sobrevive a pestañas en segundo plano) ----------
  function tick() {
    remaining = endAt - Date.now();
    if (remaining <= 0) { remaining = 0; finish(); return; }
    render();
  }
  function start() {
    unlockAudio();
    endAt = Date.now() + remaining;
    clearInterval(timer);
    timer = setInterval(tick, 250);
    render(); updateAmbient();
  }
  function pause() {
    clearInterval(timer); timer = null;
    if (endAt) remaining = Math.max(0, endAt - Date.now());
    persist(); render(); updateAmbient();
  }
  function setMode(m, keepCycle = true) {
    clearInterval(timer); timer = null;
    mode = m; remaining = total();
    if (!keepCycle) cycle = 0;
    persist(); render(); updateAmbient();
  }

  function finish() {
    clearInterval(timer); timer = null;
    const wasFocus = mode === 'focus';
    if (wasFocus) {
      log.push({ ts: Date.now(), min: settings.focus, task: el.task.value.trim(), sub: currentSub });
      if (log.length > 2000) log = log.slice(-2000);
      store.set('log', log);
      cycle += 1;
    }
    let next;
    if (wasFocus) next = cycle >= settings.every ? 'long' : 'short';
    else { next = 'focus'; if (mode === 'long') cycle = 0; }
    alertDone(wasFocus ? '¡Pomodoro completo! Tomate un descanso.' : 'Fin del descanso. A enfocarse.');
    mode = next; remaining = total();
    persist(); render(); renderStats();
    document.body.classList.add('done');
    setTimeout(() => document.body.classList.remove('done'), 2000);
    if (settings.autoStart) start(); else updateAmbient();
  }

  // ---------- Sonido: todo se genera con Web Audio (sin archivos, funciona offline) ----------
  let ctx = null;
  function unlockAudio() {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
    } catch { ctx = null; }
    return ctx;
  }

  // Avisos al terminar
  const ALARMS = [
    { id: 'bell', name: 'Campanitas', desc: 'tres notas' },
    { id: 'gong', name: 'Gong', desc: 'grave y largo' },
    { id: 'digital', name: 'Digital', desc: 'bip bip' },
    { id: 'soft', name: 'Suave', desc: 'acorde tranquilo' }
  ];
  function playAlarm(id) {
    const c = unlockAudio(); if (!c) return;
    try {
      const t = c.currentTime + 0.05;
      const tone = (f, at, dur, vol, type = 'sine') => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(vol, at + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
        o.connect(g).connect(c.destination);
        o.start(at); o.stop(at + dur + 0.05);
      };
      if (id === 'gong') [[110, 1], [221, 0.5], [332, 0.3], [445, 0.2], [590, 0.12]].forEach(([f, v]) => tone(f, t, 4, 0.4 * v));
      else if (id === 'digital') { for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) tone(1046, t + r * 0.6 + k * 0.14, 0.09, 0.12, 'square'); }
      else if (id === 'soft') { tone(523.25, t, 1.6, 0.25); tone(783.99, t + 0.25, 1.8, 0.18); tone(1046.5, t + 0.5, 2.2, 0.12); }
      else [660, 880, 990].forEach((f, i) => tone(f, t + i * 0.28, 0.5, 0.35));
    } catch {}
  }

  // Sonidos de fondo: cada uno se "graba" en dos bucles de distinto largo que suenan juntos;
  // como no coinciden, la combinación tarda muchos minutos en repetirse.
  const AMBIENTS = [
    { id: 'none', name: 'Silencio', desc: 'sin fondo' },
    { id: 'rain', name: 'Lluvia', desc: 'suave y constante' },
    { id: 'waves', name: 'Olas', desc: 'mar que no para' },
    { id: 'fire', name: 'Chimenea', desc: 'crepitar cálido' },
    { id: 'brown', name: 'Ruido marrón', desc: 'grave, tapa voces' },
    { id: 'white', name: 'Ruido blanco', desc: 'tapa todo' },
    { id: 'clock', name: 'Tic-tac', desc: 'reloj de estudio' }
  ];
  const FADE = 1.5;
  const LOOPS = { clock: [16], waves: [29, 41] }; // el resto usa [23, 31]
  function noise(c, kind, secs) {
    const n = Math.floor(c.sampleRate * secs), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    let last = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'white') d[i] = w * 0.5;
      else if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else { // rosa
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      }
    }
    return b;
  }
  function layer(c, buf, vol, filters = []) {
    const s = c.createBufferSource(); s.buffer = buf;
    let node = s;
    for (const [type, f, q] of filters) { const bq = c.createBiquadFilter(); bq.type = type; bq.frequency.value = f; if (q) bq.Q.value = q; node.connect(bq); node = bq; }
    const g = c.createGain(); g.gain.value = vol; node.connect(g).connect(c.destination); s.start(0);
    return g;
  }
  function blip(c, at, f, dur, vol, type = 'sine') {
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(c.destination); o.start(at); o.stop(at + dur + 0.01);
  }
  function burst(c, white, at, dur, vol, hp) {
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = white; f.type = 'highpass'; f.frequency.value = hp;
    g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    s.connect(f).connect(g).connect(c.destination); s.start(at, Math.random() * 2, dur + 0.01);
  }
  const RECIPES = {
    white: (c, T) => layer(c, noise(c, 'white', T), 0.6, [['lowpass', 9000]]),
    brown: (c, T) => layer(c, noise(c, 'brown', T), 1),
    rain: (c, T) => {
      layer(c, noise(c, 'pink', T), 0.7, [['highpass', 400], ['lowpass', 7000]]);
      layer(c, noise(c, 'brown', T), 0.5, [['lowpass', 500]]);
      for (let t = 0; t < T; t += 0.02 + Math.random() * 0.1) blip(c, t, 1800 + Math.random() * 2700, 0.03, 0.015 + Math.random() * 0.04);
    },
    waves: (c, T) => {
      // Lecho grave constante: el mar nunca se queda en silencio
      layer(c, noise(c, 'brown', T), 0.6, [['lowpass', 420]]);
      // Agua: olas de duración y fuerza irregulares que suben, rompen y bajan hasta un piso (nunca a cero)
      const wash = c.createBufferSource(); wash.buffer = noise(c, 'pink', T);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.3;
      const g = c.createGain(); wash.connect(lp).connect(g).connect(c.destination); wash.start(0);
      // Espuma: siseo agudo cuando la ola rompe
      const foam = c.createBufferSource(); foam.buffer = noise(c, 'white', T);
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2200;
      const fg = c.createGain(); foam.connect(hp).connect(fg).connect(c.destination); foam.start(0);
      const floor = 0.34;
      g.gain.setValueAtTime(floor, 0); lp.frequency.setValueAtTime(600, 0); fg.gain.setValueAtTime(0.004, 0);
      let t = Math.random() * 1.5;
      while (t < T) {
        const period = 5 + Math.random() * 6, peak = 0.75 + Math.random() * 0.6;
        const rise = period * (0.35 + Math.random() * 0.15), crest = t + rise, end = t + period;
        g.gain.setTargetAtTime(peak, t, rise / 3);
        lp.frequency.setTargetAtTime(1300 + Math.random() * 1500, t, rise / 3);
        fg.gain.setTargetAtTime(0.04 + Math.random() * 0.08, Math.max(t, crest - 0.4), 0.25);
        g.gain.setTargetAtTime(floor + Math.random() * 0.18, crest, (end - crest) / 3);
        lp.frequency.setTargetAtTime(480 + Math.random() * 240, crest, (end - crest) / 3);
        fg.gain.setTargetAtTime(0.004, crest + 0.4, (end - crest) / 4);
        t = end - Math.random() * 1.4; // a veces la ola siguiente llega antes de que termine la anterior
      }
    },
    fire: (c, T) => {
      layer(c, noise(c, 'brown', T), 0.6, [['lowpass', 300]]);
      layer(c, noise(c, 'pink', T), 0.12, [['bandpass', 800, 0.7]]);
      const white = noise(c, 'white', 3);
      for (let t = 0; t < T; t += 0.03 + Math.random() * 0.25) burst(c, white, t, 0.004 + Math.random() * 0.012, 0.15 + Math.random() * 0.5, 1500);
    },
    clock: (c, T) => {
      const white = noise(c, 'white', 3);
      for (let k = 0; k < T; k++) {
        blip(c, k, k % 2 ? 1900 : 2400, 0.02, 0.3);
        burst(c, white, k, 0.012, 0.25, 3000);
      }
    }
  };
  const ambCache = {};
  async function renderLoop(id, loop) {
    const sr = ctx.sampleRate, T = loop + FADE;
    const Off = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const oc = new Off(1, Math.ceil(sr * T), sr);
    RECIPES[id](oc, T);
    const r = await oc.startRendering();
    const src = r.getChannelData(0), n = Math.floor(sr * loop), f = Math.floor(sr * FADE);
    const out = ctx.createBuffer(1, n, sr), d = out.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = src[i];
    // Fundido de potencia constante entre el final y el principio: el bucle no "salta" ni baja de volumen
    for (let i = 0; i < f; i++) { const a = (i / f) * Math.PI / 2; d[i] = src[i] * Math.sin(a) + src[n + i] * Math.cos(a); }
    // Volumen parejo entre sonidos
    let sum = 0, peak = 0;
    for (let i = 0; i < n; i++) { sum += d[i] * d[i]; peak = Math.max(peak, Math.abs(d[i])); }
    const k = Math.min(0.15 / Math.sqrt(sum / n || 1), 0.95 / (peak || 1));
    for (let i = 0; i < n; i++) d[i] *= k;
    return out;
  }
  async function ambBuffers(id) {
    if (!ambCache[id]) ambCache[id] = Promise.all((LOOPS[id] || [23, 31]).map((l) => renderLoop(id, l)));
    try { return await ambCache[id]; } catch (e) { delete ambCache[id]; throw e; }
  }

  // Frecuencias de concentración (en vivo, sin bucles): un acorde suave modulado en amplitud
  // o un binaural (dos tonos apenas distintos en cada oído, requiere auriculares).
  const FREQS = [
    { id: 'none', name: 'Sin frecuencias', desc: 'solo el fondo' },
    { id: 'pulse16', name: 'Pulso 16 Hz', desc: 'beta · sin auriculares' },
    { id: 'bin14', name: 'Binaural 14 Hz', desc: 'beta · con auriculares' },
    { id: 'alpha10', name: 'Alfa 10 Hz', desc: 'calma · descansos' }
  ];

  let amb = { id: null, srcs: [], gain: null }, ambToken = 0, previewTimer = null;
  let freq = { id: null, nodes: [], out: null };
  const ambLevel = () => Math.pow(settings.ambientVol / 100, 2);
  const freqLevel = () => Math.pow(settings.freqVol / 100, 2) * 0.5;
  function stopAmbient(fade = 0.8) {
    if (!amb.gain) return;
    const { srcs, gain } = amb;
    try { gain.gain.cancelScheduledValues(ctx.currentTime); gain.gain.setTargetAtTime(0, ctx.currentTime, fade / 4); srcs.forEach((s) => s.stop(ctx.currentTime + fade)); } catch {}
    amb = { id: null, srcs: [], gain: null };
    renderSounds();
  }
  async function playAmbient(id) {
    if (amb.id === id) return;
    const token = ++ambToken;
    const c = unlockAudio(); if (!c) return;
    let bufs;
    try { bufs = await ambBuffers(id); } catch { return; }
    if (token !== ambToken) return; // otro cambio llegó mientras se generaba
    stopAmbient();
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.setTargetAtTime(ambLevel(), c.currentTime, 0.4);
    gain.connect(c.destination);
    const each = 1 / Math.sqrt(bufs.length);
    const srcs = bufs.map((buf) => {
      const s = c.createBufferSource(), g = c.createGain();
      s.buffer = buf; s.loop = true; g.gain.value = each;
      s.connect(g).connect(gain); s.start(c.currentTime, Math.random() * buf.duration);
      return s;
    });
    amb = { id, srcs, gain };
    renderSounds();
  }

  function stopFreq(fade = 0.8) {
    if (!freq.out) return;
    const { nodes, out } = freq;
    try { out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setTargetAtTime(0, ctx.currentTime, fade / 4); nodes.forEach((n) => n.stop(ctx.currentTime + fade)); } catch {}
    freq = { id: null, nodes: [], out: null };
    renderSounds();
  }
  function playFreq(id) {
    if (freq.id === id) return;
    stopFreq();
    const c = unlockAudio(); if (!c) return;
    const out = c.createGain(), nodes = [];
    out.gain.setValueAtTime(0, c.currentTime);
    out.gain.setTargetAtTime(freqLevel(), c.currentTime, 0.6);
    out.connect(c.destination);
    const osc = (f, type = 'sine', detune = 0) => { const o = c.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune; o.start(); nodes.push(o); return o; };
    if (id === 'bin14') {
      // 200 Hz en el oído izquierdo y 214 Hz en el derecho: el cerebro percibe un latido de 14 Hz
      const merger = c.createChannelMerger(2); merger.connect(out);
      [[200, 0], [214, 1]].forEach(([f, ch]) => { const g = c.createGain(); g.gain.value = 0.5; osc(f).connect(g).connect(merger, 0, ch); });
    } else {
      // Acorde cálido (La mayor abierto), apenas desafinado para que "respire", con filtro que se mueve lento
      const rate = id === 'alpha10' ? 10 : 16;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 850; lp.Q.value = 0.4;
      const am = c.createGain(); am.gain.value = 0.62;
      lp.connect(am).connect(out);
      [110, 164.81, 220, 277.18, 329.63].forEach((f, i) => {
        for (const det of [-5, 5]) { const g = c.createGain(); g.gain.value = 0.11 / (1 + i * 0.45); osc(f, i % 2 ? 'triangle' : 'sine', det).connect(g).connect(lp); }
      });
      // Modulación de amplitud: el volumen late entre 24 % y 100 %, nunca hasta el silencio
      const depth = c.createGain(); depth.gain.value = 0.38; osc(rate).connect(depth).connect(am.gain);
      const sweep = c.createGain(); sweep.gain.value = 260; osc(0.035).connect(sweep).connect(lp.frequency);
    }
    freq = { id, nodes, out };
    renderSounds();
  }

  function wantsSound() { return !!timer && (mode === 'focus' || settings.ambientBreaks); }
  function updateAmbient() {
    if (wantsSound()) {
      clearTimeout(previewTimer); previewTimer = null;
      if (settings.ambient !== 'none') playAmbient(settings.ambient); else { ambToken++; stopAmbient(); }
      if (settings.freq !== 'none') playFreq(settings.freq); else stopFreq();
    } else if (!previewTimer) { ambToken++; stopAmbient(); stopFreq(); }
  }
  function preview(kind, id) {
    if (wantsSound()) { updateAmbient(); return; }
    clearTimeout(previewTimer); previewTimer = null;
    if (kind === 'amb') { if (id === 'none') { ambToken++; stopAmbient(); } else playAmbient(id); }
    else if (id === 'none') stopFreq(); else playFreq(id);
    previewTimer = setTimeout(() => { previewTimer = null; if (!wantsSound()) { ambToken++; stopAmbient(1.5); stopFreq(1.5); } }, 6000);
  }

  function renderSounds() {
    const chip = (x, on, playing) => `<button class="chip${playing ? ' playing' : ''}" data-id="${x.id}" aria-pressed="${on}"><b>${x.name}</b><span>${x.desc}</span></button>`;
    $('#ambients').innerHTML = AMBIENTS.map((a) => chip(a, a.id === settings.ambient, a.id === amb.id)).join('');
    $('#freqs').innerHTML = FREQS.map((a) => chip(a, a.id === settings.freq, a.id === freq.id)).join('');
    $('#alarms').innerHTML = ALARMS.map((a) => chip(a, a.id === settings.alarm, false)).join('');
    $('#amb-vol').value = settings.ambientVol;
    $('#freq-vol').value = settings.freqVol;
    $('#amb-breaks').checked = settings.ambientBreaks;
  }
  $('#ambients').addEventListener('click', (e) => {
    const b = e.target.closest('[data-id]'); if (!b) return;
    settings.ambient = b.dataset.id; store.set('settings', settings);
    renderSounds(); preview('amb', settings.ambient);
  });
  $('#freqs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-id]'); if (!b) return;
    settings.freq = b.dataset.id; store.set('settings', settings);
    renderSounds(); preview('freq', settings.freq);
  });
  $('#freq-vol').addEventListener('input', (e) => {
    settings.freqVol = Number(e.target.value); store.set('settings', settings);
    if (freq.out) freq.out.gain.setTargetAtTime(freqLevel(), ctx.currentTime, 0.05);
  });
  $('#alarms').addEventListener('click', (e) => {
    const b = e.target.closest('[data-id]'); if (!b) return;
    settings.alarm = b.dataset.id; store.set('settings', settings);
    renderSounds(); playAlarm(settings.alarm);
  });
  $('#amb-vol').addEventListener('input', (e) => {
    settings.ambientVol = Number(e.target.value); store.set('settings', settings);
    if (amb.gain) amb.gain.gain.setTargetAtTime(ambLevel(), ctx.currentTime, 0.05);
  });
  $('#amb-breaks').addEventListener('change', (e) => {
    settings.ambientBreaks = e.target.checked; store.set('settings', settings); updateAmbient();
  });

  // ---------- Estilo ----------
  function renderSkins() {
    if (!SKINS.some((s) => s.id === settings.skin)) settings.skin = 'mar';
    document.documentElement.dataset.skin = settings.skin;
    $('#skins').innerHTML = SKINS.map((s) => `
      <button class="chip" data-skin="${s.id}" aria-pressed="${s.id === settings.skin}">
        <span class="swatch" style="background:radial-gradient(120% 140% at 20% 0%, ${s.a[0]}, transparent 60%), linear-gradient(135deg, ${s.a[0]}66, ${s.a[1]}), ${s.bg}"></span>
        <b>${s.name}</b><span>${s.desc}</span>
      </button>`).join('');
  }
  $('#skins').addEventListener('click', (e) => {
    const b = e.target.closest('[data-skin]'); if (!b) return;
    settings.skin = b.dataset.skin; store.set('settings', settings);
    renderSkins(); render();
  });

  function alertDone(msg) {
    if (settings.sound) playAlarm(settings.alarm);
    try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch {}
    try {
      if (settings.notify && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Foco Pomodoro', { body: msg, icon: 'icon.svg' });
      }
    } catch {}
  }

  // ---------- Ritmos y ajustes ----------
  function renderPresets() {
    el.presets.innerHTML = PRESETS.map((p) => {
      const on = p.focus === settings.focus && p.short === settings.short && p.long === settings.long && p.every === settings.every;
      return `<button class="chip" data-preset="${p.id}" aria-pressed="${on}"><b>${p.name}</b><span>${p.focus}/${p.short} min<br>largo ${p.long} cada ${p.every}</span></button>`;
    }).join('');
  }
  function fillForm() {
    for (const k of ['focus', 'short', 'long', 'every']) el.form.elements[k].value = settings[k];
    for (const k of ['autoStart', 'sound', 'notify']) el.form.elements[k].checked = settings[k];
  }
  function applySettings() {
    store.set('settings', settings);
    renderPresets();
    if (!timer) { remaining = total(); }
    if (cycle > settings.every) cycle = 0;
    persist(); render();
  }

  el.presets.addEventListener('click', (e) => {
    const b = e.target.closest('[data-preset]'); if (!b) return;
    const p = PRESETS.find((x) => x.id === b.dataset.preset);
    Object.assign(settings, { focus: p.focus, short: p.short, long: p.long, every: p.every });
    fillForm(); applySettings();
  });
  el.form.addEventListener('submit', (e) => e.preventDefault());
  el.form.addEventListener('change', async (e) => {
    const t = e.target;
    if (t.type === 'number') {
      const v = Math.round(Number(t.value));
      const min = Number(t.min), max = Number(t.max);
      settings[t.name] = Math.min(max, Math.max(min, isFinite(v) ? v : DEFAULTS[t.name]));
      t.value = settings[t.name];
    } else {
      settings[t.name] = t.checked;
      if (t.name === 'notify' && t.checked) {
        try {
          const perm = 'Notification' in window ? await Notification.requestPermission() : 'denied';
          if (perm !== 'granted') { settings.notify = false; t.checked = false; }
        } catch { settings.notify = false; t.checked = false; }
      }
      if (t.name === 'sound' && t.checked) unlockAudio();
    }
    applySettings();
  });

  // ---------- Controles ----------
  el.toggle.addEventListener('click', () => (timer ? pause() : start()));
  el.reset.addEventListener('click', () => { pause(); remaining = total(); persist(); render(); });
  el.skip.addEventListener('click', () => {
    const wasFocus = mode === 'focus';
    if (wasFocus) setMode('short');
    else { if (mode === 'long') cycle = 0; setMode('focus'); }
  });
  document.querySelectorAll('[data-mode-btn]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.modeBtn)));
  el.task.addEventListener('input', () => store.set('task', el.task.value));
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'BUTTON'].includes(document.activeElement.tagName)) {
      e.preventDefault(); timer ? pause() : start();
    }
  });

  // ---------- Materias y cuenta regresiva a finales ----------
  const subById = (id) => subjects.find((s) => s.id === id);
  const subColor = (id) => { const i = subjects.findIndex((s) => s.id === id); return i < 0 ? 'var(--muted)' : SUB_COLORS[i % SUB_COLORS.length]; };
  const isoToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function daysUntil(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return Math.round((new Date(y, m - 1, d) - t) / 86400000);
  }
  function examText(iso) {
    const d = daysUntil(iso);
    if (d === null) return 'Sin fecha de final';
    if (d < 0) return 'El final ya pasó';
    if (d === 0) return 'Final hoy';
    if (d === 1) return 'Final mañana';
    return `Final en ${d} días`;
  }
  function saveSubjects() { store.set('subjects', subjects); store.set('subject', currentSub); }

  function renderSubjectBar() {
    el.subject.innerHTML = '<option value="">Sin materia</option>' +
      subjects.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
    el.subject.value = currentSub;
    const s = subById(currentSub), d = s ? daysUntil(s.exam) : null;
    let msg = '';
    if (s && d !== null && d >= 0) {
      const n = esc(s.name);
      msg = d === 0 ? `¡Hoy es el final de <b>${n}</b>! Vos podés.`
        : d === 1 ? `El final de <b>${n}</b> es <b>mañana</b>`
        : `Faltan <b>${d} días</b> para el final de <b>${n}</b>`;
    }
    el.countdown.innerHTML = msg;
    el.countdown.hidden = !msg;
  }

  function renderSubjects() {
    const order = (s) => { const d = daysUntil(s.exam); return d === null ? 1e6 : d < 0 ? 2e6 - d : d; };
    const list = [...subjects].sort((a, b) => order(a) - order(b));
    el.subjects.innerHTML = list.length
      ? list.map((s) => {
          const d = daysUntil(s.exam), soon = d !== null && d >= 0 && d <= 7;
          return `<li class="${s.id === currentSub ? 'on' : ''}">
            <span class="dot" style="background:${subColor(s.id)}"></span>
            <button class="pick" data-pick="${s.id}"><b>${esc(s.name)}</b><small class="${soon ? 'soon' : ''}">${examText(s.exam)}</small></button>
            <button class="del" data-del-sub="${s.id}" aria-label="Quitar ${esc(s.name)}">×</button>
          </li>`;
        }).join('')
      : '<li class="empty">Todavía no cargaste materias. Empezá por la que tenés más cerca.</li>';
    renderSubjectBar(); renderPlan();
  }

  function setSubject(id) {
    currentSub = id; saveSubjects(); renderSubjects();
  }

  el.subDate.min = isoToday();
  el.subForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = el.subName.value.trim(); if (!name) return;
    if (subjects.length >= 20) { el.subName.setCustomValidity('Máximo 20 materias.'); el.subName.reportValidity(); el.subName.setCustomValidity(''); return; }
    let id;
    do { id = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); } while (subById(id));
    subjects.push({ id, name, exam: el.subDate.value || '' });
    el.subName.value = ''; el.subDate.value = '';
    setSubject(id); renderStats();
  });
  el.subjects.addEventListener('click', async (e) => {
    const pick = e.target.closest('[data-pick]');
    if (pick) { setSubject(pick.dataset.pick); return; }
    const del = e.target.closest('[data-del-sub]'); if (!del) return;
    const s = subById(del.dataset.delSub); if (!s) return;
    if (await ask(`¿Quitar "${s.name}"? Sus pomodoros quedan en el historial como "Sin materia".`)) {
      subjects = subjects.filter((x) => x.id !== s.id);
      if (currentSub === s.id) currentSub = '';
      saveSubjects(); renderSubjects(); renderStats();
    }
  });
  el.subject.addEventListener('change', () => setSubject(el.subject.value));

  // ---------- Plan de estudio ----------
  // Para cada materia con final: temas que faltan × pomodoros por tema, repartidos en los días
  // que quedan. El día antes del final queda libre para repasar (si hay 3 días o más).
  const openPlans = new Set();
  const topicsOf = (s) => (Array.isArray(s.topics) ? s.topics : (s.topics = []));
  const perTopicOf = (s) => s.perTopic || 3;
  const doneToday = (subId) => { const k = dayKey(Date.now()); return log.filter((x) => x.sub === subId && dayKey(x.ts) === k).length; };
  function planFor(s) {
    const d = daysUntil(s.exam);
    const topics = topicsOf(s), total = topics.length, left = topics.filter((t) => !t.done).length;
    const done = doneToday(s.id);
    const base = { d, total, left, done, next: topics.find((t) => !t.done) || null };
    if (d === null) return { ...base, kind: 'nodate', target: 0 };
    if (d < 0) return { ...base, kind: 'past', target: 0 };
    if (d === 0) return { ...base, kind: 'exam', target: 0 };
    if (!total) return { ...base, kind: 'notopics', target: 0 };
    if (!left) return { ...base, kind: 'ready', target: 0 };
    const studyDays = d >= 3 ? d - 1 : d;
    const target = Math.ceil((left * perTopicOf(s)) / studyDays);
    const kind = target <= 6 ? 'ok' : target <= 10 ? 'warn' : 'bad';
    return { ...base, kind, target, studyDays };
  }
  const STATUS = {
    ok: ['ok', 'En ritmo'], warn: ['warn', 'Exigente'], bad: ['bad', 'Muy ajustado'],
    ready: ['ok', 'Temas listos · repasá'],
    exam: ['ok', '¡Hoy es el final!'], notopics: ['muted', 'Faltan los temas'], nodate: ['muted', 'Sin fecha'], past: ['muted', 'Final pasado']
  };

  function renderPlan() {
    const box = $('#plan'), top = $('#plan-today'); if (!box) return;
    if (!subjects.length) {
      top.innerHTML = '';
      box.innerHTML = '<p class="empty">Primero cargá tus materias (más abajo, en "Materias") con la fecha del final.</p>';
      return;
    }
    const order = (p) => (p.d === null ? 1e6 : p.d < 0 ? 2e6 : p.d);
    const plans = subjects.map((s) => ({ s, p: planFor(s) })).sort((a, b) => order(a.p) - order(b.p));
    const active = plans.filter(({ p }) => p.target > 0);
    const goal = active.reduce((n, { p }) => n + p.target, 0);
    const got = active.reduce((n, { p }) => n + Math.min(p.done, p.target), 0);
    top.innerHTML = goal
      ? `<div class="plan-goal"><b>${got}</b><span>/ ${goal}</span></div>
         <div class="plan-goal-txt"><strong>${got >= goal ? '¡Plan de hoy cumplido!' : 'pomodoros del plan de hoy'}</strong>
         <span class="track-h"><i style="width:${Math.min(100, (got / goal) * 100)}%"></i></span></div>`
      : '';

    box.innerHTML = plans.map(({ s, p }) => {
      const [cls, label] = STATUS[p.kind];
      const color = subColor(s.id);
      const pct = p.total ? Math.round(((p.total - p.left) / p.total) * 100) : 0;
      const when = p.d === null ? 'Sin fecha de final' : examText(s.exam);
      const todayLine = p.target
        ? `<div class="plan-today-row"><b>${Math.min(p.done, 99)}</b><span>/ ${p.target} hoy</span>${p.done >= p.target ? '<em class="st ok">Hoy cumplido ✓</em>' : ''}</div>`
        : '';
      const next = p.next && p.kind !== 'past'
        ? `<div class="plan-next"><span>Próximo tema</span><b>${esc(p.next.name)}</b>
             <button class="add sm" data-study="${s.id}|${p.next.id}">Estudiar</button></div>`
        : '';
      const topics = topicsOf(s).map((t) => `
        <li class="${t.done ? 'done' : ''}">
          <label><input type="checkbox" data-toggle="${s.id}|${t.id}" ${t.done ? 'checked' : ''}><span>${esc(t.name)}</span></label>
          <button class="del" data-del-topic="${s.id}|${t.id}" aria-label="Quitar tema">×</button>
        </li>`).join('');
      const open = openPlans.has(s.id) || p.kind === 'notopics' || p.kind === 'nodate';
      return `
        <article class="plan-card st-${cls}" data-plan="${s.id}">
          <header>
            <span class="dot" style="background:${color}"></span>
            <div class="plan-title"><b>${esc(s.name)}</b><small>${when}</small></div>
            <em class="st ${cls}">${label}</em>
          </header>
          ${todayLine}
          ${p.total ? `<div class="plan-progress"><span class="track-h"><i style="width:${pct}%;background:${color}"></i></span><small>${p.total - p.left} de ${p.total} temas listos</small></div>` : ''}
          ${next}
          <details ${open ? 'open' : ''} data-details="${s.id}">
            <summary>Temas y ajustes</summary>
            <ul class="topics">${topics || '<li class="empty">Sin temas todavía.</li>'}</ul>
            <form class="row topic-form" data-add-topic="${s.id}">
              <input type="text" maxlength="400" placeholder="Ej: Límites, Derivadas, Integrales" aria-label="Nuevos temas (separalos con coma)">
              <button class="add" type="submit">Agregar</button>
            </form>
            <div class="plan-settings">
              <label>Pomodoros por tema<input type="number" min="1" max="12" value="${perTopicOf(s)}" data-per="${s.id}"></label>
              <label>Fecha del final<input type="date" value="${s.exam || ''}" min="${isoToday()}" data-exam="${s.id}"></label>
            </div>
          </details>
        </article>`;
    }).join('');
  }

  function findTopic(ref) {
    const [sid, tid] = ref.split('|'); const s = subById(sid);
    return s ? { s, t: topicsOf(s).find((x) => x.id === tid) } : {};
  }
  $('#plan').addEventListener('toggle', (e) => {
    const d = e.target.closest('[data-details]'); if (!d) return;
    d.open ? openPlans.add(d.dataset.details) : openPlans.delete(d.dataset.details);
  }, true);
  $('#plan').addEventListener('submit', (e) => {
    const f = e.target.closest('[data-add-topic]'); if (!f) return;
    e.preventDefault();
    const s = subById(f.dataset.addTopic); const input = f.querySelector('input');
    const names = input.value.split(/[,\n;]+/).map((x) => x.trim()).filter(Boolean).slice(0, 50);
    if (!s || !names.length) return;
    const list = topicsOf(s);
    for (const name of names) {
      if (list.length >= 80) break;
      list.push({ id: 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: name.slice(0, 80), done: false });
    }
    openPlans.add(s.id); saveSubjects(); renderPlan();
    const again = document.querySelector(`[data-add-topic="${s.id}"] input`); if (again) again.focus();
  });
  // Pegar una lista (un tema por renglón) en el campo: los renglones pasan a ser comas
  $('#plan').addEventListener('paste', (e) => {
    const input = e.target.closest('[data-add-topic] input'); if (!input) return;
    const text = (e.clipboardData || window.clipboardData)?.getData('text') || '';
    if (!/[\r\n]/.test(text)) return;
    e.preventDefault();
    const items = text.split(/\r?\n/).map((x) => x.replace(/^\s*(?:[-•*·]|\d+[.)])\s*/, '').trim()).filter(Boolean).join(', ');
    const { selectionStart: a, selectionEnd: b, value } = input;
    input.value = (value.slice(0, a) + (value.slice(0, a).trim() ? ', ' : '') + items + value.slice(b)).slice(0, 400);
  });
  $('#plan').addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.toggle) { const { t: topic } = findTopic(t.dataset.toggle); if (topic) { topic.done = t.checked; saveSubjects(); renderPlan(); } }
    else if (t.dataset.per) {
      const s = subById(t.dataset.per); if (!s) return;
      s.perTopic = Math.min(12, Math.max(1, Math.round(Number(t.value)) || 3)); saveSubjects(); renderPlan();
    } else if (t.dataset.exam !== undefined) {
      const s = subById(t.dataset.exam); if (!s) return;
      s.exam = t.value || ''; saveSubjects(); renderSubjects();
    }
  });
  $('#plan').addEventListener('click', (e) => {
    const del = e.target.closest('[data-del-topic]');
    if (del) {
      const { s, t } = findTopic(del.dataset.delTopic);
      if (s && t) { s.topics = topicsOf(s).filter((x) => x !== t); saveSubjects(); renderPlan(); }
      return;
    }
    const study = e.target.closest('[data-study]'); if (!study) return;
    const { s, t } = findTopic(study.dataset.study); if (!s || !t) return;
    el.task.value = t.name; store.set('task', t.name);
    setSubject(s.id);
    if (mode !== 'focus') setMode('focus');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ---------- Modo zen ----------
  // Pantalla completa con solo el reloj; los controles se esconden tras 3 s sin actividad
  // y la pantalla no se apaga (Wake Lock) mientras dure.
  const zenBtn = $('#zen');
  let wakeLock = null, idleTimer = null;
  const isZen = () => document.body.classList.contains('zen');
  async function keepAwake(on) {
    try {
      if (on && 'wakeLock' in navigator && document.visibilityState === 'visible' && !wakeLock) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      } else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
    } catch { wakeLock = null; }
  }
  function poke() {
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    if (isZen()) idleTimer = setTimeout(() => document.body.classList.add('idle'), 3000);
  }
  function setZen(on) {
    if (on === isZen()) return;
    document.body.classList.toggle('zen', on);
    zenBtn.setAttribute('aria-pressed', on);
    zenBtn.setAttribute('aria-label', on ? 'Salir del modo zen (Esc)' : 'Modo zen (Z)');
    zenBtn.title = zenBtn.getAttribute('aria-label');
    render();
    if (on) {
      window.scrollTo(0, 0);
      const root = document.documentElement;
      if (root.requestFullscreen && !document.fullscreenElement) root.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
      keepAwake(true); poke();
    } else {
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
      keepAwake(false); clearTimeout(idleTimer); document.body.classList.remove('idle');
    }
  }
  zenBtn.addEventListener('click', () => setZen(!isZen()));
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && isZen()) setZen(false); });
  document.addEventListener('visibilitychange', () => { if (isZen() && document.visibilityState === 'visible') keepAwake(true); });
  ['pointermove', 'pointerdown', 'keydown', 'touchstart'].forEach((ev) => document.addEventListener(ev, () => { if (isZen()) poke(); }, { passive: true }));
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    if (e.key === 'Escape' && isZen()) setZen(false);
    else if ((e.key === 'z' || e.key === 'Z') && !e.ctrlKey && !e.metaKey && !e.altKey) setZen(!isZen());
  });

  // ---------- Distracciones ----------
  const esc =(s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function renderNotes() {
    el.notes.innerHTML = notes.length
      ? notes.map((n, i) => `<li><span>${esc(n.t)}</span><button data-del="${i}" aria-label="Quitar">×</button></li>`).join('')
      : '<li class="empty">Nada anotado. Bien ahí.</li>';
  }
  el.noteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const t = el.note.value.trim(); if (!t) return;
    notes.unshift({ ts: Date.now(), t }); el.note.value = '';
    store.set('notes', notes); renderNotes();
  });
  el.notes.addEventListener('click', (e) => {
    const b = e.target.closest('[data-del]'); if (!b) return;
    notes.splice(Number(b.dataset.del), 1); store.set('notes', notes); renderNotes();
  });

  // ---------- Estadísticas ----------
  const dayKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`; };
  function renderStats() {
    renderPlan();
    const byDay = {};
    for (const s of log) { const k = dayKey(s.ts); (byDay[k] ||= { n: 0, min: 0 }); byDay[k].n++; byDay[k].min += s.min; }
    const today = byDay[dayKey(Date.now())] || { n: 0, min: 0 };
    $('#s-today').textContent = today.n;
    $('#s-min').textContent = today.min;

    let streak = 0; const d = new Date();
    if (!byDay[dayKey(d)]) d.setDate(d.getDate() - 1);
    while (byDay[dayKey(d)]) { streak++; d.setDate(d.getDate() - 1); }
    $('#s-streak').textContent = streak;

    const days = Array.from({ length: 7 }, (_, i) => { const x = new Date(); x.setDate(x.getDate() - (6 - i)); return x; });
    const vals = days.map((x) => (byDay[dayKey(x)] || { n: 0 }).n);
    const max = Math.max(1, ...vals);
    const names = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    el.week.innerHTML = days.map((x, i) => `
      <div class="col ${i === 6 ? 'today' : ''}">
        <span class="n">${vals[i] || ''}</span>
        <div class="bar-wrap"><div class="bar" style="height:${(vals[i] / max) * 100}%"></div></div>
        <small>${i === 6 ? 'Hoy' : names[x.getDay()]}</small>
      </div>`).join('');

    // Minutos por materia en los últimos 7 días
    const from = days[0]; from.setHours(0, 0, 0, 0);
    const per = {};
    for (const s of log) {
      if (s.ts < from.getTime()) continue;
      const k = subById(s.sub) ? s.sub : '';
      per[k] = (per[k] || 0) + s.min;
    }
    const rows = Object.entries(per).sort((a, b) => b[1] - a[1]);
    const top = Math.max(1, ...rows.map((r) => r[1]));
    const hm = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}` : `${m} min`);
    el.bySubject.innerHTML = rows.length
      ? rows.map(([id, m]) => {
          const s = subById(id), c = subColor(id);
          return `<li><span class="name"><span class="dot" style="background:${c}"></span>${s ? esc(s.name) : 'Sin materia'}</span><em>${hm(m)}</em>
            <span class="track-h"><i style="width:${(m / top) * 100}%;background:${c}"></i></span></li>`;
        }).join('')
      : '<li class="empty">Cuando completes pomodoros vas a ver acá cuánto le dedicaste a cada materia.</li>';

    const recent = log.slice(-8).reverse();
    el.history.innerHTML = recent.length
      ? recent.map((s) => {
          const t = new Date(s.ts);
          const when = t.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }) + ' ' + t.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
          const sub = subById(s.sub);
          const what = [sub ? sub.name : '', s.task].filter(Boolean).map(esc).join(' · ') || 'Sin tarea';
          return `<li><span>${what}</span><em>${s.min} min</em><time>${when}</time></li>`;
        }).join('')
      : '<li class="empty">Todavía no completaste pomodoros. El primero es el más difícil.</li>';
  }

  // ---------- Diálogo propio (sin confirm()) ----------
  function ask(msg) {
    return new Promise((res) => {
      const d = $('#dialog'); $('#dialog-msg').textContent = msg; d.hidden = false;
      const done = (v) => { d.hidden = true; $('#dialog-yes').onclick = $('#dialog-no').onclick = null; res(v); };
      $('#dialog-yes').onclick = () => done(true);
      $('#dialog-no').onclick = () => done(false);
    });
  }
  $('#clear').addEventListener('click', async () => {
    if (await ask('¿Borrar todo el historial de pomodoros? No se puede deshacer.')) {
      log = []; store.set('log', log); renderStats();
    }
  });

  // ---------- PWA: instalación y uso offline ----------
  try {
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      // Si ya había una versión instalada y llega una nueva, recargar una vez para mostrarla
      // (salvo que haya un pomodoro corriendo: en ese caso se aplica en la próxima apertura).
      const hadController = !!navigator.serviceWorker.controller;
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController || reloading || timer) return;
        reloading = true; location.reload();
      });
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
        // Buscar actualizaciones cada vez que se vuelve a la app
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update().catch(() => {});
        });
      }).catch(() => {});
    }
  } catch {}

  fillForm(); renderPresets(); renderSkins(); renderSounds(); renderNotes(); renderSubjects(); renderStats(); render();
}
