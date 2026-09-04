# Checklist ORÍGEN — juegos y prácticas

## Bloque 1 — Congelamientos (LISTO)
- [x] `/ejercicios` paso 4: el juego a pantalla completa ya no queda atrapado.
- [x] `GameShell`: "Siguiente paso" y el avance automático usan `onNext ?? onClose`.
- [x] `/etapas` y los 5 caminos pasan `onNext` y `onClose`.

## Bloque 2 — Una sección por juego (LISTO)
- [x] Rutas propias: `/juegos` (lista) y `/juegos/:gameId` (sección individual, sin popup).
- [x] Tarjetas de la lista convertidas en enlaces con navegación real.
- [x] Portadas 100% locales (degradé del kit + ícono SVG), sin imágenes remotas.

## Bloque 3 — Regla común de recompensa (LISTO)
- [x] Mínimo 5 partidas ganadas por juego para liberar la hoja del día, sin límite de tiempo (`src/lib/game-plays.ts`).
- [x] Palabras y retos nuevos cada día, generados en el dispositivo (`src/lib/daily-challenge.ts`), 100% offline.
- [x] Lista visible debajo de cada juego con lo acertado/memorizado del día.
- [x] La hoja diaria se acredita con `awardLeaf` al llegar a 5 partidas (una vez al día).

## Bloque 4 — Rediseños (LISTO)
- [x] Escríbelo y créelo: reto diario de escritura + foto de la hoja (1-2) + audio + revisión de la mentora.
- [x] Pez de sanación: meta progresiva hasta 50 palabras positivas y registro de las acertadas.
- [x] Escapa del control: conejo animado con saltos, zanahorias (hasta 50), humano que cambia de carril y campo con vida.
- [x] Respiración 4·4·6: exactamente 4 rondas, cuenta visible, pausar/reanudar/reiniciar, sin voz ni internet.
- [x] Come-hojas: jardín 3D vivo, personaje animado, culpa con IA autónoma, cámara suave.
- [x] Ordena tu caos: ciudad 3D que crece por nivel + grúa animada al completar 3 líneas.
- [x] Aros de verdad (dos toques: dirección y fuerza, física parabólica): lanzamiento físico (apuntar, fuerza, trayectoria) sobre mesa con recipientes 3D.
- [x] Globo de afirmaciones: globos 3D con vida propia, persona lanzando, explosión + afirmación.

## Regla transversal
- [x] Todo offline: sin CDN ni recursos externos en los juegos.
- [x] Niveles, progreso y recompensas existentes intactos.
