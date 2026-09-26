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

## Comunidad — conversaciones entre personas
- [x] Mostrar tres respuestas por comentario y abrir el resto en una vista Conversación, sin línea gris en la vista principal.
- [x] Permitir contrarespuestas con contexto citado, reacciones compactas y acceso directo a cada conversación.
- [x] Evitar que ORÍGEN interrumpa conversaciones entre personas o responda más de una vez a la misma persona en un hilo.
- [x] Comprobar conversación y navegación en móvil y escritorio.

## Comunidad — lectura sin distracciones
- [x] Colocar "Ver todos" antes de las tres respuestas visibles.
- [x] Al abrir una publicación o conversación, ocultar las barras superior, inferior y lateral, además de preguntas, mentora, ruleta y avisos flotantes; mantener la suspensión.
- [x] Mostrar la flecha de regreso junto a "Conversación" y verificar la lectura y escritura a 375 px y en escritorio.

## Comunidad — respuestas grupales claras y publicación silenciosa
- [x] Publicar respuestas del grupo dentro de su conversación, sin confirmaciones ni ventanas emergentes; comprobar el envío real.
- [x] Distinguir el comentario de origen de sus tres respuestas tenues y abrir el grupo desde la estrella amarilla animada.
- [x] En Conversación mostrar solo el comentario del usuario que originó las respuestas, sin repetir la publicación ni la encuesta.
- [x] Conservar la respuesta automática de ORÍGEN solo cuando está habilitada y una vez por persona; no entrar en contrarespuestas humanas.

## Comunidad — identidad anónima y burbujas
- [x] Asignar un número aleatorio único y persistente por persona anónima, también para publicaciones y respuestas anteriores.
- [x] Mostrar «Alma Anónima #número» sin revelar la identidad real en la comunidad ni en las citas.
- [x] Diferenciar visualmente las publicaciones, respuestas principales y respuestas agrupadas en claro y oscuro.
- [x] Comprobar nombres y colores en móvil y escritorio.

## Comunidad — restaurar diseño y simplificar números
- [x] Restaurar colores originales de publicaciones, opciones separadas de encuestas y sombra oscura legible en portadas.
- [x] Dar a cada burbuja de respuesta un tono cálido distinto, visible en claro y oscuro.
- [x] Asignar a cada persona anónima un número único entre 1 y 999.999, salvo que se agote ese rango; corregir nombres anteriores.
- [x] Comprobar publicaciones, encuestas, portadas y conversaciones en móvil y escritorio.

## Comunidad — reacciones y conversaciones pequeñas
- [x] Evitar reacciones duplicadas con lectura actualizada, protección ante doble toque y cambio seguro de reacción.
- [x] Mostrar conversaciones de una o dos respuestas sin estrella ni contador, con referencia discreta al mensaje de origen.
- [x] Dar una pulsación suave a la burbuja de reacción y respetar el movimiento reducido.
- [x] Comprobar reacción en publicaciones y respuestas, y conversaciones en móvil y escritorio.

## Comunidad — celebración al acertar encuestas
- [x] Quitar la pulsación de las reacciones sin cambiar su funcionamiento.
- [x] Celebrar con confeti únicamente los votos correctos; los incorrectos siguen mostrando su resultado sin celebración.

## Comunidad — fotos y audios
- [x] Publicación con foto: título, foto debajo y texto (sin portada)
- [x] Panel: elegir imagen normal o de portada
- [x] Respuestas: fotos de cualquier formato, foto + audio juntos

## Gran actualización (pedido Sep 26)
- [x] 1. Admin Visualiza: crear categorías principales (portada + título) y la IA genera imagen de sección
- [x] 2. Admin Visualiza: subcategorías dentro de cada principal, IA ordena y rellena tareas, sopa de letras, juegos, afirmaciones, recetas, pasos (usuario sube audio/detalles)
- [x] 3. Admin Limpieza espiritual: IA genera portada, recetas y pasos por sección
- [x] 4. Compras con comprobante (foto del pago) + panel admin aprobar/denegar
- [x] 5. Transferencias de saldo entre usuarios: panel admin aprobar/denegar/apelación
- [x] 6. Reemplazar burbuja de ruleta por menú flotante "TODO LO DE ORÍGEN" con flecha
- [x] 7. Bolitas rojas de pendientes (Camino, ejercicios, Palabra, Visualízate, árbol, ruleta, comunidad, compras, transferencias) en menú y burbuja
- [x] 8. Chat de notificaciones ORÍGEN solo lectura (leído/no leído) + 1 mensaje IA diario personalizado + avisos del sistema
- [x] 9. /ejercicios: quitar ícono notificación y foto con error, mapa rediseñado con final, lecciones diarias arriba, 8 por semana, todo funcional
- [x] 10. Quitar avatar del niño con hoja de toda la app y Camino ORÍGEN

## Pedido Sep 26 (2) — panel y avisos
- [x] Saldo: 1 hoja = 1 hoja en toda la app (barra, etapas, juegos, premios); 1 hoja en ~3 días
- [x] Temas principales: visible/oculto, editar título, portada URL o IA, copiar diseño de otro, eliminar, búsqueda, portadas visibles
- [x] Subtemas: listar todos los temas (también ocultos) en vivo, regenerar con IA, eliminar
- [x] Limpieza: editar, portada URL/IA, mejorar con IA, eliminar
- [x] Música (Audios): eliminar y rellenar con IA al subir audio
- [x] Camino ORÍGEN: crear caminos con IA, visible/oculto, portada URL
- [x] Portadas por URL de /categorias y de los 10 juegos
- [x] Usuarios: sumar/quitar hojas, eliminar, selección múltiple con filtros por plan
- [x] Avisos ORÍGEN de todo (camino, ejercicios, palabra, visualízate, juegos, compras) + bolita en Camino
- [x] Ocultar burbujas flotantes en secciones de concentración; nuevo ícono TODO EN ORÍGEN
