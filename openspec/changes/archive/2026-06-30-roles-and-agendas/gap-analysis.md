# Gap Analysis — MVP actual vs modelo v2

## Roles

| Rol v2 | ¿Existe hoy? | Gap |
|--------|--------------|-----|
| admin | ✅ `admin` | Debe **dejar** de gestionar franjas/agendas; enfocarse en usuarios (asignar rol `administrativo`, sin permisos distintos por persona) |
| administrativo | ❌ | **Rol nuevo** completo: N usuarios, vista compartida, CRUD agendas |
| empresa | ✅ `empresa` | Agendas públicas o asignadas; slots con duración fija |
| profesional | ✅ `profesional` | Evolución texto libre + GPS; turnos por agenda activa |
| paciente | ✅ token | Sin cambios de concepto; pulir UX aparte |

## Entidades

| Concepto v2 | Equivalente hoy | Acción |
|-------------|-----------------|--------|
| Agenda | `FranjaHoraria` (parcial) | **Día** + horario + **duración fija** + `empresaIds` opcional (vacío = todas) |
| Turno en agenda | `Turno` sin agendaId | Agregar `agendaId` obligatorio |
| Evolución | `notasProfesional` | Extender a `evolucion` con texto + snapshot GPS |

## Matriz permisos (objetivo)

```
Acción                    admin  administrativo  empresa  profesional  paciente
─────────────────────────────────────────────────────────────────────────────
CRUD usuarios / roles       ✅        ❌           ❌         ❌          —
Config permisos administ.   ✅        ❌           ❌         ❌          —
CRUD agendas                ❌        ✅           ❌         ❌          —
Ver todos turnos agenda     ❌        ✅           ❌         ❌          —
Ver turnos propia empresa   ❌        ✅*          ✅         ❌          —
Crear turno en agenda       ❌        ❌           ✅†        ❌          —
Tomar / atender turno       ❌        ❌           ❌         ✅          —
Videollamada                ❌        ❌           ❌         ✅          ✅
Registrar evolución+GPS     ❌        ❌           ❌         ✅          —
Ingreso por token           ❌        ❌           ❌         ❌          ✅

* administrativo: cross-tenant en **todas** las agendas (vista compartida entre N administrativos)
† empresa: agendas **públicas** (sin empresas) o donde está asignada
```

## Rutas objetivo (borrador)

| Rol | Base path |
|-----|-----------|
| admin | `/admin` |
| administrativo | `/administrativo` |
| empresa | `/empresa` |
| profesional | `/profesional` |
| paciente | `/consulta/[token]` |

## Código a deprecar / mover

| Actual | Destino |
|--------|---------|
| `/admin/franjas` | `/administrativo/agendas` |
| `POST /api/admin/franjas` | `POST /api/administrativo/agendas` |
| `GET /api/empresa/franjas` | `GET /api/empresa/agendas` (solo asignadas) |
| `FranjaHoraria` global | `Agenda` por día con slots calculados |

## Migración sugerida (producción)

1. Crear agenda “General” migrada desde franjas activas
2. Asignar todas las empresas activas
3. Backfill `agendaId` en turnos existentes
4. Desactivar UI franjas admin
