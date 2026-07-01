# Tasks: Bootstrap MVP — Plataforma de Teleasistencia

## Phase 1: Fundación e Infraestructura

- [x] 1.1 Inicializar proyecto Next.js 16 con TypeScript, App Router, Tailwind CSS y React 19
- [x] 1.2 Configurar `package.json` con dependencias: mongoose, next-auth, livekit-server-sdk, @livekit/components-react, nodemailer, bcryptjs, jose, geoip-lite
- [x] 1.3 Crear `Dockerfile` multistage con `node:22-alpine`
- [x] 1.4 Crear `docker-compose.yml` con servicios app, mongo, livekit, redis
- [x] 1.5 Crear `livekit.yaml` con configuración LiveKit self-hosted
- [x] 1.6 Configurar labels Traefik en compose para `telemedicina.lionapp.cloud` y subdominio LiveKit
- [x] 1.7 Documentar puertos UDP WebRTC en README de despliegue
- [x] 1.8 Crear `.env.example` con todas las variables requeridas

## Phase 2: Modelos y Base de Datos

- [x] 2.1 Implementar conexión MongoDB (`src/lib/db.ts`) con patrón singleton
- [x] 2.2 Crear schema `Empresa` con índices
- [x] 2.3 Crear schema `Usuario` con email único, passwordHash, rol, empresaId
- [x] 2.4 Crear schema `Paciente` con campos obligatorios y descripcion opcional
- [x] 2.5 Crear schema `FranjaHoraria` (diaSemana, horaInicio, horaFin, activa)
- [x] 2.6 Crear schema `Turno` con estados, accessToken, tokenExpiraEn, salaVideoId
- [x] 2.7 Crear schema `RegistroGPS` con origen enum
- [x] 2.8 Crear schema `LogConsulta` con eventos de auditoría
- [x] 2.9 Crear script seed para usuario admin inicial

## Phase 3: Autenticación y Autorización

- [x] 3.1 Configurar NextAuth con Credentials Provider y callbacks de rol/empresaId
- [x] 3.2 Implementar hash bcrypt en registro/cambio de contraseña
- [x] 3.3 Crear `src/proxy.ts` con protección por rol para rutas `/empresa`, `/profesional`, `/admin`
- [x] 3.4 Crear página `/login` con formulario y manejo de errores genéricos
- [x] 3.5 Implementar helpers `requireAuth(rol?)` para API routes
- [x] 3.6 Tests: login exitoso, credenciales inválidas, ruta bloqueada por rol

## Phase 4: Módulo Admin

- [x] 4.1 Dashboard admin con métricas (turnos por estado, empresa, profesional, ausentismo)
- [x] 4.2 CRUD empresas (`/admin/empresas`)
- [x] 4.3 CRUD usuarios (`/admin/usuarios`) con asignación de rol y empresa
- [x] 4.4 CRUD franjas horarias globales (`/admin/franjas`)
- [x] 4.5 Vista auditoría GPS y logs de consulta
- [x] 4.6 Tests: solo admin accede, métricas calculan correctamente

## Phase 5: Agendamiento (Empresa)

- [x] 5.1 Dashboard empresa con listado de turnos propios y filtros
- [x] 5.2 Formulario nuevo turno con validación de campos paciente
- [x] 5.3 Lógica buscar/crear paciente por email o teléfono
- [x] 5.4 Validación de franja horaria global al agendar
- [x] 5.5 Generación JWT accessToken con ventana temporal configurable
- [x] 5.6 Integración Nodemailer: template mail paciente en español
- [x] 5.7 Cancelación de turnos por empresa
- [x] 5.8 Tests: aislamiento tenant, rechazo fuera de franja, mail enviado

## Phase 6: Agenda Profesional

- [x] 6.1 Dashboard profesional con agenda global y filtros por estado/hora
- [x] 6.2 Acción "Tomar turno" — asignar profesionalId
- [x] 6.3 Transiciones de estado (confirmado → en_curso → finalizado/ausente)
- [x] 6.4 Campo notasProfesional al cerrar turno
- [x] 6.5 Tests: profesional ve todas las empresas, toma turno correctamente

## Phase 7: Acceso Paciente y GPS

- [x] 7.1 Página pública `/consulta/[token]` con validación JWT
- [x] 7.2 UI solicitud permiso GPS con texto de consentimiento (Ley 25.326)
- [x] 7.3 Captura `navigator.geolocation` con enableHighAccuracy
- [x] 7.4 API `POST /api/gps` con lógica umbral precisión y fallback geoip-lite
- [x] 7.5 Registro `LogConsulta` en cada evento de paciente
- [x] 7.6 Pantalla error token expirado/inválido
- [x] 7.7 Tests: token reutilizable, permiso denegado registra no_verificado

## Phase 8: Videollamada LiveKit

- [x] 8.1 API `POST /api/livekit/token` — tokens server-side para paciente y profesional
- [x] 8.2 Generar `salaVideoId` al crear turno
- [x] 8.3 Vista sala profesional: video + panel paciente + mapa GPS (Leaflet/OSM)
- [x] 8.4 Vista sala paciente: interfaz simplificada con controles básicos
- [x] 8.5 Manejo desconexión/reconexión
- [x] 8.6 Verificar que NO hay grabación habilitada en config LiveKit
- [x] 8.7 Tests: token LiveKit no expone secrets, permisos de sala correctos

## Phase 9: Tiempo Real (SSE)

- [x] 9.1 Implementar `GET /api/events/turnos` como SSE autenticado
- [x] 9.2 Emitir evento `turno_actualizado` al cambiar estado
- [x] 9.3 Cliente SSE en dashboard empresa con reconexión automática
- [x] 9.4 Fallback polling si SSE falla
- [x] 9.5 Tests: empresa solo recibe eventos de su tenant

## Phase 10: Seguridad y Hardening

- [x] 10.1 Rate limiting en `/login` y `/consulta/[token]`
- [x] 10.2 Headers de seguridad (CSP, HSTS, X-Frame-Options) en Next.js config
- [x] 10.3 Validar que logs no contienen passwords, tokens ni secrets
- [x] 10.4 Política de retención de RegistroGPS y LogConsulta
- [x] 10.5 Revisión IDOR en todas las API routes
- [x] 10.6 Tests de seguridad: acceso cruzado entre empresas, token manipulado

## Phase 11: QA y Despliegue

- [ ] 11.1 Tests E2E Playwright: flujo completo agendar → consulta → videollamada
- [ ] 11.2 Verificar responsive mobile-first en todas las pantallas
- [x] 11.3 Deploy en VPS: stack Up en `srv1623377` (manual, ver `lessons-learned.md`)
- [ ] 11.4 Smoke test WebRTC en red real (verificar UDP)
- [ ] 11.5 Verificar mails SMTP en producción
- [x] 11.6 Ejecutar `sdd-verify` contra specs → `verify-report.md`
- [x] 11.7 GitHub Actions CI (`npm test` + `npm run build`) en PR/push a `main`
- [x] 11.8 Publicar imagen en GHCR (`ghcr.io/lelion13/app-telemedicina`) al merge en `main`
- [x] 11.9 `docker-compose.prod.yml` para pull en VPS sin build local
- [x] 11.10 Hardening compose prod: UDP 50000–50100, sin red traefik, LiveKit v1.8.0
- [x] 11.11 `scripts/seed-admin-vps.sh`, `.env.prod.example`, `scripts/vps-compose.sh`
- [x] 11.12 CI valida `docker compose config` con `.env.prod`
- [x] 11.13 Fix UI GPS paciente: estado `idle` (botones no deshabilitados al inicio)
- [x] 11.14 `docs/deploy.md` post-mortem y guía manual VPS
- [x] 11.15 Archivo SDD: verify + lessons-learned + sync specs
