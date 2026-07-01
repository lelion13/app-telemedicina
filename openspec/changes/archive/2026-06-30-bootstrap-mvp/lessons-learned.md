# Lessons Learned — Bootstrap MVP + Despliegue VPS

**Período**: 2026-06-29 — 2026-06-30  
**Entorno**: VPS Hostinger `srv1623377`, `/docker/app-telemedicina`

## Incidentes y correcciones

| # | Error | Impacto | Causa raíz | Fix aplicado |
|---|--------|---------|------------|--------------|
| 1 | LiveKit `Starting` 15+ min | VPS colgado, CPU/iptables | `ports: 50000-60000/udp` (~10k puertos) | Rango `50000-50100` en compose + `livekit.yaml` |
| 2 | `network traefik not found` | Compose no levanta | Red externa inexistente (Traefik en host mode) | Eliminar `networks: traefik` del compose |
| 3 | WARN `LIVEKIT_API_KEY not set` | LiveKit sin claves | `docker compose` sin `--env-file .env.prod` | Documentar + `vps-compose.sh` |
| 4 | Solo DNS `telemedicina.*` | Video falla | Subdominio LiveKit no resuelve | Segundo registro A `livekit.telemedicina` |
| 5 | Seed con `npm run seed` en VPS | Falla sin repo | Imagen GHCR no incluye scripts; `NODE_ENV=production` omite `tsx` | `scripts/seed-admin-vps.sh` (bcrypt + mongosh) |
| 6 | Botón "Compartir ubicación" muerto | Paciente bloqueado | `gpsEstado` inicial `"pendiente"` deshabilitaba botones | Estado inicial `"idle"` |
| 7 | GHCR/CI falló | Imagen no publicada | `GpsSeal` no acepta tipo `idle` — build TS | Guard estático + `npm run build` antes de push |
| 8 | CI compose validation | Step fallaba | `env_file: .env.prod` pero CI creaba `.env.prod.ci` | CI crea `.env.prod` directamente |

## Proceso — qué hacer distinto

1. **Siempre** `npm run build` local antes de push a `main` (no solo `npm test`).
2. **Nunca** mapear >200 puertos UDP en compose en VPS pequeño.
3. **Producción VPS**: tres archivos mínimos (`docker-compose.prod.yml`, `livekit.yaml`, `.env.prod`) + siempre `--env-file .env.prod`.
4. **Sin SMTP**: obtener link paciente desde `db.turnos.accessToken` o insertar GPS manual para destrabar flujo.
5. **DNS**: dos registros A obligatorios (app + LiveKit).
6. **Primer admin**: `./scripts/seed-admin-vps.sh` — no clonar repo para seed.

## Comandos de referencia (manual VPS)

```bash
# Stack
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d

# Link paciente (sin mail)
docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T mongo mongosh telemedicina --quiet --eval '
const t = db.turnos.find().sort({createdAt:-1}).limit(1).next();
print("https://telemedicina.lionapp.cloud/consulta/" + encodeURIComponent(t.accessToken));
'

# Admin inicial
./scripts/seed-admin-vps.sh
```

## Próximos changes sugeridos

| Change | Prioridad |
|--------|-----------|
| `polish-qa` — E2E Playwright, responsive audit | Alta |
| `smtp-prod` — SMTP + mostrar link si mail falla | Alta |
| `webrtc-smoke` — checklist UDP + TURN si falla NAT | Media |
| `livekit-healthcheck` — alinear spec y compose | Baja |
