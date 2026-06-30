# Despliegue en VPS (Hostinger + Traefik + GHCR)

Guía de despliegue de **app-telemedicina** en `telemedicina.lionapp.cloud`.

- **Repositorio:** [github.com/lelion13/app-telemedicina](https://github.com/lelion13/app-telemedicina)
- **Imagen Docker:** `ghcr.io/lelion13/app-telemedicina:latest`

## Flujo de publicación (CI/CD)

1. Push a `main` → GitHub Actions ejecuta **CI** (`test` + `build`).
2. Si CI pasa, el workflow **GHCR** construye y publica la imagen en GitHub Container Registry.
3. En el VPS: `docker compose pull` + `up -d` con `docker-compose.prod.yml`.

### Workflows

| Workflow | Archivo | Disparador |
|----------|---------|------------|
| CI | `.github/workflows/ci.yml` | PR y push a `main` |
| GHCR | `.github/workflows/ghcr.yml` | Push a `main` (cambios en app/Dockerfile) |

Tags publicados:

- `ghcr.io/lelion13/app-telemedicina:latest`
- `ghcr.io/lelion13/app-telemedicina:sha-<commit>`

## Requisitos previos

- VPS con Docker y Docker Compose v2
- Traefik operativo con resolver TLS (Let's Encrypt)
- Red Docker externa de Traefik (por defecto `traefik`)
- DNS:
  - `telemedicina.lionapp.cloud` → IP del VPS
  - `livekit.telemedicina.lionapp.cloud` → IP del VPS
- Puertos abiertos en firewall del VPS (ver sección WebRTC)
- Acceso a GHCR desde el VPS (paquete público **o** `docker login ghcr.io`)

## Configuración inicial en el VPS

```bash
git clone https://github.com/lelion13/app-telemedicina.git
cd app-telemedicina
cp .env.example .env
# Editar .env con secretos reales
openssl rand -base64 32   # NEXTAUTH_SECRET / AUTH_SECRET
openssl rand -base64 32   # PATIENT_TOKEN_SECRET
```

Completá `LIVEKIT_NODE_IP` con la IP pública del VPS.

Variables GHCR en `.env`:

```env
GHCR_OWNER=lelion13
IMAGE_TAG=latest
```

### Login en GHCR (si el paquete es privado)

```bash
echo "<GITHUB_PAT_con_read:packages>" | docker login ghcr.io -u lelion13 --password-stdin
```

Alternativa: en GitHub → Packages → `app-telemedicina` → Package settings → **Change visibility** → Public.

Verificá que la red Traefik existe:

```bash
docker network ls | grep traefik
```

Si el nombre difiere, actualizá `TRAEFIK_NETWORK` en `.env`.

## Levantar el stack (producción)

```bash
docker compose -f docker-compose.prod.yml pull app
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
```

Primera vez: seed del admin (desde tu máquina con `MONGODB_URI` apuntando al VPS, o ejecutando un contenedor temporal):

```bash
npm run seed
```

## Desarrollo local (build en máquina)

```bash
docker compose build
docker compose up -d
```

## Arquitectura de red

```
Internet
    │
    ▼
Traefik (VPS, TLS)
    ├── telemedicina.lionapp.cloud        → app:3000
    └── livekit.telemedicina.lionapp.cloud → livekit:7880 (WebSocket/HTTP)

Red interna Docker (no expuesta):
    ├── mongo:27017
    └── redis:6379
```

No hay Caddy ni Nginx dentro del compose. Traefik es el único reverse proxy.

## Puertos UDP WebRTC (crítico)

Traefik termina HTTPS pero **no proxya tráfico UDP** de WebRTC. LiveKit necesita puertos en el **host**:

| Puerto / Rango | Protocolo | Uso |
|----------------|-----------|-----|
| 7881 | TCP | RTC sobre TCP (fallback) |
| 50000–60000 | UDP | Media WebRTC |

`docker-compose.prod.yml` mapea el rango completo `50000-60000/udp`. Asegurate de que `livekit.yaml` use el mismo `port_range_end: 60000`.

Abrí los mismos puertos en el firewall del VPS (ufw/iptables/panel Hostinger).

## Labels Traefik

Los servicios `app` y `livekit` llevan labels Docker para descubrimiento automático. Ajustá en `.env`:

- `APP_HOST` — dominio principal
- `LIVEKIT_HOST` — subdominio LiveKit
- `TRAEFIK_CERT_RESOLVER` — nombre del cert resolver en Traefik

## Healthchecks

| Servicio | Comando |
|----------|---------|
| app | `GET /` en puerto 3000 |
| mongo | `mongosh ping` |
| redis | `redis-cli ping` |

## Actualización (producción)

Tras un merge a `main` y publicación en GHCR:

```bash
cd /docker/app-telemedicina   # o la ruta donde clonaste
git pull
docker compose -f docker-compose.prod.yml pull app
docker compose -f docker-compose.prod.yml up -d
```

Para fijar un commit específico:

```env
IMAGE_TAG=sha-abc1234
```

```bash
docker compose -f docker-compose.prod.yml pull app
docker compose -f docker-compose.prod.yml up -d
```

## Rollback

```env
IMAGE_TAG=sha-<commit-anterior>
```

```bash
docker compose -f docker-compose.prod.yml pull app
docker compose -f docker-compose.prod.yml up -d
```

## Troubleshooting WebRTC

- Verificá `LIVEKIT_NODE_IP` = IP pública del VPS
- Confirmá UDP abierto en firewall
- En el navegador, revisá que `LIVEKIT_URL` use `wss://`
- Si falla detrás de NAT estricto, considerá habilitar TURN en LiveKit (requiere certificados TLS en puerto 5349)

## Variables obligatorias

Ver `.env.example` para la lista completa. Mínimo para producción:

- `MONGODB_URI`, `NEXTAUTH_SECRET`, `AUTH_SECRET`, `NEXTAUTH_URL`
- `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`, `LIVEKIT_NODE_IP`
- `SMTP_*`, `APP_BASE_URL`, `PATIENT_TOKEN_SECRET`
- `GHCR_OWNER`, `IMAGE_TAG` (producción con GHCR)
