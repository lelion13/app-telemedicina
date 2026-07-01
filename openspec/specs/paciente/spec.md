# Paciente — Acceso sin Cuenta

## Purpose

Permitir que pacientes sin cuenta accedan a su consulta mediante link único con token firmado.

## Requirements

### Requirement: Sin registro de paciente

El paciente NO DEBE tener cuenta ni pasar por NextAuth. Su único mecanismo de acceso es el link con token.

### Requirement: Validación de token

El sistema DEBE validar el token en cada acceso a `/consulta/[token]`: firma válida, turno existente, no expirado según ventana temporal, turno no cancelado.

#### Scenario: Token válido en ventana

- GIVEN un turno con token vigente
- WHEN el paciente abre el link
- THEN el sistema DEBE mostrar datos del turno y flujo de ingreso

#### Scenario: Token expirado

- GIVEN un token fuera de ventana temporal
- WHEN el paciente abre el link
- THEN el sistema DEBE mostrar pantalla de error sin datos sensibles del turno

#### Scenario: Token reutilizable

- GIVEN un token vigente ya usado previamente
- WHEN el paciente vuelve a abrir el link
- THEN el sistema DEBE permitir el acceso nuevamente

### Requirement: Consentimiento GPS interactivo

En la pantalla de consentimiento, los botones "Compartir ubicación" y "Continuar sin compartir" DEBEN estar habilitados antes de iniciar la solicitud al navegador. El estado de carga (`pendiente`) DEBE activarse solo tras el clic del usuario.

#### Scenario: Botones habilitados al entrar a consentimiento

- GIVEN un paciente en `/consulta/[token]` que avanzó a consentimiento GPS
- WHEN la pantalla se muestra sin solicitud en curso
- THEN ambos botones DEBEN estar clickeables

#### Scenario: Compartir ubicación

- GIVEN permiso de geolocalización concedido
- WHEN el paciente confirma compartir
- THEN el sistema DEBE registrar GPS y avanzar a sala de espera

#### Scenario: Continuar sin compartir

- GIVEN el paciente rechaza o no tiene geolocalización
- WHEN elige continuar sin compartir
- THEN el sistema DEBE registrar origen `no_verificado` o `ip_fallback` y permitir ingreso a espera

### Requirement: Pantalla de consulta

La pantalla del paciente DEBE mostrar: fecha/hora del turno, nombre del profesional si asignado, flujo de consentimiento GPS (compartir o continuar sin), y botón para ingresar a videollamada (habilitado tras flujo GPS).

### Requirement: Registro de accesos

El sistema DEBE registrar en `LogConsulta` cada ingreso del paciente con timestamp, IP y user-agent para auditoría.

### Requirement: Sin exposición de datos internos

La vista del paciente NO DEBE mostrar datos de otras empresas, notas del profesional, ni información administrativa.
