# Geolocalización

## Purpose

Capturar y auditar la ubicación del paciente al ingresar a la consulta para verificación operativa, cumpliendo normativa argentina de datos personales.

## Requirements

### Requirement: Solicitud de permiso GPS

Al ingresar a `/consulta/[token]`, el sistema DEBE solicitar permiso de geolocalización del navegador con `enableHighAccuracy: true` antes de habilitar el ingreso a videollamada.

### Requirement: Registro desde navegador

Si el paciente otorga permiso y la precisión es aceptable (accuracy ≤ umbral configurable, default 1000m), el sistema DEBE guardar `RegistroGPS` con `origen: navegador`, lat, lng, accuracy, timestamp, userAgent e IP.

#### Scenario: GPS con buena precisión

- GIVEN permiso otorgado y accuracy de 50m
- WHEN se envía posición al backend
- THEN el sistema DEBE registrar con `origen: navegador`

### Requirement: Fallback por IP

Si el paciente deniega permiso O la precisión supera el umbral, el sistema DEBE intentar geolocalización por IP en backend (preferir `geoip-lite` local) y registrar con `origen: ip_fallback` o `no_verificado` si falla.

#### Scenario: Permiso denegado

- GIVEN el paciente rechaza geolocalización
- WHEN completa el flujo de ingreso
- THEN el sistema DEBE registrar `origen: no_verificado` y permitir ingreso a consulta

### Requirement: Consentimiento informado

El sistema DEBE informar al paciente, antes de solicitar GPS, el propósito de la captura (verificación de asistencia) conforme Ley 25.326.

### Requirement: Visibilidad para profesional y admin

El estado de verificación GPS (coordenadas, precisión, origen, mapa) DEBE ser visible para el profesional durante la consulta y para el admin en auditoría.

### Requirement: Ingreso sin GPS verificado

El paciente DEBE poder ingresar a la consulta aunque la ubicación no esté verificada; el estado DEBE quedar explícitamente marcado.

### Requirement: Umbral configurable

El umbral de precisión (`GPS_ACCURACY_THRESHOLD_M`) DEBE ser configurable por variable de entorno.
