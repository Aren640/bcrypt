# Login con bcrypt + JWT (hecho por mi)

Este proyecto lo hice para practicar inicio de sesion de forma real: registrar usuario, loguear y proteger una ruta con token.
No quise hacerlo mega complejo, pero si dejarlo ordenado y que funcione bien.

Esta practica la hice aparte de la otra porque esa parte todavia no la tenia hecha, asi que preferi separarla y enfocarme solo en login/registro.

## Que usa

- Node + Express
- TypeScript en modo strict
- Prisma con PostgreSQL
- bcrypt para hashear password
- JWT para autenticacion
- zod que usamos en el anterior ejercio para validar datos
- dotenv para variables de entorno

## Que hace la API

- `GET /` confirma que la API esta viva.
- `GET /health` devuelve `{ status: "ok" }`.
- `POST /auth/register` crea usuario.
- `POST /auth/login` inicia sesion.
- `GET /auth/me` devuelve el usuario autenticado (con el Bearer token).

## Como iniciarlo rapido

Lo hice para que se levante con un comando:

```powershell
npm run bootstrap
```

Si todo va bien, te deja el server corriendo en `3000` (o `3001` si `3000` esta ocupado).

## Por que existe cada archivo (resumen real)

### Raiz

- `package.json`: scripts y dependencias. Aqui deje `bootstrap`, `dev`, `prisma:*`.
- `.gitignore`: para no subir `.env`, `node_modules` ni `dist`.
- `.env.example`: plantilla sin secretos para saber que variables van.
- `tsconfig.json`: config de TS con `strict: true` porque queria evitar cosas ambiguas.
- `README.md`: esta explicacion completa.

### Prisma

- `prisma/schema.prisma`: modelo `User`.
  - `email` unico
  - `passwordHash` (nunca password en texto plano)
  - timestamps
- `prisma/migrations/.../migration.sql`: migracion inicial de tabla `User`.

### Scripts

- `scripts/bootstrap.ps1`: el "todo en uno" para Windows.
  Lo hice porque queria evitar pasos manuales cada vez.

### src/config

- `src/config/env.ts`: carga `.env` y valida variables con zod.
  Lo puse para que, si falta una variable importante, falle al inicio y no a mitad de ejecucion.

### src/shared

- `src/shared/prisma/client.ts`: instancia de PrismaClient.
- `src/shared/errors/api-error.ts`: error controlado con status code.
- `src/shared/middleware/error.middleware.ts`: manejo centralizado de errores.
  - zod -> 400
  - prisma unique -> 409
  - default -> 500
- `src/shared/middleware/auth.middleware.ts`: valida JWT y llena `req.user`.
- `src/shared/utils/password.util.ts`: reglas de password + hash/compare.
- `src/shared/utils/jwt.util.ts`: firmar/verificar token.
- `src/shared/types/express.d.ts`: extension de `Request` para tipar `req.user`.

### src/modules/auth

- `auth.schema.ts`: validaciones de register/login.
- `auth.service.ts`: logica principal (BD + bcrypt + JWT).
- `auth.controller.ts`: conecta request/response con services.
- `auth.routes.ts`: define rutas `/auth/*`.

### Entrada de app

- `src/app.ts`: crea Express, middlewares y rutas.
- `src/server.ts`: levanta el servidor en el puerto configurado.

## Decisiones que tome (y por que)

- Normalizar email (`trim + lowercase`): para no duplicar usuarios por mayusculas o espacios.
- Password entre 8 y 72 con complejidad: para mantener una politica minima.
- Guardar `passwordHash` unicamente: por seguridad basica.
- Responder `Invalid credentials` en login: no revelar si fallo email o password.
- JWT corto (`15m`): para no dejar sesiones larguisimas por defecto.
- Middleware de errores unico: para que todas las respuestas de error sean consistentes.

## Variables de entorno que uso

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://Emilio:1402556z@localhost:5433/BaseEmilio
BCRYPT_SALT_ROUNDS=12
JWT_ACCESS_SECRET=MINIMO_32_CARACTERES
JWT_ACCESS_EXPIRES_IN=15m
JWT_ISSUER=auth-bcrypt-ejercicio
CORS_ORIGIN=*
```

## Endpoints (con ejemplos)

### GET /health

```json
{ "status": "ok" }
```

### POST /auth/register

Body:

```json
{
  "email": "user@example.com",
  "password": "Abcdef1!",
  "name": "Emilio"
}
```

Respuesta esperada (`201`):

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Emilio",
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  "accessToken": "<jwt>",
  "token": "<jwt>"
}
```

### POST /auth/login

Body:

```json
{
  "email": "user@example.com",
  "password": "Abcdef1!"
}
```

Si esta bien, devuelve el mismo formato (`user + accessToken + token`).

Si falla:

```json
{ "message": "Invalid credentials" }
```

### GET /auth/me

Header:

```http
Authorization: Bearer <token>
```

Devuelve usuario publico desde BD.

## Pruebas rapidas (PowerShell)

```powershell
$base = "http://localhost:3000"

# health
Invoke-RestMethod -Method GET -Uri "$base/health"

# register
Invoke-RestMethod -Method POST -Uri "$base/auth/register" -ContentType "application/json" -Body '{"email":"user@example.com","password":"Abcdef1!","name":"Emilio"}'

# login
$login = Invoke-RestMethod -Method POST -Uri "$base/auth/login" -ContentType "application/json" -Body '{"email":"user@example.com","password":"Abcdef1!"}'
$token = $login.accessToken

# me
Invoke-RestMethod -Method GET -Uri "$base/auth/me" -Headers @{ Authorization = "Bearer $token" }
```

Prueba de login incorrecto:

```powershell
try {
  Invoke-RestMethod -Method POST -Uri "$base/auth/login" -ContentType "application/json" -Body '{"email":"user@example.com","password":"mal-password"}'
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```
