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

### Requirement: Variables de entorno

Las siguientes variables DEBEN externalizarse en `.env` (nunca commitear): `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `APP_BASE_URL`, `GPS_ACCURACY_THRESHOLD_M`, `TOKEN_VALID_BEFORE_MIN`, `TOKEN_VALID_AFTER_MIN`.

### Requirement: HTTPS obligatorio

En producción, todo tráfico DEBE usar HTTPS. Cookies de sesión DEBEN marcarse `secure`.

### Requirement: Healthchecks

Los contenedores `app`, `mongo` y `livekit` DEBEN definir healthchecks en docker-compose.

### Requirement: Volúmenes persistentes

MongoDB DEBE usar volumen Docker persistente para datos.

### Requirement: Build multistage

El Dockerfile DEBE usar build multistage: etapa de build + etapa de producción mínima.
