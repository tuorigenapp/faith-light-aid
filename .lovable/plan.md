
## 1. Cambio de contraseña (inmediato)

Actualizar la contraseña del usuario `infodenegociorm@gmail.com` a `Prueba123@` usando la API admin de Lovable Cloud. Se ejecuta al aprobar el plan.

## 2. Intake obligatorio de 3 etapas (bloquea toda la app)

Nueva ruta `/onboarding` que aparece justo después del registro/login y **antes** de acceder a cualquier sección. Sin completarlo, no se muestra dashboard, etapas, ejercicios ni chat IA. Se guarda en una nueva tabla `intake_sessions`.

**Etapa 1 — Patrón del árbol genealógico**
Intro: "Basándonos en tus familiares (abuelos, padres, tíos, sobrinos), responde con sinceridad para identificar el patrón que se repite en tu linaje."
3 preguntas abiertas: relaciones/hábitos, miedos/traumas, crisis/repeticiones.

**Etapa 2 — Infancia**
Intro: "Aquí no hay tabúes ni juicio. Nada de lo que escribas se comparte."
3 preguntas: recuerdos marcados, heridas emocionales, creencias aprendidas.

**Etapa 3 — Cierre y solución**
La IA (Lovable AI Gateway) analiza las respuestas y genera:
- Resumen del problema/patrón identificado (sin suponer — se pide más detalle si es ambiguo).
- Plan personalizado que reordena etapas y ejercicios según el caso.
- Ritual de cierre energético cristiano: pedir perdón → soltar → avanzar → oración de bienvenida.

El resultado se guarda en `intake_sessions.ai_plan` y se usa para personalizar toda la app (etapas priorizadas, categorías de audios recomendadas, tono del chat).

## 3. Nueva sección "Visualízalo y Vívelo" (Método de Cristo 3-6-9)

Nueva ruta `/visualiza` en el menú principal. Estilo Spotify (dark, tarjetas grandes con portada, player sticky abajo).

**Estructura**
- **Portada de playlist** con categorías del Método de Cristo: Dinero y Prosperidad, Casa Propia, Pareja y Matrimonio, Negocio, Trabajo Ideal, Propósito y Llamado, Abundancia General, + libre.
- **Grilla de audios diarios** — 1 audio por día se desbloquea según la categoría que el usuario quiere manifestar. Se muestra número de día, portada, duración y check si ya se escuchó.
- **Reproductor tipo Spotify**: portada grande, título, categoría, controles play/pause/seek, barra de progreso, botón siguiente.

**Ficha del día (abajo del player)**
- **Afirmación del día** grande arriba (la frase "Ya tengo…" según categoría).
- **Audio** en el centro.
- **4 preguntas del método** (imagen adjunta):
  1. Escribe 3 veces lo que ya ves realizado (YA TENGO).
  2. Escribe 6 veces la identidad que estás desarrollando (YO SOY).
  3. Escribe 9 veces la declaración de gratitud (GRATITUD).
  4. Petición sencilla al Espíritu Santo (GUIANZA).
- **Botón "Descargar PDF blanco y negro"** — genera un JPG/PDF imprimible con el layout del libro (título, categoría, fecha, cajas para escribir) para hacer el ejercicio a mano.
- Instrucción visible: "Repite este ejercicio Mañana (3), Tarde (6), Noche (9) durante 21 días."

**Datos**
- Tabla `manifest_categories` — categorías del Método de Cristo con afirmación base, identidad y gratitud plantilla.
- Tabla `manifest_audios` — 1 fila por (categoría, día). Campos: `day_index`, `title`, `audio_url` (nullable, tú los subes luego), `cover_url`, `duration_seconds`. Placeholder si audio no cargado aún.
- Tabla `manifest_entries` — respuestas del usuario por audio (las 4 preguntas), progreso diario, racha.
- Admin: campo para subir audios a Supabase Storage bucket `manifest-audios` desde `/admin`.

## 4. Detalles técnicos (para referencia)

- Migración SQL: `intake_sessions`, `manifest_categories`, `manifest_audios`, `manifest_entries` + GRANTs + RLS por `auth.uid()`.
- Bucket privado `manifest-audios` con política de lectura para usuarios autenticados.
- Gate global en `_authenticated/route.tsx`: si `intake_sessions.status !== 'completed'` para el user actual, redirect a `/onboarding`.
- PDF generado con `jspdf` (blanco y negro, tipografía serif estilo libro).
- IA del cierre: Lovable AI Gateway `google/gemini-2.5-flash` con prompt estructurado; si respuestas insuficientes, la IA pide aclaración en vez de suponer.
- Semilla inicial: 8 categorías × 21 días = 168 filas de `manifest_audios` con títulos y afirmaciones tomadas de las imágenes del libro; `audio_url` vacío hasta que subas.

## 5. Fuera de alcance en este turno
- Contenido real de los audios (los subirás tú desde el panel admin).
- Recordatorios push del método 3-6-9 (mañana/tarde/noche) — se puede agregar después.

¿Apruebas para ejecutar?
