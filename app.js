{
  // ---------- Almacenamiento seguro ----------
  // Lo que se sincroniza con la cuenta Pro: se anota cuándo cambió y se avisa a account.js
  const SYNC_KEYS = ['settings', 'log', 'subjects', 'notes'];
  const store = {
    get(k, d) { try { const v = localStorage.getItem('pf:' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) {
      try {
        localStorage.setItem('pf:' + k, JSON.stringify(v));
        if (SYNC_KEYS.includes(k)) {
          const m = JSON.parse(localStorage.getItem('pf:mtime') || '{}'); m[k] = Date.now();
          localStorage.setItem('pf:mtime', JSON.stringify(m));
          window.dispatchEvent(new CustomEvent('foco:saved', { detail: k }));
        }
      } catch {}
    }
  };
  // Foco Pro: lo confirma account.js (con la cuenta); mientras tanto se usa lo último conocido
  let pro = !!store.get('pro', null);
  const isPro = () => pro;
  const paywall = (why) => window.dispatchEvent(new CustomEvent('foco:paywall', { detail: why }));

  const PRESETS = [
    { id: 'clasico', name: 'Clásico', focus: 25, short: 5, long: 15, every: 4 },
    { id: 'suave', name: 'Arranque suave', focus: 15, short: 3, long: 10, every: 4 },
    { id: 'profundo', name: 'Profundo', focus: 50, short: 10, long: 30, every: 3 },
    { id: 'flow', name: 'Flow', focus: 90, short: 20, long: 30, every: 2 }
  ];
  const LABELS = { focus: 'Tiempo de foco', short: 'Descanso corto', long: 'Descanso largo' };
  const DEFAULTS = {
    focus: 25, short: 5, long: 15, every: 4, autoStart: false, sound: true, notify: false,
    ambient: 'none', ambientVol: 50, ambientBreaks: false, music: 'none', musicVol: 45, freq: 'none', freqVol: 60, alarm: 'bell', skin: 'mar'
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
    emitState();
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
    { id: 'clock', name: 'Tic-tac', desc: 'reloj de estudio' },
    // Pro: grabaciones reales (archivos en /sonidos, armados como bucles sin corte)
    { id: 'cafe', name: 'Café', desc: 'murmullo y tazas', pro: true, file: 'sonidos/cafe.mp3' },
    { id: 'storm', name: 'Tormenta', desc: 'lluvia y truenos', pro: true, file: 'sonidos/tormenta.mp3' },
    { id: 'stream', name: 'Arroyo', desc: 'agua que corre', pro: true, file: 'sonidos/arroyo.mp3' },
    { id: 'night', name: 'Noche de campo', desc: 'grillos y brisa', pro: true, file: 'sonidos/noche.mp3' }
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
    },
    // ---- Pro ----
    cafe: (c, T) => {
      // Murmullo: varias "voces" de ruido filtrado en la zona del habla que suben y bajan sin entenderse
      layer(c, noise(c, 'brown', T), 0.35, [['lowpass', 260]]);
      for (let v = 0; v < 5; v++) {
        const s = c.createBufferSource(); s.buffer = noise(c, 'pink', T);
        const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 350 + v * 170; bp.Q.value = 1.6;
        const g = c.createGain(); s.connect(bp).connect(g).connect(c.destination); s.start(0);
        g.gain.setValueAtTime(0.05, 0);
        for (let t = Math.random(); t < T; t += 0.15 + Math.random() * 0.35) g.gain.setTargetAtTime(0.03 + Math.random() * 0.22, t, 0.06);
      }
      // Tazas y cucharitas, de vez en cuando
      for (let t = 1 + Math.random() * 3; t < T; t += 2.5 + Math.random() * 6) {
        const f = 2600 + Math.random() * 1800, n = 1 + Math.floor(Math.random() * 3);
        for (let k = 0; k < n; k++) { blip(c, t + k * 0.11, f, 0.35, 0.025 + Math.random() * 0.03); blip(c, t + k * 0.11, f * 2.7, 0.18, 0.01); }
      }
    },
    storm: (c, T) => {
      layer(c, noise(c, 'pink', T), 0.75, [['highpass', 300], ['lowpass', 6000]]);
      layer(c, noise(c, 'brown', T), 0.55, [['lowpass', 600]]);
      for (let t = 0; t < T; t += 0.015 + Math.random() * 0.06) blip(c, t, 1500 + Math.random() * 3000, 0.03, 0.01 + Math.random() * 0.035);
      // Truenos lejanos: retumbe grave que crece y se apaga despacio
      const s = c.createBufferSource(); s.buffer = noise(c, 'brown', T);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 140;
      const g = c.createGain(); s.connect(lp).connect(g).connect(c.destination); s.start(0);
      g.gain.setValueAtTime(0.05, 0);
      for (let t = 2 + Math.random() * 5; t < T - 4; t += 9 + Math.random() * 12) {
        const peak = 0.9 + Math.random() * 1.1;
        g.gain.setTargetAtTime(peak, t, 0.35 + Math.random() * 0.4);
        g.gain.setTargetAtTime(0.05, t + 1.2 + Math.random() * 1.2, 1.2 + Math.random());
      }
    },
    stream: (c, T) => {
      layer(c, noise(c, 'brown', T), 0.45, [['lowpass', 380]]);
      // Agua que corre: borboteo rápido en medios y agudos
      for (const [f, q, base] of [[900, 1.2, 0.18], [1700, 1.5, 0.12], [3200, 1.1, 0.06]]) {
        const s = c.createBufferSource(); s.buffer = noise(c, 'white', T);
        const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
        const g = c.createGain(); s.connect(bp).connect(g).connect(c.destination); s.start(0);
        g.gain.setValueAtTime(base, 0);
        for (let t = 0; t < T; t += 0.04 + Math.random() * 0.12) {
          g.gain.setTargetAtTime(base * (0.45 + Math.random() * 1.1), t, 0.03);
          bp.frequency.setTargetAtTime(f * (0.8 + Math.random() * 0.45), t, 0.05);
        }
      }
      for (let t = 0; t < T; t += 0.08 + Math.random() * 0.5) blip(c, t, 500 + Math.random() * 900, 0.06, 0.01 + Math.random() * 0.02);
    },
    night: (c, T) => {
      // Brisa suave que va y viene
      const s = c.createBufferSource(); s.buffer = noise(c, 'pink', T);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
      const g = c.createGain(); s.connect(lp).connect(g).connect(c.destination); s.start(0);
      g.gain.setValueAtTime(0.25, 0);
      for (let t = 0; t < T; t += 3 + Math.random() * 4) { g.gain.setTargetAtTime(0.15 + Math.random() * 0.3, t, 1.2); lp.frequency.setTargetAtTime(450 + Math.random() * 600, t, 1.5); }
      // Grillos: trinos cortos en grupos, dos "grillos" con tonos y ritmos distintos
      for (const [f, gap, vol] of [[4300, 0.9, 0.035], [4900, 1.35, 0.022]]) {
        for (let t = Math.random() * gap; t < T; t += gap * (0.85 + Math.random() * 0.3)) {
          if (Math.random() < 0.12) continue; // pausas naturales
          for (let k = 0; k < 3 + Math.floor(Math.random() * 2); k++) blip(c, t + k * 0.055, f + Math.random() * 60, 0.04, vol);
        }
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
  // Grabación real: se descarga una vez (queda guardada para usar sin internet) y se iguala el volumen
  async function loadRecording(file) {
    const res = await fetch(file);
    if (!res.ok) throw new Error('no se pudo cargar el sonido');
    const buf = await ctx.decodeAudioData(await res.arrayBuffer());
    let sum = 0, n = 0, peak = 0;
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < d.length; i += 4) { sum += d[i] * d[i]; n++; peak = Math.max(peak, Math.abs(d[i])); }
    }
    const k = Math.min(0.15 / Math.sqrt(sum / n || 1), 0.95 / (peak || 1));
    for (let ch = 0; ch < buf.numberOfChannels; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] *= k; }
    return [buf];
  }
  async function ambBuffers(id) {
    const rec = AMBIENTS.find((a) => a.id === id && a.file);
    if (!ambCache[id]) ambCache[id] = rec
      ? loadRecording(rec.file).catch(() => Promise.all([23, 31].map((l) => renderLoop(id, l)))) // sin internet: versión sintetizada
      : Promise.all((LOOPS[id] || [23, 31]).map((l) => renderLoop(id, l)));
    try { return await ambCache[id]; } catch (e) { delete ambCache[id]; throw e; }
  }

  // Frecuencias de concentración (en vivo, sin bucles). Tres tipos:
  //  · pulso: acorde cálido cuyo volumen late al ritmo elegido (no necesita auriculares)
  //  · binaural: un tono distinto en cada oído, el cerebro percibe la diferencia (con auriculares)
  //  · fondo modulado: hace latir el propio sonido de fondo, como la música de brain.fm
  const FREQS = [
    { id: 'none', name: 'Sin frecuencias', desc: 'solo el fondo' },
    { id: 'mod16', name: 'Fondo modulado', desc: 'el fondo late a 16 Hz' },
    { id: 'pulse16', name: 'Pulso beta 16 Hz', desc: 'foco · sin auriculares' },
    { id: 'gamma40', name: 'Gamma 40 Hz', desc: 'foco intenso · sin auriculares' },
    { id: 'bin14', name: 'Binaural beta 14 Hz', desc: 'foco · con auriculares' },
    { id: 'alpha10', name: 'Pulso alfa 10 Hz', desc: 'calma · descansos' },
    { id: 'binAlpha10', name: 'Binaural alfa 10 Hz', desc: 'calma · con auriculares' },
    { id: 'theta6', name: 'Binaural theta 6 Hz', desc: 'relajación profunda' },
    { id: 'smr12', name: 'Pulso SMR 12 Hz', desc: 'foco relajado', pro: true },
    { id: 'pulse18', name: 'Beta alta 18 Hz', desc: 'tareas exigentes', pro: true },
    { id: 'bin40', name: 'Binaural gamma 40 Hz', desc: 'foco intenso · auriculares', pro: true }
  ];
  const FREQ_SPEC = {
    pulse16: { kind: 'pulse', rate: 16, depth: 0.14 },
    gamma40: { kind: 'pulse', rate: 40, depth: 0.1 },
    alpha10: { kind: 'pulse', rate: 10, depth: 0.16 },
    bin14: { kind: 'bin', base: 150, beat: 14 },
    binAlpha10: { kind: 'bin', base: 150, beat: 10 },
    theta6: { kind: 'bin', base: 140, beat: 6 },
    smr12: { kind: 'pulse', rate: 12, depth: 0.14 },
    pulse18: { kind: 'pulse', rate: 18, depth: 0.12 },
    bin40: { kind: 'bin', base: 160, beat: 40 },
    mod16: { kind: 'mod', rate: 16, depth: 0.14 }
  };

  // ---------- Cadena de audio ----------
  // fondo → modulador → ecualizador "relajante" → compresor ─┬─ seco ──────────┐
  //                                                          └─ reverb suave ──┼→ limitador → parlantes
  // frecuencias → ecualizador suave ─────────────────────────┴─ (y algo de reverb)
  let bus = null;
  function impulse(c, secs = 2.6) {
    const n = Math.floor(c.sampleRate * secs), b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch); let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        lp = lp * 0.6 + (Math.random() * 2 - 1) * 0.4;            // cola algo opaca: suena cálida, no metálica
        d[i] = lp * Math.pow(1 - t, 2.6) * (i < c.sampleRate * 0.012 ? i / (c.sampleRate * 0.012) : 1);
      }
    }
    return b;
  }
  function getBus() {
    if (bus) return bus;
    const c = unlockAudio(); if (!c) return null;
    const biq = (type, f, gain = 0, q = 0.7) => { const n = c.createBiquadFilter(); n.type = type; n.frequency.value = f; n.gain.value = gain; n.Q.value = q; return n; };
    // Limitador final: nada distorsiona aunque todo esté al máximo
    const limiter = c.createDynamicsCompressor();
    limiter.threshold.value = -3; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.003; limiter.release.value = 0.25;
    const trim = c.createGain(); trim.gain.value = 0.88; // margen para que los picos nunca lleguen al tope
    limiter.connect(trim).connect(c.destination);
    const reverb = c.createConvolver(); reverb.buffer = impulse(c);
    const wet = c.createGain(); wet.gain.value = 0.22; reverb.connect(wet).connect(limiter);
    // Fondo
    const ambIn = c.createGain();
    const ambMod = c.createGain(); ambMod.gain.value = 1;
    const eq = [
      biq('highpass', 35, 0, 0.7),       // fuera retumbe que no se oye pero cansa
      biq('lowshelf', 180, 2.5),         // graves cálidos
      biq('peaking', 2900, -3.5, 0.9),   // zona más sensible y fatigante del oído
      biq('highshelf', 7500, -5),        // agudos ásperos más suaves
      biq('lowpass', 14000, 0, 0.5)
    ];
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -22; comp.knee.value = 12; comp.ratio.value = 2.5; comp.attack.value = 0.03; comp.release.value = 0.4;
    let node = ambIn.connect(ambMod);
    for (const f of eq) node = node.connect(f);
    node.connect(comp);
    const ambDry = c.createGain(); ambDry.gain.value = 1;
    comp.connect(ambDry).connect(limiter);
    const ambSend = c.createGain(); ambSend.gain.value = 0.55; comp.connect(ambSend).connect(reverb);
    // Frecuencias
    const fIn = c.createGain();
    const fEq = biq('highshelf', 5000, -4);
    fIn.connect(fEq).connect(limiter);
    const fSend = c.createGain(); fSend.gain.value = 0.35; fEq.connect(fSend).connect(reverb);
    // Música: cadena limpia (sin el EQ oscuro del fondo), compresor suave y un poco de reverb
    const musIn = c.createGain();
    const musMod = c.createGain(); musMod.gain.value = 1;
    const musEq = biq('highshelf', 9000, -2);
    const musComp = c.createDynamicsCompressor();
    musComp.threshold.value = -24; musComp.knee.value = 10; musComp.ratio.value = 2; musComp.attack.value = 0.02; musComp.release.value = 0.3;
    musIn.connect(musMod).connect(musEq).connect(musComp).connect(limiter);
    const musSend = c.createGain(); musSend.gain.value = 0.12; musComp.connect(musSend).connect(reverb);
    return (bus = { ambIn, ambMod, fIn, musIn, musMod });
  }

  let amb = { id: null, srcs: [], gain: null }, ambToken = 0, previewTimer = null;
  let freq = { id: null, nodes: [], out: null };
  const ambLevel = () => Math.pow(settings.ambientVol / 100, 2) * 1.15;
  const freqLevel = () => Math.pow(settings.freqVol / 100, 1.6) * 1.5;
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
    const b = getBus(); if (!b) return;
    let bufs;
    try { bufs = await ambBuffers(id); } catch { return; }
    if (token !== ambToken) return; // otro cambio llegó mientras se generaba
    stopAmbient();
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.setTargetAtTime(ambLevel(), c.currentTime, 0.4);
    gain.connect(b.ambIn);
    const each = 1 / Math.sqrt(bufs.length);
    // Cada bucle va hacia un lado: sonido envolvente y menos repetitivo
    const pans = bufs.length > 1 ? [-0.55, 0.55] : [0];
    const srcs = bufs.map((buf, i) => {
      const s = c.createBufferSource(), g = c.createGain();
      s.buffer = buf; s.loop = true; g.gain.value = each;
      let tail = s.connect(g);
      if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pans[i] || 0; tail = tail.connect(p); }
      tail.connect(gain); s.start(c.currentTime, Math.random() * buf.duration);
      return s;
    });
    amb = { id, srcs, gain };
    renderSounds();
  }

  function stopFreq(fade = 0.8) {
    if (!freq.out) return;
    const { nodes, out, id } = freq;
    try {
      const t = ctx.currentTime;
      out.gain.cancelScheduledValues(t); out.gain.setTargetAtTime(0, t, fade / 4);
      nodes.forEach((n) => n.stop(t + fade));
      if (id === 'mod16' && bus) for (const g of [bus.ambMod, bus.musMod]) { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(1, t, fade / 4); }
    } catch {}
    freq = { id: null, nodes: [], out: null };
    renderSounds();
  }
  function pad(c, dest, nodes, { bright = false, level = 1 } = {}) {
    // Acorde cálido (La mayor abierto con 9na), apenas desafinado para que "respire"
    const osc = (f, type, detune) => { const o = c.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune; o.start(); nodes.push(o); return o; };
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = bright ? 1100 : 650; lp.Q.value = 0.4;
    lp.connect(dest);
    [55, 110, 164.81, 220, 277.18, 329.63, 493.88].forEach((f, i) => {
      for (const det of [-6, 6]) {
        const g = c.createGain(); g.gain.value = (i === 0 ? 0.16 : 0.2 / (1 + i * 0.4)) * level;
        osc(f, i % 2 ? 'triangle' : 'sine', det).connect(g).connect(lp);
      }
    });
    const sweep = c.createGain(); sweep.gain.value = bright ? 500 : 300;
    const o = c.createOscillator(); o.frequency.value = 0.035; o.start(); nodes.push(o); o.connect(sweep).connect(lp.frequency);
  }
  function playFreq(id) {
    if (freq.id === id) return;
    stopFreq();
    const c = unlockAudio(); if (!c) return;
    const b = getBus(); if (!b) return;
    const spec = FREQ_SPEC[id]; if (!spec) return;
    const out = c.createGain(), nodes = [];
    out.gain.setValueAtTime(0, c.currentTime);
    out.gain.setTargetAtTime(freqLevel(), c.currentTime, 0.6);
    out.connect(b.fIn);
    const lfo = (rate, depth, param) => {
      const o = c.createOscillator(); o.frequency.value = rate; o.start(); nodes.push(o);
      const g = c.createGain(); g.gain.value = depth; o.connect(g).connect(param);
    };
    if (spec.kind === 'bin') {
      // Tono base en el oído izquierdo y base + latido en el derecho, sobre un acorde suave sin pulso
      const merger = c.createChannelMerger(2); merger.connect(out);
      [[spec.base, 0], [spec.base + spec.beat, 1]].forEach(([f, ch]) => {
        const o = c.createOscillator(); o.frequency.value = f; o.start(); nodes.push(o);
        const g = c.createGain(); g.gain.value = 0.16; o.connect(g).connect(merger, 0, ch);
      });
      const soft = c.createGain(); soft.gain.value = 0.45; soft.connect(out);
      pad(c, soft, nodes);
    } else if (spec.kind === 'pulse') {
      // El volumen del acorde late entre ~25 % y 100 %, nunca hasta el silencio
      const am = c.createGain(); am.gain.value = 1 - spec.depth; am.connect(out);
      lfo(spec.rate, spec.depth, am.gain);
      pad(c, am, nodes, { bright: spec.bright });
    } else if (spec.kind === 'mod') {
      // Hace latir el sonido de fondo; si no hay fondo elegido, late un acorde suave
      b.ambMod.gain.setValueAtTime(1 - spec.depth, c.currentTime);
      lfo(spec.rate, spec.depth, b.ambMod.gain);
      // también la música, como brain.fm
      b.musMod.gain.setValueAtTime(1 - spec.depth, c.currentTime);
      lfo(spec.rate, spec.depth, b.musMod.gain);
      if (settings.ambient === 'none' && settings.music === 'none') {
        const am = c.createGain(); am.gain.value = 1 - spec.depth; am.connect(out);
        lfo(spec.rate, spec.depth, am.gain);
        pad(c, am, nodes);
      }
    }
    freq = { id, nodes, out };
    renderSounds();
  }

  // ---------- Música para estudiar (grabaciones con licencia libre; ver musica/CREDITOS.md) ----------
  const T = (file, title, by) => ({ file: 'musica/' + file, title, by });
  const MUSIC = [
    { id: 'none', name: 'Sin música', desc: 'solo el fondo' },
    { id: 'piano', name: 'Piano clásico', desc: 'Satie, Chopin, Debussy, Bach', tracks: [
      T('satie-gymnopedie-1.mp3', 'Gymnopédie n.º 1', 'Erik Satie'),
      T('satie-gymnopedie-3.mp3', 'Gymnopédie n.º 3', 'Erik Satie'),
      T('chopin-nocturno-op9-2.mp3', 'Nocturno op. 9 n.º 2', 'Frédéric Chopin'),
      T('chopin-nocturno-op15-1.mp3', 'Nocturno op. 15 n.º 1', 'Frédéric Chopin'),
      T('chopin-nocturno-op72.mp3', 'Nocturno op. 72', 'Frédéric Chopin'),
      T('debussy-clair-de-lune.mp3', 'Clair de lune', 'Claude Debussy'),
      T('debussy-reverie.mp3', 'Rêverie', 'Claude Debussy'),
      T('bach-goldberg-aria.mp3', 'Variaciones Goldberg: Aria', 'J. S. Bach')
    ] },
    { id: 'lofi', name: 'Lo-fi', desc: 'beats tranquilos', pro: true, tracks: [
      T('macleod-study-and-relax.mp3', 'Study and Relax', 'Kevin MacLeod'),
      T('sappheiros-perspective.mp3', 'Perspective', 'Sappheiros'),
      T('currie-lofi.mp3', 'Lofi', 'Caden Currie'),
      T('macleod-tea-roots.mp3', 'Tea Roots', 'Kevin MacLeod'),
      T('macleod-off-to-osaka.mp3', 'Off to Osaka', 'Kevin MacLeod'),
      T('macleod-healing.mp3', 'Healing', 'Kevin MacLeod')
    ] },
    { id: 'jazz', name: 'Jazz suave', desc: 'baladas instrumentales', pro: true, tracks: [
      T('reid-smooth-jazz-ballad-1.mp3', 'Smooth Jazz Ballad n.º 1', 'Claude Reid'),
      T('reid-smooth-jazz-ballad-2.mp3', 'Smooth Jazz Ballad n.º 2', 'Claude Reid'),
      T('macleod-backed-vibes.mp3', 'Backed Vibes', 'Kevin MacLeod'),
      T('macleod-vibe-ace.mp3', 'Vibe Ace', 'Kevin MacLeod'),
      T('macleod-night-on-the-docks.mp3', 'Night on the Docks', 'Kevin MacLeod'),
      T('macleod-i-knew-a-guy.mp3', 'I Knew a Guy', 'Kevin MacLeod'),
      T('macleod-as-i-figure.mp3', 'As I Figure', 'Kevin MacLeod')
    ] }
  ];
  let mus = { id: null, el: null };
  const musLevel = () => Math.pow(settings.musicVol / 100, 2) * 1.6;
  function playMusic(id) {
    if (mus.id === id) return;
    stopMusic();
    const c = unlockAudio(); if (!c) return;
    const b = getBus(); if (!b) return;
    const list = MUSIC.find((m) => m.id === id); if (!list || !list.tracks) return;
    const el = new Audio(); el.preload = 'auto';
    const src = c.createMediaElementSource(el);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, c.currentTime); gain.gain.setTargetAtTime(musLevel(), c.currentTime, 0.8);
    src.connect(gain).connect(b.musIn);
    const order = list.tracks.map((_, i) => i).sort(() => Math.random() - 0.5);
    let n = 0, fails = 0;
    const next = () => {
      if (mus.el !== el) return;
      el.src = list.tracks[order[n++ % order.length]].file;
      el.play().then(() => { fails = 0; renderNowPlaying(); }).catch(() => {});
    };
    el.addEventListener('ended', next);
    el.addEventListener('error', () => { if (++fails < order.length) setTimeout(next, 400); });
    mus = { id, el, gain, src, list, current: () => list.tracks[order[(n - 1 + order.length) % order.length]] };
    next();
    renderSounds();
  }
  function stopMusic(fade = 0.8) {
    if (!mus.el) return;
    const { el, gain, src } = mus;
    mus = { id: null, el: null };
    try { gain.gain.cancelScheduledValues(ctx.currentTime); gain.gain.setTargetAtTime(0, ctx.currentTime, fade / 4); } catch {}
    setTimeout(() => { el.pause(); el.removeAttribute('src'); el.load(); try { src.disconnect(); } catch {} }, fade * 1000 + 150);
    renderSounds();
  }
  function renderNowPlaying() {
    const box = $('#now-playing'); if (!box) return;
    const t = mus.el && mus.current ? mus.current() : null;
    box.innerHTML = t ? 'Sonando: <b>' + t.title + '</b> · ' + t.by : '';
    box.hidden = !t;
  }

  // Los sonidos Pro solo suenan con Pro (sin Pro se pueden escuchar 6 s de muestra)
  const locked = (list, id) => !pro && !!(list.find((x) => x.id === id) || {}).pro;
  const allowed = (list, id) => (locked(list, id) ? 'none' : id);
  function wantsSound() { return !!timer && (mode === 'focus' || settings.ambientBreaks); }
  function updateAmbient() {
    if (wantsSound()) {
      clearTimeout(previewTimer); previewTimer = null;
      const a = allowed(AMBIENTS, settings.ambient), f = allowed(FREQS, settings.freq);
      if (a !== 'none') playAmbient(a); else { ambToken++; stopAmbient(); }
      if (f !== 'none') playFreq(f); else stopFreq();
      const m = allowed(MUSIC, settings.music);
      if (m !== 'none') playMusic(m); else stopMusic();
    } else if (!previewTimer) { ambToken++; stopAmbient(); stopFreq(); stopMusic(); }
  }
  function preview(kind, id) {
    if (wantsSound()) { updateAmbient(); return; }
    clearTimeout(previewTimer); previewTimer = null;
    if (kind === 'amb') { if (id === 'none') { ambToken++; stopAmbient(); } else playAmbient(id); }
    else if (kind === 'mus') { if (id === 'none') stopMusic(); else playMusic(id); }
    else if (id === 'none') stopFreq(); else playFreq(id);
    previewTimer = setTimeout(() => { previewTimer = null; if (!wantsSound()) { ambToken++; stopAmbient(1.5); stopFreq(1.5); stopMusic(1.5); } }, kind === 'mus' ? 12000 : 6000);
  }

  function lockedPreview(kind, id) {
    if (!wantsSound()) {
      clearTimeout(previewTimer); previewTimer = null;
      if (kind === 'amb') playAmbient(id); else if (kind === 'mus') playMusic(id); else playFreq(id);
      previewTimer = setTimeout(() => { previewTimer = null; if (!wantsSound()) { ambToken++; stopAmbient(1.5); stopFreq(1.5); stopMusic(1.5); } else updateAmbient(); }, kind === 'mus' ? 12000 : 6000);
    }
    paywall(kind === 'amb' ? 'sounds' : kind === 'mus' ? 'music' : 'freqs');
  }
  function renderSounds() {
    const chip = (x, on, playing) => `<button class="chip${playing ? ' playing' : ''}${x.pro ? ' pro' : ''}${x.pro && !pro ? ' locked' : ''}" data-id="${x.id}" aria-pressed="${on && !(x.pro && !pro)}"><b>${x.name}${x.pro ? '<i class="pro-tag">PRO</i>' : ''}</b><span>${x.desc}</span></button>`;
    $('#ambients').innerHTML = AMBIENTS.map((a) => chip(a, a.id === settings.ambient, a.id === amb.id)).join('');
    $('#freqs').innerHTML = FREQS.map((a) => chip(a, a.id === settings.freq, a.id === freq.id)).join('');
    $('#music').innerHTML = MUSIC.map((a) => chip(a, a.id === settings.music, a.id === mus.id)).join('');
    $('#mus-vol').value = settings.musicVol;
    renderNowPlaying();
    $('#alarms').innerHTML = ALARMS.map((a) => chip(a, a.id === settings.alarm, false)).join('');
    $('#amb-vol').value = settings.ambientVol;
    $('#freq-vol').value = settings.freqVol;
    $('#amb-breaks').checked = settings.ambientBreaks;
  }
  $('#ambients').addEventListener('click', (e) => {
    const b = e.target.closest('[data-id]'); if (!b) return;
    if (locked(AMBIENTS, b.dataset.id)) { lockedPreview('amb', b.dataset.id); return; }
    settings.ambient = b.dataset.id; store.set('settings', settings);
    renderSounds(); preview('amb', settings.ambient);
  });
  $('#freqs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-id]'); if (!b) return;
    if (locked(FREQS, b.dataset.id)) { lockedPreview('freq', b.dataset.id); return; }
    settings.freq = b.dataset.id; store.set('settings', settings);
    renderSounds(); preview('freq', settings.freq);
  });
  $('#music').addEventListener('click', (e) => {
    const b = e.target.closest('[data-id]'); if (!b) return;
    if (locked(MUSIC, b.dataset.id)) { lockedPreview('mus', b.dataset.id); return; }
    settings.music = b.dataset.id; store.set('settings', settings);
    renderSounds(); preview('mus', settings.music);
  });
  $('#mus-vol').addEventListener('input', (e) => {
    settings.musicVol = Number(e.target.value); store.set('settings', settings);
    if (mus.gain) mus.gain.gain.setTargetAtTime(musLevel(), ctx.currentTime, 0.05);
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
  el.task.addEventListener('input', () => { store.set('task', el.task.value); emitState(); });

  // ---------- Estado público para las salas de estudio (rooms.js) ----------
  // Se publica en window.__focoState y como evento; rooms.js decide cuándo subirlo.
  function emitState() {
    const s = subById(currentSub);
    const t0 = new Date(); t0.setHours(0, 0, 0, 0);
    let today = 0; for (let i = log.length - 1; i >= 0 && log[i].ts >= t0.getTime(); i--) today++;
    const detail = {
      mode, running: !!timer, endAt: timer ? endAt : null,
      remaining: Math.round(remaining / 1000) * 1000,
      started: !!timer || remaining < total() - 1000,
      sub: s ? s.name : '', task: el.task.value.trim(), today
    };
    window.__focoState = detail;
    window.dispatchEvent(new CustomEvent('foco:state', { detail }));
  }
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !document.body.classList.contains('opts-open') && !['INPUT', 'TEXTAREA', 'BUTTON'].includes(document.activeElement.tagName)) {
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
            <button class="del trash" data-del-sub="${s.id}" aria-label="Borrar ${esc(s.name)}" title="Borrar materia"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg></button>
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
  // ---------- Catálogo: materias con el programa oficial separado en temas ----------
  const CATALOG = Array.isArray(window.FOCO_CATALOG) ? window.FOCO_CATALOG : [];
  const norm = (x) => String(x).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const words = (x) => norm(x).split(/[^a-z0-9]+/).filter(Boolean);
  const catById = (id) => CATALOG.find((c) => c.id === id);
  const newTopicId = () => 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  // Busca en nombre, institución y unidades. Si escribís una unidad ("cinemática"), queda preseleccionada.
  function searchCatalog(q) {
    const toks = words(q).filter((t) => t.length >= 2 || /\d/.test(t));
    if (!toks.length || norm(q).replace(/\s/g, '').length < 3) return [];
    const hit = (ws, t) => ws.some((w) => w === t || (t.length >= 3 && w.startsWith(t)));
    const out = [];
    for (const c of CATALOG) {
      const own = words(`${c.name} ${c.inst} ${c.keys || ''}`);
      const unitWords = c.units.map((u) => words(u.name));
      let ok = true; const picked = new Set();
      for (const t of toks) {
        const inOwn = hit(own, t);
        const inUnits = unitWords.map((ws, i) => (hit(ws, t) ? i : -1)).filter((i) => i >= 0);
        if (!inOwn && !inUnits.length) { ok = false; break; }
        if (!inOwn) inUnits.forEach((i) => picked.add(i));
      }
      if (ok) out.push({ c, picked: picked.size ? picked : new Set(c.units.map((_, i) => i)), score: toks.filter((t) => hit(words(c.name), t)).length });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 4);
  }
  const catBox = $('#cat-pick');
  let catResults = [];
  function renderCatPick() {
    catResults = searchCatalog(el.subName.value);
    catBox.hidden = !catResults.length;
    catBox.innerHTML = catResults.map(({ c, picked }, k) => {
      const existing = subjects.find((s) => s.cat === c.id);
      const units = c.units.map((u, i) => `
        <label class="cat-unit"><input type="checkbox" data-cat-unit="${k}|${i}" ${picked.has(i) ? 'checked' : ''}>
          <span><b>${i + 1}. ${esc(u.name)}</b><small>${u.topics.length} temas</small></span></label>`).join('');
      return `<article class="cat-card" data-cat="${k}">
          <header><span class="cat-badge">Programa oficial</span><b>${esc(c.name)}</b><small>${esc(c.inst)}</small>${c.source ? `<small class="cat-src">${esc(c.source)}</small>` : ''}</header>
          <p class="cat-q">¿Qué unidades entran?</p>
          <div class="cat-units">${units}</div>
          <div class="cat-actions">
            <button type="button" class="link" data-cat-all="${k}">Todas</button>
            <button type="button" class="add" data-cat-add="${k}"></button>
          </div>
          ${existing ? `<p class="cat-note">Ya tenés ${esc(existing.name)}: las unidades nuevas se suman a esa materia.</p>` : ''}
        </article>`;
    }).join('');
    catResults.forEach((_, k) => updateCatButton(k));
  }
  function catChecked(k) { return [...catBox.querySelectorAll(`[data-cat-unit^="${k}|"]`)].filter((x) => x.checked).map((x) => Number(x.dataset.catUnit.split('|')[1])); }
  function updateCatButton(k) {
    const { c } = catResults[k]; const idx = catChecked(k);
    const n = idx.reduce((sum, i) => sum + c.units[i].topics.length, 0);
    const b = catBox.querySelector(`[data-cat-add="${k}"]`);
    if (!pro) { b.textContent = n ? `Agregar ${n} temas · Pro` : 'Elegí al menos una unidad'; b.disabled = !n; b.classList.add('locked'); return; }
    b.textContent = n ? `Agregar ${n} temas` : 'Elegí al menos una unidad';
    b.disabled = !n;
  }
  // Suma las unidades elegidas a la materia (la crea si no existe); no duplica temas ya cargados
  function addFromCatalog(c, unitIdx, { scroll = true } = {}) {
    let s = subjects.find((x) => x.cat === c.id);
    if (!s) {
      if (subjects.length >= 20) { el.subName.setCustomValidity('Máximo 20 materias.'); el.subName.reportValidity(); el.subName.setCustomValidity(''); return; }
      let id;
      do { id = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); } while (subById(id));
      s = { id, name: c.name, exam: '', cat: c.id, topics: [] };
      subjects.push(s);
    }
    if (el.subDate.value) s.exam = el.subDate.value;
    const list = topicsOf(s), have = new Set(list.map((t) => `${t.unit || ''}|${norm(t.name)}`));
    for (const i of unitIdx) {
      const u = c.units[i];
      for (const name of u.topics) {
        if (list.length >= 120) break;
        if (have.has(`${u.name}|${norm(name)}`)) continue;
        list.push({ id: newTopicId(), name, unit: u.name, done: false });
      }
    }
    // Mantener el orden del programa
    const order = new Map(c.units.map((u, i) => [u.name, i]));
    s.topics = list.map((t, i) => ({ t, i })).sort((a, b) => ((order.get(a.t.unit) ?? 99) - (order.get(b.t.unit) ?? 99)) || a.i - b.i).map((x) => x.t);
    if (scroll) { el.subName.value = ''; el.subDate.value = ''; catBox.hidden = true; catBox.innerHTML = ''; }
    openPlans.add(s.id);
    setSubject(s.id); renderStats();
    if (scroll) { window.__focoOpts?.(false); document.getElementById('plan-sec').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }
  el.subName.addEventListener('input', renderCatPick);
  catBox.addEventListener('change', (e) => { const u = e.target.dataset.catUnit; if (u) updateCatButton(Number(u.split('|')[0])); });
  catBox.addEventListener('click', (e) => {
    const all = e.target.closest('[data-cat-all]');
    if (all) { const k = all.dataset.catAll; catBox.querySelectorAll(`[data-cat-unit^="${k}|"]`).forEach((x) => (x.checked = true)); updateCatButton(Number(k)); return; }
    const add = e.target.closest('[data-cat-add]'); if (!add) return;
    const k = Number(add.dataset.catAdd), idx = catChecked(k);
    if (!pro) { paywall('catalog'); return; }
    if (idx.length) addFromCatalog(catResults[k].c, idx);
  });

  el.subjects.addEventListener('click', async (e) => {
    const pick = e.target.closest('[data-pick]');
    if (pick) { setSubject(pick.dataset.pick); return; }
    const del = e.target.closest('[data-del-sub]'); if (!del) return;
    deleteSubject(del.dataset.delSub);
  });
  // Borrar una materia (desde la lista o desde su tarjeta del plan), siempre con confirmación
  async function deleteSubject(id) {
    const s = subById(id); if (!s) return;
    const n = topicsOf(s).length;
    const msg = `¿Borrar "${s.name}"${n ? ` y sus ${n} temas` : ''}? Los pomodoros que ya hiciste quedan en el historial como "Sin materia".`;
    if (!(await ask(msg, 'Borrar'))) return;
    subjects = subjects.filter((x) => x.id !== s.id);
    openPlans.delete(s.id);
    if (currentSub === s.id) currentSub = '';
    saveSubjects(); renderSubjects(); renderStats();
  }
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
      box.innerHTML = '<p class="empty">Primero cargá tus materias con la fecha del final.</p><button class="add plan-empty-btn" data-open-tab="materias">Cargar materias</button>';
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
      const all = topicsOf(s);
      let lastUnit = null;
      const topics = all.map((t) => {
        let head = '';
        if (lastUnit === null || (t.unit || '') !== lastUnit) {
          lastUnit = t.unit || '';
          if (t.unit || all.some((x) => x.unit)) {
            const inUnit = all.filter((x) => (x.unit || '') === lastUnit);
            head = `<li class="unit-h"><b>${esc(t.unit || 'Otros temas')}</b><small>${inUnit.filter((x) => x.done).length}/${inUnit.length}</small></li>`;
          }
        }
        return `${head}
        <li class="${t.done ? 'done' : ''}">
          <label><input type="checkbox" data-toggle="${s.id}|${t.id}" ${t.done ? 'checked' : ''}><span>${esc(t.name)}</span></label>
          <button class="del" data-del-topic="${s.id}|${t.id}" aria-label="Quitar tema">×</button>
        </li>`;
      }).join('');
      const cat = s.cat && catById(s.cat);
      const missing = cat ? cat.units.map((u, i) => ({ u, i })).filter(({ u }) => !all.some((t) => t.unit === u.name)) : [];
      const more = missing.length
        ? `<div class="unit-add"><span>Sumar del programa</span>${missing.map(({ u, i }) => `<button type="button" class="chip-sm" data-add-unit="${s.id}|${i}">+ ${esc(u.name)}</button>`).join('')}</div>`
        : '';
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
            ${more}
            <form class="row topic-form" data-add-topic="${s.id}">
              <input type="text" maxlength="400" placeholder="Ej: Límites, Derivadas, Integrales" aria-label="Nuevos temas (separalos con coma)">
              <button class="add" type="submit">Agregar</button>
            </form>
            <div class="plan-settings">
              <label>Pomodoros por tema<input type="number" min="1" max="12" value="${perTopicOf(s)}" data-per="${s.id}"></label>
              <label>Fecha del final<input type="date" value="${s.exam || ''}" min="${isoToday()}" data-exam="${s.id}"></label>
            </div>
            <button type="button" class="danger-link" data-del-plan="${s.id}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>Borrar materia
            </button>
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
    const addU = e.target.closest('[data-add-unit]');
    if (addU) {
      if (!pro) { paywall('catalog'); return; }
      const [sid, i] = addU.dataset.addUnit.split('|'); const s = subById(sid); const c = s && catById(s.cat);
      if (c) { const keep = el.subDate.value; el.subDate.value = ''; addFromCatalog(c, [Number(i)], { scroll: false }); el.subDate.value = keep; }
      return;
    }
    const delPlan = e.target.closest('[data-del-plan]');
    if (delPlan) { deleteSubject(delPlan.dataset.delPlan); return; }
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
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) || document.body.classList.contains('opts-open')) return;
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
    renderProStats(byDay, hm);
  }

  // ---------- Estadísticas Pro ----------
  function renderProStats(byDay, hm) {
    const box = $('#pro-stats'); if (!box) return;
    if (!pro) {
      const fake = Array.from({ length: 26 * 7 }, (_, i) => `<i class="l${(i * 7 + (i % 5) * 3) % 5}"></i>`).join('');
      box.innerHTML = `
        <div class="pro-lock">
          <div class="heat fake" aria-hidden="true">${fake}</div>
          <div class="pro-lock-txt">
            <b>Mirá cómo estudiás de verdad</b>
            <span>Mapa de tus últimos 6 meses, horas por materia, temas terminados y tu mejor horario para concentrarte.</span>
            <button class="add" data-paywall="stats">Ver con Foco Pro</button>
          </div>
        </div>`;
      return;
    }
    const totalMin = log.reduce((n, s) => n + s.min, 0);
    const now = new Date(), monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthMin = log.filter((s) => s.ts >= monthStart).reduce((n, s) => n + s.min, 0);
    const activeDays = Object.keys(byDay).length;
    // Mejor racha de días seguidos
    const dayNums = [...new Set(log.map((s) => { const d = new Date(s.ts); return Math.round(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000); }))].sort((a, b) => a - b);
    let best = 0, run = 0;
    dayNums.forEach((d, i) => { run = i && d === dayNums[i - 1] + 1 ? run + 1 : 1; best = Math.max(best, run); });

    // Mapa de calor: 26 semanas, columnas = semanas, filas = días
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - start.getDay() - 25 * 7);
    const cells = [];
    for (let i = 0; i < 26 * 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      if (d > now) { cells.push('<i class="out"></i>'); continue; }
      const m = (byDay[dayKey(d)] || { min: 0 }).min;
      const l = m === 0 ? 0 : m <= 25 ? 1 : m <= 75 ? 2 : m <= 150 ? 3 : 4;
      cells.push(`<i class="l${l}" title="${d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} · ${m ? hm(m) : 'sin estudio'}"></i>`);
    }

    // Minutos según la hora en que empezó cada pomodoro
    const hours = Array(24).fill(0);
    for (const s of log) hours[new Date(s.ts - s.min * 60000).getHours()] += s.min;
    const hmax = Math.max(1, ...hours);
    let bestH = -1, bestSum = 0;
    for (let h = 0; h < 24; h++) { const sum = hours[h] + hours[(h + 1) % 24]; if (sum > bestSum) { bestSum = sum; bestH = h; } }
    const bestTxt = bestH < 0 ? 'Completá algunos pomodoros y te digo a qué hora rendís más.'
      : `Rendís más <b>de ${bestH} a ${(bestH + 2) % 24} h</b>. Guardá ese horario para lo más difícil.`;

    // Materias: horas totales y temas terminados
    const per = {};
    for (const s of log) { const k = subById(s.sub) ? s.sub : ''; per[k] = (per[k] || 0) + s.min; }
    const rows = subjects.map((s) => ({ s, m: per[s.id] || 0, t: topicsOf(s) })).sort((a, b) => b.m - a.m);
    const top = Math.max(1, ...rows.map((r) => r.m));

    box.innerHTML = `
      <div class="pro-sum">
        <div><b>${Math.round(totalMin / 6) / 10}</b><span>horas en total</span></div>
        <div><b>${Math.round(monthMin / 6) / 10}</b><span>horas este mes</span></div>
        <div><b>${activeDays ? Math.round(totalMin / activeDays) : 0}</b><span>min por día activo</span></div>
        <div><b>${best}</b><span>mejor racha</span></div>
      </div>
      <p class="pro-cap">Últimos 6 meses</p>
      <div class="heat" role="img" aria-label="Minutos de estudio por día en los últimos 6 meses">${cells.join('')}</div>
      <div class="heat-legend"><span>Menos</span><i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i><span>Más</span></div>
      <p class="pro-cap">Tu horario</p>
      <div class="hours" aria-hidden="true">${hours.map((m, h) => `<i style="height:${Math.max(3, (m / hmax) * 100)}%" class="${bestH >= 0 && (h === bestH || h === (bestH + 1) % 24) ? 'best' : ''}" title="${h} h · ${hm(m)}"></i>`).join('')}</div>
      <div class="hours-axis"><span>0 h</span><span>6</span><span>12</span><span>18</span><span>23</span></div>
      <p class="pro-best">${bestTxt}</p>
      ${rows.length ? `<p class="pro-cap">Materias · desde siempre</p>
      <ul class="by-subject">${rows.map(({ s, m, t }) => `<li><span class="name"><span class="dot" style="background:${subColor(s.id)}"></span>${esc(s.name)}</span>
        <em>${hm(m)}${t.length ? ` · ${t.filter((x) => x.done).length}/${t.length} temas` : ''}</em>
        <span class="track-h"><i style="width:${(m / top) * 100}%;background:${subColor(s.id)}"></i></span></li>`).join('')}</ul>` : ''}`;
  }
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-paywall]'); if (b) paywall(b.dataset.paywall); });

  // ---------- Pro y sincronización (los maneja account.js) ----------
  window.addEventListener('foco:pro', (e) => {
    const was = pro; pro = !!e.detail;
    if (was === pro) return;
    renderSounds(); renderStats(); if (el.subName.value) renderCatPick();
    if (!pro && wantsSound()) updateAmbient();
  });
  // Llegaron datos de otro dispositivo: volver a leer todo y redibujar
  window.__focoReload = () => {
    Object.keys(settings).forEach((k) => delete settings[k]);
    Object.assign(settings, DEFAULTS, store.get('settings', {}));
    log = store.get('log', []); notes = store.get('notes', []); subjects = store.get('subjects', []);
    if (!subjects.some((s) => s.id === currentSub)) currentSub = '';
    fillForm(); renderPresets(); renderSkins(); renderSounds(); renderNotes(); renderSubjects(); renderStats(); render();
    if (wantsSound()) updateAmbient();
  };

  // ---------- Diálogo propio (sin confirm()) ----------
  function ask(msg, yes = 'Confirmar') {
    return new Promise((res) => {
      const d = $('#dialog'); $('#dialog-msg').textContent = msg; $('#dialog-yes').textContent = yes; d.hidden = false;
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

  // ---------- Ruedita de opciones ----------
  // Todo lo que no es el reloj ni el plan de hoy vive en un panel con pestañas.
  const opts = $('#opts'), optsBtn = $('#opts-btn');
  const TABS = [...opts.querySelectorAll('[data-tab]')].map((b) => b.dataset.tab);
  let optsReturn = null;
  function showTab(tab) {
    if (!TABS.includes(tab)) tab = TABS[0];
    opts.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    opts.querySelectorAll('[data-pane]').forEach((p) => p.classList.toggle('on', p.dataset.pane === tab));
    opts.querySelector('.opts-body').scrollTop = 0;
    opts.querySelector(`[data-tab="${tab}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    store.set('optsTab', tab);
  }
  function openOpts(tab) {
    optsReturn = document.activeElement;
    showTab(tab || store.get('optsTab', TABS[0]));
    opts.hidden = false; document.body.classList.add('opts-open');
    opts.querySelector('[aria-selected=true]')?.focus({ preventScroll: true });
  }
  function closeOpts() {
    if (opts.hidden) return;
    opts.hidden = true; document.body.classList.remove('opts-open');
    optsReturn?.focus?.({ preventScroll: true });
  }
  window.__focoOpts = (tab) => (tab === false ? closeOpts() : openOpts(tab));
  optsBtn.addEventListener('click', () => openOpts());
  opts.addEventListener('click', (e) => {
    if (e.target === opts || e.target.closest('[data-opts-close]')) return closeOpts();
    const t = e.target.closest('[data-tab]'); if (t) showTab(t.dataset.tab);
  });
  opts.querySelector('.opts-tabs').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const cur = TABS.indexOf(store.get('optsTab', TABS[0]));
    const next = TABS[(cur + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
    showTab(next); opts.querySelector(`[data-tab="${next}"]`).focus();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !opts.hidden && $('#dialog').hidden && $('#sheet').hidden) closeOpts(); });
  document.addEventListener('click', (e) => { const go = e.target.closest('[data-open-tab]'); if (go) openOpts(go.dataset.openTab); });
  // Link de invitación a una sala: abre directo la pestaña Amigos
  if (location.hash.includes('sala=')) setTimeout(() => openOpts('amigos'), 300);

  fillForm(); renderPresets(); renderSkins(); renderSounds(); renderNotes(); renderSubjects(); renderStats(); render();
}
