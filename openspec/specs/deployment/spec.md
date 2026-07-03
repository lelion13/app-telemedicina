# Despliegue e Infraestructura

## Purpose

Definir la arquitectura de contenedores, proxy, variables de entorno y requisitos del VPS para producción.

## Requirements

### Requirement: Imagen GHCR

El despliegue en producción DEBE usar imagen publicada en `ghcr.io/lelion13/app-telemedicina` mediante `docker-compose.prod.yml`, sin build en el VPS.

#### Scenario: Publicación automática

- GIVEN un push a `main` que pasa CI
- WHEN el workflow GHCR completa
- THEN la imagen DEBE estar disponible en GHCR con tag `latest` y `sha-<commit>`

### Requirement: Docker Compose

El sistema DEBE incluir `docker-compose.yml` con servicios: `app` (Next.js), `mongo`, `livekit`, `redis` (si LiveKit lo requiere). MongoDB y Redis NO DEBEN exponer puertos al host.

### Requirement: Traefik como único proxy

El despliegue DEBE usar Traefik existente en el VPS para TLS y enrutamiento. NO DEBE incluir Caddy ni Nginx interno.

#### Scenario: Enrutamiento app

- GIVEN contenedor `app` con labels Traefik
- WHEN llega request a `telemedicina.lionapp.cloud`
- THEN Traefik DEBE enrutar a puerto 3000 del contenedor

#### Scenario: Enrutamiento LiveKit

- GIVEN contenedor `livekit` con labels Traefik
- WHEN llega request WebSocket a subdominio LiveKit
- THEN Traefik DEBE enrutar al puerto 7880

### Requirement: WebRTC UDP

La documentación DEBE especificar puertos UDP requeridos en firewall del host (7881/tcp + rango 50000-50100/udp) para WebRTC. NO DEBE recomendar mapear 50000-60000 en docker-compose (congela el host al publicar ~10k puertos).

### Requirement: Node.js 22

El Dockerfile DEBE usar imagen base `node:22-alpine` o equivalente (Next.js 16 requiere Node ≥ 20.9).

### Requirement: Variables de entorno producción

En VPS, las variables DEBEN residir en `.env.prod` (plantilla: `.env.prod.example`, nunca commitear secretos). Todo comando `docker compose` en producción DEBE usar `--env-file .env.prod` o `scripts/vps-compose.sh`.

### Requirement: DNS dual

El despliegue DEBE tener dos registros A apuntando a la IP del VPS:

- `telemedicina.lionapp.cloud` — aplicación Next.js
- `livekit.telemedicina.lionapp.cloud` — señalización LiveKit / WebSocket

### Requirement: Traefik sin red Docker externa

En VPS con Traefik en `network_mode: host`, el compose de producción NO DEBE declarar red externa `traefik`. El descubrimiento DEBE ser solo por labels Docker.

### Requirement: Seed admin en VPS

DEBE existir un script documentado (`scripts/seed-admin-vps.sh`) que cree el usuario admin sin clonar el repo ni ejecutar `npm` en producción.

### Requirement: Variables de entorno

Las siguientes variables DEBEN externalizarse en `.env` / `.env.prod` (nunca commitear): `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`, `LIVEKIT_NODE_IP`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `APP_BASE_URL`, `GPS_ACCURACY_THRESHOLD_M`, `TOKEN_VALID_BEFORE_MIN`, `TOKEN_VALID_AFTER_MIN`, `ADMIN_PASSWORD` (solo seed).

### Requirement: HTTPS obligatorio

En producción, todo tráfico DEBE usar HTTPS. Cookies de sesión DEBEN marcarse `secure`.

### Requirement: Healthchecks

Los contenedores `app` y `mongo` DEBEN definir healthchecks en docker-compose. El contenedor `livekit` DEBERÍA definir healthcheck (pendiente de alineación).

### Requirement: SMTP opcional en MVP

Si `SMTP_HOST` está vacío, el sistema DEBE crear el turno igualmente y DEBERÍA informar en UI que el mail no se envió. El link de consulta DEBE permanecer en `Turno.accessToken` para recuperación manual.

### Requirement: Volúmenes persistentes

MongoDB DEBE usar volumen Docker persistente para datos.

### Requirement: Build multistage

El Dockerfile DEBE usar build multistage: etapa de build + etapa de producción mínima.

### Requirement: Scripts operativos sin repo en VPS

Los procedimientos de migración de datos y seed en producción NO DEBEN requerir `git pull` ni `tsx` en el contenedor `app`. DEBEN documentarse alternativas:

- Scripts **mongosh** descargables por `curl` (un solo archivo), o
- Bundles **Node** incluidos en la imagen (`*:prod`).

#### Scenario: Migración franjas a agendas en VPS

- GIVEN un VPS con stack levantado y sin clonar el repo
- WHEN el operador ejecuta la migración documentada
- THEN los datos DEBEN migrarse usando `mongosh` o `npm run migrate-agendas:prod` en la imagen
- AND el comando NO DEBE fallar por ausencia de `tsx`

### Requirement: Migración v2 agendas documentada

`docs/deploy.md` DEBE incluir el paso único de migración `FranjaHoraria` → `Agenda` y el smoke manual por rol (admin, administrativo, empresa, profesional, paciente).
