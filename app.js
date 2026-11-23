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
    ambient: 'none', ambientVol: 50, ambientBreaks: false, alarm: 'bell'
  };

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
    time: $('#time'), label: $('#label'), dots: $('#dots'), prog: $('#prog'),
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
    el.prog.style.strokeDasharray = CIRC;
    el.prog.style.strokeDashoffset = CIRC * (1 - frac);
    el.toggle.textContent = timer ? 'Pausar' : (remaining < total() ? 'Seguir' : 'Empezar');
    document.title = timer ? `${t} · ${mode === 'focus' ? 'Foco' : 'Descanso'}` : 'Foco Pomodoro';
    document.body.dataset.mode = mode;
    document.body.classList.toggle('running', !!timer);
    document.querySelectorAll('[data-mode-btn]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.modeBtn === mode));
    el.dots.innerHTML = Array.from({ length: settings.every }, (_, i) => `<i class="${i < cycle ? 'on' : ''}"></i>`).join('');
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = '#0a0b10';
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

  // Sonidos de fondo: cada uno se "graba" una vez en un bucle de 16 s y se repite sin cortes
  const AMBIENTS = [
    { id: 'none', name: 'Silencio', desc: 'sin fondo' },
    { id: 'rain', name: 'Lluvia', desc: 'suave y constante' },
    { id: 'waves', name: 'Olas', desc: 'ritmo lento' },
    { id: 'fire', name: 'Chimenea', desc: 'crepitar cálido' },
    { id: 'brown', name: 'Ruido marrón', desc: 'grave, tapa voces' },
    { id: 'white', name: 'Ruido blanco', desc: 'tapa todo' },
    { id: 'clock', name: 'Tic-tac', desc: 'reloj de estudio' }
  ];
  const LOOP = 16, FADE = 1;
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
      const env = (g, lo, hi) => {
        g.gain.setValueAtTime(lo, 0);
        for (let k = 0; k * 8 < T; k++) { g.gain.linearRampToValueAtTime(hi, k * 8 + 3.5); g.gain.linearRampToValueAtTime(lo, k * 8 + 8); }
      };
      env(layer(c, noise(c, 'brown', T), 1, [['lowpass', 700]]), 0.15, 1);
      env(layer(c, noise(c, 'pink', T), 1, [['highpass', 1500]]), 0.02, 0.25);
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
  async function ambBuffer(id) {
    if (ambCache[id]) return ambCache[id];
    const sr = ctx.sampleRate, T = LOOP + FADE;
    const Off = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const oc = new Off(1, Math.ceil(sr * T), sr);
    RECIPES[id](oc, T);
    const r = await oc.startRendering();
    const src = r.getChannelData(0), n = Math.floor(sr * LOOP), f = Math.floor(sr * FADE);
    const out = ctx.createBuffer(1, n, sr), d = out.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = src[i];
    // Fundido entre el final y el principio para que el bucle no se note
    for (let i = 0; i < f; i++) { const a = i / f; d[i] = src[i] * a + src[n + i] * (1 - a); }
    // Volumen parejo entre sonidos
    let sum = 0, peak = 0;
    for (let i = 0; i < n; i++) { sum += d[i] * d[i]; peak = Math.max(peak, Math.abs(d[i])); }
    const k = Math.min(0.15 / Math.sqrt(sum / n || 1), 0.95 / (peak || 1));
    for (let i = 0; i < n; i++) d[i] *= k;
    return (ambCache[id] = out);
  }

  let amb = { id: null, src: null, gain: null }, ambToken = 0, previewTimer = null;
  const ambLevel = () => Math.pow(settings.ambientVol / 100, 2);
  function stopAmbient(fade = 0.8) {
    if (!amb.src) return;
    const { src, gain } = amb;
    try { gain.gain.cancelScheduledValues(ctx.currentTime); gain.gain.setTargetAtTime(0, ctx.currentTime, fade / 4); src.stop(ctx.currentTime + fade); } catch {}
    amb = { id: null, src: null, gain: null };
    renderSounds();
  }
  async function playAmbient(id) {
    if (amb.id === id) return;
    const token = ++ambToken;
    const c = unlockAudio(); if (!c) return;
    let buf;
    try { buf = await ambBuffer(id); } catch { return; }
    if (token !== ambToken) return; // otro cambio llegó mientras se generaba
    stopAmbient();
    const src = c.createBufferSource(), gain = c.createGain();
    src.buffer = buf; src.loop = true;
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.setTargetAtTime(ambLevel(), c.currentTime, 0.4);
    src.connect(gain).connect(c.destination); src.start();
    amb = { id, src, gain };
    renderSounds();
  }
  function wantsAmbient() {
    return !!timer && settings.ambient !== 'none' && (mode === 'focus' || settings.ambientBreaks);
  }
  function updateAmbient() {
    if (wantsAmbient()) { clearTimeout(previewTimer); previewTimer = null; playAmbient(settings.ambient); }
    else if (!previewTimer) { ambToken++; stopAmbient(); }
  }
  function previewAmbient(id) {
    clearTimeout(previewTimer); previewTimer = null;
    if (wantsAmbient()) { playAmbient(id); return; }
    if (id === 'none') { ambToken++; stopAmbient(); return; }
    playAmbient(id);
    previewTimer = setTimeout(() => { previewTimer = null; if (!wantsAmbient()) { ambToken++; stopAmbient(1.5); } }, 6000);
  }

  function renderSounds() {
    const chip = (x, on, playing) => `<button class="chip${playing ? ' playing' : ''}" data-id="${x.id}" aria-pressed="${on}"><b>${x.name}</b><span>${x.desc}</span></button>`;
    $('#ambients').innerHTML = AMBIENTS.map((a) => chip(a, a.id === settings.ambient, a.id === amb.id)).join('');
    $('#alarms').innerHTML = ALARMS.map((a) => chip(a, a.id === settings.alarm, false)).join('');
    $('#amb-vol').value = settings.ambientVol;
    $('#amb-breaks').checked = settings.ambientBreaks;
  }
  $('#ambients').addEventListener('click', (e) => {
    const b = e.target.closest('[data-id]'); if (!b) return;
    settings.ambient = b.dataset.id; store.set('settings', settings);
    renderSounds(); previewAmbient(settings.ambient);
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
    renderSubjectBar();
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
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  } catch {}

  fillForm(); renderPresets(); renderSounds(); renderNotes(); renderSubjects(); renderStats(); render();
}
