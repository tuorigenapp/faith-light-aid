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
