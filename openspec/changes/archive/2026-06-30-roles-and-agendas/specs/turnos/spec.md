# Delta for Turnos

## ADDED Requirements

### Requirement: Turno ligado a agenda

Todo turno DEBE incluir `agendaId` referenciando una agenda activa en la que la empresa esté asignada.

#### Scenario: Crear turno con agenda

- GIVEN una empresa autenticada y una agenda asignada
- WHEN crea un turno con `agendaId` y horario válido
- THEN el sistema DEBE persistir el turno en estado `pendiente`

### Requirement: Empresa ve turnos propios con estado

El rol `empresa` DEBE ver únicamente turnos donde `empresaId` coincide con su tenant, mostrando estado, paciente, profesional asignado y agenda.

(Previously: ya aislado por tenant; se agrega columna/contexto agenda)

## MODIFIED Requirements

### Requirement: Creación de turno

Solo el rol `empresa` DEBE crear turnos (el admin ya no crea turnos). La creación DEBE validar `agendaId`, datos del paciente y ventana horaria de la agenda.

(Previously: `empresa` y `admin` podían crear turnos)

## REMOVED Requirements

### Requirement: Admin agendar turnos

(Razón: agendamiento exclusivo de empresa en agendas del administrativo)
