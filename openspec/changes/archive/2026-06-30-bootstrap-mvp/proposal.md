# Proposal: Bootstrap MVP — Plataforma de Teleasistencia

## Intent

Construir una plataforma web de teleasistencia médica/profesional que permita a empresas cliente agendar consultas remotas, a profesionales atenderlas por videollamada, y a pacientes acceder sin cuenta mediante link firmado. El sistema debe capturar geolocalización para verificación operativa, operar en VPS propio dockerizado bajo jurisdicción argentina, y desplegarse en `telemedicina.lionapp.cloud`.

## Scope

### In Scope

- Documentación SDD completa: specs, diseño técnico, tareas, análisis de seguridad, guía de diseño frontend
- Modelo multi-tenant por empresa con roles `admin`, `empresa`, `profesional` y acceso `paciente` por token
- Franjas horarias globales de disponibilidad definidas por admin
- Agendamiento de turnos dentro de franjas válidas
- Videollamada LiveKit self-hosted sin grabación
- Captura GPS del paciente con fallback por IP y registro de auditoría
- Actualización en tiempo real del estado de turnos (SSE)
- Token de paciente reutilizable dentro de ventana de validez
- Stack: Next.js 16 + MongoDB + NextAuth + Nodemailer + Docker + Traefik

### Out of Scope (fase archivada — ver changes futuros)

- Grabación de videollamadas
- Facturación, recetas electrónicas, integración con obras sociales
- App móvil nativa
- Certificaciones formales (ISO 27001, etc.)
- E2E Playwright completo (pendiente `polish-qa`)
- SMTP producción configurado

## Approach

Monolito Next.js 16 con App Router: UI, API Routes y Server Actions en un solo despliegue. MongoDB como datastore único. NextAuth con Credentials Provider para usuarios internos. Pacientes autenticados por JWT firmado en URL (sin sesión NextAuth). LiveKit en contenedor separado con subdominio dedicado. Traefik enruta HTTPS hacia app y LiveKit; UDP WebRTC expuesto en host. Tiempo real vía SSE desde API route protegida.

## Affected Areas

| Area | Impact | Descripción |
|------|--------|-------------|
| `openspec/specs/auth/` | New | Autenticación, roles, proxy.ts |
| `openspec/specs/agenda/` | New | Franjas horarias globales |
| `openspec/specs/turnos/` | New | Ciclo de vida del turno |
| `openspec/specs/paciente/` | New | Acceso por token, sala de espera |
| `openspec/specs/geolocalizacion/` | New | GPS, fallback IP, auditoría |
| `openspec/specs/videollamada/` | New | Integración LiveKit |
| `openspec/specs/realtime/` | New | SSE para dashboards |
| `openspec/specs/admin/` | New | Gestión y métricas |
| `openspec/specs/deployment/` | New | Docker, Traefik, variables |
| `docker-compose.yml` | New (futuro) | Stack contenerizado |
| `src/` o `app/` | New (futuro) | Código Next.js |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| WebRTC bloqueado por firewall/NAT | Med | Documentar puertos UDP; TURN en LiveKit si falla P2P |
| Datos de salud sin cumplimiento Ley 25.326 | Med | Cifrado TLS, mínima exposición, consentimiento GPS, retención definida |
| Token de paciente reenviado a terceros | Med | Ventana temporal acotada, logs de acceso, sin grabación |
| Complejidad Next.js 16 async APIs | Low | Seguir convenciones proxy.ts, await cookies/headers/params |
| SSE desconectado en móvil | Low | Reconexión automática + polling fallback |

## Rollback Plan

Al ser fase de documentación, rollback = revertir commits de `openspec/`. En implementación futura: despliegue blue-green vía Traefik labels; `docker compose down` revierte stack; migraciones Mongoose versionadas con `down` scripts.

## Dependencies

- VPS Hostinger con Traefik operativo
- Dominio `telemedicina.lionapp.cloud` y subdominio LiveKit
- Proveedor SMTP configurado (SendGrid, SES, Mailgun, etc.)
- Node.js 22+, Docker Compose v2
- Puertos UDP abiertos para WebRTC en firewall VPS

## Success Criteria

- [ ] Specs por dominio con requisitos testables (Given/When/Then)
- [ ] Diseño técnico con decisiones documentadas y diagramas de flujo
- [ ] Análisis STRIDE con mitigaciones priorizadas
- [ ] Guía frontend con tokens de diseño y pantallas definidas
- [ ] Task breakdown listo para sdd-apply sin ambigüedades bloqueantes
