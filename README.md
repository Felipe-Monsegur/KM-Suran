# Movie-NaPi

App web para compartir una **lista de películas por ver**, **puntuar** (1–10), **opinar** y ver un **panel** con la nota de cada persona y el **promedio**.

**Stack:** React 18, TypeScript, Vite, Tailwind CSS, Firebase (Authentication + Firestore + Hosting opcional).

---

## Documentación en el repo

| Archivo | Contenido |
|--------|-----------|
| [INICIO_RAPIDO.md](./INICIO_RAPIDO.md) | Instalar, Firebase, primera ejecución |
| [PUBLICAR.md](./PUBLICAR.md) | Build, Hosting, actualizar la app online |
| [AGREGAR_USUARIOS.md](./AGREGAR_USUARIOS.md) | Lista blanca `allowedUsers` |
| [COMO_FUNCIONA.md](./COMO_FUNCIONA.md) | Pantallas, datos en Firestore, flujo |

---

## Inicio mínimo

```bash
npm install
copy src\config\firebase.example.ts src\config\firebase.ts
```

Editá `src/config/firebase.ts` con la config de tu app web en Firebase Console.

```bash
npm run dev
```

Abrí `http://localhost:5173` o ejecutá `local.bat` (Windows).

**Firebase:** Auth (email/contraseña), Firestore, publicar reglas desde `firestore.rules`. Colección **`allowedUsers`** con el UID de cada quien (ver [AGREGAR_USUARIOS.md](./AGREGAR_USUARIOS.md)).

**Proyecto Firebase de referencia:** `movie-napi` (podés usar otro; actualizá `firebase.ts` y `firebase use`).

---

## Publicar en internet

```bash
npm run build
firebase deploy --only hosting,firestore:rules
```

O `publicar.bat`. Detalle en [PUBLICAR.md](./PUBLICAR.md).

---

## Repositorio

https://github.com/Felipe-Monsegur/Movie-NaPi

`firebase.ts` y `.firebaserc` no se versionan (`.gitignore`); cada entorno copia `firebase.example.ts` y configura el CLI.

---

Uso personal / privado.
