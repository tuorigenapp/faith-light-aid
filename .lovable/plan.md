## Etapa 1 — Estilos A/B/C (dirección visual)

Antes de tocar la app, defino 3 direcciones visuales completas para que elijas UNA. Cada estilo respeta el Knowledge: mobile-first 375px, sin negros/blancos puros, 1 acento, radios/sombras/espaciado de la sección 3, sin la receta "hecho con IA", copy del avatar (repetir patrones, vacío, romper el ciclo, sin religión impuesta).

Cada dirección incluye: paleta (5 colores con hex), tipografía (2 Google Fonts con pesos), sistema de radios, sombras, y una MOCKUP estática mobile 375px del HOME de la app (saludo + card héroe con próxima acción + racha + una card de lista + bottom-nav) para que veas cómo se siente.

### Dirección A — "Amanecer sereno" (claro, cálido)
- Fondo: off-white cálido `#FBF8F4` con radial acento 6%.
- Neutro secundario: `#F1EBE2`.
- Acento único: terracota suave `#C96A4E` (CTA + dato clave).
- Texto: casi-negro con tinte `#2A241E`.
- Semánticos: verde `#3F8F6A`, ámbar `#C98A2B`.
- Tipografía: **Fraunces 600** (display) + **Inter 400/500** (body).
- Radios: card 16, botón 12, chip 10. Sombras claras (sección 3).
- Vibe: espiritual maduro, cálido, tipo libro devocional moderno. Se aleja de la estética "app de IA".

### Dirección B — "Bosque interior" (claro, verde profundo)
- Fondo: crema muy claro `#F6F5F1`.
- Neutro secundario: `#E8E6DE`.
- Acento único: verde bosque `#2F5D4A`.
- Texto: `#1F2A25`.
- Semánticos: rojo `#B04A3A`, ámbar `#B8862B`.
- Tipografía: **Instrument Serif 400** (display) + **Work Sans 400/500** (body).
- Radios: card 16, botón 12, chip 10.
- Vibe: sanación, raíces, calma. Verde como símbolo de crecimiento/reconexión, no religioso.

### Dirección C — "Noche de oración" (oscuro digno)
- Fondo: casi-negro con tinte azul `#0F1218`, superficie elevada `#171B23` (sin sombras, borde 1px al 10%).
- Neutro secundario: `#1E232D`.
- Acento único: dorado apagado `#D4A24C`.
- Texto: casi-blanco `#EDEAE2`.
- Semánticos: verde `#5FB08A`, rojo `#D96B5A`.
- Tipografía: **Sora 600** (display) + **Manrope 400/500** (body).
- Radios: card 16, botón 12, chip 10.
- Vibe: introspección nocturna, íntimo. Riesgo controlado: dorado ≠ neón, sin glow ni glass — no cae en la receta prohibida.

### Qué haré en esta etapa
1. Crear los 3 mockups estáticos (route `/estilos` temporal o 3 imágenes generadas) mostrando el HOME 375px de cada dirección con datos semilla realistas del avatar.
2. Aplicar SOLO en esa vista de comparación; NO tocar el resto de la app hasta que elijas.
3. Con tu elección, en la Etapa 2 aplico la dirección ganadora a tokens globales (`src/styles.css`) y reconstruyo la landing 10 secciones.

### Detalles técnicos
- Tokens en `src/styles.css` como CSS vars por dirección (`--bg`, `--surface`, `--accent`, `--text`, `--muted`), listos para promover a globales al elegir.
- Fuentes vía `<link>` en `src/routes/__root.tsx` (no `@import` en CSS).
- Mockups como componentes React estáticos — sin lógica, sin datos reales.

Responde con **A**, **B** o **C** (o pide ajuste puntual sobre una) y arranco la etapa 2 con esa dirección fija.
