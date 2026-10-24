<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Hojas de Sanación use PayPal Checkout for payment and manual receipt review for crediting; this prevents unverified browser payment data from changing balances.
- Admin AI generation uses server-only streamed Responses with request-local gateway correlation and sequential batches; this prevents unsupported models and concurrent quota overload.
- All community automation checks the same persisted master switch before writing; this makes a pause apply to both posts and replies.
- Panel-created caminos are rendered by the fixed CAMINO ORÍGEN routes via `useCamino` + `customToCamino` (content.etapas, 8 days); this keeps one design for every camino.
- Content ids/slugs are clean title slugs with -2, -3 suffixes on collision; random suffixes made URLs unreadable.
- AI and email calls are recorded in `usage_log` and admin-entered balances in `admin_settings`; the app cannot read the workspace credit balance directly.
- User-facing consultas (ministración, pareja, patrones, panel consultas) run on the local `origen-engine.server.ts` composer + Cerebro ORÍGEN, logging to `assistant_events`; this keeps them free of AI credits at any user volume.
- Public sales funnel (/empezar) keeps Hotmart links per level×cadence in one table and shows local currency as an approximation; Hotmart is the source of truth for the charged amount.
- ORÍGEN-authored spiritual text uses the shared Christian-language policy before display or storage, including study excerpts and consultation outputs; this prevents incompatible source material from bypassing the same rules.
- Typography-only global selectors never set text color; image-cover titles must inherit their surface foreground in both themes.
- Membership selections use semantic Button variants with theme-specific surface, border, foreground and shadow tokens; this keeps selected states distinguishable from their parent surface.
- Funnel visual sets share response-based cycling with browser-only hydration and paired comparison indices; this prevents immediate image repeats and keeps both comparison sides aligned.
- The funnel impact index is a display-only illustration tied to the hydrated result variation, never a clinical score or promised outcome; this keeps variation honest without inventing a diagnostic calculation.
- Home and game listings reuse GameCard with natural image sizing and no overlays; this keeps every game cover complete and consistent.
- Funnel library previews derive their count from EBOOKS and use managed cover pointers without download links; this keeps the public preview synchronized without granting access to paid files.
- Generated human portraits used in public stories must be explicitly illustrative, never verified customer identities; this avoids attributing invented endorsements to real people.
- Mensajes ORÍGEN are generated from a pure daily schedule (one message per assistant per day) and check-ins persist in `daily_activity` (`mensaje_checkin`); this keeps them free of AI credits and testable.
- Every downloadable PDF uses the shared `pdf-brand` header and closing promo (book + subscription or affiliate CTA by plan); this keeps branding identical across documents.
- Journey screens use the browser-hydrated seasonal picker with separate exercise and journey image pools; this avoids hydration mismatches and cross-section background collisions.
- Layout and profile queries sharing the profile cache key always select the complete profile row; this prevents missing completion state from reopening registration.
- Audio upload and audio publication are separate operations, with explicit completion/error reporting and awaited writes; AI content enrichment never blocks saving a valid audio.
- Browser push activation is confirmed only after the subscription and preference persist; internal popups cannot enable external push delivery.
- Web Push delivery validates browser push-service hosts on the client and again before server fetch, with redirects forbidden; this prevents stored endpoints from targeting private services.
- Exploration cards share one asset catalog between Home and Explore; this prevents stale covers in one entry point.
- Playlist placeholders come from unassigned day indices in the shared slot helper without truncating real tracks; this prevents repeated day labels when uploads have gaps.
- Updating a music category cover synchronizes its page cover variants while preserving its lesson text; this prevents older art from persisting inside a refreshed category.
