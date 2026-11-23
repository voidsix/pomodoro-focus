// Salas de estudio con amigos (Firebase Realtime Database + login anónimo).
// Cada persona usa su propio temporizador; la sala muestra en vivo en qué está cada uno.
import { firebaseConfig } from './firebase-config.js';
import { firebase, ensureUser } from './fb.js';

const box = document.getElementById('room');
const store = {
  get(k, d) { try { const v = localStorage.getItem('pf:' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('pf:' + k, JSON.stringify(v)); } catch {} }
};
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O ni 1/I
const newCode = () => Array.from({ length: 6 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('');
const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
const COLORS = ['#5bc8d6', '#7d9cf5', '#a58cf0', '#e0a85c', '#6fd09a', '#e38aa8', '#9fc86a', '#d6b25b'];
const colorOf = (uid) => COLORS[[...uid].reduce((n, ch) => n + ch.charCodeAt(0), 0) % COLORS.length];

let fb = null;            // { db, auth, api }
let uid = null, offset = 0;
let room = null;          // { code, name }
let members = {}, unsub = [], memberRef = null, lastSent = '', tick = null, joinedAt = 0;

const hashCode = () => cleanCode((location.hash.match(/sala=([A-Za-z0-9]+)/) || [])[1]);

// ---------- Interfaz ----------
function view(html) { box.innerHTML = html; }
function renderOff() {
  // Sin proyecto de Firebase configurado, la sección no se muestra
  const sec = document.getElementById('room-sec');
  if (sec) sec.hidden = true;
}
function renderLobby(msg = '') {
  const saved = store.get('room-name', '');
  const code = hashCode();
  view(`
    <p class="hint">Estudiá "al lado" de tus amigos aunque estén lejos: cada uno usa su temporizador y en la sala ven en qué está cada uno.</p>
    <form class="room-form" id="room-form">
      <label>Tu nombre<input id="room-name" maxlength="24" autocomplete="nickname" placeholder="Ej: Vale" value="${esc(saved)}" required></label>
      <label>Código de sala <small>(vacío para crear una)</small><input id="room-code" maxlength="6" autocapitalize="characters" placeholder="Ej: K7MPQ2" value="${esc(code)}"></label>
      <div class="room-actions">
        <button class="add" type="submit" id="room-go">${code ? 'Unirme' : 'Crear sala'}</button>
      </div>
      ${msg ? `<p class="room-msg">${esc(msg)}</p>` : ''}
    </form>`);
  const codeIn = box.querySelector('#room-code'), go = box.querySelector('#room-go');
  codeIn.addEventListener('input', () => { codeIn.value = cleanCode(codeIn.value); go.textContent = codeIn.value ? 'Unirme' : 'Crear sala'; });
  box.querySelector('#room-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = box.querySelector('#room-name').value.trim().slice(0, 24);
    if (!name) return;
    store.set('room-name', name);
    const c = cleanCode(codeIn.value);
    go.disabled = true; go.textContent = 'Conectando…';
    (c ? join(c, name) : create(name)).catch((err) => renderLobby(err.message || 'No se pudo conectar. Probá de nuevo.'));
  });
}

const fmt = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function statusOf(m) {
  const now = Date.now() + offset;
  const label = { focus: 'Enfocado', short: 'Descanso', long: 'Descanso largo' }[m.mode] || 'Conectado';
  if (m.running && m.endAt) return { cls: m.mode === 'focus' ? 'focus' : 'rest', text: `${label} · ${fmt(m.endAt - now)}` };
  if (m.remaining && m.started) return { cls: 'idle', text: `En pausa · ${fmt(m.remaining)}` };
  return { cls: 'idle', text: 'Sin empezar' };
}
function renderRoom() {
  const list = Object.entries(members).sort(([a], [b]) => (a === uid ? -1 : b === uid ? 1 : 0));
  const focusing = list.filter(([, m]) => m.running && m.mode === 'focus').length;
  const link = `${location.origin}${location.pathname}#sala=${room.code}`;
  view(`
    <div class="room-head">
      <div><span class="room-eyebrow">Sala</span><b class="room-code">${room.code}</b></div>
      <div class="room-actions">
        <button class="ghost sm" id="room-share">Invitar</button>
        <button class="ghost sm" id="room-leave">Salir</button>
      </div>
    </div>
    <p class="room-summary">${list.length} ${list.length === 1 ? 'persona' : 'personas'}${focusing ? ` · <b>${focusing} ${focusing === 1 ? 'enfocada' : 'enfocadas'} ahora</b>` : ''}</p>
    <ul class="room-list">
      ${list.map(([id, m]) => {
        const st = statusOf(m), me = id === uid;
        const what = [m.sub, m.task].filter(Boolean).map(esc).join(' · ');
        return `
        <li class="st-${st.cls}">
          <span class="avatar" style="--c:${colorOf(id)}">${esc((m.name || '?').slice(0, 1).toUpperCase())}</span>
          <div class="who"><b>${esc(m.name)}${me ? ' <small>(vos)</small>' : ''}</b>
            <span class="room-st" data-uid="${id}">${st.text}</span>
            ${what ? `<span class="room-what">${what}</span>` : ''}</div>
          <span class="room-today" title="Pomodoros de hoy">${m.today || 0}<small>hoy</small></span>
          ${me ? '' : `<button class="cheer" data-cheer="${id}" aria-label="Mandarle aplausos a ${esc(m.name)}">👏</button>`}
        </li>`;
      }).join('')}
    </ul>
    ${list.length < 2 ? `<p class="hint room-alone">Pasales el link a tus amigos: <span class="room-link">${esc(link)}</span></p>` : ''}`);
  box.querySelector('#room-leave').onclick = () => leave();
  box.querySelector('#room-share').onclick = () => share(link);
  box.querySelectorAll('[data-cheer]').forEach((b) => { b.onclick = () => cheer(b.dataset.cheer, b); });
}
// Actualizar solo los relojes cada segundo (sin redibujar toda la sala)
function tickClocks() {
  box.querySelectorAll('.room-st').forEach((el) => { const m = members[el.dataset.uid]; if (m) el.textContent = statusOf(m).text; });
}

function toast(text) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = text;
  document.body.appendChild(t);
  try { navigator.vibrate && navigator.vibrate(60); } catch {}
  setTimeout(() => t.classList.add('out'), 3200);
  setTimeout(() => t.remove(), 3800);
}
async function share(link) {
  try {
    if (navigator.share) { await navigator.share({ title: 'Estudiemos juntos en Foco', text: `Sumate a mi sala de estudio (${room.code})`, url: link }); return; }
  } catch { return; }
  try { await navigator.clipboard.writeText(link); toast('Link copiado. Pasáselo a tus amigos.'); }
  catch { toast(link); }
}

// ---------- Firebase ----------
async function connect() {
  const user = await ensureUser();
  uid = user.uid;
  if (fb) return fb;
  const { db, api } = await firebase();
  api.onValue(api.ref(db, '.info/serverTimeOffset'), (s) => { offset = s.val() || 0; });
  fb = { db, api };
  return fb;
}

// Al entrar o salir de la cuenta cambia el usuario: salir de la sala antes y volver a entrar después
window.__focoRoomPause = async () => {
  if (!room || !fb) return null;
  const keep = room; const { api } = fb;
  unsub.forEach((u) => u()); unsub = []; clearInterval(tick);
  try { await api.onDisconnect(memberRef).cancel(); await api.remove(memberRef); } catch {}
  room = null; memberRef = null; members = {};
  view('<p class="hint">Cambiando de cuenta…</p>');
  return keep;
};
window.__focoRoomResume = async (keep) => {
  if (!keep) return;
  try { await join(keep.code, keep.name); } catch { store.set('room', null); renderLobby(); }
};

function snapshotState() {
  const s = window.__focoState || {};
  return {
    mode: s.mode || 'focus', running: !!s.running,
    endAt: s.running && s.endAt ? Math.round(s.endAt + offset) : null,
    remaining: s.remaining || 0, started: !!s.started,
    sub: (s.sub || '').slice(0, 40), task: (s.task || '').slice(0, 60), today: Math.min(999, s.today || 0)
  };
}
function pushState(force = false) {
  if (!room || !memberRef) return;
  const st = snapshotState();
  const key = JSON.stringify(st);
  if (!force && key === lastSent) return;
  lastSent = key;
  const { api } = fb;
  api.update(memberRef, { ...st, seen: api.serverTimestamp() }).catch(() => {});
}
window.addEventListener('foco:state', () => pushState());

async function enter(code, name) {
  const { db, api } = fb;
  room = { code, name };
  store.set('room', room);
  memberRef = api.ref(db, `rooms/${code}/members/${uid}`);
  await api.onDisconnect(memberRef).remove();
  lastSent = '';
  await api.set(memberRef, { name, ...snapshotState(), seen: api.serverTimestamp() });
  lastSent = JSON.stringify(snapshotState());
  joinedAt = Date.now() + offset;
  unsub.push(api.onValue(api.ref(db, `rooms/${code}/members`), (s) => {
    const prev = members; members = s.val() || {};
    // Avisos suaves cuando alguien entra
    Object.keys(members).forEach((id) => { if (id !== uid && !prev[id] && Object.keys(prev).length) toast(`${members[id].name} entró a la sala`); });
    if (!members[uid] && room) {
      // Volvimos después de un corte: re-armar la salida automática y volver a aparecer
      api.onDisconnect(memberRef).remove().catch(() => {});
      api.set(memberRef, { name, ...snapshotState(), seen: api.serverTimestamp() }).catch(() => {});
    }
    renderRoom();
  }));
  unsub.push(api.onChildAdded(api.query(api.ref(db, `rooms/${code}/cheers`), api.orderByChild('at'), api.startAt(joinedAt)), (s) => {
    const c = s.val(); if (c && c.to === uid) toast(`${c.fromName} te mandó aplausos 👏`);
  }));
  clearInterval(tick); tick = setInterval(tickClocks, 1000);
  if (hashCode() !== code) history.replaceState(null, '', `#sala=${code}`);
}

async function create(name) {
  const { db, api } = await connect();
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    try { await api.set(api.ref(db, `rooms/${code}/createdAt`), api.serverTimestamp()); }
    catch { continue; } // el código ya existía: probar otro
    return enter(code, name);
  }
  throw new Error('No se pudo crear la sala. Probá de nuevo.');
}
async function join(code, name) {
  const { db, api } = await connect();
  const s = await api.get(api.ref(db, `rooms/${code}/createdAt`));
  if (!s.exists()) throw new Error(`No existe la sala ${code}. Revisá el código.`);
  return enter(code, name);
}
async function leave() {
  const { api } = fb;
  unsub.forEach((u) => u()); unsub = [];
  clearInterval(tick);
  try { await api.onDisconnect(memberRef).cancel(); await api.remove(memberRef); } catch {}
  room = null; memberRef = null; members = {};
  store.set('room', null);
  if (location.hash.includes('sala=')) history.replaceState(null, '', location.pathname);
  renderLobby();
}
async function cheer(to, btn) {
  const { db, api } = fb;
  btn.disabled = true; setTimeout(() => { btn.disabled = false; }, 4000);
  btn.classList.add('sent');
  try { await api.push(api.ref(db, `rooms/${room.code}/cheers`), { from: uid, fromName: room.name, to, at: api.serverTimestamp() }); }
  catch { toast('No se pudo mandar. Probá de nuevo.'); }
}

// ---------- Arranque ----------
(async () => {
  if (!box) return;
  if (!firebaseConfig) { renderOff(); return; }
  const saved = store.get('room', null);
  const fromLink = hashCode();
  if (saved && saved.code && (!fromLink || fromLink === saved.code)) {
    view('<p class="hint">Volviendo a tu sala…</p>');
    try { await join(saved.code, saved.name); return; }
    catch { store.set('room', null); }
  }
  renderLobby();
  if (fromLink) box.querySelector('#room-name')?.focus();
})();
