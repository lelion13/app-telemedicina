# Administración

## Purpose

Proveer al rol `admin` gestión global del sistema, métricas y configuración de usuarios y empresas. La operación diaria de agendas y turnos pertenece al rol `administrativo`.

## Requirements

### Requirement: Visibilidad global

El admin DEBE ver métricas y datos de configuración global (empresas, usuarios). La supervisión operativa diaria de turnos en agendas DEBE ser responsabilidad del rol `administrativo`.

### Requirement: CRUD empresas

El admin DEBE poder crear, editar y desactivar empresas con nombre, CUIT opcional, datos de contacto y estado activo.

### Requirement: CRUD usuarios

El admin DEBE poder crear, editar y desactivar usuarios de roles `admin`, `administrativo`, `empresa` y `profesional`, asignando `empresaId` cuando el rol es `empresa`.

#### Scenario: Crear usuario empresa

- GIVEN un admin autenticado
- WHEN crea usuario con rol `empresa` y empresaId válido
- THEN el sistema DEBE crear usuario activo con contraseña hasheada

#### Scenario: Crear usuario administrativo

- GIVEN un admin autenticado
- WHEN crea usuario con rol `administrativo`
- THEN el sistema DEBE crear usuario activo sin `empresaId`

### Requirement: Dashboard de métricas

El admin DEBE ver métricas agregadas: turnos por estado, por empresa, por profesional, y tasa de ausentismo.

#### Scenario: Métricas de ausentismo

- GIVEN turnos en período seleccionado
- WHEN admin consulta dashboard
- THEN el sistema DEBE calcular tasa = ausentes / (finalizados + ausentes) × 100

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

### Requirement: Auditoría GPS

El admin DEBE poder consultar historial de `RegistroGPS` y `LogConsulta` filtrado por turno, empresa o fecha.
