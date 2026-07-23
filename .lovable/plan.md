## Etapa 1 (rev) — Dirección visual única "ORIGEN" + Splash

Descarto A/B/C. Construyo UNA sola dirección, viva y premium, alineada al logotipo ORIGEN (morado/rosado/azul con nubes) y a "el origen de una transformación". Aplico la sección 3 del Knowledge (radios, espaciado, sombras, animaciones baseline).

### Paleta "Amanecer ORIGEN" (clara, viva, no apagada)
- Fondo base: blanco casi-puro `#FBFAFF` con radiales de acento MUY sutiles (5-7% opacidad) del morado y rosado en las esquinas — nunca fondo plano.
- Superficie card: `#FFFFFF` con borde `#EEE9F7` (1px) y sombra suave.
- Acento principal (marca): morado `#7C5CFF` — CTA, iconos activos, dato clave.
- Acento secundario funcional: azul cielo `#5AA9FF` — links, chips info, estados "en progreso".
- Rosado marca: `#F58BCB` — solo highlights emocionales (racha, celebración, gemas).
- Verde sanación: `#3FBE8F` — checks, completado, "libre".
- Texto: casi-negro con tinte púrpura `#1B1930`; muted `#6B6A85`.
- Degradé marca (héroe, CTA principal, splash): `linear-gradient(135deg, #A78BFA 0%, #7C5CFF 40%, #5AA9FF 80%, #F58BCB 100%)` — tonal/análogo dentro de familia fría-cálida, mismo brillo. NO se usa en fondos planos; solo en tarjeta héroe, botón principal y logo container.
- Semánticos: rojo `#FF5F74`, ámbar `#F7B955`.

### Tipografía
- Display: **Sora 600/700** — moderna, geométrica, con carácter (no Inter/Poppins genérico).
- Body: **Manrope 400/500/600** — humana, legible en móvil.
- Cargadas por `<link>` en `__root.tsx`.

### Sistema (fijo en toda la app)
- Radios: card 20px (un pelín más generoso para "vivo"), botón 14px, chip 12px, input 12px.
- CTA principal: 56px alto, degradé marca, sombra glow morada `0 10px 28px rgba(124,92,255,0.35)`.
- Sombras claras: reposo `0 1px 3px rgba(27,25,48,0.06)`, elevada `0 12px 36px rgba(27,25,48,0.10)`, glow acento en CTA.
- Espaciado: lateral 20px, gap cards 12px, padding card 20px.
- Fondos con vida: cada pantalla incluye 1-2 blobs radiales fijos (blur 120px, opacidad 8-12%) morado + rosa + azul en esquinas — no molestan, dan aire.
- Micro-detalles: hairline degradada 1px SOLO en 2-3 elementos clave por vista (borde de card héroe, línea bajo título de sección).

### Splash screen con logotipo (NUEVO)
- Se muestra al abrir la app la primera carga (antes del router principal), 1.8–2.2s, saltable si el bundle ya está listo.
- Fondo: degradé marca sutil (morado→rosa→azul, 10-15% saturación) — hace juego con el logo.
- En el centro: logo ORIGEN grande (200x200), con 3 pulsaciones concéntricas de aro (opacidad 0→0.35→0, escala 1→1.6, stagger 0.6s, loop). El propio logo respira suavemente (scale 1↔1.04, 2.4s).
- Debajo: nombre "ORIGEN" en Sora 700, tagline "Transforma tu alma, vive tu propósito" en Manrope 400 opacidad 60%.
- Respeta `prefers-reduced-motion` (sin pulso, solo fade-in).
- Implementación: componente `<SplashScreen />` renderizado dentro de `RootComponent`, controlado por estado `showSplash`; se auto-oculta al terminar la animación o al primer clic. Se muestra una vez por sesión (sessionStorage flag).

### Mockup HOME que voy a construir para que apruebes
Renderizo UN mockup mobile 375px del HOME aplicando toda esta dirección:
- Header: avatar + saludo "Hola, Ruth" (Sora 600, 24px) + fecha + badge gema morada `1,240 💎`.
- Card héroe con degradé marca sutil (opacidad 12% sobre blanco) + borde hairline degradado, label "Tu misión de hoy", título grande, meta "8 min", CTA 56px degradé glow.
- Racha con icono llama rosa, semana en 7 puntos (5 morados llenos, 1 rosa "hoy en riesgo", 1 outline).
- Sección "Continúa donde lo dejaste" con 2 ejercicios (uno con check verde, uno pendiente con chevron).
- Bottom-nav 60px + safe-area, 5 destinos con activo (Inicio) en morado.

### Qué haré (en orden)
1. **Aprobación del logo** — copio el logo ORIGEN subido a `src/assets/logo-origen.png` vía `lovable-assets` para reusarlo (splash, favicon, __root og:image queda como está).
2. **Splash screen** — creo `src/components/SplashScreen.tsx` y lo monto en `RootComponent`. Sessionstorage `origen_splash_seen` para no repetir dentro de la sesión.
3. **Tokens globales** — reescribo `src/styles.css`: paleta arriba, degradé marca, radios (`--radius: 1.25rem`), sombras, blobs `.bg-aura` con los 3 colores marca, utilidades `.hero-gradient`, `.cta-glow`, `.hairline-brand`.
4. **Fuentes** — cambio el `<link>` en `__root.tsx` a Sora + Manrope; actualizo `--font-display` y `--font-sans`.
5. **Mockup HOME de referencia** — creo ruta pública temporal `/estilos` con la pantalla HOME 375px aplicando todo, SIN tocar el resto de la app.
6. Espero tu OK visual para arrancar Etapa 2 (Landing 10 secciones con esta identidad).

Detalles técnicos:
- No toco lógica ni datos; solo tokens + splash + una vista de referencia.
- `SplashScreen` es cliente-only (`useEffect` para arrancar timer, `useHydrated`-safe: monta oculto en SSR, se muestra tras hidratar). Nada de `window` en el render inicial.
- El favicon/PWA `theme-color` los actualizo al morado marca `#7C5CFF`.

Aprueba y ejecuto los 5 pasos en una sola generación.
