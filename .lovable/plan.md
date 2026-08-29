# Cierre de la etapa: juegos, Step 2 / Step 3 y modo voz

## Qué encontré en la app hoy

- Los juegos 3D (Pimpón, Pez, Dardo) ya existen y tienen 3 niveles con rondas y progreso guardado, pero el ciclo de lanzamiento se apoya en variables internas del motor 3D que quedan "trabadas" cuando se cambia de nivel o ronda: por eso el botón deja de responder.
- `Memoria de verdades` (`MemoryPairs`) ya baraja al azar y no tiene botón de recargar; falta la explicación clara de la temática.
- `¿Esta emoción es tuya o la heredaste?` (`ClassifyEmotions`) ya bloquea la respuesta una vez elegida.
- Step 17 de `/etapas` ya no usa retos mentales (ahora es respiración); `/ejercicios` **sí** sigue usando retos mentales en su paso 3.
- El asistente de voz existe como código (`src/lib/voice.tsx`, `VoiceControls`) pero **no está montado** en la aplicación: hoy no funciona en ninguna pantalla.
- La validación con IA de foto/voz existe (`src/lib/step-ai.functions.ts`) pero **no está conectada** a ningún paso.
- Step 2 y Step 3 son hoy listas de tareas con caja de texto, tanto en `/etapas` como en los 5 caminos.

## Bloque 1 — Arreglar los juegos

1. Pimpón y Dardo: rehacer el ciclo de lanzamiento para que el estado del lanzamiento viva en React (no dentro del bucle 3D), con reinicio garantizado al cambiar de nivel/ronda y al volver a entrar al juego. El botón nunca queda deshabilitado más de un segundo.
2. Pez: pez completo en cámara, movimiento en las cuatro direcciones, palabras positivas y negativas con reaparición infinita (nunca se agotan al llegar a la meta) y registro correcto de impactos negativos.
3. Los tres juegos: al reingresar continúan exactamente en su nivel y ronda.

## Bloque 2 — Los dos mini-juegos de tarjetas

4. `Memoria de verdades`: añadir una explicación breve arriba ("une cada herida con la verdad que la sana"), ejemplo visual y preguntas al azar en cada partida.
5. `¿Esta emoción es tuya o la heredaste?`: confirmar el bloqueo tras responder y mostrar feedback correcto/incorrecto.
6. `/ejercicios`: quitar el reto mental del paso 3 y sustituirlo por una experiencia interactiva del tema del día.

## Bloque 3 — Modo voz de ORÍGEN (accesibilidad)

7. Montar el proveedor de voz en toda la app y añadir el interruptor "Modo voz" en el perfil, más el botón "Escuchar" en los encabezados de cada paso.
8. La voz usa el motor del propio dispositivo (funciona sin internet cuando la voz instalada es local), prioriza voz femenina en español, cálida y pausada. Si el dispositivo no tiene voz compatible, el modo voz simplemente no aparece y nada se rompe.
9. La IA solo genera texto; la voz se produce aparte, para poder cambiar el motor más adelante sin tocar la app.

## Bloque 4 — Step 2 guiado (etapas + 5 caminos)

10. Convertir Step 2 en una secuencia: Escuchar → Entender → Hacer → Registrar → Validar → Feedback → Completar → Siguiente actividad.
11. Registrar la respuesta de tres formas: escribir, subir foto de la hoja, o grabar nota de voz.
12. La IA revisa el registro (no acepta fotos vacías o sin relación, ni grabaciones en silencio), es generosa con respuestas equivalentes y explica en una frase qué falta cuando rechaza.
13. El feedback aparece escrito y puede escucharse con el modo voz.

## Bloque 5 — Step 3 interactivo (etapas + 5 caminos)

14. Reemplazar la lista de tareas por una experiencia con tarjetas: elegir 3 cualidades del tema del camino, elegir cuál practicar primero y responder "¿cómo la practico hoy?" escribiendo o hablando, con validación de IA y animaciones al seleccionar.
15. La mecánica y las palabras se adaptan al tema de cada camino (niño interior, glow up mujer/hombre, magnético, permiso) y de cada etapa.

## Bloque 6 — Persistencia y verificación

16. Guardar por usuario y por paso: ruta, step, actividad, estado, respuesta, transcripción, referencia de imagen, resultado de validación y fecha; al reingresar se retoma exactamente ahí.
17. Verificar en el navegador `/etapas`, los 5 caminos y `/ejercicios`: los demás pasos intactos, sin rutas nuevas ni duplicadas, los 6 juegos con sus 3 niveles funcionando.

## Notas técnicas

- Step 2 y Step 3 se construyen como componentes nuevos reutilizables (`StepGuided`, `StepQualities`) usados por `etapas.$stageId.tsx` y `caminos.$caminoId.$day.tsx`; ningún componente compartido por otros pasos se modifica.
- Los juegos se corrigen dentro de `PingPongToss.tsx`, `DartThrow.tsx` y `FishInWater.tsx` moviendo el estado de intento a React refs sincronizados por etiqueta de nivel/ronda.
- Voz: `VoiceProvider` se monta en `src/routes/__root.tsx`; usa `SpeechSynthesis` del dispositivo (local = sin conexión). No se promete offline donde no lo sea.
- IA: se usan las funciones de servidor ya creadas (`validateStepEvidence`, `transcribeVoiceNote`) con el gateway de IA; el audio de entrada se transcribe en el servidor, la voz de salida se genera en el dispositivo.
- La evidencia de Step 2/3 se guarda en la base de datos por usuario, con RLS, y las fotos en almacenamiento privado.
