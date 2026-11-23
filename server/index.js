// Servidor de cobro de Foco Pro (Google Cloud Functions, Node 24) con Checkout Pro de Mercado Pago.
//   POST /quote     → valida un código de descuento
//   POST /checkout  → crea el pago (preferencia) para el usuario logueado y devuelve el link
//   POST /confirm   → al volver de Mercado Pago, busca los pagos de la cuenta y activa la Pro
//   POST /webhook   → aviso automático de Mercado Pago (tema "payment"); consulta el pago y activa la Pro
// Nunca se confía en el navegador: cada pago se consulta a Mercado Pago con el token privado.
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

// Activa la Pro si el pago está aprobado, en pesos y por el precio que fijó el servidor. Idempotente.
// (metadata la carga el servidor al crear el pago; el comprador no la puede cambiar)
const UID_RE = /^[A-Za-z0-9]{10,64}$/;
async function grant(p) {
  const db = admin.database();
  const uid = String(p.external_reference || '');
  // Es de Foco si trae nuestra marca o si la descripción es la del producto (algunos pagos llegan sin metadata)
  const isFoco = p.metadata?.app === 'foco-pro' || String(p.description || '').startsWith('Foco Pro');
  if (!isFoco || !UID_RE.test(uid)) return { pro: false, status: 'ajeno' };
  const id = String(p.id);
  // Pago devuelto (total o parcial) o contracargo: se quita la Pro que dio ese mismo pago
  if (['refunded', 'charged_back'].includes(p.status) || Number(p.transaction_amount_refunded || 0) > 0) {
    const proRef = db.ref(`users/${uid}/pro`);
    const cur = (await proRef.get()).val();
    if (cur && cur.pay === id) { await proRef.remove(); await db.ref(`payments/${id}`).update({ refundedAt: Date.now() }); }
    return { pro: false, status: 'refunded' };
  }
  // Precio esperado: el de la marca del pago o, si no vino, el último que el servidor le cotizó a esa cuenta
  const last = (await db.ref(`checkouts/${uid}`).get()).val();
  const expected = Number(p.metadata?.price) || Number(last?.price) || PRICE;
  const amount = Number(p.transaction_amount || 0);
  if (!(p.status === 'approved' && p.currency_id === 'ARS' && amount >= expected)) return { pro: false, status: p.status };
  const code = p.metadata?.code || last?.code || null;
  const first = await db.ref(`payments/${id}`).transaction((cur) => (cur ? undefined : { uid, amount, at: Date.now(), code }));
  if (first.committed && code) await db.ref(`promo/${code}/used`).transaction((n) => (n || 0) + 1);
  const proRef = db.ref(`users/${uid}/pro`);
  if (!(await proRef.get()).exists()) await proRef.set({ at: Date.now(), pay: id, amount });
  return { pro: true, status: 'approved', uid };
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
      const pref = await mp('/checkout/preferences', {
        method: 'POST',
        body: JSON.stringify({
          items: [{ id: 'foco-pro', title: 'Foco Pro · pago único', quantity: 1, unit_price: price, currency_id: 'ARS' }],
          external_reference: u.uid,
          metadata: { app: 'foco-pro', uid: u.uid, price, code: promo?.code || null },
          back_urls: { success: `${SITE}/?pro=ok`, pending: `${SITE}/?pro=pending`, failure: `${SITE}/?pro=fail` },
          auto_return: 'approved',
          notification_url: `https://${req.get('host')}/webhook`,
          statement_descriptor: 'FOCO PRO',
          payment_methods: { installments: 1 }
        })
      });
      await admin.database().ref(`checkouts/${u.uid}`).set({ price, code: promo?.code || null, pref: pref.id, at: Date.now() });
      return res.json({ url: pref.init_point });
    }

    if (path === '/confirm') {
      // Busca los pagos de esta cuenta en Mercado Pago (no hace falta que el navegador mande nada)
      const u = await userFrom(req);
      const found = await mp(`/v1/payments/search?external_reference=${encodeURIComponent(u.uid)}&sort=date_created&criteria=desc&limit=20`);
      let pending = false;
      for (const p of found.results || []) {
        if (String(p.external_reference) !== u.uid) continue;
        const r = await grant(p);
        if (r.pro) return res.json({ pro: true, status: 'approved' });
        if (p.status === 'pending' || p.status === 'in_process') pending = true;
      }
      return res.json({ pro: false, status: pending ? 'pending' : (found.results || []).length ? 'rejected' : 'none' });
    }

    if (path === '/webhook') {
      const type = req.body?.type || req.query.type || req.query.topic || '';
      const id = String(req.body?.data?.id || req.query['data.id'] || req.query.id || '');
      if (!validSignature(req, req.query['data.id'] || id)) return res.status(401).send('firma inválida');
      if (type === 'payment' && /^d+$/.test(id)) await grant(await mp(`/v1/payments/${id}`));
      return res.status(200).send('ok');
    }

    return res.status(404).json({ error: 'No encontrado' });
  } catch (e) {
    console.error(e.message, e.detail || '');
    return res.status(e.status || 500).json({ error: e.status ? e.message : 'No se pudo procesar el pago. Probá de nuevo.' });
  }
});
