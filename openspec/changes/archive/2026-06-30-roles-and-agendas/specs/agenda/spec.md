# Delta for Agenda

## ADDED Requirements

### Requirement: Agenda por día con duración fija de turno

El rol `administrativo` DEBE poder crear, editar y desactivar agendas con: **fecha** (día), **horaInicio**, **horaFin**, **duracionTurnoMinutos** (igual para todos los turnos de esa agenda), **empresaIds** opcional y estado activo.

Los slots disponibles DEBEN calcularse dividiendo el horario en intervalos de `duracionTurnoMinutos`.

#### Scenario: Crear agenda con slots automáticos

- GIVEN un administrativo autenticado
- WHEN crea una agenda para el 2026-07-15 de 09:00 a 12:00 con duración 15 minutos
- THEN el sistema DEBE ofrecer slots 09:00, 09:15, 09:30 … 11:45

#### Scenario: Crear agenda restringida a empresas

- GIVEN un administrativo y empresas A y B
- WHEN crea una agenda asignando solo empresa A
- THEN solo usuarios de empresa A DEBEN poder agendar en esa agenda

#### Scenario: Agenda pública (sin empresas)

- GIVEN un administrativo que crea agenda sin `empresaIds`
- WHEN cualquier empresa activa lista agendas
- THEN esa agenda DEBE aparecer y cualquier empresa DEBE poder crear turnos en ella

### Requirement: Supervisión cross-tenant de agenda

Cualquier usuario `administrativo` DEBE ver todos los turnos de **todas** las agendas, sin importar quién la creó, qué empresa agendó ni qué profesional atendió.

#### Scenario: Vista global de agenda

- GIVEN turnos de distintas empresas en la misma agenda
- WHEN un administrativo abre el monitor de esa agenda
- THEN el sistema DEBE listar todos los turnos con estado, empresa, profesional y paciente

### Requirement: Empresa en agendas visibles

El rol `empresa` DEBE poder crear turnos únicamente en agendas donde `(empresaIds vacío OR su empresaId ∈ empresaIds)`, la agenda esté activa y el slot elegido esté libre.

#### Scenario: Turno en agenda restringida a otra empresa

- GIVEN una agenda con `empresaIds` que no incluye la empresa del usuario
- WHEN la empresa intenta crear un turno en esa agenda
- THEN el sistema DEBE rechazar con error de autorización o validación

#### Scenario: Turno fuera de slot válido

- GIVEN una agenda 09:00–12:00 con duración 15 min
- WHEN la empresa agenda a las 10:07
- THEN el sistema DEBE rechazar indicando horario no disponible

#### Scenario: Slot ya ocupado

- GIVEN el slot 10:00 ya tiene un turno
- WHEN otra empresa intenta agendar el mismo slot en la misma agenda
- THEN el sistema DEBE rechazar indicando slot no disponible

## MODIFIED Requirements

### Requirement: Admin gestiona franjas globales

(Removed — reemplazado por agendas de administrativo)

El rol `admin` NO DEBE crear ni modificar agendas operativas.

### Requirement: Solo admin modifica franjas

(Replaced)

Los roles `empresa` y `profesional` NO DEBEN crear ni modificar agendas. Solo `administrativo` gestiona agendas.

### Requirement: Validación al agendar

El sistema DEBE rechazar turnos cuya `fechaHoraProgramada` no coincida con un **slot libre** de la agenda seleccionada y la empresa DEBE tener visibilidad sobre esa agenda.

(Previously: franja global activa sin concepto de agenda)

## REMOVED Requirements

### Requirement: Admin gestiona franjas globales

(Razón: las agendas pasan al rol administrativo; ver ADDED "Agenda por día con duración fija de turno")
