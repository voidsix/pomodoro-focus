// Servidor de cobro de Foco Pro (Google Cloud Functions, Node 20).
//   POST /checkout  → crea el pago en Mercado Pago para el usuario logueado y devuelve el link
//   POST /confirm   → al volver de Mercado Pago, verifica el pago y activa la Pro
//   POST /webhook   → aviso automático de Mercado Pago; verifica el pago y activa la Pro
// Nunca se confía en lo que manda el navegador: cada pago se consulta a Mercado Pago con el token privado.
import functions from '@google-cloud/functions-framework';
import admin from 'firebase-admin';
import crypto from 'node:crypto';

admin.initializeApp({ databaseURL: process.env.DATABASE_URL || 'https://foco-estudio-1b47c-default-rtdb.firebaseio.com' });

const PRICE = Number(process.env.PRICE || 5000);           // pesos, pago único
const MP_TOKEN = process.env.MP_ACCESS_TOKEN;               // secreto (Secret Manager)
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;    // opcional: firma de los avisos
const SITE = (process.env.SITE_URL || 'https://focoestudio.app').replace(/\/$/, '');
const ORIGINS = new Set([SITE, 'https://www.focoestudio.app', 'http://localhost:8765', 'http://127.0.0.1:8765']);

async function mp(path, init = {}) {
  const r = await fetch('https://api.mercadopago.com' + path, {
    ...init, headers: { Authorization: `Bearer ${MP_TOKEN}`, 'Content-Type': 'application/json', ...(init.headers || {}) }
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(`Mercado Pago ${r.status}`); e.detail = body; throw e; }
  return body;
}

async function userFrom(req) {
  const m = (req.get('authorization') || '').match(/^Bearer (.+)$/);
  if (!m) throw Object.assign(new Error('Falta iniciar sesión.'), { status: 401 });
  const t = await admin.auth().verifyIdToken(m[1]).catch(() => null);
  if (!t) throw Object.assign(new Error('Sesión vencida. Volvé a entrar.'), { status: 401 });
  if (t.firebase?.sign_in_provider === 'anonymous') throw Object.assign(new Error('Entrá con Google para comprar.'), { status: 403 });
  return t;
}

// Activa la Pro si el pago está aprobado, es en pesos y alcanza el precio. Idempotente.
async function grant(payment) {
  const uid = String(payment.external_reference || '');
  const ok = payment.status === 'approved' && payment.currency_id === 'ARS'
    && Number(payment.transaction_amount) >= PRICE && /^[A-Za-z0-9]{10,64}$/.test(uid);
  if (!ok) return { pro: false, status: payment.status };
  const db = admin.database();
  await db.ref(`payments/${payment.id}`).transaction((cur) => cur || { uid, amount: payment.transaction_amount, at: Date.now() });
  const proRef = db.ref(`users/${uid}/pro`);
  if (!(await proRef.get()).exists()) {
    await proRef.set({ at: Date.now(), pay: String(payment.id), amount: Number(payment.transaction_amount) });
  }
  return { pro: true, status: payment.status, uid };
}

function validSignature(req, dataId) {
  if (!MP_WEBHOOK_SECRET) return true; // sin secreto configurado igual es seguro: el pago se consulta a Mercado Pago
  const sig = req.get('x-signature') || '', reqId = req.get('x-request-id') || '';
  const parts = Object.fromEntries(sig.split(',').map((p) => p.trim().split('=')));
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${reqId};ts:${parts.ts};`;
  const mac = crypto.createHmac('sha256', MP_WEBHOOK_SECRET).update(manifest).digest('hex');
  return mac.length === parts.v1.length && crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(parts.v1));
}

functions.http('api', async (req, res) => {
  const origin = req.get('origin');
  if (origin && ORIGINS.has(origin)) { res.set('Access-Control-Allow-Origin', origin); res.set('Vary', 'Origin'); }
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  if (!MP_TOKEN) return res.status(503).json({ error: 'El cobro todavía no está configurado.' });
  const path = req.path.replace(/\/+$/, '');

  try {
    if (path === '/checkout') {
      const u = await userFrom(req);
      if ((await admin.database().ref(`users/${u.uid}/pro`).get()).exists()) return res.json({ already: true, url: SITE + '/?pro=ok' });
      const self = `https://${req.get('host')}`;
      const pref = await mp('/checkout/preferences', {
        method: 'POST',
        body: JSON.stringify({
          items: [{ id: 'foco-pro', title: 'Foco Pro · pago único', quantity: 1, unit_price: PRICE, currency_id: 'ARS' }],
          external_reference: u.uid,
          payer: u.email ? { email: u.email } : undefined,
          back_urls: { success: `${SITE}/?pro=ok`, pending: `${SITE}/?pro=pending`, failure: `${SITE}/?pro=fail` },
          auto_return: 'approved',
          notification_url: `${self}/webhook`,
          statement_descriptor: 'FOCO PRO',
          payment_methods: { installments: 1 }
        })
      });
      return res.json({ url: pref.init_point });
    }

    if (path === '/confirm') {
      const u = await userFrom(req);
      const id = String(req.body?.payment_id || '').replace(/\D/g, '');
      if (!id) return res.status(400).json({ error: 'Falta el número de pago.' });
      const p = await mp(`/v1/payments/${id}`);
      if (String(p.external_reference) !== u.uid) return res.status(403).json({ error: 'Ese pago es de otra cuenta.' });
      return res.json(await grant(p));
    }

    if (path === '/webhook') {
      const type = req.body?.type || req.query.type || req.query.topic;
      const id = String(req.body?.data?.id || req.query['data.id'] || req.query.id || '');
      if (!validSignature(req, req.query['data.id'] || id)) return res.status(401).send('firma inválida');
      if (type === 'payment' && /^\d+$/.test(id)) await grant(await mp(`/v1/payments/${id}`));
      return res.status(200).send('ok');
    }

    return res.status(404).json({ error: 'No encontrado' });
  } catch (e) {
    console.error(e.message, e.detail || '');
    return res.status(e.status || 500).json({ error: e.status ? e.message : 'No se pudo procesar el pago. Probá de nuevo.' });
  }
});
