// Firebase compartido entre salas (rooms.js) y cuenta/Pro (account.js): se inicializa una sola vez.
import { firebaseConfig } from './firebase-config.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
let ready = null;

export function firebase() {
  if (!firebaseConfig) return Promise.reject(new Error('Firebase no está configurado'));
  return (ready ||= (async () => {
    const [{ initializeApp }, authApi, api] = await Promise.all([
      import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-database.js')
    ]);
    const app = initializeApp(firebaseConfig);
    const auth = authApi.getAuth(app);
    auth.languageCode = 'es';
    const db = api.getDatabase(app);
    await auth.authStateReady();
    return { app, auth, authApi, db, api };
  })());
}

// Usuario actual; si no hay nadie, entra como invitado (anónimo) para poder usar las salas
export async function ensureUser() {
  const f = await firebase();
  if (!f.auth.currentUser) await f.authApi.signInAnonymously(f.auth);
  return f.auth.currentUser;
}
