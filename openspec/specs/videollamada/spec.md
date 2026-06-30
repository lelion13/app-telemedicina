# Videollamada — LiveKit

## Purpose

Proveer comunicación audiovisual en tiempo real entre paciente y profesional mediante LiveKit self-hosted.

## Requirements

### Requirement: Sin grabación

El sistema NO DEBE grabar ni almacenar videollamadas en ningún formato.

### Requirement: Sala por turno

Cada turno DEBE tener una sala LiveKit identificada por `salaVideoId`, generada al crear el turno o al iniciar la consulta.

### Requirement: Tokens LiveKit server-side

El sistema DEBE generar tokens de acceso LiveKit exclusivamente en el servidor usando `LIVEKIT_API_KEY` y `LIVEKIT_API_SECRET`. Las credenciales NO DEBEN exponerse al cliente.

#### Scenario: Paciente obtiene token

- GIVEN un paciente con token de turno válido que completó flujo GPS
- WHEN solicita ingresar a consulta
- THEN el sistema DEBE retornar token LiveKit con permisos limitados a su sala

#### Scenario: Profesional obtiene token

- GIVEN un profesional asignado al turno
- WHEN ingresa a la sala de consulta
- THEN el sistema DEBE retornar token LiveKit con permisos de publicación

### Requirement: Controles básicos

Las salas DEBEN ofrecer controles de silenciar micrófono, activar/desactivar cámara y finalizar llamada.

### Requirement: Vistas diferenciadas

La interfaz del profesional y del paciente DEBEN ser vistas distintas: el profesional incluye panel lateral con datos del paciente y estado GPS; el paciente ve interfaz simplificada.

### Requirement: LiveKit self-hosted

El servidor LiveKit DEBE ejecutarse en contenedor Docker propio, accesible vía subdominio dedicado detrás de Traefik, con puertos UDP de WebRTC mapeados en el host.

### Requirement: Desconexión

Si un participante se desconecta, DEBE poder reingresar mientras el turno esté `en_curso` y su token de acceso sea válido.
