# Convenciones del proyecto

Reglas explícitas para evitar ambigüedades en código, datos y operación en VPS. Complementa `prompt.md` (visión) y `docs/deploy.md` (infra).

## Roles (v2)

| Rol | Dashboard | Responsabilidad |
|-----|-----------|-----------------|
| `admin` | `/admin` | Usuarios, empresas, métricas — **no** agendas ni turnos operativos |
| `administrativo` | `/administrativo` | CRUD agendas, supervisión cross-tenant de turnos |
| `empresa` | `/empresa` | Turnos propios en agendas visibles |
| `profesional` | `/profesional` | Atención, evolución, videollamada |
| `paciente` | `/consulta/[token]` | Sin cuenta NextAuth |

Todos los usuarios `administrativo` tienen **los mismos permisos** (sin ACL por persona en MVP).

## Fechas y timezone (Argentina)

**Zona de referencia:** `America/Argentina/Buenos_Aires`.

### Regla obligatoria

Los valores `YYYY-MM-DD` provenientes de `<input type="date">` **NO DEBEN** parsearse con `new Date("YYYY-MM-DD")` antes de persistir. Ese formato es medianoche UTC y en Argentina puede caer en el **día anterior**.

Usar siempre:

```ts
import { normalizeAgendaDateInput, agendaDayKeyFromFecha } from "@/lib/agenda/slots";

// Al crear/actualizar Agenda desde formulario
const fecha = normalizeAgendaDateInput(input.fecha);

// Al armar slot desde fecha almacenada
const dayKey = agendaDayKeyFromFecha(agenda.fecha);
```

### Almacenamiento de `Agenda.fecha`

- Se persiste como `Date` con mediodía UTC del día calendario argentino (`parseAgendaDayKey("2026-07-02")` → `2026-07-02T12:00:00.000Z`).
- Horarios de turno (`horaInicio` / slots) usan hora local Argentina (`buildSlotDateTime`).

### Tests mínimos al tocar fechas

- Input `2026-07-02` debe guardarse y listarse como **2 de julio**, no 1 de julio.
- Filtro empresa `fecha >= hoy` debe usar `getAgendaDayKey(new Date())` en Argentina.

## Agendas y visibilidad empresa

Una empresa ve una agenda si **todas** se cumplen:

1. `activa: true`
2. `fecha >= hoy` (día Argentina)
3. `empresaIds` vacío/ausente **o** su `empresaId` está en el array

Si el administrativo desmarca "Todas las empresas", debe incluir explícitamente a cada tenant que deba agendar.

## Producción vs desarrollo

| Acción | Local (`npm run …`) | VPS (imagen GHCR) |
|--------|---------------------|-------------------|
| Migrar franjas → agendas | `npm run migrate-agendas` (tsx) | `curl … migrate-agendas-mongosh.js \| mongosh` **o** `npm run migrate-agendas:prod` en contenedor app |
| Seed usuarios | `npm run seed` | `seed-admin-vps.sh` (mongosh) |
| App | `npm run dev` / `docker compose` | Solo `docker pull` + `vps-compose.sh` — **no** `git pull` obligatorio |

La imagen de producción es **Next.js standalone**: no incluye `tsx`, `scripts/*.ts` ni devDependencies. Cualquier script operativo en VPS debe ser:

- **mongosh** (`scripts/*-mongosh.js` o `*-vps.sh` con curl), o
- **bundle** incluido en el Dockerfile (`migrate-agendas.mjs` + `npm run migrate-agendas:prod`).

**Nunca** documentar `docker compose exec app npm run migrate-agendas` (tsx) como paso de producción sin verificar que el comando exista en la imagen.

## Checklist antes de push a `main`

1. `npm test`
2. `npm run build`
3. Si cambiaste fechas/agendas: test `normalizeAgendaDateInput` en `agenda.test.ts`
4. Si cambiaste Dockerfile o scripts VPS: revisar `docs/deploy.md`

## Flujo profesional → videollamada

- Tomar turno (obligatorio) → Atender → Iniciar consulta → LiveKit.
- El profesional puede iniciar antes de la ventana del paciente; la UI muestra `ventanaPaciente`.
- Evolución obligatoria al cerrar (`finalizado` y `ausente`).
- Smoke manual: `docs/smoke-profesional-consulta.md`.

- `FranjaHoraria` / `/admin/franjas` — reemplazado por `Agenda` + rol `administrativo`
- Admin agendando turnos — solo `empresa`
- Cola global de profesional sin contexto de agenda

## Referencias

- Despliegue: `docs/deploy.md`
- Specs: `openspec/specs/`
- Lecciones MVP: `openspec/changes/archive/2026-06-30-bootstrap-mvp/lessons-learned.md`
- Lecciones roles-and-agendas: `openspec/changes/archive/2026-06-30-roles-and-agendas/lessons-learned.md`
