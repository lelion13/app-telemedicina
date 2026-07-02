# Despliegue en VPS (Hostinger + Traefik + GHCR)

Guía de despliegue de **app-telemedicina** en `telemedicina.lionapp.cloud`.

- **Repositorio:** [github.com/lelion13/app-telemedicina](https://github.com/lelion13/app-telemedicina)
- **Imagen Docker:** `ghcr.io/lelion13/app-telemedicina:latest`

## Lecciones del primer despliegue (evitar colgar el VPS)

| Problema | Síntoma | Solución en este repo |
|----------|---------|------------------------|
| Rango UDP `50000-60000` en compose | `telemedicina-livekit Starting` 15+ min, CPU/iptables saturados | Rango **50000-50100** (101 puertos) en compose + `livekit.yaml` |
| Sin `--env-file .env.prod` | WARN `LIVEKIT_API_KEY not set`; video sin auth | Usar `scripts/vps-compose.sh` o `--env-file .env.prod` siempre |
| Red externa `traefik` inexistente | `network traefik declared as external, but could not be found` | Sin red externa; labels + Traefik en host (como semáforo/figus) |
| Solo DNS `telemedicina.*` | App OK, videollamada falla | Segundo registro A: `livekit.telemedicina` → misma IP VPS |

**Nunca** vuelvas a mapear `50000-60000` en Docker Compose en un VPS pequeño.

## Flujo de publicación (CI/CD)

1. Push a `main` → GitHub Actions ejecuta **CI** (`test` + `build`).
2. Si CI pasa, el workflow **GHCR** construye y publica la imagen en GitHub Container Registry.
3. En el VPS: `git pull` + `./scripts/vps-compose.sh pull app` + `up -d`.

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
- Traefik operativo con resolver TLS (Let's Encrypt), modo **host** (sin red Docker `traefik`)
- DNS (dos registros A, misma IP del VPS):
  - `telemedicina.lionapp.cloud`
  - `livekit.telemedicina.lionapp.cloud`
- Firewall: **7881/tcp** y **50000-50100/udp**
- Acceso a GHCR desde el VPS (paquete público **o** `docker login ghcr.io`)

## Configuración inicial en el VPS

### Opción A — clone del repo (recomendado)

```bash
git clone https://github.com/lelion13/app-telemedicina.git /docker/app-telemedicina
cd /docker/app-telemedicina
cp .env.prod.example .env.prod
nano .env.prod   # secretos, LIVEKIT_NODE_IP, SMTP, etc.
chmod +x scripts/vps-compose.sh
```

### Opción B — solo 3 archivos en `/docker/app-telemedicina`

Si no clonás el repo, copiá manualmente:

1. `docker-compose.prod.yml`
2. `livekit.yaml`
3. `.env.prod` (desde `.env.prod.example`, con secretos reales)

Y usá siempre:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml <comando>
```

### Secretos mínimos en `.env.prod`

```bash
openssl rand -base64 32   # NEXTAUTH_SECRET, AUTH_SECRET, PATIENT_TOKEN_SECRET
docker run --rm livekit/livekit-server:v1.8.0 generate-keys   # LIVEKIT_API_KEY + SECRET
```

Completá `LIVEKIT_NODE_IP` con la **IP pública** del VPS.

Variables GHCR:

```env
GHCR_OWNER=lelion13
IMAGE_TAG=latest
```

### Login en GHCR (si el paquete es privado)

```bash
echo "<GITHUB_PAT_con_read:packages>" | docker login ghcr.io -u lelion13 --password-stdin
```

Verificá Traefik:

```bash
docker ps | grep -i traefik
```

## Levantar el stack (producción)

```bash
cd /docker/app-telemedicina
./scripts/vps-compose.sh pull app
./scripts/vps-compose.sh up -d
./scripts/vps-compose.sh ps
```

Equivalente sin script:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml pull app
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

El stack debería quedar **Up en menos de 1 minuto**. Si `livekit` tarda más de 2 min en `Starting`, revisá que no hayas dejado el rango UDP grande.

Primera vez — usuario admin (desde `/docker/app-telemedicina`, sin clonar el repo):

```bash
chmod +x scripts/seed-admin-vps.sh
./scripts/seed-admin-vps.sh
```

Requisitos en `.env.prod`: `ADMIN_PASSWORD` (mín. 12 caracteres), opcionalmente `ADMIN_EMAIL`, `ADMIN_NOMBRE`, `ADMIN_APELLIDO`.

Login: `https://telemedicina.lionapp.cloud/login`

### Usuario administrativo (opcional)

En `.env.prod` podés definir `ADMINISTRATIVO_EMAIL`, `ADMINISTRATIVO_PASSWORD`, `ADMINISTRATIVO_NOMBRE`, `ADMINISTRATIVO_APELLIDO`. El seed local (`npm run seed`) los crea si están presentes. En VPS, creá el usuario desde el panel **Admin → Usuarios** con rol `administrativo`, o ejecutá el seed dentro del contenedor si lo tenés configurado.

Login administrativo: mismo `/login`, redirige a `/administrativo`.

### Migración v2: franjas → agendas

Tras desplegar la versión con modelo **Agenda** (roles-and-agendas v2), ejecutá **una vez** la migración de datos antes de que las empresas agenden turnos.

**Sin `git pull` en el VPS** — solo descarga un archivo (~4 KB) y usa el contenedor `mongo` que ya tenés:

```bash
cd /docker/app-telemedicina
curl -fsSL https://raw.githubusercontent.com/lelion13/app-telemedicina/main/scripts/migrate-agendas-mongosh.js \
  | docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T mongo mongosh telemedicina --quiet --file /dev/stdin
```

O con el wrapper (mismo efecto):

```bash
chmod +x scripts/migrate-agendas-vps.sh   # solo si ya tenés este script en el VPS
./scripts/migrate-agendas-vps.sh
```

**Con imagen nueva de GHCR** (tras push con `migrate-agendas.mjs` en el Dockerfile):

```bash
./scripts/vps-compose.sh pull app
./scripts/vps-compose.sh up -d
docker compose --env-file .env.prod -f docker-compose.prod.yml exec app npm run migrate-agendas:prod
```

La migración convierte franjas horarias legacy en agendas por día y asigna `agendaId` a turnos existentes. Sin agendas activas, el alta de turnos falla con *"El horario elegido no está dentro de una agenda disponible"*.

Variables opcionales: `AGENDA_DEFAULT_SLOT_MIN` (default 15), `AGENDA_MIGRATION_DAYS` (default 90).

## Desarrollo local (build en máquina)

```bash
cp .env.example .env
docker compose build
docker compose up -d
```

## Arquitectura de red

```
Internet
    │
    ▼
Traefik (VPS, TLS, host mode)
    ├── telemedicina.lionapp.cloud         → app:3000
    └── livekit.telemedicina.lionapp.cloud → livekit:7880 (WebSocket/HTTP)

Red interna Docker (default bridge, no expuesta):
    ├── mongo:27017
    └── redis:6379
```

No hay Caddy ni Nginx dentro del compose. Traefik es el único reverse proxy.

## Puertos WebRTC (crítico)

Traefik termina HTTPS pero **no proxya tráfico UDP** de WebRTC. LiveKit necesita puertos en el **host**:

| Puerto / Rango | Protocolo | Uso |
|----------------|-----------|-----|
| 7881 | TCP | RTC sobre TCP (fallback) |
| 50000–50100 | UDP | Media WebRTC (101 puertos) |

`docker-compose.prod.yml` y `livekit.yaml` deben coincidir en `50000`–`50100`.

## Labels Traefik

En `.env.prod`:

- `APP_HOST` — dominio principal
- `LIVEKIT_HOST` — subdominio LiveKit
- `TRAEFIK_CERT_RESOLVER` — cert resolver en Traefik (p. ej. `letsencrypt`)

## Healthchecks

| Servicio | Comando |
|----------|---------|
| app | `GET /` en puerto 3000 |
| mongo | `mongosh ping` |
| redis | `redis-cli ping` |

## Actualización (producción)

```bash
cd /docker/app-telemedicina
git pull
./scripts/vps-compose.sh pull app
./scripts/vps-compose.sh up -d
```

Para fijar un commit:

```env
IMAGE_TAG=sha-abc1234
```

```bash
./scripts/vps-compose.sh pull app
./scripts/vps-compose.sh up -d
```

## Rollback

```env
IMAGE_TAG=sha-<commit-anterior>
```

```bash
./scripts/vps-compose.sh pull app
./scripts/vps-compose.sh up -d
```

## Troubleshooting

### LiveKit en `Starting` eterno

- Causa habitual: rango UDP enorme en `ports:` del compose.
- Fix: `50000-50100/udp` únicamente; `docker compose down` y volver a subir.

### WARN `LIVEKIT_API_KEY variable is not set`

- Falta `--env-file .env.prod` o no existe `.env.prod`.
- Usá `./scripts/vps-compose.sh` que lo carga siempre.

### `network traefik could not be found`

- Versión vieja del compose con red externa. Hacé `git pull` del repo actualizado.

### WebRTC / video no conecta

- `LIVEKIT_NODE_IP` = IP pública del VPS
- DNS `livekit.telemedicina.lionapp.cloud` resuelve a esa IP
- UDP 50000-50100 abierto en firewall
- `LIVEKIT_URL` usa `wss://`

### Empresa no puede agendar turnos

- Verificá que existan agendas activas (`/administrativo/agendas` o migración ejecutada).
- La empresa debe estar en `empresaIds` de la agenda o la agenda debe ser pública (`empresaIds` vacío).

## Smoke test manual por rol (post-deploy v2)

| Rol | URL | Verificar |
|-----|-----|-----------|
| admin | `/admin` | Métricas, CRUD usuarios con rol administrativo, sin UI de franjas |
| administrativo | `/administrativo` | Crear agenda, ver slots, monitor de turnos |
| empresa | `/empresa` | Listar agendas, crear turno en slot libre, ver `consultaUrl` |
| profesional | `/profesional` | Tomar turno de agenda activa, evolución + GPS al cerrar |
| paciente | `/consulta/[token]` | GPS, ingreso a sala LiveKit |

## Variables obligatorias

Ver `.env.prod.example`. Mínimo para producción:

- `MONGODB_URI`, `NEXTAUTH_SECRET`, `AUTH_SECRET`, `NEXTAUTH_URL`
- `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`, `LIVEKIT_NODE_IP`
- `SMTP_*`, `APP_BASE_URL`, `PATIENT_TOKEN_SECRET`
- `GHCR_OWNER`, `IMAGE_TAG`
