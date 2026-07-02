# Autenticación y Autorización

## Purpose

Gestionar identidad de usuarios internos (`admin`, `administrativo`, `empresa`, `profesional`) mediante NextAuth.js con Credentials Provider, y proteger rutas por rol usando el mecanismo de proxy de Next.js 16.

## Requirements

### Requirement: Login con credenciales

El sistema DEBE permitir login con email y contraseña para usuarios con rol `admin`, `administrativo`, `empresa` o `profesional`.

#### Scenario: Login exitoso

- GIVEN un usuario activo con credenciales válidas
- WHEN envía email y contraseña correctos en `/login`
- THEN el sistema DEBE crear sesión NextAuth y redirigir al dashboard según su rol

#### Scenario: Login exitoso administrativo

- GIVEN un usuario activo con rol `administrativo`
- WHEN envía credenciales válidas
- THEN el sistema DEBE crear sesión y redirigir a `/administrativo`

#### Scenario: Credenciales inválidas

- GIVEN un email registrado o no registrado
- WHEN envía contraseña incorrecta
- THEN el sistema DEBE rechazar el login con mensaje genérico sin revelar si el email existe

### Requirement: Hash de contraseñas

El sistema DEBE almacenar contraseñas únicamente como hash bcrypt con salt por contraseña. NUNCA DEBE persistir, retornar ni registrar contraseñas en texto plano.

### Requirement: Protección de rutas por rol

El sistema DEBE proteger rutas autenticadas mediante `proxy.ts`, verificando sesión JWT de NextAuth y rol del usuario.

El sistema DEBE incluir `administrativo` en el mapa de roles y dashboards:

| Rol | Dashboard |
|-----|-----------|
| admin | `/admin` |
| administrativo | `/administrativo` |
| empresa | `/empresa` |
| profesional | `/profesional` |

#### Scenario: Empresa accede a ruta de empresa

- GIVEN un usuario autenticado con rol `empresa`
- WHEN navega a `/empresa/**`
- THEN el sistema DEBE permitir el acceso

#### Scenario: Empresa bloqueada en ruta admin

- GIVEN un usuario autenticado con rol `empresa`
- WHEN navega a `/admin/**`
- THEN el sistema DEBE denegar el acceso (redirect a login o página 403)

#### Scenario: Bloqueo cruzado

- GIVEN un usuario con rol `empresa`
- WHEN navega a `/administrativo`
- THEN el sistema DEBE redirigir a `/403` o login

### Requirement: APIs por prefijo de rol

El sistema DEBE enrutar APIs con prefijo `/api/administrativo` exclusivo para rol `administrativo`, análogo a `/api/empresa` y `/api/profesional`.

#### Scenario: Empresa bloqueada en API administrativo

- GIVEN sesión rol `empresa`
- WHEN llama `GET /api/administrativo/agendas`
- THEN el sistema DEBE responder 403

### Requirement: Aislamiento multi-tenant

Un usuario con rol `empresa` SOLO DEBE acceder a datos (turnos, pacientes) de su `empresaId` asociada.

#### Scenario: Empresa no ve turnos ajenos

- GIVEN un usuario empresa de Empresa A
- WHEN consulta listado de turnos
- THEN el sistema NO DEBE incluir turnos de otras empresas

### Requirement: Sesión segura

El sistema DEBE usar `NEXTAUTH_SECRET` desde variables de entorno, tokens con expiración configurada, y cookies `httpOnly` + `secure` en producción.

### Requirement: Usuario inactivo

El sistema NO DEBE permitir login a usuarios con `activo: false`.

#### Scenario: Cuenta desactivada

- GIVEN un usuario con `activo: false`
- WHEN intenta iniciar sesión
- THEN el sistema DEBE rechazar el acceso con mensaje genérico
