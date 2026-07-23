
## Etapa 2 — Aplicar identidad "Amanecer ORIGEN" a toda la app + nuevas funciones

Aplico la dirección visual aprobada (`/estilos`) a toda la app y agrego lo pedido, sin popups de gemas, sin mencionar IA (siempre "la mentora Ruth Esther / el método ORIGEN") y respetando el gating de planes.

### A. Identidad visual global (aplicar tokens actuales)
- Reescribo Landing (`/`), Auth, Onboarding, Home, Chat, Etapas, Diario, Árbol, Patrones, Visualiza, Premios, Perfil con: `bg-aura`, `hero-card`, `btn-primary-gradient`, radios 20/14/12, Sora+Manrope, degradé marca en CTAs, blobs vivos, checks verdes, racha rosa. Mobile-first 375px, desktop centrado max 1100px.
- Bottom-nav renovado (5 destinos, activo morado): Inicio · Camino · Mentora · Vívelo · Yo.

### B. HOME renovado — 3 pilares al frente
Orden fijo:
1. Header: avatar con inicial + saludo "Hola, {nombre}" + fecha real + chip **Árbol de Sanación** con total de gemas (sin popups).
2. Card héroe: próxima misión del día + CTA degradé.
3. **3 pilares destacados** (cards grandes, imagen + título + CTA):
   - 💬 **Conversa con Ruth Esther** (Mentora) — pilar 1
   - 💞 **¿Tu pareja es Deuda Ancestral o Propósito?** (nuevo) — pilar 2
   - 🌳 **Encuentra tu patrón familiar** — pilar 3
4. Racha (7 puntos) + progreso de etapa actual.
5. **Árbol de Sanación diario**: card animada con árbol/corazón; al tocar "Agitar árbol" da 10-30💎 gratis (1 vez/día real, guardado en `daily_activity`).
6. **Descubre hoy**: sección con secciones bloqueadas 🔒 (Visualiza avanzado, Meditaciones, Círculo de mujeres, etc.) y desbloqueadas atractivas — antojo controlado.
7. **Invita y gana** (afiliados): card educada, no presiva.
8. Devocional del día + versículo.

### C. Nueva sección: "¿Tu pareja es Deuda Ancestral o Propósito?"
Ruta `/pareja`. Flujo 3 pasos:
1. Formulario: tu nombre + fecha de nacimiento, nombre pareja + fecha de nacimiento, pregunta abierta corta.
2. Animación de dos corazones entrelazándose (8-10s).
3. Resultado en tarjeta: veredicto (Propósito / Deuda ancestral / Aprendizaje kármico traducido a "lección de alma"), qué observamos, patrón, lo que Ruth Esther aconseja, próximo paso.
Backend: endpoint `src/routes/api/pareja.ts` que arma prompt con datos + book-context + numerología suave de fechas; llama a Lovable AI Gateway con **`google/gemini-3.1-pro-preview`** para respuestas más humanas. Guarda en tabla `pareja_lecturas`. Nunca menciona IA; firma "análisis del método ORIGEN — Ruth Esther Paredes Sufrán".

### D. Árbol de Sanación (reemplaza narrativa de "gemas")
- Renombro en UI toda mención a "gemas" → **"hojas de sanación 🍃"** (mantenemos columna DB `gems` internamente).
- Card en HOME con árbol SVG animado + botón "Agitar hoy" → +10-30 hojas aleatorio (1/día, `daily_activity.action='shake_tree'`).
- Corazón latiendo secundario (en `/arbol` genealógico): agitar = +5 hojas (cooldown 6h).
- Sin toasts al ganar; solo se actualiza el número del header con transición.

### E. Afiliados
Ruta `/invita`. Copy educado y motivador ("Si alguien que amas está atravesando lo mismo…"). Genera código único por usuario (nueva tabla `referrals` con `code`, `owner_id`, `invited_email`, `status`, `reward_paid`). Muestra: enlace copiable, mensaje sugerido para WhatsApp, "ganas 20% del primer mes" + panel de invitados/estado. Sin presión, opt-in.

### F. Gating por plan (respetar a toda costa)
Middleware simple `usePlan()`:
- **Explorador (free)**: 1 conversación/día con mentora, 1 lectura de pareja/mes, 1 análisis de patrón/mes, etapa 1 completa, resto 🔒.
- **Camino ORIGEN (premium)**: chat ilimitado, lecturas ilimitadas, todas las etapas, todo Vívelo, afiliados avanzados.
- Contador diario en `daily_activity` (`action='chat_message'`). Al llegar al límite: card elegante "Volvió mañana a las HH:MM" + CTA "Desbloquea ahora" al paywall — nunca popup.
- Secciones bloqueadas se ven con overlay difuminado + 🔒 + "Desbloquea con Camino ORIGEN".

### G. Chat mentora — mantener siempre visible
- Botón flotante inferior derecha (56px, degradé, glow) presente en TODA la app excepto durante onboarding y splash. Al tocar → `/chat`.
- Reforzar system prompt: nunca menciona IA/modelo; siempre "Ruth Esther / método ORIGEN". Fuente = libro. Toca respetar límite diario (contador incrementa por mensaje del usuario).

### H. Quizzes / micro-desafíos únicos (diferenciación)
Añado en Home rotativo "Reflexión del día" (1 pregunta, 3 opciones, respuesta amable de la mentora + 5🍃). Guardado en `daily_activity`.

### I. Base de datos (migraciones nuevas)
```sql
create table public.pareja_lecturas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  self_name text, self_dob date,
  partner_name text, partner_dob date,
  question text,
  verdict text,       -- 'proposito' | 'deuda' | 'leccion'
  summary text,
  pattern text,
  advice text,
  next_step text,
  created_at timestamptz default now()
);
-- grants + RLS (owner-only) + policies

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  code text unique not null,
  invited_email text,
  status text default 'pending', -- pending|joined|paid
  reward_gems int default 0,
  created_at timestamptz default now()
);
-- grants + RLS + policies

create table public.daily_reflections (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  question text not null,
  options jsonb not null,     -- [{key,label,response}]
  created_at timestamptz default now()
);
grant select on public.daily_reflections to authenticated, anon;
alter table public.daily_reflections enable row level security;
create policy "public read" on public.daily_reflections for select using (true);
-- seed 30 días
```
- Extender `daily_activity` para acciones: `shake_tree`, `chat_message`, `pareja_read`, `patron_read`, `reflection_done` (usar columna existente).
- Añadir `profiles.referral_code` (texto único) generado en signup.

### J. Endpoints
- `src/routes/api/pareja.ts`: server route público protegido con auth; usa `google/gemini-3.1-pro-preview`; devuelve JSON estructurado.
- `src/routes/api/chat.ts`: revisar system prompt (nunca IA, siempre Ruth Esther), enforcar límite diario para plan free.
- `src/lib/plan.ts`: helper `getPlan()`, `getRemaining(action)`.

### K. Splash + logo
Ya vivo. Verifico que `SplashScreen` no bloquee rutas protegidas.

### L. Reglas transversales
- Cero popups por gemas/hojas.
- Cero mención de IA en UI/copy.
- Todas las secciones bloqueadas con 🔒 y CTA a paywall.
- Nombre del usuario visible en header y saludo, siempre.
- Botón chat mentora flotante siempre visible en app.

### Detalles técnicos
- Modelo IA: `google/gemini-3.1-pro-preview` para pareja y patrones (más humano y matizado); mentora en chat mantiene `openai/gpt-5.5`.
- Sin cambios en Splash ni en `/estilos`.
- Todo mobile-first 375px con desktop max-w 1100px.

Aprueba y ejecuto todo en la próxima generación.
