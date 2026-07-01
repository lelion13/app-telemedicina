# Guía de Diseño Frontend: Telemedicina Lion

**Producto**: Plataforma de teleasistencia médica/profesional  
**Audiencia**: Operadores de empresa, profesionales de salud, pacientes (incluye adultos mayores con poca alfabetización digital)  
**Idioma**: Español (Argentina)  
**Job de cada pantalla**: Cada vista tiene un solo objetivo claro — agendar, atender, ingresar a consulta, administrar.

---

## 1. Dirección Estética

### Sujeto y tesis

La teleasistencia combina **confianza clínica** con **accesibilidad doméstica**. El paciente atiende desde su casa; el profesional necesita datos claros bajo presión. La interfaz no debe parecer un hospital frío ni una app genérica de videollamada.

**Tesis visual (hero)**: El estado de verificación GPS como "sello de presencia" — un indicador circular con tres estados (verificado / aproximado / no verificado) que acompaña toda la experiencia de consulta. Es el elemento firma del producto.

### Paleta

| Token | Hex | Uso |
|-------|-----|-----|
| `clinical-900` | `#0B3B4C` | Texto principal, headers — azul petróleo profundo (confianza médica) |
| `clinical-700` | `#1A6B7A` | Botones primarios, links activos |
| `paper-50` | `#F7F9F8` | Fondo general — blanco cálido con tinte verde-agua |
| `paper-100` | `#EEF2F0` | Cards, paneles secundarios |
| `signal-verified` | `#2D8B5E` | GPS verificado, estados positivos |
| `signal-warn` | `#C47D0E` | GPS aproximado (IP fallback), pendientes |
| `signal-alert` | `#B83A3A` | GPS no verificado, ausente, errores |
| `mist-400` | `#8FA5AD` | Texto secundario, placeholders |

**Riesgo estético justificado**: Tipografía con serif solo en el nombre del producto y títulos de paciente ("Tu consulta"), contrastando con sans geométrica en datos operativos — evoca formulario clínico sin ser anticuado.

### Tipografía

| Rol | Familia | Peso | Uso |
|-----|---------|------|-----|
| Display | **Fraunces** | 600 | Logo, títulos paciente, fechas destacadas |
| Body | **Plus Jakarta Sans** | 400–600 | UI general, tablas, formularios |
| Data | **IBM Plex Mono** | 400 | Horarios, IDs turno, coordenadas GPS |

**Escala**: 14px base mobile → 16px desktop. Títulos: 24/32/40px. Line-height generoso (1.6 body) para legibilidad en pacientes mayores.

### Layout

- **Mobile-first**: Paciente usa casi exclusivamente móvil. Botones mínimo 48px altura, targets táctiles amplios.
- **Grid**: 4 columnas mobile, 12 desktop. Contenido máximo 1200px en dashboards.
- **Densidad**: Dashboards empresa/profesional = densidad media (tablas). Paciente = espaciado amplio, una acción por pantalla.

```
PACIENTE (mobile)                 PROFESIONAL (desktop)
┌─────────────────────┐          ┌──────────────────────────────────┐
│  [Fraunces]         │          │ Header: agenda del día           │
│  Tu consulta        │          ├───────────────┬──────────────────┤
│  Mar 15 · 10:30     │          │               │ Panel paciente   │
│                     │          │   Video       │ ─────────────── │
│  ◉ GPS verificado   │          │   LiveKit     │ Nombre, domicilio│
│  [sello circular]   │          │               │ ◉ GPS + mini mapa│
│                     │          │               │ Notas            │
│  [Ingresar consulta]│          ├───────────────┴──────────────────┤
│  (botón grande)     │          │ Controles: mic · cam · colgar    │
└─────────────────────┘          └──────────────────────────────────┘
```

---

## 2. Componentes Clave

### Sello GPS (elemento firma)

Círculo de 64px (mobile) / 48px (panel profesional) con tres estados:

| Estado | Color | Icono | Label |
|--------|-------|-------|-------|
| Verificado | `signal-verified` | Check en círculo | "Ubicación verificada" |
| Aproximado | `signal-warn` | Tilde parcial | "Ubicación aproximada" |
| No verificado | `signal-alert` | Guion | "Ubicación no verificada" |

Animación sutil: el círculo "respira" (scale 1→1.03) mientras se obtiene GPS. Con `prefers-reduced-motion`: sin animación.

### Estados de turno

Pills con color de fondo al 10% opacidad y texto saturado:

| Estado | Color | Label ES |
|--------|-------|----------|
| pendiente | `mist-400` | Pendiente |
| confirmado | `clinical-700` | Confirmado |
| en_curso | `signal-verified` | En curso |
| finalizado | `clinical-900` | Finalizado |
| ausente | `signal-alert` | Ausente |
| cancelado | `mist-400` + tachado | Cancelado |

### Botones

- **Primario**: `clinical-700` fondo, texto blanco, border-radius 8px
- **Destructivo**: `signal-alert`, solo para cancelar turno / colgar
- **Paciente CTA**: Full-width, 56px alto, Fraunces 18px — "Ingresar a la consulta"

---

## 3. Pantallas

### 3.1 Login (`/login`)

- Centrado vertical, card sobre `paper-50`
- Logo + "Telemedicina Lion" en Fraunces
- Campos email/contraseña, botón "Iniciar sesión"
- Error genérico: "Email o contraseña incorrectos" (sin distinguir cuál)
- Sin registro público

### 3.2 Dashboard Empresa (`/empresa`)

- Header: nombre empresa + botón "Nuevo turno"
- Filtros: estado (pills), rango fechas
- Tabla: fecha/hora, paciente, estado (pill), profesional asignado
- Indicador conexión SSE (punto verde/gris en header)
- Actualización en vivo sin reload

### 3.3 Formulario Nuevo Turno (`/empresa/turnos/nuevo`)

- Sección "Paciente": nombre*, apellido*, teléfono*, email*, domicilio*, descripción (opcional, con hint "Ej: motivo de consulta")
- Autocompletar si email/tel existente
- Sección "Turno": selector fecha + hora (solo slots dentro de franjas válidas — deshabilitar horas inválidas)
- Botón "Agendar y enviar mail"

### 3.4 Dashboard Profesional (`/profesional`)

- Vista "Hoy" por defecto
- Cards de turno: hora grande (Fraunces), paciente, empresa origen, estado, sello GPS si disponible
- Acción: "Atender" → sala video
- Filtros: estado, empresa

### 3.5 Sala Videollamada — Profesional

- Layout 60/40: video izquierda, panel derecha
- Panel: datos paciente, domicilio, sello GPS + mini mapa Leaflet (pin si hay coords)
- Footer: controles mic/cam/colgar + botones "Finalizar" / "Marcar ausente"
- Campo notas expandible

### 3.6 Sala Videollamada — Paciente

- Video full-screen con controles flotantes abajo
- Sin panel lateral — máxima simplicidad
- Timer discreto de duración

### 3.7 Pantalla Paciente (`/consulta/[token]`)

**Flujo en pasos** (no numerados 01/02 — usar progreso visual con línea):

1. **Bienvenida**: "Tu consulta es hoy a las 10:30" + nombre profesional si asignado
2. **Consentimiento GPS**: texto claro Ley 25.326 + botón "Compartir ubicación" + link "Continuar sin compartir"
3. **Espera**: sello GPS con resultado + botón "Ingresar a la consulta" (habilitado siempre tras paso 2)
4. **Consulta**: vista video simplificada

**Error token**: pantalla amable — "Este link ya no está disponible. Contactá a quien te envió la invitación."

### 3.8 Dashboard Admin (`/admin`)

- Cards métricas arriba: turnos hoy, ausentismo %, empresas activas
- Tabs: Empresas | Usuarios | Franjas | Auditoría
- Franjas: tabla día / inicio / fin / activa con toggle

---

## 4. Motion

| Momento | Animación | Reduced motion |
|---------|-----------|----------------|
| Carga dashboard | Fade-in filas tabla 50ms stagger | Instant |
| Cambio estado turno (SSE) | Flash highlight en fila 300ms | Borde sólido 1s |
| Sello GPS obteniendo | Pulse suave | Spinner estático |
| Transición a sala video | Crossfade 200ms | Cut |

---

## 5. Accesibilidad

- Contraste WCAG AA mínimo en todos los textos
- Focus visible: outline 2px `clinical-700` offset 2px
- Labels en todos los inputs, no solo placeholders
- `aria-live="polite"` en actualizaciones SSE de tabla
- Paciente: texto mínimo 16px, botones 48px+

---

## 6. Copy y Tono

- Voseo argentino natural: "Ingresá", "Verificá tu ubicación"
- Errores concretos: "Elegí un horario dentro del rango disponible (lun–vie 9:00–13:00)"
- Mails paciente: asunto "Tu consulta de teleasistencia — [fecha]"
- Sin jerga técnica en vista paciente: nunca "token", "JWT", "sala LiveKit"

---

## 7. Tailwind Config (referencia)

```javascript
// tailwind.config — extend
colors: {
  clinical: { 700: '#1A6B7A', 900: '#0B3B4C' },
  paper: { 50: '#F7F9F8', 100: '#EEF2F0' },
  signal: { verified: '#2D8B5E', warn: '#C47D0E', alert: '#B83A3A' },
  mist: { 400: '#8FA5AD' },
},
fontFamily: {
  display: ['Fraunces', 'serif'],
  body: ['Plus Jakarta Sans', 'sans-serif'],
  data: ['IBM Plex Mono', 'monospace'],
},
```

Fuentes via `next/font/google`: Fraunces, Plus_Jakarta_Sans, IBM_Plex_Mono.

---

## 8. Checklist de Calidad

- [ ] Mobile-first verificado en pantalla paciente
- [ ] Sello GPS visible en flujo paciente y panel profesional
- [ ] Sin gradientes genéricos purple/blue
- [ ] Sin numeración decorativa 01/02/03
- [ ] Keyboard focus en todos los controles
- [ ] `prefers-reduced-motion` respetado
- [ ] Copy en español argentino, voseo consistente
