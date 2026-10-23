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
