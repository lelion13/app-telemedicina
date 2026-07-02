# Delta for Admin

## MODIFIED Requirements

### Requirement: Visibilidad global

El admin DEBE ver métricas y datos de configuración global (empresas, usuarios). La supervisión operativa diaria de turnos en agendas DEBE ser responsabilidad del rol `administrativo`.

(Previously: admin veía todo incluyendo operación detallada de franjas)

### Requirement: Gestión de franjas

(Replaced)

El admin NO DEBE gestionar franjas ni agendas. Esa función pertenece al rol `administrativo`.

### Requirement: CRUD usuarios

El admin DEBE poder crear, editar y desactivar usuarios de roles `admin`, `administrativo`, `empresa` y `profesional`, asignando `empresaId` cuando el rol es `empresa`.

(Previously: sin rol `administrativo` en enum)

#### Scenario: Crear usuario administrativo

- GIVEN un admin autenticado
- WHEN crea usuario con rol `administrativo`
- THEN el sistema DEBE crear usuario activo sin `empresaId`

### Requirement: Agendar turnos

(Removed)

El admin NO DEBE agendar turnos. El agendamiento es responsabilidad de `empresa` dentro de agendas del `administrativo`.

## ADDED Requirements

### Requirement: Configuración del rol administrativo

En MVP el rol `administrativo` tiene un **perfil fijo**: crear agendas y supervisar todos los turnos. El admin **solo asigna el rol** al crear el usuario; no hay permisos configurables por persona.

#### Scenario: Perfil administrativo por defecto

- GIVEN un admin que crea un usuario administrativo
- WHEN el usuario inicia sesión
- THEN el sistema DEBE otorgarle permisos de crear agendas y supervisar turnos de todas las agendas

#### Scenario: Sin permisos parciales en MVP

- GIVEN un admin creando usuario administrativo
- WHEN guarda el formulario
- THEN el sistema NO DEBE mostrar ni persistir checkboxes de permisos granulares (extensión futura)
