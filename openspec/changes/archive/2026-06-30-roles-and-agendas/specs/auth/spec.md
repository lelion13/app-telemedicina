# Delta for Auth

## MODIFIED Requirements

### Requirement: Protección de rutas por rol

El sistema DEBE incluir `administrativo` en el mapa de roles y dashboards:

| Rol | Dashboard |
|-----|-----------|
| admin | `/admin` |
| administrativo | `/administrativo` |
| empresa | `/empresa` |
| profesional | `/profesional` |

(Previously: sin entrada administrativo)

#### Scenario: Bloqueo cruzado

- GIVEN un usuario con rol `empresa`
- WHEN navega a `/administrativo`
- THEN el sistema DEBE redirigir a `/403` o login

## ADDED Requirements

### Requirement: APIs por prefijo de rol

El sistema DEBE enrutar APIs con prefijo `/api/administrativo` exclusivo para rol `administrativo`, análogo a `/api/empresa` y `/api/profesional`.

#### Scenario: Empresa bloqueada en API administrativo

- GIVEN sesión rol `empresa`
- WHEN llama `GET /api/administrativo/agendas`
- THEN el sistema DEBE responder 403
