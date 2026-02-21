# Practica login con bcrypt + JWT

Esta practica la hice aparte de la otra porque esa parte todavia no la tenia hecha, entonces la separe y me concentre solo en login/registro con Node.

La idea fue hacer algo simple, ordenado y que se pueda correr en Windows con un comando.

## Que incluye

- Registro de usuario
- Inicio de sesion
- Ruta protegida con Bearer token
- Password hasheada con bcrypt
- Usuario guardado en PostgreSQL con Prisma
- Validaciones con zod

## Tecnologias

- Node.js + Express
- TypeScript
- Prisma
- PostgreSQL
- bcrypt
- jsonwebtoken
- zod
- dotenv

## Estructura

- `src/app.ts`: rutas y middlewares
- `src/server.ts`: arranque del servidor
- `src/config/env.ts`: variables de entorno validadas
- `src/modules/auth/*`: login/register/me
- `src/shared/middleware/*`: auth JWT + manejo de errores
- `src/shared/utils/*`: bcrypt y JWT
- `prisma/schema.prisma`: modelo `User`
- `scripts/bootstrap.ps1`: setup automatico

## Datos de base de datos usados en esta practica

```env
DATABASE_URL=postgresql://Emilio:1402556z@localhost:5433/BaseEmilio
```

## Como ejecutar

Desde la raiz del proyecto:

```powershell
npm run bootstrap
```

Ese script hace todo esto:

1. Crea `.env` si no existe.
2. Pone la `DATABASE_URL` del ejercicio.
3. Genera `JWT_ACCESS_SECRET` aleatorio.
4. Instala dependencias si faltan.
5. Ejecuta Prisma: `generate`, `deploy` y si falla `deploy`, hace `push`.
6. Si `3000` esta ocupado, cambia a `3001`.
7. Levanta el server en modo desarrollo.

## Si quieres correrlo manual

```powershell
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```

## Endpoints

### `GET /`

Respuesta de estado general de la API.

### `GET /health`

```json
{ "status": "ok" }
```

### `POST /auth/register`

Body:

```json
{
  "email": "user@example.com",
  "password": "Abcdef1!",
  "name": "Emilio"
}
```

Notas:

- normaliza email: `trim` + `lowercase`
- valida password con reglas
- guarda solo `passwordHash`

Respuesta esperada:

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

### `POST /auth/login`

Body:

```json
{
  "email": "user@example.com",
  "password": "Abcdef1!"
}
```

Si esta bien, devuelve `user + accessToken + token`.

Si falla:

```json
{ "message": "Invalid credentials" }
```

### `GET /auth/me`

Header:

```http
Authorization: Bearer <token>
```

Devuelve el usuario publico desde base de datos.

## Pruebas rapidas

Si `bootstrap` te dejo el puerto en 3001, cambia el valor de `$base`.

```powershell
$base = "http://localhost:3000"

# 1) health
Invoke-RestMethod -Method GET -Uri "$base/health"

# 2) register
Invoke-RestMethod -Method POST -Uri "$base/auth/register" -ContentType "application/json" -Body '{"email":"user@example.com","password":"Abcdef1!","name":"Emilio"}'

# 3) login + guardar token
$login = Invoke-RestMethod -Method POST -Uri "$base/auth/login" -ContentType "application/json" -Body '{"email":"user@example.com","password":"Abcdef1!"}'
$token = $login.accessToken

# 4) me
Invoke-RestMethod -Method GET -Uri "$base/auth/me" -Headers @{ Authorization = "Bearer $token" }

# 5) login incorrecto
try {
  Invoke-RestMethod -Method POST -Uri "$base/auth/login" -ContentType "application/json" -Body '{"email":"user@example.com","password":"mal-password"}'
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

## Variables de entorno

Archivo real: `.env`

Plantilla: `.env.example`

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

## Scripts npm

```json
{
  "dev": "tsx watch src/server.ts",
  "build": "tsc -p tsconfig.json",
  "start": "node dist/server.js",
  "prisma:generate": "prisma generate",
  "prisma:deploy": "prisma migrate deploy",
  "prisma:push": "prisma db push",
  "bootstrap": "powershell -ExecutionPolicy Bypass -File scripts\\bootstrap.ps1"
}
```

## Comandos para ejecutar y comprobar todo

```powershell
# 1) Instalar y levantar todo
npm run bootstrap
```

Si prefieres manual:

```powershell
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```

Pruebas de endpoints:

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

# login incorrecto
try {
  Invoke-RestMethod -Method POST -Uri "$base/auth/login" -ContentType "application/json" -Body '{"email":"user@example.com","password":"mal-password"}'
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}

# abrir Prisma Studio para revisar passwordHash
npx prisma studio
```
