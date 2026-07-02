# Delta for Profesional (nuevo dominio delta)

## ADDED Requirements

### Requirement: Agenda visible para profesional

El profesional DEBE ver turnos pertenecientes a agendas activas creadas por administrativo (sin filtrar por empresa que agendó).

#### Scenario: Lista de turnos por agenda

- GIVEN agendas activas con turnos pendientes de distintas empresas
- WHEN el profesional abre su panel
- THEN el sistema DEBE mostrar turnos elegibles para tomar o en curso

### Requirement: Evolución clínica en consulta

Al atender un turno, el profesional DEBE poder registrar una evolución (texto clínico) antes o al finalizar la consulta.

#### Scenario: Guardar evolución al cerrar

- GIVEN un turno en estado `en_curso`
- WHEN el profesional guarda evolución y cierra la consulta
- THEN el sistema DEBE persistir el texto y asociar el registro GPS más reciente del turno si existe

### Requirement: Evolución vinculada a ubicación

La evolución DEBE referenciar el `RegistroGPS` del paciente para ese turno (coordenadas y origen: navegador, ip_fallback, no_verificado).

#### Scenario: Evolución con GPS verificado

- GIVEN un turno con RegistroGPS origen `navegador`
- WHEN el profesional guarda evolución
- THEN el panel DEBE mostrar sello/mapa GPS y la evolución DEBE guardar `gpsRegistroId`

### Requirement: Videollamada en consulta

El profesional DEBE ingresar a la videollamada LiveKit desde la vista de consulta del turno asignado.

(Comportamiento existente — se mantiene explícito en spec profesional)

#### Scenario: Iniciar consulta con video

- GIVEN un turno tomado por el profesional
- WHEN inicia la consulta
- THEN el sistema DEBE habilitar sala LiveKit y cambiar estado a `en_curso`

## MODIFIED Requirements

### Requirement: Alcance de agenda profesional

El profesional DEBE ver turnos de agendas del administrativo, no una cola global descontextualizada.

(Previously: agenda global de todas las empresas sin concepto de agenda)
