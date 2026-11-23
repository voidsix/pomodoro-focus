// Servidor de cobro de Foco Pro (Google Cloud Functions, Node 24).
//   POST /checkout  → crea el pago en Mercado Pago para el usuario logueado y devuelve el link
//   POST /confirm   → al volver de Mercado Pago, consulta la última orden del usuario y activa la Pro
//   POST /webhook   → aviso de Mercado Pago (tema "Order"); consulta la orden y activa la Pro
// Usa la API de Orders (Checkout Pro). Nunca se confía en el navegador: cada orden se consulta a Mercado Pago.
import functions from '@google-cloud/functions-framework';
import admin from 'firebase-admin';
import crypto from 'node:crypto';

admin.initializeApp({ databaseURL: process.env.DATABASE_URL || 'https://foco-estudio-1b47c-default-rtdb.firebaseio.com' });

const PRICE = Number(process.env.PRICE || 1200);           // pesos, pago único
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

// Activa la Pro si la orden está pagada y acreditada, en pesos y por el precio completo. Idempotente.
async function grant(order) {
  const uid = String(order.external_reference || '');
  const paid = Number(order.total_paid_amount ?? 0), total = Number(order.total_amount ?? 0);
  // Pago devuelto (total o parcial) o contracargo: se quita la Pro que dio esa misma orden
  const refunded = order.status === 'refunded' || order.status_detail === 'partially_refunded'
    || (order.transactions?.chargebacks || []).length > 0;
  if (refunded && /^[A-Za-z0-9]{10,64}$/.test(uid)) {
    const db = admin.database(), proRef = db.ref(`users/${uid}/pro`);
    const cur = (await proRef.get()).val();
    if (cur && cur.pay === String(order.id)) {
      await proRef.remove();
      await db.ref(`payments/${order.id}`).update({ refundedAt: Date.now() });
    }
    return { pro: false, status: 'refunded' };
  }
  // Precio que se le cobró a esta orden (el normal, o el de un código de descuento que validó el servidor)
  const db = admin.database();
  const meta = (await db.ref(`orderMeta/${order.id}`).get()).val();
  const expected = meta?.price || PRICE;
  const ok = order.status === 'processed' && order.status_detail === 'accredited'
    && (!order.currency || order.currency === 'ARS')
    && total >= expected && paid >= total && /^[A-Za-z0-9]{10,64}$/.test(uid);
  if (!ok) return { pro: false, status: order.status, detail: order.status_detail };
  const first = await db.ref(`payments/${order.id}`).transaction((cur) => (cur ? undefined : { uid, amount: paid, at: Date.now(), code: meta?.code || null }));
  if (first.committed && meta?.code) await db.ref(`promo/${meta.code}/used`).transaction((n) => (n || 0) + 1);
  const proRef = db.ref(`users/${uid}/pro`);
  if (!(await proRef.get()).exists()) {
    await proRef.set({ at: Date.now(), pay: String(order.id), amount: paid });
  }
  return { pro: true, status: order.status, uid };
}

// Códigos de descuento: promo/{CODIGO} = { price, max?, used?, until? } (los crea server/codigo.ps1)
const cleanCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
async function promoFor(raw) {
  const code = cleanCode(raw);
  if (!code) return null;
  const p = (await admin.database().ref(`promo/${code}`).get()).val();
  const valid = p && Number(p.price) > 0 && Number(p.price) < PRICE
    && (!p.max || (p.used || 0) < p.max) && (!p.until || Date.now() < p.until);
  if (!valid) throw Object.assign(new Error('Ese código no existe o ya venció.'), { status: 400 });
  return { code, price: Number(p.price) };
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
    if (path === '/quote') {
      await userFrom(req);
      const promo = await promoFor(req.body?.code);
      return res.json(promo ? { code: promo.code, price: promo.price } : { price: PRICE });
    }

    if (path === '/checkout') {
      const u = await userFrom(req);
      if ((await admin.database().ref(`users/${u.uid}/pro`).get()).exists()) return res.json({ already: true, url: SITE + '/?pro=ok' });
      const promo = await promoFor(req.body?.code);
      const price = promo ? promo.price : PRICE;
      const amount = price.toFixed(2);
      const order = await mp('/v1/orders', {
        method: 'POST',
        headers: { 'X-Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({
          type: 'online',
          processing_mode: 'manual',
          total_amount: amount,
          external_reference: u.uid,
          description: 'Foco Pro · pago único',
          items: [{ title: 'Foco Pro · pago único', unit_price: amount, quantity: 1, external_code: 'foco-pro' }],
          config: {
            statement_descriptor: 'FOCO PRO',
            online: { success_url: `${SITE}/?pro=ok`, pending_url: `${SITE}/?pro=pending`, failure_url: `${SITE}/?pro=fail`, auto_return: 'approved' },
            payment_method: { max_installments: 1 }
          }
        })
      });
      // Guardar la última orden del usuario: al volver se confirma con ella (no hace falta que el navegador la mande)
      await admin.database().ref(`orders/${u.uid}`).set({ id: String(order.id), at: Date.now() });
      await admin.database().ref(`orderMeta/${order.id}`).set({ uid: u.uid, price, code: promo?.code || null, at: Date.now() });
      return res.json({ url: order.checkout_url || order.init_point });
    }

    if (path === '/confirm') {
      const u = await userFrom(req);
      const saved = (await admin.database().ref(`orders/${u.uid}`).get()).val();
      if (!saved?.id) return res.json({ pro: false, status: 'none' });
      const order = await mp(`/v1/orders/${encodeURIComponent(saved.id)}`);
      if (String(order.external_reference) !== u.uid) return res.status(403).json({ error: 'Esa orden es de otra cuenta.' });
      const r = await grant(order);
      return res.json({ ...r, status: r.pro ? 'approved' : order.status === 'processing' ? 'pending' : order.status });
    }

    if (path === '/webhook') {
      const type = req.body?.type || req.query.type || req.query.topic || '';
      const id = String(req.body?.data?.id || req.query['data.id'] || req.query.id || '');
      if (!validSignature(req, req.query['data.id'] || id)) return res.status(401).send('firma inválida');
      if (/^order/.test(type) && /^[A-Za-z0-9_-]{4,64}$/.test(id)) {
        const order = await mp(`/v1/orders/${encodeURIComponent(id)}`);
        if (/^[A-Za-z0-9]{10,64}$/.test(String(order.external_reference || ''))) await grant(order);
      }
      return res.status(200).send('ok');
    }

    return res.status(404).json({ error: 'No encontrado' });
  } catch (e) {
    console.error(e.message, e.detail || '');
    return res.status(e.status || 500).json({ error: e.status ? e.message : 'No se pudo procesar el pago. Probá de nuevo.' });
  }
});
