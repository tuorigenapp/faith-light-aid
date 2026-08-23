REVOKE ALL ON FUNCTION public.guard_profile_columns() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_profile_columns() TO service_role;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
REVOKE ALL ON FUNCTION public.award_gems(integer, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_hoja_transfer(text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;