# Design: Bootstrap MVP — Plataforma de Teleasistencia

## Technical Approach

Monolito Next.js 16 (App Router) con TypeScript y React 19. Toda la lógica de negocio, API y UI vive en un único repositorio. MongoDB almacena entidades; Mongoose define schemas y validación. NextAuth gestiona sesiones de usuarios internos (`admin`, `empresa`, `profesional`). Pacientes acceden por ruta pública `/consulta/[token]` validada contra JWT almacenado en el turno. LiveKit provee salas WebRTC; tokens de sala se generan server-side con API key/secret. Nodemailer envía mails transaccionales. Actualizaciones de estado se propagan por SSE a dashboards de empresa.

## Architecture Decisions

### Decision: Monolito Next.js vs frontend/backend separados

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| Monolito Next.js | Menos servicios, deploy simple; acopla UI y API | **Elegido** |
| React + FastAPI | Más flexible; más contenedores y CORS | Rechazado |

**Rationale**: Un solo VPS, equipo reducido, prompt exige Next.js 16. App Router unifica SSR, API Routes y protección por rol.

### Decision: Proxy — solo Traefik en VPS

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| Traefik único | Menos capas; labels Docker | **Elegido** |
| Traefik + Caddy interno | Redundante para un solo app | Rechazado |

**Rationale**: Traefik ya termina TLS y enruta. Contenedores en red Docker interna; solo `app` y `livekit` expuestos vía labels.

### Decision: Tiempo real — SSE vs WebSocket

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| SSE | Unidireccional, simple con HTTP/2, reconexión nativa | **Elegido** |
| WebSocket | Bidireccional; más infra en serverless/edge | Rechazado para MVP |
| Polling | Simple pero latencia alta | Fallback |

**Rationale**: Dashboard empresa solo consume eventos (`turno_actualizado`). SSE sobre Route Handler de Next.js es suficiente.

### Decision: Token paciente — JWT firmado reutilizable

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| JWT reutilizable en ventana | Mejor UX si se corta conexión | **Elegido** |
| Un solo uso | Más seguro; peor UX | Rechazado |

**Rationale**: Ventana temporal acotada (`TOKEN_VALID_BEFORE_MIN`, `TOKEN_VALID_AFTER_MIN`) + logs de acceso mitigan abuso.

### Decision: Geolocalización — navegador primero, IP fallback

**Choice**: `navigator.geolocation` con `enableHighAccuracy: true`; si `accuracy > GPS_ACCURACY_THRESHOLD_M` o permiso denegado → backend geolocaliza por IP (`geoip-lite` local preferido sobre ip-api.com para no enviar IP a terceros).

**Rationale**: Cumplimiento Ley 25.326 — minimizar transferencia de datos personales a terceros.

### Decision: Next.js 16 — `proxy.ts` y APIs async

**Choice**: Archivo `proxy.ts` (no `middleware.ts`) para protección de rutas por rol. Usar `await cookies()`, `await headers()`, `await params` en Server Components y Route Handlers.

## System Architecture

```
                    Internet
                        │
                        ▼
              ┌─────────────────┐
              │ Traefik (VPS)   │
              │ TLS Let's Encrypt│
              └────────┬────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
  telemedicina.   livekit.      (UDP host)
  lionapp.cloud   telemedicina.  7881, 50000-50100
         │        lionapp.cloud
         ▼             ▼
  ┌────────────┐ ┌────────────┐
  │ app:3000   │ │ livekit    │
  │ Next.js 16 │ │ :7880      │
  └─────┬──────┘ └─────┬──────┘
        │              │
        └──────┬───────┘
               ▼
        ┌────────────┐     ┌─────────┐
        │  MongoDB   │     │  Redis  │
        │  (interno) │     │(LiveKit)│
        └────────────┘     └─────────┘
```

## Data Flow — Agendamiento

```
Empresa/Admin ──► Formulario turno ──► Validar franja global
                         │
                         ▼
              Buscar/crear Paciente (email|teléfono)
                         │
                         ▼
              Crear Turno (pendiente) + accessToken JWT
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
        Guardar MongoDB      Nodemailer → Paciente
                                    (link /consulta/[token])
```

## Data Flow — Consulta

```
Paciente (link) ──► Validar JWT + ventana temporal
         │
         ▼
   Solicitar GPS ──► POST /api/gps ──► RegistroGPS
         │                              LogConsulta
         ▼
   Botón "Ingresar" ──► Token LiveKit ──► Sala video
         │
Profesional ──► Agenda global ──► Tomar turno ──► Misma sala
         │
         ▼
   Marcar finalizado/ausente ──► SSE evento ──► Dashboard empresa
```

## Data Model (Mongoose)

| Colección | Campos clave | Índices |
|-----------|-------------|---------|
| `Empresa` | nombre, cuit?, contacto, activa | `activa` |
| `Usuario` | email, passwordHash, rol, empresaId?, activo | `email` unique |
| `Paciente` | nombre, apellido, tel, email, domicilio, descripcion?, empresaId | `email+empresaId`, `telefono` |
| `FranjaHoraria` | diaSemana, horaInicio, horaFin, activa | `diaSemana+activa` |
| `Turno` | pacienteId, empresaId, profesionalId?, fechaHora, estado, accessToken, tokenExpiraEn, salaVideoId | `empresaId+estado`, `fechaHora`, `accessToken` unique |
| `RegistroGPS` | turnoId, lat, lng, accuracy, origen, timestamp, userAgent, ip | `turnoId` |
| `LogConsulta` | turnoId, evento, timestamp, metadata | `turnoId+timestamp` |

## Route Structure (Next.js App Router)

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/login` | Público | Login credenciales |
| `/empresa` | rol empresa | Dashboard turnos propios |
| `/empresa/turnos/nuevo` | rol empresa | Formulario agendar |
| `/profesional` | rol profesional | Agenda global |
| `/profesional/consulta/[turnoId]` | rol profesional | Sala video + panel GPS |
| `/admin` | rol admin | Dashboard métricas |
| `/admin/franjas` | rol admin | CRUD franjas globales |
| `/admin/empresas` | rol admin | CRUD empresas/usuarios |
| `/consulta/[token]` | Público (token) | GPS + sala paciente |
| `/api/auth/[...nextauth]` | Público | NextAuth handler |
| `/api/turnos` | Autenticado | CRUD turnos |
| `/api/gps` | Token turno | Registro GPS |
| `/api/livekit/token` | Autenticado/token | Token sala LiveKit |
| `/api/events/turnos` | rol empresa | SSE stream |

## File Changes (implementación futura)

| File | Action | Description |
|------|--------|-------------|
| `docker-compose.yml` | Create | app, mongo, livekit, redis |
| `Dockerfile` | Create | Multistage node:22-alpine |
| `livekit.yaml` | Create | Config LiveKit server |
| `src/proxy.ts` | Create | Protección rutas por rol |
| `src/lib/auth.ts` | Create | NextAuth config |
| `src/models/*.ts` | Create | Schemas Mongoose |
| `src/app/**` | Create | Páginas y API routes |
| `.env.example` | Create | Variables documentadas |

## Interfaces / Contracts

### SSE Event — `turno_actualizado`

```typescript
interface TurnoActualizadoEvent {
  type: 'turno_actualizado'
  turnoId: string
  estado: 'pendiente' | 'confirmado' | 'en_curso' | 'finalizado' | 'ausente' | 'cancelado'
  profesionalId?: string
  updatedAt: string // ISO 8601
}
```

### POST /api/gps

```typescript
// Request (desde /consulta/[token])
{ token: string, lat?: number, lng?: number, accuracy?: number, permisoDenegado: boolean }

// Response 201
{ origen: 'navegador' | 'ip_fallback' | 'no_verificado', registrado: true }
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Validación franjas, JWT paciente, estados turno | Vitest |
| Integration | API routes + MongoDB memory server | Vitest + mongodb-memory-server |
| E2E | Flujo agendar → mail mock → consulta token | Playwright |
| Security | IDOR turnos, token expirado, rol incorrecto | Tests negativos en API |

## Migration / Rollout

No migration required (greenfield). Despliegue: build imagen → `docker compose up -d` → Traefik detecta labels → verificar healthchecks → seed admin inicial.

## Open Questions

- [ ] Subdominio LiveKit exacto (`livekit.telemedicina.lionapp.cloud` vs path-based)
- [ ] Proveedor SMTP definitivo en producción
- [ ] Retención exacta de logs GPS (sugerido: 2 años, validar con cliente)
