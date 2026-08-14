# Plan de cierre total — ORÍGEN

Todo lo pedido, agrupado en 8 bloques. Se construye completo en una sola tanda tras tu OK.

---

## Bloque 1 — Arreglos críticos (primero)

**Conteo de hojas (error grave).** Hoy 1 hoja = 100 puntos internos y se muestra "1.000". Se cambia a conteo entero real: 1, 2, 3, 4… Las micro-acciones acumulan progreso hacia la siguiente hoja, pero el saldo visible siempre es un número entero sin comas ni decimales. Tope diario sigue siendo el mismo ritmo (una hoja completa toma ~3 días), solo cambia cómo se cuenta y se muestra.

**Fuera la palabra "GEMAS".** Se reemplaza por "Hojas" en Perfil, Árbol generacional, Premios y en todo texto visible de la app (incluido el nombre de la imagen del árbol).

**Etapas nuevas que no cargan.** Las categorías (Niño interior, Glow Up, Magnético, Deja de pedir permiso) se alinean al mismo motor de carga y estados que "Camino ORÍGEN": mismo mapa, mismo generador de contenido, mismos estados de carga/error/bloqueo. Se corrige la causa raíz de por qué no cargan, no un parche visual.

**Imágenes y audios que no cargan en GitHub/publicado.** Se revisan todos los recursos (ícono del loading, redes sociales del popup, audios del onboarding, banners) y se pasan al sistema de assets con URL absoluta y estable, verificando cada uno cargue en producción.

**Login vs onboarding.**
- Usuario que **inicia sesión** → va directo al Home. Nunca ve onboarding.
- Usuario que **se registra** → salta el audio inicial y arranca desde la pregunta 2 en adelante.
- Se elimina el re-render/recarga que devuelve al onboarding.

---

## Bloque 2 — Panel de administración (solo dueña)

Ruta `/admin`, protegida en el **servidor** (rol admin verificado en base de datos, no solo ruta oculta) + reglas de acceso que impiden que cualquier usuario normal lea estos datos. Si un dato no existe: **"Sin datos"**, nunca inventado.

**Secciones:**

1. **Avisos al dueño** (banner arriba, lenguaje simple: qué pasó → por qué importa → qué hacer). Se dispara con: IA cara (>20% de ingresos), webhook de pagos fallando, cancelaciones por pago fallido altas, canal que pierde dinero, margen negativo. Si todo bien: "✅ Todo en orden este mes".
2. **Ventas**: ingresos, compras, cancelaciones (voluntarias vs por pago fallido), MRR, suscripciones activas, pruebas iniciadas.
3. **Ganancia real**: ingresos − Hotmart − afiliados − impuestos − IA (costo real registrado por llamada) − infra − email, con % de margen. Frase clara: "Facturaste $X y te quedaron $Y limpios".
4. **Usuarios**: totales, activos 1/3/7/30 días, activación real, retención D1/D7/D30.
5. **Uso**: acciones más usadas (desde el registro de eventos), embudo del onboarding paso a paso.
6. **Origen de usuarios (por canal/sección/etapa)**: registros, activación, uso, prueba iniciada, pago real, cancelación y retención **por canal**. Así se ve qué sección trae curiosos y cuál trae pagos. Incluye LTV, CAC, ganancia por canal, ratio LTV:CAC y payback.
7. **IA**: costo real por función y por usuario, gasto del día.
8. **Motivos de cancelación**: conteo y tendencia.
9. **Errores**: resumen de fallos y alertas abiertas.
10. **Gestión de usuarios**: alta manual con solo **nombre + correo** (genera acceso y lo envía), ver/otorgar plan, y **excluir cuentas internas o de prueba** de todas las métricas con un switch.

**Base técnica:** tabla de registro de eventos (fuente única de verdad), tabla de costos de IA por llamada, tabla de pagos/suscripciones alimentada por el webhook de Hotmart, y campo de origen en el perfil. Gráficos limpios, sin adornos.

---

## Bloque 3 — Encuesta de cancelación

Al cancelar (y al bajar de plan), pantalla con motivos: no era lo que esperaba · el plan gratis me basta · no entendí cómo usarla · me dio miedo el cobro · no tengo tiempo · es muy caro · otro (texto libre). Se guarda y alimenta el panel.

---

## Bloque 4 — Freemium reordenado (moderación profesional)

**Gratis (engancha, no satisface):** diagnóstico completo, Día 1 de un solo camino, Palabra del día completa con quiz, 1 libro, 3 mensajes con la mentora, diario hasta 5 entradas, juegos diarios, árbol con hasta 4 familiares.

**Pro (Camino ORÍGEN):** los 365 días de todos los caminos, playlists completas de 21 días, consultas (Pareja, Patrones, Dios te dice hoy) con PDF e historial, biblioteca completa, chat sin límite, diario ilimitado, descargables.

**Explorador (US$2,99):** puente — desbloquea 1 camino completo + 1 consulta al mes.

**Momentos de upgrade** (no invasivos): al terminar el Día 1, al intentar el día 2 de una playlist, al agotar mensajes, al querer el PDF, al llegar a 5 entradas del diario, al ver un libro bloqueado. Siempre con el valor concreto delante, no con muro seco.

---

## Bloque 5 — Auditoría Head of Product + acciones aplicadas

Diagnóstico honesto y corto (propuesta de valor, onboarding, activación, gratis vs Pro, momentos de paywall, retención D1/D3/D7, claridad de la landing, métricas, riesgos de abandono) y aplico en el mismo trabajo las mejoras de mayor impacto: promesa única en el primer frame, activación en menos pasos, recompensa visible el día 1, regreso al día 2 y 3, y paywall con fecha real de cobro.

---

## Bloque 6 — /palabra como experiencia, no texto

Cada día trae, con emoji 3D por bloque:
1. Enseñanza principal
2. Reflexión para ti
3. Reflexión para la familia
4. **Para pensar** — quiz de 3 preguntas con 3 opciones, ligado a la palabra del día, otorga hojas del día
5. Consejo espiritual

Reescritura del tono: narración humana, con textura y diálogo, como alguien que te cuenta la historia bíblica y te acompaña — no informe.

**Descarga imprimible:** fondo de pantalla a página completa (sin cortar arriba ni abajo), texto centrado, con degradado/opacidad para que todo se lea, siempre sincronizado con la palabra real del día, e incluye nombre + ícono de ORÍGEN y la dirección de la app. Rota entre 5 fondos distintos.
*Nota: las 5 imágenes de fondo no llegaron adjuntas en el mensaje. Si me las envías las uso tal cual; si no, genero 5 fondos de naturaleza/cielo en la estética ORÍGEN y luego las puedes reemplazar.*

**Compartir:** menú con WhatsApp, Facebook, Instagram, X, Telegram y copiar enlace (ya no solo correo), siempre con nombre, enlace e ícono de la app.

---

## Bloque 7 — Planes y afiliados

Enlaces de pago reales en Membresía:
- Explorador US$2,99 → `pay.hotmart.com/U107110586N?off=ys5ahbh8`
- Mensual US$14,99 → `...?off=h24bbhc6`
- Anual US$89,99 → `...?off=oi4xqwda` (recomendado, mostrado como $/mes)

Página de afiliados rehecha con la información de las imágenes (comisiones 50% primera venta + 10% recurrente, planes, reglas, materiales) y botón de registro a `affiliate.hotmart.com/affiliate-recruiting/view/4091O107110607`.

---

## Bloque 8 — Primeros pasos + Notificaciones

**Checklist "Primeros pasos"** solo para usuarios nuevos, 5 acciones: completar diagnóstico · abrir la Palabra de hoy · agregar 1 familiar al árbol · hacer el Día 1 de tu camino · escribir tu primera entrada del diario. Se marcan solas al cumplirse, se puede minimizar o cerrar sin perder progreso. No toca nada más.

**Notificaciones push web.** Nota técnica: esta app no es Next.js, así que se implementa con el equivalente correcto de esta arquitectura (misma tabla de suscripciones con reglas de acceso, service worker propio, endpoints de suscripción y envío, botón "Activar notificaciones" en Perfil). Notificaciones propuestas (confirmas cuáles activar dentro del mismo trabajo, quedan todas listas y se pueden apagar):
1. Palabra del día lista (mañana) — Alta
2. Tu día siguiente del camino te espera — Alta
3. Racha en riesgo hoy — Alta
4. Tu consulta está lista — Alta
5. Mensajes de la mentora disponibles otra vez — Media
6. Nueva hoja de sanación disponible — Media
7. Semana desbloqueada / libro nuevo disponible — Media
8. Aviso antes del cobro del trial — Alta
9. Te extrañamos (3 días sin entrar) — Baja
10. Logro alcanzado (7/30/100 días) — Baja

---

## Cierre

Al terminar: verificación de compilación, revisión visual a 375px de cada pantalla nueva y reporte de cierre en ESTADO.md.
