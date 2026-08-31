# Checklist ORÍGEN — juegos y prácticas

## Bloque 1 — Congelamientos (EN CURSO)
- [x] `/ejercicios` paso 4: el juego a pantalla completa ya no queda atrapado (se abre con botón, `onNext` y `onClose` conectados).
- [x] `GameShell`: el botón "Siguiente paso" y el avance automático usan `onNext ?? onClose` (nunca queda muerto).
- [x] `/etapas` y los 5 caminos: verificado que pasan `onNext` y `onClose`.
- [ ] Verificación en navegador de las 5 rutas de caminos + `/etapas` + `/ejercicios`.

## Bloque 2 — "Juegos del día": una sección por juego (sin popup)
- [ ] Rutas individuales `/juegos/$gameId` con navegación propia (quitar el `Dialog`).
- [ ] Tarjetas de la lista → enlaces a cada sección.
- [ ] Sustituir portadas remotas (i.ibb.co) por imágenes locales (requisito 100% offline).

## Bloque 3 — Regla común de recompensa
- [ ] Mínimo 5 partidas por juego para liberar la hoja del día, sin límite de tiempo.
- [ ] Palabras/retos nuevos cada día generados por la IA con caché local (fallback offline).
- [ ] Lista visible debajo de cada juego con lo acertado/memorizado.
- [ ] Obligatorio para la recompensa diaria del sistema de hojas.

## Bloque 4 — Rediseños 3D (uno por turno)
- [ ] Come-hojas: jardín 3D vivo, personaje animado, culpa con IA autónoma, cámara suave, feedback al recoger.
- [ ] Ordena tu caos: ciudad 3D que crece por nivel + grúa animada al completar 3 líneas.
- [ ] Aros de verdad: lanzamiento físico (apuntar, fuerza, trayectoria) sobre mesa con recipientes 3D.
- [ ] Globo de afirmaciones: globos flotando con vida propia, persona lanzando platillos, explosión + afirmación.
- [ ] Pez de sanación: 50 palabras positivas, dificultad por nivel.
- [ ] Escapa del control: conejo 3D, obstáculos naturales, humano autónomo, zanahorias (50) y meta.
- [ ] Respiración 4·4·6: persona 3D, emojis 3D, esfera guía, 4 rondas automáticas, 100% offline sin voz.

## Regla transversal
- [ ] Todo offline: sin CDN, APIs ni modelos externos en los juegos.
- [ ] No tocar sistemas ya existentes de niveles, progreso ni recompensas.
