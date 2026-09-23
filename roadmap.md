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

## Solicitud actual — comunidad, inicio y Visualízalo
- [x] Comunidad: preguntas y respuestas anidadas, anonimato protegido, moderación/suspensión, multimedia, guardados, seguir temas y reacciones/compartir.
- [x] Comunidad: respuestas ORÍGEN, categorías interactivas, contenidos verificados con fuentes y acceso premium sin prometer pruebas inexistentes.
- [x] Inicio: slider de pantallas reales, banner de comunidad, descarga funcional, empezar por onboarding; correo de confirmación habilitado con reenvío.
- [x] Visualízalo: novena subcategoría y orden dinámico, quitar Juegos del día, audio opcional y generación de textos desde el panel.
- [x] Verificar en móvil y escritorio los flujos y límites de seguridad.

## Comunidad — ajustes solicitados
- [x] Grabación de audio manos libres: permiso, bloqueo, pausa, envío y descarte; respuesta solo de audio.
- [x] Separar imágenes y audios; encuestas con porcentajes y hasta seis opciones; reacciones visibles.
- [x] Avatares ilustrados, nombres, imágenes de temas y logo ORÍGEN; búsqueda de preguntas y respuestas.
- [x] Publicación flotante, 10.000 caracteres y oferta de membresía en cada conversación.
- [x] Tres momentos diarios por tema con portada y encuestas, sin borrar contenido anterior; verificar en móvil.

## Comunidad — organización y audio
- [x] Encuestas solo desde administración, opciones visibles antes del voto y porcentajes/selección después.
- [x] Grabación completa audible, manos libres y controles de borrar, pausar y enviar; audio publicado reproducible de principio a fin.
- [x] Mis publicaciones, Siguiendo y Mis comentarios con estados vacíos, temas identificables y contenidos completos.
- [x] Bloquear/desbloquear temas sin ocultarlos de Temas; quitar invitaciones de pago del listado.
- [x] Reacciones 3D familiares y botón centrado de nueva publicación; verificado en móvil y escritorio.

## Corrección final — identidad de temas
- [x] Publicaciones y encuestas automáticas muestran nombre e imagen de su tema; logo ORÍGEN reservado a respuestas automáticas.
- [x] Las portadas usan imágenes del grupo temático correspondiente; fechas relativas conservadas.
- [x] Ícono de Comunidad consistente con el resto de la navegación.
