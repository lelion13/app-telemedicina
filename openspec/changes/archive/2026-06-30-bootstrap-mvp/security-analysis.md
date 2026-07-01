# Análisis de Seguridad: Plataforma de Teleasistencia

**Alcance**: MVP documentado | **Jurisdicción**: Argentina | **Fecha**: 2026-06-29

## 1. Resumen Ejecutivo

La plataforma procesa **datos sensibles de salud** (identidad del paciente, domicilio, notas clínicas), **geolocalización** y **comunicación audiovisual en vivo**. El riesgo residual es **MEDIO-ALTO** sin controles implementados; con las mitigaciones de este documento baja a **MEDIO-BAJO** apropiado para MVP operativo bajo Ley 25.326.

## 2. Activos Críticos (Crown Jewels)

| Activo | Clasificación | Impacto si comprometido |
|--------|--------------|------------------------|
| Datos de pacientes (PII + salud) | Restringido | Sanciones Ley 25.326, daño reputacional |
| Registros GPS | Restringido | Tracking no autorizado, violación privacidad |
| Credenciales usuarios internos | Confidencial | Escalada de privilegios, acceso cross-tenant |
| Tokens paciente (JWT) | Confidencial | Suplantación de paciente en consulta |
| Claves LiveKit / NEXTAUTH_SECRET | Secreto | Control total de sesiones y salas |
| Notas profesionales | Restringido | Filtración información clínica |

## 3. Análisis de Superficie de Ataque

### Expuesta a Internet

- `/login` — brute force, credential stuffing
- `/consulta/[token]` — enumeración/adivinación de tokens, replay
- `/api/gps` — inyección, abuso sin rate limit
- `/api/livekit/token` — escalación si validación débil
- `/api/events/turnos` — SSE hijacking si auth débil
- LiveKit WebRTC — interceptación si TLS/DTLS mal configurado
- Traefik dashboard (si expuesto) — misconfiguration

### Interna (solo Docker network)

- MongoDB — safe si no expuesto a host
- Redis — safe si no expuesto

### Humana

- Phishing a usuarios empresa/profesional
- Reenvío de link de paciente a terceros (token reutilizable)
- Ingeniería social para obtener acceso admin

## 4. Threat Modeling (STRIDE)

### Autenticación / Sesiones

| Amenaza | Vector | Mitigación |
|---------|--------|------------|
| **Spoofing** | Robo credenciales | bcrypt, mensajes genéricos login, rate limit, MFA futuro |
| **Tampering** | Manipulación JWT paciente | Firma HMAC/RSA, expiración corta, validar en cada request |
| **Repudiation** | Negar acción | LogConsulta con IP, user-agent, timestamp |
| **Info Disclosure** | Error verbose login | Mensajes genéricos, sin stack traces en prod |
| **DoS** | Flood login/SSE | Rate limiting, Traefik middlewares |
| **Elevation** | Empresa accede datos otra empresa | Filtro empresaId obligatorio en queries y SSE |

### Videollamada

| Amenaza | Vector | Mitigación |
|---------|--------|------------|
| **Spoofing** | Entrar a sala ajena | Token LiveKit con room name = salaVideoId del turno |
| **Info Disclosure** | Escucha sala | Tokens efímeros, sin grabación, salas únicas por turno |
| **DoS** | Flood salas | Límite participantes = 2 (paciente + profesional) |

### Geolocalización

| Amenaza | Vector | Mitigación |
|---------|--------|------------|
| **Info Disclosure** | GPS almacenado indefinidamente | Política retención (sugerido 24 meses), acceso solo admin/profesional del turno |
| **Tampering** | Coordenadas falsas en POST | Validar rangos lat/lng, registrar accuracy, marcar no_verificado si sospechoso |
| **Privacy** | Envío IP a terceros | Preferir geoip-lite local sobre APIs externas |

## 5. MITRE ATT&CK — Técnicas Relevantes

| Táctica | Técnica | Control defensivo |
|---------|---------|-------------------|
| Initial Access | T1078 Valid Accounts | Política contraseñas, bloqueo tras intentos |
| Initial Access | T1190 Exploit Public App | Dependabot, actualización deps, SAST |
| Credential Access | T1110 Brute Force | Rate limit `/login` |
| Collection | T1213 Data from SaaS | Cifrado TLS, mínimo privilegio DB |
| Exfiltration | T1041 Exfil over C2 | Logs de acceso, alertas volumen |
| Impact | T1485 Data Destruction | Backups MongoDB, volumen persistente |

## 6. Cumplimiento Normativo — Argentina

### Ley 25.326 (Protección de Datos Personales)

| Requisito | Implementación |
|-----------|---------------|
| Consentimiento informado | Texto claro antes de solicitar GPS |
| Finalidad determinada | GPS solo para verificación de asistencia |
| Seguridad de datos | TLS, bcrypt, acceso por rol, logs auditoría |
| Derecho de acceso | Procedimiento manual (admin) — documentar en política de privacidad |
| Registro BD (AAIP) | Responsabilidad del titular del tratamiento — verificar inscripción |

### Ley 26.529 (Derechos del Paciente)

- Información clara al paciente sobre teleasistencia
- Historia clínica (notas profesionales) con acceso restringido
- Sin grabación = menor superficie, pero documentar en consentimiento

### Recomendaciones adicionales

- Publicar **política de privacidad** y **términos de uso** en español
- Designar responsable de protección de datos
- Procedimiento de notificación de brechas (AAIP + afectados)

## 7. Controles de Defensa en Profundidad

```
Capa 1 — Red:     Traefik TLS, firewall UDP selectivo, MongoDB no expuesto
Capa 2 — App:     proxy.ts por rol, validación Pydantic/Zod en API, rate limits
Capa 3 — Auth:    NextAuth JWT, bcrypt, tokens paciente firmados con expiración
Capa 4 — Datos:   Filtro tenant, campos mínimos en respuestas, sin grabación video
Capa 5 — Audit:   LogConsulta, RegistroGPS, logs acceso sin secrets
Capa 6 — Ops:     Backups MongoDB, healthchecks, rotación secrets
```

## 8. Matriz de Riesgos Priorizada

| # | Riesgo | Prob. | Impacto | Nivel | Mitigación | Prioridad |
|---|--------|-------|---------|-------|------------|-----------|
| 1 | IDOR cross-tenant turnos | Media | Alta | **Alto** | Filtro empresaId en todas las queries | P0 |
| 2 | Token paciente reenviado | Media | Media | **Medio** | Ventana temporal, logs acceso | P0 |
| 3 | Brute force login | Alta | Media | **Alto** | Rate limit + lockout temporal | P0 |
| 4 | WebRTC bloqueado/filtrado | Media | Alta | **Alto** | TURN LiveKit, docs puertos | P1 |
| 5 | Secrets en repo/logs | Baja | Alta | **Medio** | .env gitignore, sanitizar logs | P0 |
| 6 | Dependencias vulnerables | Media | Alta | **Alto** | npm audit en CI, Dependabot | P1 |
| 7 | GPS almacenado sin límite | Media | Media | **Medio** | Job retención, política documentada | P2 |
| 8 | SSE sin reconexión segura | Baja | Baja | **Bajo** | Cookie httpOnly, SameSite | P2 |

## 9. Detección y Respuesta

### Qué detectar

- Múltiples intentos login fallidos desde misma IP
- Accesos a `/consulta/[token]` con tokens inválidos (posible scanning)
- Cambios masivos de estado de turnos
- Conexiones SSE anómalas (múltiples IPs misma sesión)

### MTTD estimado (MVP)

- Sin SIEM: horas a días (revisión manual de logs)
- Con logs estructurados + alertas básicas: minutos a horas

### Playbook breve — Brecha de datos pacientes

1. **Contener**: desactivar endpoint afectado, rotar secrets si comprometidos
2. **Evaluar**: identificar registros afectados, ventana temporal
3. **Notificar**: AAIP y titulares según Ley 25.326
4. **Recuperar**: parche vulnerabilidad, restaurar desde backup si necesario
5. **Post-mortem**: documentar causa raíz, actualizar specs

## 10. Recomendaciones por Fase

### P0 — Antes de producción

- Filtro tenant en TODAS las API routes y SSE
- Rate limiting login y endpoints públicos
- bcrypt con work factor ≥ 12
- Variables sensibles solo en `.env`
- Headers seguridad (HSTS, CSP, X-Content-Type-Options)
- Validación Zod en todos los inputs API

### P1 — Primer mes producción

- `npm audit` en CI/CD
- Backups automáticos MongoDB (diario, retención 30 días)
- Logs estructurados (JSON) sin PII innecesaria
- Monitoreo uptime (healthcheck externo)

### P2 — Roadmap

- MFA para admin y profesionales
- WAF en Traefik (OWASP CRS)
- Penetration test externo
- SIEM o alertas centralizadas
- Cifrado at-rest MongoDB

## 11. Verificación

- [ ] STRIDE completado por componente
- [ ] Activos críticos identificados
- [ ] Controles mapeados a amenazas P0
- [ ] Cumplimiento Ley 25.326 documentado
- [ ] Playbook IR básico definido
- [ ] Sin grabación de video confirmado (reduce riesgo)
