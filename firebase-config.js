// Configuración pública del proyecto de Firebase (no es secreta: la seguridad está en las
// reglas de la base de datos, ver database.rules.json).
export const firebaseConfig = {
  apiKey: 'AIzaSyB_-XOYQfOp8Q3iLY-CWrcODloFcZEpMyE',
  authDomain: 'foco-estudio-1b47c.firebaseapp.com',
  databaseURL: 'https://foco-estudio-1b47c-default-rtdb.firebaseio.com',
  projectId: 'foco-estudio-1b47c',
  storageBucket: 'foco-estudio-1b47c.firebasestorage.app',
  messagingSenderId: '80899739270',
  appId: '1:80899739270:web:fba05468439915be464b07'
};

// Foco Pro: precio del pago único (en pesos) y dirección del servidor de cobro (Mercado Pago).
// El precio que vale es el del servidor; este es el que se muestra.
export const proConfig = {
  price: 5000,
  api: 'https://foco-pro-a5lrhs73aa-uc.a.run.app'
};
