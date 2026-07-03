# Smoke: flujo profesional → paciente (videollamada)

Checklist manual para validar **profesional-consulta-flow** en `telemedicina.lionapp.cloud`.

## Pre-requisitos

- [ ] Stack Up (`./scripts/vps-compose.sh ps`)
- [ ] Usuario **administrativo**, **empresa**, **profesional** activos
- [ ] Agenda activa con slot libre (hoy o próximo día)
- [ ] UDP `50000-50100` y DNS `livekit.telemedicina.lionapp.cloud` OK (ver `docs/deploy.md`)

## 1. Empresa agenda turno

- [ ] Login empresa → Nuevo turno
- [ ] Elegir agenda + slot → crear turno
- [ ] Copiar `consultaUrl` si mail no envía

## 2. Profesional toma y atiende

- [ ] Login profesional → `/profesional`
- [ ] Ver turno en listado (“solo hoy” si es hoy)
- [ ] **Tomar turno** → estado confirmado
- [ ] **Atender** → pantalla consulta
- [ ] Ver banner **ventana paciente** (antes / activa / expirada según hora)

## 3. Videollamada

- [ ] **Iniciar consulta** → video habilitado
- [ ] Profesional entra a sala LiveKit (sin error en UI)
- [ ] Paciente abre `consultaUrl` **dentro de ventana token**
- [ ] Paciente completa GPS → ingresa a sala
- [ ] Audio/video bidireccional OK

## 4. Cierre

- [ ] Profesional guarda **evolución**
- [ ] Marcar **finalizado** (con evolución) → vuelve a agenda
- [ ] Repetir con **ausente** + evolución obligatoria (otro turno de prueba)

## 5. Si video falla

| Síntoma | Revisar |
|---------|---------|
| Error al obtener token | `LIVEKIT_*` en `.env.prod` |
| Conecta pero sin media | `LIVEKIT_NODE_IP`, UDP 50000-50100 |
| Paciente no entra | Ventana token; `TOKEN_VALID_BEFORE_MIN` |
| Profesional no ve turnos | Agenda activa; fecha AR; migración hecha |

## Registro

Anotar fecha, commit/imagen (`IMAGE_TAG`) y resultado:

```
Fecha:
Imagen:
Profesional → paciente video: OK / FAIL
Notas:
```
