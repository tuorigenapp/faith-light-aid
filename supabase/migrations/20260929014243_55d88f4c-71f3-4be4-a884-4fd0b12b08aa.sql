revoke all on function public.resolve_marketing_audience(text, uuid) from public, anon, authenticated;
grant execute on function public.resolve_marketing_audience(text, uuid) to service_role;