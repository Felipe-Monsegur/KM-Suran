# KM Suran

Aplicación web para registrar uso del auto y costos de nafta, con balance estilo tricount.

## Qué hace

- Registrar viajes (usuario, km, fecha, descripción opcional).
- Registrar cargas de nafta (usuario, monto, litros opcionales, fecha, descripción opcional).
- Ver métricas generales: km totales, gasto total y costo promedio por km.
- Calcular balance entre personas según uso real.
- Administrar datos en tabla (`Datos`): filtrar, editar y borrar.
- Exportar e importar backup JSON desde el menú hamburguesa en `Datos`.

## Lógica de balance (tricount)

El balance se calcula por tramos de consumo:

- Cada carga de nafta se reparte por los km recorridos desde esa carga hasta la siguiente.
- En cada tramo: `costo por km = monto de la carga / km del tramo`.
- A cada persona se le asigna: `km personales del tramo * costo por km`.
- Balance final por persona: `pagó en nafta - debería pagar`.

Resultado:
- **A favor**: pagó más de lo que le correspondía por sus km.
- **En contra**: pagó menos de lo que le correspondía por sus km.

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Firebase:
  - Authentication
  - Firestore
  - Hosting

## Instalación

```bash
npm install
copy src\config\firebase.example.ts src\config\firebase.ts
```

Configurá `src/config/firebase.ts` con tu proyecto Firebase.

## Ejecutar local

```bash
npm run dev
```

Abrir: `http://localhost:5173`

También podés usar `local.bat` en Windows.

## Firestore y acceso

- Reglas en: `firestore.rules`
- Colecciones principales:
  - `trips`
  - `fuelCharges`
  - `allowedUsers`
  - `userSettings`

Para permitir usuarios, agregar su UID/email en `allowedUsers`.

## Build y deploy

```bash
npm run build
firebase deploy --only hosting,firestore:rules
```

O usar `publicar.bat`.

## Repositorio

https://github.com/Felipe-Monsegur/KM-Suran
