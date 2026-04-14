import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuración de Firebase — app Movie NaPi (proyecto movie-napi)
// Copia este archivo como firebase.ts y pega tu config de la consola.
// Firestore: desplegá las reglas del repo (firestore.rules) y creá índices si Firebase lo pide.
// Lista blanca allowedUsers: un documento por persona con ID = UID (Auth) o con campo email en minúsculas.
// Colecciones usadas: movies, movieRatings, userSettings.
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;

