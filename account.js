// Cuenta con Google, Foco Pro (pago único con Mercado Pago) y sincronización entre dispositivos.
// El estado Pro lo escribe solo el servidor de cobro (users/{uid}/pro); el resto de la app lo escucha
// con el evento "foco:pro". Los datos se guardan en users/{uid}/data y solo los Pro pueden escribirlos.
import { firebaseConfig, proConfig } from './firebase-config.js';
import { firebase } from './fb.js';

const btn = document.getElementById('pro-btn');
const sheet = document.getElementById('sheet');
const box = document.getElementById('sheet-box');
const SYNC = ['settings', 'log', 'subjects', 'notes'];
const PRICE = proConfig?.price || 1200;
const money = (n) => '$' + Number(n).toLocaleString('es-AR');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem('pf:' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('pf:' + k, JSON.stringify(v)); } catch {} },
  has(k) { try { return localStorage.getItem('pf:' + k) !== null; } catch { return false; } }
};

let f = null, user = null, pro = store.get('pro', null);
let proUnsub = null, dataUnsub = null, booting = null;
let reason = '', busy = '', note = '', sync = { state: '', at: 0 };
let promo = null, promoOpen = false; // { code, price } validado por el servidor

const REASONS = {
  catalog: 'El catálogo de materias es Pro',
  sounds: 'Ese sonido es Pro · escuchaste una muestra',
  freqs: 'Esa frecuencia es Pro · escuchaste una muestra',
  stats: 'Las estadísticas avanzadas son Pro'
};
const PERKS = [
  ['Sincronización', 'Materias, plan e historial iguales en el celu y la compu.'],
  ['Catálogo de materias', 'Programas oficiales separados en unidades y temas (Física 03 del CBC y UBA XXI, y vamos sumando).'],
  ['Estadísticas', 'Mapa de tus últimos 6 meses, tu mejor horario y horas por materia.'],
  ['Más sonidos', 'Café, tormenta, arroyo y noche de campo, y 3 frecuencias nuevas.']
];

// ---------- Interfaz ----------
function updateBtn() {
  btn.classList.toggle('on', !!pro);
  btn.textContent = pro ? 'Pro ✓' : 'Pro';
  btn.setAttribute('aria-label', pro ? 'Tu cuenta Foco Pro' : 'Conocé Foco Pro');
}
function open(why = '') {
  reason = why; note = '';
  sheet.hidden = false; document.body.classList.add('sheet-open');
  render();
  if (!f) boot().then(render, () => render());
}
function close() { sheet.hidden = true; document.body.classList.remove('sheet-open'); reason = ''; }

function render() {
  if (sheet.hidden) return;
  const signed = user && !user.isAnonymous;
  const perks = `<ul class="perks">${PERKS.map(([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`).join('')}</ul>`;
  const head = `
    <button class="sheet-x" data-act="close" aria-label="Cerrar">×</button>
    <span class="cat-badge">Foco Pro</span>`;
  const msg = note ? `<p class="sheet-note">${note}</p>` : '';
  let body;
  if (pro && signed) {
    const when = pro.at ? new Date(pro.at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const st = { ok: `Sincronizado${sync.at ? ' · ' + new Date(sync.at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : ''}`, busy: 'Sincronizando…', error: 'No se pudo sincronizar. Se reintenta solo.', '': 'Conectando…' }[sync.state];
    body = `${head}
      <h2 id="sheet-title">Sos Pro ✓</h2>
      <p class="sheet-sub">${esc(user.displayName || user.email || '')}${when ? ` · desde el ${when}` : ''}</p>
      <div class="sync-row"><span class="sync-dot ${sync.state}"></span>${st}</div>
      ${perks}${msg}
      <div class="sheet-actions"><button class="ghost" data-act="signout">Cerrar sesión</button></div>`;
  } else if (signed) {
    body = `${head}
      <h2 id="sheet-title">${reason ? REASONS[reason] || 'Pasate a Pro' : 'Pasate a Pro'}</h2>
      <p class="sheet-sub">Hola, ${esc((user.displayName || '').split(' ')[0] || user.email)}. Un solo pago y es tuyo para siempre.</p>
      ${perks}${msg}
      <div class="price">${promo ? `<s>${money(PRICE)}</s>` : ''}<b>${money(promo ? promo.price : PRICE)}</b><span>pesos argentinos · pago único · sin suscripción</span></div>
      ${promo ? `<p class="promo-ok">Código <b>${esc(promo.code)}</b> aplicado <button class="link" data-act="promo-clear">quitar</button></p>`
        : promoOpen ? `<form class="promo-form" data-promo><input name="code" maxlength="20" autocomplete="off" autocapitalize="characters" placeholder="Código de descuento" aria-label="Código de descuento"><button class="ghost sm" type="submit" ${busy ? 'disabled' : ''}>${busy === 'promo' ? 'Revisando…' : 'Aplicar'}</button></form>`
        : '<button class="link promo-link" data-act="promo-open">¿Tenés un código de descuento?</button>'}
      <button class="add wide" data-act="buy" ${busy ? 'disabled' : ''}>${busy === 'buy' ? 'Abriendo el pago…' : 'Pagar · tarjeta, efectivo o Mercado Pago'}</button>
      <p class="sheet-fine pay-fine">No necesitás cuenta de Mercado Pago: podés pagar con tarjeta de crédito, débito o prepaga, o en efectivo en Rapipago o Pago Fácil.</p>
      <div class="sheet-actions"><button class="link" data-act="signout">Usar otra cuenta</button></div>`;
  } else {
    body = `${head}
      <h2 id="sheet-title">${reason ? REASONS[reason] || 'Foco Pro' : 'Foco Pro'}</h2>
      <p class="sheet-sub">Todo lo que ya usás sigue gratis. Pro suma esto:</p>
      ${perks}
      <div class="price"><b>${money(PRICE)}</b><span>pesos argentinos · pago único · sin suscripción</span></div>${msg}
      <button class="add wide google" data-act="signin" ${busy || (!f && booting) ? 'disabled' : ''}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9z"/></svg>
        ${busy === 'signin' ? 'Entrando…' : 'Entrar con Google para comprar'}</button>
      <p class="sheet-fine">La Pro queda en tu cuenta de Google: la usás en todos tus dispositivos.<br>
        Al continuar aceptás los <a href="/terminos/" target="_blank">términos</a> y la <a href="/privacidad/" target="_blank">política de privacidad</a>.</p>`;
  }
  box.innerHTML = body;
}

sheet.addEventListener('click', async (e) => {
  if (e.target === sheet) { close(); return; }
  const act = e.target.closest('[data-act]')?.dataset.act; if (!act) return;
  if (act === 'close') return close();
  try {
    if (act === 'signin') { busy = 'signin'; render(); await signIn(); }
    else if (act === 'signout') { busy = 'signout'; render(); await signOut(); }
    else if (act === 'buy') { busy = 'buy'; render(); await buy(); return; }
    else if (act === 'promo-open') { promoOpen = true; render(); box.querySelector('[data-promo] input')?.focus(); return; }
    else if (act === 'promo-clear') { promo = null; promoOpen = true; }
  } catch (err) { note = esc(err.message || 'Algo falló. Probá de nuevo.'); }
  busy = ''; render();
});
sheet.addEventListener('submit', async (e) => {
  const form = e.target.closest('[data-promo]'); if (!form) return;
  e.preventDefault();
  const code = form.code.value.trim(); if (!code) return;
  busy = 'promo'; note = ''; render();
  try { const r = await api('/quote', { code }); promo = r.code ? { code: r.code, price: r.price } : null; }
  catch (err) { note = esc(err.message); }
  busy = ''; render();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) close(); });
btn.addEventListener('click', () => open());
window.addEventListener('foco:paywall', (e) => { if (!pro) open(e.detail || ''); });

// ---------- Cuenta ----------
function boot() {
  return (booting ||= (async () => {
    f = await firebase();
    const A = f.authApi;
    try { await A.getRedirectResult(f.auth); } catch (e) { await recoverLink(e).catch(() => {}); }
    A.onAuthStateChanged(f.auth, onUser);
    onUser(f.auth.currentUser);
  })());
}
function onUser(u) {
  if (u?.uid === user?.uid && !!u?.isAnonymous === !!user?.isAnonymous && proUnsub) return;
  user = u;
  proUnsub?.(); proUnsub = null;
  if (!u || u.isAnonymous) { store.set('acct', false); setPro(null); render(); return; }
  store.set('acct', true);
  const { api, db } = f;
  proUnsub = api.onValue(api.ref(db, `users/${u.uid}/pro`), (s) => setPro(s.val()), () => {});
  render();
}
function setPro(p) {
  pro = p || null;
  store.set('pro', pro ? { at: pro.at || Date.now() } : null);
  window.dispatchEvent(new CustomEvent('foco:pro', { detail: !!pro }));
  updateBtn();
  if (pro && user && !user.isAnonymous) startSync(); else stopSync();
  render();
}

function friendly(e) {
  const code = e?.code || '';
  if (code === 'auth/operation-not-allowed') return new Error('El ingreso con Google todavía no está activado. Probá más tarde.');
  if (code === 'auth/unauthorized-domain') return new Error('Este sitio no está autorizado para entrar con Google.');
  if (code === 'auth/network-request-failed') return new Error('Sin conexión. Revisá internet y probá de nuevo.');
  return new Error('No se pudo entrar con Google. Probá de nuevo.');
}
// Si esa cuenta de Google ya existía, se entra con ella (dejando el usuario invitado)
async function recoverLink(e) {
  const A = f.authApi;
  if (e?.code !== 'auth/credential-already-in-use') throw e;
  const cred = A.GoogleAuthProvider.credentialFromError(e);
  if (!cred) throw e;
  const keep = await window.__focoRoomPause?.();
  await A.signInWithCredential(f.auth, cred);
  await window.__focoRoomResume?.(keep);
}
async function signIn() {
  await boot();
  const A = f.authApi, auth = f.auth;
  const provider = new A.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cur = auth.currentUser;
  try {
    // Si ya era invitado (por las salas), se le agrega Google: conserva su lugar en la sala
    if (cur?.isAnonymous) await A.linkWithPopup(cur, provider);
    else await A.signInWithPopup(auth, provider);
  } catch (e) {
    if (e.code === 'auth/credential-already-in-use') await recoverLink(e);
    else if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
      if (cur?.isAnonymous) await A.linkWithRedirect(cur, provider); else await A.signInWithRedirect(auth, provider);
      return;
    } else if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
    else throw friendly(e);
  }
  await auth.currentUser?.reload().catch(() => {});
  onUser(auth.currentUser);
}
async function signOut() {
  await boot();
  stopSync();
  const keep = await window.__focoRoomPause?.();
  await f.authApi.signOut(f.auth);
  store.set('pro', null);
  await window.__focoRoomResume?.(keep);
}

// ---------- Pago ----------
async function api(path, body) {
  if (!proConfig?.api) throw new Error('El cobro se está activando. Volvé a probar en un rato.');
  const token = await user.getIdToken();
  const r = await fetch(proConfig.api.replace(/\/$/, '') + path, {
    method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(body || {})
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'No se pudo conectar con el cobro. Probá de nuevo.');
  return j;
}
async function buy() {
  if (!user || user.isAnonymous) throw new Error('Primero entrá con Google.');
  const { url } = await api('/checkout', promo ? { code: promo.code } : {});
  location.href = url;
}
// Al volver de Mercado Pago: confirmar el pago enseguida (el aviso del servidor también lo hace solo)
async function returnFromPayment() {
  const q = new URLSearchParams(location.search);
  if (!q.has('pro')) return;
  const payment = q.get('payment_id') || q.get('collection_id');
  const status = q.get('pro');
  history.replaceState(null, '', location.pathname + location.hash);
  open();
  if (status === 'fail') { note = 'El pago no se completó. No se te cobró nada.'; render(); return; }
  note = 'Confirmando tu pago…'; render();
  try {
    await boot();
    await new Promise((res) => { const t = setInterval(() => { if (user) { clearInterval(t); res(); } }, 100); setTimeout(() => { clearInterval(t); res(); }, 5000); });
    if (user && !user.isAnonymous) {
      // El servidor recuerda la última orden de esta cuenta; reintenta unos segundos por si la acreditación demora
      let r = { pro: false };
      for (let i = 0; i < 4 && !r.pro; i++) {
        r = await api('/confirm', { payment_id: payment || '' });
        if (!r.pro && i < 3) await new Promise((res) => setTimeout(res, 2500));
      }
      note = r.pro ? '¡Listo! Ya sos Pro. Gracias por bancar Foco 💙' : r.status === 'pending' || r.status === 'processing' || status === 'pending'
        ? 'Tu pago está pendiente. Si elegiste efectivo, pagá el cupón en Rapipago o Pago Fácil: la Pro se activa sola cuando se acredite (puede tardar unas horas).' : 'El pago no figura aprobado todavía. Si te lo cobraron, se activa solo en unos minutos.';
    } else note = status === 'pending' ? 'Tu pago está pendiente. Si elegiste efectivo, pagá el cupón en Rapipago o Pago Fácil: la Pro se activa sola cuando se acredite (puede tardar unas horas).' : '';
  } catch (e) { note = esc(e.message); }
  render();
}

// ---------- Sincronización ----------
const mtimes = () => store.get('mtime', {});
function writeQuiet(k, v, t) {
  try { localStorage.setItem('pf:' + k, JSON.stringify(v)); } catch {}
  const m = mtimes(); m[k] = t; store.set('mtime', m);
}
const parse = (s, d) => { try { return JSON.parse(s); } catch { return d; } };
function mergeLog(a, b) {
  const seen = new Map();
  for (const x of [...a, ...b]) if (x && x.ts) seen.set(`${x.ts}|${x.min}`, x);
  return [...seen.values()].sort((x, y) => x.ts - y.ts);
}
function setSync(state) { sync = { state, at: state === 'ok' ? Date.now() : sync.at }; render(); }
let pending = new Set(), timer = null;
async function upload(keys) {
  if (!dataUnsub || !keys.length) return;
  const { api: A, db } = f, m = mtimes(), patch = {};
  for (const k of keys) {
    const t = m[k] || Date.now();
    patch[k] = { v: JSON.stringify(store.get(k, k === 'settings' ? {} : [])), t };
    if (!m[k]) { m[k] = t; store.set('mtime', m); }
  }
  setSync('busy');
  try { await A.update(A.ref(db, `users/${user.uid}/data`), patch); setSync('ok'); }
  catch { setSync('error'); }
}
function onSaved(e) {
  if (!SYNC.includes(e.detail)) return;
  pending.add(e.detail);
  clearTimeout(timer);
  timer = setTimeout(() => { const k = [...pending]; pending.clear(); upload(k); }, 1500);
}
function applyRemote(data) {
  const m = mtimes(); const up = []; let changed = false;
  for (const k of SYNC) {
    const r = data[k], rt = r?.t || 0;
    const lt = m[k] || (store.has(k) ? 1 : 0);
    if (k === 'log') {
      const local = store.get('log', []), remote = r ? parse(r.v, []) : [];
      // Si alguien borró el historial, gana el borrado más nuevo; si no, se juntan las sesiones de los dos lados
      if (r && !remote.length && rt > lt) { if (local.length) { writeQuiet('log', [], rt); changed = true; } continue; }
      if (!local.length && lt > rt && r && remote.length) { up.push('log'); continue; }
      const merged = mergeLog(local, remote);
      if (merged.length !== local.length) { writeQuiet('log', merged, Math.max(lt, rt)); changed = true; }
      if (!r ? merged.length : merged.length !== remote.length) { const t = Date.now(); writeQuiet('log', merged, t); up.push('log'); }
      continue;
    }
    if (r && rt > lt) { writeQuiet(k, parse(r.v, null), rt); changed = true; }
    else if (lt > rt && store.has(k)) up.push(k);
  }
  if (changed) window.__focoReload?.();
  if (up.length) upload(up); else setSync('ok');
}
function startSync() {
  if (dataUnsub || !f || !user) return;
  const { api: A, db } = f;
  setSync('busy');
  dataUnsub = A.onValue(A.ref(db, `users/${user.uid}/data`), (s) => applyRemote(s.val() || {}), () => setSync('error'));
  window.addEventListener('foco:saved', onSaved);
}
function stopSync() {
  dataUnsub?.(); dataUnsub = null;
  window.removeEventListener('foco:saved', onSaved);
  clearTimeout(timer); pending.clear();
  sync = { state: '', at: 0 };
}

// ---------- Arranque ----------
if (!firebaseConfig || !btn) { if (btn) btn.hidden = true; }
else {
  updateBtn();
  // Solo se carga Firebase al abrir si ya habías entrado con tu cuenta o volvés de pagar
  if (store.get('acct', false) || new URLSearchParams(location.search).has('pro')) boot().catch(() => {});
  returnFromPayment();
}
