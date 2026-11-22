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
  const DEFAULTS = { focus: 25, short: 5, long: 15, every: 4, autoStart: false, sound: true, notify: false };

  const settings = Object.assign({}, DEFAULTS, store.get('settings', {}));
  let log = store.get('log', []);       // [{ts, min, task}]
  let notes = store.get('notes', []);   // [{ts, t}]
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
    note: $('#note'), history: $('#history'), week: $('#week'), ticks: $('#ticks')
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
    document.querySelectorAll('[data-mode-btn]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.modeBtn === mode));
    el.dots.innerHTML = Array.from({ length: settings.every }, (_, i) => `<i class="${i < cycle ? 'on' : ''}"></i>`).join('');
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = mode === 'focus' ? '#d9412b' : '#17766f';
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
    render();
  }
  function pause() {
    clearInterval(timer); timer = null;
    if (endAt) remaining = Math.max(0, endAt - Date.now());
    persist(); render();
  }
  function setMode(m, keepCycle = true) {
    clearInterval(timer); timer = null;
    mode = m; remaining = total();
    if (!keepCycle) cycle = 0;
    persist(); render();
  }

  function finish() {
    clearInterval(timer); timer = null;
    const wasFocus = mode === 'focus';
    if (wasFocus) {
      log.push({ ts: Date.now(), min: settings.focus, task: el.task.value.trim() });
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
    if (settings.autoStart) start();
  }

  // ---------- Sonido y avisos ----------
  let ctx = null;
  function unlockAudio() {
    if (!settings.sound) return;
    try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); } catch {}
  }
  function chime() {
    if (!settings.sound || !ctx) return;
    try {
      [0, 0.28, 0.56].forEach((d, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = [660, 880, 990][i];
        g.gain.setValueAtTime(0.0001, ctx.currentTime + d);
        g.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + d + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d + 0.5);
        o.connect(g).connect(ctx.destination);
        o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + 0.55);
      });
    } catch {}
  }
  function alertDone(msg) {
    chime();
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

  // ---------- Distracciones ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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

    const recent = log.slice(-8).reverse();
    el.history.innerHTML = recent.length
      ? recent.map((s) => {
          const t = new Date(s.ts);
          const when = t.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }) + ' ' + t.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
          return `<li><span>${s.task ? esc(s.task) : 'Sin tarea'}</span><em>${s.min} min</em><time>${when}</time></li>`;
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

  fillForm(); renderPresets(); renderNotes(); renderStats(); render();
}
